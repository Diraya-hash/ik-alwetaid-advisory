"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { SectionTitle } from "@/components/ui/primitives";
import { newItemId } from "@/engine/builders/common";
import { IMPLICATION_NEEDS, IMPLICATION_TYPES, QUADRANTS, type ImplicationType, type Quadrant } from "@/engine/builders/swot";
import type { Project } from "@/engine/project";
import { cn } from "@/lib/utils";
import { CriticPanel, RemoveButton, TruthSelect, flagged } from "./shared";
import { useBuilder, type Update } from "./use-builder";

const QSTYLE: Record<Quadrant, string> = { s: "border-t-primary", w: "border-t-warning", o: "border-t-gold", t: "border-t-danger" };

export function SwotBuilder({ project, update }: { project: Project; update: Update }) {
  const { t, f } = useI18n();
  const { data, set, issues } = useBuilder(project, update, "fw_swot");
  const [draft, setDraft] = useState<Record<Quadrant, string>>({ s: "", w: "", o: "", t: "" });
  const add = (q: Quadrant) => { const text = draft[q].trim(); if (!text) return; set((d) => { d[q].push({ id: newItemId("sw"), text, truth: "unverified", importance: 2, evidence: "" }); }); setDraft({ ...draft, [q]: "" }); };
  const allItems = QUADRANTS.flatMap((q) => data[q].map((i) => ({ q, i })));
  const render = (x: { code: string; params?: Record<string, string | number> }) => f((t.critic.swot as Record<string, string>)[x.code] ?? x.code, { ...x.params, ...(x.params?.q ? { q: t.swot.quadrants[x.params.q as Quadrant] } : {}) });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {QUADRANTS.map((q) => (
            <section key={q} aria-labelledby={`q-${q}`} className={cn("card border-t-4 p-4", QSTYLE[q])}>
              <h3 id={`q-${q}`} className="font-display text-[1.15rem] text-ink">{t.swot.quadrants[q]}</h3>
              <p className="mb-3 text-[12.5px] text-ink-subtle">{t.swot.hints[q]}</p>
              <ul className="space-y-2">
                {data[q].map((i) => {
                  const sev = flagged(issues, i.id);
                  return (
                    <li key={i.id} id={`item-${i.id}`} className={cn("rounded-lg border p-2.5 transition-shadow", sev === "high" ? "border-danger/50" : sev === "medium" ? "border-warning/50" : "border-line")}>
                      <div className="flex items-start gap-2">
                        <textarea aria-label={t.swot.quadrants[q]} rows={1} value={i.text} onChange={(e) => set((d) => { const y = d[q].find((z) => z.id === i.id); if (y) y.text = e.target.value; })}
                          className="field min-h-[2.25rem] flex-1 resize-y py-1.5 text-[13.5px]" />
                        <RemoveButton onClick={() => set((d) => { d[q] = d[q].filter((z) => z.id !== i.id); d.implications.forEach((m) => { m.links = m.links.filter((l) => l !== i.id); }); })} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <TruthSelect value={i.truth} onChange={(v) => set((d) => { const y = d[q].find((z) => z.id === i.id); if (y) y.truth = v; })} />
                        <select aria-label={t.b.importance} value={i.importance} onChange={(e) => set((d) => { const y = d[q].find((z) => z.id === i.id); if (y) y.importance = Number(e.target.value) as 1 | 2 | 3; })}
                          className="h-8 rounded-md border border-line bg-surface px-2 text-[12px] text-ink-muted">
                          {t.b.importanceOpts.map((o, n) => <option key={o} value={n + 1}>{t.b.importance}: {o}</option>)}
                        </select>
                        <input aria-label={t.b.evidence} placeholder={t.b.evidence} value={i.evidence} onChange={(e) => set((d) => { const y = d[q].find((z) => z.id === i.id); if (y) y.evidence = e.target.value; })}
                          className="h-8 min-w-[8rem] flex-1 rounded-md border border-line bg-surface px-2 text-[12px] text-ink placeholder:text-ink-subtle" />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); add(q); }}>
                <input aria-label={`${t.swot.add}: ${t.swot.quadrants[q]}`} placeholder={t.swot.placeholder} value={draft[q]} onChange={(e) => setDraft({ ...draft, [q]: e.target.value })} className="field h-9 py-1 text-[13px]" />
                <Button type="submit" size="sm" variant="secondary" aria-label={`${t.swot.add}: ${t.swot.quadrants[q]}`}><Plus className="h-4 w-4" aria-hidden /></Button>
              </form>
            </section>
          ))}
        </div>

        <section className="card p-5">
          <SectionTitle hint={t.swot.implicationsLead}>{t.swot.implicationsTitle}</SectionTitle>
          <ul className="space-y-4">
            {data.implications.map((m) => {
              const [qa, qb] = IMPLICATION_NEEDS[m.type];
              const sev = flagged(issues, m.id);
              return (
                <li key={m.id} id={`item-${m.id}`} className={cn("rounded-xl border p-3 transition-shadow", sev ? "border-warning/50" : "border-line")}>
                  <div className="flex flex-wrap items-start gap-2">
                    <select aria-label={t.swot.implicationsTitle} value={m.type} onChange={(e) => set((d) => { const y = d.implications.find((z) => z.id === m.id); if (y) y.type = e.target.value as ImplicationType; })}
                      className="h-9 rounded-md border border-line-strong bg-surface px-2 text-[13px] text-ink">
                      {IMPLICATION_TYPES.map((ty) => <option key={ty} value={ty}>{ty}: {t.swot.types[ty]}</option>)}
                    </select>
                    <RemoveButton onClick={() => set((d) => { d.implications = d.implications.filter((z) => z.id !== m.id); })} />
                  </div>
                  <textarea aria-label={t.swot.implicationPlaceholder} placeholder={t.swot.implicationPlaceholder} rows={2} value={m.text}
                    onChange={(e) => set((d) => { const y = d.implications.find((z) => z.id === m.id); if (y) y.text = e.target.value; })} className="field mt-2 text-[13.5px]" />
                  <fieldset className="mt-2">
                    <legend className="mb-1.5 text-[12px] font-semibold text-ink-subtle">{t.swot.basedOn}</legend>
                    {allItems.length === 0 ? <p className="text-[12.5px] text-ink-subtle">{t.swot.noFindings}</p> : (
                      <div className="flex flex-wrap gap-1.5">
                        {allItems.filter(({ i }) => i.text.trim()).map(({ q, i }) => {
                          const on = m.links.includes(i.id);
                          const relevant = q === qa || q === qb;
                          return (
                            <button key={i.id} type="button" aria-pressed={on} onClick={() => set((d) => { const y = d.implications.find((z) => z.id === m.id); if (y) y.links = on ? y.links.filter((l) => l !== i.id) : [...y.links, i.id]; })}
                              className={cn("max-w-full truncate rounded-full border px-2.5 py-1 text-[12px]", on ? "border-primary bg-primary text-primary-fg" : relevant ? "border-line-strong text-ink" : "border-line text-ink-subtle")}>
                              <span className="font-semibold">{q.toUpperCase()}</span> · {i.text}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </fieldset>
                </li>
              );
            })}
          </ul>
          <Button variant="secondary" size="sm" className="mt-3" onClick={() => set((d) => { d.implications.push({ id: newItemId("im"), type: "SO", text: "", links: [] }); })}><Plus className="h-3.5 w-3.5" aria-hidden />{t.swot.addImplication}</Button>
        </section>
      </div>
      <CriticPanel findings={issues} render={render} className="h-fit xl:sticky xl:top-6" />
    </div>
  );
}
