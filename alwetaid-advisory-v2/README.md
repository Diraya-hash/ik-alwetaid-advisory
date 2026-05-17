# IK Alwetaid Advisory

Premium consulting website for a senior workforce capability advisory practice. Next.js 14, TypeScript, Tailwind CSS, Framer Motion.

## What this is

A complete production-ready site positioning a senior HR/L&D practitioner as a strategic advisor — not a trainer. Built to the visual and copywriting standard of top consulting firms.

## Stack

- **Next.js 14** (App Router) + TypeScript (strict mode)
- **Tailwind CSS** with custom executive design tokens
- **Framer Motion** for scroll-reveal and accordion animations
- **Lucide React** for icons
- **Cormorant Garamond** (display) + **Inter** (body) + **JetBrains Mono** (numerals)

## Brand System

**Palette (as specified)**

| Token | Hex | Usage |
|-------|-----|-------|
| `canvas` | `#FAFAF7` | Page background — soft white |
| `canvas-subtle` | `#F4F2EC` | Section alternates |
| `emerald` | `#004D40` | Primary — deep executive green |
| `sand` | `#D7C8AE` | Warm accent — used sparingly |
| `ink` | `#1F2937` | Body text — dark charcoal |

**Typography**

Cormorant Garamond for display (italic accents in headlines), Inter for body, JetBrains Mono for index numerals and small typographic accents.

## Routes

| Route | Page |
|-------|------|
| `/` | Home — hero, methodology, services, why, featured case, insights, CTA |
| `/about` | About the practice and principal |
| `/services` | Services gateway — Corporate / Individual split |
| `/corporate` | 12 corporate engagements with sticky index |
| `/individual` | 6 individual advisory engagements |
| `/case-studies` | 3 detailed engagements with metrics |
| `/insights` | Article index with featured layout |
| `/book` | Multi-section consultation form with validation |
| `/contact` | Direct channels |
| `/faq` | 7 FAQs with animated accordion |

## Component Architecture

```
app/                      # Routes
components/
├── layout/
│   ├── site-nav.tsx      # Persistent header w/ scroll state
│   └── site-footer.tsx   # Editorial footer w/ massive wordmark
├── sections/             # Composable page sections
│   ├── hero.tsx
│   ├── page-hero.tsx     # Reusable inner-page hero
│   ├── trust-strip.tsx
│   ├── methodology-section.tsx
│   ├── services-overview.tsx
│   ├── why-work-section.tsx
│   ├── featured-case-section.tsx
│   ├── featured-insights.tsx
│   ├── closing-cta.tsx
│   ├── service-detail-layout.tsx  # Sticky-index two-col layout
│   ├── book-form.tsx              # Multi-section validated form
│   └── faq-accordion.tsx          # Animated single-open accordion
└── ui/
    ├── button.tsx        # 5 variants, supports href
    ├── section.tsx       # Section + SectionEyebrow + SectionTitle
    └── reveal.tsx        # Scroll-triggered Framer Motion reveal

lib/
├── content.ts            # All copy — services, cases, insights, FAQs
└── utils.ts              # cn() helper
```

## Copy & Voice

All copy lives in `lib/content.ts`. The tone is deliberately executive: declarative sentences, no hype, no "transform" or "unlock," frameworks named by their proper terms. Editing copy = editing one file.

## Form Submission

The Book Consultation form (`components/sections/book-form.tsx`) is fully validated client-side with a simulated submission. To wire to a real backend:

1. Replace the `setTimeout` in `handleSubmit` with a real `fetch()` to your API or Resend/Formspree endpoint
2. Add server-side validation
3. Optionally add a honeypot field and rate limiting

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run start
```

## Deploy

Optimized for Vercel. Every route is statically pre-rendered (no server-side data). Drop into Vercel, point your domain, ship.

## SEO

Per-page `metadata` exports configured for all 10 routes. Open Graph and Twitter Card defaults set in root layout. `metadataBase` points to `https://ikalwetaid.com` — update before launch if your domain differs.

---

Built as a real deployable site, not a prototype. Every element has been considered.
