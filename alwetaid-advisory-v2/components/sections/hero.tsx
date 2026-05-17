"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative pt-28 lg:pt-36 pb-24 lg:pb-32 overflow-hidden">
      {/* Atmospheric sand glow at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 sand-glow pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        {/* Status line */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-10"
        >
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald opacity-60 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald" />
            </span>
            Accepting engagements · Q3 2026
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-medium text-display-xl text-ink leading-[0.95] tracking-tightest max-w-5xl"
        >
          Workforce capability,
          <br />
          <span className="italic font-normal text-emerald">advised at the level</span>
          <br />
          it deserves.
        </motion.h1>

        {/* Subhead */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-10 text-lg lg:text-xl text-ink-500 leading-relaxed max-w-2xl"
        >
          Strategic counsel for CHROs and HR leaders building enduring organizational
          capability — across Learning, Talent, Succession, and Development.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-3"
        >
          <Button href="/book" size="lg" variant="primary">
            Book a consultation
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button href="/services" size="lg" variant="outline">
            Explore the practice
          </Button>
        </motion.div>

        {/* Trust line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 lg:mt-20 pt-10 border-t border-emerald/10 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6"
        >
          {[
            { value: "15+", label: "Years inside HR" },
            { value: "47", label: "Senior engagements" },
            { value: "12", label: "Tier-1 institutions" },
            { value: "3", label: "Government entities" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-3xl lg:text-4xl font-medium text-emerald leading-none tracking-tighter mb-2">
                {stat.value}
              </div>
              <div className="text-[12px] text-ink-400 leading-snug">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
