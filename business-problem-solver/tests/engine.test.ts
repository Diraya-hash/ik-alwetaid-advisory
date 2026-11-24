import { describe, expect, it } from "vitest";
import { emptyIntake, suggestFromText, toSlots, type Intake, type Statement } from "@/engine/intake";
import { diagnose } from "@/engine/diagnosis";
import { missingInformation, whyNot, whyRecommended } from "@/engine/explain";
import { exportFileSchema, newProject, trimVersions, workspaceSchema, type Version } from "@/engine/project";

let n = 0;
const st = (role: Statement["role"], text: string, truth: Statement["truth"] = "unverified"): Statement => ({ id: `s${n++}`, role, text, truth });
const intake = (p: Partial<Intake>): Intake => ({ ...emptyIntake(), ...p });
const top = (i: Intake) => diagnose(i).recommendation.ranked.slice(0, 3).map((r) => r.id);

const rootCauseTeam = intake({
  stagePrimary: "FIND_ROOT_CAUSE", domains: ["OPS.QUALITY"], scope: "team", recurrence: "recurring", causalComplexity: 2,
  statements: [st("symptom", "12% of invoices are re-issued each month"), st("goal", "Cut re-issued invoices below 3%"), st("impact", "Customers complain and pay late"), st("constraint", "No budget for new systems")],
  stakeholders: ["Billing team", "Finance manager"],
});

describe("guided intake → recommendation", () => {
  it("contained, recurring quality problem → 5 Whys first", () => {
    const d = diagnose(rootCauseTeam);
    expect(d.recommendation.status).toBe("ok");
    expect(top(rootCauseTeam)[0]).toBe("fw_five_whys");
  });
  it("cross-functional, complex causes → fishbone first, 5 Whys cautioned", () => {
    const i = { ...rootCauseTeam, scope: "cross_functional" as const, causalComplexity: 4 };
    expect(top(i)[0]).toBe("fw_cause_effect");
    expect(whyRecommended("fw_five_whys", toSlots(i)).some((r) => r.code === "contra.fw_five_whys")).toBe(true);
  });
  it("many options to prioritise → impact/effort matrix", () => {
    const i = intake({ stagePrimary: "PRIORITISE_DECIDE", domains: ["DEC.PRIORITISATION"], scope: "department", options: ["A", "B", "C", "D", "E"],
      statements: [st("goal", "Pick three initiatives for next quarter"), st("constraint", "Two analysts available")], stakeholders: ["Director", "Team leads"] });
    expect(diagnose(i).recommendation.status).toBe("ok");
    expect(top(i)[0]).toBe("fw_impact_effort");
  });
  it("executing an agreed decision → action plan", () => {
    const i = intake({ stagePrimary: "PLAN_EXECUTION", domains: ["PRJ.PLANNING"], scope: "department", deadline: "2027-03-31",
      statements: [st("goal", "Move the team to the new scheduling tool by March")], stakeholders: ["Operations lead", "IT"] });
    expect(top(i)[0]).toBe("fw_action_plan");
  });
  it("only a description, nothing structured → needs more information, with the gaps listed", () => {
    const i = intake({});
    const d = diagnose(i);
    expect(d.recommendation.status).toBe("insufficient_context");
    const m = missingInformation(d.recommendation, toSlots(i));
    expect(m.core).toContain("stage");
    expect(m.core).toContain("domain");
  });
  it("out-of-scope requests are declined, not recommended", () => {
    expect(diagnose(intake({ ...rootCauseTeam, outOfScope: "legal_advice" })).recommendation.status).toBe("out_of_scope");
  });
  it("5 Whys without a symptom is blocked and explained", () => {
    const i = { ...rootCauseTeam, statements: rootCauseTeam.statements.filter((s) => s.role !== "symptom") };
    const d = diagnose(i);
    expect(d.recommendation.blocked.map((b) => b.id)).toContain("fw_five_whys");
    expect(whyNot("fw_five_whys", toSlots(i), d.recommendation)[0]?.code).toBe("blocked.symptom");
    expect(d.findings.some((f) => f.code === "no_symptom_for_root_cause")).toBe(true);
  });
  it("assumptions worded as certain are flagged (EN and AR)", () => {
    const i = intake({ statements: [st("cause", "The new system will definitely fix this", "assumption"), st("cause", "سيؤدي النظام الجديد حتمًا إلى حل المشكلة", "unverified"), st("cause", "Data shows 40% of delays at approval", "verified")] });
    expect(diagnose(i).findings.filter((f) => f.code === "certainty_wording")).toHaveLength(2);
  });
});

describe("reading the description", () => {
  it("English: delays and complaints, asking why", () => {
    const s = suggestFromText("Why do customer complaints keep happening? Orders ship late and the backlog grows.");
    expect(s.stages[0]).toBe("FIND_ROOT_CAUSE");
    expect(s.domains).toEqual(expect.arrayContaining(["OPS.PERFORMANCE", "CX.EXPERIENCE"]));
  });
  it("Arabic, with diacritics and hamza variants", () => {
    const s = suggestFromText("لماذا يتكرر التأخير في معالجة طلبات العملاء؟ الشكاوى تتزايد.");
    expect(s.stages[0]).toBe("FIND_ROOT_CAUSE");
    expect(s.domains).toEqual(expect.arrayContaining(["OPS.PERFORMANCE", "CX.EXPERIENCE"]));
  });
  it("flags requests that need a valuation model", () => {
    expect(suggestFromText("Build a DCF valuation of our company").outOfScope).toBe("financial_modelling");
  });
});

describe("project model", () => {
  it("a new project validates and round-trips through the export format", () => {
    const p = newProject("Our onboarding takes six weeks\nmore detail");
    expect(p.title).toBe("Our onboarding takes six weeks");
    const ws = { schema: 1 as const, projects: { [p.id]: p }, versions: {} };
    expect(workspaceSchema.safeParse(ws).success).toBe(true);
    expect(exportFileSchema.safeParse({ app: "business-problem-solver", kind: "workspace", exportedAt: "x", data: ws }).success).toBe(true);
  });
  it("rejects files from other apps or with wrong shapes", () => {
    expect(exportFileSchema.safeParse({ app: "other", kind: "workspace", exportedAt: "x", data: {} }).success).toBe(false);
  });
  it("history trimming keeps milestone and manual versions", () => {
    const p = newProject("x");
    const vs: Version[] = Array.from({ length: 60 }, (_, i) => ({ id: `v${i}`, at: i, label: "", kind: i % 10 === 0 ? "manual" : "auto", snapshot: p }));
    const t = trimVersions(vs);
    expect(t.length).toBe(40);
    expect(t.filter((v) => v.kind === "manual").length).toBe(6);
  });
});
