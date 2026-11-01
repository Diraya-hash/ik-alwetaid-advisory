import { evaluate } from "./conditions";
import {
  PLAYABLE_STAGES,
  type Action,
  type Evidence,
  type QuestionNode,
  type Rejection,
  type Scenario,
  type SimState,
  type Stakeholder,
} from "./types";

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export function initialState(scenario: Scenario): SimState {
  return {
    stage: 1,
    hoursUsed: 0,
    hoursRemaining: scenario.budgetHours,
    discovered: [],
    reviewed: [],
    asked: [],
    openness: Object.fromEntries(scenario.stakeholders.map((s) => [s.id, s.initialOpenness])),
    transcript: [],
    hypotheses: [],
    framings: [],
  };
}

export function findQuestion(
  scenario: Scenario,
  stakeholderId: string,
  questionId: string
): { stakeholder: Stakeholder; question: QuestionNode } | null {
  const stakeholder = scenario.stakeholders.find((s) => s.id === stakeholderId);
  const question = stakeholder?.questions.find((q) => q.id === questionId);
  return stakeholder && question ? { stakeholder, question } : null;
}

export function findEvidence(scenario: Scenario, id: string): Evidence | undefined {
  return scenario.evidence.find((e) => e.id === id);
}

/** Questions the user can currently see for a stakeholder (already-asked ones excluded). */
export function availableQuestions(scenario: Scenario, state: SimState, stakeholderId: string): QuestionNode[] {
  const s = scenario.stakeholders.find((x) => x.id === stakeholderId);
  if (!s) return [];
  return s.questions.filter((q) => !state.asked.includes(q.id) && evaluate(q.available, state));
}

/** Returns why an action cannot be applied, or null if it is valid. */
export function check(scenario: Scenario, state: SimState, action: Action): Rejection | null {
  switch (action.type) {
    case "REVIEW_EVIDENCE": {
      const ev = findEvidence(scenario, action.evidenceId);
      if (!ev) return "unknown-evidence";
      if (!ev.initiallyAvailable) return "not-available";
      if (state.reviewed.includes(ev.id)) return "already-reviewed";
      if (ev.reviewCostHours > state.hoursRemaining) return "insufficient-hours";
      return null;
    }
    case "ASK": {
      if (state.stage < 2) return "stage-locked";
      const found = findQuestion(scenario, action.stakeholderId, action.questionId);
      if (!found) return "unknown-question";
      if (state.asked.includes(found.question.id)) return "already-asked";
      if (!evaluate(found.question.available, state)) return "not-available";
      if (found.question.costHours > state.hoursRemaining) return "insufficient-hours";
      return null;
    }
    case "LOG_HYPOTHESIS":
      return action.text.trim().length === 0 ? "empty-hypothesis" : null;
    case "REMOVE_HYPOTHESIS":
      return state.hypotheses.some((h) => h.id === action.hypothesisId) ? null : "unknown-hypothesis";
    case "FRAME_PROBLEM":
      if (!scenario.framing.options.some((o) => o.id === action.optionId)) return "unknown-framing";
      if (state.stage > 2) return "stage-locked";
      return null;
    case "ADVANCE_STAGE":
      if (action.to !== state.stage + 1) return "invalid-stage";
      if (!PLAYABLE_STAGES.includes(action.to)) return "stage-locked";
      // A consultant defines the performance gap before interviewing anyone.
      if (action.to === 2 && state.framings.length === 0) return "framing-required";
      return null;
  }
}

/** Applies a validated action. Invalid actions return the state unchanged. */
export function apply(scenario: Scenario, state: SimState, action: Action): SimState {
  if (check(scenario, state, action)) return state;
  switch (action.type) {
    case "REVIEW_EVIDENCE": {
      const ev = findEvidence(scenario, action.evidenceId)!;
      return {
        ...state,
        hoursUsed: state.hoursUsed + ev.reviewCostHours,
        hoursRemaining: state.hoursRemaining - ev.reviewCostHours,
        reviewed: [...state.reviewed, ev.id],
        discovered: state.discovered.includes(ev.id) ? state.discovered : [...state.discovered, ev.id],
      };
    }
    case "ASK": {
      const { stakeholder, question } = findQuestion(scenario, action.stakeholderId, action.questionId)!;
      // Responses are chosen against the state *before* the question is applied.
      let idx = question.responses.findIndex((r) => evaluate(r.when, state));
      if (idx < 0) idx = question.responses.length - 1;
      const response = question.responses[idx]!;
      const revealed = (response.reveals ?? []).filter((id) => !state.discovered.includes(id));
      return {
        ...state,
        hoursUsed: state.hoursUsed + question.costHours,
        hoursRemaining: state.hoursRemaining - question.costHours,
        asked: [...state.asked, question.id],
        discovered: [...state.discovered, ...revealed],
        openness: {
          ...state.openness,
          [stakeholder.id]: clamp((state.openness[stakeholder.id] ?? 0) + response.opennessDelta),
        },
        transcript: [
          ...state.transcript,
          {
            stakeholderId: stakeholder.id,
            questionId: question.id,
            responseIndex: idx,
            revealed,
            opennessDelta: response.opennessDelta,
          },
        ],
      };
    }
    case "LOG_HYPOTHESIS":
      return {
        ...state,
        hypotheses: [
          ...state.hypotheses,
          { id: action.hypothesisId, text: action.text.trim(), causeType: action.causeType, at: action.at },
        ],
      };
    case "REMOVE_HYPOTHESIS":
      return { ...state, hypotheses: state.hypotheses.filter((h) => h.id !== action.hypothesisId) };
    case "FRAME_PROBLEM":
      return state.framings.at(-1) === action.optionId ? state : { ...state, framings: [...state.framings, action.optionId] };
    case "ADVANCE_STAGE":
      return { ...state, stage: action.to };
  }
}

/** Event-sourced derivation: the state is always a pure function of (scenario, actions). */
export function derive(scenario: Scenario, actions: Action[]): SimState {
  return actions.reduce((s, a) => apply(scenario, s, a), initialState(scenario));
}

export type OpennessBand = "guarded" | "cautious" | "open" | "candid";
export function opennessBand(value: number): OpennessBand {
  if (value < 30) return "guarded";
  if (value < 55) return "cautious";
  if (value < 75) return "open";
  return "candid";
}
