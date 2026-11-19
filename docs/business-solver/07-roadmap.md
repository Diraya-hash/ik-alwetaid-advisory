# 07: Development Roadmap

**Assumed team (MVP):** 1 product lead, 1 designer (bilingual UX), 3 full-stack TS engineers, 1 AI engineer, 1 methodology SME / content lead (+ 1 Arabic business editor, part-time), 0.5 DevOps/SecOps. **Time units:** 2-week sprints.

## Overview

```
Phase 0  Foundations & content      Weeks 0–3    (S0–S1)
Phase 1  MVP Beta-1 (8 frameworks)  Weeks 4–11   (S2–S5)
Phase 2  MVP Beta-2 (15) + GA       Weeks 12–19  (S6–S9)
Phase 3  Teams & Enterprise         Weeks 20–33  (S10–S16)
Phase 4  Scale & intelligence       Weeks 34+
```

## Phase 0: Foundations & content (3 weeks)

| ID | Task | Owner | Exit criteria |
|---|---|---|---|
| K-1 | **Obtain the reference PDF + licence review** (00-README) | Product | PDF in repo/Drive; `licence` record approved |
| K-2 | Ingest PDF → ToC extraction → fill catalogue slots 16–50 (names, page refs) | AI eng + SME | 50 framework records; slots 16–50 `inactive_catalogued` with verified page refs |
| K-3 | Author KB entries for the 15 MVP frameworks (AR/EN; platform-authored + PDF cross-refs) | SME + editor | Reviewed per 03 §6 |
| K-4 | Taxonomy v1.0 (`taxonomy.json`) with AR/EN signals & examples | SME + AI eng | ≥ 5 examples per L2 per language |
| K-5 | Golden set v0 (150 cases) + labelling guide; 2-SME adjudication | SME | Inter-rater agreement (Cohen's κ) ≥ 0.6 on top-3 |
| E-1 | Monorepo scaffolding (`apps/studio-*`, `packages/*`), CI (typecheck, unit, i18n coverage, contrast/axe) | Eng | Green pipeline |
| E-2 | Port i18n/RTL/tokens/fonts from `ik-lna-simulator` into `packages/i18n`, `packages/ui-tokens` | Eng | AR/EN shell renders, RTL verified |
| E-3 | Postgres schema v1 + RLS + migration tooling; cross-tenant test harness | Eng | RLS tests pass |
| E-4 | Model Gateway + Prompt Registry + AI Run logging + eval runner skeleton | AI eng | One structured call end-to-end with schema validation |
| D-1 | UX: journey prototypes (AR first), diagnosis card, recommendation cards, builder split view | Design | 5 discovery interviews + usability test on prototype |
| S-1 | Legal/privacy review (PDPL KSA/UAE, GDPR), AI disclosure copy | Product | Memo + DPA draft |

**Phase 0 exit gate:** PDF licensed and ingested (or a decision to proceed platform-authored only), taxonomy and golden set v0 ready, infra skeleton deployed to staging.

## Phase 1: MVP Beta-1 (8 weeks, S2–S5)

| Sprint | Scope |
|---|---|
| **S2** | Auth (magic link + Google/Microsoft); projects CRUD; conversation + SSE; **Diagnosis Engine v1** (schema, validators, streaming card); PII warn mode |
| **S3** | **Sufficiency gate + clarifying loop**; Knowledge Engine (ingest, hybrid retrieval, RRF, embedding bake-off); **Recommendation Engine** Stages A–E; recommendation cards + feedback |
| **S4** | **Framework Builder** generic engine (definitions, stepper, prefill, accept/edit/reject, validation DSL, provenance badges); artifact versioning + history UI; Beta-1 definitions: **SWOT, PEST/STEEPLE, 5 Whys, Cause & Effect** |
| **S5** | Beta-1 definitions: **SIPOC, Impact/Effort, Risk Matrix, Action Plan**; Visualization Engine (DiagramModel, layouts for matrix/fishbone/why-chain/table/columns/sipoc); **PNG/SVG + PDF export**; golden-set eval in CI |

**Beta-1 release (end of week 11):** closed beta, 30–50 users from 5–8 design-partner organisations (AR-majority).
**Exit metrics:** top-3 hit ≥ 0.80 on golden set; activation ≥ 25 %; no P1 security findings; AR/EN completion gap ≤ 10 pts.

## Phase 2: MVP Beta-2 → GA (8 weeks, S6–S9)

| Sprint | Scope |
|---|---|
| **S6** | **PPTX exporter** (native shapes/tables, RTL patching, slide recipes, appendix: assumptions & sources); narrative step (action titles, exec summary); export manifest |
| **S7** | Beta-2 definitions: **Stakeholder Map, Project Charter, Gantt** (dual calendar, workweek config); **chaining** (ports, hand-off UI, chain view) |
| **S8** | Beta-2 definitions: **BPMN subset, VSM, Org Chart, Operating Model Canvas** (ELK layouts, swimlanes); document upload as evidence (sandboxed extraction) |
| **S9** | Hardening: performance budgets, visual regression AR/EN for all 15 renderers on PowerPoint Win/Mac golden files; pen test; sharing (read-only org link + comments); usage/cost dashboard; pricing & billing integration; **GA** |

**GA exit metrics:** top-3 hit ≥ 0.85, top-1 ≥ 0.70; activation ≥ 35 %; recommendation relevance ≥ 80 %; median AI cost ≤ $0.60/completed analysis; WCAG 2.2 AA audit passed.

## Phase 3: Teams & Enterprise (14 weeks, S10–S16)

- SSO (SAML/OIDC) + SCIM; admin console (members, roles, policies: PII mode, gate τ, AI disclosure, retention).
- Workspace brand templates (PPTX masters, colours, fonts, logo); DOCX + XLSX exports; BPMN 2.0 XML export.
- Real-time co-editing of framework instances (CRDT, e.g. Yjs, over WebSockets) + presence.
- Org knowledge base (`org_kb`): upload playbooks; org-specific frameworks via a definition authoring UI (no-code, validated).
- Region-pinned deployment stack + BYOK; Helm chart for dedicated/on-prem; Keycloak option.
- Activate the **first 10 frameworks from slots 16–50**, prioritised by recommendation `not_supported` demand logs.
- SOC 2 Type I / ISO 27001 Stage 1.

## Phase 4: Scale & intelligence (ongoing)

- Learning-to-rank recommendation from feedback (≥ 10k labelled sessions).
- "Deep analysis" mode: multi-document evidence synthesis (agentic, long-running; Temporal workflows).
- Remaining catalogue activation (to 50); industry packs (government services, healthcare operations, banking ops).
- Integrations: Microsoft 365 (Teams app, SharePoint export), Jira/Azure DevOps (push the Action Plan as tickets), MS Project (Gantt).
- BYO-model / self-hosted model support via the gateway for sovereign customers.
- SOC 2 Type II, ISO 27001, ISO 42001.

## Cross-phase workstreams

| Workstream | Cadence |
|---|---|
| Eval & quality | Every PR touching AI assets; weekly quality review of disagreement logs & 👎 feedback |
| Content | 1–2 framework activations per sprint after GA; glossary updates |
| Arabic quality | Bi-weekly native-reviewer sample (20 outputs) scored on rubric |
| Security | Monthly dependency/infra review; quarterly restore drill; annual pen test |
| Cost | Weekly per-route token & cost report; cache-hit rate; effort tuning experiments with eval evidence |

## Key risks to the timeline

| Risk | Impact | Mitigation |
|---|---|---|
| PDF unavailable or licence blocks use | KB attribution and catalogue slots 16–50 delayed | MVP works fully on platform-authored content; attribution layer ready to switch on |
| PPTX RTL rendering quirks | GA slip | Start PPTX spike in S3 (parallel), PDF as the guaranteed format |
| BPMN/VSM renderer complexity | Beta-2 slip | Subset scope locked; ELK-based; can slip to post-GA without blocking GA (13 frameworks) |
| Arabic output quality below bar | Adoption in primary market | Native reviewers from Phase 0; glossary; Arabic-specific eval gates |
| Recommendation quality plateaus | Trust | Content-owned affinity matrices; disagreement review loop; more golden data |

## Immediate next steps (proposed)

1. **You:** provide the PDF and licence position. Confirm the working name, the primary market (A1) and the design-partner list.
2. **Us:** on approval of this pack, start Phase 0 with **E-1/E-2/E-3** (scaffolding) and **K-4/K-5** (taxonomy and golden set). Those don't depend on the PDF.
3. **Decisions to confirm** (defaults are recommended in each DR): DR-01 modular monolith, DR-06 Claude-first gateway, DR-07 hybrid recommender, DR-12 one-model-many-renderers, DR-15 RLS multi-tenancy.
