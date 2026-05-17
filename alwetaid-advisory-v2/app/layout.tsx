import type { Metadata } from "next";
import "./globals.css";
import { SiteNav } from "@/components/layout/site-nav";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://ikalwetaid.com"),
  title: {
    default: "IK Alwetaid Advisory — Workforce Capability Advisory",
    template: "%s · IK Alwetaid Advisory",
  },
  description:
    "Strategic counsel for CHROs and HR leaders building enduring organizational capability. Learning, Talent, Succession, and Development — advised at the level it deserves.",
  keywords: [
    "HR consulting Saudi Arabia",
    "talent management advisory",
    "leadership development consulting",
    "succession planning advisory",
    "capability framework design",
    "L&D consulting Riyadh",
    "CHRO advisor",
    "Vision 2030 capability",
  ],
  authors: [{ name: "Ibrahim K. Alwetaid" }],
  openGraph: {
    title: "IK Alwetaid Advisory — Workforce Capability Advisory",
    description:
      "Strategic counsel for CHROs and HR leaders building enduring organizational capability.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "IK Alwetaid Advisory",
    description:
      "Strategic counsel for CHROs and HR leaders building enduring organizational capability.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SiteNav />
        <div className="pt-[72px]">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
