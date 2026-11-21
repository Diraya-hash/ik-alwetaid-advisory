# Business Problem Solver: Design Pack (v0.2 baseline + Phase 0)

> Status: **v0.2 approved as baseline. Phase 0 (foundations & de-risking) authorised and in progress.** Information model updated to v0.3 (Truth / Review / Decision). No feature implementation.
> Product identity: **Business Problem Solver**. Brand name TBD (open decision D13). Code name `bps`.
> Date: 2026-11-19

**Positioning**

| | |
|---|---|
| Product identity | Business Problem Solver |
| User experience | An AI Management Consultant |
| Core intelligence | Business Framework Intelligence |
| Principle | *Simplicity in experience. Sophistication in intelligence.* |
| Promise | *We don't just answer business questions. We help you solve business problems.* |

## Documents

| # | Document | Covers | Version |
|---|---|---|---|
| 01 | [Product Requirements Document](01-prd.md) | PRD, user journey, functional requirements, MVP prioritisation, metrics | v0.2 |
| 02 | [Technical Architecture](02-architecture.md) | Engines and modules (incl. Strategic Options and Critic), AI platform, visualisation, deployment profiles (incl. KSA in-Kingdom) | v0.2 |
| 03 | [Knowledge & Framework Schemas](03-knowledge-schemas.md) | Five-dimension information model, platform KB, reference-source policy, registries, framework metadata, catalogue | v0.2 |
| 04 | [AI Logic](04-ai-logic.md) | Taxonomy, diagnosis, sufficiency gate, recommendation + differentiation rules + No Good Fit, Strategic Options, three-level Critic, evals | v0.2 |
| 05 | [Database Architecture](05-database.md) | Postgres DDL, RLS, statement events, critique tables, billing, retention | v0.2 |
| 06 | [Security & Data Privacy](06-security-privacy.md) | Threat model, privacy for AI, residency incl. KSA option, IP and reference-source policy | v0.2 |
| 07 | [Development Roadmap](07-roadmap.md) | 24-week plan to GA, Phase 0 spikes, decision status | v0.2 |
| 08 | [Product & Architecture Review](08-product-architecture-review.md) | Audit of v0.1, findings C1–C4, H1–H15, M1–M16, L1–L8 | Review of v0.1 |
| 09 | [UX & Screen Specification](09-ux-and-screen-specification.md) | IA, 20 screens, wireframes, interaction rules, states, responsive, bilingual design system, export consistency | v0.2 (+ v0.3 status markers) |
| 10 | [Phase 0 Execution Plan](10-phase-0-execution-plan.md) | Scope lock, experiments A–F, tasks with owners, dependencies, acceptance criteria, effort, risks, Phase 0 decisions | Phase 0 |
| 11 | [Evaluation Framework & Test Cases](11-evaluation-framework-and-test-cases.md) | 29 scenarios (7 categories + No Good Fit + insufficient context; 11 Arabic), metrics, graders, limitations | Phase 0 |
| 12 | [Technical Proofs of Concept](12-technical-proof-of-concepts.md) | Specs and quantitative exit thresholds for A–F | Phase 0 |
| 13 | [Phase 0 Results](13-phase-0-results.md) | Measured results, findings, GO/NO-GO for Beta-1 (updated as experiments run) | Phase 0, update 2 |
| 14 | [**Phase 0 Decision Report**](14-phase-0-decision-report.md) | Approved decisions, outstanding experiments, measured results, risks, Beta-1 readiness criteria, 3-engineer plan, API key security | **Current decision baseline** |
| 15 | [PowerPoint Export Service Contract](15-pptx-export-service-contract.md) | Python service boundary, API, schemas, validation gates, fonts, versioning | v1.0 draft |
| 16 | [PowerPoint Manual Validation Protocol](16-pptx-manual-validation-protocol.md) | PowerPoint Win/Mac + Keynote test matrix, validation packs, **consolidated six-dimension results workbook**, exit criteria | Ready to run |
| — | Evaluation reporting | Per-language independent gates, 5-segment reporting, evidence classes E1–E5, consolidated GO/NO-GO generator: doc 14 §8c | Ready |
| 17 | [Human Evaluator Guide](17-human-evaluator-guide.md) | 20-scenario blinded human review: criteria, scoring, examples, Arabic/English instructions, disagreement adjudication, coordinator steps | Ready to run |

Phase 0 prototypes live in [`/phase0`](../../phase0/README.md), isolated from production code.

## Reference source status (D1)

The reference PDF *"50 Business Diagrams for Strategic Planning"* (Creately; © Cinergix Pty Ltd, all rights reserved) has been provided and inspected. It is **not ingested**.

- It is an **internal editorial reference only**. It is recorded in a restricted internal schema and bucket (03 §2) and never enters the product KB, prompts, UI or exports.
- Its diagrams, wording, templates and distinctive visual designs are **not reproduced**. Its content is not published, redistributed or used for derivative commercial content without permission.
- **All product knowledge is platform-authored** (English and native Arabic), SME-reviewed and originality-checked. The product has **no legal or technical dependency** on the PDF.
- The MVP's 15 frameworks correspond to **16** of its 50 entries (PEST and STEEPLE are separate there). **34 entries remain pending.** They are not named or catalogued in product data and are activated only through independently authored content (03 §7.3).

## v0.2 changelog

| Decision / finding | Change | Where |
|---|---|---|
| **D1** Reference PDF internal only | Reference-source schema in `kb_internal`; platform-authored KB; attribution to methodology originators; CI leakage check | 03 §2, 05 §3.6, 06 §7 |
| **D2** Information model | Statements with **truth status** (Verified / Unverified / Assumption), **origin** (User input / External source / AI generated), **authorship** (User / AI / System), **evidence refs**, **modification history**; invariants I1–I8 (edits never change truth status or origin; AI can't verify) | 03 §3, 04 §3, 05 §3.3a, 09 §8.4 |
| **D3** Three-level Critic | Item (deterministic incl. calculations) / Framework (rubrics) / Project (alignment, mandatory pre-export); severity, explanation and correction required; accept/reject/dismiss; review history; never auto-modifies | 02 §3.4b, 04 §7, 05 §3.10, 09 S12 |
| **D4** Strategic Options + No Good Fit | Options capability (generate, rationale, impact/effort/risk/feasibility, assumptions, dependencies, preferred option with trade-offs); deterministic No Good Fit rule; demand log | 02 §3.4a, 04 §5.7, §6, 09 S07, S10 |
| Keep 15 frameworks + differentiation rules | Discriminators for 8 confusable sets, with golden-set gates | 03 §6.1, 04 §5.3 |
| Draft-first default | Consultant mode (default) + Workshop mode | 02 §3.4, 09 S08–S09 |
| Gantt = Action Plan view | One dataset, two views; `fw_gantt` is a catalogue alias | 03 §7.1, 09 S11 |
| Vector search removed from MVP (if eval confirms) | Long-context cached KB; FTS for evidence; per-model embedding tables as the extension | 02 §3.3, 05 §3.6, 07 SP-4 |
| Problem-Solving Summary | New artifact; first section of every deliverable | 01 FR-EX-0, 02 §3.6, 09 S13 |
| Export language AR / EN / original | Translated versions, labelled and reviewable | 02 §3.6 (DR-24), 09 S14 |
| Future KSA in-Kingdom hosting | Deployment profiles; Gateway fails closed; verification gate | 02 §7.1, 06 §4.1 |
| Pricing undecided | Billing plumbing without prices; cost spike first | 01 FR-AC-2, 05 §3.12, 07 SP-1 |
| Review inconsistencies | Catalogue identity (H1), slot registry (H2), phase vocabulary (H3), port registry (H4), Arabic layout service (H10), UX spec (H12), billing (H13), roles (M1), stable enum (M2), deterministic rules (M3), checkpoints (M4), derived projection (M5), workweek by country (M6), taxonomy simplification (M7), originators (M8), stakeholder axes (M9), web hosting (M16), auth wording (L1), embeddings table (L2) | Throughout |
| Roadmap | 24 weeks to GA; Phase 0 spikes; 4 full-stack engineers assumed | 07 |

## Phase 0 scope lock (2026-11-19)

3 full-stack engineers · initial segments: consultants, business professionals, department managers · human-review add-on deferred · name undecided · **editable PowerPoint is a key objective** (native objects for every visual, process diagrams included) · Truth / Review / Decision statuses separated (03 §3, v0.3). Details: doc 10 §1.

## Open decisions

| # | Decision | When |
|---|---|---|
| **P0-D0** | API access for model-based experiments via a **restricted, reviewer-gated environment secret** (doc 14 §4) | **Now**: blocks A.2, B, C.2, F and Gate 0 |
| ~~P0-D1~~ | Approved 2026-11-21: GA week 24 with 13 frameworks; BPMN + VSM ≈ week 28 | — |
| ~~P0-D2~~ | Approved: Python export service with a documented contract (doc 15) | — |
| ~~P0-D3~~ | Approved: rule set v0.3b (frozen) | — |
| D11 | Pricing levels | After cost measurement (F) and beta usage |
| D13 | Brand name | Product owner (deliberately undecided) |
| ~~D8~~ | Resolved by scope lock: native editable PPTX for all visuals | — |
| ~~D10~~ | Resolved: consultants, business professionals, department managers first | — |
| ~~D14~~ | Deferred: human consultant review add-on | — |
| ~~Team~~ | Resolved: 3 full-stack engineers | — |

## Relationship to the existing repo

The new apps will be `apps/bps-web`, `apps/bps-api` and `apps/bps-worker` (02 §8). They reuse the `ik-lna-simulator` i18n dictionaries and `[locale]` routing, the IK token CSS (incl. the existing fact/claim/assumption colours, re-mapped to the D2 vocabulary in 09 §8.1), the IBM Plex Sans Arabic + Inter pairing, and the contrast/axe checks. `ik-lna-simulator/` and `alwetaid-advisory-v2/` are untouched.
