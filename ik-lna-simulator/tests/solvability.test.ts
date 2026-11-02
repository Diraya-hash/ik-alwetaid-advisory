/**
 * Every scenario must be solvable within its budget by good consulting behaviour,
 * and must punish order-taking. Runs a greedy "expert" and a training-first "order-taker".
 */
import { describe, expect, it } from "vitest";
import { scenarios } from "@/content/scenarios";
import { apply, availableQuestions, check, initialState } from "@/engine/reducer";
import { score } from "@/engine/scoring";
import type { Action, ActionInput, Scenario, SimState } from "@/engine/types";

function step(sc: Scenario, st: SimState, a: ActionInput, log: Action[]): SimState {
  const action = { ...a, at: log.length } as Action;
  const why = check(sc, st, action);
  if (why) throw new Error(`${sc.id}: ${a.type} rejected (${why}) ${JSON.stringify(a)}`);
  log.push(action);
  return apply(sc, st, action);
}

/** Greedy expert: pick the good question that reveals the most critical evidence now. */
export function expertRun(sc: Scenario) {
  const log: Action[] = [];
  let st = initialState(sc);
  for (const d of sc.evidence.filter((e) => e.initiallyAvailable)) if (d.reviewCostHours <= st.hoursRemaining) st = step(sc, st, { type: "REVIEW_EVIDENCE", evidenceId: d.id }, log);
  const gap = sc.framing.options.find((o) => o.kind === "performance-gap")!;
  st = step(sc, st, { type: "FRAME_PROBLEM", optionId: gap.id }, log);
  st = step(sc, st, { type: "LOG_HYPOTHESIS", hypothesisId: "h1", text: "system cause", causeType: sc.rootCauses.find((c) => c.isTrue)!.type }, log);
  st = step(sc, st, { type: "ADVANCE_STAGE", to: 2 }, log);
  for (;;) {
    const options = sc.stakeholders.flatMap((s) =>
      availableQuestions(sc, st, s.id)
        .filter((q) => (q.quality === "critical" || q.quality === "strong") && q.costHours <= st.hoursRemaining)
        .map((q) => {
          const value = (from: SimState, to: SimState) => {
            const fresh = to.discovered.filter((id) => !from.discovered.includes(id));
            return fresh.filter((id) => sc.evidence.find((e) => e.id === id)!.critical).length * 10 + fresh.length * 3;
          };
          const next = apply(sc, st, { type: "ASK", stakeholderId: s.id, questionId: q.id, at: 0 });
          // One step of lookahead: rapport-building questions are valued by what they unlock next.
          const followUp = Math.max(
            0,
            ...availableQuestions(sc, next, s.id)
              .filter((f) => f.costHours <= next.hoursRemaining - 0 && f.costHours + q.costHours <= st.hoursRemaining)
              .map((f) => value(next, apply(sc, next, { type: "ASK", stakeholderId: s.id, questionId: f.id, at: 0 })) / (q.costHours + f.costHours))
          );
          const gain = value(st, next) + (next.openness[s.id]! - st.openness[s.id]!) / 5 + (q.kind === "challenge" ? 4 : 0) + (q.quality === "critical" ? 2 : 0);
          return { s, q, gain: Math.max(gain / q.costHours, followUp * 0.8) };
        })
    );
    if (!options.length) break;
    options.sort((a, b) => b.gain - a.gain);
    st = step(sc, st, { type: "ASK", stakeholderId: options[0]!.s.id, questionId: options[0]!.q.id }, log);
  }
  st = step(sc, st, { type: "ADVANCE_STAGE", to: 3 }, log);
  const evFor = (causeId: string, rel: "supports" | "contradicts") =>
    st.discovered.filter((id) => sc.evidence.find((e) => e.id === id)![rel].includes(causeId));
  for (const c of sc.rootCauses) {
    if (c.isTrue) st = step(sc, st, { type: "SET_CAUSE", causeId: c.id, verdict: "root", evidenceIds: evFor(c.id, "supports") }, log);
    else st = step(sc, st, { type: "SET_CAUSE", causeId: c.id, verdict: "ruled-out", evidenceIds: evFor(c.id, "contradicts") }, log);
  }
  st = step(sc, st, { type: "ADVANCE_STAGE", to: 4 }, log);
  for (const g of sc.capabilityGaps) st = step(sc, st, { type: "SET_GAP", gapId: g.id, verdict: g.isGap ? "gap" : "not-gap", nature: g.nature }, log);
  st = step(sc, st, { type: "ADVANCE_STAGE", to: 5 }, log);
  for (const i of sc.interventions.filter((i) => i.fit === "essential"))
    st = step(sc, st, { type: "SET_INTERVENTION", interventionId: i.id, selected: true, causeIds: i.addresses }, log);
  st = step(sc, st, { type: "ADVANCE_STAGE", to: 6 }, log);
  for (const k of sc.kpis.filter((k) => k.relevant && k.level !== "learning"))
    st = step(sc, st, { type: "SET_KPI", kpiId: k.id, selected: true, level: k.level, ownerId: k.owners[0]!, reviewDays: 90 }, log);
  st = step(sc, st, { type: "COMPLETE" }, log);
  return { st, result: score(sc, st) };
}

function orderTakerRun(sc: Scenario) {
  const log: Action[] = [];
  let st = initialState(sc);
  st = step(sc, st, { type: "FRAME_PROBLEM", optionId: sc.framing.options.find((o) => o.kind === "solution")!.id }, log);
  st = step(sc, st, { type: "ADVANCE_STAGE", to: 2 }, log);
  const requester = sc.stakeholders.find((s) => s.id === sc.request.from)!;
  for (const q of availableQuestions(sc, st, requester.id)) if (q.costHours <= st.hoursRemaining) st = step(sc, st, { type: "ASK", stakeholderId: requester.id, questionId: q.id }, log);
  st = step(sc, st, { type: "ADVANCE_STAGE", to: 3 }, log);
  const blame = sc.rootCauses.find((c) => !c.isTrue && (c.type === "skill" || c.type === "motivation"))!;
  st = step(sc, st, { type: "SET_CAUSE", causeId: blame.id, verdict: "root", evidenceIds: [] }, log);
  st = step(sc, st, { type: "ADVANCE_STAGE", to: 4 }, log);
  for (const g of sc.capabilityGaps) st = step(sc, st, { type: "SET_GAP", gapId: g.id, verdict: "gap", nature: "skill" }, log);
  st = step(sc, st, { type: "ADVANCE_STAGE", to: 5 }, log);
  const training = sc.interventions.find((i) => i.type === "training" && (i.fit === "harmful" || i.fit === "neutral"))!;
  st = step(sc, st, { type: "SET_INTERVENTION", interventionId: training.id, selected: true, causeIds: [blame.id] }, log);
  st = step(sc, st, { type: "ADVANCE_STAGE", to: 6 }, log);
  const learning = sc.kpis.find((k) => k.level === "learning")!;
  st = step(sc, st, { type: "SET_KPI", kpiId: learning.id, selected: true, level: "learning", ownerId: learning.owners[0]!, reviewDays: 30 }, log);
  st = step(sc, st, { type: "COMPLETE" }, log);
  return score(sc, st);
}

describe("every scenario is solvable and discriminating", () => {
  for (const sc of scenarios) {
    it(`${sc.id}: an expert finds evidence for every true cause within budget and scores 75+`, () => {
      const { st, result } = expertRun(sc);
      const unsupported = sc.rootCauses.filter((c) => c.isTrue && !st.causes[c.id]!.evidenceIds.length).map((c) => c.id);
      expect(unsupported, "true causes without discoverable evidence").toEqual([]);
      expect(result.overall).toBeGreaterThanOrEqual(75);
    });
    it(`${sc.id}: a training-first order-taker scores below 40`, () => {
      const r = orderTakerRun(sc);
      expect(r.overall).toBeLessThan(40);
      expect(r.dimensions.solutionAppropriateness.score).toBeLessThanOrEqual(40);
    });
    it(`${sc.id}: next scenarios exist`, () => {
      for (const id of sc.debrief.nextScenarios) expect(scenarios.map((s) => s.id).concat(["platform-adoption", "strategy-stalled", "quiet-team", "merger-hangover", "empty-bench", "shared-services", "talent-cliff", "hospital-flow"])).toContain(id);
    });
  }
});
