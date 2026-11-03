"use client";

import { ArrowUpRight, Clock, Users } from "lucide-react";
import Link from "next/link";
import type { Scenario } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { Badge } from "@/components/ui/primitives";

export function DifficultyDots({ level }: { level: Scenario["difficulty"] }) {
  const n = { foundation: 1, intermediate: 2, advanced: 3 }[level];
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? "h-1.5 w-3 rounded-full bg-primary" : "h-1.5 w-3 rounded-full bg-surface-3"} />
      ))}
    </span>
  );
}

export function ScenarioCard({ scenario, inProgress }: { scenario: Scenario; inProgress?: boolean }) {
  const { t, l, f, href } = useI18n();
  return (
    <article className="card group relative flex flex-col p-5 transition-shadow hover:shadow-raised">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="primary">{t.category[scenario.category]}</Badge>
        {inProgress && <Badge tone="warning">{t.library.inProgress}</Badge>}
      </div>
      <h3 className="text-lg font-semibold leading-snug text-ink">
        <Link href={href(`/scenarios/${scenario.id}`)} className="after:absolute after:inset-0 after:rounded-2xl">
          {l(scenario.title)}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-muted">{l(scenario.summary)}</p>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4 text-[12px]">
        <div>
          <dt className="sr-only">{t.common.difficulty}</dt>
          <dd className="flex flex-col gap-1.5 text-ink-muted">
            <DifficultyDots level={scenario.difficulty} />
            {t.difficulty[scenario.difficulty]}
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t.common.duration}</dt>
          <dd className="flex items-center gap-1.5 text-ink-muted">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {f(t.common.minutes, { n: scenario.estMinutes })}
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t.common.stakeholders}</dt>
          <dd className="flex items-center gap-1.5 text-ink-muted">
            <Users className="h-3.5 w-3.5" aria-hidden />
            {f("{n}", { n: scenario.stakeholders.length })}
          </dd>
        </div>
      </dl>
      <ArrowUpRight className="absolute end-5 top-5 h-4 w-4 text-ink-subtle transition-colors group-hover:text-primary rtl:-scale-x-100" aria-hidden />
    </article>
  );
}
