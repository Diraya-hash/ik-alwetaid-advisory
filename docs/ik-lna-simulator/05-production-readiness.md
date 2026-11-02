# Production readiness and feature implementation report

Date: 2 November 2026. Branch `claude/hopeful-edison-0wv9ec`.
The application lives in `ik-lna-simulator/`. The marketing website (`alwetaid-advisory-v2/`) was not modified.

## 1. Feature implementation

| Requirement | Implementation | Verified by |
|---|---|---|
| Six-stage methodology | Stage 1 framing decision, Stage 2 interviews with openness, hours and challenge questions, Stage 3 cause board with evidence links, Stage 4 gap and nature verdicts, Stage 5 interventions mapped to causes, Stage 6 KPIs with level, owner and review cycle. Each stage has an engine gate; completion locks the attempt. | `engine.test.ts`, `scoring.test.ts`, `e2e-full.mjs` |
| Scoring | 8 dimensions computed from named criteria shown to the user (earned/max). Anti-gaming: question spam is judged against the available pool, leading and solution-first questions cost points, unsupported causes earn 30%, training without a diagnosed skill cause caps Solution Appropriateness at 40. | `scoring.test.ts`, `solvability.test.ts` |
| Executive report | 13 sections, bilingual, print stylesheet for PDF, UTF-8 BOM CSV (opens correctly in Excel with Arabic), replay of decisions | `e2e-full.mjs` (13 sections, CSV download) |
| Insights, analytics, progress | Scores re-derived from saved actions; history chart, dimension averages, strengths and focus areas, next-scenario recommendations | `e2e-full.mjs`, `scoring.test.ts` |
| Scenarios | 10 scenarios across the requested themes (table below) | `scenarios.test.ts`, `solvability.test.ts` |
| Bilingual parity | Typed dictionaries (Arabic must match English's shape), every Arabic string must contain Arabic, Arabic plural forms, Arabic-Indic digits, RTL logical layout | `i18n.test.ts`, E2E in both locales |
| Data and privacy | Local-first storage, validated JSON import, export, reset with in-page confirmation, privacy page | `scoring.test.ts` (recovery), E2E |
| Security | CSP, HSTS, X-Frame-Options, nosniff, Referrer and Permissions policies; immutable caching of hashed assets | E2E runs under the production headers |

### Scenarios and calibration

The expert is an automated strategy that interviews and diagnoses with lookahead. The order-taker accepts the training request.

| Scenario | Level | Theme | Expert | Order-taker |
|---|---|---|---|---|
| The Accuracy Problem (`claims-quality`) | Foundation | Process and governance, productivity | 99 | 21 |
| `service-centre` | Foundation | Productivity (training is not the answer) | 100 | 22 |
| `quiet-team` | Foundation | Leadership | 100 | 24 |
| `platform-adoption` | Intermediate | Transformation | 100 | 28 |
| `merger-hangover` | Intermediate | Restructuring | 100 | 28 |
| `empty-bench` | Intermediate | Succession | 100 | 27 |
| `shared-services` | Intermediate | Operating model | 100 | 22 |
| `strategy-stalled` | Advanced | Strategy execution | 100 | 28 |
| `talent-cliff` | Advanced | Workforce planning, critical skills | 96 | 26 |
| `hospital-flow` | Advanced | Organisational effectiveness (ambiguous evidence) | 100 | 23 |

An expert score near 100 shows the scenario can be solved; it does not mean human users will find it easy. Every scenario's budget is below the cost of asking everything, so users must prioritise.

## 2. Test results (final run)

| Check | Result |
|---|---|
| TypeScript strict typecheck | Pass |
| Unit and content tests (vitest) | 93 passed, 0 failed |
| WCAG AA contrast of all token pairs, light and dark | Pass |
| Static build (`next build`) | Pass |
| Route checks (`scripts/screenshots.mjs`) | Pass |
| Full E2E (`scripts/e2e-full.mjs`): six-stage playthrough in en/ar × light/dark × desktop/mobile (8 runs), report, CSV, progress pages, axe-core, horizontal overflow, smoke test of all 10 scenarios in both languages, production CSP enforced | Pass |
| Vercel install and build commands, run from both the repo root and `ik-lna-simulator/` | Pass |

## 3. Deployment

- Vercel builds from GitHub via `vercel.json` (identical copies at the repo root and in `ik-lna-simulator/`; the commands work whichever Root Directory is set). Output: static `out/`.
- Every push to `claude/hopeful-edison-0wv9ec` updates the Preview deployment.
- **To go to Production:** merge the branch into `main` (Vercel's default production branch), or set the production branch in Vercel → Project → Settings → Git. Then confirm the deployment shows "Ready" and open `/en/` and `/ar/`.
- The deployment cannot be observed from the build sandbox. The live URL must be confirmed in the Vercel dashboard.

## 4. Backend assessment

The current build is **local-first and single-browser**. Progress lives in the user's browser storage; there are no accounts, no cross-device sync, no organisational dashboards and no server-side record. This is fine for individual practice and public launch. It is **not** a multi-user production system.

For cohorts, facilitators or organisational reporting, add:

1. Authentication (e.g. Supabase Auth, Auth0 or Entra ID for enterprise clients).
2. A Postgres table of attempts storing the action log as JSON. Scores stay derived, so the server stores no scoring logic of its own and history re-scores consistently.
3. A sync adapter behind the existing storage interface in `store/`, so the UI does not change.
4. Role-based facilitator views, data retention and a data processing agreement. Hosting region matters for Saudi PDPL compliance.

## 5. Known limitations

- Browser-only storage (above). Clearing site data deletes progress unless exported.
- Scenario data (about 175 KB gzipped) loads on every page. Fix: lazy-load each scenario.
- The 404 page is the unbranded Next.js default.
- Arabic was authored carefully but has not had a native-speaker editorial review. Recommended before launch.
- Stakeholder replies are authored, not generated by an LLM. This is deliberate: scoring stays deterministic and auditable.
- The reference site (ask-before-you-train) was blocked by the network policy and was never reviewed.
- The `IK` mark is typographic until a final logo is approved.
- No analytics or telemetry are collected, so real-user difficulty is unmeasured.

## 6. Scaling next steps

1. Native Arabic editorial review, then a pilot with 10–20 practitioners. Recalibrate budgets and weights from their scores.
2. Lazy scenario loading and a branded 404 page.
3. The backend in section 4 if cohorts or facilitators are in scope.
4. Grow the library toward the 24 planned scenarios using the authoring guide; the tests enforce the design standard.
5. Facilitator mode: cohort comparison and a debrief deck generated from the report.
6. Privacy-respecting usage analytics (aggregate, opt-in) to see where users struggle.
