// Impact / effort matrix: 1–5 assessments with rationale; quadrant and priority are computed, never typed.
import { z } from "zod";
import { hasCue, same, truthSchema, type Finding, type Truth } from "./common";

export interface Initiative { id: string; title: string; impact: number; effort: number; impactWhy: string; effortWhy: string; truth: Truth }
export interface Matrix { items: Initiative[] }
export type MatrixQuadrant = "quick_win" | "strategic" | "fill_in" | "deprioritise";

export const matrixSchema = z.object({
  items: z.array(z.object({ id: z.string(), title: z.string().max(300), impact: z.number().int().min(1).max(5), effort: z.number().int().min(1).max(5), impactWhy: z.string().max(1000), effortWhy: z.string().max(1000), truth: truthSchema })).max(60),
});
export const emptyMatrix = (): Matrix => ({ items: [] });

/** Midpoint rule: impact 4–5 is high; effort 1–2 is low. A 3 counts against the item (conservative), so nothing is called a quick win on a "medium" score. */
export function quadrant(i: Pick<Initiative, "impact" | "effort">): MatrixQuadrant {
  const hi = i.impact >= 4, lo = i.effort <= 2;
  return hi && lo ? "quick_win" : hi ? "strategic" : lo ? "fill_in" : "deprioritise";
}
const ORDER: MatrixQuadrant[] = ["quick_win", "strategic", "fill_in", "deprioritise"];
/** Priority order: quadrant first, then value for effort (impact − effort), then impact. */
export function prioritise(items: Initiative[]): Initiative[] {
  return [...items].filter((i) => i.title.trim()).sort((a, b) => ORDER.indexOf(quadrant(a)) - ORDER.indexOf(quadrant(b)) || (b.impact - b.effort) - (a.impact - a.effort) || b.impact - a.impact);
}

const THREAT = ["risk", "threat", "breach", "failure", "outage", "penalty", "fine", "مخاطر", "خطر", "تهديد", "اختراق", "انقطاع", "غرامه", "عقوبه"];

export function checkMatrix(x: Matrix, opts: { itemsAreThreats?: boolean } = {}): Finding[] {
  const out: Finding[] = [];
  const items = x.items.filter((i) => i.title.trim());
  if (items.length < 4) out.push({ code: "too_few", severity: "medium", params: { n: items.length } });
  for (const i of items) {
    if ((i.impact >= 4 || i.impact <= 2) && !i.impactWhy.trim()) out.push({ code: "impact_no_rationale", severity: "medium", target: i.id });
    if ((i.effort <= 2 || i.effort >= 4) && !i.effortWhy.trim()) out.push({ code: "effort_no_rationale", severity: "medium", target: i.id });
    if (quadrant(i) === "quick_win" && i.truth === "assumption") out.push({ code: "quick_win_assumed", severity: "low", target: i.id });
    if (hasCue(i.title, THREAT)) out.push({ code: "looks_like_threat", severity: "low", target: i.id });
  }
  for (let a = 0; a < items.length; a++) for (let b = a + 1; b < items.length; b++) if (same(items[a]!.title, items[b]!.title)) out.push({ code: "duplicate", severity: "low", target: items[b]!.id });
  if (items.length >= 4) {
    const qs = new Set(items.map(quadrant));
    if (qs.size === 1) out.push({ code: "one_quadrant", severity: "medium" });
    const qw = items.filter((i) => quadrant(i) === "quick_win").length;
    if (qw >= 3 && qw / items.length > 0.5) out.push({ code: "too_many_quick_wins", severity: "medium", params: { n: qw } });
    if (new Set(items.map((i) => `${i.impact}-${i.effort}`)).size === 1) out.push({ code: "not_discriminating", severity: "medium" });
  }
  if (opts.itemsAreThreats) out.push({ code: "threats_use_risk_matrix", severity: "high" });
  return out;
}
