"use client";

import { GitBranch, Lightbulb } from "lucide-react";
import { findEvidence } from "@/engine/reducer";
import { CAUSE_TYPES, type ActionInput, type CauseVerdict, type Scenario, type SimState } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { Card, ProvenanceTag, SectionTitle } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { provenanceOf } from "./evidence-board";

export function SegmentedChoice<T extends string>({
  name,
  value,
  options,
  onChange,
  disabled,
}: {
  name: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T | null) => void;
  disabled?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={name} className="inline-flex flex-wrap gap-1 rounded-lg border border-line bg-surface-2 p-0.5">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(active ? null : o.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors disabled:cursor-not-allowed",
              active ? "bg-primary text-primary-fg shadow-sm" : "text-ink-muted hover:text-ink"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function StageDiagnosis({ scenario, state, dispatch }: { scenario: Scenario; state: SimState; dispatch: (a: ActionInput) => void }) {
  const { t, l, p, f } = useI18n();
  const locked = state.completed;
  const framing = scenario.framing.options.find((o) => o.id === state.framings.at(-1));
  const groups = CAUSE_TYPES.map((type) => ({ type, causes: scenario.rootCauses.filter((c) => c.type === type) })).filter((g) => g.causes.length);
  const counts = Object.values(state.causes);

  const set = (causeId: string, verdict: CauseVerdict | null, evidenceIds: string[]) =>
    dispatch({ type: "SET_CAUSE", causeId, verdict, evidenceIds });

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-1 text-[12px] font-semibold text-ink-subtle">{t.diagnosis.framingRef}</p>
            <p className="text-[13.5px] leading-relaxed">{framing ? l(framing.text) : "–"}</p>
          </div>
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-ink-subtle">
              <Lightbulb className="h-3.5 w-3.5 text-assumption" aria-hidden />
              {t.diagnosis.hypothesesRef}
            </p>
            {state.hypotheses.length ? (
              <ul className="space-y-1 text-[13px]">
                {state.hypotheses.map((h) => (
                  <li key={h.id} dir="auto">• {h.text} <span className="text-ink-subtle">({t.causeType[h.causeType]})</span></li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-ink-subtle">{t.sim.hypothesesEmpty}</p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle hint={t.diagnosis.hint}>
          <span className="inline-flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" aria-hidden />{t.diagnosis.title}</span>
        </SectionTitle>
        <p className="mb-4 text-[12.5px] text-ink-subtle" aria-live="polite">
          {f(t.diagnosis.summary, { root: counts.filter((c) => c.verdict === "root").length, out: counts.filter((c) => c.verdict === "ruled-out").length })}
        </p>
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.type} aria-label={t.causeType[g.type]}>
              <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-primary">{t.causeType[g.type]}</h3>
              <ul className="space-y-3">
                {g.causes.map((c) => {
                  const cur = state.causes[c.id];
                  return (
                    <li key={c.id} data-cause={c.id} className={cn("rounded-xl border p-4", cur?.verdict === "root" ? "border-primary bg-primary-soft/40" : "border-line")}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <p className="text-[14px] font-medium leading-snug">{l(c.title)}</p>
                        <SegmentedChoice<CauseVerdict>
                          name={l(c.title)}
                          value={cur?.verdict ?? null}
                          disabled={locked}
                          onChange={(v) => set(c.id, v, v ? cur?.evidenceIds ?? [] : [])}
                          options={[
                            { value: "root", label: t.diagnosis.root },
                            { value: "ruled-out", label: t.diagnosis.ruledOut },
                            { value: "unsure", label: t.diagnosis.unsure },
                          ]}
                        />
                      </div>
                      {cur && (
                        <fieldset className="mt-3 border-t border-line pt-3">
                          <legend className="text-[12.5px] font-medium text-primary">
                            {t.diagnosis.evidence}: {cur.evidenceIds.length ? p(t.diagnosis.linked, cur.evidenceIds.length) : t.diagnosis.unlinked}
                          </legend>
                          {state.discovered.length === 0 ? (
                            <p className="mt-2 text-[12.5px] text-ink-subtle">{t.diagnosis.noEvidence}</p>
                          ) : (
                            <ul className="mt-2 grid gap-1.5 md:grid-cols-2">
                              {state.discovered.map((id) => {
                                const e = findEvidence(scenario, id);
                                if (!e) return null;
                                const checked = cur.evidenceIds.includes(id);
                                const inputId = `link-${c.id}-${id}`;
                                return (
                                  <li key={id}>
                                    <label htmlFor={inputId} className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-[12.5px]", checked ? "border-primary bg-surface" : "border-line")}>
                                      <input
                                        id={inputId}
                                        type="checkbox"
                                        checked={checked}
                                        disabled={locked}
                                        onChange={() => set(c.id, cur.verdict, checked ? cur.evidenceIds.filter((x) => x !== id) : [...cur.evidenceIds, id])}
                                        className="mt-0.5 h-4 w-4 shrink-0 accent-[rgb(var(--primary))]"
                                      />
                                      <ProvenanceTag kind={provenanceOf(e)} />
                                      <span className="leading-snug">{l(e.title)}</span>
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </fieldset>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </Card>
    </div>
  );
}
