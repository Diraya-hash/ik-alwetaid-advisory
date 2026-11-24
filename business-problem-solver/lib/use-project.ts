"use client";

import { useCallback } from "react";
import { useWorkspace } from "@/store/workspace";
import type { Project } from "@/engine/project";

/** Reads one project and returns an updater bound to it. */
export function useProject(id: string | null) {
  const project = useWorkspace((s) => (id ? s.projects[id] : undefined));
  const hydrated = useWorkspace((s) => s.hydrated);
  const updateProject = useWorkspace((s) => s.updateProject);
  const update = useCallback((fn: (p: Project) => void, milestone?: string) => { if (id) updateProject(id, fn, milestone); }, [id, updateProject]);
  return { project, hydrated, update };
}
