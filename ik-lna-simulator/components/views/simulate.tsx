"use client";

import { ArrowLeft, Check, Hourglass, Lock, SearchX } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getScenario } from "@/content/scenarios";
import { derive } from "@/engine/reducer";
import { PLAYABLE_STAGES, STAGES, type ActionInput, type StageId } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { EvidenceBoard } from "@/components/sim/evidence-board";
import { StageContext } from "@/components/sim/stage-context";
import { StageInterviews } from "@/components/sim/stage-interviews";
import { Button } from "@/components/ui/button";
import { EmptyState, Meter } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { useHydrated, useSimStore } from "@/store/sim-store";

export function SimulateView() {
  const { t, l, f, href } = useI18n();
  const hydrated = useHydrated();
  const attemptId = useSearchParams().get("attempt") ?? "";
  const attempt = useSimStore((s) => s.attempts[attemptId]);
  const storeDispatch = useSimStore((s) => s.dispatch);
  const scenario = attempt ? getScenario(attempt.scenarioId) : undefined;
  const state = useMemo(() => (scenario && attempt ? derive(scenario, attempt.actions) : null), [scenario, attempt]);

  const [viewStage, setViewStage] = useState<StageId | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<"work" | "evidence">("work");
  const stage = state?.stage;
  // Follow the attempt when it advances; the user can still look back at earlier stages.
  useEffect(() => {
    if (stage) setViewStage(stage);
  }, [stage]);

  if (!hydrated) return <p className="text-ink-subtle">{t.common.loading}</p>;
  if (!attempt || !scenario || !state) {
    return (
      <EmptyState
        icon={SearchX}
        title={t.sim.notFoundTitle}
        body={attempt && !scenario ? t.sim.scenarioMissing : t.sim.notFoundBody}
        action={<Button href={href("/scenarios")}>{t.dashboard.ctaPrimary}</Button>}
      />
    );
  }

  const dispatch = (a: ActionInput) => storeDispatch(scenario, attempt.id, a);
  const shown = viewStage ?? state.stage;

  return (
    <div className="space-y-6">
      <header className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow mb-1">{l(scenario.organization.name)}</p>
            <h1 className="text-display-sm font-semibold">{l(scenario.title)}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-52" aria-live="polite">
              <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-medium text-ink-muted">
                <Hourglass className="h-3.5 w-3.5 text-primary" aria-hidden />
                {state.hoursRemaining > 0
                  ? f(t.sim.budgetLeft, { n: state.hoursRemaining, total: scenario.budgetHours })
                  : t.sim.budgetOut}
              </p>
              <Meter value={state.hoursRemaining} max={scenario.budgetHours} label={t.common.budget} />
            </div>
            <Button variant="secondary" size="sm" href={href("/simulations")}>
              <ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
              {t.sim.exit}
            </Button>
          </div>
        </div>

        <ol className="grid grid-cols-3 gap-2 md:grid-cols-6" aria-label={t.briefing.stagesTitle}>
          {STAGES.map((n) => {
            const playable = PLAYABLE_STAGES.includes(n);
            const reached = n <= state.stage;
            const isShown = n === shown;
            return (
              <li key={n}>
                <button
                  type="button"
                  disabled={!reached}
                  onClick={() => setViewStage(n)}
                  aria-current={isShown ? "step" : undefined}
                  className={cn(
                    "flex h-full w-full flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-start transition-colors disabled:cursor-not-allowed",
                    isShown ? "border-primary bg-primary-soft/70" : reached ? "border-line bg-surface hover:border-line-strong" : "border-dashed border-line bg-transparent"
                  )}
                >
                  <span className={cn("flex items-center gap-1.5 text-[11px] font-semibold", reached ? "text-primary" : "text-ink-subtle")}>
                    {n < state.stage ? <Check className="h-3 w-3" aria-hidden /> : !playable ? <Lock className="h-3 w-3" aria-hidden /> : null}
                    {f(t.sim.stageLabel, { n })}
                  </span>
                  <span className={cn("text-[12.5px] leading-tight", reached ? "font-medium text-ink" : "text-ink-subtle")}>{t.stage[n]}</span>
                  {!playable && <span className="text-[10.5px] text-ink-subtle">{t.sim.unavailable}</span>}
                </button>
              </li>
            );
          })}
        </ol>
        <p className="text-[13px] text-ink-muted">{t.stageDesc[shown]}</p>
      </header>

      <div className="flex gap-1 rounded-lg border border-line bg-surface p-1 lg:hidden" role="tablist">
        {(["work", "evidence"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("flex-1 rounded-md py-2 text-[13px] font-medium", tab === k ? "bg-primary-soft text-primary-soft-fg" : "text-ink-muted")}
          >
            {t.sim.tabs[k]}
            {k === "evidence" && <span className="num ms-1.5 text-ink-subtle">{f("{n}", { n: state.discovered.length + state.hypotheses.length })}</span>}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className={cn(tab !== "work" && "hidden lg:block")}>
          {shown === 1 && <StageContext scenario={scenario} state={state} dispatch={dispatch} />}
          {shown === 2 && <StageInterviews scenario={scenario} state={state} dispatch={dispatch} selected={selected} onSelect={setSelected} />}
        </div>
        <aside className={cn("lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto", tab !== "evidence" && "hidden lg:block")}>
          <EvidenceBoard scenario={scenario} state={state} dispatch={dispatch} />
        </aside>
      </div>
      <p className="text-center text-[11.5px] text-ink-subtle">{t.sim.saved}</p>
    </div>
  );
}
