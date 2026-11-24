"use client";

import { Download, Link2, Plus, Sparkles } from "lucide-react";
import { useRef } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge, Meter, SectionTitle } from "@/components/ui/primitives";
import { linkables, suggestedActions } from "@/engine/builders";
import { newItemId, type Finding } from "@/engine/builders/common";
import { STATUSES, progress, type Action, type Link, type Plan } from "@/engine/builders/plan";
import type { Project } from "@/engine/project";
import type { ApproachId } from "@/engine/types";
import { svgToPng, toCsv } from "@/lib/export";
import { useLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { downloadFile } from "@/store/workspace";
import { CriticPanel, RemoveButton, flagged } from "./shared";
import { useBuilder, type Update } from "./use-builder";

export function useLinkLabel() {
  const { t } = useI18n();
  const L = useLabels();
  return (l: Link) => `${t.plan.linkKinds[l.kind]}: ${l.kind === "framework" ? L.framework(l.ref as ApproachId) : l.label}`;
}

const DAY = 86400000;
/** Gantt-style timeline; mirrors for Arabic. */
export function Timeline({ plan, svgRef, title }: { plan: Plan; svgRef?: React.RefObject<SVGSVGElement>; title: string }) {
  const { t, dir, date } = useI18n();
  const rtl = dir === "rtl";
  const rows = plan.actions.filter((a) => a.title.trim() && a.start && a.due && a.due >= a.start);
  if (!rows.length) return <p className="text-[13px] text-ink-subtle">{t.plan.noDates}</p>;
  const t0 = Math.min(...rows.map((a) => Date.parse(a.start)));
  const t1 = Math.max(...rows.map((a) => Date.parse(a.due)), plan.deadline ? Date.parse(plan.deadline) : 0) + DAY;
  const W = 900, LABEL = 280, ROW = 38, H = rows.length * ROW + 44;
  const sx = (ms: number) => { const v = ((ms - t0) / (t1 - t0)) * (W - LABEL - 70); return rtl ? W - LABEL - 10 - v : LABEL + 10 + v; };
  const color: Record<Action["status"], string> = { done: "fill-primary", in_progress: "fill-gold", not_started: "fill-system", blocked: "fill-danger" };
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title} className="h-auto w-full" direction={rtl ? "rtl" : "ltr"}>
      <title>{title}</title>
      <text x={rtl ? W - LABEL - 10 : LABEL + 10} y={16} fontSize={14} textAnchor="start" className="fill-ink-subtle">{date(t0)}</text>
      <text x={rtl ? 10 : W - 10} y={16} fontSize={14} textAnchor="end" className="fill-ink-subtle">{date(t1 - DAY)}</text>
      {rows.map((a, i) => {
        const y = 28 + i * ROW;
        const x1 = sx(Date.parse(a.start)), x2 = sx(Date.parse(a.due) + DAY);
        return (
          <g key={a.id}>
            <text x={rtl ? W - 8 : 8} y={y + 18} fontSize={15} textAnchor="start" className="fill-ink">{a.title.length > 30 ? `${a.title.slice(0, 29)}…` : a.title}</text>
            <rect x={Math.min(x1, x2)} y={y + 5} width={Math.max(4, Math.abs(x2 - x1))} height={20} rx={4} className={color[a.status]} />
          </g>
        );
      })}
      {plan.deadline && (() => { const x = sx(Date.parse(plan.deadline) + DAY); return <g><line x1={x} x2={x} y1={20} y2={H - 4} className="stroke-danger" strokeDasharray="4 3" strokeWidth={1.5} /><text x={x} y={H - 6} fontSize={13} textAnchor="middle" className="fill-danger">{t.plan.deadline}</text></g>; })()}
    </svg>
  );
}

export function planCsv(plan: Plan, t: ReturnType<typeof useI18n>["t"], linkLabel: (l: Link) => string) {
  const byId = new Map(plan.actions.map((a) => [a.id, a.title]));
  return toCsv([
    [t.plan.action, t.plan.owner, t.plan.start, t.plan.due, t.plan.status, t.plan.dependsOn, t.plan.deliverable, t.plan.links],
    ...plan.actions.filter((a) => a.title.trim()).map((a) => [a.title, a.owner, a.start, a.due, t.plan.statuses[a.status], a.dependsOn.map((d) => byId.get(d) ?? "").join("; "), a.deliverable, a.links.map(linkLabel).join("; ")]),
    [], [t.plan.indicator, t.plan.baseline, t.plan.target, t.plan.by],
    ...plan.indicators.filter((i) => i.name.trim()).map((i) => [i.name, i.baseline, i.target, i.by]),
  ]);
}

export function PlanBuilder({ project, update }: { project: Project; update: Update }) {
  const { t, f, num } = useI18n();
  const { data, set, issues } = useBuilder(project, update, "fw_action_plan");
  const linkLabel = useLinkLabel();
  const svgRef = useRef<SVGSVGElement>(null);
  const render = (x: Finding) => f((t.critic.plan as Record<string, string>)[x.code] ?? x.code, x.params ?? {});
  const edit = (id: string, fn: (a: Action) => void) => set((d) => { const y = d.actions.find((z) => z.id === id); if (y) fn(y); });
  const newAction = (title = "", link?: Link): Action => ({ id: newItemId("act"), title, owner: "", start: "", due: "", status: "not_started", dependsOn: [], deliverable: "", links: link ? [link] : [] });
  const pr = progress(data);
  const suggestions = suggestedActions(project);
  const available = linkables(project);
  const goals = project.intake.statements.filter((s) => s.role === "goal" && s.text.trim());

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <section className="card p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_12rem]">
            <div>
              <label htmlFor="plan-objective" className="mb-1 block text-[14px] font-semibold text-ink">{t.plan.objective}</label>
              <textarea id="plan-objective" rows={2} value={data.objective} onChange={(e) => set((d) => { d.objective = e.target.value; })} className="field text-[14px]" />
              {goals.length > 1 && <div className="mt-2 flex flex-wrap gap-1.5">{goals.map((g) => <button key={g.id} type="button" onClick={() => set((d) => { d.objective = g.text.trim(); })} className="rounded-full border border-line px-2.5 py-1 text-[12px] text-ink-muted hover:border-primary">{g.text}</button>)}</div>}
            </div>
            <div>
              <label htmlFor="plan-deadline" className="mb-1 block text-[14px] font-semibold text-ink">{t.plan.deadline}</label>
              <input id="plan-deadline" type="date" value={data.deadline} onChange={(e) => set((d) => { d.deadline = e.target.value; })} className="field" />
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-[12.5px] text-ink-subtle"><span>{f(t.plan.progress, { done: pr.done, total: pr.total })}</span><span className="num">{num(Math.round(pr.pct * 100))}%</span></div>
            <Meter value={pr.pct} label={f(t.plan.progress, { done: pr.done, total: pr.total })} />
          </div>
        </section>

        <section className="card p-5">
          <SectionTitle hint={t.plan.indicatorsHint}>{t.plan.indicators}</SectionTitle>
          <ul className="space-y-2">
            {data.indicators.map((i) => (
              <li key={i.id} id={`item-${i.id}`} className={cn("grid gap-2 rounded-lg border p-2.5 transition-shadow sm:grid-cols-[1fr_7rem_7rem_9rem_auto]", flagged(issues, i.id) ? "border-warning/50" : "border-line")}>
                {(["name", "baseline", "target"] as const).map((k) => (
                  <input key={k} aria-label={k === "name" ? t.plan.indicator : t.plan[k]} placeholder={k === "name" ? t.plan.indicator : t.plan[k]} value={i[k]} onChange={(e) => set((d) => { const y = d.indicators.find((z) => z.id === i.id); if (y) y[k] = e.target.value; })} className="field h-9 py-1 text-[13px]" />
                ))}
                <input type="date" aria-label={t.plan.by} value={i.by} onChange={(e) => set((d) => { const y = d.indicators.find((z) => z.id === i.id); if (y) y.by = e.target.value; })} className="field h-9 py-1 text-[13px]" />
                <RemoveButton onClick={() => set((d) => { d.indicators = d.indicators.filter((z) => z.id !== i.id); })} />
              </li>
            ))}
          </ul>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => set((d) => { d.indicators.push({ id: newItemId("kpi"), name: "", baseline: "", target: "", by: d.deadline }); })}><Plus className="h-3.5 w-3.5" aria-hidden />{t.plan.addIndicator}</Button>
        </section>

        {suggestions.length > 0 && (
          <section className="card border-gold/40 p-5">
            <SectionTitle hint={t.plan.suggestionsLead}><span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-gold" aria-hidden />{t.plan.suggestions}</span></SectionTitle>
            <ul className="space-y-2">
              {suggestions.map((s, n) => (
                <li key={n} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line p-2.5">
                  <span className="text-[13.5px] text-ink">{s.title}<span className="block text-[12px] text-ink-subtle">{linkLabel(s.link)}</span></span>
                  <Button size="sm" variant="secondary" onClick={() => set((d) => { d.actions.push(newAction(s.title, s.link)); })}><Plus className="h-3.5 w-3.5" aria-hidden />{t.plan.addSuggestion}</Button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="card p-5">
          <SectionTitle>{t.plan.actions}</SectionTitle>
          <ol className="space-y-3">
            {data.actions.map((a, n) => {
              const sev = flagged(issues, a.id);
              const others = data.actions.filter((o) => o.id !== a.id && o.title.trim());
              const linkOpts = available.filter((l) => !a.links.some((x) => x.kind === l.kind && x.ref === l.ref));
              return (
                <li key={a.id} id={`item-${a.id}`} className={cn("rounded-xl border p-3 transition-shadow", sev === "high" ? "border-danger/50" : sev === "medium" ? "border-warning/50" : "border-line")}>
                  <div className="flex items-start gap-2">
                    <span className="num mt-2 w-6 text-[12px] font-semibold text-ink-subtle">{num(n + 1)}.</span>
                    <input aria-label={t.plan.action} placeholder={t.plan.action} value={a.title} onChange={(e) => edit(a.id, (y) => { y.title = e.target.value; })} className="field h-9 flex-1 py-1 text-[13.5px] font-medium" />
                    <RemoveButton onClick={() => set((d) => { d.actions = d.actions.filter((z) => z.id !== a.id); d.actions.forEach((z) => { z.dependsOn = z.dependsOn.filter((x) => x !== a.id); }); })} />
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-ink-subtle">{t.plan.owner}<input aria-label={t.plan.owner} value={a.owner} onChange={(e) => edit(a.id, (y) => { y.owner = e.target.value; })} className="field h-9 py-1 text-[13px] font-normal" /></label>
                    <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-ink-subtle">{t.plan.start}<input aria-label={t.plan.start} type="date" value={a.start} onChange={(e) => edit(a.id, (y) => { y.start = e.target.value; })} className="field h-9 py-1 text-[13px] font-normal" /></label>
                    <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-ink-subtle">{t.plan.due}<input aria-label={t.plan.due} type="date" value={a.due} onChange={(e) => edit(a.id, (y) => { y.due = e.target.value; })} className="field h-9 py-1 text-[13px] font-normal" /></label>
                    <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-ink-subtle">{t.plan.status}
                      <select aria-label={t.plan.status} value={a.status} onChange={(e) => edit(a.id, (y) => { y.status = e.target.value as Action["status"]; })} className="field h-9 py-1 text-[13px] font-normal">
                        {STATUSES.map((s) => <option key={s} value={s}>{t.plan.statuses[s]}</option>)}
                      </select>
                    </label>
                  </div>
                  <input aria-label={t.plan.deliverable} placeholder={t.plan.deliverable} value={a.deliverable} onChange={(e) => edit(a.id, (y) => { y.deliverable = e.target.value; })} className="mt-2 h-8 w-full rounded-md border border-line bg-surface px-2 text-[12.5px] text-ink placeholder:text-ink-subtle" />
                  {others.length > 0 && (
                    <fieldset className="mt-2">
                      <legend className="mb-1 text-[11.5px] font-semibold text-ink-subtle">{t.plan.dependsOn}</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {others.map((o) => { const on = a.dependsOn.includes(o.id); return (
                          <button key={o.id} type="button" aria-pressed={on} onClick={() => edit(a.id, (y) => { y.dependsOn = on ? y.dependsOn.filter((x) => x !== o.id) : [...y.dependsOn, o.id]; })}
                            className={cn("max-w-[16rem] truncate rounded-full border px-2.5 py-1 text-[12px]", on ? "border-primary bg-primary text-primary-fg" : "border-line text-ink-muted")}>{o.title}</button>
                        ); })}
                      </div>
                    </fieldset>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11.5px] font-semibold text-ink-subtle">{t.plan.links}:</span>
                    {a.links.length === 0 && <span className="text-[12px] text-ink-subtle">{t.plan.none}</span>}
                    {a.links.map((l) => (
                      <Badge key={`${l.kind}${l.ref}`} tone="primary" className="max-w-full">
                        <Link2 className="h-3 w-3 shrink-0" aria-hidden /><span className="truncate">{linkLabel(l)}</span>
                        <button type="button" aria-label={`${t.common.remove}: ${linkLabel(l)}`} onClick={() => edit(a.id, (y) => { y.links = y.links.filter((x) => !(x.kind === l.kind && x.ref === l.ref)); })} className="ms-1 font-bold">×</button>
                      </Badge>
                    ))}
                    {linkOpts.length > 0 && (
                      <select aria-label={t.plan.addLink} value="" onChange={(e) => { const l = linkOpts[Number(e.target.value)]; if (l) edit(a.id, (y) => { y.links.push(l); }); }} className="h-7 max-w-[14rem] rounded-md border border-dashed border-line-strong bg-surface px-2 text-[12px] text-ink-muted">
                        <option value="">+ {t.plan.addLink}</option>
                        {linkOpts.map((l, k) => <option key={k} value={k}>{linkLabel(l)}</option>)}
                      </select>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => set((d) => { d.actions.push(newAction()); })}><Plus className="h-3.5 w-3.5" aria-hidden />{t.plan.addAction}</Button>
        </section>

        <section className="card p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[15px] font-semibold text-ink">{t.plan.timeline}</h3>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => svgRef.current && svgToPng(svgRef.current, "action-plan-timeline.png")}><Download className="h-3.5 w-3.5" aria-hidden />{t.b.png}</Button>
              <Button size="sm" variant="ghost" onClick={() => downloadFile("action-plan.csv", planCsv(data, t, linkLabel), "text/csv")}><Download className="h-3.5 w-3.5" aria-hidden />{t.plan.csv}</Button>
            </div>
          </div>
          <div className="overflow-x-auto"><div className="min-w-[600px]"><Timeline plan={data} svgRef={svgRef} title={t.plan.timeline} /></div></div>
        </section>
      </div>
      <CriticPanel findings={issues} render={render} className="h-fit xl:sticky xl:top-6" />
    </div>
  );
}
