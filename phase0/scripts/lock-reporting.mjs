// Locks the reporting layer (lib/integrity.mjs REPORTING_FILES) for the current evaluation version.
// Refuses once the evaluation version has any model result; changes then require a new evaluation version.
// Usage: node scripts/lock-reporting.mjs "<reason>"
import fs from "node:fs";
import { execSync } from "node:child_process";
import { reportingHash, readFrozen, evaluationStarted } from "../lib/integrity.mjs";
const reason = process.argv[2];
if (!reason) { console.error('usage: lock-reporting.mjs "<reason>"'); process.exit(1); }
const v = readFrozen()?.eval_version ?? 1;
if (evaluationStarted(v)) { console.error(`REFUSED: evaluation version ${v} already has model results. Reporting changes require a new evaluation version.`); process.exit(2); }
const rec = { eval_version: v, ...reportingHash(), locked_at: new Date().toISOString(), git_head: execSync("git rev-parse HEAD").toString().trim(), reason };
fs.writeFileSync(new URL("../lib/reporting-lock.json", import.meta.url), JSON.stringify(rec, null, 1) + "\n");
fs.appendFileSync(new URL("../lib/frozen-config-history.jsonl", import.meta.url), JSON.stringify({ reporting_lock: true, eval_version: v, combined: rec.combined, locked_at: rec.locked_at, reason }) + "\n");
console.log(JSON.stringify({ eval_version: v, combined: rec.combined, files: Object.keys(rec.files) }, null, 1));
