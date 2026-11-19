// Experiment C (deterministic part): Critic Level 1 on a seeded-defect set.
// Artifacts are generated with KNOWN injected defects (ground truth) plus clean artifacts; we measure
// precision/recall per rule. Also a hand-labelled AR/EN set for the lexical "certainty wording" rule.
import fs from "node:fs";
import { runL1, weightedOptionScore } from "../lib/critic-rules.mjs";

let seed = 7; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const day = (d) => new Date(Date.UTC(2027, 0, 1) + d * 864e5).toISOString().slice(0, 10);

const truth = []; // {artifactIdx, rule, target}
const artifacts = [];
function add(art, defects) { const idx = artifacts.push(art) - 1; defects.forEach(d => truth.push({ idx, ...d })); }

// ---- Risk matrices
for (let m = 0; m < 20; m++) {
  const scale = [3, 4, 5][m % 3];
  const risks = Array.from({ length: ri(5, 12) }, (_, i) => {
    const L = ri(1, scale), I = ri(1, scale);
    return { id: `R${i + 1}`, likelihood: L, impact: I, score: L * I, owner: `Owner ${i}`, mitigation: "Mitigation text" };
  });
  const defects = [];
  if (m >= 5) { // 15 defective, 5 clean
    const kinds = ["calc", "owner", "range", "mitig"];
    const nDef = ri(1, 3); const used = new Set();
    for (let k = 0; k < nDef; k++) {
      const r = risks[ri(0, risks.length - 1)]; if (used.has(r.id)) continue; used.add(r.id);
      const kind = kinds[ri(0, 3)];
      if (kind === "calc") { r.score = r.score + ri(1, 3); defects.push({ rule: "risk.score_calc", target: r.id }); }
      if (kind === "owner") { r.owner = ""; defects.push({ rule: "risk.owner", target: r.id }); }
      if (kind === "range") { r.likelihood = scale + 1; r.score = r.likelihood * r.impact; defects.push({ rule: "risk.range", target: r.id }); if (r.likelihood * r.impact >= Math.ceil(scale * scale * 0.6) && !r.mitigation) {} }
      if (kind === "mitig") { r.likelihood = scale; r.impact = scale; r.score = scale * scale; r.mitigation = ""; defects.push({ rule: "risk.high_no_mitigation", target: r.id }); }
    }
  }
  add({ kind: "risk_matrix", scale, risks }, defects);
}
// ---- Option sets
for (let m = 0; m < 20; m++) {
  const weights = { impact: 0.35, effort: 0.2, risk: 0.2, feasibility: 0.25 };
  const options = Array.from({ length: ri(3, 6) }, (_, i) => {
    const o = { id: `O${i + 1}`, assessment: { impact: ri(1, 5), effort: ri(1, 5), risk: ri(1, 5), feasibility: ri(1, 5) } };
    o.weighted_score = weightedOptionScore(o, weights); return o;
  });
  const set = { kind: "option_set", weights, options, preferred: options[0].id, too_close_flag: false };
  const sorted = [...options].sort((x, y) => y.weighted_score - x.weighted_score);
  set.too_close_flag = sorted.length > 1 && sorted[0].weighted_score - sorted[1].weighted_score < 0.3;
  const defects = [];
  if (m >= 5) {
    const kind = ["calc", "weights", "range", "close"][m % 4];
    if (kind === "calc") { const o = options[ri(0, options.length - 1)]; o.weighted_score = +(o.weighted_score + 0.5).toFixed(2); defects.push({ rule: "options.weighted_calc", target: o.id }); }
    if (kind === "weights") { set.weights = { ...weights, impact: 0.45 }; defects.push({ rule: "options.weights_sum", target: "weights" }); }
    if (kind === "range") { const o = options[0]; o.assessment.risk = 7; defects.push({ rule: "options.score_range", target: o.id }); }
    if (kind === "close") { // make top-2 close and leave unflagged
      const s2 = [...options].sort((x, y) => y.weighted_score - x.weighted_score);
      s2[1].assessment = { ...s2[0].assessment }; s2[1].weighted_score = s2[0].weighted_score; set.too_close_flag = false;
      defects.push({ rule: "options.too_close_unflagged", target: "preferred" });
    }
  }
  // the generator itself can create a genuinely close-but-unflagged set? no: flag computed above for clean ones.
  add(set, defects);
}
// ---- Action plans
for (let m = 0; m < 20; m++) {
  const n = ri(5, 12);
  const actions = []; let cursor = 0;
  for (let i = 0; i < n; i++) {
    const dur = ri(5, 30); const start = cursor + ri(0, 5);
    const deps = i > 0 && rnd() < 0.5 ? [`A${i}`] : [];
    const st = deps.length ? Math.max(start, actions[i - 1].endN) : start;
    actions.push({ id: `A${i + 1}`, owner: `Team ${i % 4}`, startN: st, endN: st + dur, depends_on: deps });
    cursor = st + 2;
  }
  const deadlineN = Math.max(...actions.map(a => a.endN)) + 10;
  const defects = [];
  if (m >= 5) {
    const kind = ["date", "owner", "deporder", "cycle", "deadline"][m % 5];
    if (kind === "date") { const a = actions[ri(0, n - 1)]; a.endN = a.startN - 3; defects.push({ rule: "action.date_order", target: a.id });
      // shortening may also break a successor's dependency order? no: successor starts >= old end > new end. fine
    }
    if (kind === "owner") { const a = actions[ri(0, n - 1)]; a.owner = ""; defects.push({ rule: "action.owner", target: a.id }); }
    if (kind === "deporder") { const a = actions.find(x => x.depends_on.length) || actions[n - 1]; if (!a.depends_on.length) a.depends_on = [actions[0].id];
      const p = actions.find(x => x.id === a.depends_on[0]); a.startN = p.endN - 4; a.endN = Math.max(a.endN, a.startN + 3); defects.push({ rule: "action.dependency_order", target: a.id }); }
    if (kind === "cycle") { // true 2-node cycle: A1 -> A2 -> A1 (fixed after run 1: the earlier injection did not always close a cycle)
      actions[1].depends_on = [actions[0].id]; actions[1].startN = Math.max(actions[1].startN, actions[0].endN); actions[1].endN = actions[1].startN + 10;
      actions[0].depends_on = [actions[1].id];
      defects.push({ rule: "action.dependency_cycle", target: "plan" });
      defects.push({ rule: "action.dependency_order", target: actions[0].id }); } // A1 starts before its (cyclic) predecessor A2 ends
    if (kind === "deadline") { const a = actions[n - 1]; a.endN = deadlineN + 5; defects.push({ rule: "action.after_deadline", target: a.id }); }
  }
  const plan = { kind: "action_plan", deadline: day(deadlineN), actions: actions.map(a => ({ id: a.id, owner: a.owner, start: day(a.startN), end: day(a.endN), depends_on: a.depends_on })) };
  add(plan, defects);
}

// ---- Run
const key = (x) => `${x.idx}|${x.rule}|${x.target}`;
const found = [];
artifacts.forEach((a, idx) => runL1(a).forEach(fd => found.push({ idx, rule: fd.rule, target: fd.target, sev: fd.severity })));
const T = new Set(truth.map(key)), F = new Set(found.map(key));
const rules = [...new Set([...truth.map(t => t.rule), ...found.map(x => x.rule)])].sort();
const perRule = Object.fromEntries(rules.map(r => {
  const t = truth.filter(x => x.rule === r).map(key), fd = found.filter(x => x.rule === r).map(key);
  const tp = fd.filter(k => T.has(k)).length;
  return [r, { seeded: t.length, flagged: fd.length, tp, fp: fd.length - tp, fn: t.filter(k => !F.has(k)).length }];
}));
const tp = [...F].filter(k => T.has(k)).length;
const structural = { artifacts: artifacts.length, clean_artifacts: artifacts.filter((_, i) => !truth.some(t => t.idx === i)).length,
  seeded_defects: T.size, findings: F.size, precision_pct: +(100 * tp / F.size).toFixed(1), recall_pct: +(100 * tp / T.size).toFixed(1),
  false_positives_on_clean_artifacts: found.filter(x => !truth.some(t => t.idx === x.idx)).length, per_rule: perRule };

// ---- Certainty-wording rule on a hand-labelled set (AR/EN), incl. hard negatives
const labelled = JSON.parse(fs.readFileSync(new URL("../eval/certainty-wording.json", import.meta.url)));
let ctp = 0, cfp = 0, cfn = 0, ctn = 0; const errors = [];
for (const s of labelled.items) {
  const hit = runL1({ kind: "statements", statements: [{ ...s, truth_status: "assumption" }] }).length > 0;
  if (hit && s.label) ctp++; else if (hit && !s.label) { cfp++; errors.push({ type: "FP", ...s }); } else if (!hit && s.label) { cfn++; errors.push({ type: "FN", ...s }); } else ctn++;
}
const lexical = { items: labelled.items.length, precision_pct: +(100 * ctp / (ctp + cfp)).toFixed(1), recall_pct: +(100 * ctp / (ctp + cfn)).toFixed(1), errors };
const res = { experiment: "C-critic-L1", structural, lexical };
fs.writeFileSync(new URL("../results/c-critic-l1.json", import.meta.url), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
