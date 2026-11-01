"use client";

import { Activity, ArrowRight, Compass, Target } from "lucide-react";
import Link from "next/link";
import { scenarios, getScenario } from "@/content/scenarios";
import { derive } from "@/engine/reducer";
import { DIMENSIONS } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { ScenarioCard } from "@/components/scenario-card";
import { Button } from "@/components/ui/button";
import { Card, EmptyState, SectionTitle, Stat } from "@/components/ui/primitives";
import { useHydrated, useSimStore } from "@/store/sim-store";

export function DashboardView() {
  const { t, f, l, p, num, date, href } = useI18n();
  const hydrated = useHydrated();
  const attempts = Object.values(useSimStore((s) => s.attempts)).sort((a, b) => b.updatedAt - a.updatedAt);
  const inProgress = attempts.filter((a) => a.status === "in_progress");
  const completed = attempts.filter((a) => a.status === "completed");
  const latest = inProgress.find((a) => getScenario(a.scenarioId));
  const attempted = new Set(attempts.map((a) => a.scenarioId));
  const recommended = scenarios.filter((s) => !attempted.has(s.id)).concat(scenarios.filter((s) => attempted.has(s.id)))[0];

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-navy px-6 py-10 text-navy-fg sm:px-10 lg:py-14">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" aria-hidden />
        <div className="relative max-w-3xl">
          <p className="mb-4 text-[12px] font-semibold uppercase tracking-[0.14em] text-navy-fg/70">{t.dashboard.eyebrow}</p>
          <h1 className="text-display-lg font-semibold">{t.dashboard.title}</h1>
          <p className="mt-5 max-w-2xl text-[15.5px] leading-relaxed text-navy-fg/80">{t.dashboard.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {hydrated && latest ? (
              <Button size="lg" href={href(`/simulate?attempt=${latest.id}`)}>
                {t.dashboard.ctaContinue}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
              </Button>
            ) : (
              <Button size="lg" href={href("/scenarios")}>
                {t.dashboard.ctaPrimary}
                <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
              </Button>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t.dashboard.statAvailable} value={num(scenarios.length)} />
        <Stat label={t.dashboard.statInProgress} value={hydrated ? num(inProgress.length) : "–"} />
        <Stat label={t.dashboard.statCompleted} value={hydrated ? num(completed.length) : "–"} />
        <Stat label={t.dashboard.statAverage} value="–" hint={t.dashboard.noScore} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <SectionTitle>{t.dashboard.recentTitle}</SectionTitle>
          {hydrated && attempts.length > 0 ? (
            <ul className="divide-y divide-line">
              {attempts.slice(0, 5).map((a) => {
                const sc = getScenario(a.scenarioId);
                if (!sc) return null;
                const st = derive(sc, a.actions);
                return (
                  <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <Link href={href(`/simulate?attempt=${a.id}`)} className="font-medium text-ink hover:text-primary">
                        {l(sc.title)}
                      </Link>
                      <p className="mt-0.5 text-[12.5px] text-ink-subtle">
                        {[f(t.dashboard.stageNow, { n: st.stage, name: t.stage[st.stage] }), p(t.dashboard.activityReviewed, st.reviewed.length), p(t.dashboard.activityAsked, st.asked.length)].join(t.common.sep)}
                      </p>
                    </div>
                    <span className="shrink-0 text-[12px] text-ink-subtle">{date(a.updatedAt)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={Activity} body={t.dashboard.recentEmpty} />
          )}
        </Card>
        <div className="lg:col-span-2">
          <SectionTitle
            hint={recommended ? f(t.dashboard.recommendedReason, { difficulty: t.difficulty[recommended.difficulty], focus: t.dimension[recommended.competencyFocus[0]!] }) : undefined}
          >
            {t.dashboard.recommendedTitle}
          </SectionTitle>
          {recommended ? <ScenarioCard scenario={recommended} /> : <EmptyState icon={Compass} body={t.library.empty} />}
        </div>
      </div>

      <Card>
        <SectionTitle hint={t.dashboard.profileEmpty}>{t.dashboard.profileTitle}</SectionTitle>
        <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {DIMENSIONS.map((d) => (
            <li key={d} className="flex items-center gap-3 text-[13.5px]">
              <Target className="h-4 w-4 shrink-0 text-ink-subtle" aria-hidden />
              <span className="flex-1 text-ink-muted">{t.dimension[d]}</span>
              <span className="num text-ink-subtle">–</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
