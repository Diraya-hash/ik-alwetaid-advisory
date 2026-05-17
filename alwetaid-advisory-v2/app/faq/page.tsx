import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { FAQAccordion } from "@/components/sections/faq-accordion";
import { ClosingCTA } from "@/components/sections/closing-cta";

export const metadata: Metadata = {
  title: "Frequently Asked",
  description:
    "Common questions on engagements, pricing, confidentiality, and how to begin.",
};

export default function FAQPage() {
  return (
    <main>
      <PageHero
        eyebrow="Frequently Asked"
        title={
          <>
            Common questions.{" "}
            <em className="font-normal text-emerald">Direct answers.</em>
          </>
        }
        description="If something isn't covered here, write directly. Most questions are answered the same day."
      />

      <Section className="pt-4">
        <Reveal>
          <div className="max-w-4xl">
            <FAQAccordion />
          </div>
        </Reveal>
      </Section>

      <ClosingCTA />
    </main>
  );
}
