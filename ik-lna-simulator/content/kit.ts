/**
 * Authoring helpers for scenario files. They only build the plain data objects defined
 * in engine/types; the schema validator checks everything they produce.
 */
import type {
  Condition,
  Dimension,
  Evidence,
  EvidenceKind,
  L as LText,
  QuestionNode,
  QuestionQuality,
  QuestionResponse,
} from "@/engine/types";

/** Bilingual string. */
export const L = (en: string, ar: string): LText => ({ en, ar });

/** A stakeholder reply. `when` makes it conditional; the last reply of a question must be unconditional. */
export const r = (reply: LText, opennessDelta: number, reveals?: string[], when?: Condition): QuestionResponse => ({
  reply,
  opennessDelta,
  ...(reveals ? { reveals } : {}),
  ...(when ? { when } : {}),
});

/** A question card. Defaults: 1 hour, standard kind, always available. */
export const q = (
  id: string,
  quality: QuestionQuality,
  text: LText,
  responses: QuestionResponse[],
  dimensions: Partial<Record<Dimension, number>>,
  whyItMatters: LText,
  opts: { cost?: number; challenge?: boolean; available?: Condition } = {}
): QuestionNode => ({
  id,
  text,
  costHours: opts.cost ?? 1,
  quality,
  ...(opts.challenge ? { kind: "challenge" as const } : {}),
  ...(opts.available ? { available: opts.available } : {}),
  responses,
  dimensions,
  whyItMatters,
});

/** Evidence discovered in an interview (from a stakeholder). */
export const found = (
  id: string,
  kind: EvidenceKind,
  title: LText,
  body: LText,
  source: string,
  supports: string[],
  contradicts: string[],
  critical: boolean
): Evidence => ({ id, kind, title, body, sourceStakeholderId: source, initiallyAvailable: false, reviewCostHours: 0, supports, contradicts, critical });

/** A Stage 1 document in the documents pack. */
export const doc = (
  id: string,
  kind: EvidenceKind,
  title: LText,
  body: LText,
  sourceLabel: LText,
  supports: string[],
  contradicts: string[],
  critical: boolean,
  reviewCostHours = 1
): Evidence => ({ id, kind, title, body, sourceLabel, initiallyAvailable: true, reviewCostHours, supports, contradicts, critical });

export const has = (evidenceId: string): Condition => ({ hasEvidence: evidenceId });
export const open = (stakeholderId: string, min: number): Condition => ({ opennessGte: [stakeholderId, min] });
