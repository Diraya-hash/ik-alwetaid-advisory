// Seals an evaluation set: writes <set>.SEAL.json with its SHA-256. Commit the set and the seal together,
// BEFORE any scoring. Usage: node scripts/seal-set.mjs eval/heldout/heldout-v1.json "<provenance>"
import fs from "node:fs";
import { execSync } from "node:child_process";
import { sha256 } from "../lib/integrity.mjs";
const [setPath, provenance] = process.argv.slice(2);
if (!setPath || !provenance) { console.error('usage: seal-set.mjs <set.json> "<provenance>"'); process.exit(1); }
const buf = fs.readFileSync(setPath); const d = JSON.parse(buf);
const sc = d.scenarios || [];
const rec = { file: setPath, sha256: sha256(buf), sealed_at: new Date().toISOString(), git_head: execSync("git rev-parse HEAD").toString().trim(),
  provenance, scenarios: sc.length, arabic: sc.filter(s => s.language === "ar").length,
  by_category: sc.reduce((a, s) => ((a[s.category] = (a[s.category] || 0) + 1), a), {}),
  rule: "Do not modify. Do not use to tune rules, prompts or matrices. Score only with a frozen configuration." };
fs.writeFileSync(setPath.replace(/\.json$/, ".SEAL.json"), JSON.stringify(rec, null, 1) + "\n");
console.log(JSON.stringify(rec, null, 1));
