// Zod schemas for Phase 0 LLM routes (flat, shallow — finding M14). Mirrors 04 §3, §5.6, §6.3, §7.2 in reduced form.
import { z } from "zod/v4"; // the SDK zod helper requires v4 schemas (caught by dry run)
import { STAGES, APPROACHES } from "./catalogue.mjs";

export const L2 = ["OPS.PERFORMANCE","OPS.QUALITY","OPS.WASTE","OPS.PROCESS_DEFINITION","OPS.HANDOFFS","STR.ENVIRONMENT","STR.POSITION","STR.DIRECTION","STR.EXECUTION",
  "ORG.STRUCTURE","ORG.ACCOUNTABILITY","ORG.OPERATING_MODEL","PPL.CAPABILITY","PPL.ENGAGEMENT","PPL.ADOPTION","PRJ.INITIATION","PRJ.PLANNING","PRJ.DELIVERY","PRJ.STAKEHOLDERS",
  "RSK.ASSESSMENT","RSK.COMPLIANCE","RSK.CONTINUITY","CX.SERVICE_LEVEL","CX.EXPERIENCE","CX.DEMAND","DEC.PRIORITISATION","DEC.OPTIONS","FIN.COST","FIN.REVENUE","X.OUT_OF_SCOPE","X.UNCLEAR"];
const conf = z.enum(["high", "medium", "low"]);
const yn = z.boolean().nullable();

export const Diagnosis = z.object({
  language: z.enum(["ar", "en"]),
  reframed_problem: z.string(),
  statements: z.array(z.object({
    id: z.string(),
    role: z.enum(["symptom", "suspected_cause", "goal", "constraint", "impact", "stakeholder", "context", "option_mentioned"]),
    text: z.string(),
    truth_status: z.enum(["unverified", "assumption"]),          // AI may never emit "verified" (I2)
    origin: z.enum(["user_input", "ai_generated"]),
    user_quote: z.string().nullable(),                            // verbatim span when origin=user_input or claimed user support
    verification_hint: z.string().nullable(),
  })),
  classification: z.object({
    domains: z.array(z.object({ code: z.enum(L2), confidence: conf })),
    stage_primary: z.enum(STAGES).nullable(), stage_secondary: z.enum(STAGES).nullable(), stage_confidence: conf,
    scope: z.enum(["team", "department", "cross_functional", "organisation", "multi_entity_ecosystem"]).nullable(),
  }),
  signals: z.object({
    recurrence: z.enum(["one_off", "recurring", "chronic"]).nullable(), causal_complexity: z.number().int().min(1).max(5).nullable(),
    process_boundaries: yn, steps_known: yn, measurable_symptom: yn, data_available: z.enum(["none", "anecdotal", "some", "good"]).nullable(),
    options_listed: z.number().int(), deadline_known: z.boolean(), new_initiative: z.boolean(), external_focus: z.boolean(),
    structure_focus: z.enum(["reporting_lines", "delivery_model", "none"]), items_are_threats: z.boolean(),
  }),
  presence: z.object({ goal: z.enum(["stated", "inferred", "absent"]), impact: z.enum(["stated", "inferred", "absent"]), stakeholders_named: z.number().int(), constraints_or_deadline: z.boolean(), symptom: z.enum(["clear", "vague", "absent"]) }),
  unknowns: z.array(z.object({ slot: z.string(), why_it_matters: z.string() })),
  out_of_scope: z.object({ flag: z.boolean(), reason_code: z.enum(["none", "legal_advice", "medical", "personal_matter", "individual_employment_decision", "unlawful", "non_business", "financial_modelling"]) }),
});

export const Rerank = z.object({
  status: z.enum(["ok", "no_good_fit"]),               // the LLM may DOWNGRADE to no_good_fit, never upgrade (v0.3b)
  recommendations: z.array(z.object({
    approach_id: z.enum(APPROACHES),                   // stable enum; candidate membership checked in code (M2)
    fit: conf, why_it_fits: z.array(z.string()), caution: z.string(),
  })),
  no_good_fit_explanation: z.string().nullable(),
  not_recommended: z.array(z.object({ approach_id: z.enum(APPROACHES), reason: z.string() })),
});

export const Questions = z.object({ questions: z.array(z.object({ slot: z.string(), question: z.string(), why: z.string() })) });

export const OptionSet = z.object({
  options: z.array(z.object({
    id: z.string(), title: z.string(), description: z.string(), addresses: z.array(z.string()), rationale: z.string(),
    impact: z.number().int().min(1).max(5), impact_basis: z.string(), effort: z.number().int().min(1).max(5), effort_basis: z.string(),
    risk: z.number().int().min(1).max(5), risk_basis: z.string(), feasibility: z.number().int().min(1).max(5), feasibility_basis: z.string(),
    assumptions: z.array(z.string()), dependencies: z.array(z.string()), is_baseline: z.boolean(),
  })),
  preferred_option_id: z.string(), preferred_why: z.string(), trade_offs: z.string(),
  choose_another_if: z.array(z.object({ option_id: z.string(), condition: z.string() })),
  coverage_gaps: z.array(z.string()),
});

export const Critique = z.object({
  findings: z.array(z.object({
    severity: z.enum(["critical", "high", "medium", "low"]),
    category: z.enum(["completeness", "logic", "consistency", "evidence", "assumption_risk", "clarity", "methodology", "alignment"]),
    target_ids: z.array(z.string()), title: z.string(), explanation: z.string(), suggested_correction: z.string(),
  })),
});

export const Judge = z.object({
  items: z.array(z.object({ key: z.string(), verdict: z.enum(["yes", "partial", "no"]), note: z.string() })),
  scores: z.array(z.object({ criterion: z.string(), score: z.number().int().min(1).max(5), note: z.string() })),
});
