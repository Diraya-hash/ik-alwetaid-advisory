import type { StateStorage } from "zustand/middleware";

/**
 * Storage adapter. Wraps localStorage so that private windows, blocked storage or
 * quota errors degrade to an in-memory store instead of crashing the app.
 * A cloud adapter can implement the same interface later.
 */
const memory = new Map<string, string>();
let available: boolean | null = null;

export function storageAvailable(): boolean {
  if (available !== null) return available;
  try {
    const k = "__ik_probe__";
    window.localStorage.setItem(k, "1");
    window.localStorage.removeItem(k);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return storageAvailable() ? window.localStorage.getItem(name) : (memory.get(name) ?? null);
    } catch {
      return memory.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    memory.set(name, value);
    try {
      if (storageAvailable()) window.localStorage.setItem(name, value);
    } catch {
      /* quota or access error: keep the in-memory copy */
    }
  },
  removeItem: (name) => {
    memory.delete(name);
    try {
      if (storageAvailable()) window.localStorage.removeItem(name);
    } catch {
      /* ignore */
    }
  },
};
