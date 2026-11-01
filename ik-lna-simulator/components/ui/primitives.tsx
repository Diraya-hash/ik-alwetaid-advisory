"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export function PageHeader({ eyebrow, title, lead, actions }: { eyebrow: string; title: string; lead?: string; actions?: React.ReactNode }) {
  return (
    <header className="mb-8 flex flex-col gap-4 lg:mb-10 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="eyebrow mb-3">{eyebrow}</p>
        <h1 className="text-display-md font-semibold text-ink">{title}</h1>
        {lead && <p className="mt-3 text-[15px] leading-relaxed text-ink-muted">{lead}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ className, children, as: As = "div" }: { className?: string; children: React.ReactNode; as?: "div" | "section" | "article" | "li" }) {
  return <As className={cn("card p-5 lg:p-6", className)}>{children}</As>;
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-semibold text-ink">{children}</h2>
      {hint && <p className="mt-1 text-[13px] text-ink-subtle">{hint}</p>}
    </div>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "primary" | "warning" | "danger"; className?: string }) {
  const tones = {
    neutral: "bg-surface-2 text-ink-muted border-line",
    primary: "bg-primary-soft text-primary-soft-fg border-primary/20",
    warning: "bg-warning-soft text-warning border-warning/25",
    danger: "bg-danger-soft text-danger border-danger/25",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11.5px] font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export type Provenance = "fact" | "claim" | "assumption" | "system";
export function ProvenanceTag({ kind }: { kind: Provenance }) {
  const { t } = useI18n();
  const styles: Record<Provenance, string> = {
    fact: "bg-fact-soft text-fact border-fact/25",
    claim: "bg-claim-soft text-claim border-claim/25",
    assumption: "bg-assumption-soft text-assumption border-assumption/25",
    system: "bg-system-soft text-system border-system/25",
  };
  const desc = { fact: t.provenance.factDesc, claim: t.provenance.claimDesc, assumption: t.provenance.assumptionDesc, system: t.provenance.systemDesc }[kind];
  return (
    <span title={desc} className={cn("inline-flex items-center rounded border px-1.5 py-px text-[10.5px] font-semibold uppercase tracking-wide", styles[kind])}>
      {t.provenance[kind]}
    </span>
  );
}

export function Meter({ value, max = 100, label, className }: { value: number; max?: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-surface-3", className)}
    >
      <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ icon: Icon, title, body, action }: { icon: LucideIcon; title?: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-surface/60 px-6 py-12 text-center">
      <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      {title && <h3 className="mb-1 text-[15px] font-semibold">{title}</h3>}
      <p className="max-w-lg text-sm leading-relaxed text-ink-muted">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="text-[12.5px] text-ink-subtle">{label}</p>
      <p className="num mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-ink-subtle">{hint}</p>}
    </div>
  );
}

export function Select({ label, value, onChange, options, id }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; id: string }) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1.5">
      <span className="text-[12px] font-medium text-ink-subtle">{label}</span>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink focus:border-primary"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
