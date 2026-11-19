# 03: Knowledge Base Data Schema & Framework Metadata Schema

> **v0.3** (2026-11-19, Phase 0): §3 information model resolved into three independent statuses (Truth / Review / Decision). **v0.2**: applies approved decisions **D1** (PDF = internal reference only) and **D2** (five-dimension information model). It also resolves review findings H1 (catalogue identity), H2 (slot registry), H4 (port registry), M3 (deterministic rules), M8 (originator attribution), M9 (stakeholder axes) and M10 (source vs. platform guidance). Changes are marked **[v0.2]**.

All schemas are **JSON Schema (2020-12)**. In code they are authored as Zod in `packages/schemas` and exported to JSON Schema, so one source feeds the API, LLM structured outputs and UI forms. Abridged where noted. DDL equivalents are in 05.

## 1. Knowledge model overview

```
FrameworkRecord 1─* FrameworkDefinition (versioned behaviour)
FrameworkRecord 1─* KnowledgeEntry (platform-authored content, AR/EN, versioned)
FrameworkRecord *─* TaxonomyNode   (AffinityEdge, weighted)
FrameworkRecord 1─* ReferenceMapping ──▶ ReferenceSource (internal only, never shown to users)
KnowledgeEntry  1─* Chunk          (citable unit with stable ID; embeddings optional, see 02 §3.3)
EvidenceFile    1─* Chunk          (project evidence uploaded by users)
Registries: Diagnosis Slot Registry · Port Type Registry · Glossary
```

**[v0.2] Product knowledge is 100 % platform-authored.** Every user-facing explanation, instruction, example, visual and Arabic text is written independently by our content team and SME-reviewed (provenance `platform_authored` or `ai_drafted_reviewed`). **The product has no runtime or legal dependency on any third-party reference document.** If every reference source were removed tomorrow, the product would behave identically.

## 2. Reference sources (internal only) [v0.2]

### 2.1 Policy (D1)

| Rule | Implementation |
|---|---|
| Internal editorial reference only | `ReferenceSource` records live in the `kb_internal` schema. They have **no API route, no retrieval path and no UI surface**. Only the content team's tooling can read them |
| No reproduction | The source file is stored only in a restricted internal bucket (content-team access, audit-logged). Its text is **not** chunked, embedded or placed in prompts. Its diagrams, templates and page images are never extracted or stored |
| No derivative commercial content | Authors write from general professional knowledge and multiple references. Content review checklist item: *"No sentence, list or example paraphrases a single reference closely; structure and wording are original."* AI drafting prompts never receive reference-source text |
| No redistribution | Nothing from a reference source appears in exports, logs shipped to customers, eval sets or marketing |
| Provenance documented internally | `ReferenceMapping` records which entry the content team consulted for coverage, for audit and future licensing discussions. They are never displayed |
| Future licensed sources | A source whose licence grants display/quotation rights may be promoted to `citable_source` by an explicit, legal-approved status change. Only then can it enter the citable corpus |

### 2.2 ReferenceSource and ReferenceMapping

```json
{
  "$id": "kb/reference-source.v1",
  "type": "object",
  "required": ["id", "title", "rights_holder", "rights_status", "use_status", "storage_key", "recorded_by", "recorded_at"],
  "properties": {
    "id": { "type": "string", "pattern": "^ref_[a-z0-9]{12}$" },
    "title": { "type": "string" },
    "rights_holder": { "type": "string" },
    "rights_status": { "enum": ["all_rights_reserved", "licensed", "open_licence", "public_domain"] },
    "licence_terms": { "type": "string", "description": "Summary of any granted rights; empty when none" },
    "use_status": { "enum": ["internal_reference_only", "citable_source", "retired"], "default": "internal_reference_only" },
    "page_count": { "type": "integer" },
    "page_offset": { "type": "integer", "description": "pdf_page = printed_page + page_offset" },
    "storage_key": { "type": "string", "description": "Restricted internal bucket" },
    "sha256": { "type": "string" },
    "recorded_by": { "type": "string" }, "recorded_at": { "type": "string", "format": "date-time" },
    "legal_review": { "type": "object", "properties": { "status": { "enum": ["not_requested", "pending", "cleared", "refused"] }, "ref": { "type": "string" } } }
  }
}
```

```json
{
  "$id": "kb/reference-mapping.v1",
  "type": "object",
  "required": ["framework_id", "reference_source_id", "entry_title", "printed_page", "pdf_page"],
  "properties": {
    "framework_id": { "type": "string" },
    "variant": { "type": ["string", "null"], "description": "e.g. 'STEEPLE' for fw_pest_steeple" },
    "reference_source_id": { "type": "string" },
    "entry_no": { "type": ["integer", "null"] },
    "entry_title": { "type": "string" },
    "printed_page": { "type": "integer" }, "pdf_page": { "type": "integer" },
    "consulted_for": { "type": "array", "items": { "enum": ["coverage_check", "terminology", "scope_of_use_cases"] } },
    "notes": { "type": "string", "description": "Internal; never shown" }
  }
}
```

**Current reference source:** *50 Business Diagrams for Strategic Planning* (Creately). `rights_status = all_rights_reserved`, `use_status = internal_reference_only`, `page_offset = 5`, 56 pages. It is **not ingested**: no chunks, no prompts.

## 3. The information model: three statuses, three provenance dimensions [v0.3, Phase 0 decision]

> **v0.3 (Phase 0 scope lock).** Truth Status, Review Status and Decision Status are now three **independent** fields with separate controls, events and UI markers. v0.2 coupled review to AI content and decision to proposals; that left "accepting an AI option" ambiguous: was it kept, chosen, or believed? Each question now has its own field. Origin, authorship, evidence and history are unchanged from v0.2.

Every piece of information is a **Statement**: a symptom, cause, SWOT item, "why", risk, option, recommendation or action. It carries **three statuses**, each answering a different question, plus **four provenance dimensions**.

### 3.1 The three statuses

| Status | Question it answers | Values | Applies to | Changed by |
|---|---|---|---|---|
| **Truth Status** | *Do we know this is true?* | `verified` · `unverified` · `assumption` | Assertions (`kind = assertion`); the premises of proposals are separate assertions | **Only** an explicit user verification action ("Mark verified: with evidence / I confirm"), "Mark as assumption", "Mark as unverified" |
| **Review Status** | *Do we keep this content in our analysis?* | `pending_review` · `accepted` · `challenged` · `rejected` | Content the user did not write: `origin ∈ {ai_generated, external_source}`. User-written content is `not_applicable` | User review actions: Accept, Challenge (keep, disputed, with reason), Reject (removed from the analysis, kept in history) |
| **Decision Status** | *Have we decided to do this?* | `proposed` · `accepted` · `rejected` · `deferred` | Proposals only (`kind = proposal`: options, recommendations, countermeasures, actions) | User decision actions: Choose, Reject, Defer |

**Independence rules (enforced in code; invariants I1–I10, §3.3):**
- **Accepting an AI suggestion never establishes factual accuracy.** `review_status = accepted` leaves `truth_status` unchanged. An accepted AI assumption is still an assumption.
- **Verifying never changes review or decision.** Marking a premise verified doesn't choose the option that depends on it.
- **Choosing an option doesn't verify its premises.** A chosen option built on assumptions keeps those assumptions visible in the Assumptions Register, and the Critic flags them before export.
- **The only coupling is one explicit, logged convenience.** Choosing (`decision = accepted`) a proposal whose review is still `pending_review` also records `review = accepted`. These are two events in the history, and the user sees both. No other status change triggers another.
- **No edit changes any status.** Editing the text of an AI-generated assumption records `text_edited` with the user as last modifier. Its truth status (`assumption`), origin (`ai_generated`) and review/decision statuses stay exactly as they were.

**Examples (the combinations the UI must support):**

| Statement | Truth | Review | Decision | Meaning |
|---|---|---|---|---|
| AI: "Hand-offs between four units add waiting time" | assumption | accepted | n/a | Kept in the analysis as a hypothesis to check |
| User: "Approvals take 45 days on average" | unverified | n/a | n/a | User-reported; can be verified (attested or with evidence) |
| User: same, after attaching the KPI report | verified (evidence) | n/a | n/a | Fact with a source |
| AI option: "Automate document pre-check" | n/a (its premises are separate assertions) | accepted | proposed | Kept for comparison, not yet chosen |
| Same option after the user chooses it | n/a | accepted | accepted | Chosen; premises still assumptions until verified |
| AI cause the user disputes | assumption | challenged ("we measured this; it's not the system") | n/a | Visible, struck through, with the user's reason |
| AI action the user removes | n/a | rejected | rejected | Out of the analysis; kept in history |

### 3.2 Provenance dimensions (unchanged from v0.2)

| Dimension | Field | Values |
|---|---|---|
| Origin | `origin` | `user_input` · `external_source` · `ai_generated`. Set at creation, **immutable** |
| Authorship | `authorship` | `{created_by_type, created_by, last_modified_by_type, last_modified_by, ai_run_id}`; types `user` · `ai` · `system` |
| Evidence reference | `evidence_refs[]` | Optional: user message span, evidence file chunk, upstream statement, platform KB chunk |
| Modification history | `history[]` + `statement_events` (05 §3.3a) | Append-only `{at, actor_type, actor_id, action, field, from, to, reason}` |

### 3.3 Statement schema (v3) and invariants

```json
{
  "$id": "core/statement.v3",
  "type": "object",
  "required": ["id", "kind", "text", "language", "origin", "authorship", "review_status", "evidence_refs"],
  "properties": {
    "id": { "type": "string", "pattern": "^st_[a-z0-9]{12}$" },
    "kind": { "enum": ["assertion", "proposal"] },
    "text": { "type": "string" }, "language": { "enum": ["ar", "en"] },
    "truth_status": { "enum": ["verified", "unverified", "assumption"], "description": "Required iff kind=assertion" },
    "verification": { "type": "object", "description": "Required iff truth_status=verified",
      "properties": { "method": { "enum": ["evidence_attached", "user_attested"] }, "verified_by": { "type": "string" }, "verified_at": { "type": "string", "format": "date-time" }, "note": { "type": "string" } } },
    "review_status": { "enum": ["not_applicable", "pending_review", "accepted", "challenged", "rejected"], "description": "not_applicable iff origin=user_input" },
    "review": { "type": "object", "properties": { "by": { "type": "string" }, "at": { "type": "string" }, "reason": { "type": "string" } } },
    "decision_status": { "enum": ["proposed", "accepted", "rejected", "deferred"], "description": "Required iff kind=proposal" },
    "decision": { "type": "object", "properties": { "by": { "type": "string" }, "at": { "type": "string" }, "reason": { "type": "string" } } },
    "origin": { "enum": ["user_input", "external_source", "ai_generated"] },
    "authorship": { "$ref": "core/authorship.v1" },
    "evidence_refs": { "type": "array", "items": { "$ref": "core/evidence-ref.v2" } },
    "confidence": { "enum": ["high", "medium", "low"] },
    "verification_hint": { "type": "string" },
    "depends_on": { "type": "array", "items": { "type": "string" }, "description": "Premise assertions of a proposal" },
    "history": { "type": "array", "maxItems": 20, "items": { "$ref": "core/statement-change.v2" } }
  }
}
```

`core/statement-change.v2` actions: `created`, `text_edited`, `truth_status_changed`, `review_status_changed`, `decision_status_changed`, `evidence_added`, `evidence_removed`, `translated`, `restored`. Each carries `{from, to, reason?, critic_finding_id?}`.

| ID | Invariant | Test |
|---|---|---|
| I1 | No text edit, translation, restore or critic patch changes `truth_status`, `review_status`, `decision_status` or `origin` | Property test over every mutation path |
| I2 | `truth_status = verified` only via a user verification action with a `verification` record. AI routes cannot emit `verified` (schema enum excludes it) | Schema test + DB guard (05 §3.3a) |
| I3 | AI assertions claiming user support need a resolving `user_message_span`, else they are downgraded to `assumption` (logged) | Validator test; Phase 0 metric "typing violations" |
| I4 | User-typed assertions start `unverified`, `review_status = not_applicable` | Unit |
| I5 | `review_status` transitions are user-only; `accepted` never alters `truth_status` | Property test |
| I6 | `decision_status` transitions are user-only; `accepted` never alters `truth_status` of premises | Property test |
| I7 | The only cross-status coupling: deciding on a `pending_review` proposal also records `review = accepted` (two events) | Unit |
| I8 | Proposals whose premises are `assumption`/`unverified` appear in the Assumptions Register and are checked by the project-level Critic before export | Integration |
| I9 | Restoring a version appends history; it never rewrites it | Unit |
| I10 | Translation creates a new language rendering and copies all statuses unchanged (`translated` event) | Unit |

### 3.4 Mapping to the requirement wording and UI

| Requirement wording | Model | UI marker (09 §8.4) |
|---|---|---|
| Fact | `truth_status = verified` (method: evidence / attested) | ◆ Verified |
| Unverified information | `truth_status = unverified` | ◇ Unverified |
| Assumption | `truth_status = assumption` | △ Assumption |
| AI suggestion (awaiting review) | `origin = ai_generated ∧ review_status = pending_review` | ✦ filled |
| AI content kept by the user | `origin = ai_generated ∧ review_status = accepted` | ✦ outline (truth marker unchanged) |
| Disputed | `review_status = challenged` | struck-through + reason |
| Chosen option / action | `decision_status = accepted` | ✓ Chosen |

## 4. Platform knowledge, chunks and citations

### 4.1 KnowledgeEntry

```json
{
  "$id": "kb/knowledge-entry.v2",
  "type": "object",
  "required": ["id", "framework_id", "section_type", "version", "body", "provenance", "status"],
  "properties": {
    "id": { "type": "string" }, "framework_id": { "type": "string" },
    "section_type": { "enum": ["definition", "purpose", "use_case", "when_not_to_use", "inputs", "steps", "example", "pitfall", "facilitation_tip", "interpretation"] },
    "version": { "type": "integer" },
    "body": { "type": "object", "required": ["en", "ar"], "properties": { "en": { "type": "string" }, "ar": { "type": "string" } }, "description": "Markdown. Arabic written natively, not translated" },
    "provenance": { "enum": ["platform_authored", "ai_drafted_reviewed", "org_authored"] },
    "authors": { "type": "array", "items": { "type": "string" } },
    "review": { "type": "object", "properties": { "sme": { "type": "string" }, "arabic_editor": { "type": "string" }, "originality_check": { "type": "boolean" }, "approved_at": { "type": "string" } } },
    "status": { "enum": ["draft", "in_review", "published", "retired"] }
  }
}
```

### 4.2 Chunk (citable unit)

Chunks exist for (a) published KnowledgeEntries (`corpus = platform_kb`), (b) user evidence (`corpus = project_evidence`) and later (c) org KB (`org_kb`, Teams/Enterprise). Reference sources never produce chunks.

```json
{
  "$id": "kb/chunk.v2",
  "type": "object",
  "required": ["id", "corpus", "origin", "text", "language", "locator"],
  "properties": {
    "id": { "type": "string", "pattern": "^chk_[a-z0-9]{16}$" },
    "corpus": { "enum": ["platform_kb", "org_kb", "project_evidence"] },
    "org_id": { "type": ["string", "null"] }, "project_id": { "type": ["string", "null"] },
    "origin": { "oneOf": [
      { "type": "object", "required": ["kind", "knowledge_entry_id", "entry_version"], "properties": { "kind": { "const": "knowledge_entry" }, "knowledge_entry_id": { "type": "string" }, "entry_version": { "type": "integer" } } },
      { "type": "object", "required": ["kind", "evidence_id"], "properties": { "kind": { "const": "user_upload" }, "evidence_id": { "type": "string" } } }
    ] },
    "text": { "type": "string" }, "text_normalised": { "type": "string" },
    "language": { "enum": ["en", "ar"] },
    "locator": { "type": "object", "properties": { "page": { "type": "integer" }, "section_path": { "type": "array", "items": { "type": "string" } }, "sheet": { "type": "string" }, "cell_range": { "type": "string" }, "char_start": { "type": "integer" }, "char_end": { "type": "integer" } } },
    "section_type": { "type": "string" }, "framework_ids": { "type": "array", "items": { "type": "string" } },
    "token_count": { "type": "integer" }, "content_hash": { "type": "string" },
    "embedding": { "description": "[v0.2] OPTIONAL, absent in MVP (02 §3.3). Added by migration if Phase-0 eval shows retrieval is needed" }
  }
}
```

Chunk IDs work **without** vectors. The MVP places platform-KB chunks for the relevant frameworks in the prompt as `<kb id="chk_…">`, and evidence chunks as `<evidence id="chk_…" file="…" page="…">`. Output schemas cite these IDs, and the validator checks them.

## 5. Registries [v0.2]

### 5.1 Diagnosis Slot Registry (`packages/taxonomy/slots.json`)

Preconditions, the sufficiency gate, question selection and the Critic reference **slot IDs only**. CI fails if a slot's `pointer` doesn't exist in `ai/problem-diagnosis.v2` or if any definition references an unknown slot.

| Slot ID | Pointer in diagnosis (04 §3) | Type | Core weight |
|---|---|---|---|
| `symptom` | `/problem/observable_symptom` | statement | 0.20 |
| `stage` | `/classification/stage` | enum + confidence | 0.15 |
| `domain` | `/classification/domains/0` | enum + confidence | 0.15 |
| `scope` | `/classification/scope` | enum | 0.10 |
| `goal` | `/goals` (≥1) or `/problem/desired_state` | statement[] | 0.10 |
| `impact` | `/problem/impact` | statement | 0.10 |
| `stakeholders` | `/stakeholders` | list | 0.10 |
| `constraints` | `/constraints` or `/signals/deadline_known` | statement[] / bool | 0.10 |
| `recurrence` | `/signals/recurrence` | enum | — |
| `causal_complexity` | `/signals/causal_complexity_estimate` | 1–5 | — |
| `process_named` | `/signals/process_named` | bool | — |
| `process_boundaries` | `/signals/process_boundaries_known` | bool | — |
| `steps_known` | `/signals/process_steps_known` | bool | — |
| `measurable_symptom` | `/signals/measurable_symptom` | bool | — |
| `data_available` | `/signals/data_available` | enum | — |
| `options_listed` | `/options_mentioned` (count) | int | — |
| `deadline_known` | `/signals/deadline_known` | bool | — |
| `new_initiative` | `/signals/new_initiative` | bool | — |
| `external_focus` | `/signals/external_focus` | bool | — |
| `structure_focus` | `/signals/structure_focus` | enum `reporting_lines` · `delivery_model` · `none` | — |
| `items_are_threats` | `/signals/items_are_threats` | bool | — |

Each slot entry also holds: `label {ar,en}`, `question_template {ar,en}`, `why_it_matters {ar,en}`, `answer_widget` (chips / short text / number / yes-no).

### 5.2 Port Type Registry (`packages/frameworks/ports.json`)

| Port type | Item schema | Typical producers → consumers |
|---|---|---|
| `problem_statement` | statement | Diagnosis → every framework |
| `cause_list` | statement[] (assertions) | Cause & Effect, 5 Whys → Strategic Options, Action Plan (countermeasures) |
| `factor_list` | statement[] tagged by factor | PEST/STEEPLE → SWOT (opportunities/threats) |
| `swot_set` | 4 × statement[] | SWOT → Strategic Options |
| `option_list` | proposal[] | Strategic Options → Impact/Effort |
| `prioritised_option_list` | proposal[] + impact/effort scores | Impact/Effort, Strategic Options → Action Plan |
| `risk_list` | assertion[] + L/I | Risk Matrix → Action Plan (mitigations), Project Charter |
| `stakeholder_list` | assertion[] + attributes | Stakeholder Map → Project Charter, Action Plan (owners) |
| `process_step_list` | ordered steps | SIPOC → BPMN, VSM |
| `action_list` | proposal[] (owner, dates, status) | Action Plan → Gantt view, Problem-Solving Summary |

**Hand-off semantics: copy-with-link.** The downstream instance copies the items, keeping their IDs as `upstream_statement` evidence refs, and records the upstream version. If the upstream changes later, the downstream shows a *"source changed"* indicator and the Project-level Critic raises a finding. Nothing is synced silently.

### 5.3 Glossary
`packages/i18n/glossary.json`: `{id, en, ar, notes, do_not_translate}`. Framework names: Latin acronyms are kept (SIPOC, BPMN, SWOT, PEST, STEEPLE), with an Arabic expansion on first use.

## 6. Framework metadata schema

### 6.1 FrameworkRecord (identity & catalogue metadata)

```json
{
  "$id": "fw/framework.v2",
  "type": "object",
  "required": ["id", "slug", "names", "status", "family", "summary", "taxonomy_affinity", "stage_fit", "provenance", "origin_attribution"],
  "properties": {
    "id": { "type": "string", "pattern": "^fw_[a-z0-9_]+$" },
    "slug": { "type": "string" },
    "names": { "type": "object", "required": ["en", "ar"], "properties": { "en": { "type": "string" }, "ar": { "type": "string" }, "aliases": { "type": "array", "items": { "type": "string" } } } },
    "status": { "enum": ["active", "beta", "pending_source_review", "inactive", "deprecated"] },
    "family": { "enum": ["process", "root_cause", "strategy_environment", "prioritisation", "risk", "stakeholder_org", "project_planning", "operating_model"] },
    "variants": { "type": "array", "items": { "type": "object", "properties": { "id": { "type": "string" }, "names": { "$ref": "#/$defs/i18n" }, "params": { "type": "object" } } },
                  "description": "e.g. PEST | PESTLE | STEEPLE; Risk 3x3|4x4|5x5; Stakeholder power_interest|influence_support" },
    "views": { "type": "array", "items": { "type": "string" }, "description": "[v0.2] Additional visual views over the same content, e.g. Action Plan → ['action_table','gantt']" },
    "summary": { "$ref": "#/$defs/i18n" },
    "purpose_tags": { "type": "array", "items": { "type": "string" } },
    "taxonomy_affinity": { "type": "array", "items": { "type": "object", "properties": { "code": { "type": "string" }, "weight": { "type": "number" } } } },
    "stage_fit": { "type": "object", "additionalProperties": { "type": "number" }, "description": "Stage code → 0..1 (04 §5.2)" },
    "preconditions": { "type": "array", "items": { "type": "object", "required": ["slot", "requirement", "severity"],
      "properties": { "slot": { "type": "string", "description": "Slot Registry ID" }, "requirement": { "enum": ["present", "true", "false", "min", "value_in"] }, "param": {}, "severity": { "enum": ["blocking", "important", "nice_to_have"] } } } },
    "discriminators": { "type": "array", "description": "[v0.2] Rules separating this framework from confusable ones (04 §5.3)",
      "items": { "type": "object", "properties": { "vs": { "type": "string" }, "slot": { "type": "string" }, "prefer_when": { "type": "object", "description": "JSONLogic over slots" }, "explanation": { "$ref": "#/$defs/i18n" } } } },
    "contraindications": { "type": "array", "items": { "type": "object", "properties": { "rule": { "type": "object" }, "message": { "$ref": "#/$defs/i18n" } } } },
    "complements": { "type": "array", "items": { "type": "object", "properties": { "framework_id": { "type": "string" }, "relation": { "enum": ["precedes", "follows", "alternative", "deepens"] } } } },
    "effort": { "type": "object", "properties": { "minutes_typical": { "type": "integer" }, "group_recommended": { "type": "boolean" } } },
    "difficulty": { "enum": ["basic", "intermediate", "advanced"] },
    "visual_type": { "type": "string" },
    "active_definition_version": { "type": "string" },
    "provenance": { "enum": ["platform_authored", "ai_drafted_reviewed"] },
    "origin_attribution": { "type": "object", "description": "[v0.2] Methodology originators (public knowledge), shown in the Explain panel",
      "properties": { "originators": { "type": "array", "items": { "type": "string" } }, "era": { "type": "string" }, "notes": { "$ref": "#/$defs/i18n" }, "verified_by_sme": { "type": "boolean" } } },
    "review": { "type": "object" }
  },
  "$defs": { "i18n": { "type": "object", "properties": { "en": { "type": "string" }, "ar": { "type": "string" } } } }
}
```

**[v0.2] Removed:** `catalogue_no` (identity must not depend on a third-party document's numbering) and `source_refs` (replaced by internal `ReferenceMapping`, §2.2).

### 6.2 FrameworkDefinition (behaviour; semver)

Unchanged in structure from v0.1, except as listed here:
- `content_schema` items `$ref` **`core/statement.v2`**.
- `ports.inputs[].accepts` and `ports.outputs[].type` must be **Port Type Registry** IDs.
- `steps[]` gain `draft_group` (**[v0.2]**, for draft-first mode). Steps in the same group are generated together in one AI call when the user starts in Consultant mode (02 §3.4).
- **Validation rules are deterministic only [v0.2, M3].** JSONLogic with the allowed operators `var, ==, !=, <, <=, >, >=, and, or, !, count, sum, min, max, unique_count, date_before, is_empty, has_value, matches_regex`. Any semantic judgement (vagueness, duplication by meaning, blame language, logical gaps) belongs to the **Critic** (02 §3.4b), declared per step as `critic: { framework_rubric_id }`.
- `visual` may declare multiple `views` (e.g. Action Plan: `action_table` and `gantt`).

### 6.3 Worked example: 5 Whys (abridged; platform-authored)

```json
{
  "framework": {
    "id": "fw_five_whys", "slug": "five-whys",
    "names": { "en": "5 Whys", "ar": "تحليل «لماذا» الخماسي", "aliases": ["Five Whys", "5Y"] },
    "status": "active", "family": "root_cause",
    "stage_fit": { "FIND_ROOT_CAUSE": 1.0, "MAP_CURRENT_STATE": 0.1 },
    "taxonomy_affinity": [ { "code": "OPS.QUALITY", "weight": 0.9 }, { "code": "OPS.PERFORMANCE", "weight": 0.7 }, { "code": "CX.SERVICE_LEVEL", "weight": 0.7 } ],
    "preconditions": [
      { "slot": "symptom", "requirement": "present", "severity": "blocking" },
      { "slot": "recurrence", "requirement": "value_in", "param": ["recurring", "chronic"], "severity": "important" }
    ],
    "discriminators": [
      { "vs": "fw_cause_effect", "slot": "causal_complexity",
        "prefer_when": { "<=": [{ "var": "causal_complexity" }, 2] },
        "explanation": { "en": "One failure chain is likely, so drilling down is faster than mapping many causes.", "ar": "يُرجَّح وجود سلسلة إخفاق واحدة، لذا فالتعمق المباشر أسرع من رسم أسباب متعددة." } }
    ],
    "complements": [ { "framework_id": "fw_cause_effect", "relation": "precedes" }, { "framework_id": "fw_action_plan", "relation": "follows" } ],
    "visual_type": "why_chain", "provenance": "platform_authored",
    "origin_attribution": { "originators": ["Toyota Production System practice"], "era": "20th century", "verified_by_sme": false }
  },
  "definition": {
    "framework_id": "fw_five_whys", "version": "1.0.0",
    "ports": {
      "inputs":  [ { "name": "seed_causes", "accepts": "cause_list", "maps_to": "/chains/*/whys/0" } ],
      "outputs": [ { "name": "root_causes", "type": "cause_list", "from": "chains.root_cause" },
                   { "name": "countermeasures", "type": "option_list", "from": "chains.countermeasures" } ]
    },
    "steps": [
      { "id": "define", "target": "/problem", "required": true, "draft_group": "g1",
        "title": { "en": "State the problem as an observable fact", "ar": "صِف المشكلة كما تُلاحَظ" } },
      { "id": "ask_why", "target": "/chains", "required": true, "draft_group": "g1",
        "validation": [ { "id": "min_depth", "level": "hint", "logic": { ">=": [{ "count": [{ "var": "whys" }] }, 3] },
                          "message": { "en": "Chains usually need three or more levels to move past symptoms.", "ar": "تحتاج السلاسل عادةً إلى ثلاثة مستويات أو أكثر لتجاوز الأعراض." } } ],
        "critic": { "framework_rubric_id": "rubric.five_whys.v1" } },
      { "id": "root_cause", "target": "/chains/*/root_cause", "required": true, "draft_group": "g1" },
      { "id": "countermeasures", "target": "/chains/*/countermeasures", "required": false, "draft_group": "g2" }
    ],
    "visual": { "type": "why_chain", "views": ["why_chain"] },
    "export": { "pptx": [ { "recipe": "diagram_full", "title_strategy": "action_title_llm" } ] }
  }
}
```

**Source vs. platform guidance [v0.2, M10]:** platform guidance governs product behaviour. Where reference material elsewhere recommends something different (e.g. a fixed number of "whys"), the Explain panel may say *"Some practitioners recommend …; this platform suggests …, because …"*, written originally. Reference-source text is never quoted.

### 6.4 FrameworkInstance (runtime)

As in v0.1, plus:
- `content` items are `core/statement.v2`.
- `active_view` (for multi-view frameworks).
- `inputs_bound[]` record `{port, from_instance, from_version, copied_statement_ids[]}`.
- `upstream_changed: boolean` (computed).

## 7. Framework catalogue

### 7.1 MVP (15 frameworks, all `active` at GA)

| id | EN | AR (draft, glossary review pending) | Family | Visual / views | Variants | Wave |
|---|---|---|---|---|---|---|
| fw_swot | SWOT Analysis | تحليل SWOT | strategy_environment | matrix_2x2_list | — | Beta-1 |
| fw_pest_steeple | PEST / STEEPLE Analysis | تحليل PEST / STEEPLE | strategy_environment | factor_columns | PEST · PESTLE · STEEPLE | Beta-1 |
| fw_five_whys | 5 Whys | تحليل «لماذا» الخماسي | root_cause | why_chain | — | Beta-1 |
| fw_cause_effect | Cause and Effect Diagram | مخطط السبب والنتيجة (عظمة السمكة) | root_cause | fishbone | category sets (6M, 4P, custom) | Beta-1 |
| fw_sipoc | SIPOC | نموذج SIPOC | process | sipoc_table_flow | — | Beta-1 |
| fw_impact_effort | Impact Effort Matrix | مصفوفة الأثر والجهد | prioritisation | matrix_2x2_scatter | — | Beta-1 |
| fw_risk_matrix | Risk Assessment Matrix | مصفوفة تقييم المخاطر | risk | heat_matrix | 3×3 · 4×4 · 5×5 | Beta-1 |
| fw_action_plan | Action Plan (incl. **Gantt view**) | خطة العمل | project_planning | action_table · **gantt** | — | Beta-1 (table) / Beta-2 (Gantt view) |
| fw_gantt | Gantt Chart | مخطط جانت | project_planning | **alias entry → opens fw_action_plan in `gantt` view** | — | Beta-2 |
| fw_stakeholder_map | Stakeholder Map | خريطة أصحاب المصلحة | stakeholder_org | matrix_2x2_scatter | power_interest · influence_support | Beta-2 |
| fw_project_charter | Project Charter | ميثاق المشروع | project_planning | document_blocks | — | Beta-2 |
| fw_bpmn | BPMN (core subset) | نمذجة إجراءات الأعمال (BPMN) | process | process_flow_swimlane | — | Beta-2 |
| fw_vsm | Value Stream Mapping | خريطة تدفق القيمة | process | value_stream | data-light · data-rich | Beta-2 |
| fw_org_chart | Organizational Chart | الهيكل التنظيمي | stakeholder_org | hierarchy_tree | role-based (default) · named | Beta-2 |
| fw_op_model_canvas | Operating Model Canvas | لوحة نموذج التشغيل | operating_model | canvas_blocks | — | Beta-2 |

**Gantt [v0.2, approved]:** `fw_gantt` stays a catalogue and recommendation entry, because users ask for "a Gantt chart". Selecting it creates or opens the project's **Action Plan instance in the Gantt view**. There is one dataset (actions, owners, start/end, dependencies, status) and two views. Gantt-specific fields (`start`, `end`, `depends_on_action_ids`, `milestone`) are optional Action Plan fields; the Gantt view lists actions missing dates in a side tray.

### 7.2 Platform capability (not a catalogue framework)

| id | Name | Why it isn't a "framework" |
|---|---|---|
| `cap_strategic_options` | Generate Strategic Options / توليد الخيارات الاستراتيجية | A consulting capability (04 §6) that produces and compares courses of action. It is platform-designed, needs no reference source and appears in recommendations as a capability card |

### 7.3 Pending entries
The internal reference source has **50** entries. The MVP set maps to **16** of them (PEST and STEEPLE are separate entries there, one variant-based framework here). **34 entries remain `pending_source_review`.** They are not named, described or catalogued in product data. Activation of any method needs: an independent platform-authored KB (no derivation from the reference text) → SME review → definition → ≥ 10 golden cases → beta → active. Order is driven by the `no_good_fit` demand log (04 §5.7).

## 8. Content governance

| Stage | Who | Gate |
|---|---|---|
| Draft | Content author (AI drafting allowed **without** reference-source input) | Schema-valid (CI) |
| SME review | Methodology SME | Accuracy, completeness, **originality check** (no close paraphrase of any single reference) |
| Arabic editorial | Arabic business editor | Native writing (not translation), glossary, MSA business register |
| Eval | CI | Golden-set regression ≤ 3 points |
| Publish | Content lead | Version bump, changelog; old definition versions kept for existing instances |
