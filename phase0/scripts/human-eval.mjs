// Human evaluation & AI-judge calibration (doc 17). Blinding is enforced by process:
//   1. prepare  → evaluator/ (model outputs + blank responses, NO grades) and coordinator/ (AI-judge verdicts, auto grades)
//   2. submit   → validates the evaluator's completed CSV and writes an immutable receipt with its SHA-256
//   3. compare  → only runs if a receipt exists and the responses are unchanged; then reveals the judge and computes agreement
// Usage:
//   node scripts/human-eval.mjs prepare --a=<results/runs/ev1-heldout-a-...json> --aij=<...-aij-...json> [--b=<...-b-...json>] --out=<dir> [--n=20]
//     (--aij: assumption-integrity judge run on the same A run; EVERY eligible conditional recommendation is added for
//      human rating of AI1–AI3, so S7 calibration covers all judged cases)
//   node scripts/human-eval.mjs submit  --dir=<dir> --responses=<completed.csv> --evaluator="<name>"
//   node scripts/human-eval.mjs compare --dir=<dir>          (agreement per criterion × language; per-language gate)
//   node scripts/human-eval.mjs summarise --dir=<dir>        (after adjudication: documents decisions and rationales)
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ITEMS as AI_ITEMS } from "../lib/assumption-integrity.mjs";
const sha = b => crypto.createHash("sha256").update(b).digest("hex");
const flag = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || "").slice(k.length + 3);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const csvq = s => `"${String(s ?? "").replace(/"/g, '""')}"`;
const BOM = "﻿"; // so Excel opens Arabic UTF-8 correctly
const NAMES = { fw_swot: "SWOT", fw_pest_steeple: "PEST/STEEPLE", fw_sipoc: "SIPOC", fw_bpmn: "Process map (BPMN)", fw_vsm: "Value stream map",
  fw_five_whys: "5 Whys", fw_cause_effect: "Cause-and-effect (fishbone)", cap_strategic_options: "Strategic options", fw_impact_effort: "Impact/effort matrix",
  fw_risk_matrix: "Risk matrix", fw_stakeholder_map: "Stakeholder map", fw_project_charter: "Project charter", fw_action_plan: "Action plan (Gantt view)",
  fw_gantt: "Action plan (Gantt view)", fw_org_chart: "Organisation chart", fw_op_model_canvas: "Operating model canvas" };
const nm = id => NAMES[id] || id;
const OPTION_CRITERIA = ["distinctness", "relevance_to_causes_and_goals", "rationale_soundness", "assessment_plausibility", "trade_off_clarity", "language_quality"];
const ALLOWED = { scale5: ["1", "2", "3", "4", "5"], ynp: ["yes", "partial", "no"], yn: ["yes", "no"], approach: ["appropriate", "acceptable", "wrong"], usable: ["yes", "with_edits", "no"] };

function parseCsv(text) {
  const rows = []; let row = [], cur = "", q = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; }
    else cur += c;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [h, ...rest] = rows.filter(r => r.length > 1);
  return rest.map(r => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ""])));
}

function selectScenarios(rows, scenarios, n) {
  // run 1 only; stratified: half Arabic / half English; cover ask, no-fit/out-of-scope and ambiguous cases first.
  const byId = Object.fromEntries(scenarios.map(s => [s.id, s]));
  const cands = rows.filter(r => r.run === 1 && r.ok && byId[r.id]);
  let seed = 20261121; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const shuffled = cands.map(r => [rnd(), r]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
  const kind = r => { const s = byId[r.id]; return s.expected.gate === "ask" ? "ask" : s.expected.recommendation?.no_good_fit ? "nofit" : s.category === "ambiguous" ? "ambiguous" : "clear"; };
  const quota = { ask: 2, nofit: 3, ambiguous: 4 }; const pickd = [];
  for (const lang of ["ar", "en"]) {
    const pool = shuffled.filter(r => r.lang === lang); const take = [];
    for (const [k, q] of Object.entries(quota)) take.push(...pool.filter(r => kind(r) === k).slice(0, Math.ceil(q / 2)));
    for (const r of pool) if (take.length < n / 2 && !take.includes(r)) take.push(r);
    pickd.push(...take.slice(0, n / 2));
  }
  return pickd;
}

function packetMarkdown(pid, sc, r, opt) {
  const o = r.output || {}; const L = [];
  L.push(`# ${pid} — ${sc.language === "ar" ? "Arabic case / حالة عربية" : "English case"}`, "", "## 1. The user's challenge", "", "```text", sc.text, "```", "", "## 2. AI diagnosis", "");
  L.push(`**Reframed problem:** ${o.reframed_problem ?? "—"}`, "");
  L.push(`**Classification:** stage ${o.classification?.stage_primary ?? "—"}${o.classification?.stage_secondary ? " / " + o.classification.stage_secondary : ""}; domains ${(o.classification?.domains || []).map(d => d.code).join(", ") || "—"}; scope ${o.classification?.scope ?? "—"}`, "");
  L.push("| # | Role | Statement | Truth status | Origin |", "|---|---|---|---|---|");
  (o.statements || []).forEach((s, i) => L.push(`| ${i + 1} | ${s.role} | ${String(s.text).replace(/\|/g, "/")} | ${s.truth_status} | ${s.origin} |`));
  L.push("", "## 3. What the AI did next", "");
  if (o.status === "insufficient_context") { L.push("The AI decided it needs more information before recommending. Missing information it identified:", ""); (o.unknowns || []).forEach(u => L.push(`- ${u.slot}: ${u.why_it_matters}`)); }
  else if (o.status === "out_of_scope") L.push(`The AI declined the request as out of scope (${o.out_of_scope?.reason_code}).`);
  else if (o.status === "no_good_fit") L.push(`The AI said no framework in the catalogue fits well. Explanation: ${o.no_good_fit_explanation ?? "—"}`);
  else { L.push("Recommended approaches (in order):", ""); (o.recommendations || []).forEach((x, i) => L.push(`${i + 1}. **${nm(x.approach_id)}** (fit: ${x.fit}) — why: ${x.why_it_fits.join("; ")} — caution: ${x.caution}`));
    if ((o.not_recommended || []).length) { L.push("", "Not recommended:"); o.not_recommended.forEach(x => L.push(`- ${nm(x.approach_id)}: ${x.reason}`)); } }
  if (opt) {
    L.push("", "## 4. Strategic options generated by the AI", "", "| Option | Impact | Effort | Risk | Feasibility | Baseline |", "|---|---|---|---|---|---|");
    opt.options.forEach(x => L.push(`| ${x.title} | ${x.impact} | ${x.effort} | ${x.risk} | ${x.feasibility} | ${x.is_baseline ? "yes" : ""} |`));
    L.push("", `**Preferred:** ${opt.preferred_option_id} — ${opt.preferred_why}`, "", `**Trade-offs:** ${opt.trade_offs}`);
  }
  L.push("", "---", "Answer every row for this packet in `responses.csv`. Do not look up any other material about this case.");
  return L.join("\n");
}

if (process.argv[2] === "prepare") {
  const aPath = flag("a"), bPath = flag("b"), aijPath = flag("aij"), out = flag("out"), n = +(flag("n") || 20);
  if (!aPath || !out || !aijPath) { console.error("prepare needs --a, --aij and --out (S7 assumption-integrity calibration is required in eval v1)"); process.exit(1); }
  if (fs.existsSync(out)) { console.error(`REFUSED: ${out} exists (each human evaluation round is a new folder).`); process.exit(2); }
  const A = JSON.parse(fs.readFileSync(aPath)); const B = bPath ? JSON.parse(fs.readFileSync(bPath)) : null;
  const { scenarios } = JSON.parse(fs.readFileSync(path.join(root, A.manifest.set_file)));
  const sel = selectScenarios(A.rows, scenarios, n);
  const AIJ = JSON.parse(fs.readFileSync(aijPath));
  if (AIJ.manifest?.source_run_id !== A.manifest.run_id) { console.error(`REFUSED: the assumption-integrity judge run (${AIJ.manifest?.source_run_id}) was not made on this A run (${A.manifest.run_id}).`); process.exit(2); }
  const aijEligible = AIJ.rows.filter(x => x.eligible);
  const aijKey = x => `${x.id}|${x.run}`; const aijBy = Object.fromEntries(aijEligible.map(x => [aijKey(x), x]));
  const aiCovered = new Set();
  const addAI = (add, r) => { const j = aijBy[aijKey(r)]; if (!j) return; aiCovered.add(aijKey(r));
    AI_ITEMS.forEach(it => add(it.key, `Conditional recommendation, assumption integrity: ${it.ask}`, ALLOWED.ynp, j.verdicts?.[it.key] ?? null)); };
  fs.mkdirSync(path.join(out, "evaluator", "packets"), { recursive: true }); fs.mkdirSync(path.join(out, "coordinator"), { recursive: true });
  const resp = [["packet_id", "language", "item_id", "question", "allowed_answers", "answer", "comment"]]; const key = [];
  sel.forEach((r, i) => {
    const pid = `P${String(i + 1).padStart(2, "0")}`; const sc = scenarios.find(s => s.id === r.id);
    const optRow = B?.rows.find(x => x.id === r.id && x.run === 1 && x.output);
    fs.writeFileSync(path.join(out, "evaluator", "packets", `${pid}.md`), packetMarkdown(pid, sc, r, optRow?.output));
    const add = (item, question, allowed, judge = null, auto = null) => { resp.push([pid, sc.language, item, question, allowed.join("|"), "", ""]); key.push({ packet_id: pid, scenario_id: r.id, language: sc.language, item_id: item, judge, auto }); };
    add("Q1_understanding", "How well does the diagnosis capture the real problem? (1 = misses it, 5 = as good as a senior consultant)", ALLOWED.scale5);
    add("Q2_facts_vs_assumptions", "Are facts, unverified claims and assumptions labelled correctly, with nothing invented presented as fact? (1–5)", ALLOWED.scale5);
    (r.judgeItems || []).forEach(j => {
      const isSurface = j.key.startsWith("surface");
      const text = j.ask.replace(/^Diagnosis captures: /, "Does the diagnosis capture: ").replace(/^Diagnosis treats this as unproven.*?: /, "Is this treated as unproven (not as an established fact)? ");
      add(`CHK_${j.key}`, text, isSurface ? ALLOWED.ynp : ALLOWED.yn, j.verdict);
    });
    add("Q4_next_step", "Was the AI's next step (its recommended approach, or asking for more information, or saying nothing fits / declining) right for this case?", ALLOWED.approach, null, { status: r.output?.status, top3: r.top3, auto_pass: r.pass });
    add("Q5_language", `Language quality (${sc.language === "ar" ? "native Modern Standard Arabic business register" : "professional English"}) (1–5)`, ALLOWED.scale5);
    add("Q6_usable", "Would you send this to a manager?", ALLOWED.usable);
    if (optRow) OPTION_CRITERIA.forEach(c => add(`OPT_${c}`, `Options — ${c.replace(/_/g, " ")} (1–5)`, ALLOWED.scale5, optRow.scores?.[c] != null ? String(optRow.scores[c]) : null));
    addAI(add, r);
  });
  // Every remaining eligible conditional recommendation (any run) becomes an extra packet rated ONLY on AI1–AI3.
  let extra = sel.length;
  for (const j of aijEligible.filter(x => !aiCovered.has(aijKey(x)))) {
    const r = A.rows.find(x => x.id === j.id && x.run === j.run); const sc = scenarios.find(s => s.id === j.id); if (!r || !sc) continue;
    const pid = `P${String(++extra).padStart(2, "0")}`;
    fs.writeFileSync(path.join(out, "evaluator", "packets", `${pid}.md`), packetMarkdown(pid, sc, r, null));
    addAI((item, question, allowed, judge = null) => { resp.push([pid, sc.language, item, question, allowed.join("|"), "", ""]); key.push({ packet_id: pid, scenario_id: r.id, run: r.run, language: sc.language, item_id: item, judge, auto: null }); }, r);
  }
  const byLang = arr => ({ ar: arr.filter(x => x.lang === "ar").length, en: arr.filter(x => x.lang === "en").length });
  fs.writeFileSync(path.join(out, "evaluator", "responses.csv"), BOM + resp.map(r => r.map(csvq).join(",")).join("\n") + "\n");
  fs.copyFileSync(path.join(root, "..", "docs", "business-solver", "17-human-evaluator-guide.md"), path.join(out, "evaluator", "EVALUATOR-GUIDE.md"));
  const keyBuf = Buffer.from(JSON.stringify(key, null, 1));
  fs.writeFileSync(path.join(out, "coordinator", "KEY-do-not-share.json"), keyBuf);
  const manifest = { prepared_at: new Date().toISOString(), source_a: aPath, source_b: bPath || null, run_id: A.manifest.run_id, eval_version: A.manifest.eval_version,
    packets: extra, calibration_packets: sel.length, arabic: sel.filter(r => r.lang === "ar").length,
    source_aij: aijPath, aij_run_id: AIJ.manifest.run_id, aij_eligible_rows: byLang(aijEligible), aij_eligible_complete: byLang(aijEligible.filter(x => x.complete)),
    response_rows: resp.length - 1, key_sha256: sha(keyBuf),
    blinding: "Share ONLY the evaluator/ folder. coordinator/ holds AI-judge verdicts and automatic grades and must not be visible to the evaluator before submit." };
  fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 1));
  console.log(JSON.stringify(manifest, null, 1));
} else if (process.argv[2] === "submit") {
  const dir = flag("dir"), file = flag("responses"), who = flag("evaluator");
  if (!dir || !file || !who) { console.error("submit needs --dir --responses --evaluator"); process.exit(1); }
  if (fs.existsSync(path.join(dir, "submission-receipt.json"))) { console.error("REFUSED: this round already has a submission. Submissions are final; start a new round folder."); process.exit(2); }
  const buf = fs.readFileSync(file); const rows = parseCsv(buf.toString("utf8"));
  const problems = rows.filter(r => !r.answer || !r.allowed_answers.split("|").includes(r.answer.trim())).map(r => `${r.packet_id}/${r.item_id}: "${r.answer}"`);
  if (problems.length) { console.error(`Incomplete or invalid answers (${problems.length}):\n` + problems.slice(0, 20).join("\n")); process.exit(1); }
  const receiptPath = path.join(dir, "submission-receipt.json");
  fs.copyFileSync(file, path.join(dir, "submitted-responses.csv"));
  fs.writeFileSync(receiptPath, JSON.stringify({ evaluator: who, submitted_at: new Date().toISOString(), responses_sha256: sha(buf), rows: rows.length }, null, 1), { flag: "wx" });
  console.log(`Submission recorded (${rows.length} rows). SHA-256 ${sha(buf)}. The AI-judge verdicts can now be revealed with 'compare'.`);
} else if (process.argv[2] === "compare") {
  const dir = flag("dir"); const receiptPath = path.join(dir, "submission-receipt.json");
  if (!fs.existsSync(receiptPath)) { console.error("REFUSED: no submission receipt. The judge's verdicts stay hidden until the evaluator submits (doc 17 §2)."); process.exit(2); }
  const receipt = JSON.parse(fs.readFileSync(receiptPath)); const buf = fs.readFileSync(path.join(dir, "submitted-responses.csv"));
  if (sha(buf) !== receipt.responses_sha256) { console.error("REFUSED: submitted responses changed after the receipt."); process.exit(2); }
  if (fs.existsSync(path.join(dir, "comparison-report.json"))) { console.error("REFUSED: comparison already produced for this round (results are immutable)."); process.exit(2); }
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, "manifest.json")));
  const resp = Object.fromEntries(parseCsv(buf.toString("utf8")).map(r => [`${r.packet_id}|${r.item_id}`, r]));
  const key = JSON.parse(fs.readFileSync(path.join(dir, "coordinator", "KEY-do-not-share.json")));
  // criterion of an item: CHK_surface_3 → "checklist:surface", CHK_hearsay_0 → "checklist:hearsay", OPT_x → "options:x", Q4 → "next_step_vs_auto"
  const crit = id => id.startsWith("CHK_surface") ? "checklist:surface" : id.startsWith("CHK_hearsay") ? "checklist:hearsay" : id.startsWith("OPT_") ? `options:${id.slice(4)}` : id === "Q4_next_step" ? "next_step_vs_auto_grade" : /^AI\d_/.test(id) ? `assumption_integrity:${id}` : `human_only:${id}`;
  const pairs = []; const humanOnly = []; const dis = [];
  for (const k of key) {
    const h = resp[`${k.packet_id}|${k.item_id}`]; if (!h) continue; const ha = h.answer.trim(); const c = crit(k.item_id);
    if (c.startsWith("assumption_integrity")) { pairs.push({ c, lang: k.language, h: ha, j: k.judge ?? "(none)", kind: "categorical", row: `${k.scenario_id}|${k.run ?? 1}`, item: k.item_id });
      if (ha !== k.judge) dis.push({ type: "judge_assumption_integrity", ...k, human: ha, human_comment: h.comment, question: h.question }); }
    else if (c.startsWith("checklist") && k.judge) { pairs.push({ c, lang: k.language, h: ha, j: k.judge, kind: "categorical" }); if (ha !== k.judge) dis.push({ type: "judge_checklist", ...k, human: ha, human_comment: h.comment, question: h.question }); }
    else if (c.startsWith("options") && k.judge) { pairs.push({ c, lang: k.language, h: +ha, j: +k.judge, kind: "ordinal" }); if (Math.abs(+ha - +k.judge) >= 2) dis.push({ type: "judge_rubric", ...k, human: ha, human_comment: h.comment, question: h.question }); }
    else if (c === "next_step_vs_auto_grade") { const hOk = ha !== "wrong"; pairs.push({ c, lang: k.language, h: hOk ? "ok" : "wrong", j: k.auto.auto_pass ? "ok" : "wrong", kind: "categorical" });
      if (hOk !== !!k.auto.auto_pass) dis.push({ type: "answer_key", ...k, judge: `auto_pass=${k.auto.auto_pass} (${k.auto.status}; ${(k.auto.top3 || []).join(",")})`, human: ha, human_comment: h.comment, question: h.question }); }
    else humanOnly.push({ c, lang: k.language, a: ha });
  }
  const agreeCat = arr => arr.length ? +(arr.reduce((s, x) => s + (x.h === x.j ? 1 : (x.h === "partial" || x.j === "partial") ? 0.5 : 0), 0) / arr.length).toFixed(3) : null;
  const kappa = arr => { if (arr.length < 2) return null; const labels = [...new Set(arr.flatMap(x => [x.h, x.j]))]; const n = arr.length;
    const po = arr.filter(x => x.h === x.j).length / n; const pe = labels.reduce((s, l) => s + (arr.filter(x => x.h === l).length / n) * (arr.filter(x => x.j === l).length / n), 0);
    return pe === 1 ? null : +((po - pe) / (1 - pe)).toFixed(3); };
  const stat = arr => arr[0]?.kind === "ordinal"
    ? { n: arr.length, within_1: +(arr.filter(x => Math.abs(x.h - x.j) <= 1).length / arr.length).toFixed(3), mean_abs_diff: +(arr.reduce((s, x) => s + Math.abs(x.h - x.j), 0) / arr.length).toFixed(2), exact: +(arr.filter(x => x.h === x.j).length / arr.length).toFixed(3) }
    : { n: arr.length, agreement: agreeCat(arr), cohens_kappa: kappa(arr) };
  const LANGS = ["ar", "en"]; const criteria = [...new Set(pairs.map(p => p.c))].sort();
  const by_criterion = Object.fromEntries(criteria.map(c => [c, Object.fromEntries([...LANGS.map(l => { const arr = pairs.filter(p => p.c === c && p.lang === l); const st = arr.length ? stat(arr) : { n: 0 }; return [l, { ...st, insufficient_sample: st.n < 10 }]; }), ["pooled_info_only", stat(pairs.filter(p => p.c === c))]])]));
  const hoCrit = [...new Set(humanOnly.map(x => x.c))].sort();
  const human_only = Object.fromEntries(hoCrit.map(c => [c, Object.fromEntries(LANGS.map(l => { const arr = humanOnly.filter(x => x.c === c && x.lang === l).map(x => x.a); const dist = arr.reduce((m, v) => ((m[v] = (m[v] || 0) + 1), m), {});
    const nums = arr.map(Number).filter(v => !isNaN(v)); return [l, { n: arr.length, distribution: dist, ...(nums.length === arr.length && arr.length ? { mean: +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) } : {}) }]; }))]));
  const per_language_gate = Object.fromEntries(LANGS.map(l => {
    const chk = pairs.filter(p => p.c.startsWith("checklist") && p.lang === l); const opt = pairs.filter(p => p.c.startsWith("options") && p.lang === l);
    const chkAg = agreeCat(chk); const optW1 = opt.length ? opt.filter(x => Math.abs(x.h - x.j) <= 1).length / opt.length : null;
    const reasons = []; if (chk.length < 20) reasons.push(`checklist items ${chk.length} < 20`); if (chkAg === null || chkAg < 0.8) reasons.push(`checklist agreement ${chkAg} < 0.80`); if (optW1 !== null && optW1 < 0.8) reasons.push(`options within-1 ${optW1.toFixed(3)} < 0.80`);
    return [l, { checklist_items: chk.length, checklist_agreement: chkAg, options_items: opt.length, options_within_1: optW1 === null ? null : +optW1.toFixed(3), passes: reasons.length === 0, reasons }];
  }));
  // S7 calibration gate (thresholds-v1.json calibration → CAL.assumption_integrity), per language, independent of the
  // checklist gate: every eligible judged case rated by the human, ≥ 12 item pairs, item agreement ≥ 0.80.
  const assumption_integrity_gate = Object.fromEntries(LANGS.map(l => {
    const arr = pairs.filter(p => p.c.startsWith("assumption_integrity") && p.lang === l);
    const rowsRated = new Set(arr.map(p => p.row)).size, eligible = manifest.aij_eligible_rows?.[l] ?? null, complete = manifest.aij_eligible_complete?.[l] ?? null;
    const rowsAgree = [...new Set(arr.map(p => p.row))].map(rw => { const it = arr.filter(p => p.row === rw); return it.every(p => p.h === "yes") === it.every(p => p.j === "yes"); });
    const ag = agreeCat(arr), reasons = [];
    if (eligible == null) reasons.push("no assumption-integrity judge run linked");
    else { if (complete !== eligible) reasons.push(`${eligible - complete} eligible case(s) without a complete judge verdict`); if (rowsRated < eligible) reasons.push(`human rated ${rowsRated} of ${eligible} eligible case(s)`); }
    if (arr.length < 12) reasons.push(`item pairs ${arr.length} < 12`); if (ag === null || ag < 0.8) reasons.push(`item agreement ${ag} < 0.80`);
    return [l, { eligible_cases: eligible, human_rated_cases: rowsRated, item_pairs: arr.length, item_agreement: ag, cohens_kappa: kappa(arr),
      case_pass_fail_agreement: rowsAgree.length ? +(rowsAgree.filter(Boolean).length / rowsAgree.length).toFixed(3) : null, passes: reasons.length === 0, reasons }];
  }));
  const report = { evidence_class: manifest.run_id?.startsWith("ev") ? "human_calibration_of_model_evaluation" : "SYNTHETIC_OR_UNKNOWN_SOURCE — not a result",
    evaluator: receipt.evaluator, source_run_id: manifest.run_id, eval_version: manifest.eval_version, compared_at: new Date().toISOString(),
    rule: "Calibration passes only if BOTH Arabic and English pass independently: checklist agreement ≥ 0.80 on ≥ 20 items per language, and options within ±1 ≥ 0.80 where rated (thresholds-v1.json). Pooled figures are information only.",
    per_language_gate, calibration_passes: LANGS.every(l => per_language_gate[l].passes), assumption_integrity_gate,
    assumption_integrity_rule: "S7 judge calibrated per language only if every eligible judged case was rated by the human, ≥ 12 item pairs, and item agreement ≥ 0.80 (partial vs yes/no = 0.5); separate from the checklist gate; adjudication must also be complete.", by_criterion, human_only_criteria: human_only,
    disagreements: { total: dis.length, by_type: dis.reduce((m, d) => ((m[d.type] = (m[d.type] || 0) + 1), m), {}), by_language: dis.reduce((m, d) => ((m[d.language] = (m[d.language] || 0) + 1), m), {}) } };
  fs.writeFileSync(path.join(dir, "comparison-report.json"), JSON.stringify(report, null, 1));
  const hdr = ["type", "packet_id", "scenario_id", "language", "item_id", "criterion", "question", "human", "ai_judge_or_auto", "human_comment", "adjudicator", "decision", "rationale", "follow_up"];
  fs.writeFileSync(path.join(dir, "disagreements.csv"), BOM + [hdr, ...dis.map(d => [d.type, d.packet_id, d.scenario_id, d.language, d.item_id, crit(d.item_id), d.question, d.human, d.judge, d.human_comment, "", "", "", ""])].map(r => r.map(csvq).join(",")).join("\n") + "\n");
  console.log(JSON.stringify({ calibration_passes: report.calibration_passes, per_language_gate, assumption_integrity_gate }, null, 1)); console.log(`disagreements: ${dis.length} → ${path.join(dir, "disagreements.csv")} (adjudicate, then run 'summarise')`);
} else if (process.argv[2] === "summarise") {
  // Documents the adjudicated disagreements: every row must have adjudicator, decision and rationale.
  const dir = flag("dir"); const f = path.join(dir, flag("file") || "disagreements.csv");
  const rows = parseCsv(fs.readFileSync(f, "utf8"));
  const DEC = ["human_correct", "judge_correct", "both_defensible", "item_ambiguous"], FU = ["judge_prompt_issue", "answer_key_erratum", "none"];
  const incomplete = rows.filter(r => !r.adjudicator?.trim() || !DEC.includes(r.decision?.trim()) || !r.rationale?.trim() || !FU.includes(r.follow_up?.trim()));
  const count = (key) => rows.reduce((m, r) => { const k = key(r); m[k] = (m[k] || 0) + 1; return m; }, {});
  const sum = { adjudicated: rows.length - incomplete.length, total: rows.length, complete: incomplete.length === 0,
    incomplete_rows: incomplete.map(r => `${r.packet_id}/${r.item_id}`),
    by_decision: count(r => r.decision || "(missing)"), by_follow_up: count(r => r.follow_up || "(missing)"),
    by_criterion_and_language: count(r => `${r.criterion}|${r.language}`), by_type_and_decision: count(r => `${r.type}|${r.decision}`),
    next_version_items: rows.filter(r => r.follow_up && r.follow_up !== "none").map(r => ({ follow_up: r.follow_up, scenario: r.scenario_id, item: r.item_id, language: r.language, rationale: r.rationale })),
    note: "Follow-ups are collected for the NEXT evaluation version; nothing frozen or sealed is changed in place (doc 14 §3)." };
  fs.writeFileSync(path.join(dir, "disagreements-summary.json"), JSON.stringify(sum, null, 1));
  const md = ["# Disagreement log (adjudicated)", "", `Complete: ${sum.complete ? "yes" : "NO: " + incomplete.length + " rows lack adjudicator/decision/rationale/follow-up"}`, "",
    "| Packet | Scenario | Lang | Criterion | Human | AI judge / auto | Decision | Rationale | Follow-up |", "|---|---|---|---|---|---|---|---|---|",
    ...rows.map(r => `| ${r.packet_id} | ${r.scenario_id} | ${r.language} | ${r.criterion} | ${r.human} | ${r.ai_judge_or_auto} | ${r.decision} | ${String(r.rationale).replace(/\|/g, "/")} | ${r.follow_up} |`)];
  fs.writeFileSync(path.join(dir, "disagreements-log.md"), md.join("\n") + "\n");
  console.log(JSON.stringify({ complete: sum.complete, adjudicated: sum.adjudicated, total: sum.total, by_decision: sum.by_decision }, null, 1));
  if (!sum.complete) process.exit(1);
} else console.error("usage: human-eval.mjs prepare|submit|compare|summarise (see header)");
