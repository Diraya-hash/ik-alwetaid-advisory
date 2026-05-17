"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Service } from "@/lib/content";
import { cn } from "@/lib/utils";

interface ServiceDetailLayoutProps {
  services: Service[];
  ctaHref: string;
  ctaLabel: string;
}

export function ServiceDetailLayout({
  services,
  ctaHref,
  ctaLabel,
}: ServiceDetailLayoutProps) {
  const [activeSlug, setActiveSlug] = useState<string>(services[0]?.slug ?? "");

  // Highlight section in sticky index as user scrolls
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    services.forEach((s) => {
      const el = document.getElementById(s.slug);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSlug(s.slug);
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [services]);

  return (
    <section className="relative py-16 lg:py-24">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Sticky index */}
          <aside className="lg:col-span-4">
            <div className="lg:sticky lg:top-28">
              <p className="text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-6">
                Engagements
              </p>
              <nav>
                <ul className="space-y-0.5">
                  {services.map((s, i) => (
                    <li key={s.slug}>
                      <a
                        href={`#${s.slug}`}
                        className={cn(
                          "group flex items-baseline gap-3 py-2.5 text-[14px] transition-colors",
                          activeSlug === s.slug
                            ? "text-emerald font-medium"
                            : "text-ink-500 hover:text-emerald"
                        )}
                      >
                        <span className="font-mono text-[10px] text-emerald/40 tracking-wider w-6 shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="tracking-tight">{s.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-10 pt-8 border-t border-emerald/10">
                <Button href={ctaHref} variant="primary" className="w-full">
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </aside>

          {/* Content */}
          <div className="lg:col-span-8 space-y-20 lg:space-y-24">
            {services.map((s, i) => (
              <motion.article
                id={s.slug}
                key={s.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-120px" }}
                transition={{ duration: 0.6 }}
                className="scroll-mt-28"
              >
                <div className="flex items-baseline gap-3 mb-5">
                  <span className="font-mono text-[11px] text-emerald/40 tracking-wider">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="h-px w-8 bg-emerald/20" />
                </div>

                <h2 className="font-display text-display-sm lg:text-display-md font-medium text-ink leading-tight tracking-tighter mb-5">
                  {s.name}
                </h2>

                <p className="font-display italic text-xl lg:text-2xl text-emerald leading-snug mb-8 max-w-2xl">
                  {s.short}
                </p>

                <p className="text-base lg:text-[17px] text-ink-500 leading-[1.7] max-w-2xl mb-10">
                  {s.detail}
                </p>

                <div className="pt-8 border-t border-emerald/10">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-4">
                    Typical outcomes
                  </p>
                  <ul className="space-y-2.5 max-w-2xl">
                    {s.outcomes.map((o) => (
                      <li
                        key={o}
                        className="flex items-start gap-3 text-[14.5px] text-ink-500"
                      >
                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-emerald/50" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
