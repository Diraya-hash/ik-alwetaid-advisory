import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { ClosingCTA } from "@/components/sections/closing-cta";
import { credentials, brand } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "Senior advisor to HR leaders building organizational capability. Fifteen years inside the function, across financial services, retail, and government.",
};

export default function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="About"
        title={
          <>
            Fifteen years inside the function.{" "}
            <em className="font-normal text-emerald">
              Now advising the leaders who shape it.
            </em>
          </>
        }
      />

      <Section>
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-7">
            <Reveal>
              <div className="prose-content space-y-6 text-base lg:text-[17px] text-ink-500 leading-[1.75] max-w-2xl">
                <p>
                  I've spent fifteen years inside HR — building academies, designing
                  competency frameworks, advising on succession, and developing the
                  people who develop everyone else. Most of that time was spent in
                  Saudi enterprise, across financial services, retail, and government.
                </p>
                <p>
                  The work I now do is upstream of training. It is the diagnostic that
                  determines whether training is even the right answer. The framework
                  that connects business strategy to workforce capability. The
                  governance that determines whether learning has a seat at the
                  executive table — or remains a cost center.
                </p>
                <p>
                  My practice is small, deliberate, and personal. I run two to three
                  engagements at a time. The work is led by me, not handed off. The
                  artifacts I produce are designed to outlast any single CHRO and to
                  hold up under board scrutiny.
                </p>
                <p>
                  I write at the intersection of HR rigor and strategic clarity. If
                  you're building capability at the level Vision 2030 demands — or
                  navigating the next chapter of your own career at that altitude —
                  this practice is built for that conversation.
                </p>
              </div>
            </Reveal>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 lg:col-start-9 space-y-10">
            <Reveal delay={0.1}>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-5">
                  Practice Principal
                </p>
                <h3 className="font-display text-2xl font-medium text-ink leading-tight tracking-tight mb-2">
                  {brand.principal}
                </h3>
                <p className="text-[14px] text-ink-400 leading-relaxed">
                  Senior Specialist, Education &amp; Awareness — currently advising a
                  Saudi government entity. Formerly Senior L&amp;D Specialist, Al
                  Rajhi Bank.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-5">
                  Credentials
                </p>
                <ul className="space-y-3">
                  {credentials.map((c) => (
                    <li key={c} className="flex items-start gap-3 text-[13.5px] text-ink-500 leading-relaxed">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald/50" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            <Reveal delay={0.3}>
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-5">
                  Frameworks I work in
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "ADDIE",
                    "Kirkpatrick",
                    "70:20:10",
                    "CIPD",
                    "9-Box",
                    "TOGAF",
                    "GROW",
                    "CLEAR",
                    "OSKAR",
                    "STAR",
                  ].map((f) => (
                    <span
                      key={f}
                      className="font-mono text-[11px] text-emerald border border-emerald/15 bg-emerald-50/50 rounded-full px-2.5 py-1"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </Section>

      {/* Approach block — italic editorial quote */}
      <Section tone="subtle">
        <Reveal>
          <div className="max-w-4xl">
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-8">
              On the work
            </p>
            <blockquote className="font-display text-display-md font-medium text-ink leading-[1.15] tracking-tighter italic">
              "Most capability problems are misdiagnosed as training problems.
              The serious work of a senior advisor is to refuse the easy frame —
              and to insist on the right one."
            </blockquote>
            <p className="mt-8 text-[13px] uppercase tracking-[0.18em] text-ink-400 font-medium">
              — Ibrahim K. Alwetaid
            </p>
          </div>
        </Reveal>
      </Section>

      <ClosingCTA />
    </main>
  );
}
