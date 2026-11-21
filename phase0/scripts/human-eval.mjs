// Human evaluation & AI-judge calibration (doc 17). Blinding is enforced by process:
//   1. prepare  → evaluator/ (model outputs + blank responses, NO grades) and coordinator/ (AI-judge verdicts, auto grades)
//   2. submit   → validates the evaluator's completed CSV and writes an immutable receipt with its SHA-256
//   3. compare  → only runs if a receipt exists and the responses are unchanged; then reveals the judge and computes agreement
// Usage:
//   node scripts/human-eval.mjs prepare --a=<results/runs/ev1-heldout-a-...json> [--b=<...-b-...json>] --out=<dir> [--n=20]
//   node scripts/human-eval.mjs submit  --dir=<dir> --responses=<completed.csv> --evaluator="<name>"
//   node scripts/human-eval.mjs compare --dir=<dir>
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
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
  const aPath = flag("a"), bPath = flag("b"), out = flag("out"), n = +(flag("n") || 20);
  if (!aPath || !out) { console.error("prepare needs --a and --out"); process.exit(1); }
  if (fs.existsSync(out)) { console.error(`REFUSED: ${out} exists (each human evaluation round is a new folder).`); process.exit(2); }
  const A = JSON.parse(fs.readFileSync(aPath)); const B = bPath ? JSON.parse(fs.readFileSync(bPath)) : null;
  const { scenarios } = JSON.parse(fs.readFileSync(path.join(root, A.manifest.set_file)));
  const sel = selectScenarios(A.rows, scenarios, n);
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
  });
  fs.writeFileSync(path.join(out, "evaluator", "responses.csv"), BOM + resp.map(r => r.map(csvq).join(",")).join("\n") + "\n");
  fs.copyFileSync(path.join(root, "..", "docs", "business-solver", "17-human-evaluator-guide.md"), path.join(out, "evaluator", "EVALUATOR-GUIDE.md"));
  const keyBuf = Buffer.from(JSON.stringify(key, null, 1));
  fs.writeFileSync(path.join(out, "coordinator", "KEY-do-not-share.json"), keyBuf);
  const manifest = { prepared_at: new Date().toISOString(), source_a: aPath, source_b: bPath || null, run_id: A.manifest.run_id, eval_version: A.manifest.eval_version,
    packets: sel.length, arabic: sel.filter(r => r.lang === "ar").length, response_rows: resp.length - 1, key_sha256: sha(keyBuf),
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
  const resp = Object.fromEntries(parseCsv(buf.toString("utf8")).map(r => [`${r.packet_id}|${r.item_id}`, r]));
  const key = JSON.parse(fs.readFileSync(path.join(dir, "coordinator", "KEY-do-not-share.json")));
  const cat = { ynp: [], yn: [], rubric: [] }; const dis = [];
  for (const k of key) {
    const h = resp[`${k.packet_id}|${k.item_id}`]; if (!h) continue; const ha = h.answer.trim();
    if (k.item_id.startsWith("CHK_") && k.judge) {
      const type = k.item_id.includes("surface") ? "ynp" : "yn"; cat[type].push([ha, k.judge, k.language]);
      if (ha !== k.judge) dis.push({ type: "judge_checklist", ...k, human: ha, human_comment: h.comment, question: h.question });
    } else if (k.item_id.startsWith("OPT_") && k.judge) {
      cat.rubric.push([+ha, +k.judge, k.language]);
      if (Math.abs(+ha - +k.judge) >= 2) dis.push({ type: "judge_rubric", ...k, human: ha, human_comment: h.comment, question: h.question });
    } else if (k.item_id === "Q4_next_step") {
      const humanOk = ha !== "wrong"; if (humanOk !== !!k.auto.auto_pass) dis.push({ type: "answer_key", ...k, judge: `auto_pass=${k.auto.auto_pass} (${k.auto.status}; ${(k.auto.top3 || []).join(",")})`, human: ha, human_comment: h.comment, question: h.question });
    }
  }
  const agree = arr => arr.length ? +(arr.reduce((a, [h, j]) => a + (h === j ? 1 : (h === "partial" || j === "partial") ? 0.5 : 0), 0) / arr.length).toFixed(3) : null;
  const kappa = arr => { if (!arr.length) return null; const labels = [...new Set(arr.flatMap(([h, j]) => [h, j]))]; const n = arr.length;
    const po = arr.filter(([h, j]) => h === j).length / n; const pe = labels.reduce((s, l) => s + (arr.filter(x => x[0] === l).length / n) * (arr.filter(x => x[1] === l).length / n), 0);
    return pe === 1 ? 1 : +((po - pe) / (1 - pe)).toFixed(3); };
  const checklist = [...cat.ynp, ...cat.yn];
  const byLang = l => ({ checklist_agreement: agree(checklist.filter(x => x[2] === l)), n: checklist.filter(x => x[2] === l).length });
  const report = { evaluator: receipt.evaluator, compared_at: new Date().toISOString(),
    checklist: { n: checklist.length, agreement: agree(checklist), cohens_kappa: kappa(checklist), ar: byLang("ar"), en: byLang("en") },
    options_rubric: { n: cat.rubric.length, mean_abs_diff: cat.rubric.length ? +(cat.rubric.reduce((a, [h, j]) => a + Math.abs(h - j), 0) / cat.rubric.length).toFixed(2) : null,
      within_1_pct: cat.rubric.length ? +(100 * cat.rubric.filter(([h, j]) => Math.abs(h - j) <= 1).length / cat.rubric.length).toFixed(1) : null },
    answer_key_disputes: dis.filter(d => d.type === "answer_key").length,
    calibration_gate: { rule: "checklist agreement >= 0.80 on >= 20 items AND Arabic and English each >= 0.75; options rubric within-1 >= 80% (if options present)",
      passes: checklist.length >= 20 && agree(checklist) >= 0.8 && (byLang("ar").checklist_agreement ?? 0) >= 0.75 && (byLang("en").checklist_agreement ?? 0) >= 0.75
        && (cat.rubric.length === 0 || cat.rubric.filter(([h, j]) => Math.abs(h - j) <= 1).length / cat.rubric.length >= 0.8) } };
  fs.writeFileSync(path.join(dir, "comparison-report.json"), JSON.stringify(report, null, 1));
  const hdr = ["type", "packet_id", "scenario_id", "language", "item_id", "question", "human", "ai_judge_or_auto", "human_comment", "adjudicator", "decision", "rationale", "follow_up"];
  fs.writeFileSync(path.join(dir, "disagreements.csv"), BOM + [hdr, ...dis.map(d => [d.type, d.packet_id, d.scenario_id, d.language, d.item_id, d.question, d.human, d.judge, d.human_comment, "", "", "", ""])].map(r => r.map(csvq).join(",")).join("\n") + "\n");
  console.log(JSON.stringify(report, null, 1)); console.log(`disagreements: ${dis.length} → ${path.join(dir, "disagreements.csv")}`);
} else console.error("usage: human-eval.mjs prepare|submit|compare (see header)");
