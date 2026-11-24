"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import type { Truth } from "@/engine/intake";

export function PageHeader({ eyebrow, title, lead, actions }: { eyebrow: string; title: string; lead?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="text-display-md text-ink">{title}</h1>
        {lead && <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{lead}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ className, children, as: As = "div" }: { className?: string; children: React.ReactNode; as?: "div" | "section" | "article" | "li" }) {
  return <As className={cn("card p-5 lg:p-6", className)}>{children}</As>;
}

export function SectionTitle({ children, hint, as: As = "h2" }: { children: React.ReactNode; hint?: string; as?: "h2" | "h3" }) {
  return (
    <div className="mb-4">
      <As className="font-sans text-[15px] font-semibold text-ink">{children}</As>
      {hint && <p className="mt-1 text-[13px] leading-relaxed text-ink-subtle">{hint}</p>}
    </div>
  );
}

type Tone = "neutral" | "primary" | "gold" | "warning" | "danger";
export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: Tone; className?: string }) {
  const tones: Record<Tone, string> = {
    neutral: "bg-surface-2 text-ink-muted border-line",
    primary: "bg-primary-soft text-primary-soft-fg border-primary/20",
    gold: "bg-gold-soft text-gold-text border-gold/30",
    warning: "bg-warning-soft text-warning border-warning/25",
    danger: "bg-danger-soft text-danger border-danger/25",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11.5px] font-medium", tones[tone], className)}>{children}</span>;
}

export function TruthTag({ truth }: { truth: Truth }) {
  const { t } = useI18n();
  const styles: Record<Truth, string> = {
    verified: "bg-fact-soft text-fact border-fact/25",
    unverified: "bg-claim-soft text-claim border-claim/25",
    assumption: "bg-assumption-soft text-assumption border-assumption/25",
  };
  const desc = { verified: t.truth.verifiedDesc, unverified: t.truth.unverifiedDesc, assumption: t.truth.assumptionDesc }[truth];
  return <span title={desc} className={cn("inline-flex shrink-0 items-center rounded border px-1.5 py-px text-[10.5px] font-semibold", styles[truth])}>{t.truth[truth]}</span>;
}

export function Meter({ value, max = 1, label, className, tone = "primary" }: { value: number; max?: number; label: string; className?: string; tone?: "primary" | "gold" }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div role="meter" aria-label={label} aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div className={cn("h-full rounded-full transition-[width] duration-500", tone === "gold" ? "bg-gold" : "bg-primary")} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title?: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center">
      <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="h-5 w-5" aria-hidden /></span>
      {title && <h3 className="mb-1 text-[15px] font-semibold">{title}</h3>}
      <p className="max-w-lg text-sm leading-relaxed text-ink-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Accessible segmented control (radio group). */
export function Segmented<T extends string>({ label, value, onChange, options, className }: { label: string; value: T | null; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex flex-wrap gap-1 rounded-lg border border-line bg-surface-2 p-1", className)}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={cn("rounded-md px-3 py-1.5 text-[13px] transition-colors", value === o.value ? "bg-surface font-semibold text-primary shadow-sm" : "text-ink-muted hover:text-ink")}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A labelled question with a segmented answer. */
export function Question<T extends string>({ label, value, onChange, options }: { label: string; value: T | null; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="flex flex-col gap-2 border-b border-line py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <p className="text-[14px] text-ink">{label}</p>
      <Segmented label={label} value={value} onChange={onChange} options={options} className="shrink-0" />
    </div>
  );
}
