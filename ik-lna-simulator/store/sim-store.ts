"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { check, derive } from "@/engine/reducer";
import type { Action, ActionInput, Rejection, Scenario } from "@/engine/types";
import { safeStorage } from "./storage";

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
            [attemptId]: { ...attempt, actions: [...attempt.actions, action], updatedAt: action.at },
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
