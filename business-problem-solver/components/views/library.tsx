"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui/primitives";
import { FRAMEWORKS, LATER, hasBuilder } from "@/content/frameworks";
import { DOMAIN_LABEL, STAGE_LABEL } from "@/content/taxonomy";
import { DOMAIN_AFFINITY, FAMILY, PRECONDITIONS, STAGE_FIT } from "@/engine/catalogue";
import { APPROACH_IDS, STAGES, type ApproachId, type Domain } from "@/engine/types";
import { useLabels } from "@/lib/labels";

function Status({ id }: { id: ApproachId }) {
  const { t } = useI18n();
  if (LATER.includes(id)) return <Badge>{t.library.later}</Badge>;
  if (hasBuilder(id)) return <Badge tone="primary">{t.library.interactive}</Badge>;
  return <Badge tone="gold">{t.library.detailOnly}</Badge>;
}

export function LibraryView() {
  const { t, l, href } = useI18n();
  const families = [...new Set(APPROACH_IDS.map((a) => FAMILY[a]))];
  return (
    <div>
      <PageHeader eyebrow={t.library.eyebrow} title={t.library.title} lead={t.library.lead} />
      <div className="space-y-10">
        {families.map((fam) => (
          <section key={fam} aria-labelledby={`fam-${fam}`}>
            <h2 id={`fam-${fam}`} className="mb-4 text-display-sm text-ink">{(t.library.families as Record<string, string>)[fam]}</h2>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {APPROACH_IDS.filter((a) => FAMILY[a] === fam).map((a) => (
                <li key={a} className="card flex flex-col p-5">
                  <Status id={a} />
                  <h3 className="mt-3 font-display text-[1.15rem] text-ink">{l(FRAMEWORKS[a].name)}</h3>
                  <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-ink-muted">{l(FRAMEWORKS[a].purpose)}</p>
                  <Link href={href(`/library/${a}`)} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline">{t.common.learnMore}<ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden /></Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

export function FrameworkDetailView({ id }: { id: ApproachId }) {
  const { t, l, href } = useI18n();
  const L = useLabels();
  const fw = FRAMEWORKS[id];
  const stages = STAGES.filter((s) => STAGE_FIT[id][s] >= 0.6);
  const domains = Object.entries(DOMAIN_AFFINITY[id]).filter(([, v]) => v >= 0.6).sort((a, b) => b[1] - a[1]).map(([d]) => d as Domain);
  return (
    <div>
      <Link href={href("/library")} className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-muted hover:text-primary"><ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />{t.library.back}</Link>
      <PageHeader eyebrow={(t.library.families as Record<string, string>)[FAMILY[id]] ?? ""} title={l(fw.name)} lead={l(fw.purpose)} actions={<Status id={id} />} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><SectionTitle>{t.library.useWhen}</SectionTitle><ul className="list-disc space-y-2 ps-5 text-[14px] text-ink">{fw.useWhen.map((x, n) => <li key={n}>{l(x)}</li>)}</ul></Card>
        <Card><SectionTitle>{t.library.avoidWhen}</SectionTitle><ul className="list-disc space-y-2 ps-5 text-[14px] text-ink">{fw.avoidWhen.map((x, n) => <li key={n}>{l(x)}</li>)}</ul></Card>
        <Card><SectionTitle>{t.library.output}</SectionTitle><p className="text-[14px] text-ink">{l(fw.output)}</p></Card>
        <Card>
          <SectionTitle>{t.library.stagesTitle}</SectionTitle>
          <div className="flex flex-wrap gap-2">{stages.map((s) => <Badge key={s} tone="gold">{l(STAGE_LABEL[s].label)}</Badge>)}</div>
          {domains.length > 0 && (<><p className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wide text-ink-subtle">{t.library.bestFor}</p>
            <div className="flex flex-wrap gap-2">{domains.map((d) => <Badge key={d} tone="primary">{l(DOMAIN_LABEL[d])}</Badge>)}</div></>)}
          {PRECONDITIONS[id].length > 0 && <ul className="mt-5 space-y-1 text-[13px] text-ink-muted">{PRECONDITIONS[id].map(([slot]) => <li key={slot}>• {L.reason({ kind: "caution", code: `pre.${slot}` })}</li>)}</ul>}
        </Card>
      </div>
    </div>
  );
}
