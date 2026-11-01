import { z } from "zod";
import { conditionRefs } from "./conditions";
import { CAUSE_TYPES, DIMENSIONS, type Condition, type Scenario } from "./types";

/** Bilingual string: both languages must be present and non-empty. */
const L = z.object({ en: z.string().trim().min(1), ar: z.string().trim().min(1) });

const ConditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z
    .object({
      all: z.array(ConditionSchema).optional(),
      any: z.array(ConditionSchema).optional(),
      not: ConditionSchema.optional(),
      hasEvidence: z.string().optional(),
      asked: z.string().optional(),
      opennessGte: z.tuple([z.string(), z.number().min(0).max(100)]).optional(),
    })
    .strict()
);

const dimension = z.enum(DIMENSIONS as [string, ...string[]]);
const causeType = z.enum(CAUSE_TYPES as [string, ...string[]]);

const Question = z.object({
  id: z.string().min(1),
  text: L,
  costHours: z.number().int().min(0).max(8),
  quality: z.enum(["critical", "strong", "neutral", "weak", "leading", "solution-first"]),
  kind: z.enum(["standard", "challenge"]).optional(),
  available: ConditionSchema.optional(),
  responses: z
    .array(
      z.object({
        when: ConditionSchema.optional(),
        reply: L,
        reveals: z.array(z.string()).optional(),
        opennessDelta: z.number().min(-50).max(50),
      })
    )
    .min(1),
  dimensions: z.record(dimension, z.number()),
  whyItMatters: L,
});

export const ScenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  version: z.number().int().positive(),
  category: z.enum(["strategy", "workforce", "performance", "culture", "governance"]),
  difficulty: z.enum(["foundation", "intermediate", "advanced"]),
  complexity: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  estMinutes: z.number().int().positive(),
  competencyFocus: z.array(dimension).min(1),
  budgetHours: z.number().int().positive(),
  title: L,
  summary: L,
  request: z.object({ from: z.string(), text: L }),
  organization: z.object({
    name: L,
    sector: L,
    size: L,
    background: L,
    structure: z.array(z.object({ name: L, headcount: z.number().optional(), note: L.optional() })),
  }),
  strategy: z.object({
    priorities: z.array(L).min(1),
    initiatives: z.array(L),
    successMeasures: z.array(L),
    externalPressures: z.array(L),
  }),
  evidence: z
    .array(
      z.object({
        id: z.string().min(1),
        kind: z.enum(["document", "data", "observation", "claim"]),
        title: L,
        body: L,
        sourceStakeholderId: z.string().optional(),
        sourceLabel: L.optional(),
        initiallyAvailable: z.boolean(),
        reviewCostHours: z.number().int().min(0),
        supports: z.array(z.string()),
        contradicts: z.array(z.string()),
        critical: z.boolean(),
      })
    )
    .min(1),
  stakeholders: z
    .array(
      z.object({
        id: z.string().min(1),
        role: z.enum(["ceo", "chro", "cso", "cfo", "cio", "coo", "buHead", "manager", "hrbp", "employee", "expert"]),
        name: L,
        title: L,
        perspective: L,
        objectives: z.array(L).min(1),
        concerns: z.array(L).min(1),
        bias: z.object({ type: L, note: L }),
        initialOpenness: z.number().min(0).max(100),
        questions: z.array(Question).min(1),
      })
    )
    .min(1),
  rootCauses: z
    .array(
      z.object({
        id: z.string().min(1),
        type: causeType,
        title: L,
        explanation: L,
        isTrue: z.boolean(),
        weight: z.number().min(0).max(1),
      })
    )
    .min(1),
  framing: z.object({
    prompt: L,
    options: z
      .array(z.object({ id: z.string().min(1), text: L, kind: z.enum(["solution", "cause-assumption", "symptom", "performance-gap"]), explanation: L }))
      .min(3),
  }),
  capabilityGaps: z.array(
    z.object({
      id: z.string(),
      title: L,
      nature: causeType,
      population: L,
      current: z.number().min(1).max(5),
      required: z.number().min(1).max(5),
    })
  ),
});

/**
 * Validates shape AND referential integrity (every id a scenario points at must exist).
 * Returns a list of human-readable problems; empty means valid.
 */
export function validateScenario(input: unknown): string[] {
  const parsed = ScenarioSchema.safeParse(input);
  if (!parsed.success) {
    return parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
  }
  const s = input as Scenario;
  const errors: string[] = [];
  const evidenceIds = new Set(s.evidence.map((e) => e.id));
  const stakeholderIds = new Set(s.stakeholders.map((x) => x.id));
  const causeIds = new Set(s.rootCauses.map((c) => c.id));
  const questionIds = new Set<string>();

  const dup = (kind: string, ids: string[]) => {
    const seen = new Set<string>();
    ids.forEach((id) => {
      if (seen.has(id)) errors.push(`duplicate ${kind} id "${id}"`);
      seen.add(id);
    });
  };
  dup("evidence", s.evidence.map((e) => e.id));
  dup("stakeholder", s.stakeholders.map((x) => x.id));
  dup("rootCause", s.rootCauses.map((c) => c.id));
  dup("question", s.stakeholders.flatMap((x) => x.questions.map((q) => q.id)));
  s.stakeholders.forEach((x) => x.questions.forEach((q) => questionIds.add(q.id)));

  if (!stakeholderIds.has(s.request.from)) errors.push(`request.from "${s.request.from}" is not a stakeholder`);

  s.evidence.forEach((e) => {
    [...e.supports, ...e.contradicts].forEach((c) => {
      if (!causeIds.has(c)) errors.push(`evidence "${e.id}" references unknown root cause "${c}"`);
    });
    if (e.sourceStakeholderId && !stakeholderIds.has(e.sourceStakeholderId))
      errors.push(`evidence "${e.id}" has unknown source stakeholder "${e.sourceStakeholderId}"`);
  });

  const checkCond = (where: string, c: Condition | undefined) => {
    const refs = conditionRefs(c);
    refs.evidence.forEach((id) => !evidenceIds.has(id) && errors.push(`${where}: unknown evidence "${id}"`));
    refs.questions.forEach((id) => !questionIds.has(id) && errors.push(`${where}: unknown question "${id}"`));
    refs.stakeholders.forEach((id) => !stakeholderIds.has(id) && errors.push(`${where}: unknown stakeholder "${id}"`));
  };

  const revealable = new Set(s.evidence.filter((e) => e.initiallyAvailable).map((e) => e.id));
  s.stakeholders.forEach((x) =>
    x.questions.forEach((q) => {
      checkCond(`question "${q.id}".available`, q.available);
      const last = q.responses[q.responses.length - 1];
      if (last?.when) errors.push(`question "${q.id}": last response must be unconditional`);
      q.responses.forEach((r, i) => {
        checkCond(`question "${q.id}".responses[${i}].when`, r.when);
        (r.reveals ?? []).forEach((id) => {
          if (!evidenceIds.has(id)) errors.push(`question "${q.id}" reveals unknown evidence "${id}"`);
          revealable.add(id);
        });
      });
    })
  );

  // Every evidence item must be reachable, otherwise it is dead content.
  s.evidence.forEach((e) => !revealable.has(e.id) && errors.push(`evidence "${e.id}" can never be discovered`));
  if (!s.rootCauses.some((c) => c.isTrue)) errors.push("scenario has no true root cause");
  if (!s.framing.options.some((o) => o.kind === "performance-gap")) errors.push("framing needs a performance-gap option");
  if (!s.framing.options.some((o) => o.kind === "solution")) errors.push("framing needs a solution-first distractor");
  const weights = s.rootCauses.filter((c) => c.isTrue).reduce((n, c) => n + c.weight, 0);
  if (Math.abs(weights - 1) > 0.001) errors.push(`true root-cause weights sum to ${weights}, expected 1`);
  // Product standard: beyond Foundation, individual skill gaps may explain at most 30% of the problem.
  const skillWeight = s.rootCauses.filter((c) => c.isTrue && c.type === "skill").reduce((n, c) => n + c.weight, 0);
  if (s.difficulty !== "foundation" && skillWeight > 0.3 + 1e-9)
    errors.push(`skill causes carry ${skillWeight} of the weight; the limit above Foundation is 0.3`);
  if (!s.stakeholders.some((x) => ["ceo", "coo", "cso", "cfo", "chro", "cio"].includes(x.role)))
    errors.push("scenario needs at least one executive stakeholder who owns the strategy");
  return errors;
}
