/**
 * Hash routing for the single-file preview.
 * App paths (/en/scenarios/claims-quality, /ar/simulate?attempt=X) become plain hash names
 * made of letters, digits and hyphens (en-scenarios--claims-quality, ar-simulate--X),
 * the only form the preview host passes through. "settings" is reserved by the host.
 */
import { useSyncExternalStore } from "react";

const SEP = "--";
const toHashSeg = (s: string) => (s === "settings" ? "preferences" : s);
const fromHashSeg = (s: string) => (s === "preferences" ? "settings" : s);

export function pathToHash(path: string): string {
  const [p = "", q = ""] = path.split("?");
  const segs = p.split("/").filter(Boolean);
  const locale = segs[0] === "ar" ? "ar" : "en";
  const view = segs.slice(1).map(toHashSeg);
  const attempt = new URLSearchParams(q).get("attempt");
  if (attempt) view.push(attempt);
  return `${locale}-${view.length ? view.join(SEP) : "home"}`;
}

export function hashToPath(hash: string): { pathname: string; search: string } | null {
  const m = /^#?(en|ar)-([A-Za-z0-9-]+)$/.exec(hash);
  if (!m) return null;
  const [, locale, rest] = m;
  const parts = rest!.split(SEP).map(fromHashSeg);
  if (parts[0] === "home") return { pathname: `/${locale}`, search: "" };
  if (parts[0] === "simulate" || parts[0] === "report")
    return { pathname: `/${locale}/${parts[0]}`, search: parts[1] ? `?attempt=${parts[1]}` : "" };
  return { pathname: `/${locale}/${parts.join("/")}`, search: "" };
}

export function defaultHash(): string {
  let locale = "en";
  try {
    const stored = window.localStorage.getItem("ik-locale");
    if (stored === "en" || stored === "ar") locale = stored;
    else if (navigator.language?.toLowerCase().startsWith("ar")) locale = "ar";
  } catch {
    /* storage unavailable */
  }
  return `${locale}-home`;
}

export function resolve(hash: string) {
  return hashToPath(hash) ?? hashToPath(defaultHash())!;
}

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
export function useHash(): string {
  return useSyncExternalStore(subscribe, () => window.location.hash, () => "");
}

export function navigate(path: string) {
  const target = pathToHash(path);
  if (window.location.hash.slice(1) !== target) window.location.hash = target;
  window.scrollTo(0, 0);
}
