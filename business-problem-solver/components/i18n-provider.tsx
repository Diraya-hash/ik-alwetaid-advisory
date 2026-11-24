"use client";

import { createContext, useContext, useMemo } from "react";
import type { L, Locale } from "@/engine/types";
import { dictionaries, dirOf, format, intlLocale } from "@/i18n/config";
import type { Dictionary, Plural } from "@/i18n/types";

interface I18n {
  locale: Locale;
  dir: "ltr" | "rtl";
  t: Dictionary;
  /** Fill {placeholders} in a dictionary string. */
  f: (template: string, vars?: Record<string, string | number>) => string;
  /** Pick the current language from a bilingual scenario string. */
  l: (value: L) => string;
  /** Pick the grammatically correct plural form for n and fill {n}. */
  p: (forms: Plural, n: number) => string;
  num: (n: number, opts?: Intl.NumberFormatOptions) => string;
  date: (ts: number) => string;
  /** Prefix an app path with the current locale. */
  href: (path: string) => string;
}

const Ctx = createContext<I18n | null>(null);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const value = useMemo<I18n>(() => {
    const nf = new Intl.NumberFormat(intlLocale(locale));
    const df = new Intl.DateTimeFormat(intlLocale(locale), { day: "numeric", month: "short", year: "numeric" });
    const plural = new Intl.PluralRules(intlLocale(locale));
    const num = (n: number, opts?: Intl.NumberFormatOptions) =>
      opts ? new Intl.NumberFormat(intlLocale(locale), opts).format(n) : nf.format(n);
    return {
      locale,
      dir: dirOf(locale),
      t: dictionaries[locale],
      // Numbers passed as vars are localised (Arabic-Indic digits in Arabic).
      f: (template, vars = {}) =>
        format(
          template,
          Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, typeof v === "number" ? num(v) : v]))
        ),
      l: (v) => v[locale],
      p: (forms, n) => {
        const cat = plural.select(n) as keyof Plural;
        return format(forms[cat] ?? forms.other, { n: num(n) });
      },
      num,
      date: (ts) => df.format(new Date(ts)),
      href: (path) => {
        const [p = "/", q] = path.split("?");
        const base = `/${locale}${p === "/" ? "" : p.replace(/\/+$/, "")}/`;
        return q ? `${base}?${q}` : base;
      },
    };
  }, [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(Ctx);
  if (!v) throw new Error("useI18n must be used inside I18nProvider");
  return v;
}
