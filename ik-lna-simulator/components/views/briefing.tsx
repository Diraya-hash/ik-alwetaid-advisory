"use client";

import { READY_STAGES } from "@/lib/release";
import { ArrowRight, Building2, Clock, Hourglass, Lock, Quote, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { getScenario } from "@/content/scenarios";
import { STAGES } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { DifficultyDots } from "@/components/scenario-card";
import { Button } from "@/components/ui/button";
import { Badge, Card, SectionTitle } from "@/components/ui/primitives";
import { useHydrated, useSimStore } from "@/store/sim-store";

export function BriefingView({ scenarioId }: { scenarioId: string }) {
  const { t, l, f, href } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const scenario = getScenario(scenarioId)!;
  const startAttempt = useSimStore((s) => s.startAttempt);
  const existing = Object.values(useSimStore((s) => s.attempts))
    .filter((a) => a.scenarioId === scenarioId && a.status === "in_progress")
    .sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const requester = scenario.stakeholders.find((s) => s.id === scenario.request.from)!;

  const start = () => router.push(href(`/simulate?attempt=${startAttempt(scenario)}`));

  return (
    <div className="space-y-6">
      <header>
        <p className="eyebrow mb-3">{t.briefing.eyebrow}</p>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Badge tone="primary">{t.category[scenario.category]}</Badge>
          <Badge><DifficultyDots level={scenario.difficulty} /> {t.difficulty[scenario.difficulty]}</Badge>
          <Badge><Clock className="h-3 w-3" aria-hidden /> {f(t.common.minutes, { n: scenario.estMinutes })}</Badge>
        </div>
        <h1 className="text-display-md font-semibold">{l(scenario.title)}</h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-ink-muted">{l(scenario.summary)}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-s-4 border-s-primary">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-ink">
              <Quote className="h-4 w-4 text-primary rtl:-scale-x-100" aria-hidden />
              {t.briefing.request}
              <span className="ms-auto"><Badge>{t.provenance.claim}</Badge></span>
            </div>
            <blockquote className="text-[15.5px] leading-relaxed text-ink">{l(scenario.request.text)}</blockquote>
            <p className="mt-3 text-[12.5px] text-ink-subtle">{f(t.briefing.requestFrom, { name: l(requester.name), title: l(requester.title) })}</p>
          </Card>

          <Card>
            <SectionTitle>
              <span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" aria-hidden />{t.briefing.organization}: {l(scenario.organization.name)}</span>
            </SectionTitle>
            <dl className="mb-4 grid gap-3 text-[13.5px] sm:grid-cols-2">
              <div><dt className="text-ink-subtle">{t.briefing.sector}</dt><dd className="font-medium">{l(scenario.organization.sector)}</dd></div>
              <div><dt className="text-ink-subtle">{t.briefing.size}</dt><dd className="font-medium">{l(scenario.organization.size)}</dd></div>
            </dl>
            <p className="text-[14px] leading-relaxed text-ink-muted">{l(scenario.organization.background)}</p>
            <h3 className="mb-2 mt-5 text-[13px] font-semibold">{t.briefing.strategy}</h3>
            <ul className="space-y-1.5 text-[14px] text-ink-muted">
              {scenario.strategy.priorities.map((p, i) => (
                <li key={i} className="flex gap-2"><Target className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />{l(p)}</li>
              ))}
            </ul>
          </Card>

          <Card>
            <SectionTitle>{t.briefing.stakeholdersTitle}</SectionTitle>
            <ul className="grid gap-3 sm:grid-cols-2">
              {scenario.stakeholders.map((s) => (
                <li key={s.id} className="rounded-xl border border-line bg-surface-2/50 p-3">
                  <p className="font-medium">{l(s.name)}</p>
                  <p className="text-[12.5px] text-ink-subtle">{l(s.title)}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <SectionTitle>
              <span className="inline-flex items-center gap-2"><Hourglass className="h-4 w-4 text-primary" aria-hidden />{t.briefing.budgetTitle}</span>
            </SectionTitle>
            <p className="text-[13.5px] leading-relaxed text-ink-muted">{f(t.briefing.budgetBody, { hours: scenario.budgetHours })}</p>
            <div className="mt-5 flex flex-col gap-2">
              {hydrated && existing ? (
                <>
                  <Button href={href(`/simulate?attempt=${existing.id}`)}>
                    {t.briefing.resumeExisting} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
                  </Button>
                  <Button variant="secondary" onClick={start}>{t.briefing.startAgain}</Button>
                </>
              ) : (
                <Button onClick={start} disabled={!hydrated}>
                  {t.briefing.startNew} <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
                </Button>
              )}
            </div>
          </Card>
          <Card>
            <SectionTitle>{t.briefing.focus}</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {scenario.competencyFocus.map((d) => <Badge key={d} tone="primary">{t.dimension[d]}</Badge>)}
            </div>
          </Card>
          <Card>
            <SectionTitle>{t.briefing.stagesTitle}</SectionTitle>
            <ol className="space-y-2.5">
              {STAGES.map((n) => {
                const playable = READY_STAGES.includes(n);
                return (
                  <li key={n} className="flex items-start gap-3 text-[13.5px]">
                    <span className={`num inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${playable ? "bg-primary text-primary-fg" : "bg-surface-3 text-ink-subtle"}`}>
                      {playable ? f("{n}", { n }) : <Lock className="h-3 w-3" aria-hidden />}
                    </span>
                    <span>
                      <span className={playable ? "font-medium" : "text-ink-subtle"}>{t.stage[n]}</span>
                      {!playable && <span className="block text-[11.5px] text-ink-subtle">{t.briefing.stagesUnavailable}</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}
