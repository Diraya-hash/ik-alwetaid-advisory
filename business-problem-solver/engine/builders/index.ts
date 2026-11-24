// Builder registry: safe reading of builder data (validated, seeded from the intake), cross-builder links,
// project-wide critic findings and the assumptions register.
import type { Project } from "../project";
import type { ApproachId } from "../types";
import type { Finding, Truth } from "./common";
import { checkFishbone, emptyFishbone, fishboneSchema, type Fishbone } from "./fishbone";
import { checkMatrix, emptyMatrix, matrixSchema, quadrant, type Matrix } from "./matrix";
import { checkPlan, emptyPlan, planSchema, type Link, type Plan } from "./plan";
import { checkSwot, emptySwot, QUADRANTS, swotSchema, type Swot } from "./swot";
import { checkWhys, emptyWhys, rootStrength, whysSchema, type FiveWhys } from "./whys";

export type BuilderData = { fw_swot: Swot; fw_five_whys: FiveWhys; fw_cause_effect: Fishbone; fw_impact_effort: Matrix; fw_action_plan: Plan };
export type BuilderKey = keyof BuilderData;
export const BUILDER_KEYS: BuilderKey[] = ["fw_swot", "fw_five_whys", "fw_cause_effect", "fw_impact_effort", "fw_action_plan"];

const firstOf = (p: Project, role: string) => p.intake.statements.find((s) => s.role === role && s.text.trim())?.text.trim() ?? "";

/** Default content, seeded from what the user already told us in the intake. */
export function seed<K extends BuilderKey>(p: Project, k: K): BuilderData[K] {
  const i = p.intake;
  switch (k) {
    case "fw_swot": return emptySwot() as BuilderData[K];
    case "fw_five_whys": return emptyWhys(firstOf(p, "symptom")) as BuilderData[K];
    case "fw_cause_effect": return emptyFishbone(firstOf(p, "symptom"), i.domains.some((d) => d.startsWith("OPS.")) && !i.domains.some((d) => d.startsWith("CX.")) ? "operations" : i.domains.some((d) => d.startsWith("FIN.REVENUE") || d === "CX.DEMAND") ? "commercial" : "service") as BuilderData[K];
    case "fw_impact_effort": return { items: i.options.filter((o) => o.trim()).map((o, n) => ({ id: `ini_seed_${n}`, title: o.trim(), impact: 3, effort: 3, impactWhy: "", effortWhy: "", truth: "assumption" as const })) } as BuilderData[K];
    case "fw_action_plan": return emptyPlan(firstOf(p, "goal"), i.deadline ?? "") as BuilderData[K];
    default: return emptyMatrix() as BuilderData[K];
  }
}

const SCHEMAS = { fw_swot: swotSchema, fw_five_whys: whysSchema, fw_cause_effect: fishboneSchema, fw_impact_effort: matrixSchema, fw_action_plan: planSchema };
/** Reads builder data; anything missing or malformed falls back to the seeded default (never throws). */
export function read<K extends BuilderKey>(p: Project, k: K): BuilderData[K] {
  const raw = p.frameworks[k];
  if (raw === undefined) return seed(p, k);
  const r = SCHEMAS[k].safeParse(raw);
  return (r.success ? r.data : seed(p, k)) as BuilderData[K];
}
export const started = (p: Project, k: BuilderKey) => p.frameworks[k] !== undefined;

export function findings(p: Project, k: BuilderKey): Finding[] {
  switch (k) {
    case "fw_swot": return checkSwot(read(p, k));
    case "fw_five_whys": return checkWhys(read(p, k), { causalComplexity: p.intake.causalComplexity });
    case "fw_cause_effect": return checkFishbone(read(p, k));
    case "fw_impact_effort": return checkMatrix(read(p, k), { itemsAreThreats: p.intake.itemsAreThreats });
    case "fw_action_plan": return checkPlan(read(p, k));
  }
}

/** Everything an action can be linked to: goals, root causes, likely causes, implications, initiatives, chosen frameworks. */
export function linkables(p: Project): Link[] {
  const out: Link[] = [];
  p.intake.statements.filter((s) => s.role === "goal" && s.text.trim()).forEach((s) => out.push({ kind: "goal", ref: s.id, label: s.text.trim() }));
  if (started(p, "fw_five_whys")) { const w = read(p, "fw_five_whys"); w.nodes.filter((n) => n.isRoot && n.text.trim()).forEach((n) => out.push({ kind: "root_cause", ref: n.id, label: n.text.trim() })); }
  if (started(p, "fw_cause_effect")) read(p, "fw_cause_effect").causes.filter((c) => c.likely && c.text.trim()).forEach((c) => out.push({ kind: "likely_cause", ref: c.id, label: c.text.trim() }));
  if (started(p, "fw_swot")) read(p, "fw_swot").implications.filter((m) => m.text.trim()).forEach((m) => out.push({ kind: "implication", ref: m.id, label: `${m.type}: ${m.text.trim()}` }));
  if (started(p, "fw_impact_effort")) read(p, "fw_impact_effort").items.filter((i) => i.title.trim() && ["quick_win", "strategic"].includes(quadrant(i))).forEach((i) => out.push({ kind: "initiative", ref: i.id, label: i.title.trim() }));
  p.chosen.filter((a) => a !== "fw_action_plan").forEach((a) => out.push({ kind: "framework", ref: a, label: a }));
  return out;
}

/** Proposed actions derived from the other builders (the user decides which to add). */
export function suggestedActions(p: Project): { title: string; link: Link }[] {
  const out: { title: string; link: Link }[] = [];
  if (started(p, "fw_five_whys")) read(p, "fw_five_whys").nodes.filter((n) => n.isRoot && n.countermeasure.trim()).forEach((n) => out.push({ title: n.countermeasure.trim(), link: { kind: "root_cause", ref: n.id, label: n.text.trim() } }));
  if (started(p, "fw_impact_effort")) read(p, "fw_impact_effort").items.filter((i) => i.title.trim() && ["quick_win", "strategic"].includes(quadrant(i))).forEach((i) => out.push({ title: i.title.trim(), link: { kind: "initiative", ref: i.id, label: i.title.trim() } }));
  if (started(p, "fw_swot")) read(p, "fw_swot").implications.filter((m) => m.text.trim()).forEach((m) => out.push({ title: m.text.trim(), link: { kind: "implication", ref: m.id, label: `${m.type}: ${m.text.trim()}` } }));
  if (started(p, "fw_cause_effect")) read(p, "fw_cause_effect").causes.filter((c) => c.likely && c.text.trim() && c.truth !== "verified").forEach((c) => out.push({ title: c.text.trim(), link: { kind: "likely_cause", ref: c.id, label: c.text.trim() } }));
  const existing = started(p, "fw_action_plan") ? read(p, "fw_action_plan").actions.flatMap((a) => a.links.map((l) => `${l.kind}:${l.ref}`)) : [];
  return out.filter((s) => !existing.includes(`${s.link.kind}:${s.link.ref}`));
}

export type RegisterSource = "intake" | BuilderKey;
export interface RegisterEntry { source: RegisterSource; text: string; truth: Truth; note?: string }
/** Every unverified claim and assumption in the project, so the user knows what to test before acting. */
export function assumptionsRegister(p: Project): RegisterEntry[] {
  const out: RegisterEntry[] = [];
  p.intake.statements.filter((s) => s.text.trim() && s.truth !== "verified").forEach((s) => out.push({ source: "intake", text: s.text.trim(), truth: s.truth, note: s.role }));
  if (started(p, "fw_swot")) { const s = read(p, "fw_swot"); QUADRANTS.forEach((q) => s[q].filter((i) => i.text.trim() && i.truth !== "verified").forEach((i) => out.push({ source: "fw_swot", text: i.text.trim(), truth: i.truth, note: q }))); }
  if (started(p, "fw_five_whys")) { const w = read(p, "fw_five_whys"); w.nodes.filter((n) => n.text.trim() && n.truth !== "verified").forEach((n) => out.push({ source: "fw_five_whys", text: n.text.trim(), truth: n.truth, note: n.isRoot ? rootStrength(w, n.id).strength : undefined })); }
  if (started(p, "fw_cause_effect")) read(p, "fw_cause_effect").causes.filter((c) => c.text.trim() && c.truth !== "verified").forEach((c) => out.push({ source: "fw_cause_effect", text: c.text.trim(), truth: c.truth, note: c.likely ? "likely" : undefined }));
  if (started(p, "fw_impact_effort")) read(p, "fw_impact_effort").items.filter((i) => i.title.trim() && i.truth !== "verified").forEach((i) => out.push({ source: "fw_impact_effort", text: i.title.trim(), truth: i.truth }));
  return out;
}

export const isBuilderKey = (a: string): a is BuilderKey => (BUILDER_KEYS as string[]).includes(a);
export type { ApproachId };
