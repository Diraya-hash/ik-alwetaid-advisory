// Phase 0 LLM experiments A (diagnosis + recommendation), B (Strategic Options), C (Critic L2/L3).
// Usage:  node experiments/llm-suite.mjs a|b|c [--runs=2] [--effort=high|medium|low] [--only=ID,ID] [--dry-run]
// Without ANTHROPIC_API_KEY the suite runs in dry-run mode: builds every request, validates inputs, estimates size,
// and writes NO results. Results are written to results/llm-<exp>-<effort>.json and per-call logs to results/llm-runs.jsonl.
import fs from "node:fs";
import { structured, DRY_RUN, MODELS } from "../lib/llm.mjs";
import { Diagnosis, Rerank, OptionSet, Critique, Judge, L2 } from "../lib/schemas.mjs";
import { recommend } from "../lib/recommender.mjs";
import { STAGES, APPROACHES, STAGE_FIT } from "../lib/catalogue.mjs";
import { weightedOptionScore } from "../lib/critic-rules.mjs";

import { execSync } from "node:child_process";
import { checkFrozen, checkSeal, configHash } from "../lib/integrity.mjs";
import { spentUsd } from "../lib/llm.mjs";

const arg = (k, d) => (process.argv.find(a => a.startsWith(`--${k}=`)) || `--${k}=${d}`).split("=")[1];
const EXP = process.argv[2]; const RUNS = +arg("runs", 2); const EFFORT = arg("effort", "high"); const ONLY = arg("only", "");
// --set=tuning (29 in-sample scenarios, eval/scenarios.json) | heldout (sealed, independently authored)
const SET = arg("set", "tuning");
const SET_PATH = SET === "heldout" ? new URL("../eval/heldout/heldout-v1.json", import.meta.url).pathname : new URL("../eval/scenarios.json", import.meta.url).pathname;
if (!fs.existsSync(SET_PATH)) { console.error(`Evaluation set not found: ${SET_PATH}`); process.exit(2); }
const { scenarios } = JSON.parse(fs.readFileSync(SET_PATH));
// Every evaluation set is sealed and the configuration (rules, prompts, schemas, graders) is frozen. Any mismatch →
// refuse to run. Changes after evaluation begins require a NEW evaluation version (scripts/freeze-config.mjs --new-eval-version).
const CRITIC_SET = new URL("../eval/critic-semantic.json", import.meta.url).pathname;
const integrity = { set: SET, config: checkFrozen(), seal: checkSeal(SET_PATH), criticSeal: EXP === "c" ? checkSeal(CRITIC_SET) : { ok: true } };
if (!integrity.config.ok || !integrity.seal.ok || !integrity.criticSeal.ok) {
  console.error("REFUSING to run:", !integrity.config.ok ? integrity.config.reason : !integrity.seal.ok ? integrity.seal.reason : integrity.criticSeal.reason);
  console.error("Results are only valid with a frozen configuration and intact seals (doc 14 §3). Changes need a new evaluation version.");
  process.exit(2);
}
const EVAL_VERSION = integrity.config.frozen.eval_version ?? 1;
const RUN_ID = `ev${EVAL_VERSION}-${SET}-${EXP}-${EFFORT}-${new Date().toISOString().replace(/[:.]/g, "-")}`;
process.env.BPS_RUN_ID = RUN_ID; process.env.BPS_EVAL_VERSION = String(EVAL_VERSION); // tagged onto every per-call log record
const MANIFEST = { run_id: RUN_ID, eval_version: EVAL_VERSION, experiment: EXP, set: SET, set_file: SET_PATH.split("/phase0/")[1],
  set_sha256: integrity.seal.seal?.sha256 ?? null, config_hash: configHash().combined, config_frozen_match: integrity.config.ok,
  git_head: (() => { try { return execSync("git rev-parse HEAD").toString().trim(); } catch { return null; } })(),
  effort: EFFORT, runs: RUNS, started_at: new Date().toISOString() };
const pick = arr => (ONLY ? arr.filter(s => ONLY.split(",").includes(s.id)) : arr);
const alias = id => (id === "fw_gantt" ? "fw_action_plan" : id);

import { DIAG_SYSTEM, RERANK_SYSTEM, OPTIONS_SYSTEM, CRITIC_SYSTEM, JUDGE_SYSTEM } from "../lib/prompts.mjs";

// ---------------- helpers ----------------
function toSlots(d) {
  const pres = d.presence, s = d.signals, c = d.classification;
  const fill = v => (v === "stated" ? 1 : v === "inferred" ? 0.5 : 0);
  return { symptom: pres.symptom === "clear" ? true : pres.symptom === "vague" ? "vague" : false,
    stage: { primary: c.stage_primary, secondary: c.stage_secondary }, domains: c.domains.map(x => x.code), scope: c.scope,
    goal: fill(pres.goal), impact: fill(pres.impact), stakeholders: pres.stakeholders_named, constraints: pres.constraints_or_deadline,
    ...s, out_of_scope: d.out_of_scope.flag || c.domains[0]?.code === "X.OUT_OF_SCOPE" };
}
function typingViolations(d, text) {
  let v = 0; const norm = x => x.replace(/\s+/g, " ").trim();
  for (const st of d.statements) if (st.origin === "user_input" && (!st.user_quote || !norm(text).includes(norm(st.user_quote)))) v++;
  return v;
}
const pct = (n, d) => (d ? +(100 * n / d).toFixed(1) : null);
function save(name, obj) {
  if (DRY_RUN) return;
  const out = { manifest: { ...MANIFEST, finished_at: new Date().toISOString(), spent_usd: +spentUsd().toFixed(4) }, ...obj };
  // Each run is a new immutable file; results are never overwritten (versioned evaluation runs).
  const dir = new URL("../results/runs/", import.meta.url); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(new URL(`${RUN_ID}.json`, dir), JSON.stringify(out, null, 1), { flag: "wx" });
  console.log(`results written: results/runs/${RUN_ID}.json`);
}

// ---------------- Experiment A ----------------
async function expA() {
  const rows = [];
  for (const sc of pick(scenarios)) for (let run = 1; run <= RUNS; run++) {
    const user = `<challenge lang="${sc.language}">\n${sc.text}\n</challenge>`;
    const dg = await structured({ route: "diagnosis", scenario: sc.id, effort: EFFORT, system: DIAG_SYSTEM, user, schema: Diagnosis });
    if (dg.dryRun) { continue; }
    const d = dg.parsed; const r = { id: sc.id, run, lang: sc.language, ok: !!d };
    if (!d) { rows.push({ ...r, error: dg.record.error || dg.record.stop_reason }); continue; }
    const slots = toSlots(d); const det = recommend(slots, { ngfRule: "v0.3b", gateRule: "v0.3", displayCutoff: 0.40 });
    let status = det.status, ranked = det.ranked.map(x => x.id);
    if (det.status === "ok") {
      const cands = det.ranked.slice(0, 8).map(x => ({ id: x.id, score: x.score }));
      const rr = await structured({ route: "rerank", scenario: sc.id, effort: EFFORT, system: RERANK_SYSTEM,
        user: `<diagnosis>\n${JSON.stringify({ reframed_problem: d.reframed_problem, statements: d.statements, classification: d.classification, signals: d.signals })}\n</diagnosis>\nCandidates (rule score): ${JSON.stringify(cands)}\nRule flag probable_no_good_fit: ${!!det.probableNGF}`, schema: Rerank });
      if (rr.parsed) {
        const allowed = new Set(cands.map(c => c.id));
        const recs = rr.parsed.recommendations.map(x => x.approach_id).filter(id => allowed.has(id));
        r.outOfCandidate = rr.parsed.recommendations.filter(x => !allowed.has(x.approach_id)).length;
        if (rr.parsed.status === "no_good_fit") status = "no_good_fit"; else ranked = recs.length ? recs : ranked;
        r.llmFits = rr.parsed.recommendations.map(x => x.fit);
        r.rerankOutput = rr.parsed;
      } else r.rerankError = rr.record.error || rr.record.stop_reason;
    }
    // Full model output kept for human evaluation (doc 17). Shown to evaluators without any grades.
    r.output = { reframed_problem: d.reframed_problem, statements: d.statements, classification: d.classification, unknowns: d.unknowns,
      out_of_scope: d.out_of_scope, status, recommendations: r.rerankOutput?.recommendations?.filter(x => (r.rerankOutput.status === "ok")) ?? [],
      no_good_fit_explanation: r.rerankOutput?.no_good_fit_explanation ?? null, not_recommended: r.rerankOutput?.not_recommended ?? [],
      deterministic_top3: det.ranked.slice(0, 3).map(x => x.id) };
    const exp = sc.expected, rec = exp.recommendation, top = ranked.slice(0, 3);
    Object.assign(r, { status, top3: top, stage: slots.stage, domains: slots.domains, scope: slots.scope,
      domainOk: exp.domains_any_of ? [...exp.domains_any_of, ...(exp.domains_acceptable || [])].includes(slots.domains[0]) : null,
      stageOk: exp.stage_any_of ? exp.stage_any_of.includes(slots.stage.primary) : null,
      typingViolations: typingViolations(d, sc.text) });
    if (exp.gate === "ask") r.pass = status === "insufficient_context";
    else if (rec.no_good_fit) r.pass = status === "no_good_fit" || status === "out_of_scope";
    else {
      const ideal = rec.ideal.map(alias), acc = rec.acceptable.map(alias), un = rec.unacceptable.map(alias);
      r.top1Acceptable = status === "ok" && (ideal.includes(top[0]) || acc.includes(top[0]));
      r.top3Hit = status === "ok" && top.some(t => ideal.includes(t)); r.unacceptable = top.filter(t => un.includes(t));
      r.pass = r.top1Acceptable && r.top3Hit && !r.unacceptable.length;
    }
    if (exp.must_surface?.length) { // judge: coverage + hearsay handling
      const items = [...exp.must_surface.map((m, i) => ({ key: `surface_${i}`, ask: `Diagnosis captures: ${m}` })),
                     ...(exp.must_not_be_verified || []).map((m, i) => ({ key: `hearsay_${i}`, ask: `Diagnosis treats this as unproven (assumption/unverified or clearly attributed), NOT as an established fact: ${m}` }))];
      const jd = await structured({ route: "judge", scenario: sc.id, model: MODELS.judge, effort: "low", system: JUDGE_SYSTEM, schema: Judge,
        user: `Challenge:\n${sc.text}\n\nDiagnosis JSON:\n${JSON.stringify(d)}\n\nItems:\n${items.map(i => `${i.key}: ${i.ask}`).join("\n")}\nNo criteria scores needed (return an empty scores array).` });
      if (jd.parsed) {
        const v = Object.fromEntries(jd.parsed.items.map(x => [x.key, x.verdict]));
        r.judgeItems = items.map(i => ({ key: i.key, ask: i.ask, verdict: v[i.key] ?? null })); // kept for human calibration (EV-5)
        const surf = exp.must_surface.map((_, i) => v[`surface_${i}`]); r.surfaceCoverage = surf.reduce((a, x) => a + (x === "yes" ? 1 : x === "partial" ? 0.5 : 0), 0) / surf.length;
        const hs = (exp.must_not_be_verified || []).map((_, i) => v[`hearsay_${i}`]); r.hearsayHandled = hs.length ? hs.filter(x => x === "yes").length / hs.length : null;
      }
    }
    rows.push(r); console.log(`${r.pass ? "PASS" : "FAIL"} ${sc.id} run${run} ${status} top3=${(top || []).join(",")} stage=${slots.stage.primary}`);
  }
  if (DRY_RUN) return console.log("dry-run complete: requests built for", pick(scenarios).length, "scenarios (no results written)");
  const byScen = {}; rows.forEach(r => (byScen[r.id] ||= []).push(r));
  const recRows = rows.filter(r => r.top1Acceptable !== undefined);
  const summary = { experiment: "A-llm", effort: EFFORT, runs: RUNS, calls: rows.length,
    pass_pct: pct(rows.filter(r => r.pass).length, rows.length),
    top1_acceptable_pct: pct(recRows.filter(r => r.top1Acceptable).length, recRows.length), top3_hit_pct: pct(recRows.filter(r => r.top3Hit).length, recRows.length),
    unacceptable_in_top3_pct: pct(recRows.filter(r => r.unacceptable?.length).length, recRows.length),
    stage_accuracy_pct: pct(rows.filter(r => r.stageOk).length, rows.filter(r => r.stageOk !== null && r.stageOk !== undefined).length),
    domain_accuracy_pct: pct(rows.filter(r => r.domainOk).length, rows.filter(r => r.domainOk !== null && r.domainOk !== undefined).length),
    ngf_recall_pct: pct(rows.filter(r => scenarios.find(s => s.id === r.id).expected.recommendation?.no_good_fit && r.pass).length, rows.filter(r => scenarios.find(s => s.id === r.id).expected.recommendation?.no_good_fit).length),
    false_ngf_pct: pct(recRows.filter(r => r.status === "no_good_fit" || r.status === "out_of_scope").length, recRows.length),
    gate_ask_correct_pct: pct(rows.filter(r => scenarios.find(s => s.id === r.id).expected.gate === "ask" && r.pass).length, rows.filter(r => scenarios.find(s => s.id === r.id).expected.gate === "ask").length),
    false_gate_block_pct: pct(recRows.filter(r => r.status === "insufficient_context").length, recRows.length),
    typing_violation_statements: rows.reduce((a, r) => a + (r.typingViolations || 0), 0),
    surface_coverage_mean: +(rows.filter(r => r.surfaceCoverage != null).reduce((a, r) => a + r.surfaceCoverage, 0) / rows.filter(r => r.surfaceCoverage != null).length).toFixed(2),
    hearsay_handled_pct: pct(rows.filter(r => r.hearsayHandled != null).reduce((a, r) => a + r.hearsayHandled, 0), rows.filter(r => r.hearsayHandled != null).length),
    out_of_candidate_recs: rows.reduce((a, r) => a + (r.outOfCandidate || 0), 0),
    top1_stability_pct: pct(Object.values(byScen).filter(rs => new Set(rs.map(r => `${r.status}:${r.top3?.[0]}`)).size === 1).length, Object.keys(byScen).length),
    by_language: Object.fromEntries(["ar", "en"].map(l => [l, `${rows.filter(r => r.lang === l && r.pass).length}/${rows.filter(r => r.lang === l).length}`])),
    errors: rows.filter(r => !r.ok || r.rerankError).map(r => ({ id: r.id, run: r.run, error: r.error || r.rerankError })) };
  save(`llm-a-${EFFORT}`, { summary, rows }); console.log(JSON.stringify(summary, null, 1));
}

// ---------------- Experiment B ----------------
const OPTION_SCENARIOS = ["STR-03", "PROC-01", "RCA-01", "ORG-02", "STR-02", "PRJ-03", "RCA-03", "STK-02"];
async function expB() {
  const rows = []; const W = { impact: 0.35, effort: 0.2, risk: 0.2, feasibility: 0.25 };
  const optionScenarios = SET === "heldout"
    ? scenarios.filter(s => s.expected.gate !== "ask" && [...(s.expected.recommendation?.ideal || []), ...(s.expected.recommendation?.acceptable || [])].includes("cap_strategic_options"))
    : scenarios.filter(s => OPTION_SCENARIOS.includes(s.id));
  for (const sc of pick(optionScenarios)) for (let run = 1; run <= RUNS; run++) {
    const ctx = (sc.expected.must_surface || []).map((m, i) => `- [c${i + 1}] ${m}`).join("\n");
    const user = `<challenge lang="${sc.language}">\n${sc.text}\n</challenge>\nAgreed analysis so far (ids you can reference):\n${ctx}`;
    const o = await structured({ route: "options", scenario: sc.id, effort: EFFORT, system: OPTIONS_SYSTEM, user, schema: OptionSet });
    if (o.dryRun) continue;
    const r = { id: sc.id, run, lang: sc.language, ok: !!o.parsed };
    if (!o.parsed) { rows.push({ ...r, error: o.record.error || o.record.stop_reason }); continue; }
    const p = o.parsed, real = p.options.filter(x => !x.is_baseline), base = p.options.filter(x => x.is_baseline);
    const scored = p.options.map(x => ({ id: x.id, w: weightedOptionScore({ assessment: { impact: x.impact, effort: x.effort, risk: x.risk, feasibility: x.feasibility } }, W) })).sort((a, b) => b.w - a.w);
    r.output = p; // full option set, for human evaluation (doc 17)
    Object.assign(r, { nOptions: real.length, baselineCount: base.length, preferredValid: p.options.some(x => x.id === p.preferred_option_id),
      allHaveAssumptions: real.every(x => x.assumptions.length > 0), allAddressSomething: real.every(x => x.addresses.length > 0),
      preferredIsTopWeighted: scored[0].id === p.preferred_option_id, tooClose: scored.length > 1 && scored[0].w - scored[1].w < 0.3 });
    r.structuralPass = r.nOptions >= 3 && r.nOptions <= 5 && r.baselineCount === 1 && r.preferredValid && r.allHaveAssumptions && r.allAddressSomething;
    const crit = ["distinctness", "relevance_to_causes_and_goals", "rationale_soundness", "assessment_plausibility", "trade_off_clarity", "language_quality"];
    const jd = await structured({ route: "judge", scenario: sc.id, model: MODELS.judge, effort: "low", system: JUDGE_SYSTEM, schema: Judge,
      user: `Challenge:\n${sc.text}\nContext:\n${ctx}\n\nOption set:\n${JSON.stringify(p)}\n\nItems:\nbaseline_sensible: Is the baseline option realistic?\nno_fabricated_facts: Does the set avoid inventing facts or numbers not in the challenge (assessments framed as judgements)?\nScore 1–5 each criterion: ${crit.join(", ")}. language_quality: native, professional ${sc.language === "ar" ? "Arabic (MSA business register)" : "English"}.` });
    if (jd.parsed) { r.scores = Object.fromEntries(jd.parsed.scores.map(x => [x.criterion, x.score])); r.items = Object.fromEntries(jd.parsed.items.map(x => [x.key, x.verdict])); }
    rows.push(r); console.log(`${sc.id} run${run} options=${r.nOptions} structural=${r.structuralPass} scores=${JSON.stringify(r.scores)}`);
  }
  if (DRY_RUN) return console.log("dry-run complete (no results written)");
  const crit = ["distinctness", "relevance_to_causes_and_goals", "rationale_soundness", "assessment_plausibility", "trade_off_clarity", "language_quality"];
  const scoredRows = rows.filter(r => r.scores);
  const mean = c => +(scoredRows.reduce((a, r) => a + (r.scores[c] || 0), 0) / scoredRows.length).toFixed(2);
  const summary = { experiment: "B-llm", effort: EFFORT, calls: rows.length, structural_pass_pct: pct(rows.filter(r => r.structuralPass).length, rows.length),
    rubric_means: Object.fromEntries(crit.map(c => [c, mean(c)])), rubric_overall_mean: +(crit.reduce((a, c) => a + mean(c), 0) / crit.length).toFixed(2),
    preferred_equals_top_weighted_pct: pct(rows.filter(r => r.preferredIsTopWeighted).length, rows.length), too_close_cases: rows.filter(r => r.tooClose).length,
    no_fabricated_facts_pct: pct(scoredRows.filter(r => r.items?.no_fabricated_facts === "yes").length, scoredRows.length),
    by_language: Object.fromEntries(["ar", "en"].map(l => [l, +(scoredRows.filter(r => r.lang === l).reduce((a, r) => a + crit.reduce((s, c) => s + r.scores[c], 0) / crit.length, 0) / Math.max(1, scoredRows.filter(r => r.lang === l).length)).toFixed(2)])),
    errors: rows.filter(r => !r.ok).map(r => ({ id: r.id, error: r.error })) };
  save(`llm-b-${EFFORT}`, { summary, rows }); console.log(JSON.stringify(summary, null, 1));
}

// ---------------- Experiment C (L2/L3) ----------------
async function expC() {
  const { artifacts } = JSON.parse(fs.readFileSync(new URL("../eval/critic-semantic.json", import.meta.url)));
  const rows = [];
  for (const a of ONLY ? artifacts.filter(x => ONLY.split(",").includes(x.id)) : artifacts) for (let run = 1; run <= RUNS; run++) {
    const user = `<artifact level="${a.level}" framework="${a.framework || "project"}" lang="${a.language}">\nProblem: ${a.problem}\n${JSON.stringify(a.content)}\n</artifact>`;
    const c = await structured({ route: `critic-${a.level}`, scenario: a.id, effort: EFFORT, system: CRITIC_SYSTEM[a.level], user, schema: Critique });
    if (c.dryRun) continue;
    if (!c.parsed) { rows.push({ id: a.id, run, error: c.record.error || c.record.stop_reason }); continue; }
    const f = c.parsed.findings;
    const matched = a.seeded.map(sd => f.some(x => x.target_ids.some(t => sd.target_ids.includes(t))));
    const serious = f.filter(x => x.severity === "critical" || x.severity === "high");
    const seriousMatched = serious.filter(x => a.seeded.some(sd => x.target_ids.some(t => sd.target_ids.includes(t))));
    rows.push({ id: a.id, run, level: a.level, lang: a.language, clean: a.seeded.length === 0, seeded: a.seeded.length, recalled: matched.filter(Boolean).length,
      findings: f.length, serious: serious.length, seriousMatched: seriousMatched.length,
      allHaveExplanationAndCorrection: f.every(x => x.explanation.trim() && x.suggested_correction.trim()) });
    console.log(`${a.id} run${run} findings=${f.length} serious=${serious.length} recalled=${matched.filter(Boolean).length}/${a.seeded.length}`);
  }
  if (DRY_RUN) return console.log("dry-run complete (no results written)");
  const seeded = rows.filter(r => !r.clean && !r.error), clean = rows.filter(r => r.clean && !r.error);
  const summary = { experiment: "C-llm", effort: EFFORT, calls: rows.length,
    recall_pct: pct(seeded.reduce((a, r) => a + r.recalled, 0), seeded.reduce((a, r) => a + r.seeded, 0)),
    serious_precision_on_seeded_pct: pct(seeded.reduce((a, r) => a + r.seriousMatched, 0), seeded.reduce((a, r) => a + r.serious, 0)),
    serious_false_alarms_on_clean: clean.reduce((a, r) => a + r.serious, 0), clean_runs: clean.length,
    mean_findings_clean: +(clean.reduce((a, r) => a + r.findings, 0) / Math.max(1, clean.length)).toFixed(2),
    explanation_and_correction_pct: pct(rows.filter(r => r.allHaveExplanationAndCorrection).length, rows.filter(r => !r.error).length),
    by_level: Object.fromEntries(["framework", "project"].map(l => [l, `${seeded.filter(r => r.level === l).reduce((a, r) => a + r.recalled, 0)}/${seeded.filter(r => r.level === l).reduce((a, r) => a + r.seeded, 0)}`])),
    errors: rows.filter(r => r.error) };
  save(`llm-c-${EFFORT}`, { summary, rows }); console.log(JSON.stringify(summary, null, 1));
}

console.log(`[suite] set=${SET} config_frozen_match=${integrity.config.ok} seal=${integrity.seal.ok}`);
if (DRY_RUN) console.log(`[dry-run] ${process.env.ANTHROPIC_API_KEY ? "--dry-run flag set" : "ANTHROPIC_API_KEY not set"} — building requests only; no model calls, no results.`);
await ({ a: expA, b: expB, c: expC }[EXP] || (() => { console.error("usage: llm-suite.mjs a|b|c"); process.exit(1); }))();
