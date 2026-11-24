// Explainable recommendations: turns the engine's features into reason codes the UI renders in either language.
// Reasons are derived only from the engine's own inputs and scores, never invented.
import * as C from "./catalogue";
import type { Recommendation } from "./recommender";
import { readiness } from "./recommender";
import type { ApproachId, Slots } from "./types";

export type ReasonKind = "fit" | "caution" | "against";
export interface Reason { kind: ReasonKind; code: string; params?: Record<string, string> }
export type FitLevel = "strong" | "good" | "moderate" | "weak";

export const fitLevel = (score: number): FitLevel => (score >= 0.7 ? "strong" : score >= 0.55 ? "good" : score >= 0.45 ? "moderate" : "weak");

function stageReason(a: ApproachId, s: Slots): Reason | null {
  const p = s.stage.primary;
  if (!p) return null;
  const v = C.STAGE_FIT[a][p] ?? 0;
  if (v >= 0.6) return { kind: "fit", code: "stage.strong", params: { stage: p } };
  if (v >= 0.3) return { kind: "caution", code: "stage.partial", params: { stage: p } };
  const q = s.stage.secondary;
  if (q && (C.STAGE_FIT[a][q] ?? 0) >= 0.6) return { kind: "fit", code: "stage.secondary", params: { stage: q } };
  return { kind: "against", code: "stage.weak", params: { stage: p } };
}
function domainReason(a: ApproachId, s: Slots): Reason | null {
  const d = s.domains[0];
  if (!d) return null;
  const v = C.DOMAIN_AFFINITY[a][d] ?? 0;
  if (v >= 0.6) return { kind: "fit", code: "domain.strong", params: { domain: d } };
  if (v >= 0.3) return { kind: "caution", code: "domain.partial", params: { domain: d } };
  const other = s.domains.slice(1, 3).find((x) => (C.DOMAIN_AFFINITY[a][x] ?? 0) >= 0.6);
  if (other) return { kind: "fit", code: "domain.secondary", params: { domain: other } };
  return { kind: "against", code: "domain.weak", params: { domain: d } };
}

/** Why an approach is recommended (fit reasons first, then cautions). */
export function whyRecommended(a: ApproachId, s: Slots): Reason[] {
  const out: Reason[] = [];
  const st = stageReason(a, s), dm = domainReason(a, s);
  if (C.discriminator(a, s)) out.push({ kind: "fit", code: `disc.${a}` });
  if (st) out.push(st);
  if (dm) out.push(dm);
  if (C.signalBoost(a, s) > 0) out.push({ kind: "fit", code: `sig.${a}` });
  const { unmet, unmetSeverity } = readiness(a, s);
  for (const slot of unmet) out.push({ kind: "caution", code: `pre.${slot}`, params: { severity: unmetSeverity[slot] ?? "important" } });
  if (C.contra(a, s)) out.push({ kind: "caution", code: `contra.${a}` });
  const order: Record<ReasonKind, number> = { fit: 0, caution: 1, against: 2 };
  return out.sort((x, y) => order[x.kind] - order[y.kind]);
}

/** Why an approach was NOT recommended (at most two reasons, most decisive first). */
export function whyNot(a: ApproachId, s: Slots, rec: Recommendation): Reason[] {
  const blocked = rec.blocked.find((b) => b.id === a);
  if (blocked) return blocked.unmet.map((slot) => ({ kind: "against", code: `blocked.${slot}` }));
  const out: Reason[] = [];
  if (C.contra(a, s)) out.push({ kind: "against", code: `contra.${a}` });
  const st = stageReason(a, s), dm = domainReason(a, s);
  if (st?.kind === "against") out.push(st);
  if (dm?.kind === "against") out.push(dm);
  const shown = rec.ranked.slice(0, 3);
  const r = rec.ranked.find((x) => x.id === a);
  const lowest = shown[shown.length - 1];
  if (r && lowest && r.score > lowest.score && shown.filter((x) => x.family === r.family).length >= 2) out.push({ kind: "against", code: "diversity" });
  if (!r) out.push({ kind: "against", code: "cutoff" });
  if (!out.length) out.push({ kind: "against", code: "lower" });
  return out.slice(0, 2);
}

export type MissingKey = "symptom" | "stage" | "domain" | "scope" | "goal" | "impact" | "stakeholders" | "constraints";
/** What the user could add to reach a definitive recommendation (largest contribution first). */
export function missingInformation(rec: Recommendation, s: Slots): { core: MissingKey[]; preconditions: { id: ApproachId; slot: string }[] } {
  const suff = rec.sufficiency;
  const core = suff
    ? (Object.entries(suff.weights) as [MissingKey, number][])
        .map(([k, w]) => [k, w * (1 - (suff.fill[k] ?? 0))] as const)
        .filter(([, gap]) => gap > 0.001)
        .sort((a, b) => b[1] - a[1])
        .map(([k]) => k)
    : [];
  const preconditions = rec.ranked.slice(0, 3).flatMap((r) => (r.features.R < 0.75 ? readiness(r.id, s).unmet.map((slot) => ({ id: r.id, slot })) : []));
  return { core, preconditions };
}
