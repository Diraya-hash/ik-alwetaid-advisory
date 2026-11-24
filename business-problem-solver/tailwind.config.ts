import type { Config } from "tailwindcss";

// Every colour resolves to a semantic CSS variable (styles/tokens.css); components never use raw hex values.
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
        primary: { DEFAULT: token("primary"), hover: token("primary-hover"), fg: token("primary-fg"), soft: token("primary-soft"), "soft-fg": token("primary-soft-fg") },
        deep: { DEFAULT: token("deep"), fg: token("deep-fg") },
        gold: { DEFAULT: token("gold"), text: token("gold-text"), soft: token("gold-soft"), "on-deep": token("gold-on-deep") },
        fact: { DEFAULT: token("fact"), soft: token("fact-soft") },
        claim: { DEFAULT: token("claim"), soft: token("claim-soft") },
        assumption: { DEFAULT: token("assumption"), soft: token("assumption-soft") },
        system: { DEFAULT: token("system"), soft: token("system-soft") },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft") },
        warning: { DEFAULT: token("warning"), soft: token("warning-soft") },
      },
      fontFamily: { sans: ["var(--font-sans)"], display: ["var(--font-display)"] },
      fontSize: {
        "display-lg": ["clamp(2.25rem, 4.6vw, 3.6rem)", { lineHeight: "1.08", letterSpacing: "var(--tracking-tight)" }],
        "display-md": ["clamp(1.7rem, 3vw, 2.35rem)", { lineHeight: "1.15", letterSpacing: "var(--tracking-tight)" }],
        "display-sm": ["clamp(1.3rem, 2.1vw, 1.6rem)", { lineHeight: "1.25", letterSpacing: "var(--tracking-tight)" }],
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.05), 0 6px 20px -8px rgb(var(--shadow) / 0.10)",
        raised: "0 2px 6px rgb(var(--shadow) / 0.08), 0 20px 48px -16px rgb(var(--shadow) / 0.22)",
      },
      borderRadius: { xl: "0.75rem", "2xl": "1rem" },
    },
  },
  plugins: [],
};
export default config;
