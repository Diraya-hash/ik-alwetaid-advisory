// Shared building blocks for the framework builders: items with truth status, critic findings, text heuristics.
import { z } from "zod";
import type { Truth } from "../intake";
import { normalise } from "../intake";

export type Severity = "high" | "medium" | "low";
/** A critic finding. `code` maps to bilingual text in i18n (critic.<builder>.<code>); `target` is an item id. */
export interface Finding { code: string; severity: Severity; target?: string; params?: Record<string, string | number> }

export const truthSchema = z.enum(["verified", "unverified", "assumption"]);
export const TRUTH_RANK: Record<Truth, number> = { assumption: 0, unverified: 1, verified: 2 };
/** The weakest truth status in a chain: a conclusion is never stronger than its weakest step. */
export const weakest = (ts: Truth[]): Truth => ts.reduce<Truth>((w, t) => (TRUTH_RANK[t] < TRUTH_RANK[w] ? t : w), "verified");

export const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
export const same = (a: string, b: string) => normalise(a).replace(/[^\p{L}\p{N}]+/gu, " ").trim() === normalise(b).replace(/[^\p{L}\p{N}]+/gu, " ").trim();
export const hasCue = (text: string, cues: string[]) => { const t = ` ${normalise(text)} `; return cues.some((c) => t.includes(normalise(c))); };
export const hasNumber = (s: string) => /[\d٠-٩]/.test(s);

/** Words that, used alone, make an entry too vague to act on. */
export const VAGUE = ["good", "bad", "poor", "issues", "problems", "people", "communication", "processes", "culture", "management", "quality", "systems", "technology", "staff",
  "جيد", "سيء", "ضعيف", "مشاكل", "مشكلات", "الناس", "التواصل", "العمليات", "الثقافه", "الاداره", "الجوده", "الانظمه", "التقنيه", "الموظفين"];
/** An entry is vague if it is very short, or consists only of generic words. */
export function isVague(text: string): boolean {
  const n = normalise(text).replace(/[^\p{L}\p{N}\s]+/gu, " ").trim();
  if (!n) return false;
  const ws = n.split(/\s+/).filter((w) => !["the", "a", "an", "our", "of", "and", "ال", "و"].includes(w));
  if (ws.length <= 1 && !hasNumber(n)) return true;
  return ws.every((w) => VAGUE.map(normalise).includes(w) || VAGUE.map(normalise).includes(w.replace(/^ال/, "")));
}

/** Blaming a person rather than the system that allowed the failure. */
export const BLAME = ["careless", "lazy", "incompetent", "human error", "didn't care", "did not care", "not paying attention", "stupid", "negligent", "lack of effort",
  "اهمال", "مهمل", "كسل", "كسول", "خطا بشري", "عدم اكتراث", "تقصير", "لا يهتم", "عدم الاهتمام"];
/** A cause phrased as a missing solution ("lack of training"). */
export const MISSING_SOLUTION = ["lack of", "no ", "not enough", "insufficient", "absence of", "need more", "عدم وجود", "نقص", "قله", "غياب", "لا يوجد", "عدم توفر"];

export const newItemId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
export type { Truth };
