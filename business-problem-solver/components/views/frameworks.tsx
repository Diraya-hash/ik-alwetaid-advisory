"use client";

import { ArrowRight, Hammer, ListChecks, Plus } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Badge, Card, EmptyState } from "@/components/ui/primitives";
import { FishboneBuilder } from "@/components/frameworks/fishbone";
import { MatrixBuilder } from "@/components/frameworks/matrix";
import { PlanBuilder } from "@/components/frameworks/plan";
import { SwotBuilder } from "@/components/frameworks/swot";
import { WhysBuilder } from "@/components/frameworks/whys";
import type { Update } from "@/components/frameworks/use-builder";
import { FRAMEWORKS, BUILDERS, hasBuilder } from "@/content/frameworks";
import { findings, started, type BuilderKey } from "@/engine/builders";
import type { Diagnosis } from "@/engine/diagnosis";
import type { Project } from "@/engine/project";
import type { ApproachId } from "@/engine/types";
import { useLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

const BUILDER: Record<BuilderKey, (p: { project: Project; update: Update }) => JSX.Element> = {
  fw_swot: SwotBuilder, fw_five_whys: WhysBuilder, fw_cause_effect: FishboneBuilder, fw_impact_effort: MatrixBuilder, fw_action_plan: PlanBuilder,
};

export function FrameworksView({ project: p, update, diagnosis, active, onSelect }: { project: Project; update: Update; diagnosis: Diagnosis; active: ApproachId | null; onSelect: (a: ApproachId) => void }) {
  const { t, l } = useI18n();
  const L = useLabels();
  const chosen = p.chosen.filter(hasBuilder);
  const current = (active && chosen.includes(active as BuilderKey) ? active : chosen[0]) as BuilderKey | undefined;
  const recommended = new Set(diagnosis.recommendation.status === "ok" ? diagnosis.recommendation.ranked.slice(0, 3).map((r) => r.id) : []);
  const addable = BUILDERS.filter((b) => !chosen.includes(b));
  const add = (a: BuilderKey) => { update((x) => { if (!x.chosen.includes(a)) x.chosen.push(a); }, `framework added: ${a}`); onSelect(a); };
  const Builder = current ? BUILDER[current] : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label={t.workspace.tabs.frameworks} className="flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1">
          {chosen.map((a) => {
            const open = started(p, a) ? findings(p, a).filter((x) => x.severity !== "low").length : 0;
            return (
              <button key={a} type="button" onClick={() => onSelect(a)} aria-current={a === current ? "page" : undefined}
                className={cn("inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[13.5px]", a === current ? "bg-primary text-primary-fg" : "text-ink-muted hover:bg-surface-2 hover:text-ink")}>
                {L.framework(a)}{open > 0 && <span className={cn("num rounded-full px-1.5 text-[11px] font-bold", a === current ? "bg-primary-fg/20" : "bg-warning-soft text-warning")}>{open}</span>}
              </button>
            );
          })}
        </nav>
        {addable.length > 0 && (
          <label className="flex items-center gap-2 text-[13px] text-ink-muted">
            <Plus className="h-4 w-4" aria-hidden /><span className="sr-only">{t.b.addFramework}</span>
            <select value="" aria-label={t.b.addFramework} onChange={(e) => e.target.value && add(e.target.value as BuilderKey)} className="h-9 rounded-lg border border-line-strong bg-surface px-2 text-[13px] text-ink">
              <option value="">{t.b.addFramework}</option>
              {addable.map((b) => <option key={b} value={b}>{L.framework(b)}{recommended.has(b) || b === "fw_action_plan" ? "" : ` (${t.b.notRecommended})`}</option>)}
            </select>
          </label>
        )}
      </div>

      {!current && <EmptyState icon={Hammer} body={t.rec.lead} />}
      {current && (
        <div>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div className="max-w-3xl">
              <h2 className="text-display-sm text-ink">{L.framework(current)}</h2>
              <p className="mt-1 text-[14px] text-ink-muted">{l(FRAMEWORKS[current].purpose)}</p>
            </div>
            {!recommended.has(current) && current !== "fw_action_plan" && <Badge>{t.b.notRecommended}</Badge>}
          </div>
          {Builder && <Builder project={p} update={update} />}
          {current !== "fw_action_plan" && (
            <Card className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-surface-2">
              <p className="flex items-center gap-2 text-[14px] text-ink"><ListChecks className="h-5 w-5 text-gold" aria-hidden />{t.b.nextPlan}</p>
              <Button onClick={() => (chosen.includes("fw_action_plan") ? onSelect("fw_action_plan") : add("fw_action_plan"))}>{chosen.includes("fw_action_plan") ? t.b.openPlan : t.b.nextPlan}<ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
