import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { ServiceDetailLayout } from "@/components/sections/service-detail-layout";
import { ClosingCTA } from "@/components/sections/closing-cta";
import { individualServices } from "@/lib/content";

export const metadata: Metadata = {
  title: "Individual Advisory",
  description:
    "Confidential advisory for senior professionals — career strategy, executive coaching, interview preparation, and leadership presence.",
};

export default function IndividualPage() {
  return (
    <main>
      <PageHero
        eyebrow="Individual Advisory"
        title={
          <>
            For senior professionals making{" "}
            <em className="font-normal text-emerald">the next move.</em>
          </>
        }
        description="Confidential advisory drawing on fifteen years inside HR. These engagements are kept entirely separate from corporate work — discreet, structured, and held to a higher standard of confidentiality than typical coaching arrangements."
      />

      <ServiceDetailLayout
        services={individualServices}
        ctaHref="/book"
        ctaLabel="Begin an engagement"
      />

      <ClosingCTA />
    </main>
  );
}
