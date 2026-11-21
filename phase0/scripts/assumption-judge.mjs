// AI-judge pass for S7 "Conditional Recommendation Assumption Integrity" (reporting layer; thresholds-v1.json).
// Reads the stored outputs of a held-out experiment-A run; calls the judge ONLY for eligible cases (ambiguous case +
// conditional recommendation actually provided); writes an immutable results/runs/ev<V>-heldout-aij-<effort>-<ts>.json.
// Frozen scoring components are imported, never modified. Refuses unless the config is frozen, the held-out seal is
// intact, the reporting layer is locked and the source run is a real run of the frozen eval version.
// Usage: node scripts/assumption-judge.mjs --set=heldout [--effort=high] [--a=<results/runs/ev1-heldout-a-...json>] [--max-usd=15]
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { structured, MODELS, DRY_RUN, spentUsd } from "../lib/llm.mjs";
import { Judge } from "../lib/schemas.mjs";
import { checkFrozen, checkSeal, checkReportingLock } from "../lib/integrity.mjs";
import { ITEMS, AIJ_SYSTEM, segmentOf, eligibility, judgeUserMessage, rowPass, rowComplete } from "../lib/assumption-integrity.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const flag = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || "").slice(k.length + 3);
const EFFORT = flag("effort") || "high";
if (flag("set") !== "heldout") { console.error("REFUSED: run with --set=heldout (S7 is evaluated on the held-out set only)."); process.exit(1); }
const fz = checkFrozen(), seal = checkSeal(path.join(root, "eval/heldout/heldout-v1.json")), rl = checkReportingLock();
if (!fz.ok || !seal.ok || !rl.ok) { console.error("REFUSING to run:", !fz.ok ? fz.reason : !seal.ok ? seal.reason : rl.reason); process.exit(2); }
const EV = fz.frozen.eval_version ?? 1, RUNS = path.join(root, "results/runs");
let aPath = flag("a");
if (!aPath) { const f = fs.existsSync(RUNS) ? fs.readdirSync(RUNS).filter(x => x.startsWith(`ev${EV}-heldout-a-${EFFORT}-`)).sort() : []; aPath = f.length ? path.join(RUNS, f.at(-1)) : ""; }
if (!aPath || !fs.existsSync(aPath)) { console.error(`No held-out experiment-A run found for ev${EV} / ${EFFORT}. Run experiment A first.`); process.exit(2); }
const A = JSON.parse(fs.readFileSync(aPath)), m = A.manifest || {};
const bad = [!String(m.run_id || "").startsWith(`ev${EV}-heldout-a-`) && "not a real held-out A run", m.eval_version !== EV && "eval version mismatch",
  m.config_hash !== fz.frozen.combined && "config hash ≠ frozen", m.set_sha256 !== seal.seal.sha256 && "held-out seal mismatch"].filter(Boolean);
if (bad.length) { console.error(`REFUSED source ${path.basename(aPath)}: ${bad.join("; ")}`); process.exit(2); }
const SC = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(root, "eval/heldout/heldout-v1.json"))).scenarios.map(s => [s.id, s]));

const RUN_ID = `ev${EV}-heldout-aij-${EFFORT}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
process.env.BPS_RUN_ID = RUN_ID; process.env.BPS_EVAL_VERSION = String(EV);
const rows = [];
for (const r of A.rows.filter(x => SC[x.id] && segmentOf(SC[x.id]) === "ambiguous")) { // every ambiguous row is listed, eligible or not (auditable)
  const el = eligibility(r, SC[r.id]); const row = { id: r.id, run: r.run, lang: r.lang, eligible: el.eligible, eligibility_reason: el.reason };
  if (el.eligible) {
    const jd = await structured({ route: "judge", scenario: r.id, model: MODELS.judge, effort: "low", system: AIJ_SYSTEM, schema: Judge, user: judgeUserMessage(SC[r.id], r) });
    if (jd.dryRun) { row.dry_run = true; rows.push(row); continue; }
    const v = Object.fromEntries((jd.parsed?.items || []).map(i => [i.key, i.verdict]));
    row.verdicts = Object.fromEntries(ITEMS.map(i => [i.key, v[i.key] ?? null]));
    row.notes = Object.fromEntries((jd.parsed?.items || []).filter(i => ITEMS.some(x => x.key === i.key)).map(i => [i.key, i.note]));
    row.complete = rowComplete(row.verdicts); row.pass = row.complete ? rowPass(row.verdicts) : null;
    if (!jd.parsed) row.judge_error = jd.record.error || jd.record.stop_reason;
  }
  rows.push(row);
}
const summary = { ambiguous_rows: rows.length, eligible_rows: rows.filter(r => r.eligible).length, judged_complete: rows.filter(r => r.complete).length };
if (DRY_RUN) { console.log(JSON.stringify({ dry_run: true, would_judge: summary.eligible_rows, ...summary }, null, 1)); process.exit(0); } // nothing written in dry run
const manifest = { run_id: RUN_ID, eval_version: EV, experiment: "aij", metric: "S7.conditional_assumption_integrity", set: "heldout",
  source_run_id: m.run_id, source_file: path.relative(root, aPath), config_hash: fz.frozen.combined, reporting_lock: rl.lock.combined,
  judge_model: MODELS.judge, judge_effort: "low", items: ITEMS.map(i => i.key),
  git_head: (() => { try { return execSync("git rev-parse HEAD").toString().trim(); } catch { return null; } })(),
  finished_at: new Date().toISOString(), spent_usd: +spentUsd().toFixed(4) };
fs.mkdirSync(RUNS, { recursive: true });
fs.writeFileSync(path.join(RUNS, `${RUN_ID}.json`), JSON.stringify({ manifest, summary, rows }, null, 1), { flag: "wx" });
console.log(JSON.stringify({ run_id: RUN_ID, ...summary }, null, 1));
