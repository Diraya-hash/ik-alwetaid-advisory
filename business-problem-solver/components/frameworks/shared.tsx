"use client";

import { AlertTriangle, CheckCircle2, Info, Trash2 } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/primitives";
import type { Finding } from "@/engine/builders/common";
import type { Truth } from "@/engine/intake";
import { cn } from "@/lib/utils";

const TRUTHS: Truth[] = ["verified", "unverified", "assumption"];
const TONE: Record<Truth, string> = { verified: "border-fact/40 bg-fact-soft text-fact", unverified: "border-claim/40 bg-claim-soft text-claim", assumption: "border-assumption/40 bg-assumption-soft text-assumption" };

/** Compact truth-status selector (native select: accessible and mobile-friendly). */
export function TruthSelect({ value, onChange, label }: { value: Truth; onChange: (v: Truth) => void; label?: string }) {
  const { t } = useI18n();
  return (
    <select aria-label={label ?? t.b.truthLabel} value={value} onChange={(e) => onChange(e.target.value as Truth)}
      className={cn("h-8 shrink-0 rounded-md border px-2 text-[12px] font-semibold", TONE[value])}>
      {TRUTHS.map((x) => <option key={x} value={x}>{t.truth[x]}</option>)}
    </select>
  );
}

export function RemoveButton({ onClick, label }: { onClick: () => void; label?: string }) {
  const { t } = useI18n();
  return (
    <button type="button" aria-label={label ?? t.common.remove} title={label ?? t.common.remove} onClick={onClick}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-subtle hover:bg-danger-soft hover:text-danger">
      <Trash2 className="h-4 w-4" aria-hidden />
    </button>
  );
}

/** Scrolls to an item and briefly highlights it. Items carry id="item-<id>". */
export function focusItem(id: string) {
  const el = document.getElementById(`item-${id}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.classList.add("ring-2", "ring-gold");
  (el.querySelector("input,textarea,select,button") as HTMLElement | null)?.focus({ preventScroll: true });
  setTimeout(() => el.classList.remove("ring-2", "ring-gold"), 1800);
}

/** Live consultant review for a builder: findings by severity, each linked to its item. */
export function CriticPanel({ findings, render, className }: { findings: Finding[]; render: (f: Finding) => string; className?: string }) {
  const { t, f } = useI18n();
  const order = { high: 0, medium: 1, low: 2 } as const;
  const list = [...findings].sort((a, b) => order[a.severity] - order[b.severity]);
  return (
    <aside aria-labelledby="critic-title" className={cn("card p-5", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 id="critic-title" className="text-[14px] font-semibold text-ink">{t.b.consultant}</h3>
        {list.length > 0 && <Badge tone={list.some((x) => x.severity === "high") ? "danger" : "warning"}>{f(t.b.reviewCount, { n: list.length })}</Badge>}
      </div>
      <div aria-live="polite">
        {list.length === 0 ? (
          <p className="flex items-center gap-2 text-[13px] text-primary"><CheckCircle2 className="h-4 w-4" aria-hidden />{t.b.reviewNone}</p>
        ) : (
          <ul className="space-y-2">
            {list.map((x, n) => (
              <li key={`${x.code}-${x.target ?? ""}-${n}`} className="flex items-start gap-2 rounded-lg border border-line p-2.5 text-[13px] leading-snug text-ink">
                {x.severity === "high" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden /> : x.severity === "medium" ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />}
                <span className="flex-1"><span className="sr-only">{t.b.severity[x.severity]}: </span>{render(x)}</span>
                {x.target && <button type="button" onClick={() => focusItem(x.target!)} className="shrink-0 text-[12px] font-medium text-primary hover:underline">{t.b.goTo}</button>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

/** Marks an item that has findings. */
export const flagged = (findings: Finding[], id: string) => findings.find((x) => x.target === id && x.severity !== "low")?.severity;
