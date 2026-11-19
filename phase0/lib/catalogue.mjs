// Phase 0 prototype: recommendation seed data, FROZEN at v0.2 values before any scenario was scored.
// Source: docs/business-solver/04-ai-logic.md §5.2 (stage fit), §5.3 (discriminators), 03 §6.1 (preconditions).
// Domain affinities were not tabulated in 04 for every framework; they are seeded here from the
// framework descriptions (content-team judgement) and frozen as "seed v0.2" (git history records them).
export const SEED_VERSION = "v0.2-seed";

export const STAGES = ["UNDERSTAND_CONTEXT","MAP_CURRENT_STATE","FIND_ROOT_CAUSE","GENERATE_OPTIONS","PRIORITISE_DECIDE","PLAN_EXECUTION","ALIGN_PEOPLE","MANAGE_RISK","DESIGN_ORGANISATION"];

// order: UNDERSTAND, MAP, ROOT, OPTIONS, PRIORITISE, PLAN, ALIGN, RISK, DESIGN_ORG  (04 §5.2)
const SF = {
  fw_swot:             [0.9,0.2,0.1,0.3,0.3,0.0,0.1,0.2,0.2],
  fw_pest_steeple:     [1.0,0.0,0.0,0.1,0.1,0.0,0.0,0.3,0.0],
  fw_sipoc:            [0.3,1.0,0.3,0.0,0.0,0.1,0.2,0.0,0.3],
  fw_bpmn:             [0.1,0.9,0.4,0.0,0.0,0.2,0.0,0.1,0.3],
  fw_vsm:              [0.1,0.8,0.6,0.1,0.2,0.1,0.0,0.0,0.1],
  fw_five_whys:        [0.0,0.1,1.0,0.0,0.0,0.0,0.0,0.0,0.0],
  fw_cause_effect:     [0.1,0.2,1.0,0.1,0.1,0.0,0.1,0.1,0.0],
  cap_strategic_options:[0.1,0.0,0.1,1.0,0.6,0.2,0.0,0.1,0.2],
  fw_impact_effort:    [0.0,0.0,0.0,0.4,1.0,0.4,0.1,0.0,0.0],
  fw_risk_matrix:      [0.2,0.0,0.1,0.1,0.3,0.3,0.0,1.0,0.0],
  fw_stakeholder_map:  [0.3,0.1,0.0,0.0,0.1,0.3,1.0,0.2,0.2],
  fw_project_charter:  [0.2,0.0,0.0,0.0,0.2,0.9,0.6,0.3,0.0],
  fw_action_plan:      [0.0,0.0,0.0,0.1,0.2,1.0,0.3,0.2,0.1],
  fw_org_chart:        [0.2,0.5,0.1,0.0,0.0,0.0,0.2,0.0,1.0],
  fw_op_model_canvas:  [0.4,0.5,0.1,0.3,0.2,0.1,0.1,0.0,1.0],
};
export const STAGE_FIT = Object.fromEntries(Object.entries(SF).map(([k,v]) => [k, Object.fromEntries(STAGES.map((s,i)=>[s,v[i]]))]));

export const FAMILY = {
  fw_swot:"strategy_environment", fw_pest_steeple:"strategy_environment", fw_sipoc:"process", fw_bpmn:"process", fw_vsm:"process",
  fw_five_whys:"root_cause", fw_cause_effect:"root_cause", cap_strategic_options:"options", fw_impact_effort:"prioritisation",
  fw_risk_matrix:"risk", fw_stakeholder_map:"stakeholder_org", fw_project_charter:"project_planning", fw_action_plan:"project_planning",
  fw_org_chart:"stakeholder_org", fw_op_model_canvas:"operating_model",
};

// Domain affinity seeds (0..1). Unlisted = 0.
export const DOMAIN_AFFINITY = {
  fw_swot:            {"STR.POSITION":0.9,"STR.DIRECTION":0.8,"STR.ENVIRONMENT":0.6,"STR.EXECUTION":0.3,"DEC.OPTIONS":0.3,"CX.EXPERIENCE":0.2},
  fw_pest_steeple:    {"STR.ENVIRONMENT":1.0,"STR.DIRECTION":0.5,"STR.POSITION":0.4,"RSK.ASSESSMENT":0.3,"RSK.COMPLIANCE":0.3},
  fw_sipoc:           {"OPS.PROCESS_DEFINITION":1.0,"OPS.HANDOFFS":0.8,"OPS.QUALITY":0.4,"OPS.PERFORMANCE":0.4,"ORG.OPERATING_MODEL":0.4,"CX.SERVICE_LEVEL":0.3},
  fw_bpmn:            {"OPS.PROCESS_DEFINITION":0.9,"OPS.HANDOFFS":0.9,"OPS.PERFORMANCE":0.5,"OPS.QUALITY":0.4,"OPS.WASTE":0.4,"CX.SERVICE_LEVEL":0.3},
  fw_vsm:             {"OPS.WASTE":1.0,"OPS.PERFORMANCE":0.9,"CX.SERVICE_LEVEL":0.5,"OPS.HANDOFFS":0.5,"FIN.COST":0.4},
  fw_five_whys:       {"OPS.QUALITY":0.9,"OPS.PERFORMANCE":0.7,"CX.SERVICE_LEVEL":0.7,"PRJ.DELIVERY":0.5,"RSK.CONTINUITY":0.4,"PPL.ENGAGEMENT":0.3},
  fw_cause_effect:    {"OPS.QUALITY":1.0,"OPS.PERFORMANCE":0.9,"CX.SERVICE_LEVEL":0.8,"CX.EXPERIENCE":0.6,"PRJ.DELIVERY":0.6,"FIN.COST":0.5,"FIN.REVENUE":0.5,"PPL.ENGAGEMENT":0.4,"STR.EXECUTION":0.4},
  cap_strategic_options:{"DEC.OPTIONS":1.0,"STR.DIRECTION":0.8,"STR.POSITION":0.5,"CX.EXPERIENCE":0.4,"ORG.OPERATING_MODEL":0.4,"FIN.COST":0.4,"FIN.REVENUE":0.4},
  fw_impact_effort:   {"DEC.PRIORITISATION":1.0,"DEC.OPTIONS":0.7,"STR.DIRECTION":0.3,"RSK.COMPLIANCE":0.3},
  fw_risk_matrix:     {"RSK.ASSESSMENT":1.0,"RSK.COMPLIANCE":0.9,"RSK.CONTINUITY":0.9,"PRJ.DELIVERY":0.5,"PRJ.PLANNING":0.3},
  fw_stakeholder_map: {"PRJ.STAKEHOLDERS":1.0,"PPL.ADOPTION":0.8,"STR.EXECUTION":0.4,"ORG.STRUCTURE":0.3,"PRJ.INITIATION":0.4},
  fw_project_charter: {"PRJ.INITIATION":1.0,"PRJ.PLANNING":0.6,"PRJ.STAKEHOLDERS":0.5,"PRJ.DELIVERY":0.4,"STR.EXECUTION":0.4},
  fw_action_plan:     {"PRJ.PLANNING":1.0,"PRJ.DELIVERY":0.6,"STR.EXECUTION":0.6,"DEC.PRIORITISATION":0.3,"PPL.ADOPTION":0.3},
  fw_org_chart:       {"ORG.STRUCTURE":1.0,"ORG.ACCOUNTABILITY":0.8,"ORG.OPERATING_MODEL":0.4},
  fw_op_model_canvas: {"ORG.OPERATING_MODEL":1.0,"ORG.STRUCTURE":0.6,"ORG.ACCOUNTABILITY":0.4,"STR.DIRECTION":0.4,"OPS.PROCESS_DEFINITION":0.3},
};

// Preconditions (slot, test, severity) — 03 §6.1 semantics. sev: blocking 1.0, important 0.25, nice 0.05
export const PRECONDITIONS = {
  fw_five_whys:      [["symptom","present","blocking"],["recurrence","in:recurring,chronic","important"]],
  fw_cause_effect:   [["symptom","present","blocking"]],
  fw_sipoc:          [["process_named_or_area","present","important"]],
  fw_bpmn:           [["process_boundaries","true","important"]],
  fw_vsm:            [["process_boundaries","true","important"],["measurable_symptom","true","important"],["data_available","in:some,good","important"]],
  fw_impact_effort:  [["options_listed","min:2","important"]],
  fw_action_plan:    [["goal","present","important"]],
  fw_project_charter:[["goal","present","important"]],
  fw_stakeholder_map:[["stakeholders","min:1","important"]],
  fw_risk_matrix:    [],
  fw_swot:           [],
  fw_pest_steeple:   [],
  fw_org_chart:      [["structure_focus","in:reporting_lines,delivery_model","nice_to_have"]],
  fw_op_model_canvas:[["structure_focus","in:reporting_lines,delivery_model","nice_to_have"]],
  cap_strategic_options:[["goal_or_symptom","present","blocking"]],
};

// Signal boosts (0..1 each, summed then capped at 1)
export function signalBoost(a, s) {
  let b = 0;
  if (a === "fw_impact_effort" && s.options_listed >= 4) b += 1;
  if (a === "fw_risk_matrix" && s.items_are_threats) b += 1;
  if (a === "fw_project_charter" && s.new_initiative) b += 0.7;
  if (a === "fw_vsm" && s.measurable_symptom && s.data_available === "good") b += 0.7;
  if (a === "fw_pest_steeple" && s.external_focus) b += 0.7;
  if (a === "fw_action_plan" && s.options_listed >= 4 && s.stage?.primary === "PLAN_EXECUTION") b += 0.7;
  if (a === "fw_stakeholder_map" && s.stakeholders >= 3) b += 0.3;
  return Math.min(1, b);
}

// Discriminators (04 §5.3). Return 1 for the preferred member when the rule's slot condition holds.
export function discriminator(a, s) {
  const st = s.stage?.primary;
  const cc = s.causal_complexity ?? 2;
  const crossScope = ["cross_functional","organisation","multi_entity_ecosystem"].includes(s.scope);
  switch (a) {
    case "fw_pest_steeple": return s.external_focus ? 1 : 0;
    case "fw_swot": return (!s.external_focus && st === "UNDERSTAND_CONTEXT") ? 1 : 0;
    case "fw_cause_effect": return (st === "FIND_ROOT_CAUSE" && (cc >= 3 || crossScope)) ? 1 : 0;
    case "fw_five_whys": return (st === "FIND_ROOT_CAUSE" && cc <= 2 && !crossScope) ? 1 : 0;
    case "fw_sipoc": return (st === "MAP_CURRENT_STATE" && s.process_boundaries === false) ? 1 : 0;
    case "fw_bpmn": return (st === "MAP_CURRENT_STATE" && s.process_boundaries === true && s.steps_known === false) ? 1 : 0;
    case "fw_vsm": return (s.process_boundaries === true && s.measurable_symptom && ["some","good"].includes(s.data_available) &&
                           (s.domains||[]).some(d => d === "OPS.WASTE" || d === "OPS.PERFORMANCE")) ? 1 : 0;
    case "fw_project_charter": return s.new_initiative ? 1 : 0;
    case "fw_action_plan": return (st === "PLAN_EXECUTION" && !s.new_initiative) ? 1 : 0;
    case "fw_org_chart": return s.structure_focus === "reporting_lines" ? 1 : 0;
    case "fw_op_model_canvas": return s.structure_focus === "delivery_model" ? 1 : 0;
    case "fw_impact_effort": return (!s.items_are_threats && s.options_listed >= 4) ? 1 : 0;
    case "fw_risk_matrix": return s.items_are_threats ? 1 : 0;
    case "cap_strategic_options": return (st === "GENERATE_OPTIONS" && (s.options_listed ?? 0) < 2) ? 1 : 0;
    case "fw_stakeholder_map": return (st === "ALIGN_PEOPLE" && !s.new_initiative) ? 1 : 0;
    default: return 0;
  }
}

// Soft contraindications (count of hits)
export function contra(a, s) {
  let c = 0;
  if (a === "fw_five_whys" && (s.causal_complexity ?? 0) >= 3) c += 1;
  if (a === "fw_impact_effort" && s.items_are_threats) c += 1;
  if (a === "cap_strategic_options" && s.stage?.primary === "FIND_ROOT_CAUSE") c += 1;
  return c;
}

export const WEIGHTS = { alpha: 0.30, beta: 0.35, delta: 0.15, eps: 0.10, kappa: 0.15, zeta: 0.20, eta: 0.30 };
export const MAX_SCORE = WEIGHTS.alpha + WEIGHTS.beta + WEIGHTS.delta + WEIGHTS.eps + WEIGHTS.kappa; // 1.05
export const CORE_WEIGHTS = { symptom: .20, stage: .15, domain: .15, scope: .10, goal: .10, impact: .10, stakeholders: .10, constraints: .10 };
export const GATE_TAU = 0.65;
export const NGF_THRESHOLD = 0.45;
export const APPROACHES = Object.keys(STAGE_FIT);
