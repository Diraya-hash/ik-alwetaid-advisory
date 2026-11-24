"use client";

import { GitCompare, History, Save } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui/primitives";
import { diff, type Change } from "@/engine/history";
import type { Project, Version } from "@/engine/project";
import type { ApproachId } from "@/engine/types";
import { useLabels } from "@/lib/labels";
import { useWorkspace } from "@/store/workspace";

export function useVersionLabel() {
  const { t } = useI18n();
  const L = useLabels();
  const labels = t.history.labels as Record<string, string>;
  return (v: Version) => {
    if (v.label.startsWith("framework added: ")) return `${labels["framework added"]}: ${L.framework(v.label.slice(17) as ApproachId)}`;
    return labels[v.label] ?? v.label;
  };
}

function ChangeList({ changes }: { changes: Change[] }) {
  const { t, f } = useI18n();
  if (!changes.length) return <p className="text-[13px] text-ink-subtle">{t.history.noChanges}</p>;
  const tone = { added: "primary", removed: "danger", changed: "gold" } as const;
  return (
    <div>
      <p className="mb-2 text-[12.5px] text-ink-subtle">{f(t.history.changes, { n: changes.length })}</p>
      <ul className="divide-y divide-line rounded-lg border border-line">
        {changes.slice(0, 80).map((c, n) => (
          <li key={n} className="flex flex-col gap-1 p-2.5 text-[13px] sm:flex-row sm:items-start sm:gap-3">
            <span className="flex shrink-0 gap-1.5"><Badge tone={tone[c.kind]}>{t.history.change[c.kind]}</Badge><Badge>{(t.history.areas as Record<string, string>)[c.area] ?? c.area}</Badge></span>
            <span className="min-w-0 flex-1 text-ink">
              <span className="font-medium">{c.label}</span>
              {c.kind === "changed" && <span className="block break-words text-[12px] text-ink-subtle"><span className="line-through">{c.before}</span> → {c.after}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HistoryView({ project: p }: { project: Project }) {
  const { t, date } = useI18n();
  const versions = useWorkspace((s) => s.versions[p.id] ?? []);
  const saveVersion = useWorkspace((s) => s.saveVersion);
  const restoreVersion = useWorkspace((s) => s.restoreVersion);
  const label = useVersionLabel();
  const [name, setName] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const list = [...versions].reverse();
  const time = (ts: number) => `${date(ts)} ${new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle hint={t.history.lead}>{t.history.title}</SectionTitle>
        <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); saveVersion(p.id, name.trim() || t.history.kinds.manual, "manual"); setName(""); setMsg(t.history.saved); }}>
          <input aria-label={t.history.labelPlaceholder} placeholder={t.history.labelPlaceholder} value={name} onChange={(e) => setName(e.target.value)} className="field h-10 max-w-sm" />
          <Button type="submit"><Save className="h-4 w-4" aria-hidden />{t.history.save}</Button>
        </form>
        {msg && <p role="status" className="mt-2 text-[13px] text-primary">{msg}</p>}
      </Card>
      {list.length === 0 ? <EmptyState icon={History} body={t.history.empty} /> : (
        <ol className="space-y-3">
          {list.map((v) => (
            <li key={v.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-ink">{label(v)}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-ink-subtle"><Badge tone={v.kind === "manual" ? "primary" : v.kind === "milestone" ? "gold" : "neutral"}>{t.history.kinds[v.kind]}</Badge>{time(v.at)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" aria-expanded={open === v.id} onClick={() => setOpen(open === v.id ? null : v.id)}><GitCompare className="h-3.5 w-3.5" aria-hidden />{open === v.id ? t.history.hide : t.history.compare}</Button>
                  <ConfirmButton variant="secondary" question={t.history.restoreQ} onConfirm={() => { restoreVersion(p.id, v.id, "before restore"); setMsg(t.history.restored); setOpen(null); }}>{t.history.restore}</ConfirmButton>
                </div>
              </div>
              {open === v.id && <div className="mt-4"><ChangeList changes={diff(v.snapshot, p)} /></div>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
