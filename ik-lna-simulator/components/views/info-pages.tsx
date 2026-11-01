"use client";

import { BarChart3, Lightbulb, TrendingUp } from "lucide-react";
import { DIMENSIONS, STAGES } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, PageHeader, ProvenanceTag, SectionTitle } from "@/components/ui/primitives";

export function RubricList() {
  const { t, num } = useI18n();
  return (
    <ol className="grid gap-3 sm:grid-cols-2">
      {DIMENSIONS.map((d, i) => (
        <li key={d} className="card p-4">
          <p className="flex items-baseline gap-2 font-semibold">
            <span className="num text-[12px] text-primary">{num(i + 1)}</span>
            {t.dimension[d]}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{t.dimensionCriteria[d]}</p>
        </li>
      ))}
    </ol>
  );
}

export function InsightsView() {
  const { t, href } = useI18n();
  return (
    <>
      <PageHeader eyebrow={t.insights.eyebrow} title={t.insights.title} />
      <EmptyState icon={Lightbulb} body={t.insights.empty} action={<Button href={href("/scenarios")}>{t.dashboard.ctaPrimary}</Button>} />
    </>
  );
}

export function AnalyticsView() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader eyebrow={t.analytics.eyebrow} title={t.analytics.title} />
      <EmptyState icon={BarChart3} body={t.analytics.empty} />
      <div className="mt-8">
        <SectionTitle>{t.analytics.rubricTitle}</SectionTitle>
        <RubricList />
      </div>
    </>
  );
}

export function DevelopmentView() {
  const { t } = useI18n();
  const bands = ["orderTaker", "practitioner", "partner", "consultant"] as const;
  return (
    <>
      <PageHeader eyebrow={t.development.eyebrow} title={t.development.title} />
      <EmptyState icon={TrendingUp} body={t.development.empty} />
      <div className="mt-8">
        <SectionTitle>{t.development.bandsTitle}</SectionTitle>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {bands.map((b, i) => (
            <li key={b} className="card p-4">
              <div className="mb-3 flex gap-1" aria-hidden>
                {bands.map((_, j) => <span key={j} className={j <= i ? "h-1.5 flex-1 rounded-full bg-primary" : "h-1.5 flex-1 rounded-full bg-surface-3"} />)}
              </div>
              <p className="font-semibold">{t.development.bands[b].name}</p>
              <p className="num text-[12px] text-primary">{t.development.bands[b].range}</p>
              <p className="mt-1.5 text-[13px] text-ink-muted">{t.development.bands[b].desc}</p>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

export function MethodologyView() {
  const { t, num } = useI18n();
  const tools = ["whys", "fishbone", "gap", "systems", "process", "sevenS"] as const;
  const prov = ["fact", "claim", "assumption", "system"] as const;
  const provDesc = { fact: t.provenance.factDesc, claim: t.provenance.claimDesc, assumption: t.provenance.assumptionDesc, system: t.provenance.systemDesc };
  return (
    <>
      <PageHeader eyebrow={t.methodology.eyebrow} title={t.methodology.title} lead={t.methodology.lead} />
      <div className="space-y-10">
        <section>
          <SectionTitle>{t.methodology.stagesTitle}</SectionTitle>
          <ol className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {STAGES.map((n) => (
              <li key={n} className="card p-5">
                <span className="num inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-primary-fg">{num(n)}</span>
                <p className="mt-3 font-semibold">{t.stage[n]}</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{t.stageDesc[n]}</p>
              </li>
            ))}
          </ol>
        </section>

        <section>
          <SectionTitle>{t.methodology.toolsTitle}</SectionTitle>
          <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((k) => (
              <li key={k} className="rounded-xl border border-line bg-surface-2/50 p-4">
                <p className="font-semibold">{t.methodology.tools[k].name}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{t.methodology.tools[k].desc}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <SectionTitle hint={t.methodology.scoringLead}>{t.methodology.scoringTitle}</SectionTitle>
          <RubricList />
          <Card className="mt-4">
            <SectionTitle>{t.methodology.antiGamingTitle}</SectionTitle>
            <ul className="space-y-3 text-[13.5px] leading-relaxed text-ink-muted">
              {(["quality", "training", "evidence"] as const).map((k) => (
                <li key={k} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />{t.methodology.antiGaming[k]}</li>
              ))}
            </ul>
          </Card>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <SectionTitle hint={t.methodology.provenanceLead}>{t.methodology.provenanceTitle}</SectionTitle>
            <ul className="space-y-3">
              {prov.map((k) => (
                <li key={k} className="flex items-center gap-3 text-[13.5px]"><span className="w-24 shrink-0"><ProvenanceTag kind={k} /></span><span className="text-ink-muted">{provDesc[k]}</span></li>
              ))}
            </ul>
          </Card>
          <Card>
            <SectionTitle>{t.methodology.budgetTitle}</SectionTitle>
            <p className="text-[13.5px] leading-relaxed text-ink-muted">{t.methodology.budgetBody}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
