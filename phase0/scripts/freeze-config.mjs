// Records the hash of the scoring configuration (rules, matrices, schemas, prompts, critic rules).
// Run once and commit. Re-freezing after held-out results have been seen must be documented in doc 14 §3,
// and invalidates earlier held-out results for comparison purposes.
// Usage: node scripts/freeze-config.mjs "<reason>"
import fs from "node:fs";
import { execSync } from "node:child_process";
import { configHash } from "../lib/integrity.mjs";
const reason = process.argv[2];
if (!reason) { console.error('usage: freeze-config.mjs "<reason>"'); process.exit(1); }
const h = configHash();
const rec = { ...h, frozen_at: new Date().toISOString(), git_head: execSync("git rev-parse HEAD").toString().trim(), reason, recommender_rule_set: "v0.3b" };
fs.writeFileSync(new URL("../lib/frozen-config.json", import.meta.url), JSON.stringify(rec, null, 1) + "\n");
console.log(JSON.stringify(rec, null, 1));
