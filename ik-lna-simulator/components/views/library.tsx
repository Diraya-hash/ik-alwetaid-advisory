"use client";

import { SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import { scenarios } from "@/content/scenarios";
import { DIMENSIONS, type Scenario } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { ScenarioCard } from "@/components/scenario-card";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Select } from "@/components/ui/primitives";
import { useHydrated, useSimStore } from "@/store/sim-store";

type Filters = { difficulty: string; category: string; complexity: string; duration: string; competency: string };
const EMPTY: Filters = { difficulty: "all", category: "all", complexity: "all", duration: "all", competency: "all" };

export function durationBucket(min: number): "short" | "medium" | "long" {
  return min < 30 ? "short" : min <= 45 ? "medium" : "long";
}

export function matches(s: Scenario, f: Filters): boolean {
  return (
    (f.difficulty === "all" || s.difficulty === f.difficulty) &&
    (f.category === "all" || s.category === f.category) &&
    (f.complexity === "all" || String(s.complexity) === f.complexity) &&
    (f.duration === "all" || durationBucket(s.estMinutes) === f.duration) &&
    (f.competency === "all" || s.competencyFocus.includes(f.competency as Scenario["competencyFocus"][number]))
  );
}

export function LibraryView() {
  const { t, f: fmt, p } = useI18n();
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const hydrated = useHydrated();
  const attempts = useSimStore((s) => s.attempts);
  const active = new Set(hydrated ? Object.values(attempts).filter((a) => a.status === "in_progress").map((a) => a.scenarioId) : []);
  const results = useMemo(() => scenarios.filter((s) => matches(s, filters)), [filters]);
  const set = (k: keyof Filters) => (v: string) => setFilters((p) => ({ ...p, [k]: v }));
  const all = { value: "all", label: t.common.all };

  return (
    <>
      <PageHeader eyebrow={t.library.eyebrow} title={t.library.title} lead={t.library.lead} />
      <section aria-label={t.library.filters} className="card mb-6 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Select id="f-difficulty" label={t.common.difficulty} value={filters.difficulty} onChange={set("difficulty")}
          options={[all, ...(["foundation", "intermediate", "advanced"] as const).map((d) => ({ value: d, label: t.difficulty[d] }))]} />
        <Select id="f-category" label={t.common.category} value={filters.category} onChange={set("category")}
          options={[all, ...(["strategy", "workforce", "performance", "culture", "governance"] as const).map((c) => ({ value: c, label: t.category[c] }))]} />
        <Select id="f-complexity" label={t.common.complexity} value={filters.complexity} onChange={set("complexity")}
          options={[{ value: "all", label: t.library.complexityAny }, ...[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: fmt(t.library.complexityValue, { n }) }))]} />
        <Select id="f-duration" label={t.common.duration} value={filters.duration} onChange={set("duration")}
          options={[{ value: "all", label: t.library.durationAny }, { value: "short", label: t.library.durationShort }, { value: "medium", label: t.library.durationMedium }, { value: "long", label: t.library.durationLong }]} />
        <Select id="f-competency" label={t.common.competency} value={filters.competency} onChange={set("competency")}
          options={[all, ...DIMENSIONS.map((d) => ({ value: d, label: t.dimension[d] }))]} />
      </section>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-[13px] text-ink-subtle" aria-live="polite">
          {p(t.library.results, results.length)}
        </p>
        {JSON.stringify(filters) !== JSON.stringify(EMPTY) && (
          <Button variant="ghost" size="sm" onClick={() => setFilters(EMPTY)}>
            {t.library.reset}
          </Button>
        )}
      </div>

      {results.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((s) => (
            <ScenarioCard key={s.id} scenario={s} inProgress={active.has(s.id)} />
          ))}
        </div>
      ) : (
        <EmptyState icon={SearchX} body={t.library.empty} action={<Button variant="secondary" onClick={() => setFilters(EMPTY)}>{t.library.reset}</Button>} />
      )}
    </>
  );
}
