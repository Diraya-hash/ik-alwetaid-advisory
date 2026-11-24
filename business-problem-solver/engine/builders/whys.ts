// 5 Whys as a branching tree: each node answers "why?" for its parent. A node marked as a root cause is a
// HYPOTHESIS unless every step of its chain is verified: a conclusion is never stronger than its weakest step.
import { z } from "zod";
import { BLAME, hasCue, hasNumber, same, truthSchema, weakest, words, type Finding, type Truth } from "./common";

export interface WhyNode { id: string; parentId: string | null; text: string; truth: Truth; evidence: string; isRoot: boolean; countermeasure: string }
export interface FiveWhys { problem: string; problemTruth: Truth; nodes: WhyNode[] }

export const whysSchema = z.object({
  problem: z.string().max(1000),
  problemTruth: truthSchema,
  nodes: z.array(z.object({ id: z.string(), parentId: z.string().nullable(), text: z.string().max(1000), truth: truthSchema, evidence: z.string().max(1000), isRoot: z.boolean(), countermeasure: z.string().max(1000) })).max(120),
});
export const emptyWhys = (problem = ""): FiveWhys => ({ problem, problemTruth: "unverified", nodes: [] });

export const childrenOf = (x: FiveWhys, id: string | null) => x.nodes.filter((n) => n.parentId === id);
/** Path from the first why down to `id` (inclusive). */
export function chain(x: FiveWhys, id: string): WhyNode[] {
  const by = new Map(x.nodes.map((n) => [n.id, n]));
  const path: WhyNode[] = [];
  let cur = by.get(id);
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) { seen.add(cur.id); path.unshift(cur); cur = cur.parentId ? by.get(cur.parentId) : undefined; }
  return path;
}
export const depth = (x: FiveWhys, id: string) => chain(x, id).length;

export type RootStrength = "supported" | "hypothesis" | "assumed";
/** How strong a root-cause conclusion is, given every step that led to it. */
export function rootStrength(x: FiveWhys, id: string): { strength: RootStrength; weakestStep: number | null } {
  const path = chain(x, id);
  const w = weakest(path.map((n) => n.truth));
  const idx = path.findIndex((n) => n.truth === w);
  return { strength: w === "verified" ? "supported" : w === "unverified" ? "hypothesis" : "assumed", weakestStep: w === "verified" ? null : idx + 1 };
}

export function checkWhys(x: FiveWhys, opts: { causalComplexity?: number | null } = {}): Finding[] {
  const out: Finding[] = [];
  if (!x.problem.trim()) out.push({ code: "no_problem", severity: "high" });
  else if (!hasNumber(x.problem) || words(x.problem) < 5) out.push({ code: "problem_unmeasured", severity: "low" });
  const nodes = x.nodes.filter((n) => n.text.trim());
  if (x.problem.trim() && nodes.length === 0) out.push({ code: "no_whys", severity: "medium" });
  const roots = nodes.filter((n) => n.isRoot);
  if (nodes.length >= 3 && roots.length === 0) out.push({ code: "no_root", severity: "medium" });
  for (const n of nodes) {
    if (hasCue(n.text, BLAME)) out.push({ code: "blames_person", severity: "medium", target: n.id });
    const d = depth(x, n.id);
    if (d > 7) out.push({ code: "too_deep", severity: "low", target: n.id });
    if (n.truth === "verified" && !n.evidence.trim()) out.push({ code: "verified_no_evidence", severity: "low", target: n.id });
    const kids = childrenOf(x, n.id).filter((k) => k.text.trim());
    if (!kids.length && !n.isRoot && d >= 2) out.push({ code: "open_branch", severity: "low", target: n.id });
    if (n.isRoot && kids.length) out.push({ code: "root_has_children", severity: "low", target: n.id });
    const sibs = childrenOf(x, n.parentId).filter((s) => s.id !== n.id && s.text.trim());
    if (sibs.some((s) => same(s.text, n.text) && s.id < n.id)) out.push({ code: "duplicate", severity: "low", target: n.id });
  }
  for (const r of roots) {
    const d = depth(x, r.id);
    if (d < 3) out.push({ code: "stopped_early", severity: "medium", target: r.id, params: { n: d } });
    const s = rootStrength(x, r.id);
    if (s.strength !== "supported") out.push({ code: s.strength === "assumed" ? "root_assumed" : "root_unverified", severity: "high", target: r.id, params: { step: s.weakestStep ?? 0 } });
    if (!r.countermeasure.trim()) out.push({ code: "no_countermeasure", severity: "medium", target: r.id });
  }
  const branches = childrenOf(x, null).filter((n) => n.text.trim()).length;
  if ((opts.causalComplexity ?? 0) >= 3 && branches <= 1 && nodes.length >= 2) out.push({ code: "consider_fishbone", severity: "low" });
  return out;
}
