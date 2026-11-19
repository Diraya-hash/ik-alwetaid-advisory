# Business Problem-Solving Platform: Design Pack (v0.1)

> Status: **Draft for review. No code yet** (as requested).
> Working name: **Advisory Studio**. Code name `studio`. Rename freely: the name appears in no schema.
> Date: 2026-11-19

## What this pack contains

| # | Document | Covers the requested deliverables |
|---|---|---|
| 01 | [Product Requirements Document](01-prd.md) | 1 PRD, 7 user journey & application flow, 8 MVP feature prioritisation |
| 02 | [Technical Architecture](02-architecture.md) | 2 Complete technical architecture (7 engines), 10 Visualisation architecture |
| 03 | [Knowledge & Framework Schemas](03-knowledge-schemas.md) | 3 Knowledge Base data schema, 4 Framework metadata schema |
| 04 | [AI Logic: Taxonomy, Diagnosis, Recommendation](04-ai-logic.md) | 5 AI recommendation logic, 6 Problem classification taxonomy |
| 05 | [Database Architecture](05-database.md) | 9 Database architecture (DDL-level) |
| 06 | [Security & Data Privacy](06-security-privacy.md) | 11 Security and data privacy |
| 07 | [Development Roadmap](07-roadmap.md) | 12 Development roadmap |

Every major decision is recorded as a **Decision Record (DR-nn)** with rationale and rejected alternatives. The index is in [02 §0](02-architecture.md#0-decision-records-index).

## ⚠️ Source status: the reference PDF was not available

The brief names *"50 Business Diagrams for Strategic Planning – Creately"* as the primary knowledge source. **I could not find it.** I checked:

- this repository,
- the session's upload and attachment folders,
- your Google Drive (searched by title and full text for "Creately" and "Business Diagrams").

So, to follow the rule *"do not invent information and attribute it to the PDF"*:

1. **Nothing in this pack is attributed to the PDF.** Methodology descriptions here come from general professional practice. They are tagged `provenance: "platform_authored"` in the schema examples, never `source_document`.
2. The schemas include a **source ingestion pipeline** (03 §2, 02 §3.3). It turns the PDF into page-anchored, citable chunks once it is supplied. Every PDF-derived field then carries `source_ref {document_id, page, locator}`.
3. **The framework catalogue (03 §5) lists the 15 MVP methodologies by name only.** The other 35 entries are placeholders `F16–F50`. They get filled from the PDF's actual table of contents during ingestion (roadmap Phase 0, task K-2). I did not guess which 35 frameworks the PDF contains.
4. **Copyright posture:** the PDF is treated as a **reference to learn from, not content to republish**. We store short, cited excerpts for retrieval and attribution. We do not store or render its diagrams or templates. All visuals come from our own renderers (02 §6). See 06 §7.

**Action needed from you:** upload the PDF to the repo (e.g. `docs/business-solver/sources/`) or to Drive, and confirm you have the right to use it as an internal reference. Phase 0 cannot finish without it.

## Relationship to the existing repo

This repo already contains:

- `alwetaid-advisory-v2/`: the marketing site.
- `ik-lna-simulator/`: a Next.js 14 / TypeScript / Tailwind / Zod app with a working AR/EN + RTL i18n system, design tokens, a contrast checker and E2E scripts.

The new platform is a **separate set of apps in the same repo** (`apps/studio-web`, `apps/studio-api`, `apps/studio-worker`; see 02 §8). It **reuses the simulator's proven pieces**: the i18n dictionary pattern and `[locale]` routing, the token CSS, the IBM Plex Sans Arabic + Inter font pairing, and the contrast and axe checks. That saves an estimated 2–3 weeks of RTL groundwork.

## The ten-line summary

1. **Chat-first, but not chat-only.** The conversation drives a structured **Project Workspace**. Every AI output lands as an editable, versioned *artifact*, not as chat text.
2. **Seven engines behind one orchestrator.** They are deployed as modules of a single TypeScript service plus one worker service (a modular monolith), not as microservices (DR-01).
3. **Every AI output is schema-validated JSON.** Every claim inside it is typed `fact | assumption | ai_suggestion | user_input`, with evidence references (DR-05).
4. **Gated recommendation.** The engine refuses to recommend until a *context sufficiency score* passes a threshold. Until then it asks targeted clarifying questions (04 §4).
5. **Hybrid recommendation.** Deterministic rules plus taxonomy-to-framework affinity scoring produce the candidates. The LLM re-ranks them and explains why, and it can only pick from candidates the rules allow (DR-07). This keeps it explainable, auditable and testable.
6. **Frameworks are data, not code.** Each methodology is a versioned *Framework Definition* (JSON). It declares the inputs, guided steps, output schema, validation rules and visual type. Turning on framework #16 means writing content, not code (DR-08).
7. **One canonical document model renders everywhere.** A diagram's JSON model renders to interactive SVG on the web, and to PPTX, PDF and DOCX on the server, from the same source (DR-12).
8. **Postgres is the system of record.** It holds project data, the knowledge base (pgvector plus full-text search) and the audit trail. Row-level security gives tenant isolation, and an enterprise single-tenant option exists (DR-14, DR-15).
9. **Arabic is first-class, not a translation layer.** The app is bilingual end to end. That covers the UI, the AI output (generated natively in the user's language, not machine-translated), the RTL diagram layout and the RTL PPTX/PDF exports.
10. **MVP: 15 frameworks, 3 export formats (PPTX, PDF, PNG/SVG), single-user workspaces with sharing, 14 weeks.** Enterprise SSO, teams and BYO-model follow in Phase 3.
