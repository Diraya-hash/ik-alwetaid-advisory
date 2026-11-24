# Business Problem Solver

> *We don't just answer business questions. We help you solve business problems.*

Product identity: **Business Problem Solver** · User experience: **AI Management Consultant** · Core intelligence: **Business Framework Intelligence**.

Bilingual (Arabic RTL / English LTR) web application. Describe a business challenge, structure it through a guided intake,
review a diagnosis that separates verified facts, unverified claims and assumptions, and receive explainable framework
recommendations, including "we need more information first" and "no good fit" when that is the honest answer.

## Status: M1 complete (deterministic, no AI calls)

| Step | State |
|---|---|
| 1. Foundation and design system (deep green, emerald, ivory, quiet gold; AA contrast in both themes) | ✅ |
| 2. Home page and challenge composer | ✅ |
| 3. Guided intake (6 steps, suggestions read from the description) and structured diagnosis | ✅ |
| 4. Recommendation engine: TypeScript port of the Phase 0 engine (rules v0.3b), verified identical on 87 parity cases; explanations for every recommended and rejected framework | ✅ |
| 5. Interactive builders: SWOT (implications linked to findings), 5 Whys (branching; root causes never stronger than their weakest step), fishbone (editable RTL/LTR diagram, configurable categories), impact/effort (drag or keyboard), action plan (owners, dates, dependencies, status, indicators, links to findings), each with live consultant review | ✅ |
| 6. Version history (save, compare, restore with undo); professional report (print to PDF), PNG diagrams, action-plan CSV, project JSON | ✅ |

Local-first: projects are stored only in this browser (autosave, version snapshots, hourly automatic backup, quarantine and
recovery of unreadable data, JSON import/export). There is no cloud sync in M1.

## Run

```bash
npm install
npm run dev       # http://localhost:3000 → /en or /ar
npm run verify    # typecheck, unit tests (engine parity, i18n parity), contrast audit, static build, end-to-end
```

`npm run build` produces a fully static site in `out/` (Vercel: framework "Other", root directory `business-problem-solver`).

## Architecture

```
app/[locale]/…      routes (en | ar); html lang/dir per locale; static export
components/views/   one view per page; no engine logic in components
engine/             pure TypeScript: catalogue + recommender (ported), intake → slots, diagnosis, explanations, project model
content/            bilingual taxonomy and framework descriptions (original text)
i18n/               typed dictionaries; Arabic must match English's shape (tests/i18n.test.ts)
store/              local-first workspace store with backup and recovery
tests/              engine parity with Phase 0, guided-intake scenarios, i18n parity
scripts/            contrast audit; end-to-end checks with production CSP, axe, ar/en × light/dark × desktop/mobile
```

The Phase 0 research and evaluation material in `../phase0` is preserved unchanged; its held-out evaluation is the release
gate for enabling AI features in M3. `scripts/make-parity-fixture.mjs` only reads it.
