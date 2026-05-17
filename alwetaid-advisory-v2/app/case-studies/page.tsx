import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ClosingCTA } from "@/components/sections/closing-cta";
import { caseStudies } from "@/lib/content";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Selected engagements across Saudi enterprise — financial services, government, and industrial. All clients anonymized unless they have elected to be named.",
};

export default function CaseStudiesPage() {
  return (
    <main>
      <PageHero
        eyebrow="Case Studies"
        title={
          <>
            Selected engagements.{" "}
            <em className="font-normal text-emerald">Anonymized by default.</em>
          </>
        }
        description="A small sample of recent work. Each case is documented with permission and identifying details adjusted to honor confidentiality. The artifacts and methodology are real; the names are not always."
      />

      <Section>
        <div className="space-y-24 lg:space-y-32">
          {caseStudies.map((c, idx) => (
            <Reveal key={c.slug}>
              <article className="grid lg:grid-cols-12 gap-10 lg:gap-16">
                {/* Index + sector */}
                <div className="lg:col-span-3">
                  <div className="lg:sticky lg:top-28">
                    <div className="flex items-baseline gap-3 mb-5">
                      <span className="font-mono text-[11px] text-emerald/40 tracking-wider">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <span className="h-px w-8 bg-emerald/20" />
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-2">
                      {c.sector}
                    </p>
                    <p className="text-[13.5px] text-ink-400 leading-relaxed">
                      {c.client}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-9">
                  <h2 className="font-display text-display-sm lg:text-display-md font-medium text-ink leading-tight tracking-tighter mb-10 max-w-3xl">
                    {c.title}
                  </h2>

                  <div className="grid sm:grid-cols-3 gap-px bg-emerald/10 rounded-xl overflow-hidden mb-12 border border-emerald/10">
                    {c.metric.map((m) => (
                      <div key={m.label} className="bg-canvas-card p-6 lg:p-7">
                        <div className="font-display text-3xl lg:text-4xl font-medium text-emerald leading-none mb-2.5 tracking-tighter">
                          {m.value}
                        </div>
                        <div className="text-[12px] text-ink-400 leading-snug">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-6 text-[15.5px] leading-[1.75] text-ink-500 max-w-2xl">
                    <p>
                      <span className="text-emerald font-medium">Context. </span>
                      {c.context}
                    </p>
                    <p>
                      <span className="text-emerald font-medium">Mandate. </span>
                      {c.mandate}
                    </p>
                    <p>
                      <span className="text-emerald font-medium">Approach. </span>
                      {c.approach}
                    </p>
                    <p>
                      <span className="text-emerald font-medium">Outcome. </span>
                      {c.outcome}
                    </p>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Section>

      <ClosingCTA />
    </main>
  );
}
