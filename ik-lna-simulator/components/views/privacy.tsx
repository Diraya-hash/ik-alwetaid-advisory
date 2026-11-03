"use client";

import { ShieldCheck } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, PageHeader } from "@/components/ui/primitives";

export function PrivacyView() {
  const { t, href } = useI18n();
  return (
    <>
      <PageHeader eyebrow={t.privacy.eyebrow} title={t.privacy.title} lead={t.privacy.lead} />
      <Card className="max-w-3xl">
        <ul className="space-y-5">
          {t.privacy.items.map((it) => (
            <li key={it.h} className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="font-semibold">{it.h}</h2>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-muted">{it.b}</p>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Button variant="secondary" href={href("/settings")}>{t.nav.settings}</Button>
        </div>
      </Card>
    </>
  );
}
