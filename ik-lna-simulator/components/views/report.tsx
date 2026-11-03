"use client";

import { ArrowLeft, Download, FileText, Printer, RotateCcw, SearchX } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { getScenario } from "@/content/scenarios";
import { derive, findEvidence, findQuestion, opennessBand } from "@/engine/reducer";
import { score, type ScoreResult } from "@/engine/scoring";
import { DIMENSIONS, type Scenario, type SimState } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { provenanceOf } from "@/components/sim/evidence-board";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState, Meter, ProvenanceTag } from "@/components/ui/primitives";
import { reportCsv } from "@/lib/report-csv";
import { cn } from "@/lib/utils";
import { useHydrated, useSimStore } from "@/store/sim-store";

/** Sandboxed preview hosts block printing and page-initiated downloads. */
const CAN_EXPORT = process.env.NEXT_PUBLIC_PREVIEW !== "1";

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  const { num } = useI18n();
  return (
    <section className="report-section break-inside-avoid-page border-t border-line pt-6" aria-labelledby={`sec-${n}`}>
      <h2 id={`sec-${n}`} className="mb-4 flex items-baseline gap-3 text-[18px] font-semibold">
        <span className="num text-[13px] text-primary">{num(n)}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Owner({ who }: { who: "yours" | "expert" }) {
  return <ProvenanceTag kind={who === "yours" ? "assumption" : "system"} />;
}

export function coverageOf(sc: Scenario, st: SimState): number {
  return Math.round(
    100 *
      sc.rootCauses
        .filter((c) => c.isTrue)
        .filter((c) => sc.interventions.some((i) => st.interventions[i.id] && (i.fit === "essential" || i.fit === "supportive") && i.addresses.includes(c.id)))
        .reduce((n, c) => n + c.weight, 0)
  );
}

export function ReportView() {
  const { t, l, f, p, num, date, href, locale } = useI18n();
  const router = useRouter();
  const hydrated = useHydrated();
  const attemptId = useSearchParams().get("attempt") ?? "";
  const attempt = useSimStore((s) => s.attempts[attemptId]);
  const startAttempt = useSimStore((s) => s.startAttempt);
  const sc = attempt ? getScenario(attempt.scenarioId) : undefined;
  const st = useMemo(() => (sc && attempt ? derive(sc, attempt.actions) : null), [sc, attempt]);
  const r: ScoreResult | null = useMemo(() => (sc && st?.completed ? score(sc, st) : null), [sc, st]);

  if (!hydrated) return <p className="text-ink-subtle">{t.common.loading}</p>;
  if (!attempt || !sc || !st) {
    return <EmptyState icon={SearchX} title={t.sim.notFoundTitle} body={t.sim.notFoundBody} action={<Button href={href("/simulations")}>{t.nav.simulations}</Button>} />;
  }
  if (!r) {
    return <EmptyState icon={FileText} body={t.report.notCompleted} action={<Button href={href(`/simulate?attempt=${attempt.id}`)}>{t.report.back}</Button>} />;
  }

  const ins = r.insights;
  const finalFraming = sc.framing.options.find((o) => o.id === st.framings.at(-1));
  const firstFraming = sc.framing.options.find((o) => o.id === st.framings[0]);
  const expertFraming = sc.framing.options.find((o) => o.kind === "performance-gap")!;
  const trueCauses = sc.rootCauses.filter((c) => c.isTrue);
  const coverage = coverageOf(sc, st);
  const chosenIv = sc.interventions.filter((i) => st.interventions[i.id]);
  const chosenKpi = sc.kpis.filter((k) => st.kpis[k.id]);
  const stakeholder = (id: string) => sc.stakeholders.find((s) => s.id === id)!;
  const cause = (id: string) => sc.rootCauses.find((c) => c.id === id)!;
  const next = sc.debrief.nextScenarios.map(getScenario).find(Boolean);

  const downloadCsv = () => {
    const url = URL.createObjectURL(new Blob([reportCsv(sc, st, r, locale)], { type: "text/csv;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `ik-lna-report-${sc.id}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  };
  const replay = () => router.push(href(`/simulate?attempt=${startAttempt(sc)}`));

  return (
    <article className="report space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow mb-2">{t.report.eyebrow}</p>
          <h1 className="text-display-md font-semibold">{l(sc.title)}</h1>
          <p className="mt-1 text-[13px] text-ink-subtle">
            {l(sc.organization.name)}{t.common.sep}{f(t.report.generated, { date: date(st.completedAt ?? attempt.updatedAt) })}
          </p>
        </div>
        <div className="no-print flex flex-wrap gap-2">
          <Button variant="secondary" href={href(`/simulate?attempt=${attempt.id}`)}><ArrowLeft className="h-4 w-4 rtl:-scale-x-100" aria-hidden />{t.report.back}</Button>
          {CAN_EXPORT && <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden />{t.report.print}</Button>}
          {CAN_EXPORT && <Button variant="secondary" onClick={downloadCsv}><Download className="h-4 w-4" aria-hidden />{t.report.csv}</Button>}
          <Button onClick={replay}><RotateCcw className="h-4 w-4" aria-hidden />{t.report.replay}</Button>
        </div>
      </header>

      <Section n={1} title={t.report.sections.summary}>
        <div className="grid gap-6 md:grid-cols-[14rem_1fr]">
          <div className="rounded-2xl bg-navy p-5 text-navy-fg">
            <p className="text-[12px] text-navy-fg/70">{t.report.overall}</p>
            <p className="num text-5xl font-semibold" data-testid="overall-score" data-score={r.overall}>{num(r.overall)}</p>
            <p className="mt-1 font-medium">{t.report.band[r.band]}</p>
          </div>
          <p className="text-[14.5px] leading-relaxed">
            {f(t.report.summaryText, {
              framing: finalFraming ? l(finalFraming.text) : "–",
              found: trueCauses.length - ins.trueCausesMissed.length,
              total: trueCauses.length,
              distractors: ins.distractorsAccepted.length,
              ivs: chosenIv.length,
              coverage,
              kpis: chosenKpi.length,
            })}
          </p>
        </div>
      </Section>

      <Section n={2} title={t.report.sections.context}>
        <dl className="mb-3 grid gap-3 text-[13.5px] sm:grid-cols-3">
          <div><dt className="text-ink-subtle">{t.briefing.organization}</dt><dd className="font-medium">{l(sc.organization.name)}</dd></div>
          <div><dt className="text-ink-subtle">{t.briefing.sector}</dt><dd className="font-medium">{l(sc.organization.sector)}</dd></div>
          <div><dt className="text-ink-subtle">{t.briefing.size}</dt><dd className="font-medium">{l(sc.organization.size)}</dd></div>
        </dl>
        <p className="text-[14px] leading-relaxed text-ink-muted">{l(sc.organization.background)}</p>
      </Section>

      <Section n={3} title={t.report.sections.challenge}>
        <p className="mb-1 text-[12px] font-semibold text-ink-subtle">{t.report.request}</p>
        <blockquote className="mb-4 border-s-4 border-primary ps-4 text-[14px] leading-relaxed">{l(sc.request.text)}</blockquote>
        <ul className="mb-4 list-disc space-y-1 ps-5 text-[13.5px] text-ink-muted">
          {sc.strategy.priorities.map((x, i) => <li key={i}>{l(x)}</li>)}
        </ul>
      </Section>

      <Section n={4} title={t.report.sections.stakeholders}>
        <ul className="grid gap-3 md:grid-cols-2">
          {sc.stakeholders.map((s) => {
            const entries = st.transcript.filter((e) => e.stakeholderId === s.id);
            const revealed = entries.flatMap((e) => e.revealed);
            return (
              <li key={s.id} className="rounded-xl border border-line p-4">
                <p className="font-medium">{l(s.name)} <span className="text-[12.5px] font-normal text-ink-subtle">{t.common.sep}{l(s.title)}</span></p>
                <p className="mt-1 text-[12.5px] text-ink-muted">
                  {entries.length ? p(t.report.interviewed, entries.length) : t.report.notInterviewed}
                  {entries.length > 0 && <>{t.common.sep}{t.report.finalOpenness}: {t.openness[opennessBand(st.openness[s.id] ?? 0)]}</>}
                </p>
                <p className="mt-2 text-[12px] font-semibold text-ink-subtle">{t.report.revealed}</p>
                {revealed.length ? (
                  <ul className="mt-1 space-y-1 text-[13px]">{revealed.map((id) => <li key={id}>• {l(findEvidence(sc, id)!.title)}</li>)}</ul>
                ) : (
                  <p className="text-[13px] text-ink-subtle">{t.report.nothingRevealed}</p>
                )}
                <p className="mt-2 text-[12px] text-ink-subtle"><span className="font-semibold text-claim">{t.sim.biasLabel}:</span> {l(s.bias.type)}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section n={5} title={t.report.sections.evidence}>
        <ul className="grid gap-2 md:grid-cols-2">
          {st.discovered.map((id) => {
            const e = findEvidence(sc, id)!;
            return (
              <li key={id} className="flex gap-2 rounded-lg border border-line p-3 text-[13px]">
                <ProvenanceTag kind={provenanceOf(e)} />
                <span><span className="font-medium">{l(e.title)}</span><span className="mt-0.5 block text-ink-muted">{l(e.body)}</span></span>
              </li>
            );
          })}
        </ul>
        {ins.missedEvidence.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-[12.5px] font-semibold text-ink-subtle">{t.report.missedEvidence}</p>
            <ul className="space-y-1 text-[13px] text-ink-muted">{ins.missedEvidence.map((id) => <li key={id}>• {l(findEvidence(sc, id)!.title)}</li>)}</ul>
          </div>
        )}
      </Section>

      <Section n={6} title={t.report.sections.causes}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-start text-[13px]">
            <thead className="text-[12px] text-ink-subtle">
              <tr className="border-b border-line">
                <th className="py-2 pe-3 text-start font-medium">{t.report.sections.causes}</th>
                <th className="py-2 pe-3 text-start font-medium"><Owner who="yours" /> {t.report.verdict}</th>
                <th className="py-2 pe-3 text-start font-medium">{t.report.linkedEvidence}</th>
                <th className="py-2 text-start font-medium"><Owner who="expert" /> {t.report.expert}</th>
              </tr>
            </thead>
            <tbody>
              {sc.rootCauses.map((c) => {
                const a = st.causes[c.id];
                const v = a?.verdict;
                const label = v === "root" ? t.diagnosis.root : v === "ruled-out" ? t.diagnosis.ruledOut : v === "unsure" ? t.diagnosis.unsure : t.report.notJudged;
                const right = c.isTrue ? v === "root" : v === "ruled-out";
                return (
                  <tr key={c.id} className="border-b border-line align-top">
                    <td className="py-2 pe-3 font-medium">{l(c.title)}<span className="block text-[12px] font-normal text-ink-subtle">{t.causeType[c.type]}</span></td>
                    <td className={cn("py-2 pe-3", right ? "text-primary" : "text-danger")}>{label}</td>
                    <td className="py-2 pe-3 text-ink-muted">{a?.evidenceIds.length ? a.evidenceIds.map((id) => l(findEvidence(sc, id)!.title)).join(locale === "ar" ? "؛ " : "; ") : "–"}</td>
                    <td className="py-2 text-ink-muted">
                      <span className="font-medium text-ink">{c.isTrue ? `${t.report.trueCause} (${t.report.weight} ${num(c.weight, { style: "percent" })})` : t.report.distractor}</span>
                      <span className="mt-0.5 block">{l(c.explanation)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section n={7} title={t.report.sections.gap}>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <p className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-ink-subtle"><Owner who="yours" />{t.report.yourFraming}</p>
            <p className="text-[13.5px]">{finalFraming ? l(finalFraming.text) : "–"}</p>
            {firstFraming && firstFraming.id !== finalFraming?.id && (
              <p className="mt-2 text-[12.5px] text-ink-subtle">{t.report.firstFraming}: {l(firstFraming.text)}</p>
            )}
            {finalFraming && <p className="mt-2 text-[12.5px] text-ink-muted">{l(finalFraming.explanation)}</p>}
          </div>
          <div className="rounded-xl border border-line bg-surface-2 p-4">
            <p className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-ink-subtle"><Owner who="expert" />{t.report.expertFraming}</p>
            <p className="text-[13.5px]">{l(expertFraming.text)}</p>
          </div>
        </div>
      </Section>

      <Section n={8} title={t.report.sections.capability}>
        <ul className="space-y-2">
          {sc.capabilityGaps.map((g) => {
            const a = st.gaps[g.id];
            const ok = a && (a.verdict === "gap") === g.isGap && (!g.isGap || a.nature === g.nature);
            return (
              <li key={g.id} className="rounded-xl border border-line p-4 text-[13px]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{l(g.title)}</p>
                  <Badge tone={ok ? "primary" : "danger"}>{ok ? t.report.correct : t.report.incorrect}</Badge>
                </div>
                <p className="mt-1 text-ink-muted">
                  {t.report.assessment}: {a ? (a.verdict === "gap" ? `${t.capability.isGap} (${t.causeType[a.nature]})` : t.capability.notGap) : t.report.notJudged}
                  {t.common.sep}{t.report.expert}: {g.isGap ? `${t.capability.isGap} (${t.causeType[g.nature]})` : t.capability.notGap}
                </p>
                <p className="mt-1 text-ink-subtle">{l(g.rationale)}</p>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section n={9} title={t.report.sections.interventions}>
        {chosenIv.length === 0 ? <p className="text-[13px] text-ink-subtle">{t.report.noneSelected}</p> : (
          <ul className="space-y-2">
            {chosenIv.map((i) => (
              <li key={i.id} className="rounded-xl border border-line p-4 text-[13px]">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="primary">{t.interventionType[i.type]}</Badge>
                  <Badge tone={i.fit === "harmful" ? "danger" : i.fit === "neutral" ? "warning" : "primary"}>{t.report.fit[i.fit]}</Badge>
                  <p className="font-medium">{l(i.title)}</p>
                </div>
                <p className="mt-1 text-ink-muted">{t.report.treats}: {st.interventions[i.id]!.causeIds.map((c) => l(cause(c).title)).join(t.common.sep) || "–"}</p>
                <p className="mt-1 text-ink-subtle">{l(i.rationale)}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section n={10} title={t.report.sections.roadmap}>
        <ol className="grid gap-3 md:grid-cols-3">
          {([1, 2, 3] as const).map((ph) => (
            <li key={ph} className="rounded-xl border border-line p-4">
              <p className="mb-2 text-[12.5px] font-semibold text-primary">{t.solution.phase[ph]}</p>
              <ul className="space-y-1 text-[13px]">
                {chosenIv.filter((i) => i.phase === ph).map((i) => <li key={i.id}>• {l(i.title)}</li>)}
                {chosenIv.every((i) => i.phase !== ph) && <li className="text-ink-subtle">–</li>}
              </ul>
            </li>
          ))}
        </ol>
      </Section>

      <Section n={11} title={t.report.sections.kpis}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-[13px]">
            <thead className="text-[12px] text-ink-subtle">
              <tr className="border-b border-line">
                {[t.report.sections.kpis, t.measures.level, t.measures.owner, t.measures.review, t.measures.baseline, t.measures.target, t.report.expert].map((h) => (
                  <th key={h} className="py-2 pe-3 text-start font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {chosenKpi.map((k) => {
                const a = st.kpis[k.id]!;
                const issues = ins.kpiIssues.filter((x) => x.kpiId === k.id);
                return (
                  <tr key={k.id} className="border-b border-line align-top">
                    <td className="py-2 pe-3 font-medium">{l(k.title)}</td>
                    <td className="py-2 pe-3">{t.kpiLevel[a.level]}</td>
                    <td className="py-2 pe-3">{l(stakeholder(a.ownerId).name)}</td>
                    <td className="py-2 pe-3 num">{f(t.measures.days, { n: a.reviewDays })}</td>
                    <td className="py-2 pe-3 text-ink-muted">{l(k.baseline)}</td>
                    <td className="py-2 pe-3 text-ink-muted">{l(k.target)}</td>
                    <td className="py-2 text-ink-muted">{issues.length ? issues.map((x) => t.report.issues[x.issue]).join(t.common.sep) : t.report.correct}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section n={12} title={t.report.sections.impact}>
        <p className="mb-2 text-[14px]">{f(t.report.impactText, { coverage })}</p>
        <Meter value={coverage} label={t.report.sections.impact} className="mb-4 max-w-md" />
        <p className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-ink-subtle"><Owner who="expert" />{t.report.impactExpert}</p>
        <p className="text-[13.5px] leading-relaxed text-ink-muted">{l(sc.debrief.recommendedApproach)}</p>
      </Section>

      <Section n={13} title={t.report.sections.assessment}>
        <div className="grid gap-3 md:grid-cols-2">
          {DIMENSIONS.map((d) => {
            const res = r.dimensions[d];
            return (
              <details key={d} className="rounded-xl border border-line p-4 [&[open]]:bg-surface-2/50">
                <summary className="cursor-pointer list-none">
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-medium">{t.dimension[d]}</span>
                    <span className="num text-lg font-semibold text-primary">{num(res.score)}</span>
                  </span>
                  <Meter value={res.score} label={t.dimension[d]} className="mt-2" />
                  {res.cap && <span className="mt-2 block text-[12px] text-danger">{f(t.report.cappedAt, { n: res.cap.value })}: {l(res.cap.reason)}</span>}
                </summary>
                <p className="mb-1 mt-3 text-[12px] font-semibold text-ink-subtle">{t.report.criteria}</p>
                <ul className="space-y-1.5 text-[12.5px]">
                  {res.criteria.map((c) => (
                    <li key={c.id} className="flex justify-between gap-3">
                      <span>{l(c.label)}{c.detail && <span className="block text-ink-subtle">{l(c.detail)}</span>}</span>
                      <span className="num shrink-0 font-medium">{num(c.earned)} / {num(c.max)}</span>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-[14px] font-semibold">{t.report.strengths}</h3>
            <ul className="space-y-1 text-[13px]">{ins.strengths.map((d) => <li key={d}>• {t.dimension[d]} ({num(r.dimensions[d].score)})</li>)}</ul>
            <h3 className="mb-2 mt-4 text-[14px] font-semibold">{t.report.focus}</h3>
            <ul className="space-y-1 text-[13px]">{ins.focus.map((d) => <li key={d}>• {t.dimension[d]} ({num(r.dimensions[d].score)}): {t.dimensionCriteria[d]}</li>)}</ul>
          </div>
          <div>
            <h3 className="mb-2 text-[14px] font-semibold">{t.report.assumptions}</h3>
            <ul className="space-y-1.5 text-[13px] text-ink-muted">
              {finalFraming && finalFraming.kind !== "performance-gap" && <li>• {t.report.yourFraming}: {l(finalFraming.explanation)}</li>}
              {ins.distractorsAccepted.map((id) => <li key={id}>• {t.report.distractorAccepted}: {l(cause(id).title)}. {l(cause(id).explanation)}</li>)}
              {ins.trueCausesMissed.map((id) => <li key={id}>• {t.report.trueMissed}: {l(cause(id).title)}</li>)}
              {ins.unsupportedCauses.map((id) => <li key={id}>• {t.report.unsupported}: {l(cause(id).title)}</li>)}
              {st.hypotheses.filter((h) => ins.hypothesisMisses.includes(h.id)).map((h) => <li key={h.id} dir="auto">• {t.report.hypothesisMiss}: {h.text}</li>)}
              {ins.prematureTraining && <li className="text-danger">• {t.report.premature}</li>}
              {ins.harmfulInterventions.map((id) => {
                const i = sc.interventions.find((x) => x.id === id)!;
                return <li key={id} className="text-danger">• {t.report.harmful}: {l(i.title)}. {l(i.rationale)}</li>;
              })}
            </ul>
            {!ins.distractorsAccepted.length && !ins.trueCausesMissed.length && !ins.harmfulInterventions.length && finalFraming?.kind === "performance-gap" && (
              <p className="text-[13px] text-ink-subtle">{t.report.nothing}</p>
            )}
          </div>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-[14px] font-semibold">{t.report.missedQuestions}</h3>
          {ins.missedQuestions.length === 0 ? <p className="text-[13px] text-ink-subtle">{t.report.nothing}</p> : (
            <ul className="space-y-2">
              {ins.missedQuestions.map(({ stakeholderId, questionId }) => {
                const fq = findQuestion(sc, stakeholderId, questionId)!;
                return (
                  <li key={questionId} className="rounded-lg border border-line p-3 text-[13px]">
                    <p className="font-medium">“{l(fq.question.text)}” <span className="font-normal text-ink-subtle">{t.common.sep}{l(fq.stakeholder.name)}</span></p>
                    <p className="mt-1 text-ink-muted">{l(fq.question.whyItMatters)}</p>
                  </li>
                );
              })}
            </ul>
          )}
          {ins.lowQualityQuestions.length > 0 && (
            <>
              <h3 className="mb-2 mt-4 text-[14px] font-semibold">{t.report.lowQuality}</h3>
              <ul className="space-y-2">
                {ins.lowQualityQuestions.map(({ stakeholderId, questionId }) => {
                  const fq = findQuestion(sc, stakeholderId, questionId)!;
                  return (
                    <li key={questionId} className="rounded-lg border border-danger/30 p-3 text-[13px]">
                      <p className="font-medium">“{l(fq.question.text)}”</p>
                      <p className="mt-1 text-ink-muted">{l(fq.question.whyItMatters)}</p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-line bg-surface-2 p-4">
          <p className="mb-1 flex items-center gap-2 text-[12px] font-semibold text-ink-subtle"><Owner who="expert" />{t.report.expert}</p>
          <p className="text-[13.5px] leading-relaxed">{l(sc.debrief.expertSummary)}</p>
          <p className="mt-3 text-[12.5px] text-ink-muted">
            {t.report.methodology}: {sc.debrief.methodology.map((m) => t.methodology.tools[m as keyof typeof t.methodology.tools].name).join(t.common.sep)}
          </p>
          {next && (
            <p className="no-print mt-3 text-[13px]">
              {t.report.next}: <Link className="font-medium text-primary underline" href={href(`/scenarios/${next.id}`)}>{l(next.title)}</Link>
            </p>
          )}
        </div>
      </Section>
    </article>
  );
}
