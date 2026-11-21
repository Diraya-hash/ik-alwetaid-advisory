# 01: Product Requirements Document

> **v0.2** (2026-11-19). Product identity: **Business Problem Solver**. Applies decisions D1–D4 and the additional approved product decisions (review doc 08). It resolves H3 (phase vocabulary), H4 (chaining = Must), H6 (export language), H12 (UX spec → doc 09), H13 (billing), H14 (Problem-Solving Summary), M1 (roles) and M15 (workspace friction). Changes are marked **[v0.2]**.

**Phase vocabulary (used in all docs):** *Phase 0 Foundations → Beta-1 → Beta-2 → GA → Teams → Enterprise → Scale.* "MVP" means everything up to and including **GA (week 24)**.

## 1. Product positioning [v0.2]

| | |
|---|---|
| **Product identity** | Business Problem Solver |
| **User experience** | An AI Management Consultant |
| **Core intelligence** | Business Framework Intelligence |
| **Principle** | *Simplicity in experience. Sophistication in intelligence.* |
| **Promise** | *We don't just answer business questions. We help you solve business problems.* |

**What makes it a consultant and not a chatbot:** it restates and diagnoses before solving, asks few and sharp questions, labels what it knows vs. assumes, refuses to force a method that doesn't fit, proposes options with trade-offs, reviews its own work (the Critic), and closes with a summary that connects the problem to a plan.

## 2. Problem statement

Managers, consultants and transformation leads face messy business problems. Methodologies exist, but three gaps block their use:
1. **Selection gap.** People default to familiar frameworks, often the wrong ones.
2. **Application gap.** Knowing a framework's name is not the same as applying it rigorously.
3. **Deliverable gap.** Turning analysis into a board-ready deck takes hours.

Generic assistants partly close gap 3 but handle 1 and 2 badly. They recommend without context, mix facts with invention, and produce text rather than structured, editable, reviewable work.

## 3. Users

| Persona | Context | Job-to-be-done | Phase |
|---|---|---|---|
| **P1 Operational manager** | Department head (KSA/GCC public, semi-government or private), Arabic-first in writing | "Help me understand why X keeps happening and give me a plan I can present on Sunday." | Beta-1 |
| **P2 Internal consultant / PMO / excellence office** | Runs improvement projects; knows the frameworks; short of time | "Speed up the analysis and the deliverables while keeping the rigour." | Beta-1 |
| **P3 Independent consultant / boutique** | Client work, bilingual delivery | "Client-grade output in Arabic and English." | Beta-1 (branding in Teams) |
| **P4 SME owner / manager** | No in-house strategy function | "Structured help without hiring consultants." | Beta-2 |
| **P5 Enterprise transformation office** | Many users, governance, residency | "A standard, governed way of solving problems." | Enterprise |

Non-goals: financial modelling/valuation, legal or medical advice, decisions about named individuals, real-time BI.

## 4. Goals and non-goals

### Goals (GA)
- **G1:** free-text challenge → exported deliverable in **≤ 20 minutes** for a single-framework analysis (draft-first mode).
- **G2:** recommendation relevance ≥ 80 % positive; golden-set top-3 hit ≥ 0.85; **No Good Fit precision ≥ 0.80**.
- **G3:** every statement carries truth status, origin and authorship. **Zero AI statements displayed as "verified"** unless a user verified them.
- **G4:** Arabic completion rate within 5 pts of English; Arabic quality rubric ≥ 4.2/5.
- **G5:** everything generated is editable, versioned and reviewable. **No user-approved content is ever changed automatically.**
- **G6 [v0.2]:** ≥ 70 % of exported deliverables pass the Project-level Critic with no unacknowledged Critical findings.

### Non-goals (MVP)
Real-time co-editing; Jira/MS Project integrations; a free-form drawing canvas; native mobile apps (mobile web = review and approve); fine-tuned models; in-Kingdom hosting (designed for, delivered in Enterprise).

## 5. Core user journey

```
① Describe → ② Diagnose (⇄ clarify) → ③ Choose approach → ④ Analyse (draft-first ⇄ workshop)
   → ⑤ Options & decide → ⑥ Plan → ⑦ Review (Critic) → ⑧ Summary & export
                     ↑ chain to next framework at any analysis step
```

| Step | User sees | System does | Artifact | Exit |
|---|---|---|---|---|
| ① Describe | One composer, attachments, example challenges (GCC-relevant), language auto-detect | PII scan; project created | `challenge` | ≥ 20 words or user forces |
| ② Diagnose | Diagnosis card: reframed problem; symptoms vs. suspected causes; stakeholders; goals; constraints; unknowns; **truth-status labels**; sufficiency meter | Diagnosis Engine; slot-based gate | `diagnosis` | Gate passes or user proceeds with a warning |
| ②a Clarify | 1–4 questions with "why I'm asking"; max 2 rounds | Information-gain selection with discriminator bonus | `diagnosis` vN | As above |
| ③ Choose approach | 1–3 ranked approach cards (frameworks and/or **Strategic Options**), each with fit band, reasons tied to the diagnosis, caution, effort; suggested chain; "not recommended because…". **Or a No Good Fit card** with the closest methods and limitations | Recommendation Engine | `recommendation_set` | User selects, or chooses a no-fit path |
| ④ Analyse | **Consultant mode (default):** the AI drafts the whole framework, every item labelled; the user reviews. **Workshop mode:** guided steps. Split view: canvas + inspector | Framework Builder; Item- and Framework-level Critic | `framework_instance` | Required steps valid |
| ⑤ Options & decide | Options comparison (impact, effort, risk, feasibility), assumptions, dependencies, preferred option with trade-offs; editable weights | Strategic Options capability | `option_set` | User accepts ≥ 1 option (or skips) |
| ⑥ Plan | Action Plan table ⇄ **Gantt view** (same data) | Builder + port hand-offs | `framework_instance` (Action Plan) | Optional |
| ⑦ Review | **Consultant review**: Project-level Critic findings by severity; Assumptions Register; stale-data warnings; accept / reject / dismiss | Critic L3 (mandatory before export) | `critique_run` | Critical findings resolved or acknowledged |
| ⑧ Summary & export | **Problem-Solving Summary** preview; export dialog: format, **language (Arabic / English / original)**, contents | Deliverables Generator | `ps_summary`, `deliverable` | File ready |

Screen-level detail, wireframes and states: **09-ux-and-screen-specification.md**.

## 6. Functional requirements

Priority: **M** = must for GA · **S** = should for GA · **L** = later (phase named). IDs are stable.

### 6.1 Input
| ID | Requirement | P |
|---|---|---|
| FR-IN-1 | Free-text challenge in AR or EN; mixed language tolerated | M |
| FR-IN-2 | UI language and output language set independently; per-message language detection | M |
| FR-IN-3 | Attach evidence (PDF, DOCX, XLSX, CSV, TXT; ≤ 20 MB/file, ≤ ~150 pages per project in MVP). Extracted text becomes citable project evidence (`origin = external_source`) | S |
| FR-IN-4 | Example challenges per persona/category, GCC-relevant | M |

### 6.2 Diagnosis
| ID | Requirement | P |
|---|---|---|
| FR-DX-1 | Structured diagnosis (04 §3) where **every statement carries truth status, origin, authorship, evidence refs and history** | M |
| FR-DX-2 | Classification: domains (≤ 3), stage, scope, with confidence | M |
| FR-DX-3 | Slot-based sufficiency score with a "what's missing" explanation | M |
| FR-DX-4 | Clarifying loop (≤ 2 rounds default; org-configurable) | M |
| FR-DX-5 | Edit any field; edits mark downstream artifacts `stale` (never deleted); explicit re-run | M |
| FR-DX-6 | Out-of-scope / unsafe detection with a business-side alternative | M |

### 6.3 Information model and trust (D2) [v0.2]
| ID | Requirement | P |
|---|---|---|
| FR-TR-1 | Five independent dimensions per statement: truth status (Verified / Unverified / Assumption), origin (User input / External source / AI generated), authorship (User / AI / System), evidence reference (optional), modification history | M |
| FR-TR-2 | **Editing never changes truth status or origin.** Changing truth status is an explicit user action, recorded in history | M |
| FR-TR-3 | "Mark as verified" offers two methods: *attach evidence* or *I confirm this* (attested). They are displayed differently | M |
| FR-TR-4 | AI can never output Verified; AI statements default to Assumption or Unverified (with a resolving user-text reference) | M |
| FR-TR-5 | User can **challenge** an AI statement (reject with a reason, kept visible) or accept it (kept, still not verified) | M |
| FR-TR-6 | Assumptions Register per project: all assumptions/unverified statements that proposals depend on, with verification hints | M |
| FR-TR-7 | Statement history view: who changed what, when, and why | M |

### 6.4 Approach recommendation
| ID | Requirement | P |
|---|---|---|
| FR-RC-1 | 1–3 ranked approaches (frameworks + Strategic Options) from the active set only | M |
| FR-RC-2 | Reasons linked to diagnosis statements and slots | M |
| FR-RC-3 | Caution / when-not-to-use per recommendation | M |
| FR-RC-4 | Suggested chain, validated by port compatibility | M |
| FR-RC-5 | "Not enough context" state instead of recommendations below the gate | M |
| FR-RC-6 | **No Good Fit** response when no approach adequately fits: explanation, closest methods with limitations, paths (Strategic Options / library / refine). **Never a forced recommendation** | M |
| FR-RC-7 | Explicit differentiation between similar frameworks (04 §5.3), with "not recommended because…" explanations | M |
| FR-RC-8 | Feedback per recommendation (👍/👎 + reason); demand log for No Good Fit | M |
| FR-RC-9 | Browse the library and choose manually | M |

### 6.5 Framework application
| ID | Requirement | P |
|---|---|---|
| FR-FB-1 | **Draft-first (Consultant mode) by default:** a complete first draft, all items `AI generated · pending review` | M |
| FR-FB-2 | **Workshop mode:** guided step-by-step, switchable at any time without losing work | M |
| FR-FB-3 | Accept / edit / reject / challenge per item; bulk accept | M |
| FR-FB-4 | Deterministic validation per step (required fields, calculations, dates) | M |
| FR-FB-5 | Explain this framework/step (platform KB with citations) | S |
| FR-FB-6 | **Chaining:** pass outputs between frameworks via typed ports (copy-with-link); "source changed" indicator | M |
| FR-FB-7 | Manual mode with no AI | M |
| FR-FB-8 | **Gantt = timeline view of the Action Plan** (same data); actions without dates listed in a tray | M |
| FR-FB-9 | Framework variants (PEST/PESTLE/STEEPLE; risk scale 3/4/5; stakeholder axes) | M |

### 6.6 Strategic Options (D4) [v0.2]
| ID | Requirement | P |
|---|---|---|
| FR-OP-1 | Generate 3–6 distinct options + a "continue as-is" baseline | M |
| FR-OP-2 | Rationale per option, linked to causes, goals or SWOT items | M |
| FR-OP-3 | Compare on impact, effort, risk and feasibility (1–5 with a written basis); user-editable weights; weighted score computed in code | M |
| FR-OP-4 | Assumptions and dependencies per option as labelled statements | M |
| FR-OP-5 | Preferred option with trade-offs and "choose another if…" conditions; a "too close to call" state | M |
| FR-OP-6 | User accepts/rejects/defers options; accepted options flow to Impact/Effort or the Action Plan | M |
| FR-OP-7 | Add own options; re-assess on request | M |

### 6.7 AI Critic (D3) [v0.2]
| ID | Requirement | P |
|---|---|---|
| FR-QC-1 | **Item-level review:** statements, data, **calculations**, assumption wording | M (Beta-1) |
| FR-QC-2 | **Framework-level review:** methodology completeness, logical consistency, missing inputs (framework rubrics) | M (Beta-1) |
| FR-QC-3 | **Project-level review:** alignment of problem → diagnosis → methods → findings → recommendations → action plan; mandatory before export | M (Beta-2) |
| FR-QC-4 | Each finding has severity (Critical/High/Medium/Low), an explanation and a suggested correction | M |
| FR-QC-5 | Accept (user-initiated apply), reject (with reason), dismiss; **never auto-modify user-approved content** | M |
| FR-QC-6 | Review history per artifact and project; summary in the export manifest | M |
| FR-QC-7 | Unresolved Critical findings require acknowledgement at export (recorded) | M |

### 6.8 Visualisation
| ID | Requirement | P |
|---|---|---|
| FR-VZ-1 | Interactive, **editable** diagrams for all MVP visual types (no static AI images) | M |
| FR-VZ-2 | Canvas ⇄ form single source of truth | M |
| FR-VZ-3 | RTL/LTR-correct rendering and bilingual labels | M |
| FR-VZ-4 | Trust overlay (truth status / origin) toggle | M |
| FR-VZ-5 | Accessible table view of every diagram; keyboard operation | M |
| FR-VZ-6 | Light/dark/print themes | S |

### 6.9 Summary and deliverables
| ID | Requirement | P |
|---|---|---|
| FR-EX-0 | **Problem-Solving Summary [v0.2]:** original challenge → diagnosis → selected methods → key findings → recommendations/preferred option → implementation roadmap → open assumptions → review status. Editable; first section of every deliverable | M |
| FR-EX-1 | PPTX export (16:9), native editable objects for tables, matrices, canvases and lists; graph diagrams per the D8 policy (open decision, 07) | M |
| FR-EX-2 | PDF report (A4) | M |
| FR-EX-3 | PNG/SVG of a single diagram | M |
| FR-EX-4 | **Export language: Arabic, English, or the original working language [v0.2].** Other-language export creates a *translated version* (AI translation, glossary-enforced), labelled "translated, not yet reviewed" until a user reviews it | M |
| FR-EX-5 | Assumptions Register, evidence list and methodology notes appendix; truth-status labels carried into exports (configurable density) | M |
| FR-EX-6 | Export manifest: artifact versions, critic summary, acknowledgements, AI disclosure | M |
| FR-EX-7 | DOCX, XLSX (Action Plan, risks, options) | L (Teams) |
| FR-EX-8 | Brand templates | L (Teams) |

### 6.10 Workspace and history
| ID | Requirement | P |
|---|---|---|
| FR-WS-1 | Projects list with search and filters | M |
| FR-WS-2 | Project contains conversation, diagnosis, approaches, instances, options, critic history, summary, evidence, deliverables | M |
| FR-WS-3 | Version history with **checkpoints** (step completion, explicit save, AI run, export); restore; compare | M |
| FR-WS-4 | Activity log per project | M |
| FR-WS-5 | Read-only org-scoped share link + comments | S |
| FR-WS-6 | Soft delete (30 days) and hard delete | M |
| FR-WS-7 | **Personal org/workspace auto-created; workspace UI hidden for individual plans [v0.2]** | M |

### 6.11 Accounts, plans and billing [v0.2]
| ID | Requirement | P |
|---|---|---|
| FR-AC-1 | Roles: **organisation** owner/admin/member/guest; **workspace** admin/editor/commenter/viewer (05 §3.1) | M (data), S (UI) |
| FR-AC-2 | Plans and entitlements (limits on projects, analyses, exports, features), enforced server-side; **prices not set** (decision pending cost measurement) | M |
| FR-AC-3 | Usage metering (AI tokens, analyses, exports) and a usage view | M |
| FR-AC-4 | Payment via a GCC gateway supporting **mada** and cards; **15 % KSA VAT**; **ZATCA-compliant e-invoices** in Arabic | M (paid GA) |
| FR-AC-5 | Org settings: default language, numerals, calendar (Gregorian/Umm al-Qura), **country and workweek**, PII mode, gate threshold, AI disclosure | M |
| FR-AC-6 | SSO/SCIM, admin console, org KB, residency profiles incl. **in-Kingdom (KSA)** | L (Enterprise) |

## 7. Non-functional requirements

| Area | Requirement |
|---|---|
| Latency | First diagnosis content < 3 s (p50). Diagnosis complete < 25 s (p90). Recommendation < 15 s (p90). Framework draft < 30 s (p90). Project-level critic < 40 s (p90). PPTX export < 30 s (p90, ≤ 25 slides). **Validated in the Phase 0 spike** |
| Availability | 99.5 % at GA; 99.9 % Enterprise |
| Scale | 2,000 MAU / 200 concurrent at GA; architecture to 100k MAU |
| Quality gates | Golden-set evals in CI (04 §11); > 3-point regression blocks merge |
| i18n | 100 % AR/EN string coverage (CI) |
| Accessibility | WCAG 2.2 AA; axe clean; contrast check (CI) |
| Residency | Single region at GA; **architecture supports region-pinned stacks incl. a KSA in-Kingdom profile** (02 §7) |
| Observability | Every AI call traced (prompt version, model, effort, tokens, cost, latency, validation) |
| Cost | Measured in Phase 0. Pricing stays undecided until measured. Working budget ≤ $0.90 per completed single-framework analysis |

## 8. MVP prioritisation (GA scope)

| Capability | Wave | Rationale |
|---|---|---|
| Diagnosis + gate + clarify (slot registry) | Beta-1 | Foundation of the consultant experience |
| Information model v2 + Assumptions Register | Beta-1 | Core differentiator (D2) |
| Hybrid recommendation + differentiation rules + No Good Fit | Beta-1 | Core intelligence (D4) |
| Draft-first + workshop mode | Beta-1 | Simplicity in experience |
| Critic Item + Framework levels | Beta-1 | D3 |
| 8 frameworks: SWOT, PEST/STEEPLE, 5 Whys, Cause & Effect, SIPOC, Impact/Effort, Risk Matrix, Action Plan (table) | Beta-1 | Covers understand, map, root cause, prioritise, risk, plan |
| **Strategic Options** | Beta-1 | Closes the "what should we do?" gap (D4) |
| PDF + PNG/SVG export (AR/EN) | Beta-1 | |
| 5 more: Stakeholder Map, Project Charter, Gantt (view), Org Chart, Operating Model Canvas → **13 frameworks at GA** | Beta-2 | Approved 2026-11-21 (doc 14 A3) |
| BPMN and Value Stream Mapping | **GA+1 (≈ week 28)** | Deferred until connector-routing defects are fixed and BPMN passes visual and structural validation (doc 14 §5.3) |
| Chaining via ports | Beta-2 | Must for GA |
| Critic Project level + pre-export review | Beta-2 | D3 |
| Problem-Solving Summary | Beta-2 | Closure (H14) |
| PPTX export + translated-version export | Beta-2 | |
| Billing, entitlements, VAT, ZATCA | GA hardening | Paid launch |
| Share link + comments | GA hardening (S) | |
| DOCX/XLSX, brand templates, co-editing, outcome check-ins | Teams | |
| SSO/SCIM, residency profiles (KSA), org KB, RAG at scale | Enterprise | |

## 9. Success metrics

| Layer | Metric | GA target |
|---|---|---|
| North Star | **Weekly Solved-Problem Packages**: a project with ≥ 1 validated framework, an accepted option or action plan, a Problem-Solving Summary, and an export | 300/week |
| Activation | % of new users exporting in session 1 | ≥ 35 % |
| Recommendation | Relevance (user rating); No Good Fit shown rate (monitor; not a target) | ≥ 80 % positive |
| Trust | AI statements wrongly shown as verified | 0 |
| Critic | Findings accepted or resolved / total shown; reject rate | ≥ 50 %; ≤ 40 % |
| Options | % of decided projects where the user picks an option and states a reason when overriding the AI preference | Tracked |
| Bilingual | AR vs EN completion gap | ≤ 5 pts |
| Retention | W4 retention of activated users | ≥ 25 % |

## 10. Assumptions, risks, open questions

| # | Type | Item | Status / mitigation |
|---|---|---|---|
| A1 | Assumption | Initial market KSA, then GCC; Arabic-first with equal English | Planning assumption (approved) |
| A2 | Assumption | SaaS subscription; segments: professionals, consultants, SMEs, enterprises | Planning assumption; pricing undecided |
| A3 | Assumption | Users accept ≤ 2 clarification rounds | A/B the gate threshold in Beta |
| R1 | Risk | Reference PDF is all-rights-reserved | **Resolved by D1**: internal reference only; product content independently authored |
| R2 | Risk | RTL PPTX fragility | Phase 0 spike; PDF guaranteed |
| R3 | Risk | Over-trust in AI | Information model, Critic, AI disclosure |
| R4 | Risk | Unit cost | Phase 0 measurement before pricing |
| Q1 | Open | Brand name (product identity is "Business Problem Solver") | Product owner |
| Q2 | Open | Pricing levels | After cost measurement |
| Q3 | Open | PPTX policy for graph diagrams (D8), segment sequencing (D10), Expert Review add-on (D14) | 07 §10 decision status |
