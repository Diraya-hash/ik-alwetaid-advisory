import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, UserRound } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ClosingCTA } from "@/components/sections/closing-cta";
import { corporateServices, individualServices } from "@/lib/content";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Advisory engagements across Learning, Talent, Succession, Performance, and Individual career advisory.",
};

export default function ServicesPage() {
  const gateways = [
    {
      icon: Building2,
      label: "Corporate Solutions",
      title: "For organizations.",
      description:
        "Twelve advisory engagements covering the full lifecycle of organizational capability — from diagnosis through governance.",
      services: corporateServices.slice(0, 6),
      href: "/corporate",
    },
    {
      icon: UserRound,
      label: "Individual Advisory",
      title: "For senior professionals.",
      description:
        "Six discreet engagements for executives and senior practitioners navigating role transitions, career strategy, and the moves that matter.",
      services: individualServices.slice(0, 6),
      href: "/individual",
    },
  ];

  return (
    <main>
      <PageHero
        eyebrow="Services"
        title={
          <>
            Two practices.{" "}
            <em className="font-normal text-emerald">One discipline.</em>
          </>
        }
        description="Every engagement begins the same way: with a rigorous diagnostic of what you're actually trying to solve. The category of work that follows depends on the answer."
      />

      <Section>
        <div className="grid lg:grid-cols-2 gap-6">
          {gateways.map((g) => {
            const Icon = g.icon;
            return (
              <Reveal key={g.label}>
                <Link
                  href={g.href}
                  className="group block bg-canvas-card border border-emerald/10 rounded-2xl p-8 lg:p-10 hover:border-emerald/25 hover:shadow-elevated transition-all h-full"
                >
                  <div className="flex items-start justify-between mb-10">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    <ArrowUpRight
                      className="h-4 w-4 text-ink-300 group-hover:text-emerald group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all"
                      strokeWidth={2}
                    />
                  </div>

                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-3">
                    {g.label}
                  </p>
                  <h2 className="font-display text-display-sm font-medium text-ink leading-tight tracking-tight mb-4">
                    {g.title}
                  </h2>
                  <p className="text-[14.5px] text-ink-500 leading-relaxed mb-10">
                    {g.description}
                  </p>

                  <ul className="space-y-3 pt-8 border-t border-emerald/10">
                    {g.services.map((s, i) => (
                      <li
                        key={s.slug}
                        className="flex items-baseline gap-3 text-[13.5px] text-ink-500"
                      >
                        <span className="font-mono text-[10px] text-emerald/40 tracking-wider shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="tracking-tight">{s.name}</span>
                      </li>
                    ))}
                  </ul>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>

      <ClosingCTA />
    </main>
  );
}
