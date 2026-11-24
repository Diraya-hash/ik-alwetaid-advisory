"use client";

import { FolderKanban } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useI18n } from "@/components/i18n-provider";
import { SaveIndicator } from "@/components/layout/storage-status";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { diagnose } from "@/engine/diagnosis";
import type { ApproachId } from "@/engine/types";
import { useProject } from "@/lib/use-project";
import { cn } from "@/lib/utils";
import { DiagnosisView } from "./diagnosis";
import { FrameworksView } from "./frameworks";
import { IntakeView } from "./intake";
import { RecommendationsView } from "./recommendations";

export type Tab = "intake" | "diagnosis" | "recommendations" | "frameworks";
const TABS: Tab[] = ["intake", "diagnosis", "recommendations", "frameworks"];

export function WorkspaceView() {
  const { t, href } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const { project: p, hydrated, update } = useProject(id);
  const tabParam = params.get("tab") as Tab | null;
  const tab: Tab = tabParam && TABS.includes(tabParam) ? tabParam : p?.intakeDone ? "recommendations" : "intake";
  const d = useMemo(() => (p ? diagnose(p.intake) : null), [p]);

  const go = (next: Tab, extra = "") => { router.push(href(`/project?id=${id}&tab=${next}${extra}`)); window.scrollTo({ top: 0 }); };

  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-surface-2" aria-busy="true" />;
  if (!p || !d) return <EmptyState icon={FolderKanban} body={t.workspace.notFound} action={<Button href={href("/projects")}>{t.workspace.backToProjects}</Button>} />;

  const work = (a: ApproachId) => { update((x) => { if (!x.chosen.includes(a)) x.chosen.push(a); }, `framework added: ${a}`); go("frameworks", `&fw=${a}`); };

  return (
    <div>
      <header className="mb-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <p className="eyebrow">{t.diagnosis.eyebrow}</p>
          <SaveIndicator />
        </div>
        <label htmlFor="title" className="sr-only">{t.workspace.rename}</label>
        <textarea id="title" value={p.title} placeholder={t.common.untitled} rows={Math.min(3, Math.max(1, Math.ceil(p.title.length / 52)))}
          onChange={(e) => update((x) => { x.title = e.target.value.replace(/\n/g, " "); })}
          className="w-full resize-none rounded-lg border border-transparent bg-transparent px-1 py-1 font-display text-display-sm text-ink hover:border-line focus:border-primary" />
      </header>

      <div role="tablist" aria-label={t.workspace.rename} className="mb-8 flex gap-1 overflow-x-auto border-b border-line no-print">
        {TABS.filter((x) => x !== "frameworks" || p.chosen.length > 0).map((x) => (
          <button key={x} role="tab" type="button" aria-selected={tab === x} onClick={() => go(x)}
            className={cn("-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-[14px]", tab === x ? "border-primary font-semibold text-primary" : "border-transparent text-ink-muted hover:text-ink")}>
            {t.workspace.tabs[x]}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "intake" && <IntakeView project={p} update={update} onFinish={() => go("diagnosis")} />}
        {tab === "diagnosis" && <DiagnosisView project={p} diagnosis={d} onEdit={() => go("intake")} onNext={() => go("recommendations")} />}
        {tab === "recommendations" && <RecommendationsView project={p} diagnosis={d} onWork={work} onStep={(n) => { update((x) => { x.intakeStep = n; }); go("intake"); }} />}
        {tab === "frameworks" && <FrameworksView project={p} update={update} active={params.get("fw") as ApproachId | null} onSelect={(a) => go("frameworks", `&fw=${a}`)} />}
      </div>
    </div>
  );
}
