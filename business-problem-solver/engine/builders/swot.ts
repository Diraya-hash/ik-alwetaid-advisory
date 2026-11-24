// SWOT with evidence, importance and TOWS-style strategic implications linked to the findings they rely on.
import { z } from "zod";
import { hasCue, isVague, same, truthSchema, type Finding, type Truth } from "./common";

export type Quadrant = "s" | "w" | "o" | "t";
export const QUADRANTS: Quadrant[] = ["s", "w", "o", "t"];
export type ImplicationType = "SO" | "WO" | "ST" | "WT";
export const IMPLICATION_TYPES: ImplicationType[] = ["SO", "WO", "ST", "WT"];

export interface SwotItem { id: string; text: string; truth: Truth; importance: 1 | 2 | 3; evidence: string }
export interface Implication { id: string; type: ImplicationType; text: string; links: string[] }
export interface Swot { s: SwotItem[]; w: SwotItem[]; o: SwotItem[]; t: SwotItem[]; implications: Implication[] }

const item = z.object({ id: z.string(), text: z.string().max(1000), truth: truthSchema, importance: z.union([z.literal(1), z.literal(2), z.literal(3)]), evidence: z.string().max(1000) });
export const swotSchema = z.object({
  s: z.array(item).max(60), w: z.array(item).max(60), o: z.array(item).max(60), t: z.array(item).max(60),
  implications: z.array(z.object({ id: z.string(), type: z.enum(["SO", "WO", "ST", "WT"]), text: z.string().max(1000), links: z.array(z.string()).max(30) })).max(40),
});
export const emptySwot = (): Swot => ({ s: [], w: [], o: [], t: [], implications: [] });

/** Which quadrants each implication type must draw on. */
export const IMPLICATION_NEEDS: Record<ImplicationType, [Quadrant, Quadrant]> = { SO: ["s", "o"], WO: ["w", "o"], ST: ["s", "t"], WT: ["w", "t"] };

const EXTERNAL = ["market", "competitor", "competition", "regulation", "regulator", "economy", "economic", "government", "trend", "customer demand", "new entrant", "inflation", "law ",
  "السوق", "المنافس", "المنافسين", "المنافسه", "الانظمه", "الجهات التنظيميه", "الاقتصاد", "الحكومه", "الاتجاهات", "التضخم", "طلب العملاء"];
const INTERNAL = ["our team", "our staff", "our process", "our system", "we have", "our people", "our employees", "our culture", "our brand", "in-house", "our own",
  "فريقنا", "موظفينا", "موظفونا", "نظامنا", "انظمتنا", "لدينا", "عملياتنا", "ثقافتنا", "علامتنا"];

export function checkSwot(x: Swot): Finding[] {
  const out: Finding[] = [];
  const all = QUADRANTS.flatMap((q) => x[q].filter((i) => i.text.trim()).map((i) => ({ q, i })));
  for (const q of QUADRANTS) {
    const n = x[q].filter((i) => i.text.trim()).length;
    if (n === 0) out.push({ code: "quadrant_empty", severity: "medium", params: { q } });
    else if (n === 1) out.push({ code: "quadrant_thin", severity: "low", params: { q } });
  }
  for (const { q, i } of all) {
    if (isVague(i.text)) out.push({ code: "vague", severity: "medium", target: i.id });
    if ((q === "s" || q === "w") && hasCue(i.text, EXTERNAL) && !hasCue(i.text, INTERNAL)) out.push({ code: "looks_external", severity: "medium", target: i.id });
    if ((q === "o" || q === "t") && hasCue(i.text, INTERNAL) && !hasCue(i.text, EXTERNAL)) out.push({ code: "looks_internal", severity: "medium", target: i.id });
    if (i.truth === "verified" && !i.evidence.trim()) out.push({ code: "verified_no_evidence", severity: "low", target: i.id });
  }
  for (let a = 0; a < all.length; a++) for (let b = a + 1; b < all.length; b++) {
    const A = all[a]!, B = all[b]!;
    if (same(A.i.text, B.i.text)) out.push({ code: A.q === B.q ? "duplicate" : "duplicate_across", severity: A.q === B.q ? "low" : "high", target: B.i.id });
  }
  const assumptions = all.filter(({ i }) => i.truth === "assumption").length;
  if (all.length >= 4 && assumptions / all.length > 0.5) out.push({ code: "assumption_heavy", severity: "low" });
  const imps = x.implications.filter((m) => m.text.trim());
  if (all.length >= 4 && imps.length === 0) out.push({ code: "no_implications", severity: "high" });
  const quadOf = new Map(all.map(({ q, i }) => [i.id, q] as const));
  for (const m of imps) {
    const linked = m.links.filter((id) => quadOf.has(id));
    if (!linked.length) { out.push({ code: "implication_unlinked", severity: "medium", target: m.id }); continue; }
    const [qa, qb] = IMPLICATION_NEEDS[m.type];
    const qs = new Set(linked.map((id) => quadOf.get(id)));
    if (!qs.has(qa) || !qs.has(qb)) out.push({ code: "implication_mismatch", severity: "medium", target: m.id, params: { type: m.type } });
    const weak = linked.every((id) => all.find((e) => e.i.id === id)?.i.truth === "assumption");
    if (weak) out.push({ code: "implication_on_assumptions", severity: "medium", target: m.id });
  }
  const used = new Set(imps.flatMap((m) => m.links));
  for (const { i } of all) if (i.importance === 3 && imps.length > 0 && !used.has(i.id)) out.push({ code: "important_unused", severity: "low", target: i.id });
  return out;
}
