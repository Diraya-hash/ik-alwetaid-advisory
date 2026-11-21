// Experiment F: aggregate measured cost & latency from results/llm-runs.jsonl (written by llm-suite.mjs).
// Reports per route (and effort) p50/p90 latency, tokens, cost, refusal/error rates, cache-read share,
// and a composed cost per completed single-framework analysis and per 4-step chain.
import fs from "node:fs";
const file = new URL("../results/llm-runs.jsonl", import.meta.url);
if (!fs.existsSync(file)) { console.log("No measured runs yet (results/llm-runs.jsonl missing). Run llm-suite.mjs with ANTHROPIC_API_KEY set."); process.exit(0); }
// --eval-version=N (default: all) and --set=heldout|tuning (default: all) filter the measured calls.
const flag = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || "").split("=")[1];
const EV = flag("eval-version"), SETF = flag("set");
const recs = fs.readFileSync(file, "utf8").trim().split("\n").map(JSON.parse).filter(r => !r.dry_run)
  .filter(r => (!EV || String(r.eval_version) === EV) && (!SETF || r.set === SETF));
const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const groups = {}; recs.forEach(r => (groups[`${r.route}|${r.effort}`] ||= []).push(r));
const routes = Object.fromEntries(Object.entries(groups).map(([k, rs]) => {
  const ok = rs.filter(r => r.usage);
  const inTok = ok.map(r => r.usage.input + (r.usage.cache_read || 0) + (r.usage.cache_write || 0));
  return [k, { calls: rs.length, errors: rs.filter(r => r.error).length, refusals: rs.filter(r => r.stop_reason === "refusal").length, max_tokens_stops: rs.filter(r => r.stop_reason === "max_tokens").length,
    parse_failures: rs.filter(r => r.usage && !r.parsed_ok).length,
    latency_p50_ms: q(rs.map(r => r.latency_ms), 0.5), latency_p90_ms: q(rs.map(r => r.latency_ms), 0.9),
    input_tokens_p50: q(inTok, 0.5), output_tokens_p50: q(ok.map(r => r.usage.output), 0.5), output_tokens_p90: q(ok.map(r => r.usage.output), 0.9),
    cache_read_share_pct: ok.length ? +(100 * ok.reduce((a, r) => a + (r.usage.cache_read || 0), 0) / Math.max(1, inTok.reduce((a, b) => a + b, 0))).toFixed(1) : null,
    cost_mean_usd: ok.length ? +(ok.reduce((a, r) => a + r.cost_usd, 0) / ok.length).toFixed(4) : null }];
}));
const mean = (route, effort) => routes[`${route}|${effort}`]?.cost_mean_usd ?? null;
function compose(effort) {
  const parts = { diagnosis: mean("diagnosis", effort), rerank: mean("rerank", effort), options: mean("options", effort),
    critic_framework: mean("critic-framework", effort), critic_project: mean("critic-project", effort) };
  if (Object.values(parts).some(v => v === null)) return { effort, note: "incomplete: run a, b and c at this effort", parts };
  // Framework draft call not yet measured in Phase 0 (no framework-draft experiment) — proxied by the options call cost.
  const single = parts.diagnosis + parts.rerank + parts.options /* draft proxy */ + parts.critic_framework + parts.critic_project;
  const chain4 = parts.diagnosis + parts.rerank + 3 * parts.options /* 3 drafts proxy */ + parts.options + 3 * parts.critic_framework + parts.critic_project;
  return { effort, parts, single_framework_analysis_usd: +single.toFixed(3), four_step_chain_usd: +chain4.toFixed(3), note: "framework drafting cost proxied by options-call cost" };
}
const efforts = [...new Set(recs.map(r => r.effort))];
const sequentialLatency = Object.fromEntries(efforts.map(e => [e, (routes[`diagnosis|${e}`]?.latency_p90_ms ?? 0) + (routes[`rerank|${e}`]?.latency_p90_ms ?? 0)]));
const out = { experiment: "F-cost-latency", calls: recs.length, routes, per_analysis: efforts.map(compose), diagnosis_plus_recommendation_p90_ms: sequentialLatency,
  pricing_note: "List prices from lib/llm.mjs PRICES (skill cache 2026-11-03); verify against the current pricing page before using in commercial decisions." };
fs.writeFileSync(new URL("../results/f-cost-latency.json", import.meta.url), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
