// Action plan: owned, dated actions with dependencies, status, measurable success indicators and links back to the
// findings and recommendations they implement. Date and dependency rules are ported from the Phase 0 critic (L1).
import { z } from "zod";
import { same, type Finding } from "./common";

export type ActionStatus = "not_started" | "in_progress" | "done" | "blocked";
export const STATUSES: ActionStatus[] = ["not_started", "in_progress", "done", "blocked"];
export type LinkKind = "goal" | "root_cause" | "likely_cause" | "implication" | "initiative" | "framework";
export interface Link { kind: LinkKind; ref: string; label: string }
export interface Action { id: string; title: string; owner: string; start: string; due: string; status: ActionStatus; dependsOn: string[]; deliverable: string; links: Link[] }
export interface Indicator { id: string; name: string; baseline: string; target: string; by: string }
export interface Plan { objective: string; deadline: string; indicators: Indicator[]; actions: Action[] }

const link = z.object({ kind: z.enum(["goal", "root_cause", "likely_cause", "implication", "initiative", "framework"]), ref: z.string().max(80), label: z.string().max(500) });
export const planSchema = z.object({
  objective: z.string().max(1000), deadline: z.string().max(20),
  indicators: z.array(z.object({ id: z.string(), name: z.string().max(300), baseline: z.string().max(100), target: z.string().max(100), by: z.string().max(20) })).max(20),
  actions: z.array(z.object({ id: z.string(), title: z.string().max(300), owner: z.string().max(120), start: z.string().max(20), due: z.string().max(20), status: z.enum(["not_started", "in_progress", "done", "blocked"]), dependsOn: z.array(z.string()).max(20), deliverable: z.string().max(500), links: z.array(link).max(20) })).max(100),
});
export const emptyPlan = (objective = "", deadline = ""): Plan => ({ objective, deadline, indicators: [], actions: [] });

function hasCycle(actions: Action[]): string | null {
  const g = new Map(actions.map((a) => [a.id, a.dependsOn]));
  const state = new Map<string, 1 | 2>();
  const dfs = (v: string): boolean => {
    state.set(v, 1);
    for (const w of g.get(v) ?? []) { if (state.get(w) === 1) return true; if (!state.get(w) && g.has(w) && dfs(w)) return true; }
    state.set(v, 2);
    return false;
  };
  for (const a of actions) if (!state.get(a.id) && dfs(a.id)) return a.id;
  return null;
}

export function checkPlan(x: Plan, today = new Date().toISOString().slice(0, 10)): Finding[] {
  const out: Finding[] = [];
  const actions = x.actions.filter((a) => a.title.trim());
  if (!x.objective.trim()) out.push({ code: "no_objective", severity: "high" });
  if (!actions.length) out.push({ code: "no_actions", severity: "medium" });
  const inds = x.indicators.filter((i) => i.name.trim());
  if (!inds.length) out.push({ code: "no_indicators", severity: "high" });
  for (const i of inds) if (!i.target.trim()) out.push({ code: "indicator_no_target", severity: "medium", target: i.id });
  for (const i of inds) if (i.target.trim() && !i.baseline.trim()) out.push({ code: "indicator_no_baseline", severity: "low", target: i.id });
  const by = new Map(actions.map((a) => [a.id, a]));
  for (const a of actions) {
    if (!a.owner.trim()) out.push({ code: "no_owner", severity: "high", target: a.id });
    if (!a.due) out.push({ code: "no_due", severity: "medium", target: a.id });
    if (a.start && a.due && a.due < a.start) out.push({ code: "date_order", severity: "high", target: a.id });
    if (x.deadline && a.due && a.due > x.deadline) out.push({ code: "after_deadline", severity: "high", target: a.id });
    if (a.due && a.due < today && a.status !== "done") out.push({ code: "overdue", severity: "medium", target: a.id });
    for (const d of a.dependsOn) {
      const p = by.get(d);
      if (!p) out.push({ code: "dependency_missing", severity: "high", target: a.id });
      else if (p.due && a.start && a.start < p.due) out.push({ code: "dependency_order", severity: "high", target: a.id, params: { other: p.title } });
      else if (a.status === "done" && p.status !== "done") out.push({ code: "done_before_dependency", severity: "medium", target: a.id, params: { other: p.title } });
    }
    if (a.status === "blocked" && !a.dependsOn.length) out.push({ code: "blocked_no_reason", severity: "low", target: a.id });
    if (!a.links.length) out.push({ code: "unlinked", severity: "low", target: a.id });
  }
  const cyc = hasCycle(actions);
  if (cyc) out.push({ code: "cycle", severity: "high", target: cyc });
  const owners = actions.map((a) => a.owner.trim()).filter(Boolean);
  if (actions.length >= 4) {
    const counts = owners.reduce<Record<string, number>>((m, o) => ((m[o] = (m[o] ?? 0) + 1), m), {});
    const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
    if (n / actions.length > 0.6) out.push({ code: "owner_overload", severity: "low", params: { owner: top, n } });
  }
  for (let a = 0; a < actions.length; a++) for (let b = a + 1; b < actions.length; b++) if (same(actions[a]!.title, actions[b]!.title)) out.push({ code: "duplicate", severity: "low", target: actions[b]!.id });
  return out;
}

/** Plan progress: share of actions done, and whether the plan is on track against today. */
export function progress(x: Plan) {
  const actions = x.actions.filter((a) => a.title.trim());
  const done = actions.filter((a) => a.status === "done").length;
  return { total: actions.length, done, pct: actions.length ? done / actions.length : 0 };
}
