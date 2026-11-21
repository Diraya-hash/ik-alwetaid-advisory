// Consolidated, evidence-based GO/NO-GO report (doc 14 §8b, doc 18). Reads ONLY real, integrity-checked inputs:
//   - held-out model runs (results/runs/ev<V>-heldout-{a,b,c}-<effort>-*.json) for the frozen eval version
//   - per-call measurements (results/llm-runs.jsonl) for those runs → cost & latency
//   - blinded human calibration round (comparison-report.json + adjudicated disagreements-summary.json)
//   - PowerPoint manual results summary (summarize_manual_results.py output)
//   - thresholds (eval/thresholds-v1.json)
// Every gate is evaluated SEPARATELY for Arabic and English; pooled numbers never decide. Missing prerequisite → NO-GO.
// Evidence classes are kept separate. Synthetic inputs are refused (or, with --allow-synthetic for tool testing only,
// the report is watermarked and the verdict forced to INVALID).
// Usage: node scripts/evidence-report.mjs [--effort=high] [--human=<round dir>] [--pptx=<manual-summary.json>] [--out=reports] [--allow-synthetic]
import fs from "node:fs";
import path from "node:path";
import { checkFrozen, checkSeal, verifyAll } from "../lib/integrity.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const flag = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || "").slice(k.length + 3);
const EFFORT = flag("effort") || "high", HUMAN = flag("human"), PPTX = flag("pptx"), OUT = flag("out") || path.join(root, "reports");
const RUNS_DIR = flag("runs-dir") || path.join(root, "results/runs"), LOG = flag("log") || path.join(root, "results/llm-runs.jsonl");
const ALLOW_SYN = process.argv.includes("--allow-synthetic");
const T = JSON.parse(fs.readFileSync(path.join(root, "eval/thresholds-v1.json")));
const LANGS = ["ar", "en"]; const SEGS = T.segments.order;
const fz = checkFrozen(); const EV = fz.frozen?.eval_version ?? 1;
const problems = [], prereq = {}, synthetic = [];

// ---------- helpers
const wilson = (k, n) => { if (!n) return null; const z = 1.96, p = k / n, d = 1 + z * z / n, c = (p + z * z / (2 * n)) / d, h = (z * Math.sqrt(p * (1 - p) / n + z * z / (4 * n * n))) / d; return [+(c - h).toFixed(3), +(c + h).toFixed(3)]; };
const rate = (arr, f) => arr.length ? { value: +(arr.filter(f).length / arr.length).toFixed(3), k: arr.filter(f).length, n: arr.length, ci95: wilson(arr.filter(f).length, arr.length) } : { value: null, n: 0 };
const mean = (arr, f) => { const v = arr.map(f).filter(x => x != null && !isNaN(x)); return v.length ? { value: +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(3), n: v.length } : { value: null, n: 0 }; };
const cmp = (v, op, t) => v == null ? null : op === ">=" ? v >= t : v <= t;
const fmt = m => m?.value == null ? "—" : `${m.value}${m.ci95 ? ` [${m.ci95[0]}–${m.ci95[1]}]` : ""} (n=${m.n})`;
function segmentOf(sc) {
  const e = sc.expected; const doms = e.domains_any_of || [];
  if (e.gate === "ask" || sc.category === "insufficient_context") return "incomplete_information";
  if (sc.category === "out_of_scope" || doms.includes("X.OUT_OF_SCOPE")) return "out_of_scope";
  if (e.recommendation?.no_good_fit || sc.category === "no_good_fit") return "outside_catalogue";
  if (sc.category === "ambiguous") return "ambiguous";
  return "clear";
}
function loadRun(exp) {
  if (!fs.existsSync(RUNS_DIR)) return null;
  const files = fs.readdirSync(RUNS_DIR).filter(f => f.startsWith(`ev${EV}-heldout-${exp}-${EFFORT}-`)).sort();
  if (!files.length) return null;
  const f = path.join(RUNS_DIR, files.at(-1)); const d = JSON.parse(fs.readFileSync(f)); const m = d.manifest || {};
  const seal = checkSeal(path.join(root, "eval/heldout/heldout-v1.json"));
  const issues = [];
  if (!String(m.run_id || "").startsWith("ev")) issues.push("not a real run id");
  if (m.eval_version !== EV) issues.push(`eval_version ${m.eval_version} ≠ frozen ${EV}`);
  if (m.config_hash !== fz.frozen?.combined) issues.push("config hash ≠ frozen config");
  if (m.set !== "heldout") issues.push("not the held-out set");
  if (exp !== "c" && m.set_sha256 !== seal.seal?.sha256) issues.push("held-out seal mismatch");
  if (issues.length) { if (ALLOW_SYN) synthetic.push(`${path.basename(f)}: ${issues.join("; ")}`); else { problems.push(`REFUSED input ${path.basename(f)}: ${issues.join("; ")}`); return null; } }
  return { file: path.relative(root, f), ...d };
}

// ---------- inputs
if (!fz.ok) problems.push(`Frozen configuration check failed: ${fz.reason}`);
{ const v = verifyAll(); if (!v.reporting.ok) problems.push(`Reporting-layer lock check failed: ${v.reporting.reason}`);
  for (const [k, s] of Object.entries(v.seals)) if (!s.ok) problems.push(`Seal check failed: ${k}: ${s.reason}`); }
const { scenarios } = JSON.parse(fs.readFileSync(path.join(root, "eval/heldout/heldout-v1.json")));
const SC = Object.fromEntries(scenarios.map(s => [s.id, s]));
const critic = JSON.parse(fs.readFileSync(path.join(root, "eval/critic-semantic.json"))).artifacts;
const CR = Object.fromEntries(critic.map(a => [a.id, a]));
const A = loadRun("a"), B = loadRun("b"), C = loadRun("c");
prereq["A: held-out diagnosis & recommendation run"] = !!A; prereq["B: held-out strategic options run"] = !!B; prereq["C: critic run"] = !!C;
const runIds = new Set([A, B, C].filter(Boolean).map(x => x.manifest.run_id));
const logRecs = fs.existsSync(LOG) ? fs.readFileSync(LOG, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse).filter(r => !r.dry_run && runIds.has(r.run_id)) : [];
prereq["F: measured cost & latency for those runs"] = logRecs.length > 0;
let human = null, humanSum = null;
if (HUMAN) {
  const cr = path.join(HUMAN, "comparison-report.json"), ds = path.join(HUMAN, "disagreements-summary.json");
  if (fs.existsSync(cr)) human = JSON.parse(fs.readFileSync(cr));
  if (fs.existsSync(ds)) humanSum = JSON.parse(fs.readFileSync(ds));
  if (human && !String(human.source_run_id || "").startsWith("ev")) { if (ALLOW_SYN) synthetic.push("human calibration round: synthetic source"); else { problems.push("REFUSED human calibration: not linked to a real model run"); human = null; } }
  if (human && A && human.source_run_id !== A.manifest.run_id && !ALLOW_SYN) problems.push(`Human calibration was done on run ${human.source_run_id}, not on the evaluated run ${A.manifest.run_id}`);
}
prereq["Human calibration completed (blinded, adjudicated)"] = !!(human && humanSum?.complete);
let pptx = PPTX && fs.existsSync(PPTX) ? JSON.parse(fs.readFileSync(PPTX)) : null;
prereq["PowerPoint cross-platform manual test completed"] = pptx?.status === "complete";
const calibrated = Object.fromEntries(LANGS.map(l => [l, !!human?.per_language_gate?.[l]?.passes && !!humanSum?.complete]));

// ---------- A metrics per language × segment
function aMetrics(rows) {
  const rec = rows.filter(r => r.top1Acceptable !== undefined);
  const stmts = rows.reduce((s, r) => s + (r.output?.statements?.length || 0), 0);
  const byScen = {}; rows.forEach(r => (byScen[r.id] ||= []).push(`${r.status}:${r.top3?.[0]}`));
  return {
    stage_accuracy: rate(rows.filter(r => r.stageOk != null), r => r.stageOk), domain_accuracy: rate(rows.filter(r => r.domainOk != null), r => r.domainOk),
    top1_acceptable: rate(rec, r => r.top1Acceptable), top3_hit: rate(rec, r => r.top3Hit), unacceptable_in_top3: rate(rec, r => (r.unacceptable || []).length > 0),
    false_nofit_rate: rate(rec, r => r.status === "no_good_fit" || r.status === "out_of_scope"), false_gate_block_rate: rate(rec, r => r.status === "insufficient_context"),
    ask_rate: rate(rows.filter(r => SC[r.id] && segmentOf(SC[r.id]) === "incomplete_information"), r => r.status === "insufficient_context"),
    nofit_or_decline_recall: rate(rows.filter(r => SC[r.id] && ["outside_catalogue", "out_of_scope"].includes(segmentOf(SC[r.id]))), r => r.status === "no_good_fit" || r.status === "out_of_scope"),
    typing_violation_rate: stmts ? { value: +(rows.reduce((s, r) => s + (r.typingViolations || 0), 0) / stmts).toFixed(4), n: stmts } : { value: null, n: 0 },
    hearsay_handled: mean(rows, r => r.hearsayHandled), surface_coverage: mean(rows, r => r.surfaceCoverage),
    out_of_candidate_recs: { value: rows.reduce((s, r) => s + (r.outOfCandidate || 0), 0), n: rows.length },
    top1_stability: rate(Object.values(byScen).filter(v => v.length > 1), v => new Set(v).size === 1),
    pass_rate: rate(rows, r => r.pass), errors: rows.filter(r => !r.ok).length,
  };
}
const aRows = A ? A.rows.filter(r => SC[r.id]) : [];
const aBy = Object.fromEntries(LANGS.map(l => [l, Object.fromEntries([...SEGS.map(s => [s, aMetrics(aRows.filter(r => r.lang === l && segmentOf(SC[r.id]) === s))]), ["all", aMetrics(aRows.filter(r => r.lang === l))]])]));
const aUnion = (l, segs) => segs.includes("all") ? aMetrics(aRows.filter(r => r.lang === l)) : aMetrics(aRows.filter(r => r.lang === l && segs.includes(segmentOf(SC[r.id]))));

// ---------- B, C, F per language
function bMetrics(rows) {
  const s = rows.filter(r => r.scores); const crit = ["distinctness", "relevance_to_causes_and_goals", "rationale_soundness", "assessment_plausibility", "trade_off_clarity", "language_quality"];
  const cm = Object.fromEntries(crit.map(c => [c, mean(s, r => r.scores[c]).value]));
  return { structural_pass: rate(rows.filter(r => r.ok), r => r.structuralPass), rubric_overall_mean: mean(s, r => crit.reduce((a, c) => a + r.scores[c], 0) / crit.length),
    rubric_min_criterion_mean: { value: s.length ? Math.min(...Object.values(cm)) : null, n: s.length }, rubric_by_criterion: cm,
    no_fabricated_facts: rate(s, r => r.items?.no_fabricated_facts === "yes"), errors: rows.filter(r => !r.ok).length };
}
function cMetrics(rows) {
  const seeded = rows.filter(r => !r.clean && !r.error), clean = rows.filter(r => r.clean && !r.error);
  const sum = (a, f) => a.reduce((s, r) => s + f(r), 0);
  return { recall: { value: sum(seeded, r => r.seeded) ? +(sum(seeded, r => r.recalled) / sum(seeded, r => r.seeded)).toFixed(3) : null, n: sum(seeded, r => r.seeded), ci95: wilson(sum(seeded, r => r.recalled), sum(seeded, r => r.seeded)) },
    serious_precision: { value: sum(seeded, r => r.serious) ? +(sum(seeded, r => r.seriousMatched) / sum(seeded, r => r.serious)).toFixed(3) : null, n: sum(seeded, r => r.serious) },
    serious_false_alarms_per_clean_run: { value: clean.length ? +(sum(clean, r => r.serious) / clean.length).toFixed(3) : null, n: clean.length },
    explanation_and_correction: rate(rows.filter(r => !r.error), r => r.allHaveExplanationAndCorrection) };
}
const bBy = Object.fromEntries(LANGS.map(l => [l, B ? bMetrics(B.rows.filter(r => r.lang === l)) : null]));
const cBy = Object.fromEntries(LANGS.map(l => [l, C ? cMetrics(C.rows.filter(r => (r.lang || CR[r.id]?.language) === l)) : null]));
const langOfRec = r => SC[r.scenario]?.language || CR[r.scenario]?.language || null;
const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
function fMetrics(recs) {
  const by = route => recs.filter(r => r.route === route);
  const mc = route => { const v = by(route).filter(r => r.cost_usd != null).map(r => r.cost_usd); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const parts = ["diagnosis", "rerank", "options", "critic-framework", "critic-project"].map(mc);
  return { calls: recs.length, diagnosis_latency_p90_ms: { value: q(by("diagnosis").map(r => r.latency_ms), 0.9), n: by("diagnosis").length },
    rerank_latency_p90_ms: { value: q(by("rerank").map(r => r.latency_ms), 0.9), n: by("rerank").length },
    refusal_rate: rate(recs, r => r.stop_reason === "refusal"), parse_failure_rate: rate(recs.filter(r => r.usage), r => !r.parsed_ok),
    cost_per_single_framework_analysis_usd: { value: parts.every(v => v != null) ? +parts.reduce((a, b) => a + b, 0).toFixed(4) : null, n: recs.length,
      note: "diagnosis + re-rank + options (framework-drafting proxy) + framework critic + project critic; judge calls excluded (evaluation-only)" },
    judge_cost_usd_total: +recs.filter(r => r.route === "judge").reduce((s, r) => s + (r.cost_usd || 0), 0).toFixed(4) };
}
const fBy = Object.fromEntries(LANGS.map(l => [l, logRecs.length ? fMetrics(logRecs.filter(r => langOfRec(r) === l)) : null]));

// ---------- gates
const gates = [];
function gate(group, g, getter) {
  const r = { group, id: g.id, metric: g.metric, op: g.op, threshold: g.value, status: g.status, per_language: {} };
  for (const l of LANGS) {
    const m = getter(l); let pass = cmp(m?.value, g.op, g.value); let note = "";
    if (m?.value == null) { pass = null; note = "no data"; }
    if (g.requires === "calibrated_judge" && !calibrated[l]) { pass = null; note = "judge not calibrated for this language → not established"; }
    r.per_language[l] = { measure: m, pass, note };
  }
  r.passes = LANGS.every(l => r.per_language[l].pass === true); gates.push(r); return r;
}
if (A) {
  T.A.per_language.forEach(g => gate("A", g, l => aUnion(l, g.applies_to)[g.metric]));
  const gap = aBy.ar.all.pass_rate.value != null && aBy.en.all.pass_rate.value != null ? +Math.abs(100 * (aBy.ar.all.pass_rate.value - aBy.en.all.pass_rate.value)).toFixed(1) : null;
  const g = T.A.cross_language[0]; gates.push({ group: "A", id: g.id, metric: g.metric, op: g.op, threshold: g.value, status: g.status, cross_language: { value: gap }, passes: cmp(gap, g.op, g.value) === true });
}
if (B) T.B.per_language.forEach(g => gate("B", g, l => bBy[l]?.[g.metric]));
if (C) T.C.per_language.forEach(g => gate("C", g, l => cBy[l]?.[g.metric]));
if (logRecs.length) T.F.per_language.forEach(g => gate("F", g, l => fBy[l]?.[g.metric]));
const segGates = A ? T.A.per_segment_per_language.map(g => ({ ...g, per_language: Object.fromEntries(LANGS.map(l => { const m = aBy[l][g.segment][g.metric]; return [l, { measure: m, pass: cmp(m?.value, g.op, g.value) }]; })) })) : [];

// ---------- verdict
const approved = gates.filter(g => g.status === "approved");
const failed = approved.filter(g => !g.passes);
const missing = Object.entries(prereq).filter(([, v]) => !v).map(([k]) => k);
const calibFail = human && !LANGS.every(l => calibrated[l]);
const pptxFail = pptx && pptx.status === "complete" && !pptx.exit_criteria_met;
let verdict = missing.length || failed.length || problems.length || calibFail || pptxFail ? "NO-GO" : "GO";
if (synthetic.length) verdict = "INVALID — SYNTHETIC INPUTS (tool test only, not a result)";

// ---------- limitations & recommendations (auto)
const limitations = ["Held-out set authored by a blind AI author (same model family as the rules author); human SME review recorded separately.",
  "Segment-level samples are small per language (held-out: clear 8, ambiguous 5, incomplete 3, outside-catalogue 2–3, out-of-scope 1–2 per language); 95% intervals are wide and segment thresholds are 'proposed' (not gating).",
  "Critic L2/L3 seeded set was written by the rules author (not independent).",
  "Cost per analysis uses the options call as a proxy for framework drafting (no drafting experiment in Phase 0).",
  "Prices are list prices recorded in lib/llm.mjs; verify against the current price list before commercial use."];
if (human) for (const [c, v] of Object.entries(human.by_criterion || {})) for (const l of LANGS) if (v[l]?.insufficient_sample) limitations.push(`Calibration sample for ${c} (${l}) is small (n=${v[l].n}); agreement for this criterion is indicative only.`);
const recs = [];
if (missing.length) recs.push(`Complete the missing prerequisites: ${missing.join("; ")}.`);
for (const g of failed) recs.push(`${g.id} failed (${LANGS.filter(l => g.per_language?.[l]?.pass !== true).join(" & ") || "cross-language"}): investigate in a NEW evaluation version (eval v${EV + 1}); do not edit frozen components.`);
if (calibFail) recs.push("Judge calibration failed for at least one language: judge-based gates are not established; recalibrate in a new evaluation version.");
if (pptxFail) recs.push("PowerPoint exit criteria not met: raise export-service issues per failing test (doc 15/16).");
if (verdict === "GO") recs.push("All approved gates pass in both languages: proceed to Beta-1 planning sign-off; keep the held-out suite as a regression gate.");

// ---------- write
fs.mkdirSync(OUT, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-"); const base = path.join(OUT, `go-no-go-ev${EV}-${EFFORT}-${stamp}${synthetic.length ? "-SYNTHETIC" : ""}`);
const json = { generated_at: new Date().toISOString(), eval_version: EV, effort: EFFORT, verdict, prerequisites: prereq, problems, synthetic_inputs: synthetic,
  evidence_classes: { E1_model_evaluation_heldout: [A, B, C].filter(Boolean).map(x => x.file), E2_model_evaluation_tuning: "reported separately (never decides)", E3_deterministic_experiments: "doc 13 §A.1, C.1, D, E (no model)", E4_tool_validation: "doc 14 §4.4, §8b", E5_synthetic: synthetic },
  gates, segment_gates: segGates, a_by_language_segment: aBy, b_by_language: bBy, c_by_language: cBy, f_by_language: fBy, calibration: human, disagreements: humanSum, pptx, limitations, recommendations: recs };
fs.writeFileSync(base + ".json", JSON.stringify(json, null, 1));
const W = synthetic.length ? "\n> ⚠️ **SYNTHETIC INPUTS: TOOL TEST ONLY. NOT A RESULT. DO NOT CITE.**\n" : "";
const md = [];
md.push(`# Consolidated GO / NO-GO Evidence Report: eval v${EV} (${EFFORT} effort)`, W, `Generated ${json.generated_at}. Thresholds: \`eval/thresholds-v1.json\`. Rule: every gate must pass in **Arabic and in English independently**; pooled figures never decide.`, "");
md.push(`## 1. Verdict: **${verdict}**`, "");
if (missing.length) md.push("**Missing prerequisites:**", ...missing.map(m => `- ${m}`), "");
if (failed.length) md.push("**Failed approved gates:**", ...failed.map(g => `- ${g.id} (${g.metric} ${g.op} ${g.threshold}): ${g.cross_language ? "gap " + g.cross_language.value : LANGS.map(l => `${l.toUpperCase()} ${g.per_language[l].pass === true ? "pass" : g.per_language[l].pass === false ? "FAIL" : "not established (" + g.per_language[l].note + ")"}`).join(", ")}`), "");
if (problems.length) md.push("**Input / integrity problems:**", ...problems.map(p => `- ${p}`), "");
md.push("## 2. Evidence classes (kept separate)", "", "| Class | What | Used for the verdict? |", "|---|---|---|",
  `| E1 Model evaluation: held-out | ${json.evidence_classes.E1_model_evaluation_heldout.join(", ") || "none"} | **Yes** |`, "| E2 Model evaluation: tuning (in-sample) | Separate runs on the tuning set | No (information) |",
  "| E3 Deterministic experiments (no model) | Rules oracle/perturbation, Critic L1, BPMN layout, PPTX automated checks | No (supporting) |", "| E4 Tool validation | Harness, integrity, security, workbook checks | No |",
  `| E5 Synthetic tests | ${synthetic.length ? synthetic.join("; ") : "none used"} | **Never** |`, "");
md.push("## 3. Prerequisites", "", "| Prerequisite | Status |", "|---|---|", ...Object.entries(prereq).map(([k, v]) => `| ${k} | ${v ? "✅" : "⛔ missing"} |`), "");
const gt = grp => { const rows = gates.filter(g => g.group === grp); if (!rows.length) return ["_No data (prerequisite missing)._", ""];
  return ["| Gate | Metric | Threshold | Status | Arabic | | English | |", "|---|---|---|---|---|---|---|---|",
    ...rows.map(g => g.cross_language ? `| ${g.id} | ${g.metric} | ${g.op} ${g.threshold} | ${g.status} | gap: ${g.cross_language.value ?? "—"} | ${g.passes ? "✅" : "❌"} | | |`
      : `| ${g.id} | ${g.metric} | ${g.op} ${g.threshold} | ${g.status} | ${fmt(g.per_language.ar.measure)} | ${g.per_language.ar.pass === true ? "✅" : g.per_language.ar.pass === false ? "❌" : "◻ " + g.per_language.ar.note} | ${fmt(g.per_language.en.measure)} | ${g.per_language.en.pass === true ? "✅" : g.per_language.en.pass === false ? "❌" : "◻ " + g.per_language.en.note} |`), ""]; };
md.push("## 4. A: Diagnosis & recommendation (held-out)", "", ...gt("A"));
md.push("### 4.1 By scenario segment × language", "", "| Segment | Lang | Rows | Pass rate | Top-1 acceptable | Unacceptable in top 3 | Asked (incomplete) | No-fit / decline recall | Stage acc. |", "|---|---|---|---|---|---|---|---|---|");
if (A) for (const s of SEGS) for (const l of LANGS) { const m = aBy[l][s]; md.push(`| ${s} | ${l.toUpperCase()} | ${m.pass_rate.n} | ${fmt(m.pass_rate)} | ${fmt(m.top1_acceptable)} | ${fmt(m.unacceptable_in_top3)} | ${fmt(m.ask_rate)} | ${fmt(m.nofit_or_decline_recall)} | ${fmt(m.stage_accuracy)} |`); }
md.push("", "Segment thresholds (status **proposed**: reported, not gating until approved):", "", "| Gate | Segment | Metric | Threshold | Arabic | English |", "|---|---|---|---|---|---|",
  ...segGates.map(g => `| ${g.id} | ${g.segment} | ${g.metric} | ${g.op} ${g.value} | ${fmt(g.per_language.ar.measure)} ${g.per_language.ar.pass === true ? "✅" : g.per_language.ar.pass === false ? "❌" : ""} | ${fmt(g.per_language.en.measure)} ${g.per_language.en.pass === true ? "✅" : g.per_language.en.pass === false ? "❌" : ""} |`), "");
md.push("## 5. B: Strategic Options", "", ...gt("B"), "## 6. C: AI Critic", "", ...gt("C"), "## 7. F: Cost & latency (measured)", "", ...gt("F"));
md.push("## 8. Human calibration (blinded)", "");
if (human) { md.push(`Calibration passes (both languages independently): **${LANGS.every(l => calibrated[l]) ? "yes" : "NO"}**`, "", "| Criterion | Arabic | English |", "|---|---|---|",
  ...Object.entries(human.by_criterion).map(([c, v]) => `| ${c} | ${JSON.stringify(v.ar)} | ${JSON.stringify(v.en)} |`), "",
  `Disagreements: ${humanSum ? `${humanSum.total} (adjudicated ${humanSum.adjudicated}); by decision ${JSON.stringify(humanSum.by_decision)}; follow-ups for the next version: ${humanSum.next_version_items?.length ?? 0}` : "not adjudicated"}. Full log: \`disagreements-log.md\`.`, ""); }
else md.push("_Not available (prerequisite missing)._", "");
md.push("## 9. PowerPoint cross-platform manual test", "", pptx ? `Status: ${pptx.status}; exit criteria met: **${pptx.exit_criteria_met ? "yes" : "NO"}**. Criteria: ${JSON.stringify(pptx.exit_criteria)}. Failures recorded: ${pptx.failures?.length ?? 0}.` : "_Not available (prerequisite missing)._", "");
md.push("## 10. Limitations", "", ...limitations.map(x => `- ${x}`), "", "## 11. Recommendations", "", ...recs.map(x => `- ${x}`), "");
fs.writeFileSync(base + ".md", md.join("\n"));
console.log(`verdict: ${verdict}\nreport: ${path.relative(root, base)}.md`);
if (missing.length) console.log("missing:", missing.join(" | "));
