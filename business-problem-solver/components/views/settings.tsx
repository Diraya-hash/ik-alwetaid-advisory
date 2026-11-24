"use client";

import { Download, RotateCcw, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { LanguageToggle, ThemeSwitch } from "@/components/layout/controls";
import { StorageNotice } from "@/components/layout/storage-status";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Card, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { downloadFile, KEY, useWorkspace } from "@/store/workspace";

export function SettingsView() {
  const { t, f, date, num } = useI18n();
  const ws = useWorkspace();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "bad"; text: string } | null>(null);
  const [kb, setKb] = useState(0);
  const projects = ws.projects;
  useEffect(() => { try { setKb(Math.ceil((window.localStorage.getItem(KEY)?.length ?? 0) / 1024)); } catch { setKb(0); } }, [projects]);

  const onFile = async (file: File) => {
    try {
      const res = ws.importFile(JSON.parse(await file.text()));
      setMsg(res.ok ? { tone: "ok", text: f(t.settings.importOk, { n: res.imported }) } : { tone: "bad", text: t.settings.importBad });
    } catch { setMsg({ tone: "bad", text: t.settings.importBad }); }
  };

  return (
    <div>
      <PageHeader eyebrow={t.settings.eyebrow} title={t.settings.title} />
      <div className="space-y-6">
        <Card>
          <SectionTitle>{t.settings.appearance}</SectionTitle>
          <div className="flex flex-wrap gap-3"><LanguageToggle /><ThemeSwitch /></div>
        </Card>
        <Card>
          <SectionTitle hint={t.settings.dataLead}>{t.settings.dataTitle}</SectionTitle>
          <StorageNotice />
          <p className="mt-3 text-[12.5px] text-ink-subtle">{f(t.settings.usage, { kb: num(kb) })}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => downloadFile(`business-problem-solver-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(ws.exportWorkspace(), null, 1))}><Download className="h-4 w-4" aria-hidden />{t.settings.exportAll}</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" aria-hidden />{t.settings.import}</Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" aria-label={t.settings.import} onChange={(e) => { const file = e.target.files?.[0]; if (file) void onFile(file); e.target.value = ""; }} />
          </div>
          {msg && <p role="status" className={msg.tone === "ok" ? "mt-3 text-[13.5px] text-primary" : "mt-3 text-[13.5px] text-danger"}>{msg.text}</p>}
        </Card>
        <Card>
          <SectionTitle>{t.settings.backup}</SectionTitle>
          <p className="text-[13.5px] text-ink-muted">{ws.backupAt ? f(t.settings.backupAt, { date: `${date(ws.backupAt)} ${new Date(ws.backupAt).toLocaleTimeString()}` }) : t.settings.backupNone}</p>
          {ws.backupAt && <div className="mt-4"><ConfirmButton question={t.settings.restoreQ} onConfirm={() => { if (ws.restoreBackup()) setMsg({ tone: "ok", text: t.settings.restored }); }}><RotateCcw className="h-4 w-4" aria-hidden />{t.settings.restoreBackup}</ConfirmButton></div>}
        </Card>
        <Card>
          <SectionTitle>{t.settings.deleteAll}</SectionTitle>
          <ConfirmButton question={t.settings.deleteAllQ} onConfirm={() => ws.deleteAll()}><Trash2 className="h-4 w-4" aria-hidden />{t.settings.deleteAll}</ConfirmButton>
        </Card>
      </div>
    </div>
  );
}

export function PrivacyView() {
  const { t } = useI18n();
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow={t.privacy.eyebrow} title={t.privacy.title} />
      <Card><div className="space-y-4 text-[15px] leading-relaxed text-ink">{t.privacy.body.map((p, n) => <p key={n}>{p}</p>)}</div></Card>
    </div>
  );
}
