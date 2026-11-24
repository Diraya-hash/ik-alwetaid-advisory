// Business Framework Intelligence: deterministic recommendation engine.
// PORTED from phase0/lib/recommender.mjs (approved rules v0.3b: gate v0.3, display cutoff 0.40, joint-fit check only
// FLAGS a probable No Good Fit). Behaviour is checked against the Phase 0 engine by tests/parity.test.ts.
import * as C from "./catalogue";
import type { ApproachId, Slots, Stage } from "./types";

const SEV = { blocking: 1.0, important: 0.25, nice_to_have: 0.05 } as const;
const DOMAIN_PRIOR = [0.85, 0.6, 0.3];

export interface Features { dom: number; stage: number; R: number; sig: number; disc: number; contra: number }
export interface Ranked { id: ApproachId; family: string; score: number; features: Features; unmet: string[] }
export interface Sufficiency { score: number; fill: Record<string, number>; weights: Record<string, number> }
export type RecStatus = "ok" | "insufficient_context" | "no_good_fit" | "out_of_scope";
export interface Recommendation {
  status: RecStatus;
  ranked: Ranked[];
  sufficiency?: Sufficiency;
  probableNGF?: boolean;
  closest?: ApproachId[];
  /** Approaches dropped in Stage A because a blocking precondition is unmet. */
  blocked: { id: ApproachId; unmet: string[] }[];
}
export interface RecOptions { ngfRule?: "v0.2" | "v0.3" | "v0.3b"; gateRule?: "v0.2" | "v0.3"; displayCutoff?: number }
/** The approved production configuration (doc 14: rules v0.3b). */
export const APPROVED: Required<RecOptions> = { ngfRule: "v0.3b", gateRule: "v0.3", displayCutoff: 0.4 };

function slotValue(s: Slots, slot: string): unknown {
  if (slot === "process_named_or_area") return s.process_boundaries !== null || (s.domains || []).some((d) => d.startsWith("OPS.")) ? true : null;
  if (slot === "goal_or_symptom") return s.goal > 0 || s.symptom === true ? true : null;
  if (slot === "goal") return s.goal > 0 ? true : null;
  if (slot === "symptom") return s.symptom === true ? true : null;
  return (s as unknown as Record<string, unknown>)[slot];
}
function testPre(v: unknown, test: string): boolean {
  if (test === "present") return v !== null && v !== undefined && v !== false;
  if (test === "true") return v === true;
  if (test.startsWith("in:")) return test.slice(3).split(",").includes(v as string);
  if (test.startsWith("min:")) return (((v as number) ?? 0) as number) >= Number(test.slice(4));
  return false;
}

const SYMPTOM_OPTIONAL = new Set<Stage>(["PRIORITISE_DECIDE", "PLAN_EXECUTION", "GENERATE_OPTIONS", "UNDERSTAND_CONTEXT", "DESIGN_ORGANISATION", "MAP_CURRENT_STATE"]);
export function coreSufficiency(s: Slots, gateRule: "v0.2" | "v0.3" = "v0.2"): Sufficiency {
  const W: Record<string, number> = { ...C.CORE_WEIGHTS };
  if (gateRule === "v0.3" && s.stage?.primary && SYMPTOM_OPTIONAL.has(s.stage.primary)) {
    if (s.symptom !== true) delete W.symptom;
    if (!(s.impact > 0)) delete W.impact;
    const tot = Object.values(W).reduce((a, b) => a + b, 0);
    for (const k in W) W[k] = (W[k] ?? 0) / tot;
  }
  const fill: Record<string, number> = {
    symptom: s.symptom === true ? 1 : s.symptom === "vague" ? 0.5 : 0,
    stage: s.stage?.primary ? 1 : 0,
    domain: (s.domains || []).length && !s.domains.includes("X.UNCLEAR") ? 1 : 0,
    scope: s.scope ? 1 : 0,
    goal: s.goal ?? 0,
    impact: s.impact ?? 0,
    stakeholders: (s.stakeholders ?? 0) >= 2 ? 1 : s.stakeholders === 1 ? 0.5 : 0,
    constraints: s.constraints || s.deadline_known ? 1 : 0,
  };
  const score = Object.entries(W).reduce((acc, [k, w]) => acc + w * (fill[k] ?? 0), 0);
  return { score: +score.toFixed(3), fill, weights: W };
}

export function readiness(a: ApproachId, s: Slots): { R: number; unmet: string[]; unmetSeverity: Record<string, string> } {
  let pen = 0;
  const unmet: string[] = [];
  const unmetSeverity: Record<string, string> = {};
  for (const [slot, test, sev] of C.PRECONDITIONS[a] || []) {
    if (!testPre(slotValue(s, slot), test)) { pen += SEV[sev]; unmet.push(slot); unmetSeverity[slot] = sev; }
  }
  return { R: Math.max(0, 1 - pen), unmet, unmetSeverity };
}

export function domainAff(a: ApproachId, s: Slots): number {
  const ds = (s.domains || []).filter((d) => !d.startsWith("X."));
  if (!ds.length) return 0;
  let num = 0, den = 0;
  ds.slice(0, 3).forEach((d, i) => { const p = DOMAIN_PRIOR[i] ?? 0; num += p * (C.DOMAIN_AFFINITY[a][d] || 0); den += p; });
  return num / den;
}
export function stageFit(a: ApproachId, s: Slots): number {
  const p = s.stage?.primary, q = s.stage?.secondary;
  if (!p) return 0;
  return Math.min(1, (C.STAGE_FIT[a][p] || 0) + 0.5 * (q ? C.STAGE_FIT[a][q] || 0 : 0));
}

export function recommend(s: Slots, options: RecOptions = APPROVED): Recommendation {
  const ngfRule = options.ngfRule || "v0.2";
  const gateRule = options.gateRule || "v0.2";
  const cutoff = options.displayCutoff ?? 0;
  const W = C.WEIGHTS;
  if (s.out_of_scope) return { status: "out_of_scope", ranked: [], blocked: [] };
  const suff = coreSufficiency(s, gateRule);
  const all = C.APPROACHES.map((a) => {
    const { R, unmet } = readiness(a, s);
    const f: Features = { dom: domainAff(a, s), stage: stageFit(a, s), R, sig: C.signalBoost(a, s), disc: C.discriminator(a, s), contra: C.contra(a, s) };
    const raw = W.alpha * f.dom + W.beta * f.stage + W.delta * f.R + W.eps * f.sig + W.kappa * f.disc - W.zeta * f.contra;
    return { id: a, family: C.FAMILY[a], score: +(raw / C.MAX_SCORE).toFixed(3), features: f, unmet };
  });
  const blocked = all.filter((x) => x.features.R <= 0).map((x) => ({ id: x.id, unmet: x.unmet }));
  const scored = all.filter((x) => x.features.R > 0).sort((x, y) => y.score - x.score); // Stage A

  // Diversity: at most 2 of the top 3 from the same family
  let ranked: Ranked[] = [];
  for (const c of scored) {
    if (ranked.length < 3 && ranked.filter((r) => r.family === c.family).length >= 2) continue;
    ranked.push(c);
  }
  for (const c of scored) if (!ranked.includes(c)) ranked.push(c);
  ranked = ranked.filter((r, i) => i === 0 || r.score >= cutoff);

  const top3 = ranked.slice(0, 3);
  const gatePass = suff.score >= C.GATE_TAU && top3.some((r) => r.features.R >= 0.75);
  if (!gatePass) return { status: "insufficient_context", sufficiency: suff, ranked, blocked };

  const best = ranked[0]?.score ?? 0;
  let ngf = best < C.NGF_THRESHOLD;
  const primary = (s.domains || [])[0];
  if (!ngf && primary) {
    const covered = C.APPROACHES.some((a) => (C.DOMAIN_AFFINITY[a][primary] || 0) > 0.3);
    if (!covered) ngf = true;
  }
  let probableNGF = false;
  if (!ngf && ngfRule === "v0.3b" && primary) {
    const st = [s.stage?.primary, s.stage?.secondary].filter(Boolean) as Stage[];
    const joint = C.APPROACHES.some((a) => st.some((p) => (C.STAGE_FIT[a][p] || 0) >= 0.6) && (C.DOMAIN_AFFINITY[a][primary] || 0) >= 0.5);
    if (!joint) probableNGF = true;
  }
  if (!ngf && ngfRule === "v0.3" && primary) {
    const p = s.stage?.primary;
    const joint = C.APPROACHES.some((a) => (p ? C.STAGE_FIT[a][p] || 0 : 0) >= 0.6 && (C.DOMAIN_AFFINITY[a][primary] || 0) >= 0.5);
    if (!joint) ngf = true;
  }
  if (ngf) return { status: "no_good_fit", sufficiency: suff, ranked, closest: ranked.slice(0, 2).map((r) => r.id), blocked };
  return { status: "ok", sufficiency: suff, ranked, probableNGF, blocked };
}
