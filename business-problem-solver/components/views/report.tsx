"use client";

import { Download, FileJson, Printer, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { FishboneDiagram, useCategoryName } from "@/components/frameworks/fishbone";
import { MatrixChart } from "@/components/frameworks/matrix";
import { Timeline, planCsv, useLinkLabel } from "@/components/frameworks/plan";
import { Button } from "@/components/ui/button";
import { Badge, TruthTag } from "@/components/ui/primitives";
import { FRAMEWORKS } from "@/content/frameworks";
import { assumptionsRegister, findings, read, started, type BuilderKey } from "@/engine/builders";
import type { Finding } from "@/engine/builders/common";
import { prioritise, quadrant } from "@/engine/builders/matrix";
import { QUADRANTS } from "@/engine/builders/swot";
import { childrenOf, rootStrength, type FiveWhys } from "@/engine/builders/whys";
import type { Diagnosis } from "@/engine/diagnosis";
import { fitLevel, whyNot, whyRecommended } from "@/engine/explain";
import { toSlots, type StatementRole } from "@/engine/intake";
import type { Project } from "@/engine/project";
import { APPROACH_IDS } from "@/engine/types";
import { useLabels } from "@/lib/labels";
import { downloadFile, useWorkspace } from "@/store/workspace";
import { fileSlug } from "./projects";
import { useReframe } from "./diagnosis";

const CRITIC: Record<BuilderKey, "swot" | "whys" | "fishbone" | "matrix" | "plan"> = { fw_swot: "swot", fw_five_whys: "whys", fw_cause_effect: "fishbone", fw_impact_effort: "matrix", fw_action_plan: "plan" };
const ROLES: StatementRole[] = ["symptom", "cause", "goal", "impact", "constraint", "context"];

function Section({ n, title, children, breakBefore }: { n: number; title: string; children: React.ReactNode; breakBefore?: boolean }) {
  const { num } = useI18n();
  return (
    <section className={`avoid-break border-t border-line pt-8 ${breakBefore ? "print-break" : ""}`}>
      <h2 className="mb-5 flex items-baseline gap-3 text-display-sm text-ink"><span className="num font-sans text-[14px] font-semibold text-gold-text">{num(n).padStart(2, "0")}</span>{title}</h2>
      {children}
    </section>
  );
}

function WhyTree({ d, parent }: { d: FiveWhys; parent: string | null }) {
  const { t } = useI18n();
  const kids = childrenOf(d, parent).filter((n) => n.text.trim());
  if (!kids.length) return null;
  return (
    <ul className={parent ? "ms-4 mt-1.5 space-y-1.5 border-s border-line ps-4" : "space-y-1.5"}>
      {kids.map((n) => {
        const s = n.isRoot ? rootStrength(d, n.id).strength : null;
        return (
          <li key={n.id} className="text-[13.5px] text-ink">
            <span className="inline-flex flex-wrap items-center gap-2">{n.text}<TruthTag truth={n.truth} />
              {s && <Badge tone={s === "supported" ? "primary" : "warning"}>{s === "supported" ? <ShieldCheck className="h-3 w-3" aria-hidden /> : <ShieldQuestion className="h-3 w-3" aria-hidden />}{t.whys.strength[s]}</Badge>}
            </span>
            {n.isRoot && n.countermeasure && <span className="block text-[12.5px] text-ink-muted">→ {t.whys.countermeasure}: {n.countermeasure}</span>}
            <WhyTree d={d} parent={n.id} />
          </li>
        );
      })}
    </ul>
  );
}

export function ReportView({ project: p, diagnosis: d }: { project: Project; diagnosis: Diagnosis }) {
  const { t, f, l, date } = useI18n();
  const L = useLabels();
  const reframe = useReframe(p);
  const linkLabel = useLinkLabel();
  const catName = useCategoryName();
  const exportProject = useWorkspace((s) => s.exportProject);
  const rec = d.recommendation;
  const slots = toSlots(p.intake);
  const top = rec.status === "ok" ? rec.ranked.slice(0, 3) : [];
  const analysis = p.chosen.filter((a): a is BuilderKey => a !== "fw_action_plan" && (["fw_swot", "fw_five_whys", "fw_cause_effect", "fw_impact_effort"] as string[]).includes(a) && started(p, a as BuilderKey));
  const plan = started(p, "fw_action_plan") ? read(p, "fw_action_plan") : null;
  const register = assumptionsRegister(p);
  const review = (["fw_swot", "fw_five_whys", "fw_cause_effect", "fw_impact_effort", "fw_action_plan"] as BuilderKey[]).filter((k) => started(p, k))
    .flatMap((k) => findings(p, k).filter((x) => x.severity !== "low").map((x) => ({ k, x })));
  const render = (k: BuilderKey, x: Finding) => {
    const tpl = (t.critic[CRITIC[k]] as Record<string, string>)[x.code] ?? x.code;
    return f(tpl, { ...x.params, ...(x.params?.q ? { q: t.swot.quadrants[x.params.q as "s"] } : {}) });
  };
  const roots = started(p, "fw_five_whys") ? read(p, "fw_five_whys").nodes.filter((n) => n.isRoot && n.text.trim()) : [];
  const likely = started(p, "fw_cause_effect") ? read(p, "fw_cause_effect").causes.filter((c) => c.likely && c.text.trim()) : [];
  let n = 0;

  return (
    <div className="report">
      <div className="mb-6 flex flex-wrap gap-2 no-print">
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden />{t.report.print}</Button>
        <Button variant="secondary" onClick={() => { const x = exportProject(p.id); if (x) downloadFile(`${fileSlug(p.title)}.bps.json`, JSON.stringify(x, null, 1)); }}><FileJson className="h-4 w-4" aria-hidden />{t.report.json}</Button>
        {plan && <Button variant="secondary" onClick={() => downloadFile(`${fileSlug(p.title)}-action-plan.csv`, planCsv(plan, t, linkLabel), "text/csv")}><Download className="h-4 w-4" aria-hidden />{t.report.csv}</Button>}
      </div>

      <article className="card space-y-10 p-6 print:border-0 print:p-0 print:shadow-none lg:p-10">
        <header className="avoid-break">
          <p className="eyebrow mb-3">{t.report.title}</p>
          <h1 className="text-display-md text-ink">{p.title || t.common.untitled}</h1>
          <div className="rule-gold my-5 max-w-xs" />
          <p className="text-[13px] text-ink-subtle">{t.report.prepared} · {date(Date.now())}</p>
          <p className="mt-2 font-display text-[14px] italic text-gold-text">“{t.brand.promise}”</p>
        </header>

        <Section n={++n} title={t.report.summary}>
          <div className="rounded-xl bg-deep p-5 text-deep-fg">
            <p className="font-display text-[1.15rem] leading-snug">{reframe}</p>
          </div>
          <ul className="mt-5 space-y-2.5 text-[14px] leading-relaxed text-ink">
            {top[0] && <li><span className="font-semibold">{t.report.recommendation}:</span> {L.framework(top[0].id)} ({t.rec.fit[fitLevel(top[0].score)]}). {whyRecommended(top[0].id, slots).filter((r) => r.kind === "fit").slice(0, 1).map((r) => L.reason(r))}</li>}
            {rec.status !== "ok" && <li><span className="font-semibold">{t.report.recommendation}:</span> {rec.status === "insufficient_context" ? t.rec.insufficientTitle : rec.status === "no_good_fit" ? t.rec.ngfTitle : t.rec.oosTitle}</li>}
            {roots.length > 0 && <li><span className="font-semibold">{t.whys.root}:</span> {roots.map((r) => `${r.text} (${t.whys.strength[rootStrength(read(p, "fw_five_whys"), r.id).strength]})`).join("; ")}</li>}
            {likely.length > 0 && <li><span className="font-semibold">{t.fishbone.likely}:</span> {likely.map((c) => c.text).join("; ")}</li>}
            {plan && plan.objective && <li><span className="font-semibold">{t.plan.objective}:</span> {plan.objective}{plan.deadline && ` (${t.plan.by} ${date(Date.parse(plan.deadline))})`}</li>}
            {plan && plan.indicators.filter((i) => i.name.trim()).length > 0 && <li><span className="font-semibold">{t.plan.indicators}:</span> {plan.indicators.filter((i) => i.name.trim()).map((i) => `${i.name}: ${i.baseline || "?"} → ${i.target || "?"}`).join("; ")}</li>}
            <li><span className="font-semibold">{t.report.register}:</span> {register.length}</li>
          </ul>
        </Section>

        <Section n={++n} title={t.report.problem}>
          <blockquote className="rounded-lg border-s-4 border-gold bg-surface-2 p-4 text-[14px] leading-relaxed text-ink">{p.challenge}</blockquote>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {ROLES.filter((r) => d.byRole[r].length).map((r) => (
              <div key={r}>
                <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-ink-subtle">{t.rolesPlural[r]}</h3>
                <ul className="space-y-1.5">{d.byRole[r].map((s) => <li key={s.id} className="flex items-start justify-between gap-3 text-[13.5px] text-ink"><span>{s.text}</span><TruthTag truth={s.truth} /></li>)}</ul>
              </div>
            ))}
          </div>
        </Section>

        <Section n={++n} title={t.report.recommendation}>
          {top.length ? (
            <ol className="space-y-4">
              {top.map((r, i) => (
                <li key={r.id} className="avoid-break">
                  <p className="text-[15px] font-semibold text-ink">{i + 1}. {L.framework(r.id)} <Badge tone={i === 0 ? "gold" : "primary"}>{t.rec.fit[fitLevel(r.score)]}</Badge></p>
                  <p className="mt-1 text-[13.5px] text-ink-muted">{l(FRAMEWORKS[r.id].purpose)}</p>
                  <ul className="mt-1.5 list-disc space-y-0.5 ps-5 text-[13px] text-ink">{whyRecommended(r.id, slots).map((x, k) => <li key={k}>{L.reason(x)}</li>)}</ul>
                </li>
              ))}
            </ol>
          ) : <p className="text-[14px] text-ink-muted">{rec.status === "insufficient_context" ? t.rec.insufficientLead : rec.status === "no_good_fit" ? t.rec.ngfLead : t.rec.oosLead}</p>}
          {rec.status === "ok" && (
            <details className="mt-5" open>
              <summary className="cursor-pointer text-[13px] font-semibold text-ink-subtle">{t.report.setAside}</summary>
              <table className="mt-2 w-full text-start text-[12.5px]">
                <tbody>{APPROACH_IDS.filter((a) => !top.some((r) => r.id === a)).map((a) => <tr key={a} className="border-b border-line"><td className="py-1.5 pe-3 font-medium text-ink">{L.framework(a)}</td><td className="py-1.5 text-ink-muted">{whyNot(a, slots, rec).map((r) => L.reason(r)).join(" ")}</td></tr>)}</tbody>
              </table>
            </details>
          )}
        </Section>

        <Section n={++n} title={t.report.analysis} breakBefore>
          {analysis.length === 0 && <p className="text-[14px] text-ink-muted">{t.report.notStarted}</p>}
          <div className="space-y-10">
            {analysis.map((k) => (
              <div key={k} className="avoid-break">
                <h3 className="mb-3 font-display text-[1.2rem] text-ink">{L.framework(k)}</h3>
                {k === "fw_swot" && (() => { const s = read(p, k); return (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {QUADRANTS.map((q) => <div key={q} className="rounded-lg border border-line p-3"><p className="mb-2 text-[13px] font-semibold text-ink">{t.swot.quadrants[q]}</p><ul className="space-y-1">{s[q].filter((i) => i.text.trim()).map((i) => <li key={i.id} className="flex items-start justify-between gap-2 text-[13px] text-ink"><span>{i.text}{i.evidence && <span className="block text-[11.5px] text-ink-subtle">{i.evidence}</span>}</span><TruthTag truth={i.truth} /></li>)}</ul></div>)}
                    </div>
                    {s.implications.filter((m) => m.text.trim()).length > 0 && <><p className="mb-1.5 mt-4 text-[13px] font-semibold text-ink">{t.swot.implicationsTitle}</p><ul className="list-disc space-y-1 ps-5 text-[13.5px] text-ink">{s.implications.filter((m) => m.text.trim()).map((m) => <li key={m.id}><span className="font-semibold">{m.type}</span>: {m.text}</li>)}</ul></>}
                  </>
                ); })()}
                {k === "fw_five_whys" && (() => { const w = read(p, k); return <><p className="mb-3 text-[14px] text-ink"><span className="font-semibold">{t.whys.problem}:</span> {w.problem}</p><WhyTree d={w} parent={null} /></>; })()}
                {k === "fw_cause_effect" && (() => { const fb = read(p, k); return (
                  <>
                    <FishboneDiagram data={fb} title={`${L.framework(k)}: ${fb.effect}`} />
                    <div className="mt-3 grid gap-2 text-[12.5px] sm:grid-cols-2">{fb.categories.map((c) => { const cs = fb.causes.filter((x) => x.categoryId === c.id && x.text.trim()); return cs.length ? <p key={c.id}><span className="font-semibold text-ink">{catName(c)}:</span> <span className="text-ink-muted">{cs.map((x) => `${x.likely ? "★ " : ""}${x.text}`).join("; ")}</span></p> : null; })}</div>
                  </>
                ); })()}
                {k === "fw_impact_effort" && (() => { const m = read(p, k); return (
                  <div className="grid items-start gap-6 md:grid-cols-[minmax(0,26rem)_1fr]">
                    <MatrixChart data={m} title={L.framework(k)} />
                    <ol className="space-y-1.5 text-[13.5px] text-ink">{prioritise(m.items).map((i, j) => <li key={i.id}>{j + 1}. {i.title} <Badge tone={quadrant(i) === "quick_win" ? "primary" : quadrant(i) === "strategic" ? "gold" : "neutral"}>{t.matrix.quadrants[quadrant(i)]}</Badge>{(i.impactWhy || i.effortWhy) && <span className="block text-[12px] text-ink-subtle">{[i.impactWhy, i.effortWhy].filter(Boolean).join(" · ")}</span>}</li>)}</ol>
                  </div>
                ); })()}
              </div>
            ))}
          </div>
        </Section>

        {plan && (
          <Section n={++n} title={t.report.plan} breakBefore>
            <p className="text-[14px] text-ink"><span className="font-semibold">{t.plan.objective}:</span> {plan.objective}{plan.deadline && <> · <span className="font-semibold">{t.plan.deadline}:</span> {date(Date.parse(plan.deadline))}</>}</p>
            {plan.indicators.some((i) => i.name.trim()) && (
              <table className="mt-4 w-full text-start text-[13px]">
                <thead><tr className="border-b-2 border-line text-ink-subtle"><th className="py-1.5 text-start">{t.plan.indicator}</th><th className="text-start">{t.plan.baseline}</th><th className="text-start">{t.plan.target}</th><th className="text-start">{t.plan.by}</th></tr></thead>
                <tbody>{plan.indicators.filter((i) => i.name.trim()).map((i) => <tr key={i.id} className="border-b border-line"><td className="py-1.5 font-medium text-ink">{i.name}</td><td>{i.baseline}</td><td>{i.target}</td><td>{i.by && date(Date.parse(i.by))}</td></tr>)}</tbody>
              </table>
            )}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[40rem] text-start text-[12.5px]">
                <thead><tr className="border-b-2 border-line text-ink-subtle"><th className="py-1.5 text-start">{t.plan.action}</th><th className="text-start">{t.plan.owner}</th><th className="text-start">{t.plan.due}</th><th className="text-start">{t.plan.status}</th><th className="text-start">{t.plan.links}</th></tr></thead>
                <tbody>{plan.actions.filter((a) => a.title.trim()).map((a) => <tr key={a.id} className="border-b border-line align-top"><td className="py-1.5 pe-2 font-medium text-ink">{a.title}{a.deliverable && <span className="block font-normal text-ink-subtle">{a.deliverable}</span>}</td><td className="pe-2">{a.owner}</td><td className="pe-2">{a.due && date(Date.parse(a.due))}</td><td className="pe-2">{t.plan.statuses[a.status]}</td><td className="text-ink-muted">{a.links.map(linkLabel).join("; ")}</td></tr>)}</tbody>
              </table>
            </div>
            <div className="mt-5"><Timeline plan={plan} title={t.plan.timeline} /></div>
          </Section>
        )}

        <Section n={++n} title={t.report.register} breakBefore>
          <p className="mb-3 text-[13.5px] text-ink-muted">{t.report.registerLead}</p>
          {register.length === 0 ? <p className="text-[13.5px] text-ink-subtle">{t.report.registerEmpty}</p> : (
            <table className="w-full text-start text-[13px]">
              <tbody>{register.map((e, i) => <tr key={i} className="border-b border-line"><td className="py-1.5 pe-3 text-ink">{e.text}</td><td className="whitespace-nowrap pe-3 text-ink-subtle">{(t.report.sources as Record<string, string>)[e.source]}</td><td><TruthTag truth={e.truth} /></td></tr>)}</tbody>
            </table>
          )}
        </Section>

        <Section n={++n} title={t.report.review}>
          {review.length === 0 ? <p className="text-[13.5px] text-ink-subtle">{t.report.reviewNone}</p> : (
            <ul className="space-y-1.5 text-[13.5px] text-ink">{review.map(({ k, x }, i) => <li key={i} className="flex gap-2"><Badge tone={x.severity === "high" ? "danger" : "warning"}>{L.framework(k)}</Badge>{render(k, x)}</li>)}</ul>
          )}
        </Section>

        <Section n={++n} title={t.report.method}>
          <p className="text-[13px] leading-relaxed text-ink-muted">{t.report.methodBody}</p>
        </Section>
      </article>
    </div>
  );
}
