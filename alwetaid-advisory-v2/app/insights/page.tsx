import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ClosingCTA } from "@/components/sections/closing-cta";
import { insights } from "@/lib/content";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Writing on capability, talent, leadership, and the discipline of building organizational depth.",
};

export default function InsightsPage() {
  const [featured, ...rest] = insights;

  return (
    <main>
      <PageHero
        eyebrow="Insights"
        title={
          <>
            Writing on the function.{" "}
            <em className="font-normal text-emerald">And the craft.</em>
          </>
        }
        description="Notes from the practice. Frameworks, point of view, and the occasional argument with the conventional wisdom of HR."
      />

      <Section>
        {/* Featured */}
        <Reveal>
          <Link
            href="/insights"
            className="group block bg-emerald text-canvas rounded-2xl p-10 lg:p-14 mb-12 relative overflow-hidden hover:shadow-elevated transition-shadow"
          >
            <div className="absolute inset-0 grain pointer-events-none opacity-30" />
            <div className="relative grid lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8">
                <p className="text-[11px] uppercase tracking-[0.22em] text-sand-300 font-medium mb-6 inline-flex items-center gap-2">
                  <span className="h-px w-6 bg-sand-300/60" />
                  Featured · {featured.category}
                </p>
                <h2 className="font-display text-display-md font-medium leading-[1.05] tracking-tighter mb-5">
                  {featured.title}
                </h2>
                <p className="text-[15px] text-canvas/75 leading-relaxed max-w-xl">
                  {featured.excerpt}
                </p>
              </div>
              <div className="lg:col-span-4 lg:text-right flex lg:flex-col lg:items-end justify-between lg:justify-end gap-4">
                <div className="text-[12px] text-canvas/60 space-y-1">
                  <div>{featured.date}</div>
                  <div className="font-mono">{featured.readTime}</div>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-canvas/20 group-hover:bg-canvas/10 transition-colors">
                  <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
                </span>
              </div>
            </div>
          </Link>
        </Reveal>

        {/* Rest grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rest.map((insight, i) => (
            <Reveal key={insight.slug} delay={i * 0.05}>
              <Link
                href="/insights"
                className="group block bg-canvas-card border border-emerald/10 rounded-2xl p-7 hover:border-emerald/25 hover:shadow-soft transition-all h-full"
              >
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-400 mb-7">
                  <span>{insight.category}</span>
                  <span className="font-mono text-ink-300">
                    {insight.readTime}
                  </span>
                </div>
                <h3 className="font-display text-[22px] font-medium text-ink leading-tight tracking-tight mb-4">
                  {insight.title}
                </h3>
                <p className="text-[13.5px] text-ink-500 leading-relaxed mb-8">
                  {insight.excerpt}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-emerald/10">
                  <span className="text-[12px] text-ink-400">
                    {insight.date}
                  </span>
                  <ArrowUpRight
                    className="h-4 w-4 text-ink-300 group-hover:text-emerald transition-colors"
                    strokeWidth={1.75}
                  />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Section>

      <ClosingCTA />
    </main>
  );
}
