"use client";

import { FileText, Lightbulb, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { findEvidence } from "@/engine/reducer";
import { CAUSE_TYPES, type ActionInput, type CauseType, type Evidence, type Scenario, type SimState } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { ProvenanceTag, type Provenance } from "@/components/ui/primitives";

export const provenanceOf = (e: Evidence): Provenance => (e.kind === "claim" ? "claim" : "fact");

export function EvidenceItem({ scenario, evidence }: { scenario: Scenario; evidence: Evidence }) {
  const { t, l, f } = useI18n();
  const source = evidence.sourceStakeholderId
    ? f(t.sim.discoveredFrom, { name: l(scenario.stakeholders.find((s) => s.id === evidence.sourceStakeholderId)!.name) })
    : evidence.sourceLabel
      ? f(t.sim.source, { source: l(evidence.sourceLabel) })
      : null;
  return (
    <details className="group rounded-xl border border-line bg-surface p-3 open:bg-surface-2/40">
      <summary className="flex cursor-pointer list-none items-start gap-2">
        <ProvenanceTag kind={provenanceOf(evidence)} />
        <span className="flex-1 text-[13.5px] font-medium leading-snug">{l(evidence.title)}</span>
      </summary>
      <div className="mt-2 space-y-1.5 ps-1">
        <p className="text-[13px] leading-relaxed text-ink-muted">{l(evidence.body)}</p>
        <p className="text-[11.5px] text-ink-subtle">
          {t.evidenceKind[evidence.kind]}
          {source && <>{t.common.sep}{source}</>}
        </p>
      </div>
    </details>
  );
}

const newId = () => `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function EvidenceBoard({ scenario, state, dispatch }: { scenario: Scenario; state: SimState; dispatch: (a: ActionInput) => void }) {
  const { t, num } = useI18n();
  const [text, setText] = useState("");
  const [causeType, setCauseType] = useState<CauseType>("process");

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch({ type: "LOG_HYPOTHESIS", hypothesisId: newId(), text, causeType });
    setText("");
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="ev-title">
        <h2 id="ev-title" className="mb-3 flex items-center gap-2 text-[14px] font-semibold">
          <FileText className="h-4 w-4 text-primary" aria-hidden />
          {t.sim.evidenceBoard}
          <span className="num ms-auto text-[12px] font-normal text-ink-subtle">{num(state.discovered.length)}</span>
        </h2>
        {state.discovered.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line-strong p-4 text-[13px] text-ink-subtle">{t.sim.evidenceEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {[...state.discovered].reverse().map((id) => {
              const ev = findEvidence(scenario, id);
              return ev ? (
                <li key={id}>
                  <EvidenceItem scenario={scenario} evidence={ev} />
                </li>
              ) : null;
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="hyp-title">
        <h2 id="hyp-title" className="mb-1 flex items-center gap-2 text-[14px] font-semibold">
          <Lightbulb className="h-4 w-4 text-assumption" aria-hidden />
          {t.sim.hypotheses}
        </h2>
        <p className="mb-3 text-[12.5px] text-ink-subtle">{t.sim.hypothesesHint}</p>
        <form onSubmit={add} className="space-y-2 rounded-xl border border-line bg-surface p-3">
          <label htmlFor="hyp-text" className="sr-only">{t.sim.hypotheses}</label>
          <textarea
            id="hyp-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={280}
            rows={2}
            placeholder={t.sim.hypothesisPlaceholder}
            className="w-full resize-none rounded-lg border border-line-strong bg-surface px-3 py-2 text-[13.5px] text-ink placeholder:text-ink-subtle"
          />
          <div className="flex items-end gap-2">
            <label className="flex flex-1 flex-col text-[11.5px] text-ink-subtle">
              {t.sim.hypothesisType}
              <select
                value={causeType}
                onChange={(e) => setCauseType(e.target.value as CauseType)}
                className="mt-1 h-9 rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink"
              >
                {CAUSE_TYPES.map((c) => (
                  <option key={c} value={c}>{t.causeType[c]}</option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm" disabled={!text.trim()} className="h-9">
              <Plus className="h-4 w-4" aria-hidden />
              {t.sim.hypothesisAdd}
            </Button>
          </div>
        </form>
        {state.hypotheses.length === 0 ? (
          <p className="mt-3 text-[12.5px] text-ink-subtle">{t.sim.hypothesesEmpty}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {state.hypotheses.map((h) => (
              <li key={h.id} className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3">
                <ProvenanceTag kind="assumption" />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-[13.5px]" dir="auto">{h.text}</p>
                  <p className="mt-0.5 text-[11.5px] text-ink-subtle">{t.causeType[h.causeType]}</p>
                </div>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_HYPOTHESIS", hypothesisId: h.id })}
                  aria-label={t.sim.hypothesisRemove}
                  className="rounded-md p-1 text-ink-subtle hover:bg-danger-soft hover:text-danger"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
