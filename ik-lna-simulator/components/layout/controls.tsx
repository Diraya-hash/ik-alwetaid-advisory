"use client";

import { Languages, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

/** Switches language while keeping the current path, query string and all progress. */
export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale } = useI18n();
  return (target: "en" | "ar") => {
    if (target === locale) return;
    const rest = pathname.replace(/^\/(en|ar)(?=\/|$)/, "").replace(/\/+$/, "");
    router.push(`/${target}${rest}/${window.location.search}`);
  };
}

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, t } = useI18n();
  const switchTo = useSwitchLocale();
  const target = locale === "en" ? "ar" : "en";
  return (
    <button
      type="button"
      onClick={() => switchTo(target)}
      className={cn("inline-flex h-9 items-center gap-2 rounded-lg border border-line px-3 text-[13px] font-medium text-ink-muted hover:bg-surface-2 hover:text-ink", className)}
      aria-label={`${t.common.language}: ${target === "ar" ? "العربية" : "English"}`}
      lang={target}
    >
      <Languages className="h-4 w-4" aria-hidden />
      {target === "ar" ? "العربية" : "English"}
    </button>
  );
}

export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const options = [
    { value: "light", icon: Sun, label: t.theme.light },
    { value: "dark", icon: Moon, label: t.theme.dark },
    { value: "system", icon: Monitor, label: t.theme.system },
  ] as const;
  return (
    <div role="radiogroup" aria-label={t.common.theme} className={cn("inline-flex rounded-lg border border-line bg-surface p-0.5", className)}>
      {options.map(({ value, icon: Icon, label }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              active ? "bg-primary-soft text-primary" : "text-ink-subtle hover:text-ink"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
