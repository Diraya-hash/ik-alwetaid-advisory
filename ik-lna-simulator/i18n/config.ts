import type { Locale } from "@/engine/types";
import { en } from "./en";
import { ar } from "./ar";
import type { Dictionary } from "./types";

export const LOCALES: Locale[] = ["en", "ar"];
export const DEFAULT_LOCALE: Locale = "en";
export const dictionaries: Record<Locale, Dictionary> = { en, ar };
export const dirOf = (l: Locale) => (l === "ar" ? "rtl" : "ltr");
export const isLocale = (v: unknown): v is Locale => v === "en" || v === "ar";
/** Number/date locale. Arabic uses Arabic-Indic digits consistently with scenario content. */
export const intlLocale = (l: Locale) => (l === "ar" ? "ar-SA-u-nu-arab-ca-gregory" : "en-GB");

/** Replaces {key} placeholders. */
export function format(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
}
