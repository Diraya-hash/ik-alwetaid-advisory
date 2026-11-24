"use client";
// Local-first workspace store: autosave to this browser, version history, automatic backup and recovery,
// JSON import/export. Nothing is sent anywhere; there is no cloud sync in M1.
import { create } from "zustand";
import { safeStorage, storageAvailable } from "./storage";
import {
  SCHEMA_VERSION, exportFileSchema, newId, newProject, trimVersions, workspaceSchema,
  type ExportFile, type Project, type Version, type Workspace,
} from "@/engine/project";

export const KEY = "bps.workspace.v1";
export const BACKUP_KEY = "bps.workspace.v1.backup";
const AUTO_VERSION_MS = 15 * 60 * 1000;
const BACKUP_MS = 60 * 60 * 1000;
const SAVE_DEBOUNCE_MS = 300;

export type Recovery = { kind: "restored_backup" | "reset"; quarantineKey: string } | null;
type SaveState = "idle" | "saving" | "saved" | "error";

interface State extends Workspace {
  hydrated: boolean;
  persistent: boolean;
  recovery: Recovery;
  saveState: SaveState;
  lastSavedAt: number | null;
  backupAt: number | null;
  init: () => void;
  createProject: (challenge: string) => string;
  updateProject: (id: string, fn: (p: Project) => void, milestone?: string) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string, suffix: string) => string | null;
  saveVersion: (id: string, label: string, kind?: Version["kind"]) => void;
  restoreVersion: (id: string, versionId: string, label: string) => void;
  exportProject: (id: string) => ExportFile | null;
  exportWorkspace: () => ExportFile;
  importFile: (raw: unknown) => { ok: true; imported: number } | { ok: false; error: string };
  restoreBackup: () => boolean;
  deleteAll: () => void;
  dismissRecovery: () => void;
}

const emptyWorkspace = (): Workspace => ({ schema: SCHEMA_VERSION, projects: {}, versions: {} });
const snapshot = (s: Workspace): Workspace => ({ schema: SCHEMA_VERSION, projects: s.projects, versions: s.versions });
const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T;

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function readBackup(): { at: number; data: Workspace } | null {
  try {
    const raw = safeStorage.getItem(BACKUP_KEY) as string | null;
    if (!raw) return null;
    const b = JSON.parse(raw) as { at: number; data: unknown };
    const parsed = workspaceSchema.safeParse(b.data);
    return parsed.success ? { at: b.at, data: parsed.data } : null;
  } catch {
    return null;
  }
}

export const useWorkspace = create<State>()((set, get) => {
  /** Writes now; refreshes the hourly backup from the previously saved copy. */
  const write = () => {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    try {
        const prev = safeStorage.getItem(KEY) as string | null;
        const backupAt = get().backupAt;
        if (prev && (!backupAt || Date.now() - backupAt > BACKUP_MS) && workspaceSchema.safeParse(JSON.parse(prev)).success) {
          const at = Date.now();
          safeStorage.setItem(BACKUP_KEY, JSON.stringify({ at, data: JSON.parse(prev) }));
          set({ backupAt: at });
        }
        safeStorage.setItem(KEY, JSON.stringify(snapshot(get())));
        set({ saveState: "saved", lastSavedAt: Date.now() });
      } catch {
        set({ saveState: "error" });
      }
  };
  /** Debounced autosave for typing; important actions pass immediate = true. Pending saves flush when the page is hidden. */
  const persist = (immediate = false) => {
    set({ saveState: "saving" });
    if (immediate) return write();
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(write, SAVE_DEBOUNCE_MS);
  };
  const flush = () => { if (saveTimer) write(); };

  const pushVersion = (versions: Record<string, Version[]>, p: Project, label: string, kind: Version["kind"]) => {
    const list = [...(versions[p.id] ?? []), { id: newId("v"), at: Date.now(), label, kind, snapshot: clone(p) }];
    return { ...versions, [p.id]: trimVersions(list) };
  };

  return {
    ...emptyWorkspace(),
    hydrated: false,
    persistent: true,
    recovery: null,
    saveState: "idle",
    lastSavedAt: null,
    backupAt: null,

    init: () => {
      if (get().hydrated) return;
      if (typeof window !== "undefined") {
        window.addEventListener("pagehide", flush);
        document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
      }
      const persistent = storageAvailable();
      const backup = readBackup();
      let raw: string | null = null;
      try { raw = safeStorage.getItem(KEY) as string | null; } catch { raw = null; }
      if (!raw) { set({ hydrated: true, persistent, backupAt: backup?.at ?? null }); return; }
      let parsed: ReturnType<typeof workspaceSchema.safeParse> | null = null;
      try { parsed = workspaceSchema.safeParse(JSON.parse(raw)); } catch { parsed = null; }
      if (parsed?.success) { set({ ...parsed.data, hydrated: true, persistent, backupAt: backup?.at ?? null }); return; }
      // Unreadable data: quarantine it (never delete), then recover from the backup if there is one.
      const quarantineKey = `${KEY}.corrupt.${Date.now()}`;
      safeStorage.setItem(quarantineKey, raw);
      if (backup) set({ ...backup.data, hydrated: true, persistent, recovery: { kind: "restored_backup", quarantineKey }, backupAt: backup.at });
      else set({ ...emptyWorkspace(), hydrated: true, persistent, recovery: { kind: "reset", quarantineKey } });
      persist();
    },

    createProject: (challenge) => {
      const p = newProject(challenge);
      set((s) => ({ projects: { ...s.projects, [p.id]: p }, versions: pushVersion(s.versions, p, "created", "milestone") }));
      persist(true);
      return p.id;
    },

    updateProject: (id, fn, milestone) => {
      const cur = get().projects[id];
      if (!cur) return;
      const next = clone(cur);
      fn(next);
      next.updatedAt = Date.now();
      set((s) => {
        let versions = s.versions;
        const last = (versions[id] ?? []).at(-1);
        if (milestone) versions = pushVersion(versions, next, milestone, "milestone");
        else if (!last || Date.now() - last.at > AUTO_VERSION_MS) versions = pushVersion(versions, next, "autosave", "auto");
        return { projects: { ...s.projects, [id]: next }, versions };
      });
      persist(!!milestone);
    },

    deleteProject: (id) => {
      set((s) => {
        const projects = { ...s.projects }; delete projects[id];
        const versions = { ...s.versions }; delete versions[id];
        return { projects, versions };
      });
      persist(true);
    },

    duplicateProject: (id, suffix) => {
      const cur = get().projects[id];
      if (!cur) return null;
      const now = Date.now();
      const p: Project = { ...clone(cur), id: newId(), title: `${cur.title} ${suffix}`.trim(), createdAt: now, updatedAt: now };
      set((s) => ({ projects: { ...s.projects, [p.id]: p }, versions: pushVersion(s.versions, p, "created", "milestone") }));
      persist();
      return p.id;
    },

    saveVersion: (id, label, kind = "manual") => {
      const p = get().projects[id];
      if (!p) return;
      set((s) => ({ versions: pushVersion(s.versions, p, label, kind) }));
      persist();
    },

    restoreVersion: (id, versionId, label) => {
      const s = get();
      const p = s.projects[id];
      const v = (s.versions[id] ?? []).find((x) => x.id === versionId);
      if (!p || !v) return;
      const versions = pushVersion(s.versions, p, label, "before_restore");
      const restored = { ...clone(v.snapshot), id, updatedAt: Date.now() };
      set({ projects: { ...s.projects, [id]: restored }, versions });
      persist(true);
    },

    exportProject: (id) => {
      const s = get();
      const p = s.projects[id];
      if (!p) return null;
      return { app: "business-problem-solver", kind: "project", exportedAt: new Date().toISOString(), data: { schema: SCHEMA_VERSION, projects: { [id]: p }, versions: { [id]: s.versions[id] ?? [] } } };
    },

    exportWorkspace: () => ({ app: "business-problem-solver", kind: "workspace", exportedAt: new Date().toISOString(), data: snapshot(get()) }),

    importFile: (raw) => {
      const parsed = exportFileSchema.safeParse(raw);
      if (!parsed.success) return { ok: false, error: "invalid" };
      const { projects, versions } = parsed.data.data;
      let imported = 0;
      set((s) => {
        const P = { ...s.projects }, V = { ...s.versions };
        for (const [pid, p] of Object.entries(projects)) {
          // Never overwrite: an id that already exists is imported as a copy.
          const id = P[pid] ? newId() : pid;
          P[id] = { ...p, id };
          V[id] = trimVersions((versions[pid] ?? []).map((v) => ({ ...v, snapshot: { ...v.snapshot, id } })));
          imported++;
        }
        return { projects: P, versions: V };
      });
      persist(true);
      return { ok: true, imported };
    },

    restoreBackup: () => {
      const b = readBackup();
      if (!b) return false;
      safeStorage.setItem(`${KEY}.before-backup-restore.${Date.now()}`, JSON.stringify(snapshot(get())));
      set({ ...b.data });
      persist(true);
      return true;
    },

    deleteAll: () => {
      set({ ...emptyWorkspace() });
      persist(true);
    },

    dismissRecovery: () => set({ recovery: null }),
  };
});

/** Triggers a file download in the browser. */
export function downloadFile(name: string, content: string | Blob, type = "application/json") {
  const blob = typeof content === "string" ? new Blob([content], { type }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
