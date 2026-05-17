"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/content";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/insights", label: "Insights" },
  { href: "/case-studies", label: "Case Studies" },
];

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-canvas/85 backdrop-blur-xl border-b border-ink-100/60"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[72px] flex items-center gap-10">
        {/* Wordmark */}
        <Link href="/" className="group shrink-0 flex items-baseline gap-2">
          <span className="font-mono text-[10px] tracking-[0.16em] text-emerald/55 leading-none translate-y-[1px]">
            IK
          </span>
          <span className="font-display text-[19px] font-medium tracking-tight text-emerald leading-none">
            Alwetaid
          </span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-emerald/60 leading-none">
            Advisory
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-2 text-[13.5px] tracking-tight transition-colors",
                  active
                    ? "text-emerald font-medium"
                    : "text-ink-500 hover:text-emerald"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden lg:inline-block text-[13px] text-ink-500 hover:text-emerald transition-colors"
          >
            Contact
          </Link>
          <Button href="/book" size="sm" variant="primary" className="hidden sm:inline-flex">
            Book consultation
          </Button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald/15 text-emerald"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden border-t border-ink-100/60 bg-canvas/95 backdrop-blur-xl"
          >
            <div className="px-6 py-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block px-3 py-2.5 text-[15px] text-ink-600 hover:text-emerald transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="block px-3 py-2.5 text-[15px] text-ink-600"
              >
                Contact
              </Link>
              <div className="pt-3">
                <Button href="/book" variant="primary" className="w-full">
                  Book consultation
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
