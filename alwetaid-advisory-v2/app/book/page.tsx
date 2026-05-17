import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Section } from "@/components/ui/section";
import { Reveal } from "@/components/ui/reveal";
import { BookForm } from "@/components/sections/book-form";

export const metadata: Metadata = {
  title: "Book a Consultation",
  description:
    "Begin a conversation about a corporate engagement or individual advisory. Every inquiry is reviewed personally.",
};

export default function BookPage() {
  return (
    <main>
      <PageHero
        eyebrow="Book Consultation"
        title={
          <>
            A first conversation.{" "}
            <em className="font-normal text-emerald">No deck. No pitch.</em>
          </>
        }
        description="Thirty minutes to understand the question you're trying to answer. If there's a fit, we move forward. If not, you'll leave the call with a clearer view of what to do next."
      />

      <Section className="pt-8 pb-32">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Form column */}
          <div className="lg:col-span-8">
            <Reveal>
              <BookForm />
            </Reveal>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4">
            <Reveal delay={0.1}>
              <div className="bg-canvas-subtle border border-emerald/10 rounded-2xl p-8 lg:sticky lg:top-28 space-y-8">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-3">
                    What to expect
                  </p>
                  <h3 className="font-display text-xl font-medium text-ink leading-tight tracking-tight">
                    A structured first call.
                  </h3>
                </div>

                <ul className="space-y-5">
                  {[
                    {
                      label: "Response",
                      text: "Within two business days, personally.",
                    },
                    {
                      label: "First call",
                      text: "30 minutes. Video or in-person in Riyadh.",
                    },
                    {
                      label: "Preparation",
                      text: "No deck required. Share context in the form.",
                    },
                    {
                      label: "Outcome",
                      text:
                        "Either a proposed scope, a referral, or a clearer framing of the question.",
                    },
                  ].map((item, i) => (
                    <li key={item.label} className="flex gap-4">
                      <span className="font-mono text-[10px] text-emerald/40 tracking-wider mt-1.5">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="text-[12px] font-medium text-emerald uppercase tracking-[0.14em] mb-1">
                          {item.label}
                        </div>
                        <p className="text-[13px] text-ink-500 leading-relaxed">
                          {item.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="pt-8 border-t border-emerald/10">
                  <p className="text-[12px] text-ink-400 leading-relaxed">
                    Confidentiality is assumed. All engagements are governed by NDA
                    before any scoping discussion.
                  </p>
                </div>
              </div>
            </Reveal>
          </aside>
        </div>
      </Section>
    </main>
  );
}
