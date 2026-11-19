# 12: Technical Proofs of Concept: Specifications & Exit Criteria

> Status: **v0.1 (2026-11-19).** Code in `/phase0` (isolated). Results in doc 13.
> Rule: **a capability is not "ready" because a prototype works.** It is ready when it meets the thresholds below on multiple scenarios, in Arabic and English, on held-out data (doc 11 §7), with limitations documented.

Threshold types: **G** = gate (must pass for Beta-1); **T** = target (tracked; a miss needs a written mitigation); **I** = informational.

---

## A. AI diagnosis & framework recommendation

**Hypothesis.** An LLM can extract a structured, honestly typed diagnosis. Deterministic rules then score the catalogue, and an LLM re-rank constrained to rule-approved candidates selects acceptable approaches. The combination refuses to force a fit (No Good Fit) and asks questions when context is thin.

**Setup.**
- Model `claude-opus-5-5`, structured outputs (Zod → JSON Schema), adaptive thinking, effort sweep high/medium. Judge model `claude-sonnet-5-5`.
- Deterministic layer `phase0/lib/recommender.mjs`; seed matrices `phase0/lib/catalogue.mjs` (frozen in commit `243e0fc`). Harness `phase0/experiments/llm-suite.mjs a`.
- Three variants of the rules:
  - **v0.2:** as designed in doc 04.
  - **v0.3:** stage-aware gate, display cutoff 0.40, hard joint-fit No Good Fit rule.
  - **v0.3b:** like v0.3, but joint-fit absence only *flags* a probable No Good Fit, which the LLM may confirm. The LLM may downgrade to No Good Fit, never upgrade.

### A.1 Deterministic layer (oracle and robustness)

| Metric | Threshold | Type |
|---|---|---|
| Oracle top-1 acceptable (recommendation cases) | ≥ 90% | G |
| Oracle unacceptable-in-top-3 | ≤ 5% | G |
| Oracle false gate block | ≤ 5% | G |
| Perturbation L2 (two moderate extraction errors) top-1 acceptable | ≥ 90% | G |
| Perturbation L1–L3 false No-Good-Fit | ≤ 5% | G |
| Perturbation L4 (wrong primary stage) top-1 acceptable | ≥ 70% | T |

### A.2 End to end with the model (held-out set required for Gate 0)

| Metric | Threshold | Type |
|---|---|---|
| Stage accuracy | ≥ 85% | G |
| Domain accuracy | ≥ 80% | G |
| Top-1 acceptable | ≥ 80% | G |
| Top-3 hit (an ideal approach in the top 3) | ≥ 85% | G |
| Unacceptable in top 3 | ≤ 5% | G |
| No Good Fit recall (incl. out of scope) | ≥ 75% | G |
| False No Good Fit / false out-of-scope on recommendation cases | ≤ 5% | G |
| Insufficient-context cases asked (not recommended) | 100% | G |
| False gate block on adequate cases | ≤ 5% | G |
| Typing violations (user-attributed statements without a verbatim quote) | ≤ 2% of statements | G |
| Hearsay handled (not presented as fact) | ≥ 90% | G |
| Must-surface coverage | ≥ 0.85 | T |
| Out-of-candidate recommendations after validation | 0 | G |
| Top-1 stability across 2 runs | ≥ 85% | T |
| Arabic vs English pass-rate gap | ≤ 10 points | G |

**Known limitations to document:** in-sample bias; judge calibration; only 29 cases (v0.1).

---

## B. Strategic Options generation & comparison

**Hypothesis.** The model generates 3–5 distinct, grounded options plus a baseline, assesses impact, effort, risk and feasibility with a stated basis and assumptions, and recommends a preferred option with trade-offs. Weighted scores are computed **in code**.

**Setup.** 8 scenarios (STR-03, PROC-01, RCA-01, ORG-02, STR-02, PRJ-03, RCA-03, STK-02; 2 Arabic) × 2 runs. Input: challenge + "agreed analysis so far" (the expected must-surface items). Harness `llm-suite.mjs b`.

| Metric | Threshold | Type |
|---|---|---|
| Structural pass (3–5 options + 1 baseline, valid preferred, assumptions, addresses) | ≥ 95% | G |
| Rubric overall mean (6 criteria, 1–5) | ≥ 4.0 | G |
| Any single criterion mean | ≥ 3.5 | G |
| No fabricated facts | ≥ 95% | G |
| Arabic vs English rubric mean gap | ≤ 0.3 | G |
| Preferred option = top weighted option | Reported | I |

---

## C. Three-level AI Critic

**Hypothesis.** Deterministic item-level rules catch calculation, date and structure defects with near-perfect precision. LLM framework- and project-level reviews catch semantic defects (methodology, logic, alignment, assumption risk) without nagging. Every finding carries an explanation and a correction, and nothing is changed automatically.

**Setup.** L1: `lib/critic-rules.mjs` on 60 generated artifacts with known defects (`c-critic-l1.mjs`), plus 40 labelled statements for certainty wording. L2/L3: 16 artifacts (`eval/critic-semantic.json`) × 2 runs (`llm-suite.mjs c`).

### C.1 Item level (deterministic)

| Metric | Threshold | Type |
|---|---|---|
| Precision on seeded structural/calculation defects | ≥ 95% | G |
| Recall on seeded structural/calculation defects | ≥ 95% | G |
| False alarms on clean artifacts | 0 | G |
| Certainty-wording rule (lexical) precision / recall | ≥ 85% / ≥ 75% | T (if missed, move the check to L2) |

### C.2 Framework and project level (model)

| Metric | Threshold | Type |
|---|---|---|
| Recall of seeded defects | ≥ 70% | G |
| Serious (Critical/High) precision on seeded artifacts | ≥ 80% | G |
| Serious false alarms on clean artifacts | ≤ 1 per 8 clean runs | G |
| Findings with explanation and correction | 100% | G |
| Auto-modification of content | 0 (by design: the Critic has no write path; accept = user action) | G |

---

## D. Editable BPMN visualisation

**Hypothesis.** A lane-aware layered layout with orthogonal routing, measured with the real fonts in headless Chromium (layout service, 02 §6.4a), produces correct, readable, editable process diagrams in Arabic (RTL) and English (LTR). It stays stable when users edit.

**Setup.** 6 processes (8, 11, 13, 14, 36, 70 nodes; 3–6 lanes) × AR/EN = 12 base layouts. 5 edit operations each (rename to long text, insert after, move to another lane, add branch, delete & reconnect) = 60 edits. `d-bpmn/run.mjs` (`--fixed-columns` variant).

| Metric | Threshold | Type |
|---|---|---|
| Node overlaps | 0 | G |
| Edges through nodes | 0 | G |
| Overlapping parallel edge segments (excluding fan-in merges) on reference processes P1–P4 | 0 | G |
| Edges through labels | 0 | G |
| Label overflow (rendered text vs box) | 0 | G |
| Canvas vs rendered text measurement parity | ≤ 1 px | G |
| Flow direction correct (LTR → / RTL ←) | 100% | G |
| Nodes inside their lane | 100% | G |
| Layout time, 70 nodes | ≤ 300 ms | G |
| Edit round trip (layout + render) p90 | ≤ 150 ms | T |
| Structural stability after edit (untouched nodes keep column & lane), each operation type | ≥ 90% | G |
| Positional stability (untouched nodes move < 5 px) | ≥ 80% | T |

---

## E. Arabic and English PowerPoint export (key product objective)

**Hypothesis.** We can generate native, fully editable PPTX: real tables, shapes, attached connectors and text, with no pictures. Arabic decks must be right-to-left correct, nothing may overflow, and the geometry must be shared with the screen (from D). Processes are paginated across slides at a readable size.

**Setup.** 2 processes × AR/EN = 4 decks (title, SWOT, 5×5 risk matrix + register, options comparison, action plan, Gantt with dependency connectors, paginated BPMN with off-page links). Generator `e-pptx/build_pptx.py` (python-pptx: pptxgenjs has no attached connectors). Validator `e-pptx/validate_pptx.py`: structure, RTL, HarfBuzz-shaped text fit, LibreOffice render, connector-follow test.

### E.1 Automated

| Metric | Threshold | Type |
|---|---|---|
| Pictures in decks | 0 | G |
| Connectors attached at both ends / dangling references | 100% / 0 | G |
| Arabic paragraphs with RTL set | 100% | G |
| Runs with a complex-script font set | 100% | G |
| Text overflow (HarfBuzz-shaped measurement) | 0 | G |
| Minimum font, process body text | ≥ 10 pt | G |
| Minimum font, any text (link markers, edge labels, footers) | ≥ 8 pt | T |
| LibreOffice opens and renders every slide | 100% | G |
| LibreOffice: connectors re-routed after a shape move | Reported | I |

### E.2 Manual (PowerPoint for Windows & Mac, Keynote)

| Check | Threshold | Type |
|---|---|---|
| Opens without a repair prompt | 100% | G |
| Arabic text shaped and right-to-left; tables mirror correctly; heat matrix stays non-mirrored by design | 100% | G |
| Moving a process shape drags its attached connectors | 100% | G |
| Text, table cells and connectors editable; no unexpected autofit shrink | 100% | G |
| Fonts: Platform-font and System-font modes both legible | 100% | T |

### E.3 Manual checklist (to run in week 2)
1. Open each deck in PowerPoint (Windows), PowerPoint (Mac) and Keynote; note any repair prompt.
2. On the BPMN slide, drag 3 tasks and 1 gateway; confirm connectors follow.
3. Edit an Arabic table cell and a task label; confirm RTL is kept.
4. Check the Gantt view: bars and dependency arrows follow the time direction (RTL in Arabic).
5. Present at 100% on a 1080p screen; read the smallest text from 2 m.

---

## F. AI cost & latency

**Hypothesis.** A single-framework analysis costs within budget and completes within the NFR latencies, at an effort level that still meets A–C quality.

**Setup.** Every model call in A–C is logged (`results/llm-runs.jsonl`: latency, tokens incl. cache, stop reason, cost at list price). Aggregator `f-cost-latency.mjs`. Effort sweep: high vs medium on A, B and C.

| Metric | Threshold | Type |
|---|---|---|
| Diagnosis latency p90 | ≤ 25 s | G |
| Re-rank latency p90 | ≤ 15 s | G |
| Options generation p90 | ≤ 30 s | T |
| Project-level critic p90 | ≤ 40 s | T |
| Cost per single-framework analysis (composed) | ≤ US$0.90 | G (working budget, 01 §7) |
| Cost per 4-step chain | ≤ US$3.00 | T |
| Refusal rate / parse-failure rate | ≤ 1% / ≤ 1% | G |
| Lowest effort level meeting A–C gates | Reported | I (input to pricing) |

---

## Readiness definitions used in doc 13

| Status | Meaning |
|---|---|
| **PASS** | All G thresholds met on the tested set; limitations documented |
| **PASS (in-sample)** | Met on in-sample data only; held-out confirmation pending |
| **PARTIAL** | Some G thresholds met, others failed or untested; a mitigation path exists |
| **FAIL** | A G threshold failed with no proven mitigation yet |
| **NOT RUN** | Could not be executed; reason stated |
