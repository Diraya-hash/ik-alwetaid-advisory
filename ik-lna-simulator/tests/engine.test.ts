import { describe, expect, it } from "vitest";
import { claimsQuality as s } from "@/content/scenarios/claims-quality";
import { availableQuestions, check, derive } from "@/engine/reducer";
import type { Action, ActionInput } from "@/engine/types";

const run = (...inputs: ActionInput[]) => derive(s, inputs.map((a, i) => ({ ...a, at: i }) as Action));
const ask = (stakeholderId: string, questionId: string): ActionInput => ({ type: "ASK", stakeholderId, questionId });
const frame: ActionInput = { type: "FRAME_PROBLEM", optionId: "f-gap" };
const toStage2: ActionInput = { type: "ADVANCE_STAGE", to: 2 };

describe("engine", () => {
  it("starts in stage 1 with the full budget and initial openness", () => {
    const st = run();
    expect(st.stage).toBe(1);
    expect(st.hoursRemaining).toBe(s.budgetHours);
    expect(st.openness.kh).toBe(55);
  });

  it("reviewing a document spends hours and discovers it; duplicates are ignored", () => {
    const st = run({ type: "REVIEW_EVIDENCE", evidenceId: "ev-dashboard" }, { type: "REVIEW_EVIDENCE", evidenceId: "ev-dashboard" });
    expect(st.discovered).toEqual(["ev-dashboard"]);
    expect(st.hoursUsed).toBe(1);
  });

  it("cannot review interview-only evidence directly", () => {
    expect(check(s, run(), { type: "REVIEW_EVIDENCE", evidenceId: "ev-rules-backlog", at: 0 })).toBe("not-available");
  });

  it("interviews are locked in stage 1", () => {
    expect(check(s, run(), { type: "ASK", stakeholderId: "kh", questionId: "q-kh-outcome", at: 0 })).toBe("stage-locked");
  });

  it("cannot skip stages", () => {
    const st = run(frame, toStage2);
    expect(check(s, st, { type: "ADVANCE_STAGE", to: 4, at: 0 })).toBe("invalid-stage");
  });

  it("requires the problem to be framed before stakeholder discovery", () => {
    expect(check(s, run(), { type: "ADVANCE_STAGE", to: 2, at: 0 })).toBe("framing-required");
    expect(check(s, run(), { type: "FRAME_PROBLEM", optionId: "nope", at: 0 })).toBe("unknown-framing");
    const st = run({ type: "FRAME_PROBLEM", optionId: "f-training" }, frame, frame);
    expect(st.framings).toEqual(["f-training", "f-gap"]); // history kept, repeats collapsed
    expect(st.hoursUsed).toBe(0); // framing costs no hours
  });

  it("the structural cause is only reachable through rapport with QA", () => {
    const cold = run(frame, toStage2, ask("sa", "q-sa-independence"));
    expect(cold.discovered).not.toContain("ev-qa-reporting");
    const warm = run(frame, toStage2, ask("sa", "q-sa-types"), ask("sa", "q-sa-independence"));
    expect(warm.discovered).toContain("ev-qa-reporting");
  });

  it("the COO's target challenge unlocks once the rules backlog is known", () => {
    const st = run(frame, toStage2, ask("om", "q-om-change"), ask("om", "q-om-rules"));
    expect(availableQuestions(s, st, "co").map((q) => q.id)).toContain("q-co-ch-target");
  });

  it("openness gates hidden insight: guarded answer first, candid after rapport", () => {
    const cold = run(frame, toStage2, ask("om", "q-om-rules"));
    expect(cold.discovered).not.toContain("ev-rules-backlog");
    const warm = run(frame, toStage2, ask("om", "q-om-change"), ask("om", "q-om-rules"));
    expect(warm.discovered).toContain("ev-rules-backlog");
  });

  it("accusatory questions reduce openness and lock insight", () => {
    const st = run(frame, toStage2, ask("om", "q-om-blame"), ask("om", "q-om-change"), ask("om", "q-om-rules"));
    expect(st.openness.om).toBe(35); // 40 − 15 (blame) + 10 (rapport) + 0 (guarded answer)
    expect(st.discovered).not.toContain("ev-rules-backlog");
  });

  it("challenge questions appear only once the supporting evidence is found", () => {
    const before = availableQuestions(s, run(frame, toStage2), "om").map((q) => q.id);
    expect(before).not.toContain("q-om-ch-limits");
    const after = availableQuestions(s, run(frame, toStage2, ask("sa", "q-sa-types")), "om").map((q) => q.id);
    expect(after).toContain("q-om-ch-limits");
  });

  it("enforces the hours budget", () => {
    const actions: ActionInput[] = [frame, toStage2];
    // Burn the budget with the 2h walkthrough + every other affordable question.
    for (const st of s.stakeholders) for (const q of st.questions) if (!q.available) actions.push(ask(st.id, q.id));
    const st = run(...actions);
    expect(st.hoursRemaining).toBeGreaterThanOrEqual(0);
    expect(st.hoursUsed).toBeLessThanOrEqual(s.budgetHours);
  });

  it("is deterministic: same actions produce identical state", () => {
    const a = run(frame, toStage2, ask("sa", "q-sa-types"), ask("om", "q-om-ch-limits"));
    const b = run(frame, toStage2, ask("sa", "q-sa-types"), ask("om", "q-om-ch-limits"));
    expect(a).toEqual(b);
  });

  it("hypotheses are user assumptions that can be added and removed", () => {
    const st = run(
      { type: "LOG_HYPOTHESIS", hypothesisId: "h1", text: "  Targets drive rushing ", causeType: "governance" },
      { type: "LOG_HYPOTHESIS", hypothesisId: "h2", text: "   ", causeType: "skill" },
      { type: "REMOVE_HYPOTHESIS", hypothesisId: "missing" }
    );
    expect(st.hypotheses).toHaveLength(1);
    expect(st.hypotheses[0]!.text).toBe("Targets drive rushing");
  });
});
