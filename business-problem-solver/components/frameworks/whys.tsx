"use client";

import { CornerDownRight, GitBranch, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge, SectionTitle } from "@/components/ui/primitives";
import { newItemId } from "@/engine/builders/common";
import { childrenOf, depth, rootStrength, type FiveWhys, type WhyNode } from "@/engine/builders/whys";
import type { Project } from "@/engine/project";
import { cn } from "@/lib/utils";
import { CriticPanel, RemoveButton, TruthSelect, flagged } from "./shared";
import { useBuilder, type Update } from "./use-builder";
import type { Finding } from "@/engine/builders/common";

type Set = (fn: (d: FiveWhys) => void) => void;
const descendants = (d: FiveWhys, id: string): string[] => childrenOf(d, id).flatMap((c) => [c.id, ...descendants(d, c.id)]);

function NodeCard({ d, n, set, issues }: { d: FiveWhys; n: WhyNode; set: Set; issues: Finding[] }) {
  const { t, f } = useI18n();
  const level = depth(d, n.id);
  const kids = childrenOf(d, n.id);
  const s = n.isRoot ? rootStrength(d, n.id) : null;
  const sev = flagged(issues, n.id);
  const edit = (fn: (y: WhyNode) => void) => set((x) => { const y = x.nodes.find((z) => z.id === n.id); if (y) fn(y); });
  const addChild = (parentId: string | null) => set((x) => { x.nodes.push({ id: newItemId("why"), parentId, text: "", truth: "assumption", evidence: "", isRoot: false, countermeasure: "" }); });
  const Icon = s?.strength === "supported" ? ShieldCheck : s?.strength === "hypothesis" ? ShieldQuestion : ShieldAlert;
  return (
    <li>
      <div id={`item-${n.id}`} className={cn("rounded-xl border bg-surface p-3 transition-shadow", n.isRoot ? "border-gold/60" : sev === "high" ? "border-danger/50" : sev === "medium" ? "border-warning/50" : "border-line")}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-[12px] font-semibold text-gold-text">{f(t.whys.whyN, { n: level })}</span>
          <div className="flex items-center gap-1.5">
            <TruthSelect value={n.truth} onChange={(v) => edit((y) => { y.truth = v; })} />
            <RemoveButton label={t.whys.removeBranch} onClick={() => set((x) => { const gone = new Set([n.id, ...descendants(x, n.id)]); x.nodes = x.nodes.filter((z) => !gone.has(z.id)); })} />
          </div>
        </div>
        <textarea aria-label={f(t.whys.whyN, { n: level })} placeholder={t.whys.answer} rows={2} value={n.text} onChange={(e) => edit((y) => { y.text = e.target.value; })} className="field text-[13.5px]" />
        <input aria-label={t.b.evidence} placeholder={t.b.evidence} value={n.evidence} onChange={(e) => edit((y) => { y.evidence = e.target.value; })} className="mt-2 h-8 w-full rounded-md border border-line bg-surface px-2 text-[12px] text-ink placeholder:text-ink-subtle" />
        <label className="mt-2 inline-flex items-center gap-2 text-[13px] text-ink">
          <input type="checkbox" className="h-4 w-4 accent-[rgb(var(--primary))]" checked={n.isRoot} onChange={(e) => edit((y) => { y.isRoot = e.target.checked; })} />{t.whys.markRoot}
        </label>
        {s && (
          <div className="mt-3 rounded-lg bg-surface-2 p-3">
            <p className={cn("flex items-center gap-2 text-[13px] font-semibold", s.strength === "supported" ? "text-primary" : s.strength === "hypothesis" ? "text-claim" : "text-assumption")}>
              <Icon className="h-4 w-4" aria-hidden />{t.whys.strength[s.strength]}
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-muted">{f(t.whys.strengthHint[s.strength], { step: s.weakestStep ?? 0 })}</p>
            <label className="mt-2 block text-[12px] font-semibold text-ink-subtle" htmlFor={`cm-${n.id}`}>{t.whys.countermeasure}</label>
            <input id={`cm-${n.id}`} placeholder={t.whys.countermeasurePlaceholder} value={n.countermeasure} onChange={(e) => edit((y) => { y.countermeasure = e.target.value; })} className="field mt-1 h-9 py-1 text-[13px]" />
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {!n.isRoot && <Button size="sm" variant="secondary" onClick={() => addChild(n.id)}><CornerDownRight className="h-3.5 w-3.5 rtl:-scale-x-100" aria-hidden />{t.whys.ask}</Button>}
          <Button size="sm" variant="ghost" onClick={() => addChild(n.parentId)}><GitBranch className="h-3.5 w-3.5" aria-hidden />{t.whys.branch}</Button>
        </div>
      </div>
      {kids.length > 0 && (
        <ul className="ms-3 mt-3 space-y-3 border-s-2 border-line ps-4 sm:ms-5 sm:ps-5">
          {kids.map((k) => <NodeCard key={k.id} d={d} n={k} set={set} issues={issues} />)}
        </ul>
      )}
    </li>
  );
}

export function WhysBuilder({ project, update }: { project: Project; update: Update }) {
  const { t, f } = useI18n();
  const { data, set, issues } = useBuilder(project, update, "fw_five_whys");
  const tops = childrenOf(data, null);
  const roots = data.nodes.filter((n) => n.isRoot && n.text.trim());
  const render = (x: Finding) => f((t.critic.whys as Record<string, string>)[x.code] ?? x.code, x.params ?? {});
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        <section className="card p-5">
          <SectionTitle hint={t.whys.problemHint}><label htmlFor="whys-problem">{t.whys.problem}</label></SectionTitle>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
            <textarea id="whys-problem" rows={2} value={data.problem} onChange={(e) => set((d) => { d.problem = e.target.value; })} className="field flex-1 text-[14px]" />
            <TruthSelect value={data.problemTruth} onChange={(v) => set((d) => { d.problemTruth = v; })} />
          </div>
          {roots.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {roots.map((r) => { const s = rootStrength(data, r.id).strength; return <Badge key={r.id} tone={s === "supported" ? "primary" : "warning"}>{t.whys.strength[s]}: {r.text}</Badge>; })}
            </div>
          )}
        </section>
        {tops.length === 0 ? (
          <Button onClick={() => set((d) => { d.nodes.push({ id: newItemId("why"), parentId: null, text: "", truth: "assumption", evidence: "", isRoot: false, countermeasure: "" }); })}><CornerDownRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden />{t.whys.start}</Button>
        ) : (
          <ul className="space-y-4" aria-label={t.whys.problem}>{tops.map((n) => <NodeCard key={n.id} d={data} n={n} set={set} issues={issues} />)}</ul>
        )}
      </div>
      <CriticPanel findings={issues} render={render} className="h-fit xl:sticky xl:top-6" />
    </div>
  );
}
