"use client";

import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/views/project-card";
import { useWorkspace } from "@/store/workspace";

const MIN = 20;

export function HomeView() {
  const { t, f, href } = useI18n();
  const router = useRouter();
  const id = useId();
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const create = useWorkspace((s) => s.createProject);
  const hydrated = useWorkspace((s) => s.hydrated);
  const projects = useWorkspace((s) => s.projects);
  const recent = Object.values(projects).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 3);
  const tooShort = text.trim().length < MIN;

  const start = () => {
    setTouched(true);
    if (tooShort) return;
    const pid = create(text);
    router.push(href(`/project?id=${pid}`));
  };

  return (
    <div className="space-y-14">
      <section className="relative">
        <p className="eyebrow mb-4">{t.home.eyebrow}</p>
        <h1 className="max-w-3xl text-display-lg text-ink">{t.home.title}</h1>
        <div className="rule-gold my-6 max-w-xs" />
        <p className="max-w-2xl text-[16px] leading-relaxed text-ink-muted">{t.home.lead}</p>
        <p className="mt-3 max-w-2xl font-display text-[15px] italic text-gold-text">“{t.brand.promise}”</p>

        <div className="card mt-8 p-5 lg:p-7">
          <label htmlFor={id} className="mb-2 block text-[14px] font-semibold text-ink">{t.home.composerLabel}</label>
          <p className="mb-3 text-[13px] text-ink-subtle">{t.home.composerHint}</p>
          <textarea id={id} value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder={t.home.composerPlaceholder}
            aria-describedby={touched && tooShort ? `${id}-err` : undefined} aria-invalid={touched && tooShort}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) start(); }}
            className="field min-h-[9rem] resize-y text-[15px] leading-relaxed" />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            {touched && tooShort ? <p id={`${id}-err`} className="text-[13px] text-danger">{f(t.home.tooShort, { n: MIN })}</p> : <span />}
            <Button size="lg" onClick={start}>{t.home.start}<ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden /></Button>
          </div>
          <div className="mt-6 border-t border-line pt-5">
            <p className="mb-3 text-[12.5px] font-medium text-ink-subtle">{t.home.examplesTitle}</p>
            <div className="grid gap-2 md:grid-cols-3">
              {t.home.examples.map((ex) => (
                <button key={ex} type="button" onClick={() => { setText(ex); setTouched(false); }}
                  className="rounded-xl border border-line bg-surface-2 p-3 text-start text-[13px] leading-snug text-ink-muted transition-colors hover:border-primary/40 hover:text-ink">
                  {ex}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-5 flex items-start gap-2 text-[12px] text-ink-subtle"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" aria-hidden />{t.home.mode}</p>
        </div>
      </section>

      {hydrated && recent.length > 0 && (
        <section aria-labelledby="recent">
          <div className="mb-4 flex items-end justify-between">
            <h2 id="recent" className="text-display-sm text-ink">{t.home.recent}</h2>
            <Link href={href("/projects")} className="text-[13px] font-medium text-primary hover:underline">{t.home.allProjects}</Link>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">{recent.map((p) => <ProjectCard key={p.id} project={p} />)}</ul>
        </section>
      )}

      <section aria-labelledby="how">
        <h2 id="how" className="mb-6 text-display-sm text-ink">{t.home.howTitle}</h2>
        <ol className="grid gap-4 md:grid-cols-4">
          {t.home.how.map((s, i) => (
            <li key={s.title} className="card p-5">
              <span className="num mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gold-soft text-[13px] font-semibold text-gold-text">{i + 1}</span>
              <h3 className="mb-1 text-[15px] font-semibold text-ink">{s.title}</h3>
              <p className="text-[13.5px] leading-relaxed text-ink-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="overflow-hidden rounded-2xl bg-deep p-7 text-deep-fg lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-on-deep">{t.library.eyebrow}</p>
            <h2 className="text-display-sm">{t.home.libraryTitle}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-deep-fg/85">{t.home.libraryBody}</p>
          </div>
          <Link href={href("/library")} className="inline-flex h-11 items-center gap-2 self-start rounded-lg bg-gold-on-deep px-5 text-[14px] font-semibold text-deep hover:opacity-90">
            <BookOpen className="h-4 w-4" aria-hidden />{t.home.libraryCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
