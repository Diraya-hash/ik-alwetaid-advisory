/**
 * Scenario data model and simulation state.
 * Pure types: no React, no browser APIs. Every user-facing string is bilingual (L).
 */

export type Locale = "en" | "ar";
export type L = { en: string; ar: string };

export type Difficulty = "foundation" | "intermediate" | "advanced";
export type Category = "strategy" | "workforce" | "performance" | "culture" | "governance";

export type Dimension =
  | "strategicAlignment"
  | "stakeholderEngagement"
  | "diagnosticThinking"
  | "rootCauseIdentification"
  | "evidenceBasedDecisions"
  | "capabilityAssessment"
  | "solutionAppropriateness"
  | "businessImpact";

export const DIMENSIONS: Dimension[] = [
  "strategicAlignment",
  "stakeholderEngagement",
  "diagnosticThinking",
  "rootCauseIdentification",
  "evidenceBasedDecisions",
  "capabilityAssessment",
  "solutionAppropriateness",
  "businessImpact",
];

export type CauseType =
  | "skill"
  | "motivation"
  | "process"
  | "structure"
  | "technology"
  | "leadership"
  | "governance"
  | "culture"
  | "strategy"
  | "resource";

export const CAUSE_TYPES: CauseType[] = [
  "skill",
  "motivation",
  "process",
  "structure",
  "technology",
  "leadership",
  "governance",
  "culture",
  "strategy",
  "resource",
];

export type StageId = 1 | 2 | 3 | 4 | 5 | 6;
export const STAGES: StageId[] = [1, 2, 3, 4, 5, 6];
/** Stages the current release can actually play. Later stages render as unavailable. */
export const PLAYABLE_STAGES: StageId[] = [1, 2];

export type Condition = {
  all?: Condition[];
  any?: Condition[];
  not?: Condition;
  hasEvidence?: string;
  asked?: string;
  /** [stakeholderId, minimum openness] */
  opennessGte?: [string, number];
};

export type EvidenceKind = "document" | "data" | "observation" | "claim";

export interface Evidence {
  id: string;
  kind: EvidenceKind;
  title: L;
  body: L;
  /** Where the evidence came from — a stakeholder or a document source label. */
  sourceStakeholderId?: string;
  sourceLabel?: L;
  /** Available to review from Stage 1 (documents pack). Otherwise discovered via interviews. */
  initiallyAvailable: boolean;
  /** Hours to review when initially available. Interview-revealed evidence costs nothing extra. */
  reviewCostHours: number;
  supports: string[];
  contradicts: string[];
  critical: boolean;
}

export type QuestionQuality = "critical" | "strong" | "neutral" | "weak" | "leading" | "solution-first";

export interface QuestionResponse {
  when?: Condition;
  reply: L;
  reveals?: string[];
  opennessDelta: number;
}

export interface QuestionNode {
  id: string;
  text: L;
  costHours: number;
  quality: QuestionQuality;
  /** "challenge" questions confront a stakeholder with evidence from elsewhere. */
  kind?: "standard" | "challenge";
  available?: Condition;
  /** Evaluated in order; the first whose `when` passes is used. Last should be unconditional. */
  responses: QuestionResponse[];
  dimensions: Partial<Record<Dimension, number>>;
  whyItMatters: L;
}

export type Role =
  | "ceo"
  | "chro"
  | "cso"
  | "cfo"
  | "cio"
  | "coo"
  | "buHead"
  | "manager"
  | "hrbp"
  | "employee"
  | "expert";

export interface Stakeholder {
  id: string;
  role: Role;
  name: L;
  title: L;
  /** Short framing shown before the interview. */
  perspective: L;
  objectives: L[];
  concerns: L[];
  bias: { type: L; note: L };
  initialOpenness: number;
  questions: QuestionNode[];
}

export interface OrgUnit {
  name: L;
  headcount?: number;
  note?: L;
}

export interface RootCause {
  id: string;
  type: CauseType;
  title: L;
  explanation: L;
  isTrue: boolean;
  /** Relative contribution of a true cause (0–1); ignored for distractors. */
  weight: number;
}

export interface CapabilityGap {
  id: string;
  title: L;
  /** "skill" = individual capability; anything else is an organisational barrier. */
  nature: CauseType;
  population: L;
  current: number; // 1–5
  required: number; // 1–5
}

export interface Scenario {
  id: string;
  version: number;
  category: Category;
  difficulty: Difficulty;
  complexity: 1 | 2 | 3 | 4 | 5;
  estMinutes: number;
  competencyFocus: Dimension[];
  budgetHours: number;
  title: L;
  summary: L;
  /** The initial request, as the client frames it — often misleading. */
  request: { from: string; text: L };
  organization: {
    name: L;
    sector: L;
    size: L;
    background: L;
    structure: OrgUnit[];
  };
  strategy: {
    priorities: L[];
    initiatives: L[];
    successMeasures: L[];
    externalPressures: L[];
  };
  evidence: Evidence[];
  stakeholders: Stakeholder[];
  rootCauses: RootCause[];
  capabilityGaps: CapabilityGap[];
}

// ---------- Simulation actions & state ----------

export type Action =
  | { type: "REVIEW_EVIDENCE"; evidenceId: string; at: number }
  | { type: "ASK"; stakeholderId: string; questionId: string; at: number }
  | { type: "LOG_HYPOTHESIS"; hypothesisId: string; text: string; causeType: CauseType; at: number }
  | { type: "REMOVE_HYPOTHESIS"; hypothesisId: string; at: number }
  | { type: "ADVANCE_STAGE"; to: StageId; at: number };

/** Distributive omit so each Action variant keeps its own fields. */
export type ActionInput = Action extends infer A ? (A extends Action ? Omit<A, "at"> : never) : never;

export interface TranscriptEntry {
  stakeholderId: string;
  questionId: string;
  responseIndex: number;
  revealed: string[];
  opennessDelta: number;
}

export interface Hypothesis {
  id: string;
  text: string;
  causeType: CauseType;
  at: number;
}

export interface SimState {
  stage: StageId;
  hoursUsed: number;
  hoursRemaining: number;
  /** Evidence ids the user has seen, in discovery order. */
  discovered: string[];
  reviewed: string[];
  asked: string[];
  openness: Record<string, number>;
  transcript: TranscriptEntry[];
  hypotheses: Hypothesis[];
}

export type Rejection =
  | "unknown-evidence"
  | "already-reviewed"
  | "not-available"
  | "unknown-question"
  | "already-asked"
  | "insufficient-hours"
  | "stage-locked"
  | "invalid-stage"
  | "empty-hypothesis"
  | "unknown-hypothesis";
