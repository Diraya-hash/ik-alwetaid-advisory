/**
 * Consultant progress, derived only from saved attempts (no stored scores, so a
 * scoring fix re-scores history consistently).
 */
import { getScenario, scenarios } from "@/content/scenarios";
import { derive } from "@/engine/reducer";
import { bandOf, score, type Band, type ScoreResult } from "@/engine/scoring";
import { DIMENSIONS, type Dimension, type Scenario } from "@/engine/types";
import type { Attempt } from "@/store/sim-store";

export interface CompletedResult {
  attempt: Attempt;
  scenario: Scenario;
  result: ScoreResult;
  completedAt: number;
  /** Change versus the previous completed attempt of the same scenario. */
  delta: number | null;
  attemptNumber: number;
}

export function completedResults(attempts: Record<string, Attempt>): CompletedResult[] {
  const out: CompletedResult[] = [];
  const list = Object.values(attempts).sort((a, b) => a.createdAt - b.createdAt);
  for (const a of list) {
    if (a.status !== "completed") continue;
    const sc = getScenario(a.scenarioId);
    if (!sc) continue;
    const st = derive(sc, a.actions);
    if (!st.completed) continue;
    out.push({ attempt: a, scenario: sc, result: score(sc, st), completedAt: st.completedAt ?? a.updatedAt, delta: null, attemptNumber: 0 });
  }
  out.sort((x, y) => x.completedAt - y.completedAt);
  const seen: Record<string, CompletedResult[]> = {};
  for (const r of out) {
    const prev = seen[r.scenario.id] ?? [];
    r.attemptNumber = prev.length + 1;
    r.delta = prev.length ? r.result.overall - prev[prev.length - 1]!.result.overall : null;
    seen[r.scenario.id] = [...prev, r];
  }
  return out;
}

export interface Profile {
  count: number;
  average: number | null;
  band: Band | null;
  dimensionAverages: Record<Dimension, number> | null;
  strengths: Dimension[];
  focus: Dimension[];
  firstVsLatest: Record<Dimension, { first: number; latest: number }> | null;
}

export function profile(results: CompletedResult[]): Profile {
  if (!results.length) return { count: 0, average: null, band: null, dimensionAverages: null, strengths: [], focus: [], firstVsLatest: null };
  const recent = results.slice(-3);
  const average = Math.round(recent.reduce((n, r) => n + r.result.overall, 0) / recent.length);
  const dimensionAverages = Object.fromEntries(
    DIMENSIONS.map((d) => [d, Math.round(recent.reduce((n, r) => n + r.result.dimensions[d].score, 0) / recent.length)])
  ) as Record<Dimension, number>;
  const sorted = [...DIMENSIONS].sort((a, b) => dimensionAverages[b] - dimensionAverages[a]);
  const first = results[0]!.result;
  const latest = results[results.length - 1]!.result;
  return {
    count: results.length,
    average,
    band: bandOf(average),
    dimensionAverages,
    strengths: sorted.slice(0, 3),
    focus: sorted.slice(-3).reverse(),
    firstVsLatest: Object.fromEntries(
      DIMENSIONS.map((d) => [d, { first: first.dimensions[d].score, latest: latest.dimensions[d].score }])
    ) as Record<Dimension, { first: number; latest: number }>,
  };
}

const LEVEL = { foundation: 0, intermediate: 1, advanced: 2 } as const;

/**
 * Next scenario: not yet completed, at the next difficulty the consultant is ready for
 * (step up after scoring 60+ at the current level), preferring one that practises their weakest dimension.
 */
export function recommendNext(results: CompletedResult[], prof: Profile): Scenario | undefined {
  const done = new Set(results.map((r) => r.scenario.id));
  const pool = scenarios.filter((s) => !done.has(s.id));
  if (!pool.length) return [...scenarios].sort((a, b) => LEVEL[b.difficulty] - LEVEL[a.difficulty])[0];
  const best = results.reduce((lvl, r) => (r.result.overall >= 60 ? Math.max(lvl, LEVEL[r.scenario.difficulty] + 1) : lvl), 0);
  const target = Math.min(2, best);
  const weakest = prof.focus;
  const rank = (s: Scenario) =>
    Math.abs(LEVEL[s.difficulty] - target) * 10 - (weakest.findIndex((d) => s.competencyFocus.includes(d)) >= 0 ? 3 - weakest.findIndex((d) => s.competencyFocus.includes(d)) : 0);
  return [...pool].sort((a, b) => rank(a) - rank(b))[0];
}
