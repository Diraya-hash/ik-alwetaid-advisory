# IK Strategic LNA Simulator — Discovery & Architecture Proposal

> Status: **Awaiting approval.** No product code has been written yet.
> Tagline: *"Don't Start with Training. Start with the Strategy."*

---

## 0. Discovery findings

### 0.1 Reference simulator (ask-before-you-train.netlify.app)
**I could not reach it.** The cloud session's network policy blocks
`ask-before-you-train.netlify.app`. That means this proposal does not describe its exact
mechanics, wording, or scoring. The design below rests on the concept you described
(question-selection stakeholder interviews before any training decision, then feedback and
scoring). Once the host is allowed, I will do a full teardown and update section 0.1 before
Phase 1 begins.

### 0.2 Existing codebase (`alwetaid-advisory-v2/`)
This repository holds the **IK Alwetaid Advisory marketing website**. It is not a simulator.

| Aspect | Finding | Reuse? |
|---|---|---|
| Stack | Next.js 14 App Router, TS strict, Tailwind 3, Framer Motion, Lucide | ✅ Same stack |
| Palette | Emerald `#004D40` + sand `#D7C8AE` + charcoal | ❌ Conflicts with "no green", navy/blue brief |
| Typography | Cormorant Garamond / Inter / JetBrains Mono | ⚠️ Latin only, so an Arabic pairing is needed |
| i18n / RTL | None (English only, `lang="en"`, physical `left/right` classes) | ❌ Must be built |
| Theming | None (light only, hard-coded hex values) | ❌ Must be built |
| UI primitives | `Button` (5 variants, href-aware), `Section`, `Reveal`, `cn()` | ✅ Port and re-token |
| Content pattern | All copy in `lib/content.ts`, kept apart from components | ✅ Same principle, extended to typed scenario data |
| State / persistence / tests | None | Must be built |
| Domain content | LNA positioning ("the diagnostic that determines whether training is even the answer") | ✅ Same voice; link from site to simulator |

**Recommendation:** build the simulator as a **separate app in this repo**
(`/ik-lna-simulator`), not inside the marketing site. The site's emerald identity and the
simulator's navy/blue identity would fight inside one theme system, and the simulator needs
locale routing and client state that the static site doesn't need. Shared primitives get ported
over and re-tokened. The website stays untouched, and can later link to the simulator.

### 0.3 IK brand assets
The brief says the IK guidelines already exist. **I could not find them.** I checked:
- This repo, which contains only the emerald/sand advisory palette.
- Your Google Drive. The only brand-like files are "Cream Black Typography Loop Brand Logo"
  (PNG/SVG/JPG, unreadable as content) and CV/proposal PDFs. None defines a navy/blue system.

To avoid inventing a brand, section 6 uses **placeholder tokens** that follow your written
direction (navy type, blue actions, light-blue surfaces, deep-navy dark mode). All colour lives
in one token file, so swapping in the real hex values is a one-file change. **Please share the
guideline file or the exact navy/blue hex codes, logo files and fonts.**

---

## 1. Product architecture

```
ik-lna-simulator/
├── app/[locale]/                 # ar | en, sets <html lang dir>
│   ├── page.tsx                  # 1 Home / Dashboard
│   ├── scenarios/                # 2 Scenario Library (+ [id] briefing page)
│   ├── simulate/[attemptId]/     # The engagement workspace (6 stages)
│   ├── simulations/              # 3 My Simulations (attempts, replay, compare)
│   ├── insights/                 # 4 Learning Insights (debriefs, expert reasoning)
│   ├── analytics/                # 5 Performance Analytics (dimension trends)
│   ├── development/              # 6 My Development (consultant profile)
│   ├── methodology/              # 7 Methodology (six stages, tools, full scoring rubric)
│   ├── settings/                 # 8 Settings (language, theme, data export/reset)
│   └── report/[attemptId]/       # Executive report (print → PDF, CSV export)
├── content/scenarios/<id>/       # Typed scenario data, bilingual, one folder per scenario
├── engine/                       # Pure TS, no React: reducer, conditions, scoring, report builder
├── store/                        # Zustand + versioned persistence adapter
├── i18n/                         # UI dictionaries ar.json / en.json, formatters
├── components/{ui,sim,report,charts,layout}
└── tests/                        # Vitest (engine and scoring) + Playwright (4 locale × theme combos)
```

**Key principles**
1. **The engine is pure and event-sourced.** An attempt is an ordered list of actions
   (`ASK`, `REVIEW_DOC`, `CHALLENGE`, `LOG_HYPOTHESIS`, `SELECT_ROOT_CAUSE`,
   `SELECT_INTERVENTION`, `DEFINE_KPI`…). State, scores and report are derived from
   `(scenario, actions)`. That gives replay, exact before/after comparison between attempts,
   deterministic scoring, and unit testing without a UI.
2. **No scenario logic in components.** Components render whatever the engine exposes
   (`availableQuestions`, `unlockedEvidence`, `stakeholderMood`…).
3. **Deterministic authored content, not a live LLM.** Every fact, reply and score traces back
   to scenario data. This meets your "no invented facts" and "no arbitrary AI scores" rules,
   works offline, and sends no user data to third parties. An optional LLM "free-text
   question" mode could come later, constrained to scenario facts, but it is not in scope.
4. **Local-first persistence.** Progress lives in the browser behind a `StorageAdapter`
   interface, schema-versioned with migrations. No accounts or PII are collected in Phases 1–4.
   A cloud backend (e.g. Supabase) can be added later through the same adapter.
5. **Static deployable.** No server is required, so it can be hosted on Netlify or Vercel.

---

## 2. Simulation mechanics (how the six stages play)

**Engagement budget.** Each scenario gives the user a fixed number of *consultant hours*,
for example 20. Questions cost 1 hour, document reviews 1–2, and a focus group 3. That makes
prioritisation part of the skill. Asking everything is impossible, and padding doesn't help,
because scoring rewards *which* evidence was surfaced, not how much.

| Stage | What the user does | Engine mechanic |
|---|---|---|
| 1 Strategic Context | Reviews strategy docs, KPIs, external pressures; logs initial hypotheses | Documents are evidence items; hypotheses are stored as **user assumptions** |
| 2 Stakeholder Discovery | Interviews 5–9 stakeholders with question cards | Branching conversation graphs (below) |
| 3 Problem Diagnosis | Builds 5 Whys / Fishbone / Gap analysis; picks root causes **and links supporting evidence** | Root-cause candidates include plausible distractors. A claim with no linked evidence earns little. |
| 4 Capability Assessment | Classifies each gap as *skill/knowledge*, *motivation*, *process*, *structure*, *technology*, *leadership*, *governance*, *culture*; rates current vs required capability | Scored against the scenario's defined gap classification |
| 5 Solution Architecture | Builds an intervention portfolio from 12 types, each justified by a root cause | Scenario defines fit per intervention × root cause: `essential / supportive / neutral / harmful` |
| 6 Impact Measurement | Builds a KPI tree: strategic → operational → behavioural → capability, each with baseline, target, timeline, owner | Scored against the scenario's KPI model; separates learning metrics from business impact |

**Stakeholder conversation model**
- Each stakeholder has **openness** (0–100). It rises with relevant, well-framed questions and
  falls with leading, solution-first or accusatory ones ("What training do your managers
  need?").
- Questions are **conditionally available**. Some appear only after specific evidence is found,
  e.g. you can ask the CFO about the stalled ERP budget only after the CIO mentions it.
- **Hidden insights** unlock when openness ≥ a threshold *or* the user **challenges with
  evidence** from another source ("The ops data shows rework rose 40% after go-live. How does
  that fit with 'poor execution'?").
- **Biases are explicit in the data** (e.g. CEO: attribution bias toward people; CIO:
  defensive about the platform). The debrief explains how each bias coloured that stakeholder's
  claims.
- **Consequences:** low openness locks insights for the rest of the attempt. Skipping a
  stakeholder group (e.g. frontline employees) leaves their evidence undiscovered, and the
  report names it.

**Every piece of information is labelled by provenance, both in the UI and in the report:**
`FACT` (scenario-defined data or document) · `CLAIM` (a stakeholder's view, bias noted) ·
`ASSUMPTION` (entered by the user) · `SYSTEM` (generated feedback or recommendation).

---

## 3. Scenario data model (TypeScript, abridged)

```ts
type L = { en: string; ar: string };            // every user-facing string is bilingual
type Difficulty = "foundation" | "intermediate" | "advanced";
type CauseType = "skill" | "motivation" | "process" | "structure" | "technology"
               | "leadership" | "governance" | "culture" | "strategy" | "resource";

interface Scenario {
  id: string; version: number;
  category: "strategy" | "workforce" | "performance" | "culture" | "governance";
  difficulty: Difficulty; complexity: 1|2|3|4|5; estMinutes: number;
  competencyFocus: Dimension[];
  budgetHours: number;
  title: L; brief: L;                           // the initial (often misleading) training request
  organization: { name: L; sector: L; size: L; background: L; structure: OrgUnit[] };
  strategy: { priorities: L[]; initiatives: L[]; successMeasures: L[]; externalPressures: L[] };
  evidence: Evidence[];                         // all discoverable facts and documents
  stakeholders: Stakeholder[];
  rootCauses: RootCause[];                      // true causes AND distractors
  capabilityGaps: CapabilityGap[];
  interventions: InterventionFit[];             // fit per intervention × root cause
  kpiModel: KpiDefinition[];
  rubric: ScenarioRubric;                       // per-dimension criteria (section 4)
  debrief: { expertReasoning: L; keyQuestions: QuestionRef[]; methodologyLinks: string[];
             nextScenarios: string[] };
}

interface Evidence { id: string; kind: "document"|"data"|"observation"|"claim";
  title: L; body: L; sourceStakeholderId?: string; costHours: number;
  supports: string[]; contradicts: string[];    // rootCause ids
  critical: boolean; unlock?: Condition }

interface Stakeholder { id: string; role: Role; name: L; title: L;
  objectives: L[]; concerns: L[]; perspective: L; bias: { type: string; note: L };
  initialOpenness: number; questions: QuestionNode[] }

interface QuestionNode { id: string; text: L; costHours: number;
  quality: "critical"|"strong"|"neutral"|"weak"|"leading"|"solution-first";
  stage: 1|2|3; available?: Condition;          // e.g. { hasEvidence: "ev-erp-budget" }
  responses: { when?: Condition; reply: L; reveals?: string[]; opennessDelta: number }[];
  dimensions: Partial<Record<Dimension, number>>; whyItMatters: L }

type Condition = { all?: Condition[]; any?: Condition[]; not?: Condition;
  hasEvidence?: string; asked?: string; opennessGte?: [string, number] };
```

Scenario files are validated with **Zod** at build time and in tests, so a broken reference
(e.g. an evidence id that doesn't exist) fails CI instead of failing the user.

---

## 4. Scoring methodology (transparent rubric)

Eight dimensions, each scored 0–100 from **named criteria defined in the scenario rubric**.
The Methodology page and every report show exactly which criteria were met.

| # | Dimension | Typical criteria (examples) |
|---|---|---|
| 1 | Strategic Alignment | Reviewed the strategy before interviews; linked the diagnosis to a stated priority; KPIs trace to a strategic objective |
| 2 | Stakeholder Engagement | Covered the critical stakeholder groups (incl. frontline); kept openness ≥ threshold; reconciled conflicting views |
| 3 | Diagnostic Thinking | Share of **critical/strong** questions in all questions; challenged ≥ N assumptions with evidence; logged and then revised hypotheses |
| 4 | Root Cause Identification | Precision/recall vs the true root causes; distractors avoided |
| 5 | Evidence-Based Decisions | Each selected cause is linked to supporting evidence; contradicting evidence was acknowledged |
| 6 | Capability Assessment | Gaps correctly classified (skill vs organisational barrier); future-capability gap identified |
| 7 | Solution Appropriateness | Sum of intervention fit (essential +, supportive +, neutral 0, harmful −); every root cause addressed |
| 8 | Business Impact Orientation | KPI tree spans levels; baseline, target, owner and timeline present; business vs learning metrics separated |

**Anti-gaming rules**
- **Quality, not volume:** Diagnostic Thinking uses a *ratio* of good questions plus coverage
  of the scenario's critical questions. Weak or irrelevant questions dilute the score and also
  spend budget.
- **Premature-training penalty:** if training is selected in Stage 5 and no selected or true
  root cause is of type `skill`, Solution Appropriateness is **capped at 40**. Proposing a
  training solution during interviews (a `solution-first` question) also costs openness and
  points.
- **Unsupported claims:** a root cause with no linked evidence earns at most 30% of its value.

**Overall score** = weighted mean of the dimensions (default equal weights; a scenario may
re-weight, and the weights are shown). Bands: *Order-taker (<40) · Practitioner (40–59) ·
Business Partner (60–79) · Strategic Consultant (80+)*.

**Feedback outputs** are all derived from data: missed critical questions (with `whyItMatters`),
critical evidence not investigated, incorrect assumptions (hypotheses contradicted by found
evidence), harmful interventions selected, and recommended methodology.

---

## 5. Bilingual architecture

- **Locale routing** `/{ar|en}/…` with `next-intl`. `<html lang dir>` is set per locale.
  Default locale comes from the stored preference, then the browser language.
- **RTL done properly:** Tailwind *logical* utilities only (`ms-/me-/ps-/pe-/start-/end-`), a
  lint rule against `ml-/mr-/left-/right-`, mirrored directional icons, and charts drawn
  RTL-aware.
- **Typography:** an Arabic face (proposal: **IBM Plex Sans Arabic**, which pairs well with
  Inter/IBM Plex Sans), with larger line-height and no letter-spacing on Arabic. Final choice
  follows the IK guidelines.
- **Content:** UI strings live in `ar.json` / `en.json`. Scenario strings are co-located as
  `{en, ar}` pairs, so a scenario can't ship half-translated (the Zod schema rejects empty
  strings). Arabic is authored as natural Modern Standard business Arabic, not literal
  translation. I recommend native-speaker review of the flagship scenarios.
- **Progress survives switching** because attempt state stores only ids, never text. Switching
  language re-renders the same attempt.
- **Numbers and dates** use `Intl` with the locale (Arabic-Indic or Latin digits selectable in
  Settings, defaulting to Latin digits for data readability).

## 6. Theme architecture

- **Semantic CSS variables** (`--surface`, `--surface-raised`, `--text`, `--text-muted`,
  `--primary`, `--border`, `--chart-1..6`, provenance colours…) defined for `light` and `dark`.
  Tailwind maps to the variables, and components never use raw hex.
- **`next-themes`:** Light / Dark / System, persisted, with a no-flash inline script.
- **Placeholder palette (to be replaced by the IK guidelines):** navy text `#0B1F3A` on white /
  `#F3F7FC` surfaces with blue primary `#1F5FBF` (light). Deep navy `#071426` → `#0E2240`
  layered surfaces, accent `#5B9BF0` (dark). Every text/background pair is checked for WCAG AA
  contrast in both themes.

## 7. Exports

- **PDF:** a dedicated print-optimised report route plus `window.print()`. That is the only
  approach that renders Arabic shaping and RTL correctly without shipping heavy fonts into a
  JS PDF library. It is labelled "Save as PDF" truthfully.
- **CSV:** generated client-side (scores, evidence log, interventions, KPIs), UTF-8 with BOM so
  Arabic opens correctly in Excel.

---

## 8. Scenario library scope (honest sizing)

A scenario at the depth you describe (8+ stakeholders × 10–20 branching questions, 25–40
evidence items, root causes, fit matrix, KPI model, bilingual) runs to roughly **8–15k words of
authored content**. 24 of them is a book-length authoring effort. Proposed delivery:

| Phase | Scenarios (full depth, bilingual) |
|---|---|
| 2 | 3 flagships: **Foundation**: Quality & Error Reduction · **Intermediate**: Digital Transformation Failure · **Advanced**: AI Adoption & Workforce Readiness |
| 4 | +6 (one more per category gap, e.g. Succession Readiness, Change Resistance, Regulatory Transformation, Strategic Workforce Planning, Cross-functional Collaboration, Leadership Effectiveness) |
| Later | Remaining 15, authored on the same schema (content-only work, no engine changes) |

The library shows only playable scenarios, so there are no dead cards. The Methodology page
can list the planned catalogue as a roadmap.

**Flagship example (Intermediate, Digital Transformation Failure), outline only:**
*Request:* "Our managers need digital-leadership training; the new ERP adoption is at 34%."
*Conflicting views:* CEO says execution discipline; CHRO says leadership capability; CIO says
user resistance; COO says the operating model was never redesigned; frontline employees say
the workflows are duplicated (paper plus system) and approval rules weren't changed.
*True root causes:* processes not redesigned for the ERP (process), KPIs still reward legacy
throughput (governance/performance management), and a super-user network that was defunded
(resource). *Distractor:* manager digital skill, which is real but minor.
*Best portfolio:* process redesign, KPI realignment, reinstated super-users plus job aids,
targeted coaching for a manager subset. A broad leadership program scores as *neutral to
harmful*.

---

## 9. Implementation roadmap

| Phase | Deliverables | Exit test |
|---|---|---|
| **1** Foundation | New app scaffold; token/theme system (L/D/System); ar/en routing + RTL; IK-branded shell with all 8 nav sections (sections without features yet show a clear empty state, not fake data); Scenario Library with filters (difficulty, category, complexity, duration, competency); engine core (reducer, conditions, budget, persistence, Zod schema) with a small *test* scenario | Vitest engine suite; Playwright screenshots of every page × {ar,en} × {light,dark}; axe accessibility pass |
| **2** Scenarios & discovery | 3 flagship scenarios; stakeholder interview UI with openness, branching, challenge-with-evidence; evidence board with provenance labels; Stage 1–2 complete | Full playthrough of each flagship in both languages |
| **3** Diagnosis → impact | Stage 3 tools (5 Whys, Fishbone, Gap, optional 7S lens); Stage 4 capability matrix; Stage 5 portfolio builder; Stage 6 KPI tree; full 8-dimension scoring + debrief | Scoring unit tests incl. anti-gaming cases (question spam, training-first) |
| **4** Reports & growth | Executive report (13 sections, ar/en, print-PDF, CSV); My Simulations with replay + attempt comparison; Analytics & Development profile; Dashboard metrics; +6 scenarios | Report export verified in both languages; end-to-end regression in 4 combos |

---

## 10. Decisions needed from you

1. **Brand:** please share the IK guidelines (hex codes, logo, fonts), or approve the
   placeholder navy/blue tokens for now.
2. **Reference app:** allow `ask-before-you-train.netlify.app` in the environment's network
   settings if you want the teardown before Phase 1. Otherwise I'll proceed from the concept.
3. **App placement:** approve a separate `ik-lna-simulator/` app alongside the existing
   website (recommended), or tell me to merge it into the website.
4. **Engine approach:** approve deterministic authored scenarios (recommended) over live-LLM
   stakeholders.
5. **Persistence:** approve local-first (no accounts) for Phases 1–4.
6. **Scenario scope:** approve 3 flagship scenarios in Phase 2 and +6 in Phase 4, with the
   rest after that.
