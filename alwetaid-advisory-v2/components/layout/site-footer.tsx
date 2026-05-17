"use client";

import Link from "next/link";
import { Linkedin, Mail } from "lucide-react";
import { brand } from "@/lib/content";

const columns = [
  {
    title: "Practice",
    links: [
      { label: "About", href: "/about" },
      { label: "Services", href: "/services" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Insights", href: "/insights" },
    ],
  },
  {
    title: "Engage",
    links: [
      { label: "Corporate Solutions", href: "/corporate" },
      { label: "Individual Advisory", href: "/individual" },
      { label: "Book Consultation", href: "/book" },
      { label: "Frequently Asked", href: "/faq" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "Email", href: "mailto:advisory@ikalwetaid.com" },
      { label: "LinkedIn", href: "#" },
      { label: "Riyadh, KSA", href: "/contact" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative bg-emerald text-canvas mt-32">
      <div className="absolute inset-0 grain pointer-events-none opacity-30" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-10">
        {/* Top — manifesto + columns */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 pb-20">
          <div className="lg:col-span-5">
            <div className="flex items-baseline gap-2 mb-6">
              <span className="font-mono text-[11px] tracking-[0.16em] text-canvas/55 leading-none">
                IK
              </span>
              <span className="font-display text-[22px] font-medium tracking-tight leading-none">
                Alwetaid
              </span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-canvas/60 leading-none">
                Advisory
              </span>
            </div>
            <p className="font-display text-2xl lg:text-3xl leading-tight tracking-tight text-canvas/95 max-w-md">
              Strategic counsel for the workforce questions that{" "}
              <em className="text-sand-200 font-normal">matter most</em>.
            </p>
            <div className="mt-10 flex items-center gap-3">
              <a
                href="mailto:advisory@ikalwetaid.com"
                aria-label="Email"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-canvas/15 hover:bg-canvas/10 transition-colors"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-canvas/15 hover:bg-canvas/10 transition-colors"
              >
                <Linkedin className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h4 className="text-[10px] uppercase tracking-[0.22em] text-sand-300 font-medium mb-5">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-[13.5px] text-canvas/75 hover:text-canvas transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Wordmark */}
        <div className="pt-10 border-t border-canvas/10">
          <div
            aria-hidden
            className="select-none font-display font-medium text-canvas/[0.07] leading-[0.85] tracking-tighter text-center"
            style={{ fontSize: "clamp(60px, 14vw, 200px)" }}
          >
            IK ALWETAID
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-[11px] text-canvas/50">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <span>© 2026 IK Alwetaid Advisory.</span>
            <Link href="#" className="hover:text-canvas/80 transition-colors">
              Privacy
            </Link>
            <Link href="#" className="hover:text-canvas/80 transition-colors">
              Terms
            </Link>
          </div>
          <span className="font-mono tracking-wider">{brand.location}</span>
        </div>
      </div>
    </footer>
  );
}
