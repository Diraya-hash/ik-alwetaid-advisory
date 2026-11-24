// Builder logic and critic checks on realistic business scenarios (English and Arabic).
import { describe, expect, it } from "vitest";
import { checkSwot, emptySwot, type Swot } from "@/engine/builders/swot";
import { checkWhys, rootStrength, type FiveWhys } from "@/engine/builders/whys";
import { checkFishbone, emptyFishbone } from "@/engine/builders/fishbone";
import { checkMatrix, prioritise, quadrant, type Initiative } from "@/engine/builders/matrix";
import { checkPlan, emptyPlan, type Action } from "@/engine/builders/plan";
import { assumptionsRegister, linkables, read, seed, suggestedActions } from "@/engine/builders";
import { diff } from "@/engine/history";
import { newProject } from "@/engine/project";

const codes = (f: { code: string }[]) => f.map((x) => x.code);
const si = (id: string, text: string, truth: "verified" | "unverified" | "assumption" = "unverified", importance: 1 | 2 | 3 = 2, evidence = "") => ({ id, text, truth, importance, evidence });

describe("SWOT: regional logistics firm reviewing its growth strategy", () => {
  const base: Swot = {
    s: [si("s1", "On-time delivery rate of 96% in the last 12 months", "verified", 3, "Operations dashboard"), si("s2", "Long-term contracts with three major retailers", "verified", 2, "Contract register")],
    w: [si("w1", "Warehouse management system is 11 years old", "verified", 2, "IT asset list"), si("w2", "Communication")],
    o: [si("o1", "E-commerce parcel volumes in the region growing 18% a year", "unverified", 3), si("o2", "Our team has strong route-planning skills")],
    t: [si("t1", "Two new competitors offering same-day delivery", "unverified", 2), si("t2", "Fuel prices rising", "assumption", 1)],
    implications: [],
  };
  it("flags vague and misplaced entries and the missing implications", () => {
    const f = checkSwot(base);
    expect(f.find((x) => x.code === "vague")?.target).toBe("w2");
    expect(f.find((x) => x.code === "looks_internal")?.target).toBe("o2");
    expect(codes(f)).toContain("no_implications");
  });
  it("checks that each implication draws on the right quadrants", () => {
    const f = checkSwot({ ...base, implications: [{ id: "i1", type: "SO", text: "Use our delivery record to win e-commerce contracts", links: ["s1", "o1"] }, { id: "i2", type: "WT", text: "Replace the WMS before competitors scale", links: ["s1"] }, { id: "i3", type: "ST", text: "Lock in retailers", links: [] }] });
    expect(codes(f)).not.toContain("no_implications");
    expect(f.find((x) => x.code === "implication_mismatch")?.target).toBe("i2");
    expect(f.find((x) => x.code === "implication_unlinked")?.target).toBe("i3");
  });
  it("detects the same entry in two quadrants", () => {
    const f = checkSwot({ ...emptySwot(), s: [si("a", "Strong brand in the Gulf")], w: [si("b", "strong brand in the gulf")] });
    expect(codes(f)).toContain("duplicate_across");
  });
  it("works in Arabic", () => {
    const f = checkSwot({ ...emptySwot(), s: [si("a", "الجودة")], o: [si("b", "فريقنا يمتلك خبرة طويلة في التخطيط")] });
    expect(f.find((x) => x.code === "vague")?.target).toBe("a");
    expect(f.find((x) => x.code === "looks_internal")?.target).toBe("b");
  });
});

describe("5 Whys: recurring invoice errors in a billing team", () => {
  const n = (id: string, parentId: string | null, text: string, truth: "verified" | "unverified" | "assumption", extra: Partial<FiveWhys["nodes"][0]> = {}) => ({ id, parentId, text, truth, evidence: truth === "verified" ? "audit sample" : "", isRoot: false, countermeasure: "", ...extra });
  const tree: FiveWhys = {
    problem: "12% of invoices were re-issued in each of the last six months", problemTruth: "verified",
    nodes: [
      n("a", null, "Invoices contain the wrong contract price", "verified"),
      n("b", "a", "Price changes are entered manually from emails", "verified"),
      n("c", "b", "The contract system does not feed the billing system", "verified", { isRoot: true, countermeasure: "Build a nightly price feed" }),
      n("d", null, "Customer addresses are outdated", "unverified"),
      n("e", "d", "Sales staff are careless when updating records", "assumption", { isRoot: true }),
    ],
  };
  it("a fully verified chain supports its root cause", () => expect(rootStrength(tree, "c").strength).toBe("supported"));
  it("an assumed step anywhere in the chain keeps the root a hypothesis, never a proven cause", () => {
    const f = checkWhys(tree);
    expect(rootStrength(tree, "e")).toEqual({ strength: "assumed", weakestStep: 2 });
    expect(f.find((x) => x.code === "root_assumed")?.target).toBe("e");
    expect(f.find((x) => x.code === "blames_person")?.target).toBe("e");
    expect(f.find((x) => x.code === "stopped_early")?.target).toBe("e");
    expect(f.find((x) => x.code === "no_countermeasure")?.target).toBe("e");
  });
  it("even a fifth answer marked verified stays a hypothesis if an earlier step is only reported", () => {
    const t: FiveWhys = { problem: tree.problem, problemTruth: "verified", nodes: [n("1", null, "w1", "verified"), n("2", "1", "w2", "unverified"), n("3", "2", "w3", "verified"), n("4", "3", "w4", "verified"), n("5", "4", "w5", "verified", { isRoot: true, countermeasure: "x" })] };
    expect(rootStrength(t, "5")).toEqual({ strength: "hypothesis", weakestStep: 2 });
    expect(codes(checkWhys(t))).toContain("root_unverified");
  });
  it("suggests a fishbone when causes are complex but only one branch was explored", () => {
    expect(codes(checkWhys({ ...tree, nodes: tree.nodes.slice(0, 3) }, { causalComplexity: 4 }))).toContain("consider_fishbone");
  });
});

describe("Fishbone: customer complaints at a hospital outpatient clinic", () => {
  it("guides from an empty diagram to a focused one", () => {
    const fb = emptyFishbone("Average outpatient waiting time rose from 25 to 70 minutes");
    expect(codes(checkFishbone(fb))).toEqual(expect.arrayContaining(["few_causes", "empty_category"]));
    const [people, process, tech] = fb.categories;
    const c = (id: string, cat: string, text: string, likely = false, truth: "verified" | "assumption" = "assumption") => ({ id, categoryId: cat, parentId: null, text, truth, likely, evidence: truth === "verified" ? "rota data" : "" });
    fb.causes = [c("1", people!.id, "Two consultants left and were not replaced", true, "verified"), c("2", process!.id, "All patients booked for 9:00", true), c("3", tech!.id, "Check-in kiosks fail twice a week"),
      c("4", process!.id, "Lack of training"), c("5", people!.id, "Nurses cover reception at peak times"), c("6", process!.id, "Lab results arrive after the appointment")];
    const f = checkFishbone(fb);
    expect(codes(f)).not.toContain("few_causes");
    expect(f.find((x) => x.code === "likely_unverified")?.target).toBe("2");
    expect(f.find((x) => x.code === "missing_solution")?.target).toBe("4");
  });
  it("Arabic causes phrased as missing solutions are flagged", () => {
    const fb = emptyFishbone("ارتفاع زمن الانتظار");
    fb.causes = [{ id: "x", categoryId: fb.categories[0]!.id, parentId: null, text: "نقص التدريب", truth: "assumption", likely: false, evidence: "" }];
    expect(checkFishbone(fb).find((x) => x.code === "missing_solution")?.target).toBe("x");
  });
});

describe("Impact/effort: a retail bank choosing service improvements", () => {
  const i = (id: string, title: string, impact: number, effort: number, why = "basis"): Initiative => ({ id, title, impact, effort, impactWhy: why, effortWhy: why, truth: "unverified" });
  const items = [i("a", "Publish branch waiting times online", 4, 1), i("b", "Replace the core banking platform", 5, 5), i("c", "Refresh brochure design", 2, 1), i("d", "Open branches on Saturdays", 2, 4), i("e", "Callback service for mortgage queries", 4, 2)];
  it("classifies quadrants with a conservative midpoint", () => {
    expect(items.map(quadrant)).toEqual(["quick_win", "strategic", "fill_in", "deprioritise", "quick_win"]);
    expect(quadrant({ impact: 3, effort: 3 })).toBe("deprioritise");
    expect(quadrant({ impact: 4, effort: 3 })).toBe("strategic");
  });
  it("prioritises quick wins, then strategic initiatives", () => expect(prioritise(items).map((x) => x.id)).toEqual(["a", "e", "b", "c", "d"]));
  it("demands rationale for extreme scores and questions too many quick wins", () => {
    const f = checkMatrix({ items: [i("a", "A", 5, 1, ""), i("b", "B", 4, 1), i("c", "C", 4, 2), i("d", "D", 5, 2)] });
    expect(codes(f)).toEqual(expect.arrayContaining(["impact_no_rationale", "too_many_quick_wins", "one_quadrant"]));
  });
  it("redirects threats to a risk matrix", () => expect(codes(checkMatrix({ items: items.slice(0, 4) }, { itemsAreThreats: true }))).toContain("threats_use_risk_matrix"));
});

describe("Action plan: rolling out a new scheduling system by March", () => {
  const a = (id: string, title: string, owner: string, start: string, due: string, dependsOn: string[] = [], status: Action["status"] = "not_started"): Action => ({ id, title, owner, start, due, status, dependsOn, deliverable: "", links: [{ kind: "goal", ref: "g", label: "go-live" }] });
  const plan = { ...emptyPlan("Go live with the new scheduling system in all three sites", "2027-03-31"), indicators: [{ id: "k1", name: "Shifts scheduled in the new system", baseline: "0%", target: "100%", by: "2027-03-31" }] };
  it("a sound plan has no serious findings", () => {
    const f = checkPlan({ ...plan, actions: [a("1", "Configure rota rules", "IT lead", "2027-01-04", "2027-01-29"), a("2", "Train supervisors", "HR partner", "2027-02-01", "2027-02-19", ["1"]), a("3", "Go live site by site", "Ops manager", "2027-02-22", "2027-03-26", ["2"])] }, "2026-12-01");
    expect(f.filter((x) => x.severity === "high")).toEqual([]);
  });
  it("catches missing owners, date order, deadline breaches, dependency order and cycles", () => {
    const f = checkPlan({ ...plan, indicators: [], actions: [a("1", "Configure", "", "2027-02-10", "2027-02-01", ["3"]), a("2", "Train", "HR", "2027-01-05", "2027-04-15", ["1"]), a("3", "Go live", "Ops", "2027-03-01", "2027-03-20", ["2"])] }, "2026-12-01");
    expect(codes(f)).toEqual(expect.arrayContaining(["no_indicators", "no_owner", "date_order", "after_deadline", "dependency_order", "cycle"]));
  });
  it("flags overdue actions against today", () => expect(codes(checkPlan({ ...plan, actions: [a("1", "X", "Y", "2026-01-01", "2026-02-01")] }, "2026-11-24"))).toContain("overdue"));
});

describe("Cross-builder links, assumptions register and history", () => {
  it("seeds builders from the intake and links findings to actions", () => {
    const p = newProject("Late deliveries");
    p.intake.statements = [{ id: "g1", role: "goal", text: "On-time delivery above 95%", truth: "unverified" }, { id: "s1", role: "symptom", text: "On-time delivery fell to 81%", truth: "verified" }];
    p.intake.options = ["Add a night shift", "Re-route vans"];
    expect(read(p, "fw_five_whys").problem).toBe("On-time delivery fell to 81%");
    expect(read(p, "fw_action_plan").objective).toBe("On-time delivery above 95%");
    expect(read(p, "fw_impact_effort").items.map((i) => i.title)).toEqual(["Add a night shift", "Re-route vans"]);
    p.frameworks.fw_five_whys = { ...seed(p, "fw_five_whys"), nodes: [{ id: "r", parentId: null, text: "Routes planned by hand", truth: "assumption", evidence: "", isRoot: true, countermeasure: "Introduce route-planning software" }] };
    expect(linkables(p).map((l) => l.kind)).toEqual(expect.arrayContaining(["goal", "root_cause"]));
    expect(suggestedActions(p)[0]).toMatchObject({ title: "Introduce route-planning software", link: { kind: "root_cause", ref: "r" } });
    expect(assumptionsRegister(p).map((e) => e.text)).toEqual(expect.arrayContaining(["On-time delivery above 95%", "Routes planned by hand"]));
  });
  it("malformed builder data falls back safely", () => {
    const p = newProject("x"); p.frameworks.fw_swot = { s: "broken" };
    expect(read(p, "fw_swot").s).toEqual([]);
  });
  it("history diff lists added, changed and removed entries", () => {
    const a = newProject("Challenge"); a.intake.statements = [{ id: "s", role: "symptom", text: "Errors rising", truth: "unverified" }];
    const b = JSON.parse(JSON.stringify(a)); b.title = "Billing errors"; b.intake.statements[0].truth = "verified"; b.frameworks.fw_impact_effort = { items: [{ id: "i", title: "Automate price feed", impact: 5, effort: 3, impactWhy: "", effortWhy: "", truth: "unverified" }] };
    const d = diff(a, b);
    expect(d).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "changed", label: "title" }), expect.objectContaining({ kind: "changed", label: "Errors rising" }), expect.objectContaining({ kind: "added", label: "Automate price feed" })]));
    expect(diff(b, a).some((c) => c.kind === "removed" && c.label === "Automate price feed")).toBe(true);
  });
});
