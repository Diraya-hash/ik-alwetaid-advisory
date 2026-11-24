// Generates tests/fixtures/phase0-parity.json by running the ORIGINAL Phase 0 engine (read-only import) on the
// gold slots of the Phase 0 tuning scenarios, under every rule configuration. No scenario text is copied.
import fs from "node:fs";
import { recommend } from "../../phase0/lib/recommender.mjs";
const { scenarios } = JSON.parse(fs.readFileSync(new URL("../../phase0/eval/scenarios.json", import.meta.url)));
const CONFIGS = { v02: { ngfRule: "v0.2" }, v03: { ngfRule: "v0.3", gateRule: "v0.3", displayCutoff: 0.4 }, v03b: { ngfRule: "v0.3b", gateRule: "v0.3", displayCutoff: 0.4 } };
const cases = [];
for (const sc of scenarios) for (const [name, opts] of Object.entries(CONFIGS)) {
  const out = recommend(sc.gold.slots, opts);
  cases.push({ id: sc.id, config: name, slots: sc.gold.slots, expected: { status: out.status, ranked: out.ranked.map((r) => [r.id, r.score]), suff: out.sufficiency?.score ?? null, probableNGF: !!out.probableNGF, closest: out.closest ?? null } });
}
fs.writeFileSync(new URL("../tests/fixtures/phase0-parity.json", import.meta.url), JSON.stringify({ source: "phase0/lib/recommender.mjs (eval v1 frozen)", generated: new Date().toISOString().slice(0, 10), cases }, null, 1));
console.log(`${cases.length} parity cases`);
