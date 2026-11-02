"use client";

import { Eye, MessageSquare, Swords, UserRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { availableQuestions, findEvidence, findQuestion, opennessBand } from "@/engine/reducer";
import type { ActionInput, QuestionNode, Scenario, SimState } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge, Card, Meter, ProvenanceTag } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { provenanceOf } from "./evidence-board";

function QuestionButton({ q, hoursRemaining, onAsk }: { q: QuestionNode; hoursRemaining: number; onAsk: () => void }) {
  const { t, l, f } = useI18n();
  const affordable = q.costHours <= hoursRemaining;
  return (
    <li data-q={q.id} className="flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center">
      <p className="flex-1 text-[13.5px] leading-snug">{l(q.text)}</p>
      <Button size="sm" variant={q.kind === "challenge" ? "primary" : "secondary"} disabled={!affordable} onClick={onAsk} className="self-end sm:self-auto">
        {affordable ? f(t.sim.ask, { n: q.costHours }) : t.sim.notEnoughHours}
      </Button>
    </li>
  );
}

export function StageInterviews({
  scenario,
  state,
  dispatch,
  selected,
  onSelect,
}: {
  scenario: Scenario;
  state: SimState;
  dispatch: (a: ActionInput) => void;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const { t, l, f, p } = useI18n();
  const stakeholder = scenario.stakeholders.find((s) => s.id === selected) ?? null;
  const transcript = state.transcript.filter((e) => e.stakeholderId === selected);
  const questions = stakeholder ? availableQuestions(scenario, state, stakeholder.id) : [];
  const standard = questions.filter((q) => q.kind !== "challenge");
  const challenges = questions.filter((q) => q.kind === "challenge");
  const endRef = useRef<HTMLDivElement>(null);
  const count = transcript.length;
  useEffect(() => {
    if (count > 0) endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [count]);

  return (
    <div className="grid gap-6 xl:grid-cols-[17rem_1fr]">
      <nav aria-label={t.sim.roster}>
        <h2 className="mb-3 text-[14px] font-semibold">{t.sim.roster}</h2>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {scenario.stakeholders.map((s) => {
            const openness = state.openness[s.id] ?? 0;
            const asked = state.transcript.filter((e) => e.stakeholderId === s.id).length;
            const active = s.id === selected;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  data-stakeholder={s.id}
                  onClick={() => onSelect(s.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "w-full rounded-xl border p-3 text-start transition-colors",
                    active ? "border-primary bg-primary-soft/60" : "border-line bg-surface hover:border-line-strong"
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-[13.5px]">{l(s.name)}</span>
                    {asked > 0 && <span className="num text-[11px] text-ink-subtle">{p(t.sim.askedCount, asked)}</span>}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-ink-subtle">{l(s.title)}</span>
                  <span className="mt-2 flex items-center gap-2">
                    <Meter value={openness} label={`${t.openness.label}: ${l(s.name)}`} />
                    <span className="shrink-0 text-[11px] text-ink-subtle">{t.openness[opennessBand(openness)]}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {!stakeholder ? (
        <Card className="flex min-h-[18rem] flex-col items-center justify-center text-center">
          <UserRound className="mb-3 h-8 w-8 text-ink-subtle" aria-hidden />
          <p className="text-[14px] text-ink-muted">{t.sim.selectStakeholder}</p>
        </Card>
      ) : (
        <section aria-labelledby="iv-title" className="space-y-5">
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="iv-title" className="text-lg font-semibold">{f(t.sim.interviewWith, { name: l(stakeholder.name) })}</h2>
                <p className="text-[13px] text-ink-subtle">{l(stakeholder.title)}
                  {t.role[stakeholder.role] !== l(stakeholder.title) && <>{t.common.sep}{t.role[stakeholder.role]}</>}</p>
              </div>
              <Badge>
                {t.openness.label}: {t.openness[opennessBand(state.openness[stakeholder.id] ?? 0)]}
              </Badge>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ink-muted">{l(stakeholder.perspective)}</p>
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-claim-soft/60 p-2.5 text-[12.5px] text-ink-muted">
              <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-claim" aria-hidden />
              <span>
                <span className="font-semibold text-claim">{t.sim.biasLabel}: </span>
                {l(stakeholder.bias.type)}. {l(stakeholder.bias.note)}
              </span>
            </p>
          </Card>

          <div className="space-y-4" aria-live="polite">
            {transcript.length === 0 && <p className="text-[13px] text-ink-subtle">{t.sim.transcriptEmpty}</p>}
            {transcript.map((e, i) => {
              const found = findQuestion(scenario, e.stakeholderId, e.questionId);
              if (!found) return null;
              const response = found.question.responses[e.responseIndex];
              return (
                <div key={`${e.questionId}-${i}`} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-se-sm bg-primary px-4 py-2.5 text-[13.5px] text-primary-fg">
                      <span className="sr-only">{t.sim.you}: </span>
                      {l(found.question.text)}
                    </div>
                  </div>
                  <div className="flex">
                    <div className="max-w-[85%] rounded-2xl rounded-ss-sm border border-line bg-surface px-4 py-2.5 text-[13.5px] leading-relaxed shadow-card">
                      <span className="mb-1 flex items-center gap-2 text-[11.5px] font-semibold text-ink-subtle">
                        {l(found.stakeholder.name)} <ProvenanceTag kind="claim" />
                      </span>
                      {response && l(response.reply)}
                    </div>
                  </div>
                  {e.revealed.map((id) => {
                    const ev = findEvidence(scenario, id);
                    return ev ? (
                      <p key={id} role="status" className="flex items-center gap-2 ps-2 text-[12.5px] text-primary">
                        <ProvenanceTag kind={provenanceOf(ev)} />
                        {f(t.sim.newEvidence, { title: l(ev.title) })}
                      </p>
                    ) : null;
                  })}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {challenges.length > 0 && (
            <div>
              <h3 className="mb-1 flex items-center gap-2 text-[13.5px] font-semibold">
                <Swords className="h-4 w-4 text-primary" aria-hidden />
                {t.sim.challengesTitle}
              </h3>
              <p className="mb-2 text-[12px] text-ink-subtle">{t.sim.challengesHint}</p>
              <ul className="space-y-2">
                {challenges.map((q) => (
                  <QuestionButton key={q.id} q={q} hoursRemaining={state.hoursRemaining}
                    onAsk={() => dispatch({ type: "ASK", stakeholderId: stakeholder.id, questionId: q.id })} />
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="mb-2 flex items-center gap-2 text-[13.5px] font-semibold">
              <MessageSquare className="h-4 w-4 text-primary" aria-hidden />
              {t.sim.questionsTitle}
            </h3>
            {standard.length === 0 ? (
              <p className="text-[13px] text-ink-subtle">{t.sim.noQuestions}</p>
            ) : (
              <ul className="space-y-2">
                {standard.map((q) => (
                  <QuestionButton key={q.id} q={q} hoursRemaining={state.hoursRemaining}
                    onAsk={() => dispatch({ type: "ASK", stakeholderId: stakeholder.id, questionId: q.id })} />
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
