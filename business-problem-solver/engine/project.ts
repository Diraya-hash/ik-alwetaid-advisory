// Project model, validation (for import and recovery) and version snapshots.
import { z } from "zod";
import { emptyIntake, type Intake } from "./intake";
import { APPROACH_IDS, DOMAINS, SCOPES, STAGES, type ApproachId } from "./types";

export const SCHEMA_VERSION = 1;

export interface Project {
  id: string;
  title: string;
  challenge: string;
  createdAt: number;
  updatedAt: number;
  intake: Intake;
  intakeStep: number;
  intakeDone: boolean;
  /** Frameworks the user chose to work on, in order. */
  chosen: ApproachId[];
  /** Builder data keyed by framework id (validated by each builder). */
  frameworks: Record<string, unknown>;
}

export interface Version {
  id: string;
  at: number;
  label: string;
  kind: "auto" | "manual" | "milestone" | "before_restore";
  snapshot: Project;
}

export const newId = (prefix = "p") => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function newProject(challenge: string): Project {
  const now = Date.now();
  const firstLine = challenge.trim().split(/\n/)[0] ?? "";
  const title = firstLine.length > 72 ? `${firstLine.slice(0, 70).trimEnd()}…` : firstLine;
  return { id: newId(), title, challenge: challenge.trim(), createdAt: now, updatedAt: now, intake: emptyIntake(), intakeStep: 0, intakeDone: false, chosen: [], frameworks: {} };
}

const statement = z.object({ id: z.string(), role: z.enum(["symptom", "cause", "goal", "impact", "constraint", "context"]), text: z.string().max(2000), truth: z.enum(["verified", "unverified", "assumption"]) });
const intakeSchema = z.object({
  stagePrimary: z.enum(STAGES).nullable(),
  stageSecondary: z.enum(STAGES).nullable(),
  domains: z.array(z.enum(DOMAINS)).max(3),
  scope: z.enum(SCOPES).nullable(),
  outOfScope: z.enum(["none", "legal_advice", "medical", "personal_matter", "individual_employment_decision", "unlawful", "non_business", "financial_modelling"]),
  statements: z.array(statement).max(200),
  symptomClarity: z.enum(["concrete", "vague"]),
  stakeholders: z.array(z.string().max(200)).max(100),
  deadline: z.string().nullable(),
  options: z.array(z.string().max(500)).max(50),
  recurrence: z.enum(["one_off", "recurring", "chronic"]).nullable(),
  causalComplexity: z.number().int().min(1).max(5).nullable(),
  processBoundaries: z.boolean().nullable(),
  stepsKnown: z.boolean().nullable(),
  measurableSymptom: z.boolean().nullable(),
  dataAvailable: z.enum(["none", "anecdotal", "some", "good"]).nullable(),
  newInitiative: z.boolean(),
  externalFocus: z.boolean(),
  structureFocus: z.enum(["reporting_lines", "delivery_model", "none"]),
  itemsAreThreats: z.boolean(),
});
export const projectSchema = z.object({
  id: z.string().min(1).max(80),
  title: z.string().max(200),
  challenge: z.string().max(10000),
  createdAt: z.number(),
  updatedAt: z.number(),
  intake: intakeSchema.catch(emptyIntake()),
  intakeStep: z.number().int().min(0).max(20),
  intakeDone: z.boolean(),
  chosen: z.array(z.enum(APPROACH_IDS)).max(15),
  frameworks: z.record(z.unknown()),
});
const versionSchema = z.object({ id: z.string(), at: z.number(), label: z.string().max(200), kind: z.enum(["auto", "manual", "milestone", "before_restore"]), snapshot: projectSchema });

/** The persisted workspace and the JSON backup format. */
export const workspaceSchema = z.object({
  schema: z.literal(SCHEMA_VERSION),
  projects: z.record(projectSchema),
  versions: z.record(z.array(versionSchema)),
});
export type Workspace = z.infer<typeof workspaceSchema>;

/** File format for exports: one project (with its history) or the whole workspace. */
export const exportFileSchema = z.object({
  app: z.literal("business-problem-solver"),
  kind: z.enum(["project", "workspace"]),
  exportedAt: z.string(),
  data: workspaceSchema,
});
export type ExportFile = z.infer<typeof exportFileSchema>;

export const MAX_VERSIONS = 40;
/** Keeps manual/milestone versions preferentially when trimming history. */
export function trimVersions(vs: Version[]): Version[] {
  if (vs.length <= MAX_VERSIONS) return vs;
  const auto = vs.filter((v) => v.kind === "auto" || v.kind === "before_restore");
  const drop = new Set(auto.slice(0, vs.length - MAX_VERSIONS).map((v) => v.id));
  const kept = vs.filter((v) => !drop.has(v.id));
  return kept.slice(-MAX_VERSIONS);
}

