"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/primitives";
import type { Project } from "@/engine/project";

export function projectStage(p: Project): "intake" | "diagnosed" | "working" {
  if (p.chosen.length) return "working";
  return p.intakeDone ? "diagnosed" : "intake";
}

export function ProjectCard({ project: p, children }: { project: Project; children?: React.ReactNode }) {
  const { t, f, date, href } = useI18n();
  const stage = projectStage(p);
  return (
    <li className="card flex flex-col p-5">
      <Badge tone={stage === "working" ? "primary" : stage === "diagnosed" ? "gold" : "neutral"} className="self-start">
        {stage === "working" ? f(t.projects.progress.working, { n: p.chosen.length }) : t.projects.progress[stage]}
      </Badge>
      <h3 className="mt-3 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{p.title || t.common.untitled}</h3>
      <p className="mt-1 line-clamp-2 text-[13px] text-ink-muted">{p.challenge}</p>
      <p className="mt-3 text-[12px] text-ink-subtle">{f(t.common.updated, { date: date(p.updatedAt) })}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <Link href={href(`/project?id=${p.id}`)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">
          {t.common.open}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
        </Link>
        {children}
      </div>
    </li>
  );
}
