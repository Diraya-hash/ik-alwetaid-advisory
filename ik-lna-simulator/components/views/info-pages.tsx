"use client";

import { BarChart3, Lightbulb, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { findQuestion } from "@/engine/reducer";
import { DIMENSIONS, STAGES, type Dimension } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { ScenarioCard } from "@/components/scenario-card";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState, Meter, PageHeader, ProvenanceTag, SectionTitle } from "@/components/ui/primitives";
import { completedResults, profile, recommendNext, type CompletedResult } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { useHydrated, useSimStore } from "@/store/sim-store";

export function useProgress() {
  const hydrated = useHydrated();
  const attempts = useSimStore((s) => s.attempts);
  return useMemo(() => {
    const results = hydrated ? completedResults(attempts) : [];
    const prof = profile(results);
    return { hydrated, results, prof, next: recommendNext(results, prof) };
  }, [hydrated, attempts]);
}

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

/** Line chart of overall scores, drawn to one scale (0–100). Time runs left to right in both languages. */
function ScoreChart({ results }: { results: CompletedResult[] }) {
  const { t, f, num, l } = useI18n();
  const W = 640, H = 220, P = { l: 36, r: 16, t: 12, b: 28 };
  const iw = W - P.l - P.r, ih = H - P.t - P.b;
  const x = (i: number) => P.l + (results.length === 1 ? iw / 2 : (i * iw) / (results.length - 1));
  const y = (v: number) => P.t + ih - (v / 100) * ih;
  const pts = results.map((r, i) => [x(i), y(r.result.overall)] as const);
  const path = pts.map(([a, b], i) => `${i ? "L" : "M"}${a},${b}`).join(" ");
  return (
    <div dir="ltr" className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={f(t.progress.chartLabel, { n: results.length })} className="h-auto w-full min-w-[22rem]">
        {[0, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line x1={P.l} x2={W - P.r} y1={y(v)} y2={y(v)} stroke="rgb(var(--border))" strokeDasharray={v === 0 ? undefined : "3 4"} />
            <text x={P.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill="rgb(var(--text-subtle))">{num(v)}</text>
          </g>
        ))}
        {results.length > 1 && <path d={`${path} L${pts.at(-1)![0]},${y(0)} L${pts[0]![0]},${y(0)} Z`} fill="rgb(var(--primary) / 0.08)" />}
        <path d={path} fill="none" stroke="rgb(var(--primary))" strokeWidth="2.5" strokeLinejoin="round" />
        {pts.map(([a, b], i) => (
          <g key={i}>
            <circle cx={a} cy={b} r={i === pts.length - 1 ? 5.5 : 4} fill="rgb(var(--surface))" stroke="rgb(var(--primary))" strokeWidth="2.5" />
            <title>{`${l(results[i]!.scenario.title)}: ${results[i]!.result.overall}`}</title>
          </g>
        ))}
        <text x={pts.at(-1)![0]} y={pts.at(-1)![1] - 10} textAnchor="middle" fontSize="12" fontWeight="600" fill="rgb(var(--primary))">{num(results.at(-1)!.result.overall)}</text>
      </svg>
    </div>
  );
}

function DimensionBars({ values }: { values: Record<Dimension, number> }) {
  const { t, num } = useI18n();
  return (
    <ul className="space-y-3">
      {DIMENSIONS.map((d) => (
        <li key={d}>
          <div className="mb-1 flex justify-between text-[13px]"><span>{t.dimension[d]}</span><span className="num font-medium">{num(values[d])}</span></div>
          <Meter value={values[d]} label={t.dimension[d]} />
        </li>
      ))}
    </ul>
  );
}

function Delta({ value }: { value: number | null }) {
  const { t, num } = useI18n();
  if (value === null) return <span className="text-ink-subtle">{t.progress.firstAttempt}</span>;
  const sign = value > 0 ? "+" : value < 0 ? "−" : "±";
  return <span className={cn("num font-medium", value > 0 ? "text-primary" : value < 0 ? "text-danger" : "text-ink-muted")}>{sign}{num(Math.abs(value))}</span>;
}

export function InsightsView() {
  const { t, l, p, num, href } = useI18n();
  const { hydrated, results } = useProgress();
  return (
    <>
      <PageHeader eyebrow={t.insights.eyebrow} title={t.insights.title} />
      {!hydrated ? <p className="text-ink-subtle">{t.common.loading}</p> : results.length === 0 ? (
        <EmptyState icon={Lightbulb} body={t.insights.empty} action={<Button href={href("/scenarios")}>{t.dashboard.ctaPrimary}</Button>} />
      ) : (
        <ul className="space-y-4">
          {[...results].reverse().map((r) => {
            const missed = r.result.insights.missedQuestions;
            const first = missed[0] ? findQuestion(r.scenario, missed[0].stakeholderId, missed[0].questionId) : null;
            return (
              <li key={r.attempt.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] text-ink-subtle">{t.category[r.scenario.category]}{t.common.sep}{t.difficulty[r.scenario.difficulty]}</p>
                    <h2 className="text-lg font-semibold">{l(r.scenario.title)}</h2>
                  </div>
                  <div className="text-end">
                    <p className="num text-2xl font-semibold text-primary">{num(r.result.overall)}</p>
                    <Badge tone="primary">{t.report.band[r.result.band]}</Badge>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-[12px] font-semibold text-ink-subtle">{t.report.strengths}</p>
                    <p className="text-[13px]">{r.result.insights.strengths.map((d) => t.dimension[d]).join(t.common.sep)}</p>
                    <p className="mb-1 mt-3 text-[12px] font-semibold text-ink-subtle">{t.report.focus}</p>
                    <p className="text-[13px]">{r.result.insights.focus.map((d) => t.dimension[d]).join(t.common.sep)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-2 p-3">
                    <p className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-ink-subtle"><ProvenanceTag kind="system" />{t.progress.lessonTitle}</p>
                    {first ? (
                      <>
                        <p className="text-[12.5px] text-ink-subtle">{p(t.progress.missedCount, missed.length)}</p>
                        <p className="mt-1 text-[13px] font-medium">“{l(first.question.text)}”</p>
                        <p className="mt-1 text-[13px] text-ink-muted">{l(first.question.whyItMatters)}</p>
                      </>
                    ) : (
                      <p className="text-[13px] text-ink-muted">{t.progress.noMissed}</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" href={href(`/report?attempt=${r.attempt.id}`)}>{t.progress.viewReport}</Button>
                  <Button size="sm" variant="secondary" href={href(`/scenarios/${r.scenario.id}`)}>{t.progress.replay}</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function AnalyticsView() {
  const { t, l, num, date, href } = useI18n();
  const { hydrated, results, prof } = useProgress();
  return (
    <>
      <PageHeader eyebrow={t.analytics.eyebrow} title={t.analytics.title} />
      {!hydrated ? <p className="text-ink-subtle">{t.common.loading}</p> : results.length === 0 ? (
        <EmptyState icon={BarChart3} body={t.analytics.empty} action={<Button href={href("/scenarios")}>{t.dashboard.ctaPrimary}</Button>} />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <SectionTitle>{t.progress.chartTitle}</SectionTitle>
              <ScoreChart results={results} />
            </Card>
            <Card className="lg:col-span-2">
              <SectionTitle>{t.progress.dimTitle}</SectionTitle>
              <DimensionBars values={prof.dimensionAverages!} />
            </Card>
          </div>
          <Card>
            <SectionTitle>{t.progress.compareTitle}</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-[13px]">
                <thead className="text-[12px] text-ink-subtle">
                  <tr className="border-b border-line">
                    {[t.progress.colScenario, t.progress.colAttempt, t.progress.colDate, t.progress.colScore, t.progress.colChange, ""].map((h, i) => (
                      <th key={i} className="py-2 pe-3 text-start font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...results].reverse().map((r) => (
                    <tr key={r.attempt.id} className="border-b border-line">
                      <td className="py-2 pe-3 font-medium">{l(r.scenario.title)}</td>
                      <td className="num py-2 pe-3">{num(r.attemptNumber)}</td>
                      <td className="py-2 pe-3 text-ink-muted">{date(r.completedAt)}</td>
                      <td className="num py-2 pe-3 font-semibold">{num(r.result.overall)}</td>
                      <td className="py-2 pe-3"><Delta value={r.delta} /></td>
                      <td className="py-2"><Link className="text-primary underline" href={href(`/report?attempt=${r.attempt.id}`)}>{t.progress.viewReport}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
      <div className="mt-8">
        <SectionTitle>{t.analytics.rubricTitle}</SectionTitle>
        <RubricList />
      </div>
    </>
  );
}

const STUDY: Record<Dimension, keyof ReturnType<typeof useI18n>["t"]["methodology"]["tools"]> = {
  strategicAlignment: "sevenS",
  stakeholderEngagement: "systems",
  diagnosticThinking: "whys",
  rootCauseIdentification: "fishbone",
  evidenceBasedDecisions: "gap",
  capabilityAssessment: "gap",
  solutionAppropriateness: "process",
  businessImpact: "gap",
};

export function DevelopmentView() {
  const { t, f, p, num, href } = useI18n();
  const { hydrated, results, prof, next } = useProgress();
  const bands = ["orderTaker", "practitioner", "partner", "consultant"] as const;
  const study = [...new Set(prof.focus.map((d) => STUDY[d]))];
  return (
    <>
      <PageHeader eyebrow={t.development.eyebrow} title={t.development.title} lead={hydrated && results.length === 0 ? t.development.empty : undefined} />
      {hydrated && results.length > 0 && (
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <Card className="bg-navy text-navy-fg">
            <p className="text-[12px] text-navy-fg/70">{t.progress.currentBand}</p>
            <p className="mt-1 text-2xl font-semibold">{t.report.band[prof.band!]}</p>
            <p className="num mt-2 text-4xl font-semibold">{num(prof.average!)}</p>
            <p className="mt-2 text-[12.5px] text-navy-fg/70">{p(t.progress.basedOn, Math.min(3, results.length))}</p>
          </Card>
          <Card className="lg:col-span-2">
            <SectionTitle>{t.progress.progressTitle}</SectionTitle>
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {DIMENSIONS.map((d) => {
                const v = prof.firstVsLatest![d];
                return (
                  <li key={d} className="flex items-center justify-between gap-3 text-[13px]">
                    <span>{t.dimension[d]}</span>
                    <span className="num shrink-0 text-ink-muted">{num(v.first)} → <span className="font-semibold text-ink">{num(v.latest)}</span> <Delta value={results.length > 1 ? v.latest - v.first : null} /></span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card>
            <SectionTitle>{t.report.strengths}</SectionTitle>
            <ul className="space-y-1 text-[13px]">{prof.strengths.map((d) => <li key={d}>• {t.dimension[d]} ({num(prof.dimensionAverages![d])})</li>)}</ul>
          </Card>
          <Card>
            <SectionTitle>{t.report.focus}</SectionTitle>
            <ul className="space-y-2 text-[13px]">{prof.focus.map((d) => <li key={d}><span className="font-medium">{t.dimension[d]} ({num(prof.dimensionAverages![d])})</span><span className="block text-ink-muted">{t.dimensionCriteria[d]}</span></li>)}</ul>
          </Card>
          <Card>
            <SectionTitle>{t.progress.studyTitle}</SectionTitle>
            <ul className="space-y-2 text-[13px]">
              {study.map((k) => (
                <li key={k}><span className="font-medium">{t.methodology.tools[k].name}</span><span className="block text-ink-muted">{t.methodology.tools[k].desc}</span></li>
              ))}
            </ul>
            <Link href={href("/methodology")} className="mt-3 inline-block text-[13px] text-primary underline">{t.nav.methodology}</Link>
          </Card>
        </div>
      )}
      {hydrated && next && (
        <div className="mb-8 max-w-md">
          <SectionTitle hint={prof.focus.length ? f(t.progress.nextReason, { focus: t.dimension[prof.focus[0]!] }) : undefined}>{t.progress.nextTitle}</SectionTitle>
          <ScenarioCard scenario={next} />
        </div>
      )}
      <SectionTitle>{t.development.bandsTitle}</SectionTitle>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {bands.map((b, i) => (
          <li key={b} className={cn("card p-4", prof.band === b && "ring-2 ring-primary")}>
            <div className="mb-3 flex gap-1" aria-hidden>
              {bands.map((_, j) => <span key={j} className={j <= i ? "h-1.5 flex-1 rounded-full bg-primary" : "h-1.5 flex-1 rounded-full bg-surface-3"} />)}
            </div>
            <p className="font-semibold">{t.development.bands[b].name}</p>
            <p className="num text-[12px] text-primary">{t.development.bands[b].range}</p>
            <p className="mt-1.5 text-[13px] text-ink-muted">{t.development.bands[b].desc}</p>
          </li>
        ))}
      </ol>
      {hydrated && results.length === 0 && (
        <div className="mt-8"><EmptyState icon={TrendingUp} body={t.development.empty} action={<Button href={href("/scenarios")}>{t.dashboard.ctaPrimary}</Button>} /></div>
      )}
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
