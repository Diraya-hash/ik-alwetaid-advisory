"use client";

import { BookOpen, FolderKanban, Home, Menu, Settings, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/store/workspace";
import { LanguageToggle, ThemeSwitch } from "./controls";
import { Logo } from "./logo";
import { RecoveryBanner, StorageNotice } from "./storage-status";

type NavKey = "home" | "projects" | "library" | "settings";
const NAV: { key: NavKey; path: string; icon: LucideIcon; match?: string[] }[] = [
  { key: "home", path: "/", icon: Home },
  { key: "projects", path: "/projects", icon: FolderKanban, match: ["/project"] },
  { key: "library", path: "/library", icon: BookOpen },
  { key: "settings", path: "/settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { t, href, locale } = useI18n();
  const pathname = usePathname();
  const current = pathname.replace(new RegExp(`^/${locale}`), "").replace(/\/$/, "") || "/";
  return (
    <ul className="space-y-0.5">
      {NAV.map(({ key, path, icon: Icon, match }) => {
        const active = path === "/" ? current === "/" : current === path || current.startsWith(`${path}/`) || (match ?? []).some((m) => current === m || current.startsWith(`${m}/`));
        return (
          <li key={key}>
            <Link href={href(path)} onClick={onNavigate} aria-current={active ? "page" : undefined}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] transition-colors", active ? "bg-primary-soft font-semibold text-primary-soft-fg" : "text-ink-muted hover:bg-surface-2 hover:text-ink")}>
              <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
              {t.nav[key]}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t, href } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const init = useWorkspace((s) => s.init);
  useEffect(() => init(), [init]);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const footer = (
    <div className="space-y-3 border-t border-line p-4">
      <StorageNotice compact />
      <div className="flex items-center justify-between gap-2">
        <LanguageToggle />
        <ThemeSwitch />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-fg">{t.nav.skip}</a>

      <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e border-line bg-surface lg:flex no-print">
        <div className="px-5 pb-6 pt-5"><Logo /></div>
        <nav aria-label={t.nav.primary} className="flex-1 overflow-y-auto px-3">
          <NavLinks />
          <Link href={href("/privacy")} className="mt-4 block px-3 text-[12px] text-ink-subtle hover:text-primary">{t.nav.privacy}</Link>
        </nav>
        {footer}
      </aside>

      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-surface/90 px-4 backdrop-blur lg:hidden no-print">
        <Logo />
        <button type="button" onClick={() => setOpen(true)} aria-label={t.nav.menu} aria-expanded={open} aria-controls="mobile-nav" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-ink">
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label={t.nav.menu} id="mobile-nav">
          <button type="button" aria-label={t.nav.close} className="absolute inset-0 bg-deep/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 start-0 flex w-[min(20rem,85vw)] flex-col bg-surface shadow-raised">
            <div className="flex items-center justify-between p-4">
              <Logo />
              <button type="button" onClick={() => setOpen(false)} aria-label={t.nav.close} className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted"><X className="h-5 w-5" aria-hidden /></button>
            </div>
            <nav aria-label={t.nav.primary} className="flex-1 overflow-y-auto px-3">
              <NavLinks onNavigate={() => setOpen(false)} />
              <Link href={href("/privacy")} className="mt-4 block px-3 text-[12px] text-ink-subtle hover:text-primary">{t.nav.privacy}</Link>
            </nav>
            {footer}
          </div>
        </div>
      )}

      <main id="main" className="lg:ps-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
          <RecoveryBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
