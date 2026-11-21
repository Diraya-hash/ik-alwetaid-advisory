// Freezes the scoring configuration (lib/integrity.mjs CONFIG_FILES) for an evaluation version.
//   node scripts/freeze-config.mjs "<reason>"                          # (re-)freeze the CURRENT version — only allowed
//                                                                     #  while that version has produced no model result
//   node scripts/freeze-config.mjs "<reason>" --new-eval-version=2     # start a new evaluation version (required once
//                                                                     #  the current version has results)
// Every freeze is appended to lib/frozen-config-history.jsonl. Results are always tagged with their eval version.
import fs from "node:fs";
import { execSync } from "node:child_process";
import { configHash, readFrozen, evaluationStarted } from "../lib/integrity.mjs";
const reason = process.argv[2];
const nv = (process.argv.find(a => a.startsWith("--new-eval-version=")) || "").split("=")[1];
if (!reason || reason.startsWith("--")) { console.error('usage: freeze-config.mjs "<reason>" [--new-eval-version=N]'); process.exit(1); }
const prev = readFrozen(); const current = prev?.eval_version ?? 1;
let version = current;
if (nv) {
  if (+nv !== current + 1) { console.error(`--new-eval-version must be ${current + 1}`); process.exit(1); }
  version = +nv;
} else if (prev && evaluationStarted(current)) {
  console.error(`REFUSED: evaluation version ${current} already has model results. Changes require --new-eval-version=${current + 1} (doc 14 §3).`);
  process.exit(2);
}
const h = configHash();
const rec = { eval_version: version, ...h, frozen_at: new Date().toISOString(), git_head: execSync("git rev-parse HEAD").toString().trim(),
  reason, recommender_rule_set: "v0.3b", supersedes: prev ? { eval_version: prev.eval_version ?? 1, combined: prev.combined, frozen_at: prev.frozen_at } : null };
fs.writeFileSync(new URL("../lib/frozen-config.json", import.meta.url), JSON.stringify(rec, null, 1) + "\n");
fs.appendFileSync(new URL("../lib/frozen-config-history.jsonl", import.meta.url), JSON.stringify({ eval_version: version, combined: h.combined, frozen_at: rec.frozen_at, reason }) + "\n");
console.log(JSON.stringify({ eval_version: version, combined: h.combined, reason }, null, 1));
