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
export const PLAYABLE_STAGES: StageId[] = [1, 2, 3, 4, 5, 6];

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
  /** Must be interviewed for adequate stakeholder coverage. */
  critical: boolean;
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

/**
 * A capability candidate assessed in Stage 4. Some candidates are not real gaps
 * (distractors drawn from stakeholder claims); `nature` is the answer key.
 */
export interface CapabilityGap {
  id: string;
  title: L;
  /** "skill" = individual capability; anything else is an organisational barrier. */
  nature: CauseType;
  population: L;
  current: number; // 1–5, scenario fact
  required: number; // 1–5, scenario fact
  isGap: boolean;
  /** Debrief explanation of the correct classification. */
  rationale: L;
}

export type InterventionType =
  | "training"
  | "coaching"
  | "mentoring"
  | "job-aid"
  | "process-redesign"
  | "org-design"
  | "technology"
  | "leadership-alignment"
  | "governance"
  | "performance-management"
  | "workforce"
  | "change-management";

export const INTERVENTION_TYPES: InterventionType[] = [
  "training", "coaching", "mentoring", "job-aid", "process-redesign", "org-design",
  "technology", "leadership-alignment", "governance", "performance-management", "workforce", "change-management",
];

export type Fit = "essential" | "supportive" | "neutral" | "harmful";

export interface InterventionOption {
  id: string;
  type: InterventionType;
  title: L;
  description: L;
  /** Answer key: how well this option fits the real diagnosis. */
  fit: Fit;
  /** Root causes this option genuinely treats. */
  addresses: string[];
  /** Roadmap horizon: 1 = first 30 days, 2 = 30–90 days, 3 = 90–180 days. */
  phase: 1 | 2 | 3;
  rationale: L;
}

export type KpiLevel = "strategic" | "operational" | "behavioural" | "capability" | "learning";
export const KPI_LEVELS: KpiLevel[] = ["strategic", "operational", "behavioural", "capability", "learning"];
export const REVIEW_DAYS = [30, 90, 180, 365] as const;
export type ReviewDays = (typeof REVIEW_DAYS)[number];

export interface KpiOption {
  id: string;
  title: L;
  /** Answer key for the level the user must classify it at. */
  level: KpiLevel;
  baseline: L;
  target: L;
  /** Stakeholder ids who could credibly own it; the first is the best owner. */
  owners: string[];
  /** Whether it belongs in a measurement framework for this diagnosis at all. */
  relevant: boolean;
  rationale: L;
}

export interface Debrief {
  expertSummary: L;
  recommendedApproach: L;
  /** Methodology tool keys: whys, fishbone, gap, systems, process, sevenS. */
  methodology: string[];
  nextScenarios: string[];
}

export type FramingKind = "solution" | "cause-assumption" | "symptom" | "performance-gap";

export interface FramingOption {
  id: string;
  text: L;
  kind: FramingKind;
  /** Shown in the debrief, never during play. */
  explanation: L;
}

/** The Stage 1 decision: how the user frames the problem before any interview. */
export interface ProblemFraming {
  prompt: L;
  options: FramingOption[];
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
  framing: ProblemFraming;
  interventions: InterventionOption[];
  kpis: KpiOption[];
  debrief: Debrief;
  /** Optional dimension weights (default 1 each). */
  weights?: Partial<Record<Dimension, number>>;
}

// ---------- Simulation actions & state ----------

export type Action =
  | { type: "REVIEW_EVIDENCE"; evidenceId: string; at: number }
  | { type: "ASK"; stakeholderId: string; questionId: string; at: number }
  | { type: "LOG_HYPOTHESIS"; hypothesisId: string; text: string; causeType: CauseType; at: number }
  | { type: "REMOVE_HYPOTHESIS"; hypothesisId: string; at: number }
  | { type: "FRAME_PROBLEM"; optionId: string; at: number }
  | { type: "ADVANCE_STAGE"; to: StageId; at: number }
  | { type: "SET_CAUSE"; causeId: string; verdict: CauseVerdict | null; evidenceIds: string[]; at: number }
  | { type: "SET_GAP"; gapId: string; verdict: "gap" | "not-gap" | null; nature: CauseType; at: number }
  | { type: "SET_INTERVENTION"; interventionId: string; selected: boolean; causeIds: string[]; at: number }
  | { type: "SET_KPI"; kpiId: string; selected: boolean; level: KpiLevel; ownerId: string; reviewDays: ReviewDays; at: number }
  | { type: "COMPLETE"; at: number };

export type CauseVerdict = "root" | "ruled-out" | "unsure";

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
  /** Every framing the user recorded, in order; the last one is current. */
  framings: string[];
  causes: Record<string, { verdict: CauseVerdict; evidenceIds: string[] }>;
  gaps: Record<string, { verdict: "gap" | "not-gap"; nature: CauseType }>;
  interventions: Record<string, { causeIds: string[] }>;
  kpis: Record<string, { level: KpiLevel; ownerId: string; reviewDays: ReviewDays }>;
  completed: boolean;
  completedAt?: number;
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
  | "unknown-hypothesis"
  | "unknown-framing"
  | "framing-required"
  | "completed"
  | "unknown-cause"
  | "unknown-gap"
  | "unknown-intervention"
  | "unknown-kpi"
  | "undiscovered-evidence"
  | "diagnosis-required"
  | "assessment-required"
  | "solution-required"
  | "measures-required";
