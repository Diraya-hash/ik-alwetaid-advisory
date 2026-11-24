"use client";

import { Download, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge, SectionTitle } from "@/components/ui/primitives";
import { newItemId, type Finding } from "@/engine/builders/common";
import { prioritise, quadrant, type Initiative, type Matrix, type MatrixQuadrant } from "@/engine/builders/matrix";
import type { Project } from "@/engine/project";
import { svgToPng } from "@/lib/export";
import { cn } from "@/lib/utils";
import { CriticPanel, RemoveButton, TruthSelect, flagged } from "./shared";
import { useBuilder, type Update } from "./use-builder";

const S = 520, PAD = 56, CELL = (S - PAD - 16) / 5;
const QTONE: Record<MatrixQuadrant, string> = { quick_win: "fill-primary-soft", strategic: "fill-gold-soft", fill_in: "fill-surface-2", deprioritise: "fill-danger-soft" };
const BADGE: Record<MatrixQuadrant, "primary" | "gold" | "neutral" | "danger"> = { quick_win: "primary", strategic: "gold", fill_in: "neutral", deprioritise: "danger" };

/** The matrix chart. Effort runs along the reading direction (low first), impact upwards. */
export function MatrixChart({ data, onMove, svgRef, title }: { data: Matrix; onMove?: (id: string, impact: number, effort: number) => void; svgRef?: React.RefObject<SVGSVGElement>; title: string }) {
  const { t, f, dir } = useI18n();
  const rtl = dir === "rtl";
  const [drag, setDrag] = useState<string | null>(null);
  const x0 = rtl ? 16 : PAD;
  const ex = (effort: number) => (rtl ? x0 + (5 - effort + 0.5) * CELL : x0 + (effort - 0.5) * CELL);
  const iy = (impact: number) => 16 + (5 - impact + 0.5) * CELL;
  const items = data.items.filter((i) => i.title.trim());
  const pos = (i: Initiative) => {
    const same = items.filter((o) => o.impact === i.impact && o.effort === i.effort);
    const k = same.indexOf(i), n = same.length;
    const a = (2 * Math.PI * k) / Math.max(1, n);
    const r = n > 1 ? 16 : 0;
    return { x: ex(i.effort) + r * Math.cos(a), y: iy(i.impact) + r * Math.sin(a) };
  };
  const toCell = (e: React.PointerEvent) => {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement ?? (e.currentTarget as SVGSVGElement);
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    const col = Math.min(5, Math.max(1, Math.floor((p.x - x0) / CELL) + 1));
    return { effort: rtl ? 6 - col : col, impact: Math.min(5, Math.max(1, 5 - Math.floor((p.y - 16) / CELL))) };
  };
  const quad = (q: MatrixQuadrant, x: number, y: number, w: number, h: number) => <rect key={q} x={x} y={y} width={w} height={h} className={QTONE[q]} />;
  const hiY = 16, loY = 16 + 2 * CELL;
  const lowX = rtl ? x0 + 3 * CELL : x0, highX = rtl ? x0 : x0 + 2 * CELL;
  return (
    <svg ref={svgRef} viewBox={`0 0 ${S} ${S}`} role="group" aria-label={title} className="h-auto w-full max-w-[34rem] touch-none select-none" direction={rtl ? "rtl" : "ltr"}>
      <title>{title}</title>
      {quad("quick_win", lowX, hiY, 2 * CELL, 2 * CELL)}
      {quad("strategic", highX, hiY, 3 * CELL, 2 * CELL)}
      {quad("fill_in", lowX, loY, 2 * CELL, 3 * CELL)}
      {quad("deprioritise", highX, loY, 3 * CELL, 3 * CELL)}
      {[0, 1, 2, 3, 4, 5].map((k) => <g key={k}><line x1={x0} x2={x0 + 5 * CELL} y1={16 + k * CELL} y2={16 + k * CELL} className="stroke-line" /><line y1={16} y2={16 + 5 * CELL} x1={x0 + k * CELL} x2={x0 + k * CELL} className="stroke-line" /></g>)}
      <line x1={x0} x2={x0 + 5 * CELL} y1={loY} y2={loY} className="stroke-ink-subtle" strokeDasharray="4 4" />
      <line y1={16} y2={16 + 5 * CELL} x1={rtl ? x0 + 3 * CELL : x0 + 2 * CELL} x2={rtl ? x0 + 3 * CELL : x0 + 2 * CELL} className="stroke-ink-subtle" strokeDasharray="4 4" />
      <text x={lowX + CELL} y={hiY + 18} textAnchor="middle" fontSize={12} fontWeight={700} className="fill-primary-soft-fg">{t.matrix.quadrants.quick_win}</text>
      <text x={highX + 1.5 * CELL} y={hiY + 18} textAnchor="middle" fontSize={12} fontWeight={700} className="fill-gold-text">{t.matrix.quadrants.strategic}</text>
      <text x={lowX + CELL} y={16 + 5 * CELL - 10} textAnchor="middle" fontSize={12} fontWeight={700} className="fill-ink-subtle">{t.matrix.quadrants.fill_in}</text>
      <text x={highX + 1.5 * CELL} y={16 + 5 * CELL - 10} textAnchor="middle" fontSize={12} fontWeight={700} className="fill-danger">{t.matrix.quadrants.deprioritise}</text>
      {[1, 2, 3, 4, 5].map((v) => <text key={`e${v}`} x={ex(v)} y={16 + 5 * CELL + 18} textAnchor="middle" fontSize={11} className="fill-ink-subtle">{v}</text>)}
      {[1, 2, 3, 4, 5].map((v) => <text key={`i${v}`} x={rtl ? x0 + 5 * CELL + 14 : x0 - 14} y={iy(v) + 4} textAnchor="middle" fontSize={11} className="fill-ink-subtle">{v}</text>)}
      <text x={x0 + 2.5 * CELL} y={S - 6} textAnchor="middle" fontSize={12} fontWeight={600} className="fill-ink">{t.matrix.axisEffort} ({t.matrix.low} → {t.matrix.high})</text>
      <text transform={`translate(${rtl ? S - 8 : 14} ${16 + 2.5 * CELL}) rotate(${rtl ? 90 : -90})`} textAnchor="middle" fontSize={12} fontWeight={600} className="fill-ink">{t.matrix.axisImpact} ({t.matrix.low} → {t.matrix.high})</text>
      {items.map((i) => {
        const { x, y } = pos(i);
        const n = data.items.filter((z) => z.title.trim()).indexOf(i) + 1;
        return (
          <g key={i.id} role={onMove ? "slider" : undefined} tabIndex={onMove ? 0 : undefined} aria-label={f(t.matrix.pointLabel, { title: i.title, impact: i.impact, effort: i.effort })}
            aria-valuenow={onMove ? i.impact : undefined} aria-valuemin={onMove ? 1 : undefined} aria-valuemax={onMove ? 5 : undefined} aria-valuetext={onMove ? f(t.matrix.pointLabel, { title: i.title, impact: i.impact, effort: i.effort }) : undefined}
            className={onMove ? "cursor-grab outline-none focus-visible:[&>circle]:stroke-gold focus-visible:[&>circle]:[stroke-width:4]" : undefined}
            onPointerDown={onMove ? (e) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); setDrag(i.id); } : undefined}
            onPointerMove={onMove ? (e) => { if (drag !== i.id) return; const c = toCell(e); if (c.impact !== i.impact || c.effort !== i.effort) onMove(i.id, c.impact, c.effort); } : undefined}
            onPointerUp={() => setDrag(null)}
            onKeyDown={onMove ? (e) => {
              const k = e.key; let { impact, effort } = i;
              if (k === "ArrowUp") impact++; else if (k === "ArrowDown") impact--; else if (k === (rtl ? "ArrowLeft" : "ArrowRight")) effort++; else if (k === (rtl ? "ArrowRight" : "ArrowLeft")) effort--; else return;
              e.preventDefault(); onMove(i.id, Math.min(5, Math.max(1, impact)), Math.min(5, Math.max(1, effort)));
            } : undefined}>
            <circle cx={x} cy={y} r={13} className={cn(quadrant(i) === "quick_win" ? "fill-primary" : quadrant(i) === "strategic" ? "fill-gold" : "fill-system", "stroke-surface")} strokeWidth={2} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} className="pointer-events-none fill-surface">{n}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function MatrixBuilder({ project, update }: { project: Project; update: Update }) {
  const { t, f, num } = useI18n();
  const { data, set, issues } = useBuilder(project, update, "fw_impact_effort");
  const svgRef = useRef<SVGSVGElement>(null);
  const [draft, setDraft] = useState("");
  const render = (x: Finding) => f((t.critic.matrix as Record<string, string>)[x.code] ?? x.code, x.params ?? {});
  const edit = (id: string, fn: (i: Initiative) => void) => set((d) => { const y = d.items.find((z) => z.id === id); if (y) fn(y); });
  const options = project.intake.options.filter((o) => o.trim() && !data.items.some((i) => i.title.trim() === o.trim()));
  const ranked = prioritise(data.items);
  const visible = data.items.filter((i) => i.title.trim());
  const scale = [1, 2, 3, 4, 5];
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <section className="card p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12.5px] text-ink-subtle">{t.matrix.drag}</p>
            <Button size="sm" variant="ghost" onClick={() => svgRef.current && svgToPng(svgRef.current, "impact-effort.png")}><Download className="h-3.5 w-3.5" aria-hidden />{t.b.png}</Button>
          </div>
          <div className="flex justify-center"><MatrixChart data={data} svgRef={svgRef} title={t.matrix.priority} onMove={(id, impact, effort) => edit(id, (y) => { y.impact = impact; y.effort = effort; })} /></div>
          <p className="mt-2 text-center text-[12px] text-ink-subtle">{t.matrix.rule}</p>
        </section>

        <section className="card p-5">
          <ol className="space-y-3">
            {data.items.map((i) => {
              const q = quadrant(i);
              const sev = flagged(issues, i.id);
              const n = visible.indexOf(i) + 1;
              return (
                <li key={i.id} id={`item-${i.id}`} className={cn("rounded-xl border p-3 transition-shadow", sev ? "border-warning/50" : "border-line")}>
                  <div className="flex items-start gap-2">
                    {n > 0 && <span className="num mt-1.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-deep text-[11px] font-bold text-deep-fg">{num(n)}</span>}
                    <input aria-label={t.matrix.placeholder} placeholder={t.matrix.placeholder} value={i.title} onChange={(e) => edit(i.id, (y) => { y.title = e.target.value; })} className="field h-9 flex-1 py-1 text-[13.5px]" />
                    <RemoveButton onClick={() => set((d) => { d.items = d.items.filter((z) => z.id !== i.id); })} />
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {(["impact", "effort"] as const).map((k) => (
                      <div key={k} className="flex flex-col gap-1">
                        <label className="flex items-center justify-between gap-2 text-[12px] font-semibold text-ink-subtle">{t.matrix[k]}
                          <select aria-label={t.matrix[k]} value={i[k]} onChange={(e) => edit(i.id, (y) => { y[k] = Number(e.target.value); })} className="h-8 rounded-md border border-line-strong bg-surface px-2 text-[13px] text-ink">
                            {scale.map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </label>
                        <input aria-label={k === "impact" ? t.matrix.impactWhy : t.matrix.effortWhy} placeholder={k === "impact" ? t.matrix.impactWhy : t.matrix.effortWhy} value={k === "impact" ? i.impactWhy : i.effortWhy}
                          onChange={(e) => edit(i.id, (y) => { if (k === "impact") y.impactWhy = e.target.value; else y.effortWhy = e.target.value; })} className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] text-ink placeholder:text-ink-subtle" />
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2"><TruthSelect value={i.truth} onChange={(v) => edit(i.id, (y) => { y.truth = v; })} /><Badge tone={BADGE[q]}>{t.matrix.quadrants[q]}</Badge></div>
                </li>
              );
            })}
          </ol>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!draft.trim()) return; set((d) => { d.items.push({ id: newItemId("ini"), title: draft.trim(), impact: 3, effort: 3, impactWhy: "", effortWhy: "", truth: "assumption" }); }); setDraft(""); }}>
            <input aria-label={t.matrix.add} placeholder={t.matrix.placeholder} value={draft} onChange={(e) => setDraft(e.target.value)} className="field h-9 py-1 text-[13px]" />
            <Button type="submit" size="sm" variant="secondary"><Plus className="h-4 w-4" aria-hidden />{t.matrix.add}</Button>
          </form>
          {options.length > 0 && <Button size="sm" variant="ghost" className="mt-2" onClick={() => set((d) => { options.forEach((o) => d.items.push({ id: newItemId("ini"), title: o.trim(), impact: 3, effort: 3, impactWhy: "", effortWhy: "", truth: "assumption" })); })}><Plus className="h-3.5 w-3.5" aria-hidden />{t.matrix.importOptions}</Button>}
        </section>

        {ranked.length > 0 && (
          <section className="card p-5">
            <SectionTitle>{t.matrix.priority}</SectionTitle>
            <ol className="space-y-2">
              {ranked.map((i, n) => (
                <li key={i.id} className="flex flex-wrap items-center gap-3 text-[13.5px] text-ink">
                  <span className="num w-6 text-ink-subtle">{num(n + 1)}.</span><span className="flex-1">{i.title}</span>
                  <Badge tone={BADGE[quadrant(i)]}>{t.matrix.quadrants[quadrant(i)]}</Badge>
                </li>
              ))}
            </ol>
            <p className="mt-3 text-[12px] text-ink-subtle">{t.matrix.quadrantHints.quick_win} {t.matrix.quadrantHints.strategic}</p>
          </section>
        )}
      </div>
      <CriticPanel findings={issues} render={render} className="h-fit xl:sticky xl:top-6" />
    </div>
  );
}
