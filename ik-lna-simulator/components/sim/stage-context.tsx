"use client";

import { ArrowRight, Check, Crosshair, FileSearch, Quote } from "lucide-react";
import { useState } from "react";
import type { ActionInput, Scenario, SimState } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge, Card, ProvenanceTag, SectionTitle } from "@/components/ui/primitives";
import { provenanceOf } from "./evidence-board";

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="mb-2 text-[12.5px] font-semibold text-ink-subtle">{title}</h3>
      <ul className="space-y-1.5 text-[13.5px] text-ink-muted">
        {items.map((x, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
            {x}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StageContext({ scenario, state, dispatch }: { scenario: Scenario; state: SimState; dispatch: (a: ActionInput) => void }) {
  const { t, l, f, p } = useI18n();
  const current = state.framings.at(-1);
  const [choice, setChoice] = useState<string | null>(null);
  const selected = choice ?? current ?? null;
  const docs = scenario.evidence.filter((e) => e.initiallyAvailable);
  const requester = scenario.stakeholders.find((s) => s.id === scenario.request.from)!;

  return (
    <div className="space-y-6">
      <Card className="border-s-4 border-s-primary">
        <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
          <Quote className="h-4 w-4 text-primary rtl:-scale-x-100" aria-hidden />
          {t.sim.request}
          <span className="ms-auto"><ProvenanceTag kind="claim" /></span>
        </div>
        <blockquote className="text-[15px] leading-relaxed">{l(scenario.request.text)}</blockquote>
        <p className="mt-2 text-[12.5px] text-ink-subtle">{f(t.briefing.requestFrom, { name: l(requester.name), title: l(requester.title) })}</p>
      </Card>

      <Card>
        <SectionTitle>{t.sim.context}</SectionTitle>
        <div className="grid gap-5 sm:grid-cols-2">
          <List title={t.sim.priorities} items={scenario.strategy.priorities.map(l)} />
          <List title={t.sim.initiatives} items={scenario.strategy.initiatives.map(l)} />
          <List title={t.sim.measures} items={scenario.strategy.successMeasures.map(l)} />
          <List title={t.sim.pressures} items={scenario.strategy.externalPressures.map(l)} />
        </div>
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="mb-2 text-[12.5px] font-semibold text-ink-subtle">{t.briefing.structure}</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {scenario.organization.structure.map((u, i) => (
              <li key={i} className="rounded-lg bg-surface-2/60 p-3 text-[13px]">
                <span className="font-medium">{l(u.name)}</span>
                {u.headcount !== undefined && <span className="num text-ink-subtle">{t.common.sep}{f("{n}", { n: u.headcount })}</span>}
                {u.note && <span className="mt-0.5 block text-[12px] text-ink-subtle">{l(u.note)}</span>}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card>
        <SectionTitle hint={t.sim.docsHint}>
          <span className="inline-flex items-center gap-2"><FileSearch className="h-4 w-4 text-primary" aria-hidden />{t.sim.docsTitle}</span>
        </SectionTitle>
        <ul className="space-y-3">
          {docs.map((d) => {
            const done = state.reviewed.includes(d.id);
            const affordable = d.reviewCostHours <= state.hoursRemaining;
            return (
              <li key={d.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{l(d.title)}</p>
                    {d.sourceLabel && <p className="text-[12px] text-ink-subtle">{f(t.sim.source, { source: l(d.sourceLabel) })}</p>}
                  </div>
                  {done ? (
                    <Badge tone="primary"><Check className="h-3 w-3" aria-hidden />{t.sim.reviewed}</Badge>
                  ) : (
                    <Button size="sm" variant="secondary" disabled={!affordable} onClick={() => dispatch({ type: "REVIEW_EVIDENCE", evidenceId: d.id })}>
                      {affordable ? f(t.sim.review, { n: d.reviewCostHours }) : t.sim.notEnoughHours}
                    </Button>
                  )}
                </div>
                {done && (
                  <div className="mt-3 flex gap-2 border-t border-line pt-3">
                    <ProvenanceTag kind={provenanceOf(d)} />
                    <p className="text-[13.5px] leading-relaxed text-ink-muted">{l(d.body)}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card>
        <SectionTitle hint={t.sim.framingHint}>
          <span className="inline-flex items-center gap-2"><Crosshair className="h-4 w-4 text-primary" aria-hidden />{t.sim.framingTitle}</span>
        </SectionTitle>
        <fieldset>
          <legend className="mb-3 text-[14px] font-medium">{l(scenario.framing.prompt)}</legend>
          <div className="space-y-2">
            {scenario.framing.options.map((o) => (
              <label
                key={o.id}
                htmlFor={`framing-${o.id}`}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-[13.5px] leading-relaxed transition-colors ${selected === o.id ? "border-primary bg-primary-soft/50" : "border-line hover:border-line-strong"}`}
              >
                <input
                  id={`framing-${o.id}`}
                  type="radio"
                  name="framing"
                  value={o.id}
                  checked={selected === o.id}
                  disabled={state.stage > 2}
                  onChange={() => setChoice(o.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[rgb(var(--primary))]"
                />
                <span>{l(o.text)}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            disabled={!selected || selected === current}
            onClick={() => selected && dispatch({ type: "FRAME_PROBLEM", optionId: selected })}
          >
            {t.sim.framingRecord}
          </Button>
          {current && (
            <p role="status" className="flex items-center gap-2 text-[12.5px] text-ink-muted">
              <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
              {t.sim.framingCurrent}
              {state.framings.length > 1 && <span className="text-ink-subtle">{t.common.sep}{p(t.sim.framingRevised, state.framings.length - 1)}</span>}
            </p>
          )}
        </div>
      </Card>

      {state.stage === 1 && (
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <Button size="lg" disabled={!current} onClick={() => dispatch({ type: "ADVANCE_STAGE", to: 2 })}>
            {t.sim.advance2}
            <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />
          </Button>
          <p className="text-[12.5px] text-ink-subtle">{current ? t.sim.advance2Hint : t.sim.framingRequired}</p>
        </div>
      )}
    </div>
  );
}
