"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Section, SectionEyebrow, SectionTitle } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { insights } from "@/lib/content";

export function FeaturedInsights() {
  const featured = insights.slice(0, 3);

  return (
    <Section>
      <div className="flex items-end justify-between gap-8 mb-16 flex-wrap">
        <div>
          <Reveal>
            <SectionEyebrow>Insights</SectionEyebrow>
            <SectionTitle>
              Recent thinking on capability,
              <br />
              <em className="font-normal text-emerald">talent, and the function.</em>
            </SectionTitle>
          </Reveal>
        </div>
        <Link
          href="/insights"
          className="text-[13px] uppercase tracking-[0.18em] text-emerald hover:text-emerald-600 link-underline inline-flex items-center gap-2"
        >
          All insights
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {featured.map((insight, i) => (
          <motion.div
            key={insight.slug}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.08 }}
          >
            <Link
              href={`/insights`}
              className="group block bg-canvas-card border border-emerald/10 rounded-2xl p-7 hover:border-emerald/25 hover:shadow-soft transition-all h-full"
            >
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-ink-400 mb-7">
                <span>{insight.category}</span>
                <span className="font-mono text-ink-300">{insight.readTime}</span>
              </div>

              <h3 className="font-display text-[22px] lg:text-[24px] font-medium text-ink leading-tight tracking-tight mb-4">
                {insight.title}
              </h3>
              <p className="text-[14px] text-ink-500 leading-relaxed mb-8">
                {insight.excerpt}
              </p>

              <div className="flex items-center justify-between pt-6 border-t border-emerald/10">
                <span className="text-[12px] text-ink-400">{insight.date}</span>
                <ArrowUpRight
                  className="h-4 w-4 text-ink-300 group-hover:text-emerald group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                  strokeWidth={1.75}
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
