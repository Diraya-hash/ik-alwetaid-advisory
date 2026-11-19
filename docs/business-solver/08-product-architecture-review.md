# 08: Product & Architecture Review

> Status: **Review of design pack v0.1 (docs 00–07). No application code.**
> Date: 2026-11-19 · Branch: `claude/laughing-dirac-cx72w0`
> Scope: consistency audit, vision fit, framework intelligence, requirements coverage, commercial direction, readiness.
> Rule followed: docs 00–07 are **not modified**. Every proposed change is listed in §11 (Change Register) for approval.

> **Status update (2026-11-19):** D1–D4 approved, together with the additional product decisions (15 frameworks + differentiation rules; draft-first; Gantt as an Action Plan view; vector search removed if the eval confirms; Problem-Solving Summary; export in AR/EN/original; future KSA in-Kingdom option; pricing undecided; 24-week plan). The Change Register (§11) has been **applied in design pack v0.2** (docs 00–07 updated; doc 09 created). This review is kept unchanged as the record of the v0.1 audit. Remaining open decisions: 00-README "Open decisions".

**Severity scale used throughout**

| Level | Meaning |
|---|---|
| **Critical** | Must be resolved (decision + doc update) **before implementation starts**. Otherwise we face legal exposure, a broken core promise, or costly rework of core schemas |
| **High** | Must be resolved **before the affected sprint starts**. Material risk to MVP success, timeline or cost |
| **Medium** | Resolve during the MVP. Affects quality, efficiency or clarity |
| **Low** | Polish, clarity or housekeeping |

---

## 0. What changed since the pack was written: the reference PDF

The PDF *"50 Business Diagrams for Strategic Planning"* (Creately) has now been **provided**. It has **not been ingested**: no chunks, no catalogue records, no KB entries were created. For this review I only **inspected** it: its table of contents, the 16 entries that cover the MVP frameworks, the cover and back pages, and the text layer. Facts established:

| # | Observation (fact, from the PDF) | Consequence for the design |
|---|---|---|
| P1 | Every page carries **"All Rights Reserved. Copyright © Cinergix Pty. Ltd. 2023"**. No licence or reuse grant appears anywhere in the document | See **C1**. The pack's assumed usage rights (03 §2: *index, short quotation, derive*) are **not supported by the document itself** |
| P2 | 56 pages: cover, 4 contents pages, **50 one-page entries** (printed pages 1–50 = PDF pages 6–55), and a back-cover advert | Page locators need both the printed page and the PDF page index (offset +5) |
| P3 | Entries are grouped into 7 source categories: Brainstorming, Documentation, Meeting, Project Management, Research & Analysis, Strategy & Planning, Task Management | These categories are editorial. They don't match problem-solving logic: 5 Whys sits under *Strategy & Planning*, Gantt under *Task Management*. **They must not drive recommendation** (our taxonomy, 04 §2, is correctly independent) |
| P4 | Each entry follows the same structure: a definition paragraph, *When to Use* (4–6 bullets), *How to Use* (3–8 steps), *Creately Resources* links, a template image with a "Click here to use template" link. ~200–330 words each. Text layer present (~14,200 words total) | The PDF has **no** "when not to use", inputs/outputs, worked examples, validation guidance, or Arabic. **Roughly 80 % of what the framework metadata schema (03 §4) needs must be platform-authored.** The PDF is a *seed reference*, not a sufficient knowledge base (see **H5**) |
| P5 | All 15 MVP frameworks are present, as **16 entries**. PEST and STEEPLE are separate entries | The pack's "15 active + 35 pending (F16–F50)" is wrong: **16 source entries are covered, 34 remain pending** (see **H1**) |
| P6 | MVP entries are **not** at positions 1–15. Their printed page numbers: BPMN 5, Organizational Chart 7, SIPOC 9, Value Stream Map 10, Action Plan 12, Cause and Effect 15, Impact Effort Matrix 27, Operating Model Canvas 30, PEST 32, Project Charter 35, Risk Assessment Matrix 36, Stakeholder Map 39, STEEPLE 40, SWOT 43, 5 Whys 47, Gantt 49 | `catalogue_no` in 03 §5 (1–15 = MVP order) conflicts with its own definition ("position in the 50-item catalogue") |
| P7 | The Operating Model Canvas entry credits its originators (Campbell, Gutierrez, Lancelott) | Methodology originators need attribution separate from the source document (see **M8**) |
| P8 | Stakeholder Map: the text describes *interest × influence*, while the template image uses *influence × support (champion/detractor)* | The source is internally inconsistent; our design (power × interest) must make an explicit choice (see **M9**) |
| P9 | 5 Whys: the PDF says to repeat "why" "at least five times"; our definition (03 §4.3) allows 1–7 with a hint at 3 | Source and platform guidance can disagree, and we need a display rule (see **M10**) |

Frameworks 16–50 remain **pending**. They are not named, catalogued or described in this review. Activating them requires ingestion (task K-2) **and** resolution of C1.

---

## 1. Executive assessment

**Overall verdict: the architecture is sound, and the product definition is ~80 % right. The pack is not yet implementation-ready. It is ready for Phase 0 (foundations and de-risking spikes), not for feature sprints.**

What is strong and should be kept:
- The **deterministic-workflow + schema-validated LLM** architecture (DR-05, DR-11) and the **hybrid recommender** (DR-07). This is the right shape for an explainable, auditable "AI consultant". It is the part competitors built on generic chat won't easily copy.
- **Frameworks as data** (DR-08) and **one diagram model, many renderers** (DR-12). Both are correct long-term bets.
- **Postgres-only + RLS + append-only versions** (DR-14/15/16). Simple, enterprise-credible, residency-friendly.
- The **context sufficiency gate**. It directly implements "don't recommend without enough context" and is measurable.

What must change before building (4 Critical findings):
1. **C1: The knowledge source is all-rights-reserved.** The product cannot rely on the PDF's content as a reusable knowledge base without a licence or legal opinion. The pack hedged this; the PDF itself now confirms the risk.
2. **C2: The fact/assumption/suggestion model has a loophole.** It treats unverified user statements as "facts" and silently turns edited assumptions into unlabelled user input. This undermines the core trust promise.
3. **C3: The AI Critic, now an explicit requirement, is only sketched** as optional per-step hints. There is no cross-artifact critic, no schema, no storage, no UX and no evaluation.
4. **C4: The 15-framework set has no method for the most common consulting question:** "what should we do?" (option generation). The recommender also has no honest "no good fit" outcome. The promise *"we help you solve business problems"* breaks exactly where users need it most.

Biggest simplification opportunity: **drop vector RAG from the MVP** (H5). The whole PDF is ~19k tokens and our framework KB will be ~60–90k tokens, so it fits in a cached prompt prefix. That removes an embedding sub-processor, an index and a bake-off, saving ~2 engineer-weeks.

Biggest planning risk: **the timeline is internally inconsistent** (README "14 weeks" vs roadmap ≈ 20 weeks to GA) **and optimistic** for the team size (H3, H15). A realistic GA is **~24 weeks** with the scope changes proposed here.

---

## 2. Design pack audit findings

### 2.1 The 12 deliverables: accounted for?

| # | Deliverable | Location | Status | Gap (finding) |
|---|---|---|---|---|
| 1 | PRD | 01 | ✅ Complete | Phase labels conflict with roadmap (H3) |
| 2 | Technical architecture | 02 §0–5, 7–8 | ✅ Complete | RAG over-scoped for MVP (H5) |
| 3 | Knowledge base data schema | 03 §1–3, 05 §3.6 | ⚠️ Complete with corrections | Catalogue identity (H1), originator attribution (M8), licence default (C1) |
| 4 | Framework metadata schema | 03 §4 | ⚠️ Complete with corrections | Slot paths don't resolve (H2); NLP checks inside deterministic rules (M3) |
| 5 | AI recommendation logic | 04 §4–5 | ⚠️ Partial | No options stage, no "no good fit" outcome (C4); dynamic enum (M2) |
| 6 | Problem classification taxonomy | 04 §2 | ✅ Complete | "Nature" axis largely redundant (M7) |
| 7 | User journey & application flow | 01 §5 | ⚠️ Partial | Journey ✅. **Application flow is thin**: no screen inventory, IA, navigation, empty/error states or design-system spec (H12) |
| 8 | MVP feature prioritisation | 01 §8 | ⚠️ Complete with corrections | Chaining and Critic under-prioritised vs. requirements (C3, H4) |
| 9 | Database architecture | 05 | ✅ Complete | Dual source of truth (M5), version explosion (M4), no critique/billing tables (C3, H13) |
| 10 | Visualisation architecture | 02 §6 | ⚠️ Complete with corrections | Arabic text metrics server-side (H10), PPTX graph-export risk (H9) |
| 11 | Security & privacy | 06 | ✅ Complete | KSA government residency path (H11) |
| 12 | Roadmap | 07 | ⚠️ Needs re-plan | Inconsistent and optimistic timeline (H3, H15) |

**Decision records:** 20 DRs, each with rationale. Alternatives are documented for most; DR-17, DR-19 and DR-20 have thin alternative analysis (acceptable).

### 2.2 Cross-document alignment check

| Check | Result |
|---|---|
| PRD features ↔ engines (02 §3) | ✅ Every FR maps to an engine. ❌ The new AI Critic requirement has no FR and no engine owner (C3) |
| Engines ↔ DB schema (05) | ✅ Mostly. ❌ No tables for critique findings, entitlements/subscriptions or translation status |
| AI logic (04) ↔ schemas (03) | ❌ **Slot paths disagree.** 03 §4.3 preconditions use `problem.recurrence` and `problem.causal_complexity_estimate`, and the description cites `process.boundaries`. The diagnosis schema (04 §3) puts these under `signals.*`, and `process.boundaries` exists nowhere (H2) |
| Claim model (03 §3) ↔ UI rules (01 §5.2) ↔ validators | ❌ Four claim types in the schema, three badges in the UI, and V3 converts edits to `user_input`, which hides assumptions (C2) |
| Catalogue (03 §5) ↔ README ↔ the PDF | ❌ "15 + 35", `catalogue_no` semantics, PEST/STEEPLE merge (H1) |
| PRD phases ↔ roadmap phases | ❌ PRD "Phase 2" = post-MVP; roadmap "Phase 2" = Beta-2 + GA. DOCX/XLSX and brand templates: PRD says Phase 2, roadmap says Phase 3. Sharing: PRD §8 says Phase 2, FR-WS-5 says MVP-should, roadmap puts it in S9 (pre-GA) (H3) |
| README timeline ↔ roadmap | ❌ README: "MVP … 14 weeks". Roadmap: Phase 0 weeks 0–3 (that's 4 weeks, labelled 3), GA at week 19–20 (H3) |
| Roles (01 FR-AD-2 ↔ 05 ↔ 06) | ❌ PRD lists five flat roles; DB/security use org roles (owner/admin/member/guest) + workspace roles (admin/editor/commenter/viewer) (M1) |
| Auth (06 §2 ↔ 06 §1) | ❌ "MFA for password users", but the design has no passwords (magic link + Google/Microsoft) (L1) |
| Embedding swap claim (02 §3.3) ↔ DDL (05) | ❌ `vector(1024)` fixed column vs. "side-by-side re-embedding" (L2) |
| Gantt ↔ Action Plan | ⚠️ Two independent data models for the same tasks/owners/dates; they will drift (H4) |
| Export language (01 FR-EX-*, export dialog) ↔ "generate natively, never translate" (02 §4.2) | ❌ The export dialog lets users pick a language, but no translation policy exists (H6) |
| Workweek (03 §5 notes) ↔ GCC reality | ❌ "Sun–Thu default for GCC locales". The UAE moved to a Mon–Fri working week (Sat–Sun weekend) in 2022; Saudi Arabia is Sun–Thu. The workweek must be per organisation/country, not per locale (M6) |

### 2.3 Unnecessary complexity in the MVP

| Item | Why it's excess for MVP | Proposal | Saving |
|---|---|---|---|
| Vector RAG for the global KB (pgvector, HNSW, embedding bake-off, RRF, Stage C retrieval) | The PDF is ~14k words; the platform KB will be ~60–90k tokens. Both fit in a cached prompt prefix. With 15 frameworks, Stage C adds little recall | **Long-context KB in the cached prefix** for MVP. Postgres FTS for evidence uploads. Keep the `chunks` schema and add vectors when uploads exceed context budgets (H5) | ~2 eng-weeks, one fewer sub-processor |
| Five-axis taxonomy | Axis C "nature" duplicates Axis B "stage" (`cause_unknown` ≈ `FIND_ROOT_CAUSE`). Weight γ is only 0.10 | Keep A, B, D, E. Derive "nature" for display (M7) | Simpler prompt, fewer eval labels |
| Separate Gantt data model | Duplicates Action Plan data | **Gantt = timeline view of the Action Plan** (still a catalogued framework, same content) (H4) | ~1 week, no drift |
| Organisation → Workspace → Project for individual users | Two layers of admin for a solo user | Auto-create a personal org and workspace; hide the workspace UI until Teams (M15) | UX friction |
| Debounced 2-second autosave versions | Thousands of versions per project | Session checkpoints + explicit "save version" + AI-run versions (M4) | Storage, history noise |
| Native-PPTX for *every* visual type at GA | Graph layouts (BPMN, VSM, fishbone, org chart) with RTL connectors are the riskiest export work | Native for tables/matrices/canvases/lists; graph types native "best effort" with a vector-image fallback flag (H9, decision D8) | Removes the top GA risk |
| Information-gain question selection | Elegant but heavy to tune | Keep as designed. It is cheap to compute and well specified. **Not cut** | — |

---

## 3. Critical gaps and inconsistencies

### C1 (Critical): The primary knowledge source is all-rights-reserved

- **Fact:** every page states "All Rights Reserved. Copyright © Cinergix Pty. Ltd. 2023". No licence is granted. The document also promotes Creately's own product (template links, resource links, back-cover advert). Creately is a **potential competitor** in AI-assisted business diagramming.
- **Problem:** the brief positions the PDF as the "primary knowledge source". The pack (03 §2) *assumed* rights to index, quote and derive "pending confirmation". The document gives no basis for that assumption. Storing its text in our product database, showing excerpts, or presenting our content as derived from it could create copyright and unfair-competition exposure. Using the Creately name in UI attribution raises trademark questions.
- **What is not at risk:** the underlying **methodologies** (SWOT, 5 Whys, SIPOC, etc.) are generic professional knowledge, not owned by Creately. The platform can author its own content about them, as the pack already does (`platform_authored`).
- **Recommendation:**
  1. Legal opinion (KSA copyright law; rights holder is an Australian company) **or** ask Cinergix/Creately for a written licence or partnership.
  2. **Default posture until resolved:** the PDF is an **internal editorial reference only**. It is used by our content team to check coverage and terminology. It is **not** ingested into the product KB, **not** quoted in the UI, **not** cited by name in user-facing output, and never shown visually. All product knowledge is `platform_authored` and SME-reviewed.
  3. Keep the attribution machinery (03 §2–3) for future licensed sources.
- **Impact on the brief:** "Preserve source attribution" still holds: we attribute **methodology originators** (M8) and any licensed sources. We do not attribute to an unlicensed PDF. **Decision D1.**

### C2 (Critical): The claim model conflates *how true* with *who wrote it*

- **Problem 1:** 03 §3 defines `fact` as "stated by the user **or** supported by cited evidence". A user saying "complaints rose 30 %" is *user-reported*, not verified. The UI shows both with the same solid "Fact" badge, so the deliverable will present hearsay as fact.
- **Problem 2:** `user_input` is a fourth "claim type", but it describes **authorship**, not truth status. Rule V3 converts any edited claim to `user_input` (no badge). **An AI assumption whose wording the user tweaks loses its assumption label.** That is exactly the leak the requirement forbids.
- **Problem 3:** the requirement names **three** categories (facts, assumptions, AI suggestions). The schema has four, and the UI shows three, inconsistently.
- **Fix (two orthogonal fields, no extra concepts for the user):**

  | Field | Values | Meaning |
  |---|---|---|
  | `claim_type` | `fact` · `assumption` · `ai_suggestion` | Truth status. **Only changes by explicit user action** ("Mark as verified", "Accept suggestion") |
  | `basis` (facts only) | `user_reported` · `document_evidence` · `measured_data` | Shown as a sub-label: "Fact · reported by you" vs "Fact · from *Q3 report.xlsx*" |
  | `provenance.origin` | `ai` · `user` · `system` · `imported` | Authorship (already exists in 03 §3) |

  Validator updates: V1 applies to `basis ≠ user_reported`. V3 is replaced by "editing never changes `claim_type`". Accepting an `ai_suggestion` turns it into a **user-endorsed** suggestion, a recommendation the user owns, which is still not a fact. **Decision D2.**

### C3 (Critical): The AI Critic is required but not designed

- **Current state:** optional per-step `ai_critique` hints (03 §4.2, 04 §6) and the `fw.<id>.critique` prompt. There is no schema (`ai/critique.v1` is referenced but undefined), no storage, no FR, no UI, no eval metric, and **no cross-artifact checking**.
- **Why it matters:** the critic is what makes the product behave like a *consultant* rather than a generator. It is also the main defence against confident-but-wrong outputs reaching a board deck.
- **Proposed design (fits the existing architecture; no new service):** a **Quality & Critic module** owned by Engine 4 (Framework Builder), with Engine 6 calling it before export.

  | Level | Trigger | Method | Examples of findings |
  |---|---|---|---|
  | L1 Element | On edit | **Deterministic rules only** (moved from JSONLogic custom ops, M3) | Empty owner, end date before start, duplicate item, risk without likelihood |
  | L2 Instance | Step completion / "Review" button | LLM critic with a **separate prompt and persona** from the generator, rubric-based, structured output | Vague SWOT items, 5 Whys that drift or blame individuals, fishbone with one dominant category, unscored risks |
  | L3 Project (cross-artifact) | Before export + on demand | LLM critic over the diagnosis + all instances + port links | Root cause with no countermeasure; Action Plan items not traceable to any cause or option; goals in the diagnosis not addressed; facts contradicting each other across artifacts; unverified assumptions that the recommendation depends on |

  - Output `ai/critique.v1`: `findings[] {id, level, severity: blocker|warning|suggestion, category, target {artifact_id, version, json_pointer}, message, suggested_fix?, evidence_refs[]}`.
  - Storage: new table `workspace.critique_findings` (status `open|accepted|dismissed|resolved`, with dismissal reason feeding evals).
  - UX: a "Consultant review" panel. Findings are anchored on the canvas, never auto-applied. Export shows unresolved blockers and lets the user override with an acknowledgement recorded in the manifest.
  - Eval: critic **precision** ≥ 0.8 on a seeded-defect set (a nagging critic gets ignored) and recall ≥ 0.7 for blockers.
  - Priority: **MVP Must.** L1 + L2 in Beta-1, L3 in Beta-2. **Decision D3.**

### C4 (Critical): No method for "what should we do?", and no "no good fit" outcome

- **Coverage analysis of the 15 frameworks across problem-solving stages (04 §2.3):**

  | Stage | MVP frameworks | Coverage |
  |---|---|---|
  | UNDERSTAND_CONTEXT | SWOT, PEST/STEEPLE | ✅ |
  | MAP_CURRENT_STATE | SIPOC, BPMN, VSM, Org Chart | ✅ (strong) |
  | FIND_ROOT_CAUSE | 5 Whys, Cause & Effect | ✅ |
  | **GENERATE_OPTIONS** | **none** | ❌ **gap** |
  | PRIORITISE_DECIDE | Impact/Effort | ⚠️ thin: prioritises a list but doesn't compare alternatives against criteria |
  | PLAN_EXECUTION | Project Charter, Gantt, Action Plan | ✅ (overlapping) |
  | ALIGN_PEOPLE | Stakeholder Map | ✅ |
  | MANAGE_RISK | Risk Matrix | ✅ |
  | DESIGN_ORGANISATION | Org Chart, Operating Model Canvas | ✅ |

- **Problem:** after diagnosing a root cause, the natural next question is "what are our options?". The pack's canonical chains jump straight from cause to Impact/Effort with no defined way to *produce* the options to prioritise. The taxonomy defines `GENERATE_OPTIONS` and `solution_unknown`, but the recommender has nothing eligible for them. Separately, the recommendation output only has `ok | insufficient_context`. When nothing fits well (customer-journey problems, competitive positioning beyond SWOT), the engine will force a weak match.
- **Fix, without inventing frameworks:**
  1. Add a **platform "Generate options" step** (not a new catalogue framework) as the first step of Impact/Effort, and as a chain bridge. It takes `cause_list` / `goal` ports in and emits `option_list`. Options are `ai_suggestion` items grounded in the causes, plus user additions. Optionally, critic L2 checks that options cover the top causes.
  2. Add `status: "no_good_fit"` to `ai/recommendation-set.v1` when the best final score is below the Low band: "None of the current methods fits well. Here's the closest, and why." Log a **demand signal** with the taxonomy codes. That log drives which pending catalogue entries to activate first.
  3. Option-generation and decision methods from the PDF's *Brainstorming* section are candidates for the **first activation wave after ingestion and C1 resolution**. They are not named or specified here, per instruction. **Decision D4.**

---

## 4. Technical risks and recommendations

### 4.1 High-severity findings

| ID | Finding | Recommendation |
|---|---|---|
| **H1** | **Catalogue identity is wrong** against the actual source. `catalogue_no` is defined as the source position but populated in MVP order. "15 + 35" should be "16 source entries covered (PEST and STEEPLE separate) + 34 pending" | Separate **our framework ID** from **source entry refs**: `source_refs: [{source_document_id, entry_no, printed_page, pdf_page}]`. PEST/STEEPLE stays **one** framework with a variant parameter, mapped to **two** source entries. Drop `catalogue_no` as an identity; the pending count is 34 |
| **H2** | **Diagnosis slot paths don't resolve** (03 §4.3 vs 04 §3). The sufficiency gate and preconditions would silently score 0 | Create a single **Diagnosis Slot Registry** (`packages/taxonomy/slots.json`): slot ID → JSON pointer, type, label AR/EN, question template, weight. Preconditions, the gate, question selection and the critic reference **slot IDs, never raw paths**. CI check: every referenced slot exists in the schema |
| **H3** | **Phase and timeline contradictions**: README 14 weeks vs. roadmap ~20; Phase 0 "3 weeks" = 4; PRD "Phase 2" ≠ roadmap "Phase 2"; DOCX/XLSX, brand templates and sharing placed differently in 01 vs 07 | Adopt **one** vocabulary: *Phase 0 Foundations → Beta-1 → Beta-2 → GA → Teams → Enterprise → Scale*. Re-issue 01 §6/§8 and 07 against it (§8 below) |
| **H4** | **Chaining is under-specified for a "Must" requirement.** FR-FB-6 is "Should"; port types are informal strings; the Action Plan (the sink of most chains) has no input ports; Gantt duplicates Action Plan data | Promote chaining to **Must** (Beta-2). Define a **Port Type Registry** (`cause_list`, `option_list`, `prioritised_option_list`, `action_list`, `risk_list`, `stakeholder_list`, `process_step_list`, `factor_list`) with JSON Schemas. Action Plan accepts `prioritised_option_list`, `cause_list` (countermeasures) and `risk_list` (mitigations). **Gantt becomes a view** over Action Plan content (same instance, second visual). Hand-offs are **copy-with-link**: the downstream instance records the source version, and the critic flags drift when the upstream changes |
| **H5** | **RAG over-engineered for MVP** (see §2.3). PDF ≈ 19k tokens; platform KB ≈ 60–90k tokens | MVP: framework KB entries in the cached system prefix (prompt caching makes repeat cost marginal); evidence uploads → text extraction → in-context (≤ ~150 pages per project) + Postgres FTS for lookup. Defer embeddings, HNSW and the bake-off until evidence volume or org-KB (Teams phase) needs them. **Keep** the chunk ID / citation validator design: chunk IDs work without vectors. **Decision D5** |
| **H6** | **Export-language policy missing.** The design says "generate natively, never machine-translate", yet the export dialog offers a language choice. GCC consultants routinely deliver the same analysis in Arabic *and* English | Make content language a property of each artifact version. "Export in other language" triggers an explicit **AI translation job** that creates a *translated version* (status `translated_unreviewed`, badge on export, glossary-enforced), with a review step. Native generation stays the default. **Decision D7** |
| **H7** | **Unit economics unvalidated.** Target ≤ $0.60 per completed analysis on the default model | Rough estimate below (§4.3) puts a single-framework analysis at **~$0.5–0.9** and a 4-framework chain at **~$1.6–3.0**. This is feasible but tight, and drives pricing (§7). Run a **cost/latency spike in Phase 0** on 20 golden cases with effort sweeps per route before setting price points |
| **H8** | **Sequential latency.** Diagnosis (≤ 25 s p90) → recommendation (≤ 15 s p90) means ~40 s before the user sees options | Stream the diagnosis card progressively (designed). **Speculatively start Stage A–B scoring** on partial diagnosis. Show "while I think" UX (the reframed problem first). Measure in the Phase 0 spike; consider lower effort on the re-rank route if eval holds |
| **H9** | **Native, editable PPTX with RTL for graph diagrams** (BPMN, VSM, fishbone, org chart, Gantt connectors) is the single riskiest export task. It was scheduled late (S6) | Move a **PPTX RTL spike into Phase 0** (two visuals: matrix + swimlane flow, AR and EN, opened in PowerPoint Win/Mac and Keynote). Policy: native objects for tables/matrices/canvases/lists at Beta. Graph types native where the spike passes, else vector image (EMF/SVG) + "edit in app" link, flagged in the manifest. **Decision D8** |
| **H10** | **Arabic text measurement for layout.** ELK and custom layouts need text widths. The browser measures with real shaping; the Node worker (PPTX/PNG) has no browser fonts by default. Layouts would differ between the screen and the exports, and Arabic labels would overflow | Run **all layout in one place**: compute layout in headless Chromium (already present in the worker for PDF) or use a HarfBuzz-based shaper with the same font files in both environments. Store `LaidOutDiagram` geometry with the version so every export uses identical geometry. Add a visual-regression test on AR labels |
| **H11** | **KSA government segment vs. residency.** Government entities typically require in-Kingdom hosting and data classification controls. Availability of the default model *in-Kingdom* is not established | Sequence segments: private sector, consultants and SMEs first, with an explicit "do not enter classified data" policy and data-classification guidance in onboarding. Government/regulated customers come with the **Enterprise phase**, after verifying a compliant inference route (in-region provider endpoint or approved self-hosted model via the gateway). **Decision D10** |
| **H12** | **No application-flow / IA / design-system spec** for an "enterprise-grade" product | Before Beta-1 UI work: screen inventory (≈ 14 screens), navigation model, state matrix (empty/loading/streaming/error/partial/stale), RTL component specs, bilingual typography scale, design tokens (reusing the simulator's), and an interaction spec for the canvas + inspector. Deliver as doc 09 |
| **H13** | **Commercial plumbing missing:** subscriptions, entitlements, payment, VAT, e-invoicing | Add a billing module: plans/entitlements table, metering → entitlement checks, a GCC payment gateway supporting **mada** and cards, **15 % KSA VAT**, and **ZATCA e-invoicing (FATOORA)** compliant invoices in Arabic. Required before paid GA in KSA |
| **H14** | **No "closure".** The design produces analyses and decks, but the promise is to *solve* problems. Nothing ties the work back to the original problem or tracks outcomes | Add a **Problem-Solving Summary** artifact (the consultant's synthesis: problem → diagnosis → causes → chosen options → plan → open assumptions → critic status) as the default first section of every deliverable. Add a lightweight **outcome check-in** (Teams phase): Action Plan status and "is the problem resolved?" at a chosen date |
| **H15** | **Timeline optimistic for the team** (≈ 6.5 FTE). 15 frameworks, 10 renderers, 3 exporters, critic, chaining, bilingual QA in 16 build weeks | Re-plan to **GA ≈ week 24** (§8), using the simplifications in §2.3 to absorb the critic and chaining additions |

### 4.2 Medium and Low findings

| ID | Sev. | Finding | Recommendation |
|---|---|---|---|
| M1 | Medium | Role model differs between 01 and 05/06 | Adopt 05's two-level model in the PRD |
| M2 | Medium | Per-request JSON Schema enum of candidate IDs (04 §5.5) creates a new schema every call. That adds schema-processing overhead and prevents reuse | Use a **stable enum of all active framework IDs**. Enforce candidate-set membership in the validator (reject → one repair call). Same safety, stable schema |
| M3 | Medium | "Deterministic" validation rules use ops that need NLP (`max_pairwise_similarity`, `mentions_individual_blame`) | Keep JSONLogic strictly deterministic (counts, dates, required fields). Move semantic checks to Critic L2 (C3) |
| M4 | Medium | 2-second debounced autosave creates a version per pause | Edit sessions hold an in-memory draft. A version is committed on step completion, explicit save, AI run, navigation away, or 5 minutes of activity. Named checkpoints |
| M5 | Medium | `framework_instances.step_state` duplicates the artifact content | The projection is derived from the current version (same transaction). The artifact is the single source of truth |
| M6 | Medium | Workweek defaulted by locale; wrong for the UAE | Org setting `workweek` + `country`, defaulted from org country (KSA: Sun–Thu; UAE: Mon–Fri). Calendars (Gregorian/Umm al-Qura) independent of locale |
| M7 | Medium | Taxonomy axis C duplicates axis B | Remove "nature" from the extraction schema for MVP and derive it from stage for display |
| M8 | Medium | No field for **methodology originators** (e.g. the Operating Model Canvas's authors), separate from source documents | Add `framework.origin_attribution {originators[], year?, canonical_reference?}`, platform-authored and SME-verified |
| M9 | Medium | Stakeholder Map axes: our power×interest vs. the source's two variants | Parameterise: `axes: power_interest (default) | influence_support`. Both share the `matrix_2x2_scatter` visual |
| M10 | Medium | Source vs. platform guidance can disagree (5 Whys depth) | Platform guidance governs the product. When a licensed source differs, show "Some references recommend…" in the Explain panel. Never silently merge |
| M11 | Medium | No product-analytics event taxonomy, though metrics depend on it | Define ~30 events (journey steps, accepts/rejects, critic actions, exports) with a privacy-safe schema; no content in events |
| M12 | Medium | Org Chart is data-entry-heavy and PII-prone | Role-based by default; CSV import; names optional and subject to the PII policy |
| M13 | Medium | VSM needs process metrics users rarely have; it was recommended in the worked example (04 §5.7) | Add a precondition `measurable_symptom` + "data-light VSM" mode (estimates flagged as assumptions). Lower its default stage weight until data exists |
| M14 | Medium | Deeply nested schemas with many `$ref` claims may hit structured-output schema limits or slow generation | Flatten output schemas per route (claims as an array with IDs, referenced by ID). Verify against the API's current structured-output constraints during the Phase 0 spike |
| M15 | Medium | Org → Workspace → Project friction for individuals | Hide workspaces for solo plans |
| M16 | Medium | Web on Vercel (02 §7) conflicts with region-pinned residency | Serve web from the same regional stack for residency tenants; Vercel acceptable only for the global SaaS stack |
| L1 | Low | "MFA for password users", but there are no passwords | Reword: MFA via IdP; WebAuthn for magic-link accounts optional |
| L2 | Low | `vector(1024)` fixed vs. model swap | Moot if H5 is approved; otherwise use per-model embedding tables |
| L3 | Low | Page locators | Store `printed_page` and `pdf_page` (offset +5 for this PDF) |
| L4 | Low | Source contains marketing links ("Click here to use template", resource links) | Strip at ingestion; never index or display |
| L5 | Low | Working name "Advisory Studio" vs. approved identity "Business Problem Solver" | Rename across docs on approval (§11) |
| L6 | Low | 00-README "PDF not found" is now outdated | Update status on approval (§11) |
| L7 | Low | No notification spec (export ready, share invite, critic results) | In-app + email, bilingual templates |
| L8 | Low | `artifacts.kind` lacks `critique`, `summary`, `translation` | Extend the enum with C3, H6, H14 |

### 4.3 Unit-economics estimate (assumption-based, to be replaced by Phase 0 measurement)

Assumptions: default model at list price ($4 / $20 per million input/output tokens; cached reads far cheaper). Stable prefix ~40–60k tokens cached. Output includes adaptive-thinking tokens.

| Call | Input (k tok, of which cached) | Output (k tok) |
|---|---|---|
| Diagnosis | 15 (12) | 3–6 |
| Clarify phrasing (1 round) | 3 (2) | 0.5 |
| Recommendation re-rank | 18 (14) | 3–5 |
| Pre-fill, 3 steps | 24 (15) | 6–9 |
| Critic L2 + L3 | 20 (12) | 3–6 |
| Narrative / summary | 12 (8) | 2–3 |
| **Total, one framework** | **~92 (63)** | **~18–30** |

≈ $0.12 uncached input + ~$0.02 cached + $0.36–0.60 output → **~$0.50–0.75**; up to ~$0.90 with a second clarify round or repairs. A 4-framework chain re-uses the diagnosis, so it is ≈ **$1.6–3.0**. Output (thinking) tokens dominate, so **per-route effort tuning** is the main cost lever (02 §4.4). This estimate is a planning assumption, not a measurement.

---

## 5. MVP scope confirmation

### 5.1 Vision fit: the seven user capabilities

| # | Capability | Supported? | Notes / required change |
|---|---|---|---|
| 1 | Describe a challenge in natural language | ✅ | AR/EN, attachments (simplified per H5) |
| 2 | Understand & diagnose | ✅ | Diagnosis card + gate. Fix C2 typing, H2 slots |
| 3 | Discover suitable frameworks | ⚠️ | Hybrid recommender ✅. Add options step + `no_good_fit` (C4) |
| 4 | Apply via guided steps | ✅ | Builder. Add **draft-first** mode (§6) |
| 5 | Editable diagrams | ✅ | Canonical model, bidirectional editing. Fix H10 |
| 6 | Professional deliverables | ⚠️ | PPTX/PDF ✅. Add Problem-Solving Summary (H14), export language policy (H6), PPTX fallback policy (H9) |
| 7 | Save & manage projects | ✅ | Workspace + versions. Fix M4/M5 |

**Positioning check.** *"Simplicity in experience. Sophistication in intelligence."* The intelligence side is well designed. The **experience side is at risk**: the current default is a step-by-step stepper with chat panel, inspector, four badge types, a sufficiency meter and fit bands. That is powerful, but it reads as a *tool*, not a *consultant*. See §6 for the remedy.

### 5.2 Requirements coverage

| Requirement | Status | Finding |
|---|---|---|
| Arabic & English interfaces | ✅ | Reuse of simulator i18n |
| Full RTL/LTR | ✅ / ⚠️ | Rules defined (02 §6.5); server-side Arabic layout (H10) |
| Enterprise-grade UX | ⚠️ | No IA or design-system spec (H12) |
| Editable diagrams, not static images | ✅ in app / ⚠️ in PPTX | H9 fallback policy needs approval (D8) |
| PowerPoint & PDF exports | ✅ | H6, H9 |
| Evidence-based recommendations | ✅ | Diagnosis pointers + KB chunk IDs; C1 changes *which* KB is citable |
| Facts / assumptions / AI suggestions | ❌ until C2 | Core schema fix |
| Framework chaining & multi-step | ⚠️ | H4, C4 |
| Project history & version control | ✅ | M4, M5 |
| AI Critic | ❌ until C3 | New module design in C3 |

### 5.3 Framework intelligence review

**Is the 15-framework selection appropriate?** Mostly yes. It covers 8 of 9 problem-solving stages and matches what GCC excellence, strategy and PMO offices actually use. Per-framework assessment:

| Framework | Problem-solving value | Build complexity | Data burden on user | Verdict |
|---|---|---|---|---|
| SWOT | Medium (overused) | Low | Low | Keep; guard against over-recommendation (below) |
| PEST/STEEPLE | Medium | Low | Low | Keep as **one** framework with a variant; maps to two source entries |
| SIPOC | High (process scoping) | Low–Med | Low | Keep; natural first step for process problems |
| BPMN | High | **High** | Medium | Keep as **BPMN-lite** (as designed). Beta-2 |
| Value Stream Mapping | High where data exists | **High** | **High** | Keep, with data-light mode (M13). Beta-2 |
| Org Chart | Low alone, medium in chains | Medium | Medium; PII | Keep; role-based + CSV (M12) |
| Operating Model Canvas | High for org design | Medium | Medium | Keep; credit originators (M8) |
| 5 Whys | High | Low | Low | Keep |
| Cause & Effect | High | Medium | Low | Keep |
| Risk Matrix | High | Low–Med | Low | Keep; configurable scale |
| Stakeholder Map | High | Low–Med | Low | Keep; axis variant (M9) |
| Project Charter | High | Low | Low | Keep |
| Gantt | Medium | Medium | Medium | Keep **as a view of the Action Plan** (H4) |
| Impact/Effort | High | Low | Low | Keep; **add the options step** (C4) |
| Action Plan | **Critical** (chain sink) | Low | Low | Keep; define input ports (H4) |

**Gaps:** option generation (C4), structured multi-criteria decisions, and customer-experience problems (`CX.*` has no customer-specific method; it falls back to process and root-cause tools). Fill these from the pending catalogue **after** ingestion and C1. Do not invent frameworks for them now.

**Can the recommender match intelligently?** The *architecture* can. The *intelligence* doesn't exist yet. It depends entirely on two assets that are still to be built: the hand-authored affinity/stage matrices (04 §5.2 seeds are a reasonable start) and the golden set. Clear cases with 15 frameworks will be easy. The hard part is **confusable pairs**, and each needs an explicit discriminating rule and ≥ 15 golden cases:

| Confusable set | Discriminating signal (slot) | Default rule |
|---|---|---|
| SWOT vs PEST/STEEPLE | Is the question about *our* position (internal + external) or the external environment only? | External-only → PEST; position/strategy choice → SWOT; both → chain PEST → SWOT |
| SWOT vs everything (over-selection risk) | Stage ≠ UNDERSTAND_CONTEXT | Cap SWOT's stage-fit outside its stages; `not_recommended` explanation required |
| Cause & Effect vs 5 Whys | `causal_complexity_estimate`, number of suspected causes | ≥ 3 plausible causes or a cross-functional scope → C&E first; single clear failure chain → 5 Whys |
| SIPOC vs BPMN vs VSM | Boundaries known? Steps known? Time/waste the issue? | Boundaries unknown → SIPOC; steps unclear or hand-offs → BPMN; lead time/waste with data → VSM |
| Project Charter vs Action Plan vs Gantt | Is it a new initiative needing sponsorship/scope, or a decided set of actions? Are dates needed? | New initiative → Charter; decided actions → Action Plan (+ Gantt view when dates and dependencies exist) |
| Org Chart vs Operating Model Canvas | Is the problem reporting lines, or how capabilities/processes/locations/systems fit? | Structure-only → Org Chart; delivery model → OMC |
| Impact/Effort vs Risk Matrix | Are the items options to choose among, or threats to manage? | Options → Impact/Effort; threats → Risk Matrix |

**MVP scope, confirmed with changes**

| In MVP (GA) | Changed vs. pack | Out of MVP |
|---|---|---|
| Diagnosis + gate + clarify (slot registry) | H2 | Vector RAG / embeddings (H5) |
| Hybrid recommender + `no_good_fit` + demand log | C4, M2 | Document upload > ~150 pages per project |
| Builder: guided **and** draft-first modes | §6 | Real-time co-editing |
| 15 frameworks (Gantt as Action Plan view; options step in Impact/Effort) | H4, C4 | Frameworks from the pending 34 (until ingestion + C1) |
| **AI Critic L1–L3** | C3 (new) | Brand templates, DOCX/XLSX (Teams phase) |
| **Chaining via port registry** (Must) | H4 | SSO/SCIM, org KB, admin console |
| Problem-Solving Summary artifact | H14 (new) | Outcome check-ins (Teams phase) |
| Claim model v2 (type + basis + origin) | C2 | Sharing beyond read-only link + comments |
| Exports: PDF (all), PNG/SVG (all), PPTX (native for list/matrix/canvas/table; graph types per spike) + AI-translated version option | H6, H9 | |
| Versioning with checkpoints | M4 | |
| Billing: plans, entitlements, mada, VAT, ZATCA | H13 (new) | |

---

## 6. Product and UX improvements

1. **Make the consultant visible (persona and voice).** Define the "AI Management Consultant" interaction contract: it restates the problem before solving, asks *few, sharp* questions, says what it assumes, disagrees politely ("I'd challenge the assumption that the system is the cause…"), and always ends with a *so-what* and a next step. Write a voice-and-tone guide for both languages (MSA business register in Arabic, no literal translation of English idioms).
2. **Draft-first by default, stepper on demand.** Current default: walk the user through each step. Proposed: after selection, the consultant **produces a complete first draft** of the framework, with every item badged, then invites review ("3 items need your confirmation"). "Workshop mode" (the step-by-step stepper) stays for users who want to build it themselves or facilitate a group. This is the single biggest lever for *simplicity in experience* and for the < 20-minute G1 target.
3. **Journey rail.** A persistent, slim progress rail: *Problem → Diagnosis → Approach → Analysis → Plan → Deliverable*, with chained frameworks shown as sub-steps. It replaces the need to understand the state machine and gives the "consulting engagement" feel.
4. **Calmer trust UI.** Badges only on non-user content; collapsed into a count per section ("2 assumptions") with an expandable **Assumptions Register** panel. One legend and one colour language. Facts show their basis on hover (C2). Avoid a "Christmas tree" of badges.
5. **The Consultant Review moment.** Before export, show a single review screen with the critic's L3 findings, open assumptions and stale upstream artifacts. Resolve, dismiss with a reason, or export anyway (recorded). This turns quality control into a feature users can feel.
6. **Problem Brief first.** The first deliverable page or slide is always the one-page *Problem-Solving Summary* (H14). Executives read that page; the frameworks are the appendix of reasoning.
7. **GCC-relevant starting points.** Example challenges and project templates relevant to the market: government service turnaround times, Vision-2030 programme initiatives, excellence-award preparation, Saudization/localisation workforce planning, shared-services set-up. Content only, no new frameworks.
8. **Arabic-first craft.** Design screens in Arabic first and mirror to English, not the reverse. Make the Hijri/Gregorian dual date display, the Arabic numeral option and right-aligned tables first-class. Test with Arabic-first users in every usability round (D-1).
9. **Mobile.** Read, review and approve (critic findings, assumptions, deliverable preview) on mobile. Authoring stays desktop-first; say so explicitly in the PRD.
10. **Failure UX.** Every AI step has a manual path (already a principle). Add explicit states for *streaming*, *partial*, *repairing*, *refused* and *stale* to the state matrix (H12).

---

## 7. Commercial considerations

> All items here are **planning hypotheses**, not decisions. No prices are set.

### 7.1 Segment assessment (KSA first, then GCC)

| Segment | Core need | Buying behaviour | Data constraints | Fit with MVP | Priority |
|---|---|---|---|---|---|
| Individual professionals (managers, analysts) | Fast, credible analysis and decks | Card or mada, monthly, self-serve | Low | High | **Launch** |
| Independent consultants & boutiques | Client-grade output, multiple clients, own branding | Self-serve, annual; price-sensitive but value-driven | Client confidentiality | High (branding comes in the Teams phase) | **Launch** |
| SMEs | Structured improvement without hiring consultants | Small-team plans; procurement light | Low–Medium | Medium–High | **Launch → Teams** |
| Large private enterprises (banks, telcos, energy, healthcare groups) | Governed, standard problem-solving across units | RFP/procurement; 3–9 month cycles; SSO, DPA | Residency, vendor security review | Enterprise phase | **Pilot during Beta**, contract later |
| Government & semi-government (excellence / strategy / transformation offices) | Methodical analysis aligned to excellence and strategy programmes; Arabic deliverables | Formal procurement; very long cycles | **In-Kingdom hosting, data classification, sector controls** | Only after H11 | **Later**, high value |

**Go-to-market:** use IK Alwetaid Advisory's existing consulting relationships for **design partners** (5–8 organisations in Beta-1), and its website as the acquisition channel for professionals and consultants. Be careful to keep partner data out of eval sets without consent (04 §9).

### 7.2 Recommended pricing structure (structure only)

**Model:** seat-based subscription tiers with a **monthly allowance of "analysis credits"** (fair use), annual discount, plus add-ons. Prices in **SAR**, VAT shown separately.

| Tier | For | Includes (indicative) | Gating logic |
|---|---|---|---|
| **Free / Trial** | Evaluation | Limited projects and credits; watermarked exports; all MVP frameworks | Lets users experience the full journey once; the watermark protects paid value |
| **Professional** | Individuals | Monthly credits, unwatermarked PPTX/PDF, version history | Core paid tier |
| **Consultant** | Independents / boutiques | More credits, client workspaces, brand templates (when shipped), bilingual export | Monetises client-delivery value |
| **Team** | SMEs / departments | Per seat (minimum seats), shared workspaces, comments, admin, pooled credits | Collaboration is the upgrade trigger |
| **Enterprise** | Large orgs / government | Annual contract: SSO/SCIM, residency, org KB, custom frameworks, SLA, security review, pooled credits | Priced by seat band + platform fee |
| **Add-on: Expert Review** | Any paid tier | A certified IK Alwetaid consultant reviews the analysis and deliverable (fixed scope, SLA) | **Unique differentiator**: AI + human consulting, using the firm's existing capability |
| **Add-on: credit packs** | Heavy users | Extra analyses | Protects margin without hard stops |

**Logic:**
1. **Seats** match how organisations budget (predictable, procurement-friendly). Pure usage pricing is hard for SMEs and government to budget.
2. **Credits** protect gross margin against variable AI cost. A chained analysis costs ~3–4× a single one (§4.3), so one credit ≈ one framework instance completed, and chains consume several.
3. **The value metric is the completed analysis or deliverable**, not tokens. Users understand "analyses per month".
4. **Margin guardrail:** price per credit ≥ 4–5× the measured AI cost per framework instance (target ≥ 75 % gross margin after infrastructure). Set it only after the H7 spike.
5. **Validation:** price-sensitivity interviews (e.g. Van Westendorp) with Beta-1 design partners, and willingness-to-pay for Expert Review. Track conversion from free to paid by trigger (watermark, credits, collaboration).

**Commercial compliance (KSA):** 15 % VAT, ZATCA-compliant Arabic e-invoices, mada support, Arabic terms of service and privacy policy (PDPL), and Arabic-language support hours aligned to the Sun–Thu working week.

### 7.3 Competitive and strategic risks

| Risk | Note | Mitigation |
|---|---|---|
| Substitution by general assistants (chat + slide tools) | Users can get "a SWOT" anywhere | Compete on **diagnosis rigour, the critic, typed claims, chaining and Arabic-native deliverables**, not on generating a diagram |
| Diagramming platforms adding AI (including the source PDF's publisher) | They own templates and distribution | Our moat is **problem-solving logic**, not templates. Also reinforces C1: don't build on their content |
| Arabic quality perception | One bad Arabic deck damages trust | Native reviewers and Arabic-specific eval gates (04 §9) |
| Over-trust | Board decisions on AI output | Claim typing, critic, AI disclosure, Expert Review add-on |

---

## 8. Prioritised action plan

### 8.1 Before implementation (Phase 0 entry gate): resolve the Criticals

| # | Action | Resolves | Owner | Effort |
|---|---|---|---|---|
| A1 | Decide the source posture; start the legal opinion and/or a licence request to the rights holder | C1 | Product + Legal | 1 week to decide; legal in parallel |
| A2 | Approve claim model v2; update 03 §3, 01 §5.2, validators | C2 | Product + AI eng | 2 days |
| A3 | Approve Critic design; add FRs, `ai/critique.v1`, `critique_findings` table, eval metrics | C3 | Product + AI eng | 3 days |
| A4 | Approve options step + `no_good_fit` + demand log | C4 | Product + SME | 2 days |
| A5 | Issue **design pack v0.2** applying the approved changes (§11) | All | Architect | 3–4 days |

### 8.2 Phase 0 (revised: 5 weeks): foundations + de-risking spikes

| # | Action | Resolves |
|---|---|---|
| B1 | Slot Registry + Port Type Registry (schemas + CI checks) | H2, H4 |
| B2 | **Spike: cost & latency** on 20 golden cases with per-route effort sweeps; set the cost baseline | H7, H8, M14 |
| B3 | **Spike: PPTX RTL** (matrix + swimlane, AR/EN, PowerPoint Win/Mac, Keynote) | H9 |
| B4 | **Spike: unified Arabic layout** (Chromium layout service vs. HarfBuzz) | H10 |
| B5 | Taxonomy v1.0 (axes A, B, D, E) + confusable-pair rules + golden set v0 (≥ 15 cases per confusable pair) | M7, §5.3 |
| B6 | Platform-authored KB for the 15 frameworks (AR/EN), SME-reviewed, originator attribution | C1, M8 |
| B7 | Doc 09: IA, screen inventory, state matrix, design tokens, consultant voice guide | H12, §6 |
| B8 | Scaffolding, i18n port, DB + RLS, Model Gateway (as in roadmap E-1…E-4) | — |
| B9 | Billing and compliance design (entitlements, payment gateway, VAT, ZATCA) | H13 |
| B10 | Discovery: 8–10 interviews (AR-first users) + pricing hypotheses | §7 |

### 8.3 Revised delivery sequence (supersedes 07 on approval)

```
Phase 0  Foundations & spikes             wk 0–4   (5 wks)
Beta-1   8 frameworks, critic L1–L2,       wk 5–12  (4 sprints)
         draft-first, PDF/PNG export, claim model v2
Beta-2   +7 frameworks (Gantt as view),    wk 13–20 (4 sprints)
         chaining, critic L3, PPTX, summary artifact, translation
Hardening & GA  pen test, AR/EN visual     wk 21–24 (2 sprints)
         regression, billing/ZATCA, perf
Teams    sharing+, brand templates, DOCX/XLSX, outcome check-ins, first activations from pending catalogue
Enterprise  SSO/SCIM, residency (incl. KSA route), org KB + embeddings, admin
```

### 8.4 Medium/Low items
Folded into the sprint where the affected component is built: M1–M16 and L1–L8 (see §4.2). None blocks Phase 0.

---

## 9. Decisions requiring your approval

| # | Decision | Recommendation | Alternative(s) |
|---|---|---|---|
| **D1** | How to use the Creately PDF (all rights reserved) | **Internal editorial reference only** until legal clearance or a licence. All product knowledge is platform-authored. No excerpts or brand attribution in the product | (a) Seek a licence/partnership; (b) proceed with short attributed quotations on a legal fair-dealing opinion |
| **D2** | Claim model | **v2: `claim_type` (fact/assumption/ai_suggestion) + `basis` + `origin`**. Edits never change type | Keep v1 (four types), not recommended |
| **D3** | AI Critic scope for MVP | **L1 + L2 in Beta-1, L3 in Beta-2**, findings stored, never auto-applied | L1 + L2 only at GA (cheaper, weaker promise) |
| **D4** | Option-generation gap | **Platform "Generate options" step + `no_good_fit` outcome**; pending-catalogue methods only after ingestion | Delay until catalogue activation (leaves the gap at GA) |
| **D5** | RAG in MVP | **Long-context cached KB; no embeddings/vector index in MVP** | Keep DR-09 as designed (+~2 weeks, +1 sub-processor) |
| **D6** | Gantt | **View of the Action Plan** (same data, separate visual and catalogue entry) | Independent framework instance (as designed) |
| **D7** | Export in the other language | **Explicit AI translation job → translated version, flagged and reviewable** | Export only in the content language |
| **D8** | PPTX for graph diagrams | **Native where the Phase 0 spike passes; otherwise vector image + "edit in app", flagged** | Native for all 15 at GA (higher schedule risk) |
| **D9** | Timeline | **GA ≈ week 24** with the scope in §5.3 | Keep ~20 weeks by moving BPMN and VSM after GA (13 frameworks at GA) |
| **D10** | Segment sequencing | **Professionals, consultants and SMEs first; private-enterprise pilots in Beta; government after a verified in-Kingdom route** | Government-first (needs residency on day 1, ~3–6 months extra) |
| **D11** | Pricing structure direction | **Seat tiers + analysis credits + Expert Review add-on**; prices after the cost spike and WTP interviews | Pure usage pricing; flat unlimited (margin risk) |
| **D12** | Default interaction mode | **Draft-first ("Consultant mode"), stepper as "Workshop mode"** | Stepper default (as designed) |
| **D13** | Naming | Adopt **"Business Problem Solver"** across the docs; brand name TBD | Keep the working name |
| **D14** | Expert Review add-on | **Include in the commercial plan** (operational design in the Teams phase) | Pure software product |

---

## 10. Final readiness assessment

| Area | Readiness | Blocking items |
|---|---|---|
| Product vision & positioning | 🟡 Ready with changes | C4, H14, §6 |
| Requirements (PRD) | 🟡 Ready with changes | C3 (FRs), H3, H4 |
| Architecture (engines, platform) | 🟢 Ready | H5 simplification recommended, not blocking |
| AI logic & recommendation | 🟡 Ready with changes | C4, H2, M2; golden set not yet built |
| Knowledge base & sources | 🔴 Not ready | **C1** (licence), B6 platform content not yet authored |
| Trust model (facts/assumptions/suggestions) | 🔴 Not ready | **C2** |
| AI Critic | 🔴 Not ready | **C3** |
| Database | 🟢 Ready | M4, M5 minor |
| Visualisation & exports | 🟡 Ready after spikes | H9, H10 |
| Security & privacy | 🟢 Ready (for the private-sector launch) | H11 for government |
| Commercial | 🟡 Direction set | H13, pricing validation |
| Roadmap | 🟡 Re-plan required | H3, H15 |

### Verdict

**Not yet ready for feature implementation. Ready to start Phase 0 now.**

- **Can start immediately** (not affected by any open decision): scaffolding, i18n/RTL port, DB + RLS skeleton, Model Gateway, taxonomy work, golden-set construction, and the three spikes (cost/latency, PPTX RTL, Arabic layout).
- **Ready for Beta-1 feature sprints when:** D1–D4 are decided, design pack v0.2 applies the Critical changes (A5), the Slot and Port registries exist (B1), and doc 09 (IA/UX) is drafted (B7). Expected: **end of Phase 0 (≈ week 4–5)**.

---

## 11. Change register (proposed edits to docs 00–07, pending approval)

No edits have been made to docs 00–07. On approval, design pack **v0.2** applies:

| Doc | Section | Change | Finding |
|---|---|---|---|
| 00 | Source status, summary item 10, title | PDF now provided (not ingested); licence posture per D1; timeline per D9; product name per D13; add row for docs 08–09 | C1, H3, L5, L6 |
| 01 | §5.2, §6.4, §6.6, §8, new §6.9 | Claim model v2; draft-first mode; chaining → Must; Critic FRs (FR-QC-1…6); Problem-Solving Summary; export translation; roles per 05; billing FRs; phase vocabulary | C2, C3, H3, H4, H6, H13, H14, M1 |
| 02 | §3.3, §3.4, §3.6, §6.4, §7, DR index | RAG deferred (DR-09 amended); Critic module in Engine 4; unified layout service; PPTX fallback policy; regional web hosting | H5, C3, H10, H9, M16 |
| 03 | §2, §3, §4.1, §4.2, §5 | Licence default = internal reference; claim model v2; `source_refs` with entry/page; drop `catalogue_no` identity; originator attribution; slot IDs; deterministic-only rules; 16 covered / 34 pending; Stakeholder axis variant; Gantt as Action Plan view | C1, C2, H1, H2, M3, M8, M9, H4 |
| 04 | §2, §4, §5.2–5.6, §6, §9 | Drop axis C; slot registry; stable enum; `no_good_fit`; options step; confusable-pair rules; critic prompts and evals | M7, H2, M2, C4, C3 |
| 05 | §3.3–3.4, §3.6, new tables | Checkpoint versioning; derived projection; `critique_findings`; billing/entitlement tables; artifact kinds; vector columns deferred | M4, M5, C3, H13, L8, H5 |
| 06 | §2, §4 | MFA wording; government segment sequencing; source licence posture in §7 | L1, H11, C1 |
| 07 | All | Replace with §8.3 sequence; Phase 0 spikes; billing; Critic | H3, H15 |
| 09 (new) | — | IA, screen inventory, state matrix, design system, consultant voice | H12 |
