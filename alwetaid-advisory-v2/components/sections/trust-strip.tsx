"use client";

import { Reveal } from "@/components/ui/reveal";
import { clientSectors } from "@/lib/content";

export function TrustStrip() {
  return (
    <section className="py-14 lg:py-16 border-y border-emerald/10 bg-canvas-subtle/40">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-14">
            <p className="text-[11px] uppercase tracking-[0.22em] text-ink-400 font-medium shrink-0 max-w-[180px]">
              Engagements delivered across
            </p>
            <div className="flex-1 flex flex-wrap items-center gap-x-10 gap-y-3">
              {clientSectors.map((sector, i) => (
                <span
                  key={sector}
                  className="font-display text-[18px] lg:text-[20px] text-ink-500 leading-none"
                >
                  {sector}
                  {i < clientSectors.length - 1 && (
                    <span className="text-emerald/20 ml-10 hidden lg:inline">·</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
