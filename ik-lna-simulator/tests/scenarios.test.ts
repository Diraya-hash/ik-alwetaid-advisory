import { describe, expect, it } from "vitest";
import { scenarios } from "@/content/scenarios";
import { validateScenario } from "@/engine/schema";

describe("scenario library", () => {
  it("has unique scenario ids", () => {
    const ids = scenarios.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  for (const s of scenarios) {
    it(`${s.id}: passes schema and referential integrity`, () => {
      expect(validateScenario(s)).toEqual([]);
    });
    it(`${s.id}: every stakeholder has at least one question available at the start`, () => {
      for (const st of s.stakeholders) {
        expect(st.questions.some((q) => !q.available), st.id).toBe(true);
      }
    });
    it(`${s.id}: the budget cannot cover everything (forces prioritisation)`, () => {
      const total =
        s.evidence.filter((e) => e.initiallyAvailable).reduce((n, e) => n + e.reviewCostHours, 0) +
        s.stakeholders.flatMap((x) => x.questions).reduce((n, q) => n + q.costHours, 0);
      expect(total).toBeGreaterThan(s.budgetHours);
    });
  }
});

describe("validator catches broken content", () => {
  it("flags a dangling evidence reference and a missing Arabic string", () => {
    const broken = structuredClone(scenarios[0]!);
    broken.stakeholders[0]!.questions[0]!.responses[0]!.reveals = ["ev-does-not-exist"];
    broken.title.ar = "";
    const errors = validateScenario(broken);
    expect(errors.some((e) => e.includes("title.ar"))).toBe(true);
  });
  it("flags a dangling reference when the shape is valid", () => {
    const broken = structuredClone(scenarios[0]!);
    broken.stakeholders[0]!.questions[0]!.responses[0]!.reveals = ["ev-does-not-exist"];
    expect(validateScenario(broken).join("\n")).toContain("ev-does-not-exist");
  });
});
