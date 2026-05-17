"use client";

import { motion } from "framer-motion";
import { Section, SectionEyebrow, SectionTitle } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { valuePillars } from "@/lib/content";

export function WhyWorkSection() {
  return (
    <Section>
      <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 mb-16">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionEyebrow>Why this engagement</SectionEyebrow>
            <SectionTitle>
              The difference between
              <br />
              <em className="font-normal text-emerald">a consultant and a counsel.</em>
            </SectionTitle>
          </Reveal>
        </div>
        <div className="lg:col-span-7">
          <ul className="space-y-1">
            {valuePillars.map((pillar, i) => (
              <motion.li
                key={pillar.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="grid grid-cols-12 gap-6 py-8 border-b border-emerald/10 last:border-0"
              >
                <div className="col-span-12 sm:col-span-1">
                  <span className="font-mono text-[11px] text-emerald/40 tracking-wider">
                    0{i + 1}
                  </span>
                </div>
                <div className="col-span-12 sm:col-span-11">
                  <h3 className="font-display text-xl lg:text-2xl font-medium text-ink leading-tight tracking-tight mb-2">
                    {pillar.title}
                  </h3>
                  <p className="text-[14.5px] text-ink-500 leading-relaxed max-w-2xl">
                    {pillar.description}
                  </p>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}
