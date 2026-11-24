import { describe, expect, it } from "vitest";
import fixture from "./fixtures/phase0-parity.json";
import { recommend, type RecOptions } from "@/engine/recommender";
import type { Slots } from "@/engine/types";

const CONFIGS: Record<string, RecOptions> = { v02: { ngfRule: "v0.2" }, v03: { ngfRule: "v0.3", gateRule: "v0.3", displayCutoff: 0.4 }, v03b: { ngfRule: "v0.3b", gateRule: "v0.3", displayCutoff: 0.4 } };

describe("TypeScript engine reproduces the Phase 0 engine exactly", () => {
  for (const c of fixture.cases) {
    it(`${c.id} (${c.config})`, () => {
      const out = recommend(c.slots as unknown as Slots, CONFIGS[c.config]);
      expect(out.status).toBe(c.expected.status);
      expect(out.ranked.map((r) => [r.id, r.score])).toEqual(c.expected.ranked);
      expect(out.sufficiency?.score ?? null).toBe(c.expected.suff);
      expect(!!out.probableNGF).toBe(c.expected.probableNGF);
      expect(out.closest ?? null).toEqual(c.expected.closest);
    });
  }
});
