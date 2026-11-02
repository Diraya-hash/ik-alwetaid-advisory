"use client";

import { ArrowRight, CheckCircle2, FileText, Send } from "lucide-react";
import { check } from "@/engine/reducer";
import type { ActionInput, Scenario, SimState, StageId } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";

const GATES = ["framing-required", "diagnosis-required", "assessment-required", "solution-required", "measures-required"] as const;

/** Advance / submit controls. Whether the next step is allowed comes from the engine's own gate check. */
export function StageFooter({
  scenario,
  state,
  attemptId,
  dispatch,
}: {
  scenario: Scenario;
  state: SimState;
  attemptId: string;
  dispatch: (a: ActionInput) => void;
}) {
  const { t, href } = useI18n();
  if (state.completed) {
    return (
      <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary-soft/60 p-5 sm:flex-row sm:items-center">
        <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" aria-hidden />
        <div className="flex-1">
          <p className="font-semibold">{t.stages.submitted}</p>
          <p className="text-[13px] text-ink-muted">{t.stages.submittedBody}</p>
        </div>
        <Button href={href(`/report?attempt=${attemptId}`)}>
          <FileText className="h-4 w-4" aria-hidden />
          {t.stages.viewReport}
        </Button>
      </div>
    );
  }
  const isLast = state.stage === 6;
  const action = isLast ? ({ type: "COMPLETE", at: 0 } as const) : ({ type: "ADVANCE_STAGE", to: (state.stage + 1) as StageId, at: 0 } as const);
  const rejection = check(scenario, state, action);
  const gate = GATES.find((g) => g === rejection);
  return (
    <div className="flex flex-col items-start gap-2 border-t border-line pt-5 sm:flex-row sm:items-center">
      <Button size="lg" disabled={!!rejection} onClick={() => dispatch(isLast ? { type: "COMPLETE" } : { type: "ADVANCE_STAGE", to: (state.stage + 1) as StageId })}>
        {isLast ? <Send className="h-4 w-4 rtl:-scale-x-100" aria-hidden /> : null}
        {isLast ? t.stages.complete : t.stages.advance[(state.stage + 1) as 2 | 3 | 4 | 5 | 6]}
        {!isLast && <ArrowRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />}
      </Button>
      <p className="text-[12.5px] text-ink-subtle">{gate ? t.stages.gate[gate] : isLast ? t.stages.completeHint : state.stage >= 2 ? t.stages.backToInterviews : t.sim.advance2Hint}</p>
    </div>
  );
}
