import type { Config } from "tailwindcss";

// Every colour resolves to a semantic CSS variable (see styles/tokens.css).
// Components must never use raw hex values — this is what makes both themes work.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: { DEFAULT: token("surface"), 2: token("surface-2"), 3: token("surface-3") },
        line: { DEFAULT: token("border"), strong: token("border-strong") },
        ink: { DEFAULT: token("text"), muted: token("text-muted"), subtle: token("text-subtle") },
        primary: {
          DEFAULT: token("primary"),
          hover: token("primary-hover"),
          fg: token("primary-fg"),
          soft: token("primary-soft"),
          "soft-fg": token("primary-soft-fg"),
        },
        navy: { DEFAULT: token("navy"), fg: token("navy-fg") },
        fact: { DEFAULT: token("fact"), soft: token("fact-soft") },
        claim: { DEFAULT: token("claim"), soft: token("claim-soft") },
        assumption: { DEFAULT: token("assumption"), soft: token("assumption-soft") },
        system: { DEFAULT: token("system"), soft: token("system-soft") },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft") },
        warning: { DEFAULT: token("warning"), soft: token("warning-soft") },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-lg": ["clamp(2.25rem, 4.5vw, 3.5rem)", { lineHeight: "1.08", letterSpacing: "var(--tracking-tight)" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.375rem)", { lineHeight: "1.15", letterSpacing: "var(--tracking-tight)" }],
        "display-sm": ["clamp(1.375rem, 2.2vw, 1.625rem)", { lineHeight: "1.25", letterSpacing: "var(--tracking-tight)" }],
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.06), 0 4px 16px rgb(var(--shadow) / 0.06)",
        raised: "0 2px 6px rgb(var(--shadow) / 0.08), 0 16px 40px -12px rgb(var(--shadow) / 0.18)",
      },
      borderRadius: { xl: "0.875rem", "2xl": "1.125rem" },
    },
  },
  plugins: [],
};
export default config;
