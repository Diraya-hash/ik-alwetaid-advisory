import type { Condition, SimState } from "./types";

/** Evaluates a scenario condition against the current simulation state. */
export function evaluate(cond: Condition | undefined, state: SimState): boolean {
  if (!cond) return true;
  if (cond.all && !cond.all.every((c) => evaluate(c, state))) return false;
  if (cond.any && !cond.any.some((c) => evaluate(c, state))) return false;
  if (cond.not && evaluate(cond.not, state)) return false;
  if (cond.hasEvidence && !state.discovered.includes(cond.hasEvidence)) return false;
  if (cond.asked && !state.asked.includes(cond.asked)) return false;
  if (cond.opennessGte) {
    const [sid, min] = cond.opennessGte;
    if ((state.openness[sid] ?? 0) < min) return false;
  }
  return true;
}

/** Collects every id referenced by a condition, for referential-integrity checks. */
export function conditionRefs(cond: Condition | undefined): {
  evidence: string[];
  questions: string[];
  stakeholders: string[];
} {
  const out = { evidence: [] as string[], questions: [] as string[], stakeholders: [] as string[] };
  const walk = (c: Condition | undefined) => {
    if (!c) return;
    c.all?.forEach(walk);
    c.any?.forEach(walk);
    walk(c.not);
    if (c.hasEvidence) out.evidence.push(c.hasEvidence);
    if (c.asked) out.questions.push(c.asked);
    if (c.opennessGte) out.stakeholders.push(c.opennessGte[0]);
  };
  walk(cond);
  return out;
}
