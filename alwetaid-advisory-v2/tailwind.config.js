/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft off-white background — premium, not stark
        canvas: {
          DEFAULT: "#FAFAF7",
          subtle: "#F4F2EC",
          card: "#FFFFFF",
        },
        // Deep emerald — the executive signature
        emerald: {
          DEFAULT: "#004D40",
          50: "#E6F0EE",
          100: "#CCE0DC",
          200: "#99C1B9",
          300: "#66A296",
          400: "#338373",
          500: "#004D40",
          600: "#003F35",
          700: "#003229",
          800: "#00251F",
          900: "#001814",
        },
        // Warm sand accent
        sand: {
          DEFAULT: "#D7C8AE",
          50: "#FAF7F0",
          100: "#F5EFE2",
          200: "#EBDFC5",
          300: "#E1CFA8",
          400: "#D7C8AE",
          500: "#BCAA88",
          600: "#9C8B6B",
        },
        // Charcoal text
        ink: {
          DEFAULT: "#1F2937",
          50: "#F4F5F7",
          100: "#E5E7EB",
          200: "#C2C7CE",
          300: "#9097A1",
          400: "#5C6371",
          500: "#3A4150",
          600: "#1F2937",
          700: "#161D29",
          800: "#0D131C",
        },
      },
      fontFamily: {
        // Editorial serif for display — Cormorant for the high-end consulting feel
        display: ['"Cormorant Garamond"', "ui-serif", "Georgia", "serif"],
        // Inter for body — clean, premium, high readability
        sans: ['"Inter"', "ui-sans-serif", "system-ui", "sans-serif"],
        // Mono for accents (numbers, kbd)
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.035em",
        tighter: "-0.02em",
      },
      fontSize: {
        // Editorial scale
        "display-xl": ["clamp(3rem, 7vw, 6rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-lg": ["clamp(2.5rem, 5.5vw, 4.5rem)", { lineHeight: "1", letterSpacing: "-0.025em" }],
        "display-md": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-sm": ["clamp(1.5rem, 3vw, 2rem)", { lineHeight: "1.15", letterSpacing: "-0.015em" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(0, 77, 64, 0.04), 0 8px 24px rgba(0, 77, 64, 0.06)",
        elevated: "0 4px 12px rgba(0, 77, 64, 0.08), 0 24px 48px -12px rgba(0, 77, 64, 0.10)",
        ring: "0 0 0 1px rgba(0, 77, 64, 0.08)",
      },
      animation: {
        "fade-up": "fadeUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fadeIn 0.6s ease-out both",
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
