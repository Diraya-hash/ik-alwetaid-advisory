"use client";

import { FolderOpen, Trash2 } from "lucide-react";
import { getScenario } from "@/content/scenarios";
import { derive } from "@/engine/reducer";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Badge, EmptyState, Meter, PageHeader } from "@/components/ui/primitives";
import { useHydrated, useSimStore } from "@/store/sim-store";
import { useProgress } from "@/components/views/info-pages";

export function SimulationsView() {
  const { t, l, f, p, num, date, href } = useI18n();
  const hydrated = useHydrated();
  const attempts = useSimStore((s) => s.attempts);
  const deleteAttempt = useSimStore((s) => s.deleteAttempt);
  const list = Object.values(attempts).sort((a, b) => b.updatedAt - a.updatedAt);
  const { results } = useProgress();
  const resultOf = (id: string) => results.find((r) => r.attempt.id === id);

  // Attempt numbers are per scenario, in creation order.
  const numberOf = (id: string, scenarioId: string) =>
    Object.values(attempts).filter((a) => a.scenarioId === scenarioId).sort((a, b) => a.createdAt - b.createdAt).findIndex((a) => a.id === id) + 1;

  return (
    <>
      <PageHeader eyebrow={t.simulations.eyebrow} title={t.simulations.title} lead={t.simulations.lead} />
      {!hydrated ? (
        <p className="text-ink-subtle">{t.common.loading}</p>
      ) : list.length === 0 ? (
        <EmptyState icon={FolderOpen} body={t.simulations.empty} action={<Button href={href("/scenarios")}>{t.dashboard.ctaPrimary}</Button>} />
      ) : (
        <ul className="space-y-3">
          {list.map((a) => {
            const sc = getScenario(a.scenarioId);
            if (!sc) return null;
            const st = derive(sc, a.actions);
            return (
              <li key={a.id} className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <Badge tone={a.status === "completed" ? "primary" : "warning"}>{t.simulations.status[a.status]}</Badge>
                    <span className="text-[12px] text-ink-subtle">{f(t.simulations.attempt, { n: numberOf(a.id, a.scenarioId) })}</span>
                  </div>
                  <p className="font-semibold">{l(sc.title)}</p>
                  <p className="mt-0.5 text-[12.5px] text-ink-subtle">
                    {[
                      f(t.dashboard.stageNow, { n: st.stage, name: t.stage[st.stage] }),
                      p(t.dashboard.activityReviewed, st.reviewed.length),
                      p(t.dashboard.activityAsked, st.asked.length),
                      f(t.simulations.hoursUsed, { n: st.hoursUsed }),
                    ].join(t.common.sep)}
                  </p>
                  <div className="mt-3 max-w-xs">
                    <Meter value={st.hoursUsed} max={sc.budgetHours} label={t.common.budget} />
                  </div>
                  <p className="mt-2 text-[11.5px] text-ink-subtle">{f(t.common.started, { date: date(a.createdAt) })}{t.common.sep}{f(t.common.updated, { date: date(a.updatedAt) })}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {resultOf(a.id) ? (
                    <>
                      <span className="me-2 text-end">
                        <span className="num block text-2xl font-semibold text-primary">{num(resultOf(a.id)!.result.overall)}</span>
                        {resultOf(a.id)!.delta !== null && (
                          <span className="num block text-[11.5px] text-ink-subtle">
                            {f(t.progress.vsPrevious, { delta: `${resultOf(a.id)!.delta! >= 0 ? "+" : "−"}${num(Math.abs(resultOf(a.id)!.delta!))}` })}
                          </span>
                        )}
                      </span>
                      <Button href={href(`/report?attempt=${a.id}`)}>{t.progress.viewReport}</Button>
                    </>
                  ) : (
                    <Button href={href(`/simulate?attempt=${a.id}`)}>{t.common.resume}</Button>
                  )}
                  <ConfirmButton question={t.simulations.deleteConfirm} onConfirm={() => deleteAttempt(a.id)} label={`${t.common.delete}: ${l(sc.title)}`}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </ConfirmButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
