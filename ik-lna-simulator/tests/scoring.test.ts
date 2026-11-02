import { describe, expect, it } from "vitest";
import { claimsQuality as s } from "@/content/scenarios/claims-quality";
import { check, derive } from "@/engine/reducer";
import { score } from "@/engine/scoring";
import type { Action, ActionInput } from "@/engine/types";

const run = (inputs: ActionInput[]) => derive(s, inputs.map((a, i) => ({ ...a, at: i }) as Action));
const ask = (stakeholderId: string, questionId: string): ActionInput => ({ type: "ASK", stakeholderId, questionId });
const adv = (to: 2 | 3 | 4 | 5 | 6): ActionInput => ({ type: "ADVANCE_STAGE", to });

/** An expert-like path through the pilot. */
const expertDiscovery: ActionInput[] = [
  { type: "REVIEW_EVIDENCE", evidenceId: "ev-dashboard" },
  { type: "REVIEW_EVIDENCE", evidenceId: "ev-regulator" },
  { type: "REVIEW_EVIDENCE", evidenceId: "ev-training-history" },
  { type: "LOG_HYPOTHESIS", hypothesisId: "h1", text: "Targets trade accuracy for speed", causeType: "governance" },
  { type: "FRAME_PROBLEM", optionId: "f-gap" },
  adv(2),
  ask("co", "q-co-priorities"),
  ask("sa", "q-sa-types"),
  ask("sa", "q-sa-independence"),
  ask("sa", "q-sa-process"),
  ask("om", "q-om-change"),
  ask("om", "q-om-rules"),
  ask("pr", "q-pr-walkthrough"),
  ask("no", "q-no-tenure"),
  ask("kh", "q-kh-ch-tenure"),
  ask("co", "q-co-ch-target"),
  ask("pr", "q-pr-onboarding"),
];
const expertDiagnosis: ActionInput[] = [
  adv(3),
  { type: "SET_CAUSE", causeId: "rc-rules", verdict: "root", evidenceIds: ["ev-rules-backlog", "ev-error-taxonomy"] },
  { type: "SET_CAUSE", causeId: "rc-kpi", verdict: "root", evidenceIds: ["ev-kpi-memo", "ev-qa-sampling"] },
  { type: "SET_CAUSE", causeId: "rc-qa-structure", verdict: "root", evidenceIds: ["ev-qa-reporting"] },
  { type: "SET_CAUSE", causeId: "rc-onboarding", verdict: "root", evidenceIds: ["ev-onboarding"] },
  { type: "SET_CAUSE", causeId: "rc-carelessness", verdict: "ruled-out", evidenceIds: ["ev-kpi-memo"] },
  { type: "SET_CAUSE", causeId: "rc-broad-skill", verdict: "ruled-out", evidenceIds: ["ev-tenure-split"] },
  adv(4),
  ...s.capabilityGaps.map((g): ActionInput => ({ type: "SET_GAP", gapId: g.id, verdict: g.isGap ? "gap" : "not-gap", nature: g.nature })),
  adv(5),
  { type: "SET_INTERVENTION", interventionId: "iv-rules", selected: true, causeIds: ["rc-rules"] },
  { type: "SET_INTERVENTION", interventionId: "iv-targets", selected: true, causeIds: ["rc-kpi"] },
  { type: "SET_INTERVENTION", interventionId: "iv-qa-sampling", selected: true, causeIds: ["rc-kpi"] },
  { type: "SET_INTERVENTION", interventionId: "iv-qa-independence", selected: true, causeIds: ["rc-qa-structure"] },
  { type: "SET_INTERVENTION", interventionId: "iv-coding", selected: true, causeIds: ["rc-onboarding"] },
  adv(6),
  { type: "SET_KPI", kpiId: "k-accuracy", selected: true, level: "strategic", ownerId: "co", reviewDays: 90 },
  { type: "SET_KPI", kpiId: "k-limit-errors", selected: true, level: "operational", ownerId: "om", reviewDays: 30 },
  { type: "SET_KPI", kpiId: "k-checks", selected: true, level: "behavioural", ownerId: "kh", reviewDays: 30 },
  { type: "SET_KPI", kpiId: "k-newhire-coding", selected: true, level: "capability", ownerId: "sa", reviewDays: 90 },
  { type: "COMPLETE" },
];

describe("stage gates", () => {
  it("each stage needs real work before the next", () => {
    const st3 = run([...expertDiscovery, adv(3)]);
    expect(check(s, st3, { type: "ADVANCE_STAGE", to: 4, at: 0 })).toBe("diagnosis-required");
    const st4 = run([...expertDiscovery, adv(3), { type: "SET_CAUSE", causeId: "rc-rules", verdict: "root", evidenceIds: [] }, adv(4)]);
    expect(st4.stage).toBe(4);
    expect(check(s, st4, { type: "ADVANCE_STAGE", to: 5, at: 0 })).toBe("assessment-required");
  });
  it("cannot link evidence that has not been discovered", () => {
    const st = run([{ type: "FRAME_PROBLEM", optionId: "f-gap" }, adv(2), adv(3)]);
    expect(check(s, st, { type: "SET_CAUSE", causeId: "rc-rules", verdict: "root", evidenceIds: ["ev-rules-backlog"], at: 0 })).toBe("undiscovered-evidence");
  });
  it("a completed engagement is locked", () => {
    const st = run([...expertDiscovery, ...expertDiagnosis]);
    expect(st.completed).toBe(true);
    expect(check(s, st, { type: "ASK", stakeholderId: "kh", questionId: "q-kh-cause", at: 0 })).toBe("completed");
  });
});

describe("scoring", () => {
  const expert = score(s, run([...expertDiscovery, ...expertDiagnosis]));

  it("an expert path scores as a strategic consultant", () => {
    if (process.env.CALIBRATE) console.log("EXPERT", expert.overall, Object.fromEntries(Object.values(expert.dimensions).map((d) => [d.dimension, d.score])));
    expect(expert.overall).toBeGreaterThanOrEqual(80);
    expect(expert.band).toBe("consultant");
    expect(expert.insights.prematureTraining).toBe(false);
    expect(expert.insights.trueCausesMissed).toEqual([]);
  });

  it("every dimension is explainable: score equals its criteria", () => {
    for (const d of Object.values(expert.dimensions)) {
      const max = d.criteria.reduce((n, c) => n + c.max, 0);
      const earned = d.criteria.reduce((n, c) => n + c.earned, 0);
      expect(Math.abs(d.score - Math.round((100 * Math.max(0, earned)) / max))).toBeLessThanOrEqual(1);
    }
  });

  it("training-first order-taking scores low and caps solution appropriateness", () => {
    const st = run([
      { type: "FRAME_PROBLEM", optionId: "f-training" },
      adv(2),
      ask("kh", "q-kh-which-training"),
      ask("kh", "q-kh-leading"),
      ask("pr", "q-pr-training"),
      ask("kh", "q-kh-cause"),
      adv(3),
      { type: "SET_CAUSE", causeId: "rc-carelessness", verdict: "root", evidenceIds: ["ev-head-claim"] },
      adv(4),
      ...s.capabilityGaps.map((g): ActionInput => ({ type: "SET_GAP", gapId: g.id, verdict: "gap", nature: "skill" })),
      adv(5),
      { type: "SET_INTERVENTION", interventionId: "iv-workshop", selected: true, causeIds: ["rc-carelessness"] },
      adv(6),
      { type: "SET_KPI", kpiId: "k-workshop-satisfaction", selected: true, level: "learning", ownerId: "no", reviewDays: 30 },
      { type: "COMPLETE" },
    ]);
    const r = score(s, st);
    if (process.env.CALIBRATE) console.log("TRAINING-FIRST", r.overall, Object.fromEntries(Object.values(r.dimensions).map((d) => [d.dimension, d.score])));
    expect(r.overall).toBeLessThan(40);
    expect(r.band).toBe("orderTaker");
    expect(r.insights.prematureTraining).toBe(true);
    expect(r.dimensions.solutionAppropriateness.score).toBeLessThanOrEqual(40);
    expect(r.insights.harmfulInterventions).toContain("iv-workshop");
  });

  it("asking many questions does not buy a high score", () => {
    const spam: ActionInput[] = [{ type: "FRAME_PROBLEM", optionId: "f-training" }, adv(2)];
    for (const st of s.stakeholders) for (const q of st.questions) if (!q.available) spam.push(ask(st.id, q.id));
    const r = score(s, run(spam));
    if (process.env.CALIBRATE) console.log("SPAM", r.overall, r.dimensions.diagnosticThinking.score);
    expect(r.dimensions.diagnosticThinking.score).toBeLessThan(expert.dimensions.diagnosticThinking.score);
    expect(r.overall).toBeLessThan(40);
  });

  it("a root cause without evidence earns only 30% of its value", () => {
    const withEv = score(s, run([...expertDiscovery, adv(3), { type: "SET_CAUSE", causeId: "rc-rules", verdict: "root", evidenceIds: ["ev-rules-backlog"] }]));
    const without = score(s, run([...expertDiscovery, adv(3), { type: "SET_CAUSE", causeId: "rc-rules", verdict: "root", evidenceIds: [] }]));
    const recall = (r: typeof withEv) => r.dimensions.rootCauseIdentification.criteria.find((c) => c.id === "rc-recall")!.earned;
    expect(recall(without)).toBeCloseTo(recall(withEv) * 0.3, 0);
    expect(without.insights.unsupportedCauses).toContain("rc-rules");
  });

  it("targeted training backed by a diagnosed skill gap is not penalised", () => {
    expect(expert.dimensions.solutionAppropriateness.cap).toBeUndefined();
  });
});

describe("report CSV", () => {
  it("is Excel-safe UTF-8 with escaped fields and every decision", async () => {
    const { reportCsv } = await import("@/lib/report-csv");
    const st = run([...expertDiscovery, ...expertDiagnosis]);
    const csv = reportCsv(s, st, score(s, st), "ar");
    expect(csv.startsWith("﻿")).toBe(true);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe("section,item,your_decision,expert_view,detail");
    expect(lines.filter((x) => x.startsWith("root_cause,")).length).toBe(s.rootCauses.length);
    expect(lines.filter((x) => x.startsWith("kpi,")).length).toBe(4);
    expect(csv).toMatch(/[\u0600-\u06FF]/); // Arabic text survives
  });
});
