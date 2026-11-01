"use client";

import { useEffect } from "react";

/** Static hosting has no server redirect: pick the stored or browser language on the client. */
export default function RootPage() {
  useEffect(() => {
    let locale = "en";
    try {
      const stored = window.localStorage.getItem("ik-locale");
      if (stored === "en" || stored === "ar") locale = stored;
      else if (navigator.language?.toLowerCase().startsWith("ar")) locale = "ar";
    } catch {
      /* storage unavailable */
    }
    window.location.replace(`/${locale}/`);
  }, []);
  return (
    <main style={{ fontFamily: "system-ui", padding: 32 }}>
      <a href="/en/">English</a> · <a href="/ar/">العربية</a>
    </main>
  );
}
