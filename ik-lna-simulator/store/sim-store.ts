"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { check, derive } from "@/engine/reducer";
import type { Action, ActionInput, Rejection, Scenario } from "@/engine/types";
import { getScenario } from "@/content/scenarios";
import { safeStorage } from "./storage";

const AttemptSchema = z.object({
  id: z.string().min(1).max(100),
  scenarioId: z.string().min(1).max(100),
  scenarioVersion: z.number().int(),
  createdAt: z.number(),
  updatedAt: z.number(),
  status: z.enum(["in_progress", "completed"]),
  actions: z.array(z.object({ type: z.string(), at: z.number() }).passthrough()).max(5000),
});
const ImportSchema = z.object({ app: z.literal("ik-lna-simulator"), attempts: z.record(AttemptSchema) });

/** Parses an exported data file. Returns only attempts for known scenarios, or null if the file is invalid. */
export function parseImport(raw: string): Record<string, Attempt> | null {
  try {
    const parsed = ImportSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return null;
    const out: Record<string, Attempt> = {};
    for (const a of Object.values(parsed.data.attempts)) if (getScenario(a.scenarioId)) out[a.id] = a as unknown as Attempt;
    return out;
  } catch {
    return null;
  }
}

export interface Attempt {
  id: string;
  scenarioId: string;
  scenarioVersion: number;
  createdAt: number;
  updatedAt: number;
  status: "in_progress" | "completed";
  actions: Action[];
}

interface SimStore {
  attempts: Record<string, Attempt>;
  startAttempt: (scenario: Scenario) => string;
  dispatch: (scenario: Scenario, attemptId: string, action: ActionInput) => Rejection | null;
  deleteAttempt: (attemptId: string) => void;
  resetAll: () => void;
  /** Adds attempts that are not already present; returns how many were added. */
  importAttempts: (incoming: Record<string, Attempt>) => number;
}

export const STORE_KEY = "ik-lna-sim";
export const STORE_VERSION = 1;

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const useSimStore = create<SimStore>()(
  persist(
    (set, get) => ({
      attempts: {},
      startAttempt: (scenario) => {
        const id = newId();
        const now = Date.now();
        set((s) => ({
          attempts: {
            ...s.attempts,
            [id]: {
              id,
              scenarioId: scenario.id,
              scenarioVersion: scenario.version,
              createdAt: now,
              updatedAt: now,
              status: "in_progress",
              actions: [],
            },
          },
        }));
        return id;
      },
      dispatch: (scenario, attemptId, input) => {
        const attempt = get().attempts[attemptId];
        if (!attempt) return "unknown-question";
        const action = { ...input, at: Date.now() } as Action;
        const rejection = check(scenario, derive(scenario, attempt.actions), action);
        if (rejection) return rejection;
        set((s) => ({
          attempts: {
            ...s.attempts,
            [attemptId]: {
              ...attempt,
              actions: [...attempt.actions, action],
              updatedAt: action.at,
              status: action.type === "COMPLETE" ? "completed" : attempt.status,
            },
          },
        }));
        return null;
      },
      deleteAttempt: (attemptId) =>
        set((s) => {
          const { [attemptId]: _removed, ...rest } = s.attempts;
          return { attempts: rest };
        }),
      resetAll: () => set({ attempts: {} }),
      importAttempts: (incoming) => {
        const fresh = Object.values(incoming).filter((a) => !get().attempts[a.id]);
        set((s) => ({ attempts: { ...s.attempts, ...Object.fromEntries(fresh.map((a) => [a.id, a])) } }));
        return fresh.length;
      },
    }),
    {
      name: STORE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ attempts: s.attempts }),
      // Future schema changes add a step here; unknown shapes are discarded rather than crashing.
      migrate: (persisted, version) => {
        if (version === STORE_VERSION) return persisted as SimStore;
        return { attempts: {} } as unknown as SimStore;
      },
    }
  )
);

/** True once the persisted state has been read from storage (avoids hydration flicker). */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const unsub = useSimStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useSimStore.persist.hasHydrated());
    return unsub;
  }, []);
  return hydrated;
}
