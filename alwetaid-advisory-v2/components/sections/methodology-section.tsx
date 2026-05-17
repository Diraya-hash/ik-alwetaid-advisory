"use client";

import { motion } from "framer-motion";
import { Section, SectionEyebrow, SectionTitle } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { methodology } from "@/lib/content";

export function MethodologySection() {
  return (
    <Section>
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 mb-16">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionEyebrow>The Approach</SectionEyebrow>
            <SectionTitle>
              I don't sell training.
              <br />
              <em className="font-normal text-emerald">I build the systems</em>
              <br />
              that produce capability.
            </SectionTitle>
          </Reveal>
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <Reveal delay={0.1}>
            <p className="text-base lg:text-lg text-ink-500 leading-relaxed">
              Most capability problems are misdiagnosed as training problems. The work
              of a serious advisor is upstream — clarifying what the business needs the
              workforce to do, designing the architecture to build it, and embedding
              the governance that sustains it.
            </p>
            <p className="mt-5 text-base lg:text-lg text-ink-500 leading-relaxed">
              Every engagement follows four disciplined phases.
            </p>
          </Reveal>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-px bg-emerald/10 rounded-xl overflow-hidden border border-emerald/10">
        {methodology.map((phase, i) => (
          <motion.div
            key={phase.phase}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="bg-canvas-card p-8 lg:p-10 group"
          >
            <div className="flex items-baseline gap-3 mb-6">
              <span className="font-mono text-[11px] text-emerald/50 tracking-wider">
                {phase.phase}
              </span>
              <span className="h-px w-8 bg-emerald/20" />
            </div>
            <h3 className="font-display text-2xl lg:text-[26px] font-medium text-emerald leading-none tracking-tight mb-4">
              {phase.title}
            </h3>
            <p className="text-[14px] text-ink-500 leading-relaxed">
              {phase.description}
            </p>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
