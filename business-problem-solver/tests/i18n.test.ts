import { describe, expect, it } from "vitest";
import { ar } from "@/i18n/ar";
import { en } from "@/i18n/en";
import { FRAMEWORKS } from "@/content/frameworks";
import { DOMAIN_LABEL, OUT_OF_SCOPE_LABEL, SCOPE_LABEL, STAGE_LABEL } from "@/content/taxonomy";

const keys = (o: unknown, p = ""): string[] => (o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => keys(v, `${p}${k}.`)) : [p]);
const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
const leaves = (o: unknown, p = ""): [string, string][] => (typeof o === "string" ? [[p, o]] : o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => leaves(v, `${p}${k}.`)) : []);

describe("Arabic and English are at parity", () => {
  it("same dictionary keys", () => expect(keys(ar).sort()).toEqual(keys(en).sort()));
  it("same placeholders in every string", () => {
    const A = Object.fromEntries(leaves(ar));
    for (const [k, v] of leaves(en)) expect([k, placeholders(A[k] ?? "")]).toEqual([k, placeholders(v)]);
  });
  it("no empty strings", () => { for (const [k, v] of [...leaves(en), ...leaves(ar)]) expect([k, v.trim().length > 0]).toEqual([k, true]); });
  it("Arabic UI text is written in Arabic", () => {
    const latinOnly = leaves(ar).filter(([k, v]) => !/[؀-ۿ]/.test(v) && !k.startsWith("brand.") && !k.startsWith("meta.title") && !/^[\s{}\w·.:%/-]*$/.test(v));
    expect(latinOnly).toEqual([]);
  });
  it("every content label is bilingual", () => {
    for (const rec of [STAGE_LABEL, DOMAIN_LABEL, SCOPE_LABEL, OUT_OF_SCOPE_LABEL, FRAMEWORKS]) for (const [k, v] of leaves(rec)) expect([k, v.length > 0]).toEqual([k, true]);
    for (const fw of Object.values(FRAMEWORKS)) for (const x of [fw.name, fw.purpose, fw.output, ...fw.useWhen, ...fw.avoidWhen]) { expect(x.en.length).toBeGreaterThan(0); expect(/[؀-ۿ]/.test(x.ar) || /^[A-Z ]+$/.test(x.ar)).toBe(true); }
  });
  it("every reason code the engine can emit has text", () => {
    const codes = ["stage.strong", "stage.secondary", "stage.partial", "stage.weak", "domain.strong", "domain.secondary", "domain.partial", "domain.weak", "diversity", "cutoff", "lower", "blocked.generic",
      ...Object.keys(FRAMEWORKS).map((a) => `disc.${a}`)];
    for (const c of codes) { expect([c, c in en.reasons]).toEqual([c, true]); expect([c, c in ar.reasons]).toEqual([c, true]); }
  });
});
