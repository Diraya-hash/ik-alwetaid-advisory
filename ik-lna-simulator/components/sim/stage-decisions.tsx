"use client";

import { Gauge, Layers, Target } from "lucide-react";
import {
  CAUSE_TYPES,
  KPI_LEVELS,
  REVIEW_DAYS,
  type ActionInput,
  type CauseType,
  type KpiLevel,
  type ReviewDays,
  type Scenario,
  type SimState,
} from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { Badge, Card, Meter, SectionTitle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { SegmentedChoice } from "./stage-diagnosis";

type Props = { scenario: Scenario; state: SimState; dispatch: (a: ActionInput) => void };

const selectCls = "h-9 rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink disabled:opacity-60";

export function StageCapability({ scenario, state, dispatch }: Props) {
  const { t, l, f } = useI18n();
  const locked = state.completed;
  return (
    <Card>
      <SectionTitle hint={t.capability.hint}>
        <span className="inline-flex items-center gap-2"><Layers className="h-4 w-4 text-primary" aria-hidden />{t.capability.title}</span>
      </SectionTitle>
      <ul className="space-y-3">
        {scenario.capabilityGaps.map((g) => {
          const cur = state.gaps[g.id];
          const nature: CauseType = cur?.nature ?? "skill";
          return (
            <li key={g.id} className={cn("rounded-xl border p-4", cur ? "border-line-strong" : "border-line")}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-[14px] font-medium">{l(g.title)}</p>
                  <p className="text-[12.5px] text-ink-subtle">{t.capability.population}: {l(g.population)}</p>
                  <div className="mt-3 grid max-w-sm grid-cols-2 gap-3 text-[12px] text-ink-muted">
                    <div>
                      <span>{t.capability.current}: {f(t.capability.scale, { n: g.current })}</span>
                      <Meter value={g.current} max={5} label={`${t.capability.current}: ${l(g.title)}`} className="mt-1" />
                    </div>
                    <div>
                      <span>{t.capability.required}: {f(t.capability.scale, { n: g.required })}</span>
                      <Meter value={g.required} max={5} label={`${t.capability.required}: ${l(g.title)}`} className="mt-1" />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <SegmentedChoice<"gap" | "not-gap">
                    name={l(g.title)}
                    value={cur?.verdict ?? null}
                    disabled={locked}
                    onChange={(v) => dispatch({ type: "SET_GAP", gapId: g.id, verdict: v, nature })}
                    options={[
                      { value: "gap", label: t.capability.isGap },
                      { value: "not-gap", label: t.capability.notGap },
                    ]}
                  />
                  {cur?.verdict === "gap" && (
                    <label className="flex items-center gap-2 text-[12.5px] text-ink-muted" htmlFor={`nature-${g.id}`}>
                      {t.capability.nature}
                      <select
                        id={`nature-${g.id}`}
                        value={nature}
                        disabled={locked}
                        onChange={(e) => dispatch({ type: "SET_GAP", gapId: g.id, verdict: "gap", nature: e.target.value as CauseType })}
                        className={selectCls}
                      >
                        {CAUSE_TYPES.map((c) => (
                          <option key={c} value={c}>{t.causeType[c]}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function StageSolution({ scenario, state, dispatch }: Props) {
  const { t, l, p } = useI18n();
  const locked = state.completed;
  const roots = scenario.rootCauses.filter((c) => state.causes[c.id]?.verdict === "root");
  return (
    <Card>
      <SectionTitle hint={t.solution.hint}>
        <span className="inline-flex items-center gap-2"><Target className="h-4 w-4 text-primary" aria-hidden />{t.solution.title}</span>
      </SectionTitle>
      <p className="mb-4 text-[12.5px] text-ink-subtle" aria-live="polite">{p(t.solution.selected, Object.keys(state.interventions).length)}</p>
      {roots.length === 0 && <p className="mb-4 rounded-lg bg-warning-soft p-3 text-[13px] text-warning">{t.solution.noRootCauses}</p>}
      <ul className="grid gap-3 lg:grid-cols-2">
        {scenario.interventions.map((iv) => {
          const cur = state.interventions[iv.id];
          const id = `iv-${iv.id}`;
          return (
            <li key={iv.id} className={cn("flex flex-col rounded-xl border p-4", cur ? "border-primary bg-primary-soft/40" : "border-line")}>
              <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
                <input
                  id={id}
                  type="checkbox"
                  checked={!!cur}
                  disabled={locked}
                  onChange={() => dispatch({ type: "SET_INTERVENTION", interventionId: iv.id, selected: !cur, causeIds: [] })}
                  className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--primary))]"
                />
                <span className="min-w-0">
                  <span className="mb-1 flex flex-wrap gap-1.5">
                    <Badge tone="primary">{t.interventionType[iv.type]}</Badge>
                    <Badge>{t.solution.phase[iv.phase]}</Badge>
                  </span>
                  <span className="block text-[14px] font-medium leading-snug">{l(iv.title)}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-ink-muted">{l(iv.description)}</span>
                </span>
              </label>
              {cur && (
                <fieldset className="mt-3 border-t border-line pt-3">
                  <legend className="mb-2 text-[12px] font-semibold text-ink-subtle">{t.solution.pickCause}</legend>
                  {roots.length === 0 ? (
                    <p className="text-[12.5px] text-ink-subtle">{t.solution.noRootCauses}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {roots.map((c) => {
                        const on = cur.causeIds.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            aria-pressed={on}
                            disabled={locked}
                            onClick={() =>
                              dispatch({
                                type: "SET_INTERVENTION",
                                interventionId: iv.id,
                                selected: true,
                                causeIds: on ? cur.causeIds.filter((x) => x !== c.id) : [...cur.causeIds, c.id],
                              })
                            }
                            className={cn(
                              "rounded-full border px-3 py-1 text-start text-[12px] transition-colors",
                              on ? "border-primary bg-primary text-primary-fg" : "border-line-strong text-ink-muted hover:text-ink"
                            )}
                          >
                            {l(c.title)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </fieldset>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export function StageMeasures({ scenario, state, dispatch }: Props) {
  const { t, l, p, f } = useI18n();
  const locked = state.completed;
  const requester = scenario.request.from;
  const set = (kpiId: string, selected: boolean, level: KpiLevel, ownerId: string, reviewDays: ReviewDays) =>
    dispatch({ type: "SET_KPI", kpiId, selected, level, ownerId, reviewDays });
  return (
    <Card>
      <SectionTitle hint={t.measures.hint}>
        <span className="inline-flex items-center gap-2"><Gauge className="h-4 w-4 text-primary" aria-hidden />{t.measures.title}</span>
      </SectionTitle>
      <p className="mb-4 text-[12.5px] text-ink-subtle" aria-live="polite">{p(t.measures.selected, Object.keys(state.kpis).length)}</p>
      <ul className="space-y-3">
        {scenario.kpis.map((k) => {
          const cur = state.kpis[k.id];
          const id = `kpi-${k.id}`;
          return (
            <li key={k.id} className={cn("rounded-xl border p-4", cur ? "border-primary bg-primary-soft/40" : "border-line")}>
              <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
                <input
                  id={id}
                  type="checkbox"
                  checked={!!cur}
                  disabled={locked}
                  onChange={() => set(k.id, !cur, cur?.level ?? "operational", cur?.ownerId ?? requester, cur?.reviewDays ?? 90)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--primary))]"
                />
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium leading-snug">{l(k.title)}</span>
                  <span className="mt-1 grid gap-x-6 text-[12.5px] text-ink-muted sm:grid-cols-2">
                    <span>{t.measures.baseline}: {l(k.baseline)}</span>
                    <span>{t.measures.target}: {l(k.target)}</span>
                  </span>
                </span>
              </label>
              {cur && (
                <div className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-3">
                  <label className="flex flex-col gap-1 text-[12px] text-ink-subtle" htmlFor={`${id}-level`}>
                    {t.measures.level}
                    <select id={`${id}-level`} value={cur.level} disabled={locked} className={selectCls}
                      onChange={(e) => set(k.id, true, e.target.value as KpiLevel, cur.ownerId, cur.reviewDays)}>
                      {KPI_LEVELS.map((lv) => <option key={lv} value={lv}>{t.kpiLevel[lv]}</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[12px] text-ink-subtle" htmlFor={`${id}-owner`}>
                    {t.measures.owner}
                    <select id={`${id}-owner`} value={cur.ownerId} disabled={locked} className={selectCls}
                      onChange={(e) => set(k.id, true, cur.level, e.target.value, cur.reviewDays)}>
                      {scenario.stakeholders.map((s) => <option key={s.id} value={s.id}>{l(s.name)} ({l(s.title)})</option>)}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-[12px] text-ink-subtle" htmlFor={`${id}-review`}>
                    {t.measures.review}
                    <select id={`${id}-review`} value={cur.reviewDays} disabled={locked} className={selectCls}
                      onChange={(e) => set(k.id, true, cur.level, cur.ownerId, Number(e.target.value) as ReviewDays)}>
                      {REVIEW_DAYS.map((d) => <option key={d} value={d}>{f(t.measures.days, { n: d })}</option>)}
                    </select>
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
