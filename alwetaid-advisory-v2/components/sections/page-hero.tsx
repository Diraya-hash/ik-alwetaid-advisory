"use client";

import { motion } from "framer-motion";

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
}

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative pt-24 lg:pt-32 pb-16 lg:pb-20 overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-1/2 sand-glow pointer-events-none opacity-60" />

      <div className="relative max-w-6xl mx-auto px-6 lg:px-10">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-8 inline-flex items-center gap-2"
        >
          <span className="h-px w-6 bg-emerald/40" />
          {eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="font-display font-medium text-display-lg text-ink leading-[1.02] tracking-tightest max-w-4xl"
        >
          {title}
        </motion.h1>

        {description && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="mt-8 text-lg text-ink-500 leading-relaxed max-w-2xl"
          >
            {description}
          </motion.p>
        )}
      </div>
    </section>
  );
}
