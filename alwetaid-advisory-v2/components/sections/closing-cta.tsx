"use client";

import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";

export function ClosingCTA() {
  return (
    <section className="relative py-24 lg:py-36 overflow-hidden bg-canvas-subtle">
      <div className="absolute inset-x-0 top-0 h-px divider-fade" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 sand-glow pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-6 lg:px-10 text-center">
        <Reveal>
          <p className="text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-8 inline-flex items-center gap-2">
            <span className="h-px w-6 bg-emerald/40" />
            Begin a conversation
            <span className="h-px w-6 bg-emerald/40" />
          </p>

          <h2 className="font-display text-display-lg font-medium text-ink leading-[1.02] tracking-tightest">
            If you're considering a
            <br />
            major capability investment,
            <br />
            <em className="font-normal text-emerald">start with a conversation.</em>
          </h2>

          <p className="mt-10 text-base lg:text-lg text-ink-500 max-w-xl mx-auto leading-relaxed">
            No deck. No pitch. Thirty minutes to understand the question you're
            actually trying to answer.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button href="/book" size="lg" variant="primary">
              Book a consultation
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button href="/contact" size="lg" variant="ghost">
              Or send a direct note
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
