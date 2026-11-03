import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { scenarios } from "@/content/scenarios";
import { ar } from "@/i18n/ar";
import { format, intlLocale } from "@/i18n/config";

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : p.endsWith(".tsx") ? [p] : [];
  });

const strings = (v: unknown): string[] =>
  typeof v === "string" ? [v] : v && typeof v === "object" ? Object.values(v).flatMap(strings) : [];

describe("bilingual & RTL hygiene", () => {
  it("components use logical (start/end) spacing, never physical left/right", () => {
    const offenders = ["components", "app"].flatMap((d) => walk(d)).flatMap((file) =>
      [...readFileSync(file, "utf8").matchAll(/\b(?:ml|mr|pl|pr|left|right|border-l|border-r|rounded-l|rounded-r|text-left|text-right)-[\w[\]./]+/g)].map((m) => `${file}: ${m[0]}`)
    );
    expect(offenders).toEqual([]);
  });

  it("Arabic text never uses '·' (it is visually identical to the Arabic-Indic zero)", () => {
    const arScenarioText = scenarios.flatMap((s) => strings(s)).filter((x) => /[؀-ۿ]/.test(x));
    const offenders = [...strings(ar), ...arScenarioText].filter((x) => x.includes("·"));
    expect(offenders).toEqual([]);
  });

  it("components never hard-code the '·' separator (use t.common.sep)", () => {
    const offenders = ["components", "app"].flatMap((d) => walk(d)).filter((file) => readFileSync(file, "utf8").includes("·"));
    expect(offenders).toEqual([]);
  });

  it("every Arabic string, in the UI and in all scenarios, is actually Arabic", () => {
    const ALLOW = /^[\d\s.,:;()%+\-–—/]*$|^(IK|CSV|JSON)$/;
    const arUi = strings(ar);
    const arScenario = scenarios.flatMap((sc) => {
      const out: string[] = [];
      const walkL = (v: unknown) => {
        if (v && typeof v === "object") {
          const o = v as Record<string, unknown>;
          if (typeof o.en === "string" && typeof o.ar === "string") out.push(o.ar);
          else Object.values(o).forEach(walkL);
        }
      };
      walkL(sc);
      return out;
    });
    const notArabic = [...arUi, ...arScenario].filter((x) => !/[\u0600-\u06FF]/.test(x) && !ALLOW.test(x.trim()) && !/^\{n\}/.test(x));
    expect(notArabic).toEqual([]);
  });

  it("selects Arabic plural forms correctly", () => {
    const rules = new Intl.PluralRules(intlLocale("ar"));
    const pick = (n: number) => format(ar.sim.askedCount[rules.select(n) as "one"] ?? ar.sim.askedCount.other, { n });
    expect(pick(1)).toBe("سؤال واحد");
    expect(pick(2)).toBe("سؤالان");
    expect(pick(5)).toBe("5 أسئلة");
    expect(pick(12)).toBe("12 سؤالًا");
  });
});
