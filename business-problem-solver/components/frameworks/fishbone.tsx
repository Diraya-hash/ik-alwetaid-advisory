"use client";

import { Download, Plus, Star } from "lucide-react";
import { useRef, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { SectionTitle } from "@/components/ui/primitives";
import { newItemId, type Finding } from "@/engine/builders/common";
import { CATEGORY_SETS, type Category, type Cause, type Fishbone } from "@/engine/builders/fishbone";
import type { Project } from "@/engine/project";
import { svgToPng } from "@/lib/export";
import { cn } from "@/lib/utils";
import { CriticPanel, RemoveButton, TruthSelect, flagged } from "./shared";
import { useBuilder, type Update } from "./use-builder";

const W = 1000, H = 560, SPINE = 280;
const isRtl = (s: string) => /[\u0590-\u08FF]/.test(s);
/** SVG anchor that puts the given edge of the text at x, whatever the text's own direction. */
const edge = (side: "left" | "right", s: string): "start" | "end" => ((side === "right") !== isRtl(s) ? "end" : "start");
const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
function wrap(s: string, n: number, max: number): string[] {
  const out: string[] = []; let line = "";
  for (const w of s.split(/\s+/).filter(Boolean)) { if ((line + " " + w).trim().length > n && line) { out.push(line); line = w; } else line = `${line} ${w}`.trim(); }
  if (line) out.push(line);
  return out.length > max ? [...out.slice(0, max - 1), clip(out.slice(max - 1).join(" "), n)] : out;
}

export function useCategoryName() {
  const { t } = useI18n();
  return (c: Category) => c.name.trim() || (c.preset ? t.fishbone.presets[c.preset] : t.fishbone.newCategory);
}

/** The fishbone diagram. Mirrors for Arabic: the head is on the left and text runs right to left. */
export function FishboneDiagram({ data, selected, onSelect, svgRef, title }: { data: Fishbone; selected?: string | null; onSelect?: (id: string) => void; svgRef?: React.Ref<SVGSVGElement>; title: string }) {
  const { dir, t } = useI18n();
  const name = useCategoryName();
  const rtl = dir === "rtl";
  const mx = (x: number) => (rtl ? W - x : x);
  const anchor = (a: "start" | "end") => (rtl ? (a === "start" ? "end" : "start") : a);
  const cats = data.categories;
  const perSide = Math.max(1, Math.ceil(cats.length / 2));
  const xs = (i: number) => 290 + ((i + 0.5) * 500) / perSide;
  const dot = { verified: "fill-fact", unverified: "fill-claim", assumption: "fill-assumption" } as const;
  return (
    <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} role={onSelect ? "group" : "img"} aria-label={title} className="h-auto w-full" direction={rtl ? "rtl" : "ltr"}>
      <title>{title}</title>
      <line x1={mx(40)} y1={SPINE} x2={mx(790)} y2={SPINE} className="stroke-deep" strokeWidth={4} strokeLinecap="round" />
      <rect x={rtl ? W - 980 : 790} y={SPINE - 70} width={190} height={140} rx={14} className="fill-deep" />
      {wrap(data.effect || "—", 18, 5).map((l, i, arr) => (
        <text key={i} x={rtl ? W - 885 : 885} y={SPINE - (arr.length - 1) * 12 + i * 24 + 6} textAnchor="middle" direction={isRtl(l) ? "rtl" : "ltr"} className="fill-deep-fg" fontSize={16} fontWeight={600}>{l}</text>
      ))}
      {cats.map((c, i) => {
        const top = i % 2 === 0;
        const bx = xs(Math.floor(i / 2));
        const ey = top ? 70 : H - 70;
        const ex = bx - 80;
        const causes = data.causes.filter((k) => k.categoryId === c.id && !k.parentId && k.text.trim());
        const sel = selected === c.id;
        const shown = causes.slice(0, 5);
        return (
          <g key={c.id}>
            <line x1={mx(bx)} y1={SPINE} x2={mx(ex)} y2={ey} className={sel ? "stroke-gold" : "stroke-primary"} strokeWidth={sel ? 3.5 : 2.5} strokeLinecap="round" />
            <g role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined} aria-pressed={onSelect ? sel : undefined} aria-label={onSelect ? name(c) : undefined}
              onClick={() => onSelect?.(c.id)} onKeyDown={(e) => { if (onSelect && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onSelect(c.id); } }} className={onSelect ? "cursor-pointer outline-none" : undefined}>
              <rect x={mx(ex) - 72} y={top ? ey - 48 : ey + 10} width={144} height={38} rx={8} className={sel ? "fill-gold-soft stroke-gold" : "fill-primary-soft stroke-primary"} strokeWidth={1.5} />
              <text x={mx(ex)} y={top ? ey - 23 : ey + 35} textAnchor="middle" fontSize={16} fontWeight={600} className={sel ? "fill-gold-text" : "fill-primary-soft-fg"}>{clip(name(c), 15)}</text>
            </g>
            {shown.map((k, j) => {
              const tt = (j + 1) / (shown.length + 1);
              const px = bx + (ex - bx) * tt, py = SPINE + (ey - SPINE) * tt;
              const len = 96;
              return (
                <g key={k.id}>
                  <line x1={mx(px)} y1={py} x2={mx(px - len)} y2={py} className="stroke-line-strong" strokeWidth={1.2} />
                  <circle cx={mx(px - len)} cy={py} r={k.likely ? 5 : 3.5} className={k.likely ? "fill-gold" : dot[k.truth]} />
                  <text x={mx(px - len - 9)} y={py + 4} textAnchor={edge(rtl ? "left" : "right", k.text)} direction={isRtl(k.text) ? "rtl" : "ltr"} fontSize={15} fontWeight={k.likely ? 700 : 400} className="fill-ink">{clip(k.text, 22)}</text>
                </g>
              );
            })}
            {causes.length > 5 && <text x={mx(bx - 24)} y={top ? SPINE - 12 : SPINE + 22} textAnchor={anchor("end")} fontSize={13} className="fill-ink-subtle">+{causes.length - 5}</text>}
          </g>
        );
      })}
      <g>
        <circle cx={mx(52)} cy={22} r={6} className="fill-gold" />
        <text x={mx(64)} y={27} textAnchor={edge(rtl ? "right" : "left", t.fishbone.likely)} direction={isRtl(t.fishbone.likely) ? "rtl" : "ltr"} fontSize={14} className="fill-ink-subtle">{t.fishbone.likely}</text>
      </g>
    </svg>
  );
}

export function FishboneBuilder({ project, update }: { project: Project; update: Update }) {
  const { t, f } = useI18n();
  const { data, set, issues } = useBuilder(project, update, "fw_cause_effect");
  const name = useCategoryName();
  const [sel, setSel] = useState<string | null>(data.categories[0]?.id ?? null);
  const svgRef = useRef<SVGSVGElement>(null);
  const current = data.categories.find((c) => c.id === sel) ?? data.categories[0];
  const render = (x: Finding) => f((t.critic.fishbone as Record<string, string>)[x.code] ?? x.code, x.params ?? {});
  const edit = (id: string, fn: (c: Cause) => void) => set((d) => { const y = d.causes.find((z) => z.id === id); if (y) fn(y); });
  const addCause = (categoryId: string, parentId: string | null = null) => set((d) => { d.causes.push({ id: newItemId("cause"), categoryId, parentId, text: "", truth: "assumption", likely: false, evidence: "" }); });

  const CauseRow = ({ c, sub }: { c: Cause; sub?: boolean }) => {
    const sev = flagged(issues, c.id);
    return (
      <li id={`item-${c.id}`} className={cn("rounded-lg border p-2.5 transition-shadow", sub && "ms-5", c.likely ? "border-gold/60" : sev ? "border-warning/50" : "border-line")}>
        <div className="flex items-start gap-2">
          <input aria-label={t.fishbone.causePlaceholder} placeholder={t.fishbone.causePlaceholder} value={c.text} onChange={(e) => edit(c.id, (y) => { y.text = e.target.value; })} className="field h-9 flex-1 py-1 text-[13.5px]" />
          <RemoveButton onClick={() => set((d) => { d.causes = d.causes.filter((z) => z.id !== c.id && z.parentId !== c.id); })} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <TruthSelect value={c.truth} onChange={(v) => edit(c.id, (y) => { y.truth = v; })} />
          <button type="button" aria-pressed={c.likely} onClick={() => edit(c.id, (y) => { y.likely = !y.likely; })}
            className={cn("inline-flex h-8 items-center gap-1 rounded-md border px-2 text-[12px] font-semibold", c.likely ? "border-gold bg-gold-soft text-gold-text" : "border-line text-ink-muted")}>
            <Star className="h-3.5 w-3.5" aria-hidden />{t.fishbone.likely}
          </button>
          <input aria-label={t.b.evidence} placeholder={t.b.evidence} value={c.evidence} onChange={(e) => edit(c.id, (y) => { y.evidence = e.target.value; })} className="h-8 min-w-[8rem] flex-1 rounded-md border border-line bg-surface px-2 text-[12px] text-ink placeholder:text-ink-subtle" />
          {!sub && <Button size="sm" variant="ghost" onClick={() => addCause(c.categoryId, c.id)}><Plus className="h-3.5 w-3.5" aria-hidden />{t.fishbone.addSub}</Button>}
        </div>
      </li>
    );
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <section className="card p-5">
          <SectionTitle hint={t.fishbone.effectHint}><label htmlFor="fb-effect">{t.fishbone.effect}</label></SectionTitle>
          <textarea id="fb-effect" rows={2} value={data.effect} onChange={(e) => set((d) => { d.effect = e.target.value; })} className="field text-[14px]" />
        </section>
        <section className="card p-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-ink">{t.fishbone.diagram}</h3>
            <Button size="sm" variant="ghost" onClick={() => svgRef.current && svgToPng(svgRef.current, "fishbone.png")}><Download className="h-3.5 w-3.5" aria-hidden />{t.b.png}</Button>
          </div>
          <p className="mb-2 text-[12.5px] text-ink-subtle">{t.fishbone.diagramHint}</p>
          <div className="overflow-x-auto"><div className="min-w-[640px]"><FishboneDiagram data={data} selected={current?.id} onSelect={setSel} svgRef={svgRef} title={`${t.fishbone.diagram}: ${data.effect}`} /></div></div>
        </section>
        <section className="card p-5">
          <SectionTitle hint={t.fishbone.likelyHint}>{t.fishbone.categories}</SectionTitle>
          <div className="mb-4 flex flex-wrap items-center gap-2" role="tablist" aria-label={t.fishbone.categories}>
            {data.categories.map((c) => {
              const n = data.causes.filter((k) => k.categoryId === c.id && k.text.trim()).length;
              return (
                <button key={c.id} id={`item-${c.id}`} role="tab" type="button" aria-selected={current?.id === c.id} onClick={() => setSel(c.id)}
                  className={cn("rounded-full border px-3 py-1.5 text-[13px]", current?.id === c.id ? "border-primary bg-primary text-primary-fg" : "border-line text-ink-muted hover:border-line-strong")}>
                  {name(c)} <span className="num opacity-80">({n})</span>
                </button>
              );
            })}
          </div>
          {data.categories.length < 10 && <Button size="sm" variant="ghost" className="-mt-2 mb-3" onClick={() => { const id = newItemId("cat"); set((d) => { d.categories.push({ id, preset: null, name: "" }); }); setSel(id); }}><Plus className="h-3.5 w-3.5" aria-hidden />{t.fishbone.addCategory}</Button>}
          {current && (
            <div role="tabpanel">
              <div className="mb-3 flex flex-wrap items-end gap-2">
                <label className="flex flex-1 flex-col gap-1 text-[12px] font-semibold text-ink-subtle">{t.fishbone.rename}
                  <input value={current.name} placeholder={name(current)} onChange={(e) => set((d) => { const y = d.categories.find((z) => z.id === current.id); if (y) y.name = e.target.value; })} className="field h-9 py-1 text-[13.5px] font-normal" />
                </label>
                {data.categories.length > 1 && <ConfirmButton question={t.b.removeQ} onConfirm={() => { set((d) => { d.categories = d.categories.filter((z) => z.id !== current.id); d.causes = d.causes.filter((z) => z.categoryId !== current.id); }); setSel(null); }}>{t.fishbone.removeCategory}</ConfirmButton>}
              </div>
              <ul className="space-y-2">
                {data.causes.filter((c) => c.categoryId === current.id && !c.parentId).map((c) => (
                  <li key={c.id} className="list-none space-y-2"><ul className="space-y-2"><CauseRow c={c} />{data.causes.filter((s) => s.parentId === c.id).map((s) => <CauseRow key={s.id} c={s} sub />)}</ul></li>
                ))}
              </ul>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => addCause(current.id)}><Plus className="h-3.5 w-3.5" aria-hidden />{t.fishbone.addCause}</Button>
            </div>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line pt-4">
            <span className="text-[12.5px] text-ink-subtle">{t.fishbone.set}:</span>
            {(Object.keys(CATEGORY_SETS) as (keyof typeof CATEGORY_SETS)[]).map((k) => (
              <ConfirmButton key={k} variant="secondary" question={t.fishbone.setQ} onConfirm={() => set((d) => {
                const keep = d.categories.filter((c) => CATEGORY_SETS[k].includes(c.preset!));
                const next = CATEGORY_SETS[k].map((p, i) => keep.find((c) => c.preset === p) ?? { id: `cat_${Date.now().toString(36)}_${i}_${p}`, preset: p, name: "" });
                d.causes = d.causes.filter((c) => next.some((n) => n.id === c.categoryId));
                d.categories = next;
              })}>{t.fishbone.sets[k]}</ConfirmButton>
            ))}
          </div>
        </section>
      </div>
      <CriticPanel findings={issues} render={render} className="h-fit xl:sticky xl:top-6" />
    </div>
  );
}
