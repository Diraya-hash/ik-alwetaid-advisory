// Critic Level 1 (item-level) deterministic rules — prototype of packages/critic-rules (04 §7.1).
// Each rule returns findings {rule, severity, target, explanation, suggested_correction}.

export const OPTION_DIRECTION = { impact: +1, effort: -1, risk: -1, feasibility: +1 }; // lower effort/risk is better
export function weightedOptionScore(o, weights) {
  let s = 0;
  for (const [k, w] of Object.entries(weights)) {
    const v = o.assessment[k];
    s += w * (OPTION_DIRECTION[k] > 0 ? v : 6 - v);
  }
  return +s.toFixed(2);
}

const CERTAINTY = {
  en: /\b(will definitely|definitely|certainly|guaranteed|guarantees|will always|always will|no doubt|100% sure|without (any )?doubt)\b/i,
  ar: /(بالتأكيد|حتمًا|حتما|مؤكد|بلا شك|دون شك|مضمون|سيؤدي حتمًا|دائمًا سي)/,
};

function f(rule, severity, target, explanation, suggested_correction) { return { rule, severity, target, explanation, suggested_correction }; }

export function checkRiskMatrix(a) {
  const out = [], n = a.scale;
  for (const r of a.risks) {
    if (!(r.likelihood >= 1 && r.likelihood <= n && r.impact >= 1 && r.impact <= n))
      out.push(f("risk.range", "high", r.id, `Likelihood/impact must be 1–${n}.`, { type: "change_value" }));
    else if (r.score !== r.likelihood * r.impact)
      out.push(f("risk.score_calc", "critical", r.id, `Score ${r.score} ≠ likelihood ${r.likelihood} × impact ${r.impact}.`, { type: "change_value", patch: { score: r.likelihood * r.impact } }));
    if (!r.owner) out.push(f("risk.owner", "high", r.id, "Risk has no owner.", { type: "user_decision" }));
    if (r.likelihood * r.impact >= Math.ceil(n * n * 0.6) && !(r.mitigation && r.mitigation.trim()))
      out.push(f("risk.high_no_mitigation", "high", r.id, "High-rated risk has no mitigation.", { type: "add_item" }));
  }
  return out;
}

export function checkOptionSet(a) {
  const out = [];
  const wsum = Object.values(a.weights).reduce((x, y) => x + y, 0);
  if (Math.abs(wsum - 1) > 0.001) out.push(f("options.weights_sum", "critical", "weights", `Weights sum to ${wsum.toFixed(2)}, not 100%.`, { type: "change_value" }));
  for (const o of a.options) {
    for (const k of ["impact", "effort", "risk", "feasibility"]) {
      const v = o.assessment[k];
      if (!(Number.isInteger(v) && v >= 1 && v <= 5)) out.push(f("options.score_range", "high", o.id, `${k} must be an integer 1–5.`, { type: "change_value" }));
    }
    if (Math.abs(wsum - 1) <= 0.001 && Object.values(o.assessment).every(v => v >= 1 && v <= 5)) {
      const exp = weightedOptionScore(o, a.weights);
      if (Math.abs(exp - o.weighted_score) > 0.011) out.push(f("options.weighted_calc", "critical", o.id, `Weighted score ${o.weighted_score} ≠ computed ${exp}.`, { type: "change_value", patch: { weighted_score: exp } }));
    }
  }
  if (a.preferred) {
    const best = [...a.options].sort((x, y) => y.weighted_score - x.weighted_score);
    if (best.length > 1 && best[0].weighted_score - best[1].weighted_score < 0.3 && !a.too_close_flag)
      out.push(f("options.too_close_unflagged", "medium", "preferred", "Top two options are within 0.3; the recommendation should say it is close.", { type: "replace_text" }));
  }
  return out;
}

function hasCycle(actions) {
  const g = Object.fromEntries(actions.map(x => [x.id, x.depends_on || []]));
  const state = {};
  const dfs = v => { state[v] = 1; for (const w of g[v] || []) { if (state[w] === 1) return true; if (!state[w] && g[w] && dfs(w)) return true; } state[v] = 2; return false; };
  return actions.some(x => !state[x.id] && dfs(x.id));
}
export function checkActionPlan(a) {
  const out = [];
  const byId = Object.fromEntries(a.actions.map(x => [x.id, x]));
  for (const x of a.actions) {
    if (!x.owner) out.push(f("action.owner", "high", x.id, "Action has no owner.", { type: "user_decision" }));
    if (x.start && x.end && x.end < x.start) out.push(f("action.date_order", "critical", x.id, `End ${x.end} is before start ${x.start}.`, { type: "change_value" }));
    for (const d of x.depends_on || []) {
      const p = byId[d];
      if (!p) out.push(f("action.dependency_missing", "high", x.id, `Depends on unknown action ${d}.`, { type: "change_value" }));
      else if (p.end && x.start && x.start < p.end) out.push(f("action.dependency_order", "high", x.id, `Starts ${x.start} before predecessor ${d} ends ${p.end}.`, { type: "change_value" }));
    }
    if (a.deadline && x.end && x.end > a.deadline) out.push(f("action.after_deadline", "high", x.id, `Ends ${x.end}, after the plan deadline ${a.deadline}.`, { type: "change_value" }));
  }
  if (hasCycle(a.actions)) out.push(f("action.dependency_cycle", "critical", "plan", "Dependencies form a cycle.", { type: "change_value" }));
  return out;
}

export function checkAssumptionWording(stmts) {
  const out = [];
  for (const s of stmts) {
    if (s.truth_status !== "assumption" && s.truth_status !== "unverified") continue;
    if (CERTAINTY[s.language]?.test(s.text))
      out.push(f("statement.certainty_wording", "medium", s.id, "An unverified statement is worded as certain.", { type: "replace_text" }));
  }
  return out;
}

export function runL1(artifact) {
  switch (artifact.kind) {
    case "risk_matrix": return checkRiskMatrix(artifact);
    case "option_set": return checkOptionSet(artifact);
    case "action_plan": return checkActionPlan(artifact);
    case "statements": return checkAssumptionWording(artifact.statements);
    default: return [];
  }
}
