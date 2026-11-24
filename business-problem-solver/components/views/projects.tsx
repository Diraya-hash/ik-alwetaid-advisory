"use client";

import { Copy, Download, FolderKanban, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { StorageNotice } from "@/components/layout/storage-status";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { EmptyState, PageHeader } from "@/components/ui/primitives";
import { downloadFile, useWorkspace } from "@/store/workspace";
import { ProjectCard } from "./project-card";

export const fileSlug = (s: string) => (s || "project").replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 48) || "project";

export function ProjectsView() {
  const { t, href } = useI18n();
  const [q, setQ] = useState("");
  const ws = useWorkspace();
  const list = Object.values(ws.projects).sort((a, b) => b.updatedAt - a.updatedAt)
    .filter((p) => !q.trim() || `${p.title} ${p.challenge}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <div>
      <PageHeader eyebrow={t.projects.eyebrow} title={t.projects.title} lead={t.projects.lead} actions={<Button href={href("/")}><Plus className="h-4 w-4" aria-hidden />{t.projects.newProject}</Button>} />
      <div className="mb-6"><StorageNotice /></div>
      {!ws.hydrated ? <div className="h-40 animate-pulse rounded-2xl bg-surface-2" /> : Object.keys(ws.projects).length === 0 ? (
        <EmptyState icon={FolderKanban} body={t.projects.empty} action={<Button href={href("/")}>{t.projects.newProject}</Button>} />
      ) : (
        <>
          <label className="mb-5 flex max-w-sm items-center gap-2 rounded-lg border border-line-strong bg-surface px-3">
            <Search className="h-4 w-4 text-ink-subtle" aria-hidden />
            <span className="sr-only">{t.projects.search}</span>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.projects.search} className="h-10 flex-1 bg-transparent text-sm text-ink outline-none" />
          </label>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <ProjectCard key={p.id} project={p}>
                <div className="flex flex-wrap items-center gap-1">
                  <button type="button" title={t.projects.exportJson} aria-label={t.projects.exportJson} onClick={() => { const f = ws.exportProject(p.id); if (f) downloadFile(`${fileSlug(p.title)}.bps.json`, JSON.stringify(f, null, 1)); }}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"><Download className="h-4 w-4" aria-hidden /></button>
                  <button type="button" title={t.projects.duplicate} aria-label={t.projects.duplicate} onClick={() => ws.duplicateProject(p.id, t.projects.copySuffix)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-subtle hover:bg-surface-2 hover:text-ink"><Copy className="h-4 w-4" aria-hidden /></button>
                  <ConfirmButton question={t.projects.deleteQ} onConfirm={() => ws.deleteProject(p.id)} label={t.common.delete}><Trash2 className="h-4 w-4" aria-hidden /></ConfirmButton>
                </div>
              </ProjectCard>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
