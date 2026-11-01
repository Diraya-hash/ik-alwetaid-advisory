"use client";

import { AlertTriangle, Download, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LanguageToggle, ThemeSwitch } from "@/components/layout/controls";
import { Button } from "@/components/ui/button";
import { Card, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { useSimStore } from "@/store/sim-store";
import { storageAvailable } from "@/store/storage";

export function SettingsView() {
  const { t } = useI18n();
  const attempts = useSimStore((s) => s.attempts);
  const resetAll = useSimStore((s) => s.resetAll);
  const [done, setDone] = useState(false);
  const [canStore, setCanStore] = useState(true);
  useEffect(() => setCanStore(storageAvailable()), []);

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: "ik-lna-simulator", exportedAt: new Date().toISOString(), attempts }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: "ik-lna-simulator-data.json" });
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (!window.confirm(t.settings.resetConfirm)) return;
    resetAll();
    setDone(true);
  };

  return (
    <>
      <PageHeader eyebrow={t.settings.eyebrow} title={t.settings.title} />
      <div className="grid max-w-3xl gap-5">
        <Card>
          <SectionTitle hint={t.settings.languageHint}>{t.settings.language}</SectionTitle>
          <LanguageToggle />
        </Card>
        <Card>
          <SectionTitle hint={t.settings.themeHint}>{t.settings.theme}</SectionTitle>
          <ThemeSwitch />
        </Card>
        <Card>
          <SectionTitle hint={t.settings.dataBody}>{t.settings.data}</SectionTitle>
          {!canStore && (
            <p role="alert" className="mb-4 flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-[13px] text-warning">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              {t.settings.storageUnavailable}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportData}><Download className="h-4 w-4" aria-hidden />{t.settings.export}</Button>
            <Button variant="danger" onClick={reset}><Trash2 className="h-4 w-4" aria-hidden />{t.settings.reset}</Button>
          </div>
          {done && <p role="status" className="mt-3 text-[13px] text-ink-muted">{t.settings.resetDone}</p>}
        </Card>
      </div>
    </>
  );
}
