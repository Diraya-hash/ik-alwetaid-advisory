"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Section, SectionEyebrow, SectionTitle } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { caseStudies } from "@/lib/content";

export function FeaturedCaseSection() {
  const featured = caseStudies[0];

  return (
    <Section tone="dark" className="text-canvas">
      <div className="absolute inset-0 grain pointer-events-none opacity-30" />

      <div className="relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 mb-16">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="text-[11px] uppercase tracking-[0.22em] text-sand-300 font-medium mb-5 inline-flex items-center gap-2">
                <span className="h-px w-6 bg-sand-300/60" />
                Featured Engagement
              </p>
              <h2 className="font-display text-display-md font-medium leading-tight tracking-tighter">
                {featured.title}
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal delay={0.1}>
              <div className="space-y-6 text-[15px] leading-relaxed text-canvas/80">
                <p>
                  <span className="text-sand-200 font-medium">Context. </span>
                  {featured.context}
                </p>
                <p>
                  <span className="text-sand-200 font-medium">Mandate. </span>
                  {featured.mandate}
                </p>
                <p>
                  <span className="text-sand-200 font-medium">Outcome. </span>
                  {featured.outcome}
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid sm:grid-cols-3 gap-px bg-canvas/10 rounded-xl overflow-hidden">
          {featured.metric.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="bg-emerald p-8 lg:p-10"
            >
              <div className="font-display text-display-sm font-medium text-sand-200 leading-none mb-3 tracking-tight">
                {m.value}
              </div>
              <div className="text-[13px] text-canvas/65 leading-snug">
                {m.label}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center sm:text-left">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.18em] text-sand-200 hover:text-canvas link-underline"
          >
            All case studies
            <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
          </Link>
        </div>
      </div>
    </Section>
  );
}
