# IK Strategic LNA Simulator

> *Don't start with training. Start with the strategy.*

A bilingual (Arabic / English) strategic simulation where HR, L&D, OD and business
professionals practise diagnosing organisational performance problems before recommending
interventions. The architecture and roadmap are in
[`../docs/ik-lna-simulator/00-proposal.md`](../docs/ik-lna-simulator/00-proposal.md).

## Status: feature-complete release candidate

| Area | State |
|---|---|
| IK-branded shell, 8-section navigation, Light / Dark / System theme | ✅ |
| Arabic (RTL) and English (LTR) at parity; language switch keeps page and progress | ✅ |
| All six stages playable: context and framing, stakeholder discovery, diagnosis, capability assessment, solution architecture, impact measurement | ✅ |
| Transparent 8-dimension scoring with named criteria, anti-gaming rules and bands | ✅ |
| 13-section executive report, print-to-PDF, CSV export, replay | ✅ |
| Insights, analytics (score history chart), development profile and next-scenario recommendations | ✅ |
| 10 scenarios: 3 Foundation, 4 Intermediate, 3 Advanced | ✅ |
| Local-first persistence with validated import/export, reset and privacy page | ✅ (single browser; not multi-user) |
| Security headers and CSP via `vercel.json` | ✅ |

Full report: [`../docs/ik-lna-simulator/05-production-readiness.md`](../docs/ik-lna-simulator/05-production-readiness.md).
Adding scenarios: [`../docs/ik-lna-simulator/06-scenario-authoring-guide.md`](../docs/ik-lna-simulator/06-scenario-authoring-guide.md).

**Brand:** colours follow the approved IK palette (`styles/tokens.css`). The `IK` mark in
`components/layout/logo.tsx` is typographic until a final logo is approved; the Canva
"Cream Black Typography Loop" template was assessed and not adopted.

## Run

```bash
npm install
npm run dev          # http://localhost:3000 → redirects to /en or /ar
npm run verify       # typecheck, unit tests, contrast audit, static build, end-to-end checks
node scripts/e2e-full.mjs   # six-stage playthrough, report, CSV, axe, all 10 scenarios, production CSP
npm run build:preview && node scripts/test-preview.mjs   # single-file preview + its checks
```

`npm run build` produces a fully static site in `out/` (no server required).

## Architecture

```
app/[locale]/…            routes (en | ar); html lang/dir set per locale
components/views/         one view per page; no scenario logic in components
components/sim/           simulation workspace (stages, interviews, evidence board)
engine/                   pure TypeScript: types, Zod schema + integrity checks, conditions, reducer, scoring
content/scenarios/        bilingual scenario data, the single source of scenario facts
i18n/                     typed UI dictionaries (ar must match en's shape) with plural support
store/                    Zustand store + safe storage adapter (falls back to memory)
styles/tokens.css         semantic colour tokens for light and dark
tests/                    engine, scenario integrity, i18n/RTL hygiene
scripts/                  contrast audit; end-to-end checks across ar/en × light/dark × desktop/mobile
```

**Engine.** An attempt is an ordered list of actions. State is always `derive(scenario, actions)`,
so it is deterministic, replayable and testable without the UI. `check()` explains why an action
is rejected (insufficient hours, locked stage, unavailable question…).

**Scenario authoring.** See the authoring guide. `npm test` validates every scenario (both languages,
referential integrity, reachability, budget pressure) and plays it with a simulated expert and a
training-first order-taker to prove it is solvable and that shortcuts score low.

**Bilingual rules.** Use logical Tailwind utilities (`ms-`, `pe-`, `start-`…); a test rejects
physical `ml-`/`left-` classes. Counts use `p()` (Intl plural rules: Arabic has six forms).
Never put `·` in Arabic text: it is indistinguishable from the Arabic-Indic zero `٠`.
