import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { dictionaries, dirOf, isLocale, LOCALES } from "@/i18n/config";

export const dynamicParams = false;
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export function generateMetadata({ params }: { params: { locale: string } }): Metadata {
  const t = isLocale(params.locale) ? dictionaries[params.locale] : dictionaries.en;
  return { title: { default: t.meta.title, template: `%s · ${t.brand.short}` }, description: t.meta.description };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F9FD" },
    { media: "(prefers-color-scheme: dark)", color: "#050D1B" },
  ],
};

export default function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound();
  const locale = params.locale;
  return (
    <html lang={locale} dir={dirOf(locale)} suppressHydrationWarning>
      <body>
        <Providers locale={locale}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
