// Structured problem diagnosis built deterministically from the guided intake.
import type { Intake, Statement, StatementRole, Truth } from "./intake";
import { toSlots } from "./intake";
import { recommend, APPROVED, type Recommendation } from "./recommender";

/** Certainty wording in an unverified statement or assumption (ported from the Phase 0 critic rules). */
const CERTAINTY = {
  en: /\b(will definitely|definitely|certainly|guaranteed|guarantees|will always|always will|no doubt|100% sure|without (any )?doubt)\b/i,
  ar: /(بالتأكيد|حتمًا|حتما|مؤكد|بلا شك|دون شك|مضمون|سيؤدي حتمًا|دائمًا سي)/,
};

export type FindingCode =
  | "certainty_wording" // an unverified statement or assumption is worded as certain
  | "no_symptom_for_root_cause" // asking why without a stated symptom
  | "causes_all_unverified" // every suspected cause is unverified or assumed
  | "solution_in_goal" // goal states a solution, not an outcome
  | "no_goal"
  | "many_assumptions";
export interface DiagnosisFinding { code: FindingCode; severity: "high" | "medium" | "low"; target?: string }

export interface Diagnosis {
  byRole: Record<StatementRole, Statement[]>;
  truthCounts: Record<Truth, number>;
  findings: DiagnosisFinding[];
  completeness: number; // 0..1 (core sufficiency)
  recommendation: Recommendation;
}

const SOLUTION_GOAL = { en: /^\s*(implement|buy|introduce|hire|install|launch|roll out|use)\b/i, ar: /^\s*(تطبيق|شراء|تعيين|توظيف|تركيب|اطلاق|إطلاق|استخدام)/ };

export function diagnose(intake: Intake): Diagnosis {
  const roles: StatementRole[] = ["symptom", "cause", "goal", "impact", "constraint", "context"];
  const st = intake.statements.filter((s) => s.text.trim());
  const byRole = Object.fromEntries(roles.map((r) => [r, st.filter((s) => s.role === r)])) as Record<StatementRole, Statement[]>;
  const truthCounts: Record<Truth, number> = { verified: 0, unverified: 0, assumption: 0 };
  st.forEach((s) => truthCounts[s.truth]++);

  const findings: DiagnosisFinding[] = [];
  for (const s of st) {
    if (s.truth !== "verified" && (CERTAINTY.en.test(s.text) || CERTAINTY.ar.test(s.text))) findings.push({ code: "certainty_wording", severity: "medium", target: s.id });
  }
  if (intake.stagePrimary === "FIND_ROOT_CAUSE" && !byRole.symptom.length) findings.push({ code: "no_symptom_for_root_cause", severity: "high" });
  if (byRole.cause.length >= 2 && byRole.cause.every((c) => c.truth !== "verified")) findings.push({ code: "causes_all_unverified", severity: "medium" });
  for (const g of byRole.goal) if (SOLUTION_GOAL.en.test(g.text) || SOLUTION_GOAL.ar.test(g.text)) findings.push({ code: "solution_in_goal", severity: "low", target: g.id });
  if (!byRole.goal.length) findings.push({ code: "no_goal", severity: "low" });
  if (st.length >= 4 && truthCounts.assumption / st.length > 0.5) findings.push({ code: "many_assumptions", severity: "low" });

  const recommendation = recommend(toSlots(intake), APPROVED);
  return { byRole, truthCounts, findings, completeness: recommendation.sufficiency?.score ?? 0, recommendation };
}
