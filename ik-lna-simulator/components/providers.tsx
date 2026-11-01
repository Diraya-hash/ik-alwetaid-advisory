"use client";

import { ThemeProvider } from "next-themes";
import { useEffect } from "react";
import type { Locale } from "@/engine/types";
import { I18nProvider } from "./i18n-provider";

export const LOCALE_KEY = "ik-locale";

export function Providers({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  // Remember the language so the root URL reopens in it.
  useEffect(() => {
    try {
      window.localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      /* storage unavailable */
    }
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem storageKey="ik-theme" disableTransitionOnChange>
      <I18nProvider locale={locale}>{children}</I18nProvider>
    </ThemeProvider>
  );
}
