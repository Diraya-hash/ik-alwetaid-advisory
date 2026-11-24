"use client";

import { AlertTriangle, Check, HardDrive, Loader2 } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { useWorkspace } from "@/store/workspace";
import { cn } from "@/lib/utils";

/** The always-visible local-storage notice. */
export function StorageNotice({ compact = false }: { compact?: boolean }) {
  const { t, href } = useI18n();
  const persistent = useWorkspace((s) => s.persistent);
  if (!persistent) {
    return <p role="alert" className="flex gap-2 rounded-lg bg-warning-soft p-2.5 text-[12px] leading-snug text-warning"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{t.storage.unavailable}</p>;
  }
  return (
    <p className={cn("flex gap-2 text-ink-subtle", compact ? "text-[11.5px] leading-snug" : "rounded-lg border border-line bg-surface-2 p-3 text-[13px]")}>
      <HardDrive className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{t.storage.notice} {compact && <Link href={href("/settings")} className="underline underline-offset-2 hover:text-primary">{t.nav.settings}</Link>}</span>
    </p>
  );
}

/** Autosave indicator. */
export function SaveIndicator() {
  const { t } = useI18n();
  const st = useWorkspace((s) => s.saveState);
  if (st === "idle") return null;
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-1.5 text-[12px]", st === "error" ? "text-danger" : "text-ink-subtle")}>
      {st === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : st === "error" ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> : <Check className="h-3.5 w-3.5 text-primary" aria-hidden />}
      {st === "saving" ? t.storage.saving : st === "error" ? t.storage.error : t.storage.saved}
    </span>
  );
}

export function RecoveryBanner() {
  const { t } = useI18n();
  const recovery = useWorkspace((s) => s.recovery);
  const dismiss = useWorkspace((s) => s.dismissRecovery);
  if (!recovery) return null;
  return (
    <div role="alert" className="mb-6 flex items-start justify-between gap-3 rounded-xl border border-warning/30 bg-warning-soft p-4 text-[13.5px] text-warning no-print">
      <span className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{recovery.kind === "restored_backup" ? t.storage.recoveredBackup : t.storage.recoveredReset}</span>
      <button type="button" onClick={dismiss} className="shrink-0 text-[12px] font-medium underline">{t.common.close}</button>
    </div>
  );
}
