"use client";

import { useMemo } from "react";
import { findings, read, type BuilderData, type BuilderKey } from "@/engine/builders";
import type { Project } from "@/engine/project";

export type Update = (fn: (p: Project) => void, milestone?: string) => void;

/** Builder data for a project (validated, seeded) with an updater and live findings. */
export function useBuilder<K extends BuilderKey>(p: Project, update: Update, key: K) {
  const data = useMemo(() => read(p, key), [p, key]);
  const issues = useMemo(() => findings(p, key), [p, key]);
  const set = (fn: (d: BuilderData[K]) => void) => update((x) => { const d = read(x, key); fn(d); x.frameworks[key] = d; });
  return { data, set, issues };
}
