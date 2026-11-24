"use client";

import { AlertTriangle, ArrowRight, BookOpen, CheckCircle2, CircleSlash, HelpCircle, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge, Card, Meter, SectionTitle } from "@/components/ui/primitives";
import { FRAMEWORKS, LATER, hasBuilder } from "@/content/frameworks";
import type { Diagnosis } from "@/engine/diagnosis";
import { fitLevel, missingInformation, whyNot, whyRecommended, type MissingKey, type Reason } from "@/engine/explain";
import { toSlots } from "@/engine/intake";
import type { Project } from "@/engine/project";
import type { Ranked } from "@/engine/recommender";
import { APPROACH_IDS, type ApproachId } from "@/engine/types";
import { useLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

/** Intake step that answers each missing item. */
const STEP_FOR: Record<MissingKey, number> = { symptom: 3, stage: 1, domain: 2, scope: 2, goal: 3, impact: 3, stakeholders: 4, constraints: 4 };
const PRE_STEP: Record<string, number> = { symptom: 3, goal: 3, goal_or_symptom: 3, recurrence: 5, process_named_or_area: 2, process_boundaries: 5, measurable_symptom: 5, data_available: 5, options_listed: 4, stakeholders: 4, structure_focus: 5 };

function ReasonList({ reasons, kind }: { reasons: Reason[]; kind: "fit" | "caution" }) {
  const L = useLabels();
  const items = reasons.filter((r) => (kind === "fit" ? r.kind === "fit" : r.kind !== "fit"));
  if (!items.length) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((r, n) => (
        <li key={n} className="flex items-start gap-2 text-[13.5px] leading-snug text-ink">
          {kind === "fit" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />}
          {L.reason(r)}
        </li>
      ))}
    </ul>
  );
}

function RecCard({ r, rank, project, onWork, provisional }: { r: Ranked; rank: number; project: Project; onWork: (a: ApproachId) => void; provisional?: boolean }) {
  const { t, f, l, href, num } = useI18n();
  const L = useLabels();
  const slots = toSlots(project.intake);
  const reasons = whyRecommended(r.id, slots);
  const level = fitLevel(r.score);
  const fw = FRAMEWORKS[r.id];
  const chosen = project.chosen.includes(r.id);
  return (
    <Card as="article" className={cn("flex flex-col", rank === 1 && !provisional && "ring-1 ring-gold/50")}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold text-gold-text">{f(t.rec.rank, { n: rank })}</span>
        <Badge tone={level === "strong" || level === "good" ? "primary" : level === "moderate" ? "gold" : "neutral"}>{t.rec.fit[level]}</Badge>
        {LATER.includes(r.id) && <Badge>{t.rec.later}</Badge>}
      </div>
      <h3 className="font-display text-[1.3rem] leading-tight text-ink">{L.framework(r.id)}</h3>
      <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">{l(fw.purpose)}</p>
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-[12px] text-ink-subtle"><span>{t.rec.score}</span><span className="num">{num(Math.round(r.score * 100))}/100</span></div>
        <Meter value={r.score} label={t.rec.score} tone={rank === 1 ? "gold" : "primary"} />
      </div>
      <div className="mt-5 space-y-4">
        <div><p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">{t.rec.whyFits}</p><ReasonList reasons={reasons} kind="fit" /></div>
        {reasons.some((x) => x.kind !== "fit") && <div><p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">{t.rec.watchOut}</p><ReasonList reasons={reasons} kind="caution" /></div>}
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
        {!provisional && (chosen ? <Badge tone="primary"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />{t.rec.opened}</Badge> : hasBuilder(r.id) ? (
          <Button onClick={() => onWork(r.id)}>{t.rec.start}<ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Button>
        ) : <span className="text-[12.5px] text-ink-subtle">{t.library.detailOnly}</span>)}
        <Link href={href(`/library/${r.id}`)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline"><BookOpen className="h-3.5 w-3.5" aria-hidden />{t.rec.learn}</Link>
      </div>
    </Card>
  );
}

export function RecommendationsView({ project: p, diagnosis: d, onStep, onWork }: { project: Project; diagnosis: Diagnosis; onStep: (n: number) => void; onWork: (a: ApproachId) => void }) {
  const { t, f, l } = useI18n();
  const L = useLabels();
  const rec = d.recommendation;
  const slots = toSlots(p.intake);
  const top = rec.ranked.slice(0, 3);
  const shown = new Set(top.map((r) => r.id));

  if (rec.status === "out_of_scope") {
    return (
      <Card className="border-warning/30">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-1 h-6 w-6 shrink-0 text-warning" aria-hidden />
          <div>
            <h2 className="text-display-sm text-ink">{t.rec.oosTitle}</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">{t.rec.oosLead}</p>
            <Button variant="secondary" className="mt-4" onClick={() => onStep(0)}>{t.diagnosis.edit}</Button>
          </div>
        </div>
      </Card>
    );
  }

  const others = APPROACH_IDS.filter((a) => rec.status !== "ok" || !shown.has(a));
  const missing = rec.status === "insufficient_context" ? missingInformation(rec, slots) : null;

  return (
    <div className="space-y-8">
      {rec.status === "insufficient_context" && missing && (
        <Card className="border-gold/40 bg-gold-soft/40">
          <div className="flex items-start gap-3">
            <HelpCircle className="mt-1 h-6 w-6 shrink-0 text-gold-text" aria-hidden />
            <div className="flex-1">
              <h2 className="text-display-sm text-ink">{t.rec.insufficientTitle}</h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">{t.rec.insufficientLead}</p>
              <ul className="mt-4 space-y-2">
                {missing.core.map((k) => (
                  <li key={k} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface p-3 text-[14px] text-ink">
                    {t.missing[k]}<Button size="sm" variant="secondary" onClick={() => onStep(STEP_FOR[k])}>{t.rec.goToStep}</Button>
                  </li>
                ))}
                {missing.preconditions.map((m, n) => (
                  <li key={`p${n}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-surface p-3 text-[14px] text-ink">
                    {f(t.missing.preconditionFor, { framework: L.framework(m.id), need: L.reason({ kind: "caution", code: `pre.${m.slot}` }) })}
                    <Button size="sm" variant="secondary" onClick={() => onStep(PRE_STEP[m.slot] ?? 5)}>{t.rec.goToStep}</Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {rec.status === "no_good_fit" && (
        <Card className="border-gold/40">
          <div className="flex items-start gap-3">
            <CircleSlash className="mt-1 h-6 w-6 shrink-0 text-gold-text" aria-hidden />
            <div>
              <h2 className="text-display-sm text-ink">{t.rec.ngfTitle}</h2>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">{t.rec.ngfLead}</p>
            </div>
          </div>
        </Card>
      )}

      {rec.status === "ok" && rec.probableNGF && <p className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-soft p-3 text-[13.5px] text-warning"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />{t.rec.probableNgf}</p>}

      <section>
        <SectionTitle hint={rec.status === "ok" ? t.rec.lead : undefined}>
          {rec.status === "ok" ? t.rec.title : rec.status === "no_good_fit" ? t.rec.closest : t.rec.provisional}
        </SectionTitle>
        <div className="grid gap-5 lg:grid-cols-3">
          {(rec.status === "no_good_fit" ? rec.ranked.slice(0, 2) : top).map((r, n) => (
            <RecCard key={r.id} r={r} rank={n + 1} project={p} onWork={onWork} provisional={rec.status !== "ok"} />
          ))}
        </div>
      </section>

      {rec.status === "ok" && (
        <section aria-labelledby="whynot">
          <SectionTitle hint={t.rec.whyNotLead}><span id="whynot">{t.rec.whyNotTitle}</span></SectionTitle>
          <div className="card divide-y divide-line">
            {others.map((a) => (
              <div key={a} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-start sm:gap-6">
                <p className="w-56 shrink-0 text-[14px] font-semibold text-ink">{l(FRAMEWORKS[a].name)}{LATER.includes(a) && <Badge className="ms-2">{t.rec.later}</Badge>}</p>
                <p className="text-[13.5px] leading-snug text-ink-muted">{whyNot(a, slots, rec).map((r) => L.reason(r)).join(" ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
