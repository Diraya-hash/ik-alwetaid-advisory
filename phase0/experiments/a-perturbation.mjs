// Experiment A (deterministic part, robustness): how sensitive is the rules layer to IMPERFECT diagnoses?
// Simulates realistic extraction errors on the gold slots and measures top-1 acceptability.
import fs from "node:fs";
import { recommend } from "../lib/recommender.mjs";
import { STAGES } from "../lib/catalogue.mjs";

const { scenarios } = JSON.parse(fs.readFileSync(new URL("../eval/scenarios.json", import.meta.url)));
const variant = (process.argv.find(a => a.startsWith("--variant=")) || "--variant=v0.3").split("=")[1];
const opts = variant === "v0.3" ? { ngfRule: "v0.3", gateRule: "v0.3", displayCutoff: 0.40 } : variant === "v0.3b" ? { ngfRule: "v0.3b", gateRule: "v0.3", displayCutoff: 0.40 } : { ngfRule: "v0.2" };
const alias = id => (id === "fw_gantt" ? "fw_action_plan" : id);

// deterministic PRNG
let seed = 42; const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = arr => arr[Math.floor(rnd() * arr.length)];

const ERRORS = {
  drop_bool_signal: s => { const k = pick(["process_boundaries","steps_known","measurable_symptom","new_initiative","external_focus","items_are_threats","deadline_known"]); s[k] = null; return `null:${k}`; },
  flip_bool_signal: s => { const k = pick(["process_boundaries","steps_known","measurable_symptom","new_initiative","external_focus","items_are_threats"]); s[k] = s[k] === true ? false : true; return `flip:${k}`; },
  complexity_off_by_one: s => { const d = rnd() < .5 ? -1 : 1; s.causal_complexity = Math.min(5, Math.max(1, (s.causal_complexity ?? 2) + d)); return `cc${d > 0 ? "+" : "-"}1`; },
  swap_stage: s => { if (s.stage.secondary) { const p = s.stage.primary; s.stage = { primary: s.stage.secondary, secondary: p }; return "swap_stage"; } s.stage = { ...s.stage, secondary: pick(STAGES) }; return "add_secondary"; },
  wrong_primary_stage: s => { s.stage = { primary: pick(STAGES), secondary: s.stage.primary }; return "wrong_primary"; },
  swap_domains: s => { if ((s.domains || []).length > 1) { s.domains = [s.domains[1], s.domains[0], ...s.domains.slice(2)]; return "swap_domains"; } return "noop"; },
  wrong_structure_focus: s => { s.structure_focus = pick(["reporting_lines","delivery_model","none"]); return "structure_focus"; },
  options_count_off: s => { s.options_listed = pick([0, 1, 3, 5]); return "options_count"; },
};
const MILD = ["drop_bool_signal","complexity_off_by_one","swap_domains","options_count_off"];
const MODERATE = [...MILD, "flip_bool_signal","swap_stage","wrong_structure_focus"];
const SEVERE = ["wrong_primary_stage"];

const levels = { "L1 (1 mild error)": [MILD, 1], "L2 (2 moderate errors)": [MODERATE, 2], "L3 (3 moderate errors)": [MODERATE, 3], "L4 (wrong primary stage)": [SEVERE, 1] };
const N = 60;
const recScen = scenarios.filter(sc => sc.expected.gate !== "ask" && !sc.expected.recommendation.no_good_fit);
const out = {};
for (const [lvl, [pool, k]] of Object.entries(levels)) {
  let ok = 0, unacc = 0, blocked = 0, ngf = 0, total = 0, flagged = 0;
  for (const sc of recScen) {
    const ideal = sc.expected.recommendation.ideal.map(alias), acc = sc.expected.recommendation.acceptable.map(alias), un = sc.expected.recommendation.unacceptable.map(alias);
    for (let i = 0; i < N; i++) {
      const s = structuredClone(sc.gold.slots);
      for (let j = 0; j < k; j++) ERRORS[pick(pool)](s);
      const r = recommend(s, opts); total++;
      if (r.status === "insufficient_context") { blocked++; continue; }
      if (r.status !== "ok") { ngf++; continue; }
      if (r.probableNGF) flagged++;
      const top = r.ranked.slice(0, 3).map(x => x.id);
      if (ideal.includes(top[0]) || acc.includes(top[0])) ok++;
      if (top.some(t => un.includes(t))) unacc++;
    }
  }
  out[lvl] = { trials: total, top1_acceptable_pct: +(100 * ok / total).toFixed(1), unacceptable_in_top3_pct: +(100 * unacc / total).toFixed(1), gate_blocked_pct: +(100 * blocked / total).toFixed(1), false_ngf_pct: +(100 * ngf / total).toFixed(1), probable_ngf_flag_pct: +(100 * flagged / total).toFixed(1) };
}
const res = { experiment: "A-perturbation", variant, scenarios: recScen.length, trials_per_scenario_per_level: N, levels: out };
fs.writeFileSync(new URL(`../results/a-perturbation-${variant}.json`, import.meta.url), JSON.stringify(res, null, 1));
console.log(JSON.stringify(res, null, 1));
