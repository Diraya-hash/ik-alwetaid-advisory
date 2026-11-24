"use client";

import { Hammer } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { EmptyState } from "@/components/ui/primitives";
import type { Project } from "@/engine/project";
import type { ApproachId } from "@/engine/types";
import { useLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

type Update = (fn: (p: Project) => void, milestone?: string) => void;

/** Framework workspace. The interactive builders are added in the next M1 step. */
export function FrameworksView({ project: p, active, onSelect }: { project: Project; update: Update; active: ApproachId | null; onSelect: (a: ApproachId) => void }) {
  const { t } = useI18n();
  const L = useLabels();
  const current = active && p.chosen.includes(active) ? active : p.chosen[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
      <nav aria-label={t.workspace.tabs.frameworks}>
        <ul className="space-y-1">
          {p.chosen.map((a) => (
            <li key={a}><button type="button" onClick={() => onSelect(a)} aria-current={a === current ? "true" : undefined}
              className={cn("w-full rounded-lg px-3 py-2 text-start text-[13.5px]", a === current ? "bg-primary-soft font-semibold text-primary-soft-fg" : "text-ink-muted hover:bg-surface-2")}>{L.framework(a)}</button></li>
          ))}
        </ul>
      </nav>
      <EmptyState icon={Hammer} title={current ? L.framework(current) : undefined} body={t.rec.startLater} />
    </div>
  );
}
