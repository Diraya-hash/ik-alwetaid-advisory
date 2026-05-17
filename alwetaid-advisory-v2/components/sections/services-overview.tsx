"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { Section, SectionEyebrow, SectionTitle } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";

const offerings = [
  {
    icon: Building2,
    label: "Corporate Solutions",
    href: "/corporate",
    headline: "For organizations building capability at scale.",
    description:
      "Twelve advisory engagements across Learning, Talent, Succession, and Performance — designed for HR leaders managing complex capability portfolios.",
    services: [
      "Learning & Development Strategy",
      "Talent Development",
      "Leadership Programs",
      "Capability Frameworks",
      "Succession Architecture",
      "Internal Academy Design",
    ],
  },
  {
    icon: UserRound,
    label: "Individual Advisory",
    href: "/individual",
    headline: "For senior professionals making the next move.",
    description:
      "Confidential advisory for executives and senior practitioners — from career strategy to interview preparation. Discreet, structured, and grounded in fifteen years inside the function.",
    services: [
      "Career Progression Advisory",
      "Executive Career Coaching",
      "Interview Preparation",
      "CV & LinkedIn Positioning",
      "Career Growth Strategy",
      "Leadership Presence",
    ],
  },
];

export function ServicesOverview() {
  return (
    <Section tone="subtle">
      <div className="mb-16">
        <Reveal>
          <SectionEyebrow>The Practice</SectionEyebrow>
          <SectionTitle>
            Two practices.
            <br />
            <em className="font-normal text-emerald">One discipline.</em>
          </SectionTitle>
        </Reveal>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {offerings.map((o, i) => {
          const Icon = o.icon;
          return (
            <motion.div
              key={o.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
            >
              <Link
                href={o.href}
                className="group block bg-canvas-card border border-emerald/10 rounded-2xl p-8 lg:p-10 hover:border-emerald/25 hover:shadow-elevated transition-all h-full"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <ArrowUpRight
                    className="h-4 w-4 text-ink-300 group-hover:text-emerald group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                    strokeWidth={2}
                  />
                </div>

                <p className="text-[10px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-3">
                  {o.label}
                </p>
                <h3 className="font-display text-display-sm font-medium text-ink leading-tight tracking-tight mb-4 max-w-md">
                  {o.headline}
                </h3>
                <p className="text-[14.5px] text-ink-500 leading-relaxed mb-8 max-w-md">
                  {o.description}
                </p>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 pt-6 border-t border-emerald/10">
                  {o.services.map((s) => (
                    <li
                      key={s}
                      className="flex items-center gap-2 text-[13px] text-ink-500"
                    >
                      <span className="h-1 w-1 rounded-full bg-emerald/50" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
}
