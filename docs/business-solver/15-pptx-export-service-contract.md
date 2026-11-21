# 15: PowerPoint Export Service: Boundary & API Contract

> Status: **v1.0 draft (2026-11-21)**, for approval with doc 14.
> Decision: **adopt a Python-based PowerPoint export service** (approved 2026-11-21, subject to a clean service boundary and a documented API contract; this document is that contract).
> Evidence: Phase 0 experiment E (doc 13 §E). `pptxgenjs` has no connectors that attach to shapes; `python-pptx` does. The Phase 0 prototype `phase0/experiments/e-pptx/` is the reference implementation, **not** production code.

## 1. Why a separate service, and what it must not do

| Principle | Rule |
|---|---|
| **Single responsibility** | Turns a fully specified, format-neutral render request into a `.pptx`. Nothing else |
| **No business logic** | No AI calls, no database, no tenant data lookup, no permission checks. Everything it needs is in the request |
| **No layout decisions for diagrams** | Diagram geometry comes from the layout service (02 §6.4a); this service maps it to native PowerPoint objects. Exceptions, all deterministic: table column sizing from measured text, process-diagram pagination, and font-size floors |
| **Stateless** | No persistent storage; temporary files only in an in-memory/tmp volume, deleted after the response |
| **Fail closed on quality** | If its own validation finds text overflow, missing glyphs, pictures, or detached connectors, it returns `422` with a report instead of a broken file (unless the caller explicitly allows warnings) |
| **Replaceable** | The TypeScript side depends only on this contract. A future TypeScript/OOXML implementation can replace the service without changes elsewhere (DR-02 amendment, 02 §0) |

## 2. Placement

```
bps-worker (TypeScript)                                   bps-export-pptx (Python 3.12)
 ├─ composes DocumentOutline from pinned artifacts         ├─ POST /v1/render/pptx
 ├─ layout service (Chromium) → LaidOutDiagram geometry    ├─ maps outline + geometry → native OOXML
 ├─ calls export service (internal network, service token) ├─ validates (structure, RTL, shaped-text fit, glyph coverage)
 └─ stores file in object storage, writes Deliverable row  └─ returns file + RenderReport (no storage, no DB)
```

- Deployment: its own container image in the same regional stack. Internal-only network, no outbound internet access, read-only root filesystem, runs as non-root, CPU/memory limits (1 vCPU / 1 GiB default).
- Authentication: short-lived service token (or mTLS in Enterprise profiles). Callers other than `bps-worker` are rejected.
- Ownership: FS3 (export & visual fidelity). Contract changes need review by the worker owner.

## 3. Endpoints

| Method & path | Purpose | Success | Errors |
|---|---|---|---|
| `POST /v1/render/pptx` | Render a deck | `200` `RenderResult` | `400` invalid request · `401/403` auth · `413` request too large (> 20 MB or > 60 slides) · `422` validation failed (`RenderResult` with report, no file) · `500` internal · `503` overloaded (retry with backoff) |
| `GET /v1/capabilities` | Supported contract versions, slide types, fonts and font coverage, numeral/calendar options, limits | `200` | — |
| `GET /healthz` | Liveness / readiness | `200` | `503` |

Idempotency: `request_id` (UUID) is required. A repeated `request_id` with an identical body returns the same result from a short-lived cache (10 min); with a different body it returns `409`.

Timeouts: the service must finish within 30 s for ≤ 25 slides (p90 target 10 s); the caller times out at 45 s.

## 4. Request schema (abridged JSON Schema; canonical file: `contracts/export-pptx/v1/render-request.schema.json`)

```json
{
  "$id": "export-pptx/v1/render-request",
  "type": "object",
  "required": ["contract_version", "request_id", "locale", "theme", "options", "slides"],
  "properties": {
    "contract_version": { "const": "1.0" },
    "request_id": { "type": "string", "format": "uuid" },
    "trace_id": { "type": "string" },
    "locale": { "enum": ["ar", "en"] },
    "options": {
      "type": "object",
      "properties": {
        "slide_size": { "enum": ["16:9"] },
        "font_mode": { "enum": ["platform", "system"], "description": "platform = IBM Plex Sans Arabic + Inter (embedded where licence allows); system = Arial/Segoe UI for maximum compatibility" },
        "numerals": { "enum": ["western", "arabic_indic"] },
        "calendar": { "enum": ["gregorian", "umm_al_qura", "both"] },
        "status_label_density": { "enum": ["compact", "full", "appendix_only"] },
        "min_body_font_pt": { "type": "number", "minimum": 9, "default": 10 },
        "allow_warnings": { "type": "boolean", "default": false },
        "ai_disclosure_footer": { "type": "boolean", "default": true },
        "translated_unreviewed_banner": { "type": "boolean", "default": false }
      }
    },
    "theme": { "type": "object", "description": "Colour tokens (hex) and font families; from packages/ui-tokens print theme" },
    "slides": { "type": "array", "maxItems": 60, "items": { "$ref": "#/$defs/slide" } }
  },
  "$defs": {
    "slide": {
      "type": "object", "required": ["type", "title"],
      "properties": {
        "type": { "enum": ["title", "summary_blocks", "table", "matrix_2x2_list", "heat_matrix", "factor_columns", "options_table", "action_table", "gantt", "why_chain", "fishbone", "sipoc_table_flow", "matrix_2x2_scatter", "hierarchy_tree", "canvas_blocks", "document_blocks", "process"] },
        "title": { "type": "string" },
        "notes": { "type": "string" },
        "content": { "type": "object", "description": "Per-type payload (see §4.1). Text items are Statements reduced to {id, text, markers}" },
        "geometry": { "type": "object", "description": "LaidOutDiagram from the layout service for diagram types (px units, font spec, nodes, edges, lanes)" }
      }
    },
    "text_item": {
      "type": "object", "required": ["id", "text"],
      "properties": {
        "id": { "type": "string" }, "text": { "type": "string" },
        "markers": { "type": "object", "properties": {
          "truth": { "enum": ["verified_evidence", "verified_attested", "unverified", "assumption", null] },
          "review": { "enum": ["pending_review", "accepted", "challenged", null] },
          "decision": { "enum": ["proposed", "accepted", "rejected", "deferred", null] } } }
      }
    }
  }
}
```

### 4.1 Slide payloads (v1.0 launch scope)

| Slide type | Used for | Payload (summary) | Native objects produced |
|---|---|---|---|
| `title`, `summary_blocks` | Cover; Problem-Solving Summary | text blocks | Text boxes |
| `table` | Generic tables, risk register, evidence list, Assumptions Register | `columns[]`, `rows[][]` (text items), `numeric_columns[]` | Native table (RTL-mirrored in Arabic) |
| `matrix_2x2_list` | SWOT | 4 quadrant lists | Native 2×2 table |
| `heat_matrix` | Risk matrix | `scale`, `cells` with item ids, colour bands | Native table with fills; **not mirrored** (mathematical axes) |
| `factor_columns` | PEST/STEEPLE | factor → items | Native table |
| `options_table` | Strategic Options | options × criteria, weighted score (pre-computed by the caller), preferred id | Native table + emphasis |
| `action_table` | Action Plan | actions with owner, dates, dependencies | Native table |
| `gantt` | Action Plan, Gantt view | actions with start/end, dependencies, calendar, workweek | Bars as shapes; **attached** dependency connectors |
| `why_chain`, `fishbone`, `sipoc_table_flow`, `matrix_2x2_scatter`, `hierarchy_tree`, `canvas_blocks`, `document_blocks` | Other launch frameworks | geometry + text items | Shapes, text, attached connectors |
| `process` | BPMN / VSM | geometry (lanes, nodes, edges) | **Disabled until BPMN re-entry criteria pass** (doc 14 §5.3); returns `400 slide_type_not_enabled` |

## 5. Response schema

```json
{
  "$id": "export-pptx/v1/render-result",
  "type": "object",
  "required": ["request_id", "status", "report"],
  "properties": {
    "request_id": { "type": "string" },
    "status": { "enum": ["ok", "ok_with_warnings", "failed_validation"] },
    "file": { "type": "object", "properties": {
      "media_type": { "const": "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
      "bytes_base64": { "type": "string" }, "sha256": { "type": "string" }, "size_bytes": { "type": "integer" } } },
    "report": {
      "type": "object",
      "properties": {
        "slides": { "type": "integer" },
        "pictures": { "type": "integer", "description": "Must be 0" },
        "tables": { "type": "integer" },
        "connectors": { "type": "integer" }, "connectors_attached_both_ends": { "type": "integer" }, "connectors_dangling": { "type": "integer" },
        "rtl_paragraphs_expected": { "type": "integer" }, "rtl_paragraphs_set": { "type": "integer" },
        "text_frames_checked": { "type": "integer" },
        "overflow": { "type": "array", "items": { "type": "object", "properties": { "slide": { "type": "integer" }, "element": { "type": "string" }, "axis": { "enum": ["width", "height"] } } } },
        "min_font_pt": { "type": "number" },
        "glyph_coverage": { "type": "object", "properties": { "missing": { "type": "array", "items": { "type": "string" } } } },
        "pagination": { "type": "array", "description": "For diagram types split over several slides: pages and off-page link labels" },
        "warnings": { "type": "array", "items": { "type": "string" } },
        "timings_ms": { "type": "object" },
        "service_version": { "type": "string" }, "contract_version": { "const": "1.0" }
      }
    }
  }
}
```

**Validation gates (fail closed):** `pictures > 0`, `connectors_dangling > 0`, `rtl_paragraphs_set < rtl_paragraphs_expected`, any `overflow`, any `glyph_coverage.missing`, or `min_font_pt < options.min_body_font_pt` for body text → `422 failed_validation` (or `ok_with_warnings` when `allow_warnings = true`, recorded in the deliverable manifest).

## 6. Fonts

- The image ships **full** font files: IBM Plex Sans Arabic (all weights used) and Inter, both under the SIL Open Font License. Phase 0 showed that web-subset font files (Arabic subset without Latin digits) produce glyph fallback and letter-spaced digits in renderers (doc 16 §3).
- A start-up self-test shapes probe strings (Arabic, Latin, both digit systems, diacritics, mixed direction) with HarfBuzz, and refuses readiness if any glyph is missing.
- `font_mode = system` substitutes Arial/Segoe UI and re-measures with metric-compatible fonts bundled for measurement. Layout geometry for diagrams must then be requested from the layout service with the same font mode.

## 7. Observability, privacy and security

- Logs contain `request_id`, `trace_id`, timings, slide counts and validation counts. **Never** slide text, file bytes, tokens or headers. Content in requests is customer data and is treated as such.
- Metrics: request rate, p50/p90 latency per slide type, `422` rate by gate, memory.
- Security: pinned dependencies with hashes, SBOM per build, image scanning, non-root, read-only FS, no egress. The service has no credentials of its own besides its inbound service-token verifier.

## 8. Versioning and change control

- `contract_version` is semantic. Additive optional fields are a minor change. Removing or renaming fields, or changing meaning, is a major change, served at a new path `/v2`, with both versions available during the migration.
- `GET /v1/capabilities` lets the worker detect support for new slide types before sending them.
- Contract tests: JSON Schemas live in `contracts/export-pptx/v1/`. The worker's client and the service both validate against them in CI.

## 9. Testing

| Level | What | Gate |
|---|---|---|
| Unit | Each slide type mapper; RTL rules; connector-site mapping (incl. ellipse sites 0/2/4/6) | CI |
| Golden files | Every slide type × {AR, EN} × {platform, system font}: structural snapshot + LibreOffice render diff | CI |
| Validator | Phase 0 validator promoted (structure, RTL, HarfBuzz overflow, glyph coverage) | CI, must be clean |
| Manual matrix | Doc 16 protocol in PowerPoint (Windows, Mac) and Keynote | Each release that touches export |
| Load | 25-slide deck, 20 concurrent requests | p90 ≤ 10 s, no `503` below 10 concurrent |

## 10. Open items

| Item | Owner | When |
|---|---|---|
| Font embedding policy per app (PowerPoint embeds TrueType where allowed; Keynote behaviour to be tested) | FS3 | Doc 16 test run |
| Control of elbow-connector routing in PowerPoint (adjustment handles) vs app auto-routing | FS3 | After doc 16 test run |
| `process` slide type re-enablement | FS2/FS3 | BPMN re-entry (doc 14 §5.3) |
