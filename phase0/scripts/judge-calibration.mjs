// EV-5 judge calibration. LLM-judge metrics (must-surface coverage, hearsay handling, options rubric) only count
// for Gate 0 after a human grader agrees with the judge on a sample (target agreement >= 0.80).
//   export:  node scripts/judge-calibration.mjs export results/llm-a-high-heldout.json 40  > calib.csv
//   score:   node scripts/judge-calibration.mjs score calib.csv
// The CSV has an empty `human_verdict` column (yes|partial|no) for a reviewer who has NOT seen the judge column
// (hide it while grading). Agreement counts exact matches; 'partial' vs 'yes' counts as a half match.
import fs from "node:fs";
const [mode, file, nArg] = process.argv.slice(2);
const q = s => `"${String(s ?? "").replace(/"/g, '""')}"`;
if (mode === "export") {
  const { rows } = JSON.parse(fs.readFileSync(file));
  const { scenarios } = JSON.parse(fs.readFileSync(new URL(`../eval/${file.includes("heldout") ? "heldout/heldout-v1.json" : "scenarios.json"}`, import.meta.url)));
  const items = rows.flatMap(r => (r.judgeItems || []).map(j => ({ id: r.id, run: r.run, ...j })));
  let seed = 11; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const sample = items.map(x => [rnd(), x]).sort((a, b) => a[0] - b[0]).slice(0, +(nArg || 40)).map(x => x[1]);
  console.log("scenario_id,run,item_key,question,challenge_text,judge_verdict,human_verdict");
  for (const s of sample) console.log([s.id, s.run, s.key, q(s.ask), q(scenarios.find(x => x.id === s.id)?.text), s.verdict, ""].join(","));
} else if (mode === "score") {
  const lines = fs.readFileSync(file, "utf8").trim().split("\n").slice(1);
  const parse = l => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(c => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"'));
  let n = 0, agree = 0;
  for (const l of lines) { const c = parse(l); const j = c[5], h = c[6]; if (!h) continue; n++; agree += j === h ? 1 : (new Set([j, h]).has("partial") ? 0.5 : 0); }
  console.log(JSON.stringify({ graded: n, agreement: n ? +(agree / n).toFixed(3) : null, threshold: 0.8, passes: n >= 20 && agree / n >= 0.8 }));
} else console.error("usage: judge-calibration.mjs export <results.json> [n] | score <graded.csv>");
