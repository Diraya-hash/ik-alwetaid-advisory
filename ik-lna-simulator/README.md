# IK Strategic LNA Simulator

> *Don't start with training. Start with the strategy.*

A bilingual (Arabic / English) strategic simulation where HR, L&D, OD and business
professionals practise diagnosing organisational performance problems before recommending
interventions. The architecture and roadmap are in
[`../docs/ik-lna-simulator/00-proposal.md`](../docs/ik-lna-simulator/00-proposal.md).

## Status: Phase 1

| Area | State |
|---|---|
| IK-branded shell, 8-section navigation | ✅ |
| Arabic (RTL) & English (LTR), language switch preserves page and progress | ✅ |
| Light / Dark / System theme, persisted | ✅ |
| Scenario Library with filters (difficulty, category, complexity, duration, competency) | ✅ |
| Simulation engine: event-sourced reducer, conditions, hours budget, openness, challenge-with-evidence | ✅ |
| Stage 1 (Strategic Context, ending in a required problem-framing decision) and Stage 2 (Stakeholder Discovery) playable | ✅ |
| Evidence board with provenance labels; user hypotheses | ✅ |
| Local-first persistence, versioned, with JSON export and reset | ✅ |
| Stages 3–6, scoring, debriefs, reports, analytics | ⏳ Phases 3–4 (shown as unavailable in the UI, never faked) |
| Scenario library | 1 pilot scenario (Foundation, *The Accuracy Problem* v2): 6 stakeholders incl. COO, 4 true causes across technology, governance, structure and skill |
| Single-file preview build for sandboxed hosting (hash routing, same components) | ✅ `npm run build:preview` |

**Brand note:** colour tokens in `styles/tokens.css` and the `IK` wordmark in
`components/layout/logo.tsx` are placeholders that follow the written IK direction
(navy/blue). Replace them with the official IK guideline values; no component changes are needed.

## Run

```bash
npm install
npm run dev          # http://localhost:3000 → redirects to /en or /ar
npm run verify       # typecheck, unit tests, contrast audit, static build, end-to-end checks
npm run build:preview && node scripts/test-preview.mjs   # single-file preview + its checks
```

`npm run build` produces a fully static site in `out/` (no server required).

## Architecture

```
app/[locale]/…            routes (en | ar); html lang/dir set per locale
components/views/         one view per page; no scenario logic in components
components/sim/           simulation workspace (stages, interviews, evidence board)
engine/                   pure TypeScript: types, Zod schema + integrity checks, conditions, reducer
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

**Scenario authoring.** Add a file under `content/scenarios/` and register it in `index.ts`.
`npm test` validates every scenario: both languages present, every referenced id exists, every
evidence item is reachable, and the budget forces prioritisation.

**Bilingual rules.** Use logical Tailwind utilities (`ms-`, `pe-`, `start-`…); a test rejects
physical `ml-`/`left-` classes. Counts use `p()` (Intl plural rules: Arabic has six forms).
Never put `·` in Arabic text: it is indistinguishable from the Arabic-Indic zero `٠`.
