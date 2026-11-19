// Deterministic layer of the recommendation engine (04 §4, §5.2–5.7): gate, Stage A/B scoring,
// discriminators, diversity, No Good Fit. The LLM re-rank (Stage D) is NOT included here.
import * as C from "./catalogue.mjs";

const SEV = { blocking: 1.0, important: 0.25, nice_to_have: 0.05 };
const DOMAIN_PRIOR = [0.85, 0.6, 0.3];

function slotValue(s, slot) {
  if (slot === "process_named_or_area") return s.process_boundaries !== null || (s.domains || []).some(d => d.startsWith("OPS.")) ? true : null;
  if (slot === "goal_or_symptom") return (s.goal > 0 || s.symptom === true) ? true : null;
  if (slot === "goal") return s.goal > 0 ? true : null;
  if (slot === "symptom") return s.symptom === true ? true : (s.symptom === "vague" ? null : null);
  return s[slot];
}
function testPre(v, test) {
  if (test === "present") return v !== null && v !== undefined && v !== false;
  if (test === "true") return v === true;
  if (test.startsWith("in:")) return test.slice(3).split(",").includes(v);
  if (test.startsWith("min:")) return (v ?? 0) >= Number(test.slice(4));
  return false;
}

export function coreSufficiency(s) {
  const W = C.CORE_WEIGHTS;
  const fill = {
    symptom: s.symptom === true ? 1 : s.symptom === "vague" ? 0.5 : 0,
    stage: s.stage?.primary ? 1 : 0,
    domain: (s.domains || []).length && !s.domains.includes("X.UNCLEAR") ? 1 : 0,
    scope: s.scope ? 1 : 0,
    goal: s.goal ?? 0,
    impact: s.impact ?? 0,
    stakeholders: (s.stakeholders ?? 0) >= 2 ? 1 : (s.stakeholders === 1 ? 0.5 : 0),
    constraints: (s.constraints || s.deadline_known) ? 1 : 0,
  };
  const score = Object.entries(W).reduce((acc, [k, w]) => acc + w * fill[k], 0);
  return { score: +score.toFixed(3), fill };
}

export function readiness(a, s) {
  let pen = 0; const unmet = [];
  for (const [slot, test, sev] of C.PRECONDITIONS[a] || []) {
    if (!testPre(slotValue(s, slot), test)) { pen += SEV[sev]; unmet.push(slot); }
  }
  return { R: Math.max(0, 1 - pen), unmet };
}

function domainAff(a, s) {
  const ds = (s.domains || []).filter(d => !d.startsWith("X."));
  if (!ds.length) return 0;
  let num = 0, den = 0;
  ds.slice(0, 3).forEach((d, i) => { const p = DOMAIN_PRIOR[i]; num += p * (C.DOMAIN_AFFINITY[a][d] || 0); den += p; });
  return num / den;
}
function stageFit(a, s) {
  const p = s.stage?.primary, q = s.stage?.secondary;
  if (!p) return 0;
  return Math.min(1, (C.STAGE_FIT[a][p] || 0) + 0.5 * (q ? C.STAGE_FIT[a][q] || 0 : 0));
}

/** options: { ngfRule: 'v0.2' | 'v0.3' } */
export function recommend(s, options = {}) {
  const ngfRule = options.ngfRule || "v0.2";
  const W = C.WEIGHTS;
  if (s.out_of_scope) return { status: "out_of_scope", ranked: [] };
  const suff = coreSufficiency(s);
  const scored = C.APPROACHES.map(a => {
    const { R, unmet } = readiness(a, s);
    const f = { dom: domainAff(a, s), stage: stageFit(a, s), R, sig: C.signalBoost(a, s), disc: C.discriminator(a, s), contra: C.contra(a, s) };
    const raw = W.alpha * f.dom + W.beta * f.stage + W.delta * f.R + W.eps * f.sig + W.kappa * f.disc - W.zeta * f.contra;
    return { id: a, family: C.FAMILY[a], score: +(raw / C.MAX_SCORE).toFixed(3), features: f, unmet };
  }).filter(x => x.features.R > 0) // Stage A: drop approaches with unmet blocking preconditions
    .sort((x, y) => y.score - x.score);

  // Diversity: at most 2 of top 3 from same family
  const ranked = [];
  for (const c of scored) {
    if (ranked.length < 3) {
      const same = ranked.filter(r => r.family === c.family).length;
      if (same >= 2) continue;
    }
    ranked.push(c);
  }
  for (const c of scored) if (!ranked.includes(c)) ranked.push(c);

  const top3 = ranked.slice(0, 3);
  const gatePass = suff.score >= C.GATE_TAU && top3.some(r => r.features.R >= 0.75);
  if (!gatePass) return { status: "insufficient_context", sufficiency: suff, ranked };

  const best = ranked[0]?.score ?? 0;
  let ngf = best < C.NGF_THRESHOLD;
  const primary = (s.domains || [])[0];
  if (!ngf && primary) {
    const covered = C.APPROACHES.some(a => (C.DOMAIN_AFFINITY[a][primary] || 0) > 0.3);
    if (!covered) ngf = true;
  }
  if (!ngf && ngfRule === "v0.3") {
    // Candidate rule (in-sample, proposed after run 1): require JOINT fit — at least one approach with
    // stage fit >= 0.6 AND domain affinity >= 0.5 for the primary stage and primary domain.
    const p = s.stage?.primary;
    const joint = C.APPROACHES.some(a => (C.STAGE_FIT[a][p] || 0) >= 0.6 && (C.DOMAIN_AFFINITY[a][primary] || 0) >= 0.5);
    if (!joint) ngf = true;
  }
  if (ngf) return { status: "no_good_fit", sufficiency: suff, ranked, closest: ranked.slice(0, 2).map(r => r.id) };
  return { status: "ok", sufficiency: suff, ranked };
}
