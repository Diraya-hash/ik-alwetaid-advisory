"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";

/** Placeholder IK wordmark: to be replaced by the official IK logo asset. */
export function Logo() {
  const { t, href } = useI18n();
  return (
    <Link href={href("/")} className="flex items-center gap-3" aria-label={t.brand.name}>
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy text-[13px] font-bold tracking-tight text-navy-fg ring-1 ring-inset ring-primary/40" dir="ltr">
        IK
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[13.5px] font-semibold text-ink">{t.brand.short}</span>
        <span className="text-[11px] text-ink-subtle">{t.brand.tagline}</span>
      </span>
    </Link>
  );
}
