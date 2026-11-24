// Cause-and-effect (fishbone): configurable categories, causes and sub-causes with truth status and a "likely" flag.
import { z } from "zod";
import { MISSING_SOLUTION, hasCue, same, truthSchema, words, type Finding, type Truth } from "./common";

export type PresetCategory = "people" | "process" | "technology" | "policy" | "measurement" | "environment" | "materials" | "machines" | "suppliers" | "customers";
export const CATEGORY_SETS: Record<"service" | "operations" | "commercial", PresetCategory[]> = {
  service: ["people", "process", "technology", "policy", "measurement", "environment"],
  operations: ["people", "process", "machines", "materials", "measurement", "environment"],
  commercial: ["customers", "people", "process", "technology", "suppliers", "policy"],
};
export interface Category { id: string; preset: PresetCategory | null; name: string }
export interface Cause { id: string; categoryId: string; parentId: string | null; text: string; truth: Truth; likely: boolean; evidence: string }
export interface Fishbone { effect: string; categories: Category[]; causes: Cause[] }

export const fishboneSchema = z.object({
  effect: z.string().max(1000),
  categories: z.array(z.object({ id: z.string(), preset: z.enum(["people", "process", "technology", "policy", "measurement", "environment", "materials", "machines", "suppliers", "customers"]).nullable(), name: z.string().max(120) })).max(10),
  causes: z.array(z.object({ id: z.string(), categoryId: z.string(), parentId: z.string().nullable(), text: z.string().max(500), truth: truthSchema, likely: z.boolean(), evidence: z.string().max(1000) })).max(150),
});
export const emptyFishbone = (effect = "", set: keyof typeof CATEGORY_SETS = "service"): Fishbone => ({
  effect, causes: [], categories: CATEGORY_SETS[set].map((p, i) => ({ id: `cat_${i}_${p}`, preset: p, name: "" })),
});

export function checkFishbone(x: Fishbone): Finding[] {
  const out: Finding[] = [];
  if (!x.effect.trim()) out.push({ code: "no_effect", severity: "high" });
  else if (words(x.effect) < 4) out.push({ code: "effect_vague", severity: "low" });
  const causes = x.causes.filter((c) => c.text.trim() && x.categories.some((k) => k.id === c.categoryId));
  if (x.categories.length < 3) out.push({ code: "few_categories", severity: "low" });
  for (const k of x.categories) if (!causes.some((c) => c.categoryId === k.id)) out.push({ code: "empty_category", severity: "low", target: k.id });
  if (x.effect.trim() && causes.length < 5) out.push({ code: "few_causes", severity: "medium", params: { n: causes.length } });
  const likely = causes.filter((c) => c.likely);
  if (causes.length >= 5 && likely.length === 0) out.push({ code: "no_likely", severity: "medium" });
  if (causes.length >= 5 && likely.length / causes.length > 0.4) out.push({ code: "too_many_likely", severity: "low" });
  for (const c of likely) if (c.truth !== "verified") out.push({ code: "likely_unverified", severity: "medium", target: c.id });
  for (const c of causes) {
    if (hasCue(c.text, MISSING_SOLUTION)) out.push({ code: "missing_solution", severity: "low", target: c.id });
    if (c.truth === "verified" && !c.evidence.trim()) out.push({ code: "verified_no_evidence", severity: "low", target: c.id });
  }
  for (let a = 0; a < causes.length; a++) for (let b = a + 1; b < causes.length; b++) if (same(causes[a]!.text, causes[b]!.text)) out.push({ code: "duplicate", severity: "low", target: causes[b]!.id });
  return out;
}
