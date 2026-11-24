export type Locale = "en" | "ar";
/** A bilingual string. */
export type L = { en: string; ar: string };

export const STAGES = ["UNDERSTAND_CONTEXT", "MAP_CURRENT_STATE", "FIND_ROOT_CAUSE", "GENERATE_OPTIONS", "PRIORITISE_DECIDE", "PLAN_EXECUTION", "ALIGN_PEOPLE", "MANAGE_RISK", "DESIGN_ORGANISATION"] as const;
export type Stage = (typeof STAGES)[number];

export const DOMAINS = ["OPS.PERFORMANCE", "OPS.QUALITY", "OPS.WASTE", "OPS.PROCESS_DEFINITION", "OPS.HANDOFFS", "STR.ENVIRONMENT", "STR.POSITION", "STR.DIRECTION", "STR.EXECUTION",
  "ORG.STRUCTURE", "ORG.ACCOUNTABILITY", "ORG.OPERATING_MODEL", "PPL.CAPABILITY", "PPL.ENGAGEMENT", "PPL.ADOPTION", "PRJ.INITIATION", "PRJ.PLANNING", "PRJ.DELIVERY", "PRJ.STAKEHOLDERS",
  "RSK.ASSESSMENT", "RSK.COMPLIANCE", "RSK.CONTINUITY", "CX.SERVICE_LEVEL", "CX.EXPERIENCE", "CX.DEMAND", "DEC.PRIORITISATION", "DEC.OPTIONS", "FIN.COST", "FIN.REVENUE"] as const;
export type Domain = (typeof DOMAINS)[number];

export const SCOPES = ["team", "department", "cross_functional", "organisation", "multi_entity_ecosystem"] as const;
export type Scope = (typeof SCOPES)[number];

export const APPROACH_IDS = ["fw_swot", "fw_pest_steeple", "fw_sipoc", "fw_bpmn", "fw_vsm", "fw_five_whys", "fw_cause_effect", "cap_strategic_options", "fw_impact_effort",
  "fw_risk_matrix", "fw_stakeholder_map", "fw_project_charter", "fw_action_plan", "fw_org_chart", "fw_op_model_canvas"] as const;
export type ApproachId = (typeof APPROACH_IDS)[number];

export type Recurrence = "one_off" | "recurring" | "chronic";
export type DataAvailable = "none" | "anecdotal" | "some" | "good";
export type StructureFocus = "reporting_lines" | "delivery_model" | "none";

/** Structured problem description consumed by the recommender (same shape as the Phase 0 slots). */
export interface Slots {
  symptom: true | "vague" | false;
  stage: { primary: Stage | null; secondary: Stage | null };
  domains: string[];
  scope: Scope | null;
  goal: number; // 0 | 0.5 | 1
  impact: number; // 0 | 0.5 | 1
  stakeholders: number;
  constraints: boolean;
  deadline_known?: boolean;
  recurrence?: Recurrence | null;
  causal_complexity?: number | null;
  process_boundaries?: boolean | null;
  steps_known?: boolean | null;
  measurable_symptom?: boolean | null;
  data_available?: DataAvailable | null;
  options_listed?: number;
  new_initiative?: boolean;
  external_focus?: boolean;
  structure_focus?: StructureFocus;
  items_are_threats?: boolean;
  out_of_scope?: boolean;
}
