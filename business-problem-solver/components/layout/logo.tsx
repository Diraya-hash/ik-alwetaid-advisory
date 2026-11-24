"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

/** Brand mark: a deep-green tile with a gold path from a problem node to a solved node. */
export function Mark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect width="40" height="40" rx="10" className="fill-deep" />
      <path d="M11 27 L20 18 L29 13" fill="none" className="stroke-gold" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="11" cy="27" r="3.2" className="fill-deep stroke-deep-fg" strokeWidth="1.6" />
      <circle cx="20" cy="18" r="2.4" className="fill-deep-fg" />
      <circle cx="29" cy="13" r="3.6" className="fill-gold" />
    </svg>
  );
}

export function Logo() {
  const { t, href } = useI18n();
  return (
    <Link href={href("/")} className="flex items-center gap-3" aria-label={t.brand.name}>
      <Mark />
      <span className="flex flex-col leading-tight">
        <span className="font-display text-[15px] font-semibold text-ink" dir="ltr">{t.brand.short}</span>
        <span className="text-[11px] text-ink-subtle">{t.brand.tagline}</span>
      </span>
    </Link>
  );
}
