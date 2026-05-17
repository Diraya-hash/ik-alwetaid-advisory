"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { faqs } from "@/lib/content";

export function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="divide-y divide-emerald/10 border-y border-emerald/10">
      {faqs.map((faq, i) => {
        const open = openIdx === i;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenIdx(open ? null : i)}
              className={cn(
                "w-full flex items-start justify-between gap-6 py-6 lg:py-8 text-left transition-colors group",
                "hover:text-emerald"
              )}
            >
              <div className="flex items-baseline gap-4 flex-1 min-w-0">
                <span className="font-mono text-[11px] text-emerald/40 tracking-wider shrink-0 mt-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3
                  className={cn(
                    "font-display text-xl lg:text-[26px] font-medium leading-tight tracking-tight transition-colors",
                    open ? "text-emerald" : "text-ink group-hover:text-emerald"
                  )}
                >
                  {faq.q}
                </h3>
              </div>
              <span
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all shrink-0 mt-0.5",
                  open
                    ? "border-emerald bg-emerald text-canvas"
                    : "border-emerald/20 text-emerald group-hover:border-emerald/40"
                )}
              >
                {open ? (
                  <Minus className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                )}
              </span>
            </button>

            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-8 lg:pb-10 pl-9 lg:pl-12 pr-12 max-w-3xl">
                    <p className="text-[15px] lg:text-[16px] text-ink-500 leading-[1.75]">
                      {faq.a}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
