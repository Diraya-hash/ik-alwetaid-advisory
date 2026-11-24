"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Info, Pencil } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge, Card, Meter, SectionTitle, TruthTag } from "@/components/ui/primitives";
import { DOMAIN_LABEL, SCOPE_LABEL, STAGE_LABEL } from "@/content/taxonomy";
import type { Diagnosis } from "@/engine/diagnosis";
import type { StatementRole, Truth } from "@/engine/intake";
import type { Project } from "@/engine/project";
import { cn } from "@/lib/utils";

const ROLES: StatementRole[] = ["symptom", "cause", "goal", "impact", "constraint", "context"];

export function useReframe(p: Project) {
  const { t, l, f } = useI18n();
  const i = p.intake;
  const area = i.domains.map((d) => l(DOMAIN_LABEL[d])).join(" / ");
  const need = i.stagePrimary ? l(STAGE_LABEL[i.stagePrimary].label) : null;
  if (!area || !need) return t.diagnosis.reframeEmpty;
  return i.scope ? f(t.diagnosis.reframe, { area, scope: l(SCOPE_LABEL[i.scope]), need }) : f(t.diagnosis.reframeNoScope, { area, need });
}

export function DiagnosisView({ project: p, diagnosis: d, onEdit, onNext }: { project: Project; diagnosis: Diagnosis; onEdit: () => void; onNext: () => void }) {
  const { t, l, num } = useI18n();
  const reframe = useReframe(p);
  const i = p.intake;
  const total = d.truthCounts.verified + d.truthCounts.unverified + d.truthCounts.assumption;

  return (
    <div className="space-y-6">
      {!p.intakeDone && <p className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-[13.5px] text-warning"><Info className="h-4 w-4 shrink-0" aria-hidden />{t.diagnosis.incomplete}</p>}

      <section className="rounded-2xl bg-deep p-6 text-deep-fg lg:p-8" aria-labelledby="ps">
        <p id="ps" className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-on-deep">{t.diagnosis.statement}</p>
        <p className="font-display text-[clamp(1.15rem,2vw,1.45rem)] leading-snug">{reframe}</p>
        <dl className="mt-6 grid gap-4 text-[13px] sm:grid-cols-3">
          <div><dt className="text-deep-fg/70">{t.diagnosis.needs}</dt><dd className="mt-1 font-medium">{[i.stagePrimary, i.stageSecondary].filter(Boolean).map((s) => l(STAGE_LABEL[s!].label)).join(" · ") || "—"}</dd></div>
          <div><dt className="text-deep-fg/70">{t.diagnosis.areas}</dt><dd className="mt-1 font-medium">{i.domains.map((x) => l(DOMAIN_LABEL[x])).join(" · ") || "—"}</dd></div>
          <div><dt className="text-deep-fg/70">{t.diagnosis.scope}</dt><dd className="mt-1 font-medium">{i.scope ? l(SCOPE_LABEL[i.scope]) : "—"}</dd></div>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <SectionTitle hint={t.diagnosis.completenessHint}>{t.diagnosis.completeness}</SectionTitle>
          <p className="num mb-2 text-3xl font-semibold text-ink">{num(Math.round(d.completeness * 100))}%</p>
          <Meter value={d.completeness} label={t.diagnosis.completeness} />
        </Card>
        <Card className="lg:col-span-2">
          <SectionTitle>{t.diagnosis.evidence}</SectionTitle>
          {total === 0 ? <p className="text-[13.5px] text-ink-muted">{t.diagnosis.nothingYet}</p> : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-surface-3" aria-hidden>
                {(["verified", "unverified", "assumption"] as Truth[]).map((k) => (
                  <div key={k} className={cn(k === "verified" ? "bg-fact" : k === "unverified" ? "bg-claim" : "bg-assumption")} style={{ width: `${(d.truthCounts[k] / total) * 100}%` }} />
                ))}
              </div>
              <ul className="mt-3 flex flex-wrap gap-4 text-[13px] text-ink-muted">
                {(["verified", "unverified", "assumption"] as Truth[]).map((k) => <li key={k} className="flex items-center gap-2"><TruthTag truth={k} /><span className="num">{num(d.truthCounts[k])}</span></li>)}
              </ul>
            </>
          )}
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {ROLES.map((role) => (
          <Card key={role} as="section">
            <SectionTitle as="h3">{t.rolesPlural[role]}</SectionTitle>
            {d.byRole[role].length === 0 ? <p className="text-[13px] text-ink-subtle">—</p> : (
              <ul className="space-y-2.5">
                {d.byRole[role].map((s) => (
                  <li key={s.id} className={cn("flex items-start justify-between gap-3 text-[14px] leading-snug text-ink", d.findings.some((x) => x.target === s.id) && "rounded-lg bg-warning-soft/60 p-2")}>
                    <span>{s.text}</span><TruthTag truth={s.truth} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle>{t.diagnosis.findingsTitle}</SectionTitle>
        {d.findings.length === 0 ? (
          <p className="flex items-center gap-2 text-[13.5px] text-primary"><CheckCircle2 className="h-4 w-4" aria-hidden />{t.diagnosis.noFindings}</p>
        ) : (
          <ul className="space-y-2">
            {d.findings.map((x, n) => (
              <li key={n} className="flex items-start gap-3 rounded-lg border border-line p-3 text-[13.5px] text-ink">
                <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", x.severity === "high" ? "text-danger" : x.severity === "medium" ? "text-warning" : "text-ink-subtle")} aria-hidden />
                <span className="flex-1">{t.diagnosis.findings[x.code]}{x.target && <span className="mt-1 block text-[12.5px] text-ink-subtle">“{p.intake.statements.find((s) => s.id === x.target)?.text}”</span>}</span>
                <Badge tone={x.severity === "high" ? "danger" : x.severity === "medium" ? "warning" : "neutral"}>{x.severity}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap justify-between gap-3">
        <Button variant="secondary" onClick={onEdit}><Pencil className="h-4 w-4" aria-hidden />{t.diagnosis.edit}</Button>
        <Button size="lg" onClick={onNext}>{t.diagnosis.toRecs}<ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Button>
      </div>
    </div>
  );
}
