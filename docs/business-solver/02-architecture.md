# 02: Technical Architecture (incl. Visualisation Architecture)

> **v0.2** (2026-11-19). Product: **Business Problem Solver**. Changes: Strategic Options module and three-level Critic module (DR-21, DR-22); vector RAG deferred, long-context KB for MVP (DR-09 amended); single layout service for consistent Arabic text measurement (DR-23); export language and translated versions (DR-24); in-Kingdom (KSA) deployment profile (DR-25); repository renamed to `bps-*`. Changes are marked **[v0.2]**.

## 0. Decision records index

| DR | Decision | Section |
|---|---|---|
| DR-01 | Modular monolith (API) + worker service, not microservices | §1.2 |
| DR-02 | TypeScript end to end | §1.3 |
| DR-03 | Next.js 14 App Router web client, reusing the simulator's i18n/RTL foundation | §1.3 |
| DR-04 | Separate API service (Fastify + Zod + OpenAPI), not Next.js route handlers | §1.3 |
| DR-05 | Every AI output is schema-validated JSON made of **statements** with five independent dimensions (truth status, origin, authorship, evidence, history; 03 §3) **[v0.2]** | §3.1 |
| DR-06 | Claude via the official Anthropic SDK behind a Model Gateway | §4 |
| DR-07 | Hybrid recommendation: rules and scoring generate candidates, the LLM re-ranks and explains | §3.2 / 04 §5 |
| DR-08 | Frameworks are versioned data (Framework Definitions), not code | §3.4 / 03 §4 |
| DR-09 | **[v0.2 amended]** MVP: platform KB in the cached prompt prefix + Postgres FTS over project evidence; **no embeddings or vector index**, subject to Phase 0 eval. Hybrid retrieval (pgvector + FTS + RRF) kept as the designed extension | §3.3 |
| DR-10 | No fine-tuning; prompt + retrieval + evaluation | §4.5 |
| DR-11 | Deterministic orchestrated workflow (state machine), not an autonomous agent | §2 |
| DR-12 | One canonical DiagramModel, three renderers (web SVG, PPTX-native, PDF via Chromium) | §6 |
| DR-13 | ELK.js for graph layouts, purpose-built layouts for matrices/canvases | §6.4 |
| DR-14 | PostgreSQL as the single system of record (relational + JSONB + vectors + FTS) | 05 |
| DR-15 | Shared-schema multi-tenancy with RLS; dedicated deployment for enterprise | 05 §2 / 06 |
| DR-16 | Immutable artifact versions + JSON Patch deltas (not full event sourcing) | 05 §3.5 |
| DR-17 | Postgres-backed job queue (pg-boss) for MVP; Temporal when workflows outgrow it | §5 |
| DR-18 | Containerised, cloud-portable deployment; AWS first, region-pinnable | §7 |
| DR-19 | Server-Sent Events for streaming; no WebSockets in MVP | §5 |
| DR-20 | Managed identity broker for SSO/SCIM; Keycloak for sovereign deployments | 06 §2 |
| DR-21 | **[v0.2]** Strategic Options as a platform capability (module 4a), not a catalogue framework | §3.4a |
| DR-22 | **[v0.2]** Three-level Critic (module 4b): deterministic item rules + rubric-based LLM reviews; findings never auto-applied | §3.4b |
| DR-23 | **[v0.2]** One layout service (headless Chromium) computes diagram geometry for screen and all exports | §6.4a |
| DR-24 | **[v0.2]** Native generation by default; other-language export through explicit, labelled translated versions | §3.6 |
| DR-25 | **[v0.2]** Deployment profiles incl. a KSA in-Kingdom profile; the Model Gateway fails closed when no compliant route exists | §7.1 |

---

## 1. System overview

### 1.1 Context diagram

```
                    ┌──────────────────────────────────────────────────────────────┐
  Browser (AR/EN) ──┤  apps/web  (Next.js 14, React, Tailwind, SSE client)          │
                    └───────────────┬──────────────────────────────────────────────┘
                                    │ HTTPS (REST/JSON + SSE), JWT session
                    ┌───────────────▼──────────────────────────────────────────────┐
                    │  apps/api  (Fastify, modular monolith)                        │
                    │ ┌──────────────┐  ┌─────────────────────────────────────────┐ │
                    │ │ Orchestrator │─▶│ Engines (in-process modules)            │ │
                    │ │ (workflow    │  │ 1 Diagnosis   2 Recommendation          │ │
                    │ │  state       │  │ 3 Knowledge   4 Framework Builder       │ │
                    │ │  machine)    │  │   4a Strategic Options  4b Critic       │ │
                    │ │              │  │ 5 Visualization (model + layout svc)    │ │
                    │ └──────────────┘  │ 7 Workspace (projects, versions, ACL)   │ │
                    │                   └─────────────────────────────────────────┘ │
                    │  Platform: Auth/ACL · Model Gateway · Prompt Registry ·        │
                    │   Validation · Audit · Metering · Billing/Entitlements · Flags │
                    └──────┬───────────────┬──────────────────┬─────────────────────┘
                           │               │ enqueue          │
              ┌────────────▼───┐   ┌───────▼─────────┐  ┌─────▼───────────────────┐
              │ PostgreSQL 16  │   │ apps/worker      │  │ Model providers          │
              │ + pgvector     │◀──┤ 6 Deliverables   │  │ Anthropic API (default)  │
              │ + FTS + RLS    │   │   Generator      │  │ / Bedrock / Vertex       │
              │ + pg-boss      │   │ ingestion, embed,│  │ Embedding provider       │
              └────────────────┘   │ evals, exports   │  └──────────────────────────┘
              ┌────────────────┐   │ (Chromium for PDF)│
              │ Object storage │◀──┤                  │
              │ (S3-compatible)│   └──────────────────┘
              └────────────────┘
```

### 1.2 DR-01: modular monolith, not microservices

**Decision.** The seven engines are **modules with hard boundaries inside one API process**. Each has its own folder, public interface, DB schema ownership and tests. Heavy or slow work runs in **one separate worker process**: exports, document ingestion, embeddings, batch evals.

**Rationale.**
- A team of 4–8 engineers cannot afford the operational cost of 7 services (deploys, tracing, network failures, versioned contracts).
- Engines call each other in tight sequences inside one request (diagnose → recommend). In-process calls are faster and easier to make transactional.
- The boundaries are still real. Module interfaces are TypeScript interfaces plus Zod contracts, and lint rules forbid cross-module imports except through `index.ts`. Any module can be pulled out later, and the Deliverables Generator already is.

**Alternatives considered.**
| Option | Why rejected now |
|---|---|
| Microservices per engine | Premature. Distributed-systems cost with no scaling benefit at MVP volume |
| Everything in Next.js (route handlers + server actions) | Mixes UI deploys with AI/business logic. Long-running jobs and Chromium don't fit serverless limits. Harder to deploy on-prem for enterprise |
| Python backend (FastAPI) for AI + TS front end | Two languages, two type systems, duplicated schemas. See DR-02 |

### 1.3 Stack (DR-02, DR-03, DR-04)

| Layer | Choice | Rationale | Alternatives |
|---|---|---|---|
| Language | **TypeScript (strict)** everywhere | One type system from DB to UI. Zod schemas are shared by API validation, LLM output validation and UI forms. The repo's existing apps already use TS + Zod. The Anthropic TS SDK is first-party | Python: stronger data-science ecosystem, but nothing in our needs requires it (no model training; PPTX via pptxgenjs) |
| Web | **Next.js 14 App Router**, React 18, Tailwind 3, Radix primitives, TanStack Query, Zustand for local editor state | Reuses `ik-lna-simulator`: `[locale]` routing, i18n dictionaries, `tokens.css`, fonts, contrast/axe checks | Remix / Vite SPA: fine, but loses reuse |
| API | **Fastify 4** + `zod` + `fastify-type-provider-zod` + generated **OpenAPI 3.1** | Fast, low overhead, first-class schema validation. OpenAPI lets enterprise customers integrate | NestJS: heavier DI ceremony. tRPC: great DX but no public OpenAPI contract for enterprise integrators |
| ORM / SQL | **Drizzle ORM** + raw SQL migrations | Typed, SQL-transparent, supports RLS `SET LOCAL` patterns and pgvector | Prisma: weaker with RLS, pgvector and raw SQL |
| Queue | **pg-boss** (DR-17) | No extra infra. Transactional enqueue with business writes | BullMQ/Redis (adds Redis), Temporal (right for long multi-step sagas, overkill for MVP) |
| Cache / rate limit | Postgres + in-memory LRU; **Redis added in the Teams phase** if needed | Avoid infra we don't need yet | — |
| Object storage | S3-compatible (AWS S3 / MinIO on-prem) | Portable | — |
| PPTX | **pptxgenjs** (+ post-processing of OOXML for RTL paragraph props) | Native shapes, tables and charts that stay editable. Has an RTL mode. TS-native | python-pptx (needs Python), Aspose (licence cost, but a strong enterprise fallback) |
| PDF | **Headless Chromium (Playwright) printing our own React report pages** | A browser gives the best Arabic shaping, bidi and font fallback. The diagram renderer is shared with the web app | PDFKit / react-pdf: weak complex-script (Arabic) shaping |
| Diagram layout | ELK.js (graphs), custom layouts (matrices, canvases, timelines) (DR-13) | §6.4 | — |
| Observability | OpenTelemetry → Grafana stack (or Datadog); Sentry for errors | Vendor-portable | — |
| Monorepo | pnpm workspaces + Turborepo | Shared packages (schemas, i18n, diagram-model, renderers) | Nx |

---

## 2. Orchestration: the workflow state machine (DR-11)

The core journey is a **deterministic, code-controlled workflow** with LLM calls at defined nodes. It is not an open-ended autonomous agent.

**Why.** Each step has a known input/output contract, a user checkpoint and a validation gate. We need reproducibility, auditability ("why was this recommended?") and per-step evaluation. An agent that picks its own tools adds latency, cost and variance and makes none of those requirements easier. The LLM still has the freedom that matters, inside each node: reasoning, writing and choosing among allowed candidates.

**Alternatives.** An autonomous tool-using agent (e.g. a hosted agent runtime). Rejected for the core journey. We will reconsider it in the Scale phase for an optional "Deep analysis" mode that reads many uploaded documents.

### 2.1 Project state machine

```
DRAFT ──describe──▶ DIAGNOSING ──ok──▶ NEEDS_CONTEXT ◀──┐
                        │                  │ answer      │ (sufficiency < τ, rounds < max)
                        │                  └─────────────┘
                        └──sufficient──▶ DIAGNOSED ──▶ RECOMMENDING ──┬──▶ RECOMMENDED ──select──┐
                                                                      └──▶ NO_GOOD_FIT ──path────┤
                                                                                                 ▼
             ┌──────────── ANALYSING (per FrameworkInstance; draft-first ⇄ workshop) ◀──────────┤
             │                         │ chain / options                                         │
             │                         ▼                                                         │
             │                 OPTIONS (option_set) ──accept──▶ PLANNING (Action Plan / Gantt) ──┘
             ▼
        REVIEWING (Project-level Critic, mandatory) ──▶ SUMMARISED ──▶ EXPORTED
             ▲                                                            │
             └──────────── edit anything (downstream marked stale) ◀─────┘
```

[v0.2] Workflow state is **project-level guidance, not a lock**. Users can move freely between artifacts. The state drives the journey rail (09 §4) and the next-best-action prompts.

- State lives in `project.workflow_state` (05). Transitions are guarded server-side: an illegal transition returns a 409.
- **Edits upstream invalidate downstream softly.** Editing the diagnosis marks recommendations `stale`. It never deletes them. The user decides whether to re-run.
- Every node writes an **AI Run record** (05 §3.7): prompt version, model, inputs hash, output, validation result, tokens, cost, latency.

### 2.2 Request flow example (Describe → Diagnose)

```
web ──POST /projects/{id}/messages {text, lang}──▶ api
api: authz → PII scan → persist Message → Orchestrator.handle(event=USER_MESSAGE)
  Orchestrator: state=DRAFT → call DiagnosisEngine.diagnose(ctx)
    DiagnosisEngine: Knowledge.retrieve(taxonomy hints) → ModelGateway.structured(
        prompt=diagnosis@v3, schema=ProblemDiagnosisSchema, stream=true)
      ← streamed partial JSON → SSE "diagnosis.partial" events to web
      ← final JSON → Zod validate → semantic validators (statement truth-status rules, evidence refs)
         ✗ fail → 1 repair attempt (validator errors fed back) → still fail → error state + fallback UI
    persist Artifact(diagnosis, v1) + AIRun
  Orchestrator: compute sufficiency → transition DIAGNOSED | NEEDS_CONTEXT
api ──SSE "workflow.state"──▶ web
```

---

## 3. The seven engines

Each engine section lists: **responsibility · interface · internals · data owned · failure modes.**

### 3.1 Engine 1: AI Problem Diagnosis Engine

**Responsibility.** Turn free text (plus evidence and clarification answers) into a validated `ProblemDiagnosis` (04 §3). That includes the taxonomy classification, statements with truth status and origin (03 §3), missing-information list and context sufficiency score.

**Interface.**
```ts
interface DiagnosisEngine {
  diagnose(input: { projectId: ID; messages: Message[]; evidence: EvidenceRef[]; locale: 'ar'|'en'; prior?: ProblemDiagnosis }): AsyncIterable<DiagnosisEvent>; // partial → final
  scoreSufficiency(d: ProblemDiagnosis, candidates?: FrameworkId[]): SufficiencyResult;   // deterministic
  nextQuestions(d: ProblemDiagnosis, candidates: ScoredFramework[]): ClarifyingQuestion[]; // LLM-phrased, rule-selected
}
```

**Internals.**
1. **Pre-processing:** language detection (fast local detector, e.g. CLD3 port) and PII/sensitive-data scan (06 §5).
2. **Extraction call** (structured output, DR-05): one LLM call produces the entire `ProblemDiagnosis`, including taxonomy labels from the **closed enum** of taxonomy codes. The model cannot invent categories because the JSON Schema `enum` constrains it.
3. **Semantic validation** (code) **[v0.2]**: AI routes can only emit `truth_status ∈ {unverified, assumption}`. An `unverified` statement claiming user support must carry a resolving `user_message_span` or evidence chunk; otherwise it is **downgraded to `assumption`** and logged (03 §3.2, I2–I3). Taxonomy confidence is calibrated (04 §2.4).
4. **Sufficiency scoring** (code, 04 §4): deterministic, explainable, testable.
5. **Question selection** (04 §5.3): code picks *which* information is missing by information gain. The LLM only phrases the question in the user's language and register.

**DR-05: structured JSON + statements with independent truth status, origin and authorship.** *Rationale:* downstream engines, the UI badges, exports and evaluations all need machine-readable structure. Free text cannot be validated, diffed or rendered as a diagram. *Mechanism:* the API's structured-output mode (`output_config.format` with a JSON Schema generated from our Zod schemas) guarantees syntactically valid JSON. Zod plus semantic validators enforce meaning. *Alternatives:* function/tool calls for output (works, but structured output is the direct mechanism). "JSON mode via prompt only" was rejected as unreliable.

**Data owned:** `diagnoses` (as artifacts), `clarifying_questions`, `taxonomy_labels`.

**Failure modes:** schema-valid but semantically weak output → repair pass. Repeated failure → a "manual diagnosis" form pre-filled with whatever validated. Off-topic or unsafe → refusal path (04 §7).

### 3.2 Engine 2: Framework Recommendation Engine

**Responsibility.** Given a sufficient diagnosis, return 1–5 ranked frameworks plus an optional chain, each with a grounded rationale. Full logic is in **04 §5**. Summary:

```
Stage A  Eligibility filter (rules, code)   — active frameworks + Strategic Options capability ∩ preconditions ∩ exclusions
Stage B  Affinity scoring (code)            — domain affinity + stage fit + readiness + signals + DISCRIMINATORS (04 §5.3)
Stage C  Semantic retrieval                 — [v0.2] OFF in MVP (catalogue + discriminators in cached prefix); pluggable
Stage D  LLM re-rank + explain (Claude)     — ranks top-K candidates only (stable enum, membership checked in code)
Stage E  Post-validation (code)             — refs resolve, diversity, chain/port validity, deterministic NO GOOD FIT rule
```

[v0.2] **No Good Fit** (04 §5.7) is decided in code, not by the model: when no approach fits adequately, the engine returns `status: no_good_fit` with the closest approaches and their limitations, and logs a demand signal. It never forces a recommendation.

**DR-07: hybrid recommendation.** *Rationale:*
1. **Explainability and audit.** Each recommendation is traceable to rule hits and affinity scores, not only to model prose.
2. **Controllability.** Product and content owners tune the affinity matrix (data) without prompt engineering.
3. **Safety against hallucinated frameworks.** The LLM cannot recommend anything outside the eligible candidate set.
4. **Testability.** Stages A–C are unit-testable. Stage D is evaluated on the golden set.

*Alternatives:*
| Option | Problem |
|---|---|
| Pure LLM ("which frameworks fit?") | Unstable across runs, can't be audited, recommends frameworks we don't support, hard to tune |
| Pure rules / decision tree | Brittle with free text. Weak rationale quality. Poor at multi-label problems |
| Learned ranker (LTR) | Correct long-term, but needs feedback data we don't have. **Planned for the Scale phase** using the stored feedback (FR-RC-8) as training signal for Stage B weights |

### 3.3 Engine 3: Knowledge Retrieval Engine (RAG) (DR-09)

> **[v0.2] MVP mode (DR-09 amended; D1).**
> - **Platform KB:** published, platform-authored KnowledgeEntries for the 15 frameworks (~60–90k tokens AR+EN) are chunked with stable IDs and served **in the cached prompt prefix**, filtered to the frameworks relevant to the route. No embeddings.
> - **Project evidence:** extracted text (≤ ~150 pages per project) is chunked with IDs. Small sets go fully in context; otherwise Postgres FTS (Arabic-normalised) selects chunks. No embeddings.
> - **Reference sources** (e.g. the Creately PDF) are **never** ingested, chunked or placed in prompts (03 §2).
> - **Gate for adding vectors:** the Phase 0 long-context vs. retrieval eval (04 §11). Vectors become necessary when org KB (Enterprise) or evidence volume exceeds context budgets. The design below is the retained extension.

**Responsibility.** Store, chunk, (optionally) embed and retrieve knowledge with **provenance**. It serves: (a) platform framework knowledge (definitions, use cases, steps, pitfalls, examples), (b) future **licensed** citable sources (only after legal approval, 03 §2.1), (c) **project evidence** (user uploads, tenant-scoped), (d) taxonomy descriptions used for classification hints.

**Corpora and isolation.**
| Corpus | Scope | Provenance values |
|---|---|---|
| `platform_kb` [v0.2, was `global_kb`] | All tenants, read-only | `platform_authored` (our content team), `ai_drafted_reviewed` (AI-drafted without reference-source input, human-approved). Licensed sources only after legal approval |
| `org_kb` | One org (Enterprise: org-specific frameworks and playbooks) | `org_authored` |
| `project_evidence` | One project | `user_upload`, `user_statement` |

**Ingestion pipeline** (worker):
```
upload → virus scan → type detect → extract (PDF: text + layout via pdf parser; page numbers preserved;
OCR fallback for scanned pages) → normalise (Arabic: unify alef/ya/ta-marbuta variants for the FTS
column only, strip tatweel and diacritics for the index, NEVER for the stored display text)
→ structure-aware chunking (heading/section boundaries; 300–600 tokens; 15% overlap; tables kept whole)
→ metadata enrichment (framework_id tags, section_type: definition|use_case|steps|example|pitfall)
→ embed (batch) → upsert chunks + vectors + tsvector → mark source version active
```

**Retrieval.**
1. Query construction: the engine builds the query from structured context (e.g. diagnosis summary + framework ID + step), not only from the raw user message.
2. **Hybrid search.** pgvector cosine top-40 ∪ Postgres FTS (`simple` config + Arabic-normalised column) top-40 → **Reciprocal Rank Fusion** → metadata filters (corpus, framework_id, section_type, language) → top-8.
3. Optional re-ranking with a cross-encoder (extension, if eval shows gains).
4. **Return chunks with stable IDs** (`chk_…`) and full source refs. Prompts receive chunks wrapped as `<source id="chk_…" doc="…" page="…">…</source>`. Output schemas require statements to cite these IDs. The validator rejects IDs that weren't provided and runs a lexical-overlap check between each statement and its cited chunk, flagging low overlap for review.

**Why our own citation IDs rather than the API's native document citations?** The native Citations feature returns cited text spans, but it **cannot be combined with structured JSON output** (the API rejects that combination). We need both, so we embed chunk IDs inside the JSON and verify them ourselves. Native citations remain an option for the free-form "Explain this framework" answer, which is prose, not JSON.

**DR-09 alternatives.**
| Option | Verdict |
|---|---|
| Dedicated vector DB (Pinecone, Weaviate, Qdrant) | Rejected for MVP. The corpus is small (thousands to low millions of chunks). A second datastore complicates tenant isolation, backups and residency. Revisit above ~20M chunks |
| Vector-only retrieval | Rejected. Arabic morphology and exact framework names ("SIPOC", "BPMN") favour lexical matching. Hybrid is measurably more robust |
| Long-context stuffing (put all framework docs in the prompt) | **Used where it fits.** The *framework catalogue summaries* (~15–50 entries) go into the recommendation prompt directly as a cached prefix. RAG is for long-tail detail and user documents |

**Embedding model.** Behind an `EmbeddingProvider` interface. [v0.2] Not used in MVP. When activated, the default is a hosted **multilingual** embedding model chosen by a **bake-off on our own Arabic+English retrieval eval** (recall@8 on 200 labelled queries) when the extension is activated. Candidates: a hosted multilingual API model and the self-hostable `bge-m3`. For sovereign deployments, self-hosted `bge-m3` (no data leaves the region). Vectors store `embedding_model` and `dim` so models can be swapped and corpora re-embedded side by side.

### 3.4 Engine 4: Interactive Framework Builder (DR-08)

**Responsibility.** Instantiate a `FrameworkDefinition` (03 §4) into a `FrameworkInstance` and drive guided steps. It pre-fills with AI, validates, tracks provenance per element, and passes outputs to chained frameworks.

**DR-08: frameworks as data.** A Framework Definition is a versioned JSON document. It declares:
- `input_schema` / `content_schema` (JSON Schema for the framework's content, e.g. a SWOT has 4 arrays of items),
- `steps[]`, each with instructions (AR/EN), the target content path, a pre-fill prompt template ID, and validation rules,
- `validation_rules[]` in a small declarative rule DSL (JSONLogic),
- `visual` (which DiagramModel type plus mapping from content to diagram),
- `export` slide recipes,
- `ports` for chaining.

*Rationale:* adding frameworks 16–50 becomes content work: author a definition, plus a renderer only if it needs a new visual type. Most map onto existing types, e.g. "Ansoff Matrix" → `matrix_2x2`. Definitions are versioned, so old instances keep rendering with the version they were created under.

*Alternatives:* hard-coded React components per framework, which is faster for the first 3 and slower for the next 47. A generic "LLM generates whatever structure" approach was rejected: there is no validation and no consistent rendering.

**Generic engine loop per step:**
```
load step → gather context (diagnosis, upstream instance outputs via ports, evidence top-k)
→ if AI prefill enabled: LLM structured call with JSON Schema = the step's content sub-schema
→ every element becomes a statement {origin: ai_generated, review_status: pending_review, truth_status: assumption|unverified, ai_run_id, evidence_refs}
→ user accept/edit/reject → JSON Patch applied → new version
→ run validation_rules (deterministic) + Critic item/framework review (async; findings, never edits)
```

**Element-level information model [v0.2].** Each item (e.g. a SWOT strength, a "why", a risk) is a `core/statement.v2` (03 §3). It has five independent dimensions: truth status, origin, authorship, evidence refs and history, plus three independent statuses (truth, review, decision; 03 §3.1). Edits update authorship and history only. **No status and no origin changes as a side effect** (I1). These labels survive into exports.

**Two application modes [v0.2].**

| Mode | Default? | Flow | AI calls |
|---|---|---|---|
| **Consultant mode (draft-first)** | ✅ | One `fw.<id>.draft` call per `draft_group` produces a complete first version, streamed into the canvas. The user reviews: accept / edit / reject / challenge, item by item or in bulk | 1–2 per framework |
| **Workshop mode (guided)** | Switchable at any time | Step-by-step stepper; optional per-step AI pre-fill; good for facilitation and learning | 0–1 per step |

Switching modes never loses content. Both modes write to the same instance and version history.

### 3.4a Module: Strategic Options (DR-21) [v0.2]

**Responsibility.** Generate, explain, compare and recommend courses of action (04 §6). It is a module of Engine 4, sharing the Builder's statement model, versioning and Critic hooks. It produces an `option_set` artifact.

**Why a capability, not a catalogue framework.** "What should we do?" is the consultant's core move, not a named methodology. Modelling it as a platform capability:
- avoids inventing a framework or depending on a reference source (D1);
- lets it sit inside any chain (after root cause, after SWOT, after OMC);
- lets it be scored by the recommender like a framework (stage-fit row in 04 §5.2).

**Pipeline.**
```
inputs via ports (problem_statement, cause_list | swot_set | factor_list, goals, constraints, user options)
→ options.generate (LLM, ai/option-set.v1) → validators: ids resolve; ≥3 distinct options + baseline;
  assumptions as separate statements; every top cause addressed or listed in coverage_gaps
→ weighted scoring IN CODE with user weights → "too close to call" check (Δ < 0.3)
→ Item + Framework Critic → user decides (decision_status) → accepted options exported on
  prioritised_option_list port → Impact/Effort or Action Plan
```
**Alternative considered:** a fixed "decision matrix" framework only (the user lists options, the system scores them). Rejected for MVP, because the user explicitly needs *generation* of options. A decision-matrix view is kept as the comparison table.

### 3.4b Module: Three-level Critic (DR-22) [v0.2]

**Responsibility.** Review outputs for gaps, errors and inconsistencies at three levels (04 §7): **item**, **framework** and **project**. Every finding has a severity, an explanation and a suggested correction. **The Critic never modifies content.** It proposes; the user accepts, rejects or dismisses.

| Level | Implementation | Runs |
|---|---|---|
| Item | Deterministic rule engine (`packages/critic-rules`): required fields, **calculations** (L×I, weighted scores, durations, totals, %), date order, numeric contradictions with earlier statements; plus a light LLM language check (vague/compound/certainty-wording) on demand | In-process, synchronous (rules); async (LLM) |
| Framework | LLM with framework rubric (`rubric.<framework>.v1`), adversarial reviewer persona, separate from generator prompts | Async job on step-group completion / "Review" / before hand-off |
| Project | LLM over diagnosis + instances + port links + summary draft | Async job; **mandatory before export**; on demand |

**Interfaces.**
```ts
interface Critic {
  runItemRules(target: ArtifactRef): CritiqueFinding[];                       // sync, deterministic
  review(level: 'item'|'framework'|'project', target: ArtifactRef): Promise<CritiqueRun>;
  act(findingId: ID, action: 'accept'|'reject'|'dismiss', reason?: string): Promise<FindingEvent>;
  // accept → applies suggested_correction.patch AS A USER CHANGE via Workspace.createVersion (author_type=user)
}
```

**Rules.** Findings are pinned to an artifact version. They are re-evaluated (and closed as `resolved`) when the target changes. Dismissed findings don't reappear unless the target changes. The noise budget is ≤ 7 visible AI findings per framework run. Storage: `critique_runs`, `critique_findings`, `critique_finding_events` (05 §3.10).

**Alternatives considered.** (a) The generator self-checks in the same call: cheaper, but it shares the generator's blind spots and produces no reviewable history. Rejected. (b) Human-only review: not scalable and slow; kept as a possible paid add-on (open decision D14). (c) Blocking export on any finding: too heavy-handed. Critical findings instead require **acknowledgement**, recorded in the manifest.

### 3.5 Engine 5: Visualization Engine. See §6.

### 3.6 Engine 6: Business Deliverables Generator

**Responsibility.** Compose a `DeliverableSpec` (which artifacts, language, template, options) into files: PPTX, PDF and PNG/SVG in the MVP, DOCX and XLSX in the Teams phase. It runs in the **worker**.

**Pipeline.**
```
DeliverableSpec ─▶ Composer: resolve artifact versions (pinned), build a format-neutral
                   "DocumentOutline" (sections → blocks: heading, paragraph, bullet list,
                   table, diagram(DiagramModel), callout(assumptions), source list)
               ─▶ Narrative step (optional LLM): executive summary & slide titles
                   ("action titles": a full-sentence takeaway per slide), statement labels preserved
               ─▶ Format adapters:
                     PPTX  : outline → slide recipes (per framework) → pptxgenjs → OOXML RTL patch
                     PDF   : outline → React report pages (shared renderers) → Chromium print
                     PNG/SVG: DiagramModel → SVG (shared renderer) → (resvg for PNG)
               ─▶ Manifest (JSON, embedded as PPTX custom XML part / PDF metadata / sidecar)
               ─▶ store in object storage → Deliverable row → signed URL (expiring)
```

**Key rules.**
- **Pinned versions.** A deliverable references exact artifact versions, so re-downloading always gives the same file. "Regenerate" creates a new deliverable.
- **Native, editable PPTX.** Matrices become tables or shapes, and process flows become connected shapes. No screenshots, except an optional "image fallback" for exotic visuals.
- **Slide recipes** live in the Framework Definition `export.pptx` (03 §4). Example for SWOT: 1 title slide, 1 matrix slide, 1 "implications" slide when a TOWS step exists.
- **Appendix**: an Assumptions Register, an evidence list (user-provided documents with page refs), and methodology notes (platform-authored, with methodology-originator attribution, 03 §6.1). An AI-generated-content disclosure is on by default; admins can toggle it. **[v0.2] No third-party reference source is cited or quoted** (D1).
- **[v0.2] Problem-Solving Summary first.** Every deliverable opens with the `ps_summary` artifact (challenge → diagnosis → methods → findings → recommendation → roadmap → open assumptions → review status). It is generated from existing statements only (no new facts), keeps their IDs and labels, and is user-editable.
- **[v0.2] Project-level Critic gate.** Export runs (or reuses, if nothing changed) a project-level critique. Unresolved **Critical** findings need explicit acknowledgement, recorded in the manifest.
- **[v0.2] Export language (DR-24).** Options: **Arabic, English, or the original working language**. If the requested language differs from the content language, a `translate.artifact` job creates **translated versions** of the involved artifacts. These are glossary-enforced, keep all statement IDs and metadata, are labelled "translated, not reviewed", and are reviewable and editable like any version. The original stays the source of truth; later edits to the original mark the translation stale. *Alternative rejected:* silent on-the-fly translation at render time. It is not reviewable and hides the fact that the text is a translation.
- **[v0.2] PPTX object policy.** Tables, matrices, canvases, lists, chains and the Gantt view are native editable objects. Graph diagrams (BPMN, VSM, fishbone, org chart) are native where the Phase 0 PPTX spike passes; otherwise a vector picture plus an "edit in app" link, flagged in the manifest (open decision D8, 07 §10).

### 3.7 Engine 7: Project Workspace

**Responsibility.** Projects, conversations, artifacts and their versions, evidence, deliverables, sharing, comments, activity log and search. It also owns authorisation checks (with the platform ACL module) and history/restore.

**Artifact model (central abstraction).** Everything the user can edit is an **Artifact** with typed `kind` (`challenge`, `diagnosis`, `recommendation_set`, `framework_instance`, `option_set` [v0.2], `ps_summary` [v0.2], `narrative`, `deliverable_spec`). Translated renderings are versions with `language` + `translation_of` (05 §3.3) and an append-only list of **ArtifactVersions** (DR-16, 05 §3.5). Every version records `author_type` (`user|ai|system`), `ai_run_id`, `parent_version`, a `patch` (RFC 6902) and the full `content` snapshot. Storing snapshots costs some extra space and makes reads O(1).

**Interfaces (REST, abridged).**
```
POST   /v1/projects                         GET /v1/projects?q=&category=&framework=&status=
GET    /v1/projects/{id}                    PATCH /v1/projects/{id}
POST   /v1/projects/{id}/messages           (starts/continues workflow; SSE at /v1/projects/{id}/events)
GET    /v1/projects/{id}/artifacts          GET /v1/artifacts/{aid}/versions
POST   /v1/artifacts/{aid}/versions         {base_version, patch}  → 409 on conflict (optimistic concurrency)
POST   /v1/artifacts/{aid}/restore          {version}
POST   /v1/projects/{id}/recommendations:run
POST   /v1/projects/{id}/framework-instances {framework_id, definition_version}
POST   /v1/framework-instances/{iid}/steps/{step}:prefill
POST   /v1/projects/{id}/deliverables        {spec}  → 202 + job id
GET    /v1/deliverables/{did}                (status, signed URL)
POST   /v1/projects/{id}/evidence            (upload; async ingestion)
GET    /v1/frameworks?status=active&lang=    GET /v1/frameworks/{fid}  (definition + KB summary)
POST   /v1/feedback                          {target_type, target_id, rating, reason_code, comment}
# [v0.2]
POST   /v1/framework-instances/{iid}:draft   {draft_group}               (Consultant mode)
POST   /v1/projects/{id}/option-sets          {inputs_bound[]}  → generate; PATCH weights; POST options/{oid}:decide
POST   /v1/statements/{sid}:set-truth-status  {truth_status, verification?, reason?}   (user only)
POST   /v1/statements/{sid}:challenge         {reason}
POST   /v1/critique-runs                      {level, target}   → 202;  GET /v1/critique-runs/{rid}
POST   /v1/critique-findings/{fid}:act        {action: accept|reject|dismiss, reason?}
POST   /v1/projects/{id}/summary:generate     GET/PATCH via artifacts
POST   /v1/artifacts/{aid}/translations       {language}  → 202
GET    /v1/projects/{id}/assumptions          (Assumptions Register)
GET    /v1/me/entitlements · GET /v1/orgs/{oid}/usage
```

---

## 4. AI platform layer (DR-06, DR-10)

### 4.1 Model Gateway

All model calls go through one internal `ModelGateway`. Engines never import the provider SDK directly.

```ts
interface ModelGateway {
  structured<T>(req: { route: RouteId; promptId: string; promptVersion: string; vars: object;
                      schema: ZodSchema<T>; locale: Locale; stream?: boolean; ctx: TenantCtx }): Promise<Result<T>> | AsyncIterable<Partial<T>>;
  text(req: {...}): AsyncIterable<string>;   // prose answers (e.g. "Explain this framework", with native citations)
}
```

Gateway responsibilities: provider routing per tenant (Anthropic API by default; Bedrock or Vertex for residency-bound tenants), **per-route model and effort config**, timeouts and retries, refusal handling, prompt-caching layout, PII redaction hooks, metering, OpenTelemetry spans, and **AI Run** persistence.

**DR-06: Claude via the official Anthropic TypeScript SDK (`@anthropic-ai/sdk`).**
- *Rationale:* strong structured-output support (`output_config.format` with JSON Schema), strong Arabic, long context (1M tokens) for document-heavy projects, prompt caching for our large stable prefixes (catalogue, taxonomy, instructions), and availability via first-party API plus AWS Bedrock and Google Vertex AI. The cloud options matter for enterprise residency and procurement.
- *Default model:* **`claude-opus-5-5`** with adaptive thinking on all routes. Effort is set **per route** in config and tuned by evaluation. Starting points: `high` for diagnosis and recommendation re-rank, `medium` for step pre-fill and narrative, `low` for question phrasing and titles. Moving any route to a cheaper model (e.g. Haiku-class for language detection or titles) is a **product and cost decision**, made only on eval evidence (04 §9). The gateway makes that a config change.
- *Refusals:* check `stop_reason` before reading content. Use the API's server-side fallback option where available, and degrade gracefully to "manual mode" UI.
- *No assistant prefill, no forced `tool_choice`:* current models reject both. The design relies on structured outputs instead.
- *Alternatives:* multi-provider "LLM router" from day 1. Rejected for MVP because each provider multiplies the eval matrix. The gateway interface keeps a second provider (or customer BYO-model, Scale phase) possible.

### 4.2 Prompt Registry
- Prompts are **files in the repo** (`packages/prompts/<id>/<version>.md` + `meta.json` with model route, schema ID, eval set ID) and are loaded at boot. Each AI Run records `prompt_id@version`.
- **Bilingual strategy:** the system instructions are written **in English**, which has the best instruction-following and one source of truth. They contain an explicit *output language* directive, plus **Arabic style guidance** (Modern Standard Arabic, business register, Western Arabic numerals by default with a configurable alternative, term glossary). The model **writes natively in Arabic**; we do not translate English output, except through explicit, labelled translated versions for export (§3.6, DR-24). The glossary (`packages/i18n/glossary.json`) fixes framework names and key terms, e.g. "Root cause" → "السبب الجذري", "SIPOC" stays Latin.
- **Prompt-caching layout:** `[tools] → [system: stable instructions + taxonomy + active catalogue summaries] ← cache breakpoint → [messages: project context, retrieved chunks, user input]`. Nothing volatile (timestamps, IDs) goes in the cached prefix. Cache-read rates are monitored per route.

### 4.3 Validation & repair
```
LLM JSON ─▶ Zod parse ─▶ semantic validators (statement refs resolve, truth-status rules, enum/candidate membership, locale of text fields,
             │            length limits, no PII echo) ─▶ OK
             └─ fail ─▶ one repair call with validator messages ─▶ fail ─▶ typed error + UI fallback
```

### 4.4 Cost & latency controls
- Streaming everywhere user-facing; partial JSON rendered progressively (diagnosis card fills in live).
- Prompt caching of stable prefixes (above). Cache-hit metrics are on the cost dashboard.
- **Message Batches** for offline work: golden-set evals and bulk re-tagging of KB chunks.
- Per-org monthly AI budget with soft and hard limits (metering, 05 §3.9).
- Effort is the first quality/cost lever per route. Measure before changing.

### 4.5 DR-10: no fine-tuning
*Rationale:* the problem is knowledge plus structure plus judgement, which retrieval, schemas and prompting handle. Fine-tuning would lock us to a model snapshot, complicate Arabic quality control and residency, and our data volume is too small. *Revisit* only if eval plateaus on a specific narrow task (e.g. taxonomy classification) **and** we have 5k+ labelled examples.

---

## 5. Async, streaming, jobs (DR-17, DR-19)

| Concern | Mechanism |
|---|---|
| User-facing AI streaming | **SSE** `GET /v1/projects/{id}/events` (typed events: `workflow.state`, `diagnosis.partial`, `diagnosis.final`, `recommendation.final`, `step.prefill.partial`, `job.progress`, `error`). Reconnect with `Last-Event-ID` |
| Long jobs | pg-boss queues: `export`, `ingest`, `embed`, `eval`, `purge`. Idempotency keys; retries with backoff; dead-letter queue |
| Why SSE, not WebSockets | One-directional server→client streaming is all we need. SSE works through corporate proxies, has auto-reconnect and is easy to secure. WebSockets come in the Teams phase for co-editing (or via a CRDT service) |
| Why pg-boss, not Redis/BullMQ or Temporal | Transactional enqueue (the job and the DB write commit together), zero new infra, fine at our throughput (≪ 1k jobs/min). **Temporal** becomes attractive when we add long-running multi-document "deep analysis" sagas (Scale phase) |

---

## 6. Visualisation architecture (Engine 5) (DR-12, DR-13)

### 6.1 Principles
1. **One canonical model → many renderers.** A typed, renderer-agnostic `DiagramModel` JSON is the single source of truth for every visual.
2. **Content ≠ layout ≠ style.** The framework content (e.g. SWOT items) maps to a `DiagramModel` (semantic nodes, edges, regions). The layout engine computes geometry, and the theme applies style. Users edit **content** (and limited layout hints), never raw coordinates, unless the visual type allows manual positioning (stakeholder map).
3. **Original design.** All visual types are our own designs built on standard methodology conventions (e.g. a fishbone's spine-and-ribs shape, a BPMN-style notation subset). No third-party templates or diagram artwork is copied (06 §7).
4. **Bidirectional editing.** A canvas edit becomes a JSON Patch on the *framework content*, not the diagram. The diagram is then re-derived. The form and the canvas therefore never diverge.

### 6.2 Pipeline

```
FrameworkInstance.content ──(definition.visual.mapping: JSONata expression)──▶ DiagramModel (semantic)
DiagramModel + {locale, dir, theme, viewport/page size} ──▶ Layout engine ──▶ LaidOutDiagram (geometry)
LaidOutDiagram ──▶ Renderer:
                     • web:   React SVG components (interactive: select, inline edit, drag where allowed, zoom/pan)
                     • pdf:   same React SVG components, static mode, printed by Chromium
                     • pptx:  shape/table emitter (native OOXML shapes, connectors, tables)
                     • png:   SVG → resvg-js
                     • a11y:  table/outline renderer (screen readers; also the "table view" toggle)
```

### 6.3 DiagramModel (abridged TypeScript)

```ts
type DiagramModel = {
  schema: 'diagram/v1';
  type: VisualType;                         // see §6.6
  title: I18nText;
  locale: 'ar' | 'en';  dir: 'rtl' | 'ltr';
  regions?: Region[];                       // quadrants, swimlanes, canvas blocks, fishbone categories
  nodes: Node[];                            // { id, kind, label: I18nText, regionId?, data?, provenance, style? }
  edges?: Edge[];                           // { id, from, to, kind: 'sequence'|'message'|'association'|'reports_to'|'depends_on', label? }
  axes?: { x?: Axis; y?: Axis };            // matrices: { label, min, max, scale: 'ordinal'|'linear', ticks: I18nText[] }
  timeline?: { start: ISODate; end: ISODate; unit: 'day'|'week'|'month'; calendar: 'gregory'|'islamic-umalqura' };
  legend?: LegendItem[];
  layoutHints?: Record<string, unknown>;    // e.g. { fishboneHeadSide: 'auto' }, manual positions for stakeholder map
  meta: { frameworkId: string; definitionVersion: string; instanceVersion: number };
};
type I18nText = { ar?: string; en?: string };   // only the active locale is required
```

### 6.4 Layout engines (DR-13)

| Visual family | Engine | Notes |
|---|---|---|
| Graphs & flows (BPMN, SIPOC flow row, VSM process row, Org chart) | **ELK.js** (`layered` algorithm; `elk.direction` = RIGHT or LEFT by `dir`; org chart = DOWN) | Mature, handles ports, swimlanes (via hierarchical nodes) and orthogonal edge routing. Runs in browser and Node (worker) with the same result |
| Matrices (SWOT, Impact/Effort, Risk 5×5, Stakeholder power/interest) | Custom grid layout | Deterministic, collision-avoiding label packing inside cells; overflow → "+N more" chip + appendix table |
| Fishbone (Cause & Effect) | Custom parametric layout | Spine + angled category ribs; sub-causes as horizontal ticks; head on the right in LTR, mirrored in RTL |
| 5 Whys | Custom vertical chain / tree (branching whys allowed) | — |
| Canvas (Operating Model Canvas, Project Charter) | Custom block-grid layout from a definition-provided template grid | Charter = structured document blocks |
| Gantt **view of the Action Plan** [v0.2] | Custom time-scale layout (d3-scale for scales only) | Same content as the Action Plan; actions without dates go to a side tray; dependencies as orthogonal connectors; RTL mirrors the time axis; Hijri/Gregorian dual header option; workweek from org settings |
| Action Plan | Table layout (+ optional status chips) | Exported as a native table |
| Strategic Options [v0.2] | Table layout (options × criteria) + optional impact/effort scatter view | Weighted scores computed in code; native table in PPTX |

**Alternatives.** Mermaid/PlantUML: fast text-to-diagram, but limited styling control, poor RTL and no PPTX-native output. Rejected as the core, though a Mermaid *import* could come later. dagre: simpler but less capable than ELK (ports, compound nodes). bpmn-js: a full BPMN 2.0 modeller with a restrictive licence (its watermark is required) and much heavier than our needs. We implement a **BPMN-inspired subset**: tasks, events, gateways, swimlanes, sequence flows. BPMN 2.0 XML export comes in the Teams phase for interoperability.

### 6.4a Layout service: one geometry for screen and exports (DR-23) [v0.2]

**Problem.** Layout needs text widths. Arabic needs shaping (contextual letter forms, ligatures), and bidi runs change widths. The browser measures with real shaping. A Node worker without the same shaping and fonts would compute different geometry, so exported diagrams would overflow or misalign compared with the screen.

**Decision.** Run all layout in one place: a **layout service inside the worker's headless Chromium** (already required for PDF), loading the same font files (IBM Plex Sans Arabic, Inter) and the same `diagram-layout` package as the web app.
- The **web client** lays out locally for interactivity, using identical code and fonts.
- On **commit of a version**, the server computes the canonical `LaidOutDiagram` and stores it with the version (`layout_hash`).
- **Every export** (PPTX, PDF, PNG/SVG) uses the stored geometry, so screen and exports match.
- **CI:** visual regression compares client-side and server-side geometry for AR and EN fixtures. Tolerance is 1 px per node; above that the build fails.

**Alternatives.** HarfBuzz (WASM) + opentype.js in Node: lighter, but a second shaping implementation to keep in sync with the browser. It stays the fallback if Chromium-based layout proves too slow (> 300 ms p90 per diagram). Fixed-width approximations were rejected because they break Arabic.

### 6.5 RTL & bilingual rules (implementation-level)

| Visual | RTL behaviour |
|---|---|
| Process flows (BPMN, SIPOC, VSM) | Flow direction mirrors (right→left). Swimlane headers move to the right edge |
| Fishbone | Head (problem) on the left in RTL; ribs mirror |
| Gantt | Time flows right→left; task list column on the right |
| Org chart | Top-down; sibling order mirrors |
| 2×2 / 5×5 matrices | **Axes keep mathematical semantics.** "High impact" stays at the top, and the x-axis increases left→right in both directions. This matches common practice in Arabic business documents. Configurable per workspace (`matrixAxisMirroring`: off by default); flagged as an open UX test (01 §10) |
| Text | `direction` and `unicode-bidi: plaintext` per label; Latin acronyms (SIPOC, KPI) inside Arabic handled by bidi isolation (`<bdi>` / U+2068–2069 in SVG text and OOXML) |
| Numbers & dates | `Intl.NumberFormat` / `Intl.DateTimeFormat` with locale; workspace setting for numeral system (Western default) and calendar (Gregorian default, Umm al-Qura option) |
| Fonts | IBM Plex Sans Arabic + Inter (already in the repo); embedded subset in PDF; PPTX references font names, with fallback rules documented in the template |

### 6.6 Visual type registry (MVP 15 → 10 visual types)

| # | Framework | Visual type | Layout | PPTX emission |
|---|---|---|---|---|
| 1 | BPMN | `process_flow_swimlane` | ELK layered + lanes | Shapes + elbow connectors |
| 2 | SIPOC | `sipoc_table_flow` | 5-column grid + 4–7 step flow row | Table + chevron shapes |
| 3 | Value Stream Mapping | `value_stream` | ELK row + data boxes + timeline ladder | Shapes + table for metrics |
| 4 | Organizational Chart | `hierarchy_tree` | ELK DOWN / mrtree | Shapes + connectors (not SmartArt; SmartArt RTL is unreliable) |
| 5 | Operating Model Canvas | `canvas_blocks` | Template grid | Grouped rectangles with text |
| 6 | 5 Whys | `why_chain` | Vertical chain / tree | Shapes + arrows |
| 7 | Cause and Effect | `fishbone` | Parametric | Line shapes + text boxes |
| 8 | Risk Assessment Matrix | `heat_matrix` (5×5 / 3×3 / 4×4 configurable) | Grid with colour scale + plotted risk IDs | Table with cell fills + register table |
| 9 | Stakeholder Map | `matrix_2x2_scatter` (variant: power × interest, or influence × support) | Quadrants + positioned nodes (draggable) | Shapes on quadrant background |
| 10 | Project Charter | `document_blocks` | Block grid | Table / text blocks (1–2 slides) |
| 11 | Gantt Chart (**view of Action Plan**) | `gantt` | Time scale | Native table-based bars (editable) |
| 12 | SWOT | `matrix_2x2_list` | 2×2 lists | 2×2 table |
| 13 | PEST / STEEPLE | `factor_columns` (4–7 columns) | Column grid | Table |
| 14 | Impact Effort Matrix | `matrix_2x2_scatter` | Quadrants + positioned items | Shapes |
| 15 | Action Plan | `action_table` (+ `gantt` view) | Table | Native table (+ XLSX in Teams) |
| — | Strategic Options (capability) [v0.2] | `options_table` (+ `matrix_2x2_scatter` view) | Table | Native table |
| — | Problem-Solving Summary [v0.2] | `summary_blocks` | Block grid | Native text/table blocks (1–2 slides) |

Colour palettes for heat maps and categories follow the accessible-palette rules (colour-blind-safe; never colour-only: risk cells also carry score text).

### 6.7 Interaction model (web)
- **Selection → inspector panel.** Edit text; view and change **truth status** (explicit action); see origin, authorship and history; manage evidence links; accept / reject / challenge AI items; see Critic findings anchored to the item. Full spec: 09 §8.4.
- **Inline edit on double-click.** Applies a JSON Patch to the in-memory draft. Optimistic UI; a 409 on commit triggers a rebase.
- **Drag** only where position is semantic (stakeholder map, impact/effort): it updates content scores, e.g. the `interest` value. Elsewhere, drag reorders within a list.
- **Undo/redo** stack per editor session. **[v0.2, M4] Server versions are committed at checkpoints**: step-group completion, explicit save, AI run, Critic accept, navigation away, export, or after 5 minutes of continuous editing. The local draft is persisted to IndexedDB in between, for crash recovery.
- **Performance budget.** ≤ 300 nodes per diagram render under 16 ms per interaction frame. Large VSM/BPMN use canvas virtualisation for off-screen nodes.

---

## 7. Deployment & environments (DR-18)

| Aspect | MVP (to GA) | Enterprise |
|---|---|---|
| Runtime | Containers (OCI). AWS ECS Fargate for api, worker **and web** (all in one regional stack, [v0.2] M16) | Kubernetes Helm chart (EKS/AKS/GKE/on-prem OpenShift) |
| DB | Managed Postgres 16 (RDS/Aurora), PITR, Multi-AZ (pgvector extension available but unused in MVP) | Same, dedicated instance per tenant (single-tenant option) |
| Region | One primary region | Region-pinned **deployment profiles** (§7.1), incl. **KSA in-Kingdom** |
| Envs | dev → staging → prod. Preview envs per PR (web) | + customer UAT |
| CI/CD | GitHub Actions: typecheck, unit, i18n coverage, contrast/axe, golden-set eval (sampled on PR, full nightly), visual regression (Playwright screenshots of renderers in AR/EN), migrations check | Signed images, SBOM, change approval gates |
| Secrets | Cloud secrets manager; no secrets in env files in the repo | Customer-managed keys (KMS) |

### 7.1 Deployment profiles and the KSA in-Kingdom option (DR-25) [v0.2]

Everything that touches customer data is parameterised by a **deployment profile**. Code paths are identical across profiles; only configuration differs.

| Profile | Data plane (DB, storage, worker, logs, backups) | Model inference route | Status |
|---|---|---|---|
| `global` | Primary region | First-party model API | GA |
| `gcc` | A Gulf-region cloud region | Provider endpoint in a policy-compliant region | Enterprise |
| **`ksa-sovereign`** | **In-Kingdom** cloud region or customer data centre (Helm) | **In-Kingdom compliant route**: a provider endpoint hosted in KSA if available at contract time, or an approved self-hosted model behind the Model Gateway | Enterprise (designed now, delivered after verification) |

Design rules adopted now, so the KSA option needs no re-architecture later:
1. **No hard-wired external services in the data path.** Every external dependency sits behind an interface with a self-hostable alternative: model (Gateway), identity (Keycloak), object storage (MinIO), email (SMTP relay), payments (gateway adapter), error tracking (self-hosted option). [v0.2] Dropping embeddings from the MVP removes one more external processor.
2. **Gateway policy fails closed.** Each tenant has an `inference_policy {allowed_routes[], data_classification_max}`. If no compliant route exists for a request, the feature is disabled with a clear message. Data is never sent to a non-compliant route.
3. **Per-profile capability flags.** If a sovereign route lacks a capability (e.g. structured outputs or long context on a self-hosted model), the affected features degrade explicitly (e.g. manual mode) and the eval suite runs per profile before go-live.
4. **No cross-profile data flows.** Telemetry leaving a sovereign stack is aggregate-only and content-free.
5. **Verification gate.** Before selling `ksa-sovereign`: confirm the in-Kingdom inference route, pass the per-profile eval, and complete applicable regulatory controls (06 §4).

---

## 8. Repository layout (proposed)

```
apps/
  bps-web/           Next.js 14 (reuses ik-lna-simulator i18n, tokens, fonts, test scripts)
  bps-api/           Fastify modular monolith
    src/modules/{diagnosis,recommendation,knowledge,framework-builder,options,critic,visualization,deliverables,workspace}/
    src/platform/{auth,acl,model-gateway,prompts,validation,audit,metering,billing,flags}/
  bps-worker/        pg-boss consumers: export, layout, translate, critique, ingest, eval, purge (+ Chromium)
packages/
  critic-rules/      [v0.2] deterministic item-level rules (calculations, dates, required fields)
  schemas/           Zod schemas → JSON Schema (single source for API, LLM, UI forms)
  diagram-model/     DiagramModel types, mapping (JSONata), validation
  diagram-layout/    ELK + custom layouts (isomorphic)
  diagram-react/     SVG renderers (web + PDF)
  diagram-pptx/      OOXML emitter
  frameworks/        Framework Definitions (JSON) + KB authored content (MD) + fixtures
  taxonomy/          taxonomy.json (codes, labels AR/EN, descriptions, signals)
  prompts/           prompt files + meta
  i18n/              dictionaries, glossary, formatting helpers
  evals/             golden sets, graders, runners
```

The existing `ik-lna-simulator/` and `alwetaid-advisory-v2/` stay untouched. Shared i18n/token code is **copied into `packages/` first, then the simulator is migrated to consume it** (a separate, later PR) to avoid destabilising a shipped app.
