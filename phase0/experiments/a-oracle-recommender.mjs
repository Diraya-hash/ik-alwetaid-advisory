// Experiment A (deterministic part): run the rules-and-scoring layer on GOLD diagnoses ("oracle mode").
// Measures whether the frozen v0.2 seed matrices + discriminators + gate + No Good Fit rule choose acceptable
// approaches when the diagnosis is perfect. It does NOT measure LLM diagnosis quality (see a-llm.mjs).
import fs from "node:fs";
import { recommend } from "../lib/recommender.mjs";
import { SEED_VERSION } from "../lib/catalogue.mjs";

const ruleArg = process.argv.find(a => a.startsWith("--ngf="));
const ngfRule = ruleArg ? ruleArg.split("=")[1] : "v0.2";
const variant = ngfRule; // v0.2 = frozen baseline; v0.3 = in-sample candidate fixes (gate, cutoff, joint-fit NGF)
const opts = variant === "v0.3" ? { ngfRule: "v0.3", gateRule: "v0.3", displayCutoff: 0.40 } : variant === "v0.3b" ? { ngfRule: "v0.3b", gateRule: "v0.3", displayCutoff: 0.40 } : { ngfRule: "v0.2" };
const { scenarios } = JSON.parse(fs.readFileSync(new URL("../eval/scenarios.json", import.meta.url)));

const alias = id => (id === "fw_gantt" ? "fw_action_plan" : id);
const CONFUSABLE = {
  "SWOT vs PEST/STEEPLE": ["STR-01", "STR-02"],
  "Cause&Effect vs 5 Whys": ["RCA-01", "RCA-02", "RCA-03", "PROC-01"],
  "SIPOC vs BPMN vs VSM": ["PROC-01", "PROC-02", "PROC-03"],
  "Charter vs Action Plan/Gantt": ["PRJ-01", "PRJ-02"],
  "Org Chart vs OMC": ["ORG-01", "ORG-02"],
  "Impact/Effort vs Risk Matrix": ["RSK-03", "STR-04"],
  "Strategic Options vs Impact/Effort": ["STR-03", "STR-04"],
};

const rows = [];
for (const sc of scenarios) {
  const s = sc.gold.slots;
  const out = recommend(s, opts);
  const exp = sc.expected;
  const rec = exp.recommendation;
  const top = out.ranked.slice(0, 3).map(r => r.id);
  const ideal = (rec.ideal || []).map(alias), acceptable = (rec.acceptable || []).map(alias), unacc = (rec.unacceptable || []).map(alias);
  const r = { probableNGF: !!out.probableNGF, id: sc.id, category: sc.category, lang: sc.language, status: out.status, top3: top, top3Scores: out.ranked.slice(0,3).map(x => x.score), suff: out.sufficiency?.score };
  if (exp.gate === "ask") {
    r.kind = "gate"; r.pass = out.status === "insufficient_context";
  } else if (rec.no_good_fit) {
    r.kind = "ngf"; r.pass = out.status === "no_good_fit" || out.status === "out_of_scope";
    r.flaggedForLLM = !!out.probableNGF;
  } else {
    r.kind = "rec";
    r.gatePass = out.status !== "insufficient_context";
    r.falseNGF = out.status === "no_good_fit";
    r.top1Acceptable = out.status === "ok" && (ideal.includes(top[0]) || acceptable.includes(top[0]));
    r.top1Ideal = out.status === "ok" && ideal.includes(top[0]);
    r.top3Hit = out.status === "ok" && top.some(t => ideal.includes(t));
    r.unacceptableInTop3 = top.filter(t => unacc.includes(t));
    r.pass = r.top1Acceptable && r.top3Hit && r.unacceptableInTop3.length === 0;
  }
  rows.push(r);
}

const rec = rows.filter(r => r.kind === "rec"), ngf = rows.filter(r => r.kind === "ngf"), gate = rows.filter(r => r.kind === "gate");
const pct = (n, d) => d ? +(100 * n / d).toFixed(1) : null;
const predNGF = rows.filter(r => r.status === "no_good_fit" || r.status === "out_of_scope");
const summary = {
  experiment: "A-oracle", seed: SEED_VERSION, ngfRule, n: rows.length,
  recommendation: {
    n: rec.length,
    top1_acceptable_pct: pct(rec.filter(r => r.top1Acceptable).length, rec.length),
    top1_ideal_pct: pct(rec.filter(r => r.top1Ideal).length, rec.length),
    top3_hit_pct: pct(rec.filter(r => r.top3Hit).length, rec.length),
    unacceptable_in_top3_cases: rec.filter(r => r.unacceptableInTop3.length).map(r => `${r.id}:${r.unacceptableInTop3.join("+")}`),
    false_ngf_cases: rec.filter(r => r.falseNGF).map(r => r.id),
    false_gate_block_cases: rec.filter(r => !r.gatePass).map(r => r.id),
  },
  no_good_fit: {
    expected: ngf.length, recalled: ngf.filter(r => r.pass).length,
    recall_pct: pct(ngf.filter(r => r.pass).length, ngf.length),
    precision_pct: pct(predNGF.filter(r => r.kind === "ngf").length, predNGF.length),
  },
  probable_ngf_flags: { on_ngf_scenarios: rows.filter(r => r.kind === "ngf" && r.probableNGF).map(r => r.id), on_rec_scenarios: rows.filter(r => r.kind === "rec" && r.probableNGF).map(r => r.id) },
  gate_ask: { n: gate.length, correct_pct: pct(gate.filter(r => r.pass).length, gate.length) },
  confusable: Object.fromEntries(Object.entries(CONFUSABLE).map(([k, ids]) => {
    const rs = rows.filter(r => ids.includes(r.id));
    return [k, `${rs.filter(r => r.pass).length}/${rs.length}`];
  })),
  by_language: Object.fromEntries(["ar", "en"].map(l => [l, `${rows.filter(r => r.lang === l && r.pass).length}/${rows.filter(r => r.lang === l).length}`])),
  overall_pass: `${rows.filter(r => r.pass).length}/${rows.length}`,
};
fs.writeFileSync(new URL(`../results/a-oracle-${ngfRule}.json`, import.meta.url), JSON.stringify({ summary, rows }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const r of rows) console.log(`${r.pass ? "PASS" : "FAIL"} ${r.id.padEnd(8)} ${r.status.padEnd(20)} suff=${r.suff} top3=${r.top3.join(", ")} [${r.top3Scores.join(", ")}]`);
