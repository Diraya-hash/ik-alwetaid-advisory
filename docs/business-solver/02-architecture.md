# 02: Technical Architecture (incl. Visualisation Architecture)

## 0. Decision records index

| DR | Decision | Section |
|---|---|---|
| DR-01 | Modular monolith (API) + worker service, not microservices | §1.2 |
| DR-02 | TypeScript end to end | §1.3 |
| DR-03 | Next.js 14 App Router web client, reusing the simulator's i18n/RTL foundation | §1.3 |
| DR-04 | Separate API service (Fastify + Zod + OpenAPI), not Next.js route handlers | §1.3 |
| DR-05 | Every AI output is schema-validated JSON with typed claims | §3.1 |
| DR-06 | Claude via the official Anthropic SDK behind a Model Gateway | §4 |
| DR-07 | Hybrid recommendation: rules and scoring generate candidates, the LLM re-ranks and explains | §3.2 / 04 §5 |
| DR-08 | Frameworks are versioned data (Framework Definitions), not code | §3.4 / 03 §4 |
| DR-09 | Hybrid retrieval (pgvector + Postgres FTS, RRF fusion) with an embedding-provider abstraction | §3.3 |
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
                    │ │  state       │  │ 3 Knowledge/RAG   4 Framework Builder   │ │
                    │ │  machine)    │  │ 5 Visualization (model+validate)        │ │
                    │ └──────────────┘  │ 7 Workspace (projects, versions, ACL)   │ │
                    │                   └─────────────────────────────────────────┘ │
                    │  Platform: Auth/ACL · Model Gateway · Prompt Registry ·        │
                    │            Validation · Audit · Metering · Feature flags       │
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
| Cache / rate limit | Postgres + in-memory LRU; **Redis added in Phase 2** if needed | Avoid infra we don't need yet | — |
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

**Alternatives.** An autonomous tool-using agent (e.g. a hosted agent runtime). Rejected for the core journey. We will reconsider it in Phase 3 for an optional "Deep analysis" mode that reads many uploaded documents.

### 2.1 Project state machine

```
DRAFT ──describe──▶ DIAGNOSING ──ok──▶ NEEDS_CONTEXT ◀──┐
                        │                  │ answer      │ (sufficiency < τ, rounds < max)
                        │                  └─────────────┘
                        └──sufficient──▶ DIAGNOSED ──▶ RECOMMENDING ──▶ RECOMMENDED
                                                                          │ select
                                                                          ▼
                    EXPORTED ◀── export ── VISUALISED ◀── validate ── APPLYING (per FrameworkInstance)
                        │                                                  ▲
                        └──── chain / add framework / edit diagnosis ──────┘
```

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
      ← final JSON → Zod validate → semantic validators (claims, evidence refs)
         ✗ fail → 1 repair attempt (validator errors fed back) → still fail → error state + fallback UI
    persist Artifact(diagnosis, v1) + AIRun
  Orchestrator: compute sufficiency → transition DIAGNOSED | NEEDS_CONTEXT
api ──SSE "workflow.state"──▶ web
```

---

## 3. The seven engines

Each engine section lists: **responsibility · interface · internals · data owned · failure modes.**

### 3.1 Engine 1: AI Problem Diagnosis Engine

**Responsibility.** Turn free text (plus evidence and clarification answers) into a validated `ProblemDiagnosis` (04 §3). That includes the taxonomy classification, typed claims, missing-information list and context sufficiency score.

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
3. **Semantic validation** (code): every `fact` claim must reference user text spans or evidence chunk IDs. Unreferenced "facts" are **downgraded to `assumption`** automatically and flagged. The taxonomy confidence must be calibrated (see 04 §2.4).
4. **Sufficiency scoring** (code, 04 §4): deterministic, explainable, testable.
5. **Question selection** (04 §5.3): code picks *which* information is missing by information gain. The LLM only phrases the question in the user's language and register.

**DR-05: structured JSON + typed claims.** *Rationale:* downstream engines, the UI badges, exports and evaluations all need machine-readable structure. Free text cannot be validated, diffed or rendered as a diagram. *Mechanism:* the API's structured-output mode (`output_config.format` with a JSON Schema generated from our Zod schemas) guarantees syntactically valid JSON. Zod plus semantic validators enforce meaning. *Alternatives:* function/tool calls for output (works, but structured output is the direct mechanism). "JSON mode via prompt only" was rejected as unreliable.

**Data owned:** `diagnoses` (as artifacts), `clarifying_questions`, `taxonomy_labels`.

**Failure modes:** schema-valid but semantically weak output → repair pass. Repeated failure → a "manual diagnosis" form pre-filled with whatever validated. Off-topic or unsafe → refusal path (04 §7).

### 3.2 Engine 2: Framework Recommendation Engine

**Responsibility.** Given a sufficient diagnosis, return 1–5 ranked frameworks plus an optional chain, each with a grounded rationale. Full logic is in **04 §5**. Summary:

```
Stage A  Eligibility filter (rules, code)   — active catalogue ∩ preconditions ∩ language support ∩ exclusions
Stage B  Affinity scoring (code)            — taxonomy×framework affinity matrix + signal features + user-intent boosts
Stage C  Semantic retrieval (RAG)           — similarity of diagnosis to framework "use-case" chunks (adds recall)
Stage D  LLM re-rank + explain (Claude)     — chooses ≤5 from top-K candidates ONLY; must cite diagnosis fields & KB chunks
Stage E  Post-validation (code)             — candidate-set membership, rationale pointers resolve, diversity rule, chain validity
```

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
| Learned ranker (LTR) | Correct long-term, but needs feedback data we don't have. **Planned for Phase 4** using the stored feedback (FR-RC-6) as training signal for Stage B weights |

### 3.3 Engine 3: Knowledge Retrieval Engine (RAG) (DR-09)

**Responsibility.** Store, chunk, embed and retrieve knowledge with **source attribution**. It serves: (a) framework knowledge (definitions, use cases, steps, pitfalls), (b) source documents (the Creately PDF once supplied, and future licensed sources), (c) **project evidence** (user uploads, tenant-scoped), (d) the taxonomy descriptions used for classification hints.

**Corpora and isolation.**
| Corpus | Scope | Provenance values |
|---|---|---|
| `global_kb` | All tenants, read-only | `source_document` (e.g. PDF, with page), `platform_authored` (our content team), `ai_drafted_reviewed` (AI-drafted, human-approved) |
| `org_kb` | One org (Phase 3: org-specific frameworks and playbooks) | `org_authored` |
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
3. Optional re-ranking with a cross-encoder (Phase 2, if eval shows gains).
4. **Return chunks with stable IDs** (`chk_…`) and full source refs. Prompts receive chunks wrapped as `<source id="chk_…" doc="…" page="…">…</source>`. Output schemas require claims to cite these IDs. The validator rejects IDs that weren't provided and runs a lexical-overlap check between each claim and its cited chunk, flagging low overlap for review.

**Why our own citation IDs rather than the API's native document citations?** The native Citations feature returns cited text spans, but it **cannot be combined with structured JSON output** (the API rejects that combination). We need both, so we embed chunk IDs inside the JSON and verify them ourselves. Native citations remain an option for the free-form "Explain this framework" answer, which is prose, not JSON.

**DR-09 alternatives.**
| Option | Verdict |
|---|---|
| Dedicated vector DB (Pinecone, Weaviate, Qdrant) | Rejected for MVP. The corpus is small (thousands to low millions of chunks). A second datastore complicates tenant isolation, backups and residency. Revisit above ~20M chunks |
| Vector-only retrieval | Rejected. Arabic morphology and exact framework names ("SIPOC", "BPMN") favour lexical matching. Hybrid is measurably more robust |
| Long-context stuffing (put all framework docs in the prompt) | **Used where it fits.** The *framework catalogue summaries* (~15–50 entries) go into the recommendation prompt directly as a cached prefix. RAG is for long-tail detail and user documents |

**Embedding model.** Behind an `EmbeddingProvider` interface. MVP default is a hosted **multilingual** embedding model chosen by a **bake-off on our own Arabic+English retrieval eval** (recall@8 on 200 labelled queries) before Phase 1 ends. Candidates: a hosted multilingual API model and the self-hostable `bge-m3`. For sovereign deployments, self-hosted `bge-m3` (no data leaves the region). Vectors store `embedding_model` and `dim` so models can be swapped and corpora re-embedded side by side.

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
→ attach provenance to every element {origin: ai_suggestion, run_id, evidence_refs}
→ user accept/edit/reject → JSON Patch applied → new version
→ run validation_rules (deterministic) + optional AI quality critique (async, non-blocking hints)
```

**Element-level provenance** (03 §4.6): each item (e.g. a SWOT strength) is `{id, text:{ar?,en?}, claim_type, origin, status: suggested|accepted|edited|rejected, evidence_refs[], created_by_run?, edited_by_user?}`. This is what makes "distinguish facts, assumptions and AI suggestions" concrete at the finest grain, and the badges survive into exports.

### 3.5 Engine 5: Visualization Engine. See §6.

### 3.6 Engine 6: Business Deliverables Generator

**Responsibility.** Compose a `DeliverableSpec` (which artifacts, language, template, options) into files: PPTX, PDF and PNG/SVG in the MVP, DOCX and XLSX in Phase 2. It runs in the **worker**.

**Pipeline.**
```
DeliverableSpec ─▶ Composer: resolve artifact versions (pinned), build a format-neutral
                   "DocumentOutline" (sections → blocks: heading, paragraph, bullet list,
                   table, diagram(DiagramModel), callout(assumptions), source list)
               ─▶ Narrative step (optional LLM): executive summary & slide titles
                   ("action titles": a full-sentence takeaway per slide), typed claims
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
- **Appendix**: an assumptions register, evidence and sources (with page refs for the PDF corpus), and a methodology note with source attribution. An AI-generated-content disclosure is on by default; admins can toggle it.

### 3.7 Engine 7: Project Workspace

**Responsibility.** Projects, conversations, artifacts and their versions, evidence, deliverables, sharing, comments, activity log and search. It also owns authorisation checks (with the platform ACL module) and history/restore.

**Artifact model (central abstraction).** Everything the user can edit is an **Artifact** with typed `kind` (`challenge`, `diagnosis`, `recommendation_set`, `framework_instance`, `narrative`, `deliverable_spec`) and an append-only list of **ArtifactVersions** (DR-16, 05 §3.5). Every version records `author_type` (`user|ai|system`), `ai_run_id`, `parent_version`, a `patch` (RFC 6902) and the full `content` snapshot. Storing snapshots costs some extra space and makes reads O(1).

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
- *Alternatives:* multi-provider "LLM router" from day 1. Rejected for MVP because each provider multiplies the eval matrix. The gateway interface keeps a second provider (or customer BYO-model, Phase 4) possible.

### 4.2 Prompt Registry
- Prompts are **files in the repo** (`packages/prompts/<id>/<version>.md` + `meta.json` with model route, schema ID, eval set ID) and are loaded at boot. Each AI Run records `prompt_id@version`.
- **Bilingual strategy:** the system instructions are written **in English**, which has the best instruction-following and one source of truth. They contain an explicit *output language* directive, plus **Arabic style guidance** (Modern Standard Arabic, business register, Western Arabic numerals by default with a configurable alternative, term glossary). The model **writes natively in Arabic**; we do not translate English output. The glossary (`packages/i18n/glossary.json`) fixes framework names and key terms, e.g. "Root cause" → "السبب الجذري", "SIPOC" stays Latin.
- **Prompt-caching layout:** `[tools] → [system: stable instructions + taxonomy + active catalogue summaries] ← cache breakpoint → [messages: project context, retrieved chunks, user input]`. Nothing volatile (timestamps, IDs) goes in the cached prefix. Cache-read rates are monitored per route.

### 4.3 Validation & repair
```
LLM JSON ─▶ Zod parse ─▶ semantic validators (claim refs resolve, enum/candidate membership, locale of text fields,
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
| Why SSE, not WebSockets | One-directional server→client streaming is all we need. SSE works through corporate proxies, has auto-reconnect and is easy to secure. WebSockets come in Phase 3 for co-editing (or via a CRDT service) |
| Why pg-boss, not Redis/BullMQ or Temporal | Transactional enqueue (the job and the DB write commit together), zero new infra, fine at our throughput (≪ 1k jobs/min). **Temporal** becomes attractive when we add long-running multi-document "deep analysis" sagas (Phase 3+) |

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
| Gantt | Custom time-scale layout (d3-scale for scales only) | Dependencies as orthogonal connectors; RTL mirrors the time axis; Hijri/Gregorian dual header option |
| Action Plan | Table layout (+ optional status chips) | Exported as a native table |

**Alternatives.** Mermaid/PlantUML: fast text-to-diagram, but limited styling control, poor RTL and no PPTX-native output. Rejected as the core, though a Mermaid *import* could come later. dagre: simpler but less capable than ELK (ports, compound nodes). bpmn-js: a full BPMN 2.0 modeller with a restrictive licence (its watermark is required) and much heavier than our needs. We implement a **BPMN-inspired subset**: tasks, events, gateways, swimlanes, sequence flows. BPMN 2.0 XML export comes in Phase 2 for interoperability.

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
| 9 | Stakeholder Map | `matrix_2x2_scatter` (power × interest) | Quadrants + positioned nodes (draggable) | Shapes on quadrant background |
| 10 | Project Charter | `document_blocks` | Block grid | Table / text blocks (1–2 slides) |
| 11 | Gantt Chart | `gantt` | Time scale | Native table-based bars (editable) |
| 12 | SWOT | `matrix_2x2_list` | 2×2 lists | 2×2 table |
| 13 | PEST / STEEPLE | `factor_columns` (4–7 columns) | Column grid | Table |
| 14 | Impact Effort Matrix | `matrix_2x2_scatter` | Quadrants + positioned items | Shapes |
| 15 | Action Plan | `action_table` | Table | Native table (+ XLSX in Phase 2) |

Colour palettes for heat maps and categories follow the accessible-palette rules (colour-blind-safe; never colour-only: risk cells also carry score text).

### 6.7 Interaction model (web)
- **Selection → inspector panel.** Edit text (per locale), claim type, evidence links and status (accept/reject).
- **Inline edit on double-click.** Commits as a JSON Patch on content. Optimistic UI with rollback on a 409.
- **Drag** only where position is semantic (stakeholder map, impact/effort): it updates content scores, e.g. the `interest` value. Elsewhere, drag reorders within a list.
- **Undo/redo** stack per editor session; server versions are created on debounced commit (2 s idle) or on explicit save.
- **Performance budget.** ≤ 300 nodes per diagram render under 16 ms per interaction frame. Large VSM/BPMN use canvas virtualisation for off-screen nodes.

---

## 7. Deployment & environments (DR-18)

| Aspect | MVP | Enterprise (Phase 3) |
|---|---|---|
| Runtime | Containers (OCI). AWS ECS Fargate (api, worker) + Vercel or the same ECS for web | Kubernetes Helm chart (EKS/AKS/GKE/on-prem OpenShift) |
| DB | Managed Postgres 16 (RDS/Aurora) with pgvector, PITR, Multi-AZ | Same, dedicated instance per tenant (single-tenant option) |
| Region | One primary region | Region-pinned stacks (e.g. Gulf region, EU). Model calls routed to a provider endpoint in a region that satisfies the tenant's residency policy. **Verify regional model availability at contract time**; if unavailable, the residency tier is limited to features that don't need in-region inference, or uses an approved self-hosted model via the gateway (Phase 4) |
| Envs | dev → staging → prod. Preview envs per PR (web) | + customer UAT |
| CI/CD | GitHub Actions: typecheck, unit, i18n coverage, contrast/axe, golden-set eval (sampled on PR, full nightly), visual regression (Playwright screenshots of renderers in AR/EN), migrations check | Signed images, SBOM, change approval gates |
| Secrets | Cloud secrets manager; no secrets in env files in the repo | Customer-managed keys (KMS) |

---

## 8. Repository layout (proposed)

```
apps/
  studio-web/        Next.js 14 (reuses ik-lna-simulator i18n, tokens, fonts, test scripts)
  studio-api/        Fastify modular monolith
    src/modules/{diagnosis,recommendation,knowledge,framework-builder,visualization,workspace}/
    src/platform/{auth,acl,model-gateway,prompts,validation,audit,metering,flags}/
  studio-worker/     pg-boss consumers: export, ingest, embed, eval, purge (+ Chromium)
packages/
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
