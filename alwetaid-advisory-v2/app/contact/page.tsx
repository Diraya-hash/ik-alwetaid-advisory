import type { Metadata } from "next";
import Link from "next/link";
import { Mail, Linkedin, MapPin, Clock } from "lucide-react";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { Button } from "@/components/ui/button";
import { brand } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Direct contact for senior inquiries. Email, LinkedIn, or schedule a consultation.",
};

export default function ContactPage() {
  const channels = [
    {
      icon: Mail,
      label: "Email",
      value: "advisory@ikalwetaid.com",
      hint: "Most reliable. Personally read.",
      href: "mailto:advisory@ikalwetaid.com",
    },
    {
      icon: Linkedin,
      label: "LinkedIn",
      value: "/in/ibrahim-alwetaid",
      hint: "For network introductions.",
      href: "#",
    },
    {
      icon: MapPin,
      label: "Based in",
      value: "Riyadh, Saudi Arabia",
      hint: "On-site engagements across the GCC.",
    },
    {
      icon: Clock,
      label: "Response time",
      value: "Within two business days",
      hint: "Sunday–Thursday operating week.",
    },
  ];

  return (
    <main>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            A direct line.{" "}
            <em className="font-normal text-emerald">For serious inquiries.</em>
          </>
        }
        description="If you'd prefer to skip the consultation form, reach out directly. For a structured engagement scoping, the form gathers what I need to respond well."
      />

      <Section>
        <div className="grid lg:grid-cols-2 gap-px bg-emerald/10 rounded-2xl overflow-hidden border border-emerald/10 mb-16">
          {channels.map((c) => {
            const Icon = c.icon;
            const content = (
              <div className="bg-canvas-card p-8 lg:p-10 group hover:bg-canvas-subtle transition-colors h-full">
                <div className="flex items-start gap-5">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald shrink-0">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-2">
                      {c.label}
                    </p>
                    <p className="font-display text-xl lg:text-2xl font-medium text-ink leading-tight tracking-tight mb-2 break-words">
                      {c.value}
                    </p>
                    <p className="text-[13px] text-ink-400 leading-relaxed">
                      {c.hint}
                    </p>
                  </div>
                </div>
              </div>
            );
            return c.href ? (
              <Link key={c.label} href={c.href}>
                {content}
              </Link>
            ) : (
              <div key={c.label}>{content}</div>
            );
          })}
        </div>

        <Reveal>
          <div className="text-center pt-10">
            <p className="font-display italic text-xl lg:text-2xl text-emerald leading-snug mb-8 max-w-xl mx-auto">
              "For an engagement, the consultation form is the right path. For
              anything else — write directly."
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button href="/book" variant="primary">
                Book a consultation
              </Button>
              <Button href="mailto:advisory@ikalwetaid.com" variant="outline">
                Send a direct note
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>
    </main>
  );
}
