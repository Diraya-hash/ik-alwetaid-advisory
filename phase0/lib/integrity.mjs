// Anti-tuning controls (doc 14 §3). Everything that affects a score is hash-locked: rules, matrices, schemas, prompts,
// critic rules, graders and the pricing table. Every evaluation set is sealed. Once an evaluation version has produced
// any model result, its configuration can no longer be re-frozen; changes require a NEW evaluation version.
import fs from "node:fs";
import crypto from "node:crypto";
const root = new URL("../", import.meta.url);
export const CONFIG_FILES = [
  "lib/catalogue.mjs", "lib/recommender.mjs", "lib/schemas.mjs", "lib/prompts.mjs", "lib/critic-rules.mjs", // decision logic & prompts
  "lib/llm.mjs",                                                                                            // models, pricing, call settings
  "experiments/llm-suite.mjs", "experiments/f-cost-latency.mjs",                                            // graders & metrics
];
export const sha256 = buf => crypto.createHash("sha256").update(buf).digest("hex");
export function configHash() {
  const parts = CONFIG_FILES.map(f => [f, sha256(fs.readFileSync(new URL(f, root)))]);
  return { files: Object.fromEntries(parts), combined: sha256(parts.map(p => p.join(":")).join("\n")) };
}
const FROZEN = new URL("lib/frozen-config.json", root);
export function readFrozen() { return fs.existsSync(FROZEN) ? JSON.parse(fs.readFileSync(FROZEN)) : null; }
export function checkFrozen() {
  const fz = readFrozen(), now = configHash();
  if (!fz) return { ok: false, reason: "no frozen-config.json", now };
  if (fz.combined !== now.combined) {
    const changed = Object.keys(now.files).filter(k => fz.files?.[k] !== now.files[k]);
    return { ok: false, reason: `configuration changed since freeze: ${changed.join(", ")}`, now, frozen: fz };
  }
  return { ok: true, now, frozen: fz };
}
export function checkSeal(setPath) {
  const sealPath = setPath.replace(/\.json$/, ".SEAL.json");
  if (!fs.existsSync(sealPath)) return { ok: false, reason: `no seal file ${sealPath}` };
  const seal = JSON.parse(fs.readFileSync(sealPath)); const h = sha256(fs.readFileSync(setPath));
  return h === seal.sha256 ? { ok: true, seal } : { ok: false, reason: `${setPath.split("/phase0/")[1]} modified after sealing`, seal, now: h };
}
/** Has evaluation version `v` produced any (non-dry-run) model result? */
export function evaluationStarted(v) {
  const runsDir = new URL("results/runs/", root);
  if (fs.existsSync(runsDir) && fs.readdirSync(runsDir).some(f => f.startsWith(`ev${v}-`))) return true;
  const log = new URL("results/llm-runs.jsonl", root);
  if (fs.existsSync(log)) return fs.readFileSync(log, "utf8").split("\n").some(l => l.includes(`"eval_version":"${v}"`));
  return false;
}
// Reporting layer (thresholds, GO/NO-GO generator, calibration tool, workbook tools): locked separately so the eval-v1
// scoring freeze stays untouched. Same rule: cannot be re-locked once the evaluation version has results.
export const REPORTING_FILES = ["eval/thresholds-v1.json", "scripts/evidence-report.mjs", "scripts/human-eval.mjs",
  "lib/assumption-integrity.mjs", "scripts/assumption-judge.mjs",
  "experiments/e-pptx/summarize_manual_results.py", "experiments/e-pptx/make_results_template.py"];
const REPORTING_LOCK = new URL("lib/reporting-lock.json", root);
export function reportingHash() {
  const parts = REPORTING_FILES.map(f => [f, sha256(fs.readFileSync(new URL(f, root)))]);
  return { files: Object.fromEntries(parts), combined: sha256(parts.map(p => p.join(":")).join("\n")) };
}
export function checkReportingLock() {
  if (!fs.existsSync(REPORTING_LOCK)) return { ok: false, reason: "no reporting-lock.json" };
  const lk = JSON.parse(fs.readFileSync(REPORTING_LOCK)), now = reportingHash();
  if (lk.combined !== now.combined) return { ok: false, reason: `reporting layer changed since lock: ${Object.keys(now.files).filter(k => lk.files[k] !== now.files[k]).join(", ")}` };
  return { ok: true, lock: lk };
}
export const SEALED_SETS = ["eval/scenarios.json", "eval/heldout/heldout-v1.json", "eval/critic-semantic.json", "eval/certainty-wording.json"];
export function verifyAll() {
  const out = { config: checkFrozen(), reporting: checkReportingLock(), seals: Object.fromEntries(SEALED_SETS.map(s => [s, checkSeal(new URL(s, root).pathname)])) };
  out.ok = out.config.ok && out.reporting.ok && Object.values(out.seals).every(x => x.ok);
  return out;
}
