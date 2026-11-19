# 01: Product Requirements Document

## 1. Problem statement

Managers, consultants and transformation leads face messy business problems: falling service levels, a failing rollout, unclear ownership, a strategic choice. Methodologies for these problems exist: SIPOC, 5 Whys, SWOT and dozens more. Three gaps get in the way of using them:

1. **Selection gap.** People default to the 2–3 frameworks they know, often the wrong ones. SWOT is used for a process defect. Brainstorming is used where root-cause analysis is needed.
2. **Application gap.** Knowing a framework's name is not the same as running it well. Typical failures are vague SIPOC boundaries, "5 Whys" that stop at a symptom, and risk matrices with no scoring logic.
3. **Deliverable gap.** Turning the analysis into a board-ready deck takes hours of formatting.

Generic chat assistants close the third gap partly and the first two badly. They recommend frameworks without enough context, mix facts with invention, and produce text instead of structured, editable artifacts.

## 2. Product vision

> Describe any business challenge in plain Arabic or English. Get a diagnosed problem, the right methodology with a reason, guided application, a professional visual, and a ready-to-present deliverable. Every step can be edited, has evidence attached, and is saved to the project.

**Positioning:** a *specialised consulting copilot*, not a general chatbot and not a diagramming tool. Diagramming tools give you a blank canvas. We give you the *right* canvas, already filled from your own situation, and we show our reasoning.

## 3. Target users and personas

| Persona | Context | Primary job-to-be-done | Success signal |
|---|---|---|---|
| **P1 Operational manager** (primary MVP) | Department head in a GCC public or semi-government entity or a mid-size enterprise. Bilingual, Arabic-first in writing. | "Help me understand why X keeps happening and give me a plan I can present on Sunday." | Exports a deck and presents it |
| **P2 Internal consultant / PMO / Excellence office** (primary MVP) | Runs improvement projects. Knows frameworks but is time-poor. | "Speed up the analysis and the deliverables while keeping the rigour." | Uses ≥3 frameworks per project; edits rather than rewrites |
| **P3 Independent consultant / boutique firm** (secondary) | Client work; needs branded output. | "Produce client-grade output under my brand." | Custom templates; multiple client workspaces |
| **P4 Enterprise transformation office** (Phase 3) | Many users, governance, data residency. | "A standard, governed way of solving problems across the organisation." | SSO, audit, admin analytics |

**Non-users (explicitly out of scope):** financial modelling and valuation, legal advice, HR decisions about named individuals (see 06 §6), and real-time BI.

## 4. Goals and non-goals

### Goals (MVP)
- G1: A user goes from a free-text challenge to an exported PPTX in **under 20 minutes** for a single-framework analysis.
- G2: **≥80 %** of recommendations are rated "relevant" or "very relevant" by users (thumbs plus a reason). Expert panel agreement on the top-3 recommendation is **≥70 %** on the golden set (04 §9).
- G3: **Zero** unlabelled claims. Every generated statement carries a claim type, and every `fact` has an evidence reference.
- G4: Arabic quality is on par with English. Arabic users' task-completion rate is within 5 pts of English users' rate.
- G5: Every generated artifact can be edited, and every edit is versioned.

### Non-goals (MVP)
- Real-time multi-user co-editing (Phase 3; MVP has share plus comment).
- Integrations with Jira, MS Project or Visio (Phase 3+).
- Free-form diagramming canvas. We are not building a drawing tool.
- Mobile-native apps (the responsive web app is enough).
- Fine-tuned models (DR-10).

## 5. Core user journey

```
① Describe ─▶ ② Diagnose ─▶ ③ Recommend ─▶ ④ Select ─▶ ⑤ Apply (guided) ─▶ ⑥ Visualise ─▶ ⑦ Export
     ▲             │  ▲              │                       │  ▲                 │
     │             ▼  │              ▼                       ▼  │                 ▼
     └──── clarify (context gate) ◀──┘              edit / regenerate      chain to next framework
```

### 5.1 Step-by-step flow (screens and system behaviour)

| Step | User sees | System does | Output artifact | Exit criterion |
|---|---|---|---|---|
| **① Describe** | One large composer ("Describe your challenge…") with optional attachments (PDF, DOCX, XLSX, ≤20 MB) and 6 example prompts in the UI language. | Detects language. Runs a PII scan (06 §5). Creates the Project and Conversation. | `ChallengeStatement v1` | Text ≥ 20 words, or the user forces continue |
| **② Diagnose** | A *Diagnosis card* with: problem statement (reframed), category (taxonomy), symptoms vs. suspected causes, stakeholders, constraints, unknowns, and the **context sufficiency meter**. | Diagnosis Engine extracts a structured `ProblemDiagnosis`. Scores context sufficiency (04 §4). | `ProblemDiagnosis v1` | Sufficiency ≥ 0.65, or the user overrides with an acknowledged warning |
| ②a **Clarify** (loop) | 1–4 targeted questions as chips or short inputs, each with a "Why I'm asking" tooltip. Max 2 rounds before we offer to proceed. | Picks the questions with the highest *information gain* over the candidate frameworks (04 §5.3). | `ProblemDiagnosis vN` | As above |
| **③ Recommend** | 3 ranked framework cards (+ "show more"). Each shows: fit score band (High/Med/Low, not a fake-precise %), *why it fits* tied to diagnosis facts, *what you'll get*, effort (time, inputs needed), a "when NOT to use" note, and source attribution. Also shows a suggested **chain** (e.g. Cause & Effect → 5 Whys → Impact/Effort → Action Plan). | Recommendation Engine (04 §5). | `RecommendationSet v1` | User selects ≥ 1 |
| **④ Select** | Confirm the framework or chain. Optional: "Explain this framework" (RAG answer with citations). | Instantiates a `FrameworkInstance` from the `FrameworkDefinition`. | `FrameworkInstance (draft)` | — |
| **⑤ Apply** | **Split view.** Left: guided steps from the definition, as a stepper. Right: live preview of the visual. Each step is pre-filled by AI from the diagnosis (marked *AI suggestion*). The user accepts, edits or rejects each item. Inline validation ("this 'why' restates the previous one"). | Framework Builder runs step prompts. Validates against the framework rules. Tracks the provenance of every element. | `FrameworkInstance` (content JSON, versioned) | All required steps valid |
| **⑥ Visualise** | Full-screen interactive diagram: zoom, drag where the layout allows, inline edit, toggle provenance badges, AR/EN switch, theme. | Visualization Engine renders the canonical `DiagramModel`. | `DiagramModel` | — |
| **⑦ Export** | Export dialog: format (PPTX / PDF / PNG / SVG; DOCX and XLSX in Phase 2), language, template, include-appendix (evidence & assumptions), include-provenance-badges. | Deliverables Generator (async job). | `Deliverable` file plus manifest | Download / share link |

### 5.2 Cross-cutting UX rules
- **Chat stays available** as a side panel at every step ("make the risks more specific to procurement"). Chat edits create new artifact versions. They never silently overwrite.
- **Three visual claim types** everywhere: `Fact` (solid badge, with source), `Assumption` (dashed badge; user can confirm it, which turns it into user-asserted), `AI suggestion` (sparkle badge until the user accepts it). `user_input` gets no badge, because it is the user's own words.
- **Undo and history**: per-artifact version timeline. Compare two versions. Restore any version.
- **Never a dead end**: every framework output offers "Next best framework" (from the chain graph, 04 §5.6).
- **RTL**: mirrored layout. Diagrams with a direction (process flows, Gantt timelines, fishbone spine) **mirror in RTL**. Matrices keep mathematical axis semantics, with labels localised (02 §6.5).

## 6. Functional requirements

Priority: **M** = MVP must, **S** = MVP should, **C** = could / later. IDs are stable for traceability into tickets.

### 6.1 Conversation & input
| ID | Requirement | P |
|---|---|---|
| FR-IN-1 | Free-text challenge input, AR or EN, mixed-language tolerated | M |
| FR-IN-2 | Auto-detect language per message. UI language and output language can be set separately | M |
| FR-IN-3 | Attach documents (PDF, DOCX, XLSX, CSV, TXT). Extracted content becomes *project evidence* and can be cited | S |
| FR-IN-4 | Example prompts per persona and category | M |
| FR-IN-5 | Voice input (AR/EN) | C |

### 6.2 Diagnosis
| ID | Requirement | P |
|---|---|---|
| FR-DX-1 | Produce `ProblemDiagnosis` JSON (04 §3) with claim typing | M |
| FR-DX-2 | Classify into taxonomy L1/L2 (04 §2) with confidence. Multi-label allowed (max 3) | M |
| FR-DX-3 | Context sufficiency score with an explanation of what is missing | M |
| FR-DX-4 | Clarifying-question loop (max 2 rounds by default, configurable) | M |
| FR-DX-5 | User can edit every diagnosis field. Edits re-trigger recommendation (debounced, explicit "Re-run") | M |
| FR-DX-6 | Detect out-of-scope or unsafe requests and decline gracefully (04 §7) | M |

### 6.3 Recommendation
| ID | Requirement | P |
|---|---|---|
| FR-RC-1 | Return 1–5 ranked frameworks, only from the *active* catalogue | M |
| FR-RC-2 | Each recommendation carries rationale bullets linked to diagnosis fields (by JSON pointer) | M |
| FR-RC-3 | Each carries a `when_not_to_use` caution and prerequisites | M |
| FR-RC-4 | Suggest a methodology chain (sequence) when the problem needs one | S |
| FR-RC-5 | "Not enough context" response instead of recommendations when below the gate | M |
| FR-RC-6 | User feedback per recommendation (👍/👎 plus reason code), stored for evaluation | M |
| FR-RC-7 | User can browse the full library and pick a framework manually (bypass) | M |

### 6.4 Guided application (Framework Builder)
| ID | Requirement | P |
|---|---|---|
| FR-FB-1 | Stepper driven by `FrameworkDefinition.steps` | M |
| FR-FB-2 | AI pre-fill per step from the diagnosis and evidence, marked `ai_suggestion` | M |
| FR-FB-3 | Accept / edit / reject per element. Bulk accept | M |
| FR-FB-4 | Deterministic validation rules (e.g. Risk Matrix: likelihood and impact are both set) plus AI quality hints | M |
| FR-FB-5 | "Explain this step" with RAG citations | S |
| FR-FB-6 | Carry outputs between chained frameworks (e.g. top fishbone causes → 5 Whys seeds) via declared `output_ports`/`input_ports` | S |
| FR-FB-7 | Manual mode: fill the framework with no AI at all | M |

### 6.5 Visualisation
| ID | Requirement | P |
|---|---|---|
| FR-VZ-1 | Interactive render for all 15 MVP visual types | M |
| FR-VZ-2 | Inline edit on canvas, synced with the structured form (single source of truth) | M |
| FR-VZ-3 | RTL/LTR correct rendering, bilingual labels | M |
| FR-VZ-4 | Provenance overlay toggle | S |
| FR-VZ-5 | Light/dark plus print theme. Brand theme per workspace | S / C |
| FR-VZ-6 | Accessible: keyboard navigation, text alternative (table view) for every diagram | M |

### 6.6 Deliverables
| ID | Requirement | P |
|---|---|---|
| FR-EX-1 | PPTX export: title, executive summary, one or more slides per framework, assumptions & evidence appendix | M |
| FR-EX-2 | PDF report export (A4, RTL-aware) | M |
| FR-EX-3 | PNG/SVG export of a single diagram | M |
| FR-EX-4 | DOCX report; XLSX for tabular frameworks (Action Plan, Risk register, Gantt) | S (Phase 2) |
| FR-EX-5 | Workspace templates (logo, colours, fonts, master slides) | C (Phase 2) |
| FR-EX-6 | Exports are *editable* native objects (PPTX shapes and tables, not screenshots) | M |
| FR-EX-7 | Every export embeds a manifest (project, artifact versions, generation date, AI-disclosure footer option) | M |

### 6.7 Workspace & history
| ID | Requirement | P |
|---|---|---|
| FR-WS-1 | Projects list, search, filters (category, framework, status) | M |
| FR-WS-2 | Project holds conversation(s), diagnosis, framework instances, evidence, deliverables | M |
| FR-WS-3 | Full version history per artifact. Restore. Diff view for JSON artifacts | M |
| FR-WS-4 | Activity log per project (who, what, when) | M |
| FR-WS-5 | Share project read-only by link (org-scoped) or invite a collaborator (comment/edit) | S |
| FR-WS-6 | Duplicate a project as a template | C |
| FR-WS-7 | Soft delete with 30-day restore. Hard delete on request | M |

### 6.8 Administration (enterprise-ready foundations in MVP, UI later)
| ID | Requirement | P |
|---|---|---|
| FR-AD-1 | Multi-tenant org model: Organisation → Workspace → Project | M (data model) |
| FR-AD-2 | Roles: Owner, Admin, Editor, Commenter, Viewer | M (data) / S (UI) |
| FR-AD-3 | SSO (SAML / OIDC), SCIM | C (Phase 3) |
| FR-AD-4 | Framework catalogue admin: activate/deactivate, org-specific frameworks | C (Phase 3) |
| FR-AD-5 | Usage and AI cost dashboard per org | S |

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Latency | First diagnosis tokens stream in < 3 s (p50). Full diagnosis < 25 s (p90). Recommendation < 15 s (p90). PPTX export < 30 s (p90) for ≤ 25 slides |
| Availability | 99.5 % MVP; 99.9 % enterprise tier |
| Scale (MVP target) | 2,000 MAU, 200 concurrent sessions. Architecture must scale to 100k MAU without a rewrite |
| Quality gates | Golden-set eval (04 §9) runs in CI on every prompt or definition change. Block merge if top-3 agreement drops > 3 pts |
| i18n | 100 % string coverage AR/EN (CI test, reusing the simulator's `i18n.test.ts` approach) |
| Accessibility | WCAG 2.2 AA. axe-core clean. Contrast check in CI |
| Data residency | Region-pinned deployment option (KSA/UAE region, EU, US) for enterprise (06 §4) |
| Observability | Trace every AI call with prompt version, model, tokens, latency, cost, validation result |
| Cost | Target AI cost ≤ US$0.60 per completed single-framework project (median); tracked per route |

## 8. MVP feature prioritisation

Scored with **RICE** (Reach × Impact × Confidence ÷ Effort in person-weeks). Reach is the % of MVP sessions touching the feature. Impact is on a 0.25–3 scale.

| Feature | Reach | Impact | Conf. | Effort | RICE | Decision |
|---|---|---|---|---|---|---|
| Diagnosis + context gate + clarify loop | 100 | 3 | 0.8 | 3 | 80 | **MVP** |
| Recommendation (hybrid) with rationale | 100 | 3 | 0.8 | 3 | 80 | **MVP** |
| Framework Builder (generic stepper engine) | 95 | 3 | 0.8 | 4 | 57 | **MVP** |
| 15 framework definitions + renderers | 95 | 3 | 0.7 | 8 | 25 | **MVP** (staged: 8 in Beta-1, 7 in Beta-2) |
| PPTX export (native, RTL) | 70 | 3 | 0.6 | 4 | 31.5 | **MVP** |
| PDF export | 60 | 2 | 0.8 | 2 | 48 | **MVP** |
| PNG/SVG export | 50 | 1 | 1.0 | 0.5 | 100 | **MVP** |
| Version history + restore | 60 | 2 | 0.9 | 2 | 54 | **MVP** |
| Claim typing + evidence UI | 100 | 2 | 0.8 | 2 | 80 | **MVP** (core differentiator) |
| RAG "Explain this framework" with citations | 40 | 1 | 0.8 | 2 | 16 | **MVP-should** (depends on PDF) |
| Document upload as evidence | 35 | 2 | 0.6 | 3 | 14 | **MVP-should** |
| Methodology chaining (data hand-off) | 40 | 2 | 0.6 | 3 | 16 | **MVP-should** (Beta-2) |
| Sharing (read-only link + comment) | 30 | 1 | 0.8 | 2 | 12 | Phase 2 |
| DOCX / XLSX export | 25 | 1 | 0.8 | 2 | 10 | Phase 2 |
| Brand templates | 15 | 2 | 0.6 | 3 | 6 | Phase 2 |
| Real-time co-editing | 10 | 2 | 0.5 | 6 | 1.7 | Phase 3 |
| SSO/SCIM, admin console | 5* | 3 | 0.9 | 4 | 3.4 | Phase 3 (*enterprise deals depend on it) |

**Staging the 15 frameworks** (by RICE plus coverage of taxonomy categories, so every L1 category has at least one framework in Beta-1):

- **Beta-1 (8):** SWOT, PEST/STEEPLE, 5 Whys, Cause & Effect, SIPOC, Impact/Effort Matrix, Risk Assessment Matrix, Action Plan.
- **Beta-2 (7):** Stakeholder Map, Project Charter, Gantt, Value Stream Mapping, BPMN, Org Chart, Operating Model Canvas.

Why these are later: BPMN and VSM have the most complex renderers and grammars. Org Chart and the Operating Model Canvas need more input data to be useful.

## 9. Success metrics

| Layer | Metric | MVP target |
|---|---|---|
| North Star | **Weekly Completed Analyses**: a framework instance validated *and* exported or shared | 300/wk by end of Beta-2 |
| Activation | % of new users reaching an exported deliverable in session 1 | ≥ 35 % |
| Quality | Recommendation relevance (user rating) | ≥ 80 % positive |
| Quality | AI suggestion acceptance rate (accepted as-is or lightly edited) | 50–80 % (too high suggests rubber-stamping; investigate) |
| Trust | % of facts with valid evidence refs | 100 % (validator-enforced) |
| Retention | W4 retention of activated users | ≥ 25 % |
| Bilingual | AR vs EN completion-rate gap | ≤ 5 pts |
| Cost | AI cost per completed analysis | ≤ $0.60 median |

## 10. Assumptions, risks and open questions

| # | Type | Item | Mitigation / owner |
|---|---|---|---|
| A1 | Assumption | Primary market is GCC, Arabic-first. | Validate in discovery interviews (Phase 0) |
| A2 | Assumption | Users accept a 2-round clarification before recommendations. | A/B the gate threshold (0.55 vs 0.65) in Beta |
| R1 | Risk | **The reference PDF is unavailable or unlicensed for this use** → no source attribution | Platform-authored content is the default. PDF adds citations when ingested (00-README) |
| R2 | Risk | Arabic RTL in PPTX is fragile across PowerPoint and Keynote versions | Native `a:rtl` paragraphs plus golden-file visual regression on PowerPoint for Windows and Mac. Fallback: PDF |
| R3 | Risk | Over-trust in AI output for consequential decisions | Claim typing, disclaimers, "assumption" confirmation prompts, AI-disclosure footer |
| R4 | Risk | LLM cost or latency at scale | Prompt caching of stable prefixes, Batches for offline evals, measured per-route effort tuning (02 §4.4) |
| Q1 | Open | Brand and product name? | Product owner |
| Q2 | Open | Pricing model (seat vs. usage vs. hybrid)? | Affects metering design; metering events are designed in (05 §3.9) |
| Q3 | Open | First enterprise residency region requirement (KSA PDPL)? | Drives Phase 3 infra choice (06 §4) |
