"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

/** Typographic IK mark in the approved palette. Replace with the final IK logo when one is approved. */
export function Logo() {
  const { t, href } = useI18n();
  return (
    <Link href={href("/")} className="flex items-center gap-3" aria-label={t.brand.name}>
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy text-[13px] font-bold tracking-tight text-navy-fg ring-1 ring-inset ring-accent/60" dir="ltr">
        IK
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[13.5px] font-semibold text-ink">{t.brand.short}</span>
        <span className="text-[11px] text-ink-subtle">{t.brand.tagline}</span>
      </span>
    </Link>
  );
}
