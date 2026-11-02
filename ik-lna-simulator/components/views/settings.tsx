"use client";

import { AlertTriangle, Check, Copy, Download, Eye, EyeOff, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LanguageToggle, ThemeSwitch } from "@/components/layout/controls";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Card, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { parseImport, useSimStore } from "@/store/sim-store";
import { storageAvailable } from "@/store/storage";

/** Sandboxed preview hosts block page-initiated downloads, so only offer one where it works. */
const CAN_DOWNLOAD = process.env.NEXT_PUBLIC_PREVIEW !== "1";

export function SettingsView() {
  const { t, p } = useI18n();
  const importAttempts = useSimStore((s) => s.importAttempts);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const parsed = file.size < 5_000_000 ? parseImport(await file.text()) : null;
    if (!parsed) return setImportMsg({ ok: false, text: t.settings.importError });
    setImportMsg({ ok: true, text: p(t.settings.importOk, importAttempts(parsed)) });
  };
  const attempts = useSimStore((s) => s.attempts);
  const resetAll = useSimStore((s) => s.resetAll);
  const [done, setDone] = useState(false);
  const [canStore, setCanStore] = useState(true);
  const [showData, setShowData] = useState(false);
  const [copied, setCopied] = useState(false);
  const dataRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => setCanStore(storageAvailable()), []);

  const json = JSON.stringify({ app: "ik-lna-simulator", exportedAt: new Date().toISOString(), attempts }, null, 2);

  const download = () => {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "ik-lna-simulator-data.json" });
    a.click();
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      dataRef.current?.select();
    }
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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setShowData((v) => !v)} aria-expanded={showData} aria-controls="data-json">
              {showData ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              {showData ? t.settings.exportHide : t.settings.export}
            </Button>
            <ConfirmButton
              question={t.settings.resetConfirm}
              onConfirm={() => {
                resetAll();
                setDone(true);
              }}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {t.settings.reset}
            </ConfirmButton>
          </div>
          {showData && (
            <div className="mt-4 space-y-2">
              <label htmlFor="data-json" className="text-[12px] font-medium text-ink-subtle">{t.settings.exportLabel}</label>
              <textarea id="data-json" ref={dataRef} readOnly value={json} dir="ltr" rows={8}
                className="w-full rounded-lg border border-line-strong bg-surface-2 p-3 font-mono text-[12px] text-ink" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={copy}>
                  {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
                  {copied ? t.settings.copied : t.settings.copy}
                </Button>
                {CAN_DOWNLOAD && (
                  <Button size="sm" variant="secondary" onClick={download}>
                    <Download className="h-4 w-4" aria-hidden />
                    {t.settings.download}
                  </Button>
                )}
              </div>
            </div>
          )}
          {done && <p role="status" className="mt-3 text-[13px] text-ink-muted">{t.settings.resetDone}</p>}
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-[12.5px] text-ink-subtle">{t.settings.importHint}</p>
            <label htmlFor="import-file" className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2 focus-within:ring-2 focus-within:ring-primary">
              <Upload className="h-4 w-4" aria-hidden />
              {t.settings.import}
              <input id="import-file" type="file" accept="application/json,.json" onChange={onImport} className="sr-only" />
            </label>
            {importMsg && (
              <p role="status" className={importMsg.ok ? "mt-2 text-[13px] text-primary" : "mt-2 text-[13px] text-danger"}>{importMsg.text}</p>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
