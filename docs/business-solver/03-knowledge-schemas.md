# 03: Knowledge Base Data Schema & Framework Metadata Schema

All schemas are written as **JSON Schema (2020-12)**. In code they are authored as Zod in `packages/schemas` and exported to JSON Schema, so one source feeds the API, LLM structured outputs and UI forms. Abridged where noted. The DDL equivalents are in 05.

## 1. Knowledge model overview

```
SourceDocument 1─* SourceVersion 1─* Chunk *─* Framework (tags)
                                        │
Framework 1─* FrameworkDefinition (versioned behaviour)      TaxonomyNode *─* Framework  (AffinityEdge, weighted)
Framework 1─* KnowledgeEntry (authored content: definition, when-to-use, steps, pitfalls, examples)
KnowledgeEntry 1─* Chunk (KnowledgeEntries are chunked & embedded too)
Glossary term (AR/EN canonical terms)
```

- **SourceDocument** is an external reference (the Creately PDF, future licensed books, standards). Immutable versions; licence metadata is mandatory.
- **KnowledgeEntry** is *our* structured content about a framework. Each entry carries provenance: `source_document` (extracted from a source, with page refs), `platform_authored` (written by our content team) or `ai_drafted_reviewed` (AI first draft, human approved, and never presented as source material).
- **Chunk** is the retrievable, embedded unit, from either a source or a KnowledgeEntry.
- **FrameworkDefinition** is the *executable* specification (steps, schemas, visuals, exports).

## 2. Source document schema

```json
{
  "$id": "kb/source-document.v1",
  "type": "object",
  "required": ["id", "title", "publisher", "licence", "language", "status"],
  "properties": {
    "id": { "type": "string", "pattern": "^src_[a-z0-9]{12}$" },
    "title": { "type": "string" },
    "publisher": { "type": "string" },
    "authors": { "type": "array", "items": { "type": "string" } },
    "edition": { "type": "string" },
    "published_date": { "type": "string", "format": "date" },
    "language": { "enum": ["en", "ar", "mixed"] },
    "licence": {
      "type": "object",
      "required": ["type", "usage_rights", "verified_by", "verified_at"],
      "properties": {
        "type": { "enum": ["proprietary_reference", "licensed", "open_cc_by", "open_cc_by_sa", "public_domain", "internal"] },
        "usage_rights": {
          "type": "array",
          "items": { "enum": ["index_for_retrieval", "short_quotation_with_attribution", "display_excerpt", "derive_original_content", "reproduce_visuals"] }
        },
        "max_excerpt_chars": { "type": "integer", "default": 300 },
        "attribution_text": { "type": "string" },
        "notes": { "type": "string" },
        "verified_by": { "type": "string" },
        "verified_at": { "type": "string", "format": "date-time" }
      }
    },
    "scope": { "enum": ["global", "org"] },
    "org_id": { "type": ["string", "null"] },
    "status": { "enum": ["pending_licence_review", "ingesting", "active", "retired"] },
    "current_version_id": { "type": "string" }
  }
}
```

**Policy hook:** the retrieval layer reads `licence.usage_rights`. If `display_excerpt` is absent, chunks may ground the model, but the UI shows only the citation (title + page) and never the excerpt. If `reproduce_visuals` is absent (the default), image regions are **not stored** at all: only their captions and surrounding text are indexed. For the Creately PDF we assume `["index_for_retrieval", "short_quotation_with_attribution", "derive_original_content"]` **pending your licence confirmation**.

### 2.1 SourceVersion and Chunk

```json
{
  "$id": "kb/chunk.v1",
  "type": "object",
  "required": ["id", "corpus", "origin", "text", "language", "locator", "embedding_model"],
  "properties": {
    "id": { "type": "string", "pattern": "^chk_[a-z0-9]{16}$" },
    "corpus": { "enum": ["global_kb", "org_kb", "project_evidence"] },
    "org_id": { "type": ["string", "null"] },
    "project_id": { "type": ["string", "null"] },
    "origin": {
      "oneOf": [
        { "type": "object", "required": ["kind", "source_version_id"], "properties": { "kind": { "const": "source_document" }, "source_version_id": { "type": "string" } } },
        { "type": "object", "required": ["kind", "knowledge_entry_id", "entry_version"], "properties": { "kind": { "const": "knowledge_entry" }, "knowledge_entry_id": { "type": "string" }, "entry_version": { "type": "integer" } } },
        { "type": "object", "required": ["kind", "evidence_id"], "properties": { "kind": { "const": "user_upload" }, "evidence_id": { "type": "string" } } }
      ]
    },
    "text": { "type": "string", "description": "Display text, original form (diacritics preserved)" },
    "text_normalised": { "type": "string", "description": "Search-only normalised form (Arabic letter unification, tatweel/diacritics removed)" },
    "language": { "enum": ["en", "ar"] },
    "locator": {
      "type": "object",
      "properties": {
        "page_start": { "type": "integer" }, "page_end": { "type": "integer" },
        "section_path": { "type": "array", "items": { "type": "string" } },
        "char_start": { "type": "integer" }, "char_end": { "type": "integer" },
        "sheet": { "type": "string" }, "cell_range": { "type": "string" }
      }
    },
    "section_type": { "enum": ["definition", "use_case", "when_not_to_use", "steps", "example", "pitfall", "template_description", "background", "other"] },
    "framework_ids": { "type": "array", "items": { "type": "string" } },
    "taxonomy_codes": { "type": "array", "items": { "type": "string" } },
    "token_count": { "type": "integer" },
    "embedding_model": { "type": "string" },
    "embedding_dim": { "type": "integer" },
    "content_hash": { "type": "string" }
  }
}
```

## 3. Shared trust primitives: Claim, EvidenceRef, Provenance

These three types appear in **every** AI output (diagnosis, recommendation, framework elements, narratives). They are the concrete form of "distinguish facts, assumptions and AI-generated suggestions".

```json
{
  "$id": "core/claim.v1",
  "type": "object",
  "required": ["id", "text", "claim_type", "evidence_refs"],
  "properties": {
    "id": { "type": "string" },
    "text": { "type": "string" },
    "claim_type": {
      "enum": ["fact", "assumption", "ai_suggestion", "user_input"],
      "description": "fact = stated by the user or supported by cited evidence; assumption = plausible but unverified premise the analysis depends on; ai_suggestion = an idea/recommendation generated by the AI; user_input = typed/edited by the user (verbatim authority)"
    },
    "evidence_refs": { "type": "array", "items": { "$ref": "core/evidence-ref.v1" } },
    "confidence": { "enum": ["high", "medium", "low"], "description": "Only for assumption/ai_suggestion" },
    "verification_hint": { "type": "string", "description": "For assumptions: how the user could verify it" }
  }
}
```

```json
{
  "$id": "core/evidence-ref.v1",
  "type": "object",
  "required": ["kind"],
  "properties": {
    "kind": { "enum": ["user_message_span", "evidence_chunk", "kb_chunk", "upstream_artifact"] },
    "message_id": { "type": "string" }, "char_start": { "type": "integer" }, "char_end": { "type": "integer" },
    "chunk_id": { "type": "string" },
    "artifact_id": { "type": "string" }, "artifact_version": { "type": "integer" }, "json_pointer": { "type": "string" },
    "quote": { "type": "string", "maxLength": 300, "description": "Short supporting excerpt; omitted in UI if licence forbids display" }
  }
}
```

**Validator rules (enforced in code, not trusted to the model):**
- V1: `claim_type = fact` ⇒ `evidence_refs.length ≥ 1`, each resolving to a real message span or a chunk supplied in *this* run. Otherwise the claim is auto-downgraded to `assumption` and a `downgraded_reason` is recorded.
- V2: a `kb_chunk` with `origin.kind = source_document` is the **only** way something is attributed to the PDF. UI copy like "According to *50 Business Diagrams…*, p. 14" is generated from the chunk's source record, never from model text.
- V3: when a user edits text, `claim_type` becomes `user_input` unless the user explicitly keeps the original type (e.g. editing the wording of an assumption).
- V4: assumptions surface in the export's **Assumptions Register** with `verification_hint`.

**Element provenance** (attached to every editable element in an artifact):
```json
{
  "$id": "core/provenance.v1",
  "type": "object",
  "required": ["origin", "status"],
  "properties": {
    "origin": { "enum": ["ai", "user", "system", "imported"] },
    "status": { "enum": ["suggested", "accepted", "edited", "rejected"] },
    "ai_run_id": { "type": "string" },
    "created_at": { "type": "string", "format": "date-time" },
    "last_edited_by": { "type": "string" },
    "last_edited_at": { "type": "string", "format": "date-time" }
  }
}
```

## 4. Framework metadata schema (FrameworkDefinition)

### 4.1 Split: `Framework` (identity & catalogue metadata) vs `FrameworkDefinition` (versioned behaviour)

```json
{
  "$id": "fw/framework.v1",
  "type": "object",
  "required": ["id", "slug", "names", "status", "family", "taxonomy_affinity", "summary", "provenance"],
  "properties": {
    "id": { "type": "string", "pattern": "^fw_[a-z0-9_]+$", "examples": ["fw_five_whys"] },
    "slug": { "type": "string" },
    "catalogue_no": { "type": "integer", "description": "Position in the 50-item catalogue (03 §5)" },
    "names": {
      "type": "object", "required": ["en", "ar"],
      "properties": { "en": { "type": "string" }, "ar": { "type": "string" }, "aliases": { "type": "array", "items": { "type": "string" } } }
    },
    "status": { "enum": ["active", "beta", "inactive_catalogued", "deprecated"],
                "description": "inactive_catalogued = stored in KB for future activation; never recommended" },
    "family": { "enum": ["process", "root_cause", "strategy_environment", "prioritisation", "risk", "stakeholder_org", "project_planning", "operating_model", "other"] },
    "summary": { "$ref": "#/$defs/i18n", "description": "≤ 280 chars, used in catalogue prompt prefix and cards" },
    "purpose_tags": { "type": "array", "items": { "enum": ["understand_process", "find_root_cause", "scan_environment", "assess_position", "prioritise", "assess_risk", "align_stakeholders", "define_scope", "plan_schedule", "assign_actions", "design_organisation", "design_operating_model", "reduce_waste"] } },
    "taxonomy_affinity": {
      "type": "array",
      "items": { "type": "object", "required": ["code", "weight"],
                 "properties": { "code": { "type": "string" }, "weight": { "type": "number", "minimum": 0, "maximum": 1 } } },
      "description": "Seed weights for Stage B scoring (04 §5.2). Owned by content team; tuned by feedback"
    },
    "preconditions": {
      "type": "array",
      "description": "Context requirements (04 §4); evaluated against ProblemDiagnosis",
      "items": { "type": "object", "required": ["field", "requirement", "severity"],
                 "properties": {
                   "field": { "type": "string", "description": "Diagnosis slot, e.g. 'process.boundaries'" },
                   "requirement": { "enum": ["present", "min_items", "value_in"] },
                   "param": {},
                   "severity": { "enum": ["blocking", "important", "nice_to_have"] } } }
    },
    "contraindications": {
      "type": "array",
      "items": { "type": "object", "required": ["rule", "message"],
                 "properties": { "rule": { "type": "object", "description": "JSONLogic over diagnosis" }, "message": { "$ref": "#/$defs/i18n" } } }
    },
    "complements": { "type": "array", "items": { "type": "object", "properties": { "framework_id": { "type": "string" }, "relation": { "enum": ["precedes", "follows", "alternative", "deepens"] } } } },
    "effort": { "type": "object", "properties": { "minutes_typical": { "type": "integer" }, "inputs_needed": { "$ref": "#/$defs/i18n" }, "group_recommended": { "type": "boolean" } } },
    "outputs_description": { "$ref": "#/$defs/i18n" },
    "when_not_to_use": { "$ref": "#/$defs/i18n" },
    "difficulty": { "enum": ["basic", "intermediate", "advanced"] },
    "visual_type": { "type": "string" },
    "active_definition_version": { "type": "string" },
    "knowledge_entry_ids": { "type": "array", "items": { "type": "string" } },
    "source_refs": { "type": "array", "items": { "type": "object", "properties": { "source_document_id": { "type": "string" }, "pages": { "type": "string" } } },
                     "description": "Empty until the PDF is ingested and pages verified by a reviewer" },
    "provenance": { "enum": ["source_document", "platform_authored", "ai_drafted_reviewed"] },
    "review": { "type": "object", "properties": { "reviewed_by": { "type": "string" }, "reviewed_at": { "type": "string" }, "sme_signoff": { "type": "boolean" } } }
  },
  "$defs": { "i18n": { "type": "object", "properties": { "en": { "type": "string" }, "ar": { "type": "string" } } } }
}
```

### 4.2 FrameworkDefinition (behaviour; semver-versioned)

```json
{
  "$id": "fw/definition.v1",
  "type": "object",
  "required": ["framework_id", "version", "content_schema", "steps", "visual", "export"],
  "properties": {
    "framework_id": { "type": "string" },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "content_schema": { "type": "object", "description": "JSON Schema of FrameworkInstance.content; element items $ref core/claim + core/provenance" },
    "ports": {
      "type": "object",
      "properties": {
        "inputs":  { "type": "array", "items": { "type": "object", "properties": { "name": { "type": "string" }, "accepts": { "type": "string", "description": "port type e.g. 'cause_list', 'action_list', 'risk_list', 'process_steps', 'stakeholder_list'" }, "maps_to": { "type": "string", "description": "JSON pointer into content" } } } },
        "outputs": { "type": "array", "items": { "type": "object", "properties": { "name": { "type": "string" }, "type": { "type": "string" }, "from": { "type": "string", "description": "JSONata over content" } } } }
      }
    },
    "steps": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "title", "instructions", "target", "required"],
        "properties": {
          "id": { "type": "string" },
          "title": { "$ref": "#/$defs/i18n" },
          "instructions": { "$ref": "#/$defs/i18n", "description": "User-facing guidance; platform-authored" },
          "tips": { "type": "array", "items": { "$ref": "#/$defs/i18n" } },
          "target": { "type": "string", "description": "JSON pointer of the content subtree this step fills" },
          "required": { "type": "boolean" },
          "prefill": { "type": "object", "properties": { "enabled": { "type": "boolean" }, "prompt_id": { "type": "string" }, "max_items": { "type": "integer" }, "kb_query_hints": { "type": "array", "items": { "type": "string" } } } },
          "validation": { "type": "array", "items": { "$ref": "#/$defs/rule" } },
          "ai_critique": { "type": "object", "properties": { "enabled": { "type": "boolean" }, "prompt_id": { "type": "string" } } }
        }
      }
    },
    "validation": { "type": "array", "items": { "$ref": "#/$defs/rule" }, "description": "Whole-instance rules" },
    "visual": {
      "type": "object", "required": ["type", "mapping"],
      "properties": {
        "type": { "type": "string" },
        "mapping": { "type": "string", "description": "JSONata expression: content → DiagramModel (nodes/regions/edges)" },
        "options": { "type": "object" }
      }
    },
    "export": {
      "type": "object",
      "properties": {
        "pptx": { "type": "array", "items": { "type": "object", "properties": { "recipe": { "enum": ["title_and_diagram", "diagram_full", "table", "bullets_with_callout", "matrix_with_notes", "register_table"] }, "when": { "type": "object" }, "title_strategy": { "enum": ["action_title_llm", "static"] } } } },
        "pdf": { "type": "object", "properties": { "sections": { "type": "array", "items": { "type": "string" } } } },
        "xlsx": { "type": "object", "properties": { "sheets": { "type": "array" } } }
      }
    },
    "changelog": { "type": "string" }
  },
  "$defs": {
    "i18n": { "type": "object", "properties": { "en": { "type": "string" }, "ar": { "type": "string" } } },
    "rule": {
      "type": "object", "required": ["id", "level", "logic", "message"],
      "properties": {
        "id": { "type": "string" },
        "level": { "enum": ["error", "warning", "hint"] },
        "logic": { "type": "object", "description": "JSONLogic; helper ops: count, distinct_ratio, similarity(a,b), has_owner, date_order" },
        "message": { "$ref": "#/$defs/i18n" }
      }
    }
  }
}
```

### 4.3 Worked example: 5 Whys (platform-authored, abridged)

> Provenance: `platform_authored`. The instructions below are standard professional practice written by us. **Not quoted from or attributed to the PDF.** `source_refs` stays empty until a reviewer maps verified PDF pages.

```json
{
  "framework": {
    "id": "fw_five_whys", "slug": "five-whys", "catalogue_no": 6,
    "names": { "en": "5 Whys", "ar": "الأسئلة الخمسة (لماذا)", "aliases": ["Five Whys", "5Y"] },
    "status": "active", "family": "root_cause",
    "purpose_tags": ["find_root_cause"],
    "taxonomy_affinity": [
      { "code": "OPS.QUALITY", "weight": 0.9 }, { "code": "OPS.PERFORMANCE", "weight": 0.7 },
      { "code": "CX.SERVICE", "weight": 0.7 }, { "code": "PPL.ENGAGEMENT", "weight": 0.4 }
    ],
    "preconditions": [
      { "field": "problem.statement", "requirement": "present", "severity": "blocking" },
      { "field": "problem.observable_symptom", "requirement": "present", "severity": "blocking" },
      { "field": "problem.recurrence", "requirement": "present", "severity": "important" }
    ],
    "contraindications": [
      { "rule": { ">=": [{ "var": "problem.causal_complexity_estimate" }, 3] },
        "message": { "en": "Many interacting causes are likely; start with a Cause & Effect diagram and use 5 Whys on its top branches.", "ar": "يُرجَّح وجود أسباب متعددة متداخلة؛ ابدأ بمخطط السبب والنتيجة ثم طبّق الأسئلة الخمسة على أهم فروعه." } }
    ],
    "complements": [
      { "framework_id": "fw_cause_effect", "relation": "precedes" },
      { "framework_id": "fw_action_plan", "relation": "follows" }
    ],
    "effort": { "minutes_typical": 20, "group_recommended": true },
    "difficulty": "basic", "visual_type": "why_chain", "provenance": "platform_authored", "source_refs": []
  },
  "definition": {
    "framework_id": "fw_five_whys", "version": "1.0.0",
    "content_schema": {
      "type": "object", "required": ["problem", "chains"],
      "properties": {
        "problem": { "$ref": "core/claim.v1" },
        "chains": { "type": "array", "maxItems": 3, "items": {
          "type": "object", "properties": {
            "whys": { "type": "array", "minItems": 1, "maxItems": 7, "items": { "allOf": [{ "$ref": "core/claim.v1" }, { "properties": { "provenance": { "$ref": "core/provenance.v1" } } }] } },
            "root_cause": { "$ref": "core/claim.v1" },
            "countermeasures": { "type": "array", "items": { "$ref": "core/claim.v1" } } } } }
      }
    },
    "ports": {
      "inputs": [{ "name": "seed_causes", "accepts": "cause_list", "maps_to": "/chains/*/whys/0" }],
      "outputs": [{ "name": "root_causes", "type": "cause_list", "from": "chains.root_cause" },
                  { "name": "countermeasures", "type": "action_list", "from": "chains.countermeasures" }]
    },
    "steps": [
      { "id": "define", "target": "/problem", "required": true,
        "title": { "en": "State the problem precisely", "ar": "صِف المشكلة بدقة" },
        "instructions": { "en": "Describe what happens, where and how often, as an observable fact, not a cause or a blame.", "ar": "صِف ما يحدث وأين وكم مرة، كحقيقة يمكن ملاحظتها، لا كسبب أو اتهام." },
        "prefill": { "enabled": true, "prompt_id": "fw.five_whys.define", "max_items": 1 } },
      { "id": "ask_why", "target": "/chains", "required": true,
        "title": { "en": "Ask 'why?' until you reach a controllable cause", "ar": "اسأل «لماذا؟» حتى تصل إلى سبب يمكن التحكم فيه" },
        "prefill": { "enabled": true, "prompt_id": "fw.five_whys.chain", "max_items": 3 },
        "validation": [
          { "id": "no_repeat", "level": "warning", "logic": { "<": [{ "max_pairwise_similarity": [{ "var": "whys.text" }] }, 0.85] },
            "message": { "en": "Two answers say nearly the same thing; go one level deeper.", "ar": "إجابتان متشابهتان تقريبًا؛ تعمّق مستوى إضافيًا." } },
          { "id": "depth", "level": "hint", "logic": { ">=": [{ "count": [{ "var": "whys" }] }, 3] },
            "message": { "en": "Most chains need at least 3 levels.", "ar": "تحتاج معظم السلاسل إلى ثلاثة مستويات على الأقل." } }
        ],
        "ai_critique": { "enabled": true, "prompt_id": "fw.five_whys.critique" } },
      { "id": "root_cause", "target": "/chains/*/root_cause", "required": true,
        "title": { "en": "Confirm the root cause", "ar": "أكّد السبب الجذري" },
        "validation": [{ "id": "not_person", "level": "warning", "logic": { "!": { "mentions_individual_blame": [{ "var": "text" }] } },
          "message": { "en": "Root causes should be about systems or processes, not individuals.", "ar": "يجب أن يتعلق السبب الجذري بالأنظمة أو العمليات، لا بالأفراد." } }] },
      { "id": "countermeasures", "target": "/chains/*/countermeasures", "required": false,
        "title": { "en": "Propose countermeasures", "ar": "اقترح إجراءات تصحيحية" },
        "prefill": { "enabled": true, "prompt_id": "fw.five_whys.countermeasures", "max_items": 3 } }
    ],
    "visual": { "type": "why_chain", "mapping": "{ 'nodes': [ ... ] }" },
    "export": { "pptx": [ { "recipe": "diagram_full", "title_strategy": "action_title_llm" }, { "recipe": "bullets_with_callout", "when": { "var": "has_countermeasures" } } ] }
  }
}
```

### 4.4 FrameworkInstance (runtime)

```json
{
  "$id": "fw/instance.v1",
  "type": "object",
  "required": ["id", "project_id", "framework_id", "definition_version", "content", "step_state"],
  "properties": {
    "id": { "type": "string" }, "project_id": { "type": "string" },
    "framework_id": { "type": "string" }, "definition_version": { "type": "string" },
    "chain_id": { "type": ["string", "null"] }, "chain_position": { "type": ["integer", "null"] },
    "inputs_bound": { "type": "array", "items": { "type": "object", "properties": { "port": { "type": "string" }, "from_instance": { "type": "string" }, "from_version": { "type": "integer" } } } },
    "content": { "type": "object", "description": "Validates against definition.content_schema" },
    "step_state": { "type": "object", "additionalProperties": { "enum": ["not_started", "prefilled", "in_review", "complete", "skipped"] } },
    "validation_report": { "type": "array", "items": { "type": "object", "properties": { "rule_id": { "type": "string" }, "level": { "type": "string" }, "path": { "type": "string" }, "message": { "type": "string" } } } },
    "language": { "enum": ["ar", "en"] }
  }
}
```

## 5. Framework catalogue (50 slots)

`catalogue_no` 1–15 are the **MVP set (active)**. 16–50 are **`inactive_catalogued`** slots. Names, KB content and page references are populated **only from the actual PDF during ingestion task K-2**. They are intentionally not guessed here.

| No | id | EN | AR (draft, glossary-reviewed) | Family | Visual type | MVP wave |
|---|---|---|---|---|---|---|
| 1 | fw_bpmn | BPMN | نمذجة إجراءات الأعمال (BPMN) | process | process_flow_swimlane | Beta-2 |
| 2 | fw_sipoc | SIPOC | نموذج SIPOC (الموردون-المدخلات-العملية-المخرجات-العملاء) | process | sipoc_table_flow | Beta-1 |
| 3 | fw_vsm | Value Stream Mapping | خريطة تدفق القيمة | process | value_stream | Beta-2 |
| 4 | fw_org_chart | Organizational Chart | الهيكل التنظيمي | stakeholder_org | hierarchy_tree | Beta-2 |
| 5 | fw_op_model_canvas | Operating Model Canvas | لوحة نموذج التشغيل | operating_model | canvas_blocks | Beta-2 |
| 6 | fw_five_whys | 5 Whys | الأسئلة الخمسة (لماذا) | root_cause | why_chain | Beta-1 |
| 7 | fw_cause_effect | Cause and Effect Diagram | مخطط السبب والنتيجة (عظمة السمكة) | root_cause | fishbone | Beta-1 |
| 8 | fw_risk_matrix | Risk Assessment Matrix | مصفوفة تقييم المخاطر | risk | heat_matrix | Beta-1 |
| 9 | fw_stakeholder_map | Stakeholder Map | خريطة أصحاب المصلحة | stakeholder_org | matrix_2x2_scatter | Beta-2 |
| 10 | fw_project_charter | Project Charter | ميثاق المشروع | project_planning | document_blocks | Beta-2 |
| 11 | fw_gantt | Gantt Chart | مخطط جانت | project_planning | gantt | Beta-2 |
| 12 | fw_swot | SWOT Analysis | تحليل SWOT (نقاط القوة والضعف والفرص والتهديدات) | strategy_environment | matrix_2x2_list | Beta-1 |
| 13 | fw_pest_steeple | PEST / STEEPLE Analysis | تحليل PEST / STEEPLE | strategy_environment | factor_columns | Beta-1 |
| 14 | fw_impact_effort | Impact Effort Matrix | مصفوفة الأثر والجهد | prioritisation | matrix_2x2_scatter | Beta-1 |
| 15 | fw_action_plan | Action Plan | خطة العمل | project_planning | action_table | Beta-1 |
| 16–50 | `fw_tbd_16` … `fw_tbd_50` | *from PDF ToC* | *to translate* | *assign at ingestion* | *map to an existing visual type where possible* | Future |

**Design notes for the MVP set**
- **PEST vs STEEPLE** is **one framework with a variant parameter** (`factors: PEST | PESTLE | STEEPLE`), not three entries. It shares one `factor_columns` visual.
- **Risk Matrix** has a `scale` parameter (3×3, 4×4, 5×5) and a scoring method (`L×I` by default; banding thresholds configurable per org in Phase 3, to align with an enterprise's ERM policy).
- **Gantt** supports a dual-calendar header and workweek configuration (Sun–Thu default for GCC locales; Mon–Fri otherwise).

**Activation checklist for slots 16–50** (per framework): (1) licence-compliant KB entries extracted from the PDF with page refs → (2) SME review → (3) Framework record + affinity weights → (4) Definition (reusing a visual type) → (5) ≥ 10 golden-set cases → (6) flag `status: beta` for a cohort → (7) `active`.

## 6. Content governance

| Stage | Who | Gate |
|---|---|---|
| Draft | Content author (or AI-drafted → `ai_drafted_reviewed` only after review) | Schema-valid (CI) |
| SME review | Methodology SME (certified practitioner) | Checklist: accuracy, AR/EN parity, no copied text beyond licence, examples original |
| Localisation review | Arabic business editor | Glossary compliance; MSA register |
| Eval | CI | Golden-set regression ≤ 3 pts drop |
| Publish | Content lead | Version bump; changelog; old definition versions kept for existing instances |

The **glossary** (`packages/i18n/glossary.json`) is part of governance. Each term has `{en, ar, notes, do_not_translate}`; for example, "SIPOC" and "BPMN" keep their Latin acronyms with an Arabic expansion on first use.
