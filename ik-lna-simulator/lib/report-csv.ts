import type { Locale, Scenario, SimState } from "@/engine/types";
import type { ScoreResult } from "@/engine/scoring";

const esc = (v: string | number) => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/**
 * Flat CSV of an engagement: scores, causes, gaps, interventions and KPIs.
 * Prefixed with a UTF-8 BOM so Arabic opens correctly in Excel.
 */
export function reportCsv(sc: Scenario, st: SimState, r: ScoreResult, locale: Locale): string {
  const L = (v: { en: string; ar: string }) => v[locale];
  const rows: (string | number)[][] = [["section", "item", "your_decision", "expert_view", "detail"]];
  rows.push(["score", "overall", r.overall, "", r.band]);
  for (const d of Object.values(r.dimensions)) rows.push(["score", d.dimension, d.score, "", d.cap ? `capped at ${d.cap.value}` : ""]);
  for (const c of sc.rootCauses)
    rows.push(["root_cause", L(c.title), st.causes[c.id]?.verdict ?? "not judged", c.isTrue ? `true (${c.weight})` : "distractor", (st.causes[c.id]?.evidenceIds ?? []).join(" ")]);
  for (const g of sc.capabilityGaps) {
    const a = st.gaps[g.id];
    rows.push(["capability", L(g.title), a ? `${a.verdict}${a.verdict === "gap" ? `:${a.nature}` : ""}` : "not assessed", g.isGap ? `gap:${g.nature}` : "not-gap", ""]);
  }
  for (const i of sc.interventions)
    if (st.interventions[i.id]) rows.push(["intervention", L(i.title), `treats ${st.interventions[i.id]!.causeIds.join(" ")}`, i.fit, `phase ${i.phase}`]);
  for (const k of sc.kpis) {
    const a = st.kpis[k.id];
    if (a) rows.push(["kpi", L(k.title), `${a.level}; owner ${a.ownerId}; review ${a.reviewDays}d`, `${k.level}; owners ${k.owners.join("/")}${k.relevant ? "" : "; not relevant"}`, `${L(k.baseline)} -> ${L(k.target)}`]);
  }
  return "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
}
