import { Hero } from "@/components/sections/hero";
import { TrustStrip } from "@/components/sections/trust-strip";
import { MethodologySection } from "@/components/sections/methodology-section";
import { ServicesOverview } from "@/components/sections/services-overview";
import { WhyWorkSection } from "@/components/sections/why-work-section";
import { FeaturedCaseSection } from "@/components/sections/featured-case-section";
import { FeaturedInsights } from "@/components/sections/featured-insights";
import { ClosingCTA } from "@/components/sections/closing-cta";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <TrustStrip />
      <MethodologySection />
      <ServicesOverview />
      <WhyWorkSection />
      <FeaturedCaseSection />
      <FeaturedInsights />
      <ClosingCTA />
    </main>
  );
}
