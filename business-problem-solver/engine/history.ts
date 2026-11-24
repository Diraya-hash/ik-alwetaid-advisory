// Version comparison: flattens a project into labelled records and diffs two versions record by record.
import { BUILDER_KEYS, read, started, type BuilderKey } from "./builders";
import { QUADRANTS } from "./builders/swot";
import type { Project } from "./project";

export type Area = "project" | "intake" | "frameworks" | BuilderKey;
export interface Rec { area: Area; label: string; value: string }
export interface Change { area: Area; kind: "added" | "removed" | "changed"; label: string; before?: string; after?: string }

function records(p: Project): Map<string, Rec> {
  const m = new Map<string, Rec>();
  const put = (key: string, area: Area, label: string, value: unknown) => m.set(key, { area, label, value: typeof value === "string" ? value : JSON.stringify(value) });
  put("title", "project", "title", p.title);
  put("challenge", "project", "challenge", p.challenge);
  const i = p.intake;
  put("stage", "intake", "stage", [i.stagePrimary, i.stageSecondary].filter(Boolean).join(" + "));
  put("domains", "intake", "domains", i.domains.join(", "));
  put("scope", "intake", "scope", i.scope ?? "");
  put("oos", "intake", "outOfScope", i.outOfScope);
  put("deadline", "intake", "deadline", i.deadline ?? "");
  put("stakeholders", "intake", "stakeholders", i.stakeholders.filter((s) => s.trim()).join(", "));
  put("options", "intake", "options", i.options.filter((s) => s.trim()).join(", "));
  put("details", "intake", "details", { r: i.recurrence, c: i.causalComplexity, pb: i.processBoundaries, sk: i.stepsKnown, ms: i.measurableSymptom, d: i.dataAvailable, n: i.newInitiative, e: i.externalFocus, s: i.structureFocus, t: i.itemsAreThreats });
  i.statements.filter((s) => s.text.trim()).forEach((s) => put(`st:${s.id}`, "intake", s.text, `${s.role} · ${s.truth}`));
  put("chosen", "frameworks", "chosen", p.chosen.join(", "));
  for (const k of BUILDER_KEYS) {
    if (!started(p, k)) continue;
    if (k === "fw_swot") { const x = read(p, k); QUADRANTS.forEach((q) => x[q].filter((e) => e.text.trim()).forEach((e) => put(`sw:${e.id}`, k, e.text, `${q.toUpperCase()} · ${e.truth} · ${e.importance} · ${e.evidence}`))); x.implications.filter((e) => e.text.trim()).forEach((e) => put(`im:${e.id}`, k, e.text, `${e.type} · ${e.links.length}`)); }
    if (k === "fw_five_whys") { const x = read(p, k); put("wp", k, "problem", x.problem); x.nodes.filter((n) => n.text.trim()).forEach((n) => put(`wn:${n.id}`, k, n.text, `${n.truth}${n.isRoot ? " · root" : ""} · ${n.countermeasure}`)); }
    if (k === "fw_cause_effect") { const x = read(p, k); put("fe", k, "effect", x.effect); put("fc", k, "categories", x.categories.map((c) => c.name || c.preset).join(", ")); x.causes.filter((c) => c.text.trim()).forEach((c) => put(`fc:${c.id}`, k, c.text, `${c.truth}${c.likely ? " · likely" : ""}`)); }
    if (k === "fw_impact_effort") read(p, k).items.filter((e) => e.title.trim()).forEach((e) => put(`mi:${e.id}`, k, e.title, `impact ${e.impact} · effort ${e.effort} · ${e.truth}`));
    if (k === "fw_action_plan") { const x = read(p, k); put("po", k, "objective", x.objective); put("pd", k, "deadline", x.deadline); x.indicators.filter((e) => e.name.trim()).forEach((e) => put(`pi:${e.id}`, k, e.name, `${e.baseline} → ${e.target} (${e.by})`)); x.actions.filter((e) => e.title.trim()).forEach((e) => put(`pa:${e.id}`, k, e.title, `${e.owner} · ${e.due} · ${e.status}`)); }
  }
  return m;
}

/** Changes needed to go from `a` (older) to `b` (newer). */
export function diff(a: Project, b: Project): Change[] {
  const A = records(a), B = records(b);
  const out: Change[] = [];
  for (const [k, rb] of B) {
    const ra = A.get(k);
    if (!ra) { if (rb.value && rb.value !== '""') out.push({ area: rb.area, kind: "added", label: rb.label, after: rb.value }); }
    else if (ra.value !== rb.value || ra.label !== rb.label) out.push({ area: rb.area, kind: "changed", label: rb.label, before: ra.label !== rb.label ? ra.label : ra.value, after: ra.label !== rb.label ? rb.label : rb.value });
  }
  for (const [k, ra] of A) if (!B.has(k) && ra.value) out.push({ area: ra.area, kind: "removed", label: ra.label, before: ra.value });
  return out;
}
