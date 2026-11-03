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
    causes: {},
    gaps: {},
    interventions: {},
    kpis: {},
    completed: false,
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
  if (state.completed) return "completed";
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
      if (action.to === 4 && !Object.values(state.causes).some((c) => c.verdict === "root")) return "diagnosis-required";
      if (action.to === 5 && scenario.capabilityGaps.some((g) => !state.gaps[g.id])) return "assessment-required";
      if (action.to === 6 && Object.keys(state.interventions).length === 0) return "solution-required";
      return null;
    case "SET_CAUSE":
      if (state.stage < 3) return "stage-locked";
      if (!scenario.rootCauses.some((c) => c.id === action.causeId)) return "unknown-cause";
      if (action.evidenceIds.some((id) => !state.discovered.includes(id))) return "undiscovered-evidence";
      return null;
    case "SET_GAP":
      if (state.stage < 4) return "stage-locked";
      return scenario.capabilityGaps.some((g) => g.id === action.gapId) ? null : "unknown-gap";
    case "SET_INTERVENTION":
      if (state.stage < 5) return "stage-locked";
      if (!scenario.interventions.some((i) => i.id === action.interventionId)) return "unknown-intervention";
      if (action.causeIds.some((id) => !scenario.rootCauses.some((c) => c.id === id))) return "unknown-cause";
      return null;
    case "SET_KPI":
      if (state.stage < 6) return "stage-locked";
      if (!scenario.kpis.some((k) => k.id === action.kpiId)) return "unknown-kpi";
      if (!scenario.stakeholders.some((s) => s.id === action.ownerId)) return "unknown-kpi";
      return null;
    case "COMPLETE":
      if (state.stage !== 6) return "stage-locked";
      return Object.keys(state.kpis).length === 0 ? "measures-required" : null;
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
    case "SET_CAUSE": {
      const causes = { ...state.causes };
      if (action.verdict) causes[action.causeId] = { verdict: action.verdict, evidenceIds: [...new Set(action.evidenceIds)] };
      else delete causes[action.causeId];
      return { ...state, causes };
    }
    case "SET_GAP": {
      const gaps = { ...state.gaps };
      if (action.verdict) gaps[action.gapId] = { verdict: action.verdict, nature: action.nature };
      else delete gaps[action.gapId];
      return { ...state, gaps };
    }
    case "SET_INTERVENTION": {
      const interventions = { ...state.interventions };
      if (action.selected) interventions[action.interventionId] = { causeIds: [...new Set(action.causeIds)] };
      else delete interventions[action.interventionId];
      return { ...state, interventions };
    }
    case "SET_KPI": {
      const kpis = { ...state.kpis };
      if (action.selected) kpis[action.kpiId] = { level: action.level, ownerId: action.ownerId, reviewDays: action.reviewDays };
      else delete kpis[action.kpiId];
      return { ...state, kpis };
    }
    case "COMPLETE":
      return { ...state, completed: true, completedAt: action.at };
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
