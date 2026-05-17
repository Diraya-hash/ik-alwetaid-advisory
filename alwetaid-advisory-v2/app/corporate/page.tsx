import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { ServiceDetailLayout } from "@/components/sections/service-detail-layout";
import { ClosingCTA } from "@/components/sections/closing-cta";
import { corporateServices } from "@/lib/content";

export const metadata: Metadata = {
  title: "Corporate Solutions",
  description:
    "Twelve advisory engagements covering Learning, Talent, Succession, Performance, and Capability — for organizations building workforce capability at scale.",
};

export default function CorporatePage() {
  return (
    <main>
      <PageHero
        eyebrow="Corporate Solutions"
        title={
          <>
            For organizations building{" "}
            <em className="font-normal text-emerald">capability at scale.</em>
          </>
        }
        description="Twelve advisory engagements across the full capability lifecycle. Most engagements span eight to sixteen weeks and produce tangible artifacts — frameworks, governance models, and operating systems — built to outlast leadership transitions."
      />

      <ServiceDetailLayout
        services={corporateServices}
        ctaHref="/book"
        ctaLabel="Scope an engagement"
      />

      <ClosingCTA />
    </main>
  );
}
