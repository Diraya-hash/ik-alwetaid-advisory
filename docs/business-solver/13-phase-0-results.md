# 13: Phase 0 Results

> Status: **in progress. Update 1 (2026-11-19).** This document is completed as experiments run. Every number below comes from a file in `/phase0/results/` produced by the committed code. Nothing is estimated unless explicitly marked *estimate*.
> Thresholds: doc 12. Test cases: doc 11. Plan: doc 10.

## 0. Execution status and blocker

| Experiment | Deterministic / offline part | Model-based part |
|---|---|---|
| A. Diagnosis & recommendation | ✅ Executed (oracle + robustness) | ⛔ **Not run**: no Anthropic API key in this environment |
| B. Strategic Options | ✅ Weighted scoring & "too close" checks executed (inside C L1) | ⛔ **Not run** (same reason) |
| C. Three-level Critic | ✅ Level 1 executed | ⛔ Levels 2–3 **not run** (same reason) |
| D. Editable BPMN | ✅ Executed | n/a |
| E. AR/EN PowerPoint | ✅ Automated checks executed | Manual PowerPoint/Keynote checks **not run** (apps not available here) |
| F. Cost & latency | Harness ready | ⛔ **Not run** (needs model runs) |

**Blocker (P0-D0).** The model-based experiments need `ANTHROPIC_API_KEY`. In this cloud environment it can only be added as an **environment variable** in the environment's settings, where commands in sessions using that environment can read it. A new session picks it up. Once it's added, the full suite runs in about a day: `node experiments/llm-suite.mjs a|b|c` then `node experiments/f-cost-latency.mjs`. A dry run already confirms that all 53 primary requests (29 diagnosis, 8 options, 16 critic) build, and that all five output schemas convert to the structured-output format. *Estimated* cost of one full sweep at two effort levels: roughly US$25–40 (based on request sizes and list prices; to be replaced by F's measurement).

## 0b. Evidence classes used in this document [2026-11-21]

| Class | Meaning | Can it decide GO/NO-GO? |
|---|---|---|
| **E1 Model evaluation: held-out** | Real model calls on the sealed, independently authored held-out set, with frozen configuration | **Yes**, the only class that can |
| **E2 Model evaluation: tuning (in-sample)** | Real model calls on the tuning set (written by the rules author) | No, information only |
| **E3 Deterministic experiment** | Real code on test data with no model (rules oracle/perturbation, Critic L1, BPMN layout, PowerPoint automated checks) | No, supporting evidence |
| **E4 Tool validation** | Checks that harnesses, integrity controls, security controls and workbooks work | No |
| **E5 Synthetic test** | Made-up data used only to test tools | **Never**; never reported as a result |

Classes of the results so far: §A.1 and §A.1b (oracle, perturbation) = **E3**; §C.1 (Critic L1) = **E3**; §D (BPMN) = **E3**; §E automated deck checks and validation packs = **E3**; harness dry runs, integrity and security checks, workbook and calibration-tool checks = **E4**; all synthetic fixtures = **E5** (tool tests only, not results). **No E1 or E2 result exists yet.**

## 1. Scorecard

| Exp. | Capability | Result | Status |
|---|---|---|---|
| A.1 | Deterministic recommendation layer (rules, gate, No Good Fit) | v0.2 frozen: 95.5% top-1 on gold diagnoses; robust to extraction errors. v0.3b: 100% / robust, **in-sample** | **PASS (in-sample)** |
| A.2 | LLM diagnosis + recommendation end to end | — | **NOT RUN** |
| B | Strategic Options generation | — (scoring logic verified) | **NOT RUN** |
| C.1 | Critic: item level (deterministic) | 100% precision / 100% recall on 57 seeded defects; 0 false alarms on 15 clean artifacts. Lexical certainty rule 75% / 60% (target missed) | **PASS** (+ one target missed → moved to L2) |
| C.2 | Critic: framework & project level (model) | — | **NOT RUN** |
| D | Editable BPMN (AR/EN) | Geometry, measurement, RTL, lanes, speed all pass; **routing quality and edit stability fail** | **PARTIAL** |
| E | Editable AR/EN PowerPoint | Native-only, attached connectors, 100% RTL, 0 overflow; **4-lane process below 10 pt**; manual checks pending | **PARTIAL** |
| F | Cost & latency | — | **NOT RUN** |

## 2. Results by experiment

### A. AI diagnosis & framework recommendation

#### A.1 Deterministic layer, oracle mode (perfect diagnoses)

Files: `results/a-oracle-v0.2.json`, `a-oracle-v0.3.json`, `a-oracle-v0.3b.json`.

| Metric (29 scenarios; 22 recommendation cases) | v0.2 (frozen, as designed) | v0.3 (in-sample fixes) | v0.3b (in-sample, LLM-confirmed NGF) |
|---|---|---|---|
| Overall pass | 25/29 | 28/29 | 27/29 |
| Top-1 acceptable | **95.5%** (21/22) | 100% | 100% |
| Top-3 hit | 95.5% | 100% | 100% |
| Unacceptable in top 3 | 1 case (RSK-03: PEST shown as 2nd for an audit-findings case) | 0 | 0 |
| False gate block | 1 case (STR-04: "which of 23 ideas first?" blocked for lack of symptom/impact) | 0 | 0 |
| No Good Fit recall (4 cases) | 50% (only the 2 out-of-scope cases) | 75% (adds NGF-01) | 50% decided by rules + NGF-01 flagged for LLM confirmation |
| No Good Fit precision | 100% | 100% | 100% |
| Insufficient-context cases asked | 3/3 | 3/3 | 3/3 |
| Confusable sets passed | 14/17 | 17/17 | 17/17 |
| Arabic / English | 8/11 · 17/18 | 10/11 · 18/18 | 10/11 · 17/18 (NGF-01 is only flagged, so it counts as a fail until the LLM confirms) |

**What v0.2 got wrong, and why (design findings):**
1. **The gate is biased towards "problem" requests.** Its core slots weight *symptom* and *impact*, so decision-type requests ("which ideas first?") were blocked. v0.3 makes symptom and impact optional for decision/design stages.
2. **Weak candidates fill the top 3.** Low-scoring approaches (normalised score < 0.40) were shown as recommendations. v0.3 hides them.
3. **The rule-based No Good Fit check misses out-of-catalogue problems.** A score threshold can't tell "fits the stage" from "fits the purpose". Customer-journey design (NGF-01) scored 0.59 for BPMN. Consumer-perception mapping (NGF-02) scored 0.75 for PEST and is still missed by every rule variant: **only purpose-level judgement (the model) can catch it.**

#### A.1b Robustness to diagnosis errors (perturbation)

Files: `results/a-perturbation-v0.2|v0.3|v0.3b.json`. 22 cases × 60 random perturbations × 4 levels = 5,280 trials per variant.

| Level | v0.2 top-1 / unacceptable-in-top-3 / false NGF | v0.3 | **v0.3b** |
|---|---|---|---|
| L1: one mild error | 95.5% / 4.5% / 0% | 93.9% / 0% / **6.1%** | **100% / 0% / 0%** |
| L2: two moderate errors | 95.5% / 7.1% / 0% | 88.0% / 0.8% / **12.0%** | **100% / 1.2% / 0%** |
| L3: three moderate errors | 95.1% / 7.5% / 0% | 83.6% / 1.1% / **16.3%** | **99.5% / 2.0% / 0%** |
| L4: wrong primary stage | 82.7% / **31.5%** / 0% | 17.0% / 1.0% / **81.1%** | 85.5% / **30.8%** / 0% |

**Findings:**
- A *hard* joint-fit No Good Fit rule (v0.3) is **brittle**: small extraction errors produce false "no fit" answers. **Rejected.**
- **v0.3b** keeps rules robust and delegates the "is there really no fit?" judgement to the model, as an asymmetric downgrade-only rule. It flags 3.7–4.5% of perturbed cases for model confirmation. **Recommended (P0-D3), subject to held-out confirmation.** This changes 04 §5.7, where the rule currently cannot be overridden by the LLM; under v0.3b the LLM may downgrade to No Good Fit but never upgrade.
- **Stage classification is the single most important model output.** With a wrong primary stage, roughly 31% of cases show an unacceptable approach in the top 3 under every variant. Stage accuracy ≥ 85% is therefore a gate (12 §A.2). A disambiguating question is needed when the model's stage confidence isn't high.

**Limitations.** In-sample: the same author wrote the scenarios, gold slots and seed matrices, and v0.3/v0.3b were designed after seeing v0.2 fail on this set. Wilson 95% CI for 22/22 ≈ 85–100%. **Not valid for Gate 0 until re-run on the independent held-out set (EV-2).**

#### A.2 End to end with the model: NOT RUN
Harness ready (`llm-suite.mjs a`): diagnosis (structured, AI cannot emit "verified"), mapping to slots, v0.3b rules, constrained re-rank, judge for must-surface and hearsay, stability across runs. Dry run: 29/29 requests build. Diagnosis request ≈ 1.1–1.3k input tokens.

### B. Strategic Options: NOT RUN (model)
The deterministic parts are verified in C.1: weighted score computed in code (100% correct on seeded data) and the "too close to call" check (4/4 seeded cases caught). Generation quality, grounding, Arabic quality and preferred-option logic are **unmeasured**.

### C. Three-level AI Critic

#### C.1 Item level (deterministic): `results/c-critic-l1.json`

| Metric | Result | Threshold | |
|---|---|---|---|
| Seeded defects / findings | 57 / 57 | — | |
| Precision | **100%** | ≥ 95% | ✅ |
| Recall | **100%** | ≥ 95% | ✅ |
| False alarms on 15 clean artifacts | **0** | 0 | ✅ |
| Rules covered | 13 (risk score = L×I, scale range, owner, high risk without mitigation; weights sum, score range, weighted-score calculation, too-close-unflagged; date order, owner, dependency order, dependency cycle, after deadline) | | |
| Certainty-wording (lexical, 40 AR/EN statements) | precision **75%**, recall **60%** | ≥ 85% / ≥ 75% (target) | ❌ |

**Findings.**
- Deterministic checks are reliable **for the defect classes they implement**. The seeded set is synthetic, so this proves correct implementation, not real-world coverage.
- The lexical certainty rule fails on paraphrases ("is bound to", «من الواضح», «قطعًا») and negations ("certainly not", «ليس من المؤكد»). **Decision: drop it as an L1 rule; certainty wording becomes an L2 (model) check.** Not tuned further, to avoid overfitting 40 items.
- The first run reported 94.7% recall. The cause was a **bug in our test generator** (the injected dependency "cycle" didn't always close), not in the rule. It was fixed and re-run. This is why seeded tests need their own review.

#### C.2 Framework & project level (model): NOT RUN
16 artifacts ready (8 framework, 4 project, 4 clean; 14 seeded semantic defects; 5 Arabic). Harness measures recall, serious precision, false alarms on clean artifacts, and explanation/correction presence.

### D. Editable BPMN visualisation: `results/d-bpmn.json`, `d-bpmn-fixed.json`, screenshots `results/d-bpmn/*.png`

| Metric | Result | Threshold | |
|---|---|---|---|
| Node overlaps (12 layouts; 60 edits) | 0 · 0 | 0 | ✅ |
| Edges through nodes | 0 · 0 | 0 | ✅ |
| Label overflow (rendered) | 0 of 470 lines · 0 after edits | 0 | ✅ |
| Canvas vs rendered measurement parity | **0.04 px** max | ≤ 1 px | ✅ |
| Flow direction correct (AR right-to-left, EN left-to-right) | 100% | 100% | ✅ |
| Nodes inside lane | 100% | 100% | ✅ |
| Layout time (70 nodes, 6 lanes) | ≤ 3.8 ms; render ≤ 5.4 ms | ≤ 300 ms | ✅ |
| Edit round trip p90 | 42 ms | ≤ 150 ms | ✅ |
| Overlapping parallel edge segments, P1–P4 | 7 per language (all 12 layouts: 38) | 0 | ❌ |
| Edges through labels (all layouts) | 16 | 0 | ❌ |
| Edge crossings | 1 (P1–P4), 4 (P5, P6) | I | — |
| Structural stability after edit | rename 100% · add branch 100% · move lane 93% · insert **69%** · delete **23%** | ≥ 90% each | ❌ |
| Positional stability | 56% (62% with fixed columns) | ≥ 80% (T) | ❌ |

**Findings (with evidence from iterations):**
1. **Arabic measurement parity is achievable, but only with discipline.** Three real pitfalls were found and fixed:
   - A canvas measuring context created before the web fonts loaded kept returning fallback metrics (up to 24 px error).
   - Text was measured at weight 500 but rendered at 400 (3–5 px error).
   - The weight-400 face wasn't preloaded.

   **Layout-service rules (adopt in 02 §6.4a):** identical font spec for measuring and rendering; preload every face used; create the measuring context after the font gate; refuse to serve until a canvas-vs-rendered self-test agrees within 1 px.
2. **ELK doesn't support swimlanes natively.** The PoC used a custom lane-aware layered layout. It is fast and correct for placement, but its **edge routing is not good enough**: gateway branches leave from a shared vertex and overlap, and lines cross external labels. **A port-aware orthogonal router is required** (D-3; e.g. ELK layered with port constraints inside lanes, or a libavoid-class router). Visual review caught these defects before the metrics did; the metrics now include them.
3. **Recomputing the layout from scratch is unstable.** Insert and delete shift whole downstream layers. **Incremental layout (pinning existing layers and lanes) is required** for a good editing experience. Fixed column widths alone only lifted positional stability from 56% to 62%.
4. **Large processes are very wide** (70 nodes ≈ 13,800 px). This feeds E: pagination is mandatory for slides.

### E. Arabic & English PowerPoint export: `results/e-pptx.json`, decks `results/e-pptx/*.pptx`, renders `results/e-pptx/render/`

| Metric (4 decks: P2/P4 × AR/EN; 8–9 slides each) | Result | Threshold | |
|---|---|---|---|
| Pictures | **0** | 0 | ✅ |
| Connectors attached at both ends / dangling | **100%** (18–20 per deck) / 0 | 100% / 0 | ✅ |
| Arabic paragraphs with RTL | **100%** (170–173 per Arabic deck) | 100% | ✅ |
| Runs with complex-script font | 100% | 100% | ✅ |
| Text overflow (HarfBuzz-shaped, 170 frames per deck) | **0** | 0 | ✅ |
| LibreOffice renders all slides | 4/4 decks | 100% | ✅ |
| Process body font | P4: 10.0 pt ✅ · P2 (4 lanes): **8.4 pt EN / 9.1 pt AR** ❌ | ≥ 10 pt | ❌ |
| Smallest text anywhere (link markers, edge labels, footer) | 7.0–8.0 pt | ≥ 8 pt (T) | ⚠️ |
| Connector follow after a moved shape (LibreOffice re-save) | AR 2/3, EN 1/3 re-routed; 3/3 stay attached | I | — |
| Manual PowerPoint (Win/Mac) and Keynote checks | **not run** | 100% | ⏳ |

**Findings:**
1. **Library choice.** `pptxgenjs` (TypeScript, as assumed in DR-02) has **no attached connectors**. `python-pptx` does, and it produced fully native, editable decks. Ellipse connection sites were verified against LibreOffice's OOXML preset table (8 sites: 0 top, 2 left, 4 bottom, 6 right). **Decision needed: P0-D2** (Python export sidecar recommended).
2. **Process diagrams must be paginated, not shrunk.** Fitting P2 (14 nodes, 4 lanes) on one slide gave about 5.6 pt text. Pagination by layer ranges with off-page link markers (BPMN link events) fixes width. **Height becomes the limit:** 4 lanes force about 8.4–9.1 pt. A slide-specific layout is needed (compact lane heights, or splitting by lane groups) to hold 10 pt.
3. **The connector trade-off.** Attached connectors make diagrams genuinely editable (they follow moved shapes), but the **presentation app routes the elbows itself**, so our computed routes aren't preserved. This is acceptable for editability, but the visual quality in PowerPoint must be checked manually (E.3).
4. **Table columns must be sized from measured content.** Hand-set widths overflowed; content-measured widths eliminated all table overflow.
5. **Our validator had a bug** (it treated zero margins as unset), which overstated overflows in run 2. It was fixed, and the numbers above are from the corrected validator.
6. **Right-to-left details confirmed in render:**
   - RTL tables mirror their columns.
   - Arabic-Indic digits are applied.
   - The heat matrix intentionally keeps mathematical axes.
   - Gantt time runs right to left, with names on the right.
   - BPMN flow is mirrored, with lane headers on the right.

### F. Cost & latency: NOT RUN
Aggregator ready (`f-cost-latency.mjs`): per-route p50/p90 latency, tokens, cache-read share, cost, refusal/parse-failure rates, and composed cost per analysis and per 4-step chain. Note for interpretation: the Phase 0 system prompts are short (~1.1–1.3k tokens), possibly below the model's minimum cacheable prefix, so Phase 0 will **understate** caching benefits relative to production prompts that carry the KB.

## 3. Design changes indicated by the evidence

| # | Change | Evidence | Docs to update (after approval) |
|---|---|---|---|
| 1 | Stage-aware sufficiency gate (symptom/impact optional for decision/design stages) | A.1 STR-04 | 04 §4.1 |
| 2 | Hide candidates below normalised 0.40 | A.1 RSK-03 | 04 §5.7 |
| 3 | No Good Fit: rules decide clear cases; a joint-fit gap only flags; **the LLM may downgrade to No Good Fit, never upgrade** (v0.3b) | A.1, A.1b | 04 §5.7, 02 §3.2 |
| 4 | Stage accuracy as a hard gate + a stage-disambiguation question when confidence isn't high | A.1b L4 | 04 §5.4, §11 |
| 5 | Certainty-wording check moves from L1 rules to the L2 Critic | C.1 | 04 §7.1 |
| 6 | Layout-service font discipline + startup self-test | D finding 1 | 02 §6.4a |
| 7 | Port-aware router + incremental layout before BPMN ships | D findings 2–3 | 02 §6.4, 07 |
| 8 | Python export sidecar for PPTX (attached connectors) | E finding 1 | DR-02 amendment, 02 §1.3 |
| 9 | Slide-specific process layout: pagination with link markers, lane compaction, 10 pt floor | E finding 2 | 02 §3.6, 09 §10 |
| 10 | Content-measured table column widths in all exports | E finding 4 | 02 §3.6 |
| 11 | Structured-output schemas built with Zod v4 (the SDK helper requires it) | Dry run | 02 §1.3 |

## 4. GO / NO-GO recommendation for Beta-1

### Recommendation: **NO-GO today: not enough evidence yet. This is not a negative verdict on feasibility.**

**Why NO-GO.** Phase 0's objective is to prove that we can build a *reliable AI management consultant*. That rests on A.2, B, C.2 and F: the model's diagnosis, recommendations, options, critique, cost and latency. **None of these has a single measured result**, because the environment has no API access. Declaring GO would mean declaring the core capability ready because the prototype code runs, which is exactly what we agreed not to do.

**What the evidence does support (proven, with limitations):**
- The **deterministic intelligence layer** is sound and robust when diagnoses are good (in-sample). Its main sensitivity is stage classification.
- The **trust model** can be enforced in code. The AI schemas cannot express "verified"; the three-status model is defined with testable invariants.
- **Deterministic Critic checks** are reliable.
- **Editable Arabic/English PowerPoint** is technically feasible with native objects, attached connectors, correct RTL and zero overflow. It needs a Python sidecar, slide-specific process layout and a manual PowerPoint check.
- **BPMN** is feasible in rendering and measurement, but **not yet good enough** in routing and edit stability. It is the riskiest visual, and it is scheduled for Beta-2.

### Conditions for GO (Gate 0)

| # | Condition | Owner | Est. effort |
|---|---|---|---|
| 1 | Provide API access (P0-D0) and run A, B, C (high + medium effort) and F | PL → AI | 1–2 days |
| 2 | Independent held-out scenario set (EV-2), then re-run A on it, with v0.3b frozen first | SME (2nd author), AI | 6–8 pd |
| 3 | A.2, B and C.2 meet all G thresholds on held-out data in **both** languages; F within budget | — | — |
| 4 | Manual PowerPoint (Win/Mac) + Keynote checklist passes (12 §E.3) | DS, FS3 | 1 pd |
| 5 | Decisions P0-D1 (GA scope with 3 engineers), P0-D2 (PPTX technology), P0-D3 (rule set) | PL | — |

**If conditions 1–4 are met:** GO for Beta-1. Beta-1 frameworks don't include BPMN, so D's open items (router, incremental layout) move into the Beta-2 plan, or after GA under P0-D1(b).
**If A.2 misses its gates:** iterate on prompts and the slot extraction (stage first). The deterministic layer is not the bottleneck. Re-test before any Beta-1 build starts.

## 5. Reproduce

```bash
cd phase0
npm install
pip install python-pptx fonttools brotli uharfbuzz
```

```bash
node experiments/a-oracle-recommender.mjs --ngf=v0.2
```

```bash
node experiments/a-perturbation.mjs --variant=v0.3b
```

```bash
node experiments/c-critic-l1.mjs
```

```bash
node experiments/d-bpmn/run.mjs
```

```bash
python3 experiments/e-pptx/build_pptx.py && python3 experiments/e-pptx/validate_pptx.py
```

```bash
node experiments/llm-suite.mjs a --runs=2 --effort=high
```

```bash
node experiments/f-cost-latency.mjs
```

## 6. Change log
| Update | Date | Content |
|---|---|---|
| 1 | 2026-11-19 | A.1, A.1b, C.1, D, E (automated) executed; A.2, B, C.2, F blocked on API access; GO/NO-GO: NO-GO pending evidence |
| 6 | 2026-11-21 | **No new measurements.** S7 Conditional Recommendation Assumption Integrity (≥ 90%, ambiguous cases with a conditional recommendation only, calibrated AI judge, per language) added in the reporting layer; frozen scoring unchanged; final eval-v1 reporting lock recorded. Real state → NO-GO (7 prerequisites missing). Evaluation scope closed for eval v1 |
| 5 | 2026-11-21 | **No new measurements.** Segment thresholds S1–S6 approved (Ambiguous = correct handling) and made gating per language; numerators/denominators documented; 95% CIs on distinct scenarios with *k/n* and scenario counts; threshold pass vs statistically established reported separately; missing evidence → NO-GO; eval-v1 reporting layer re-locked. Real state → NO-GO (6 prerequisites missing). Operational thresholds, not validated performance claims |
| 4 | 2026-11-21 | **No new measurements.** Reporting readiness (E4 tool validation): thresholds-v1 with per-language independent gates; segmentation by 5 categories; per-criterion × language calibration and an adjudicated disagreement log; consolidated evidence-report generator (real current state → NO-GO, 6 prerequisites missing); reporting layer locked; evidence classes E1–E5 defined |
| 3 | 2026-11-21 | **No new measurements.** Prepared and verified (synthetic tests only, not results): blinded human-evaluation tool + guide (doc 17); six-dimension PowerPoint results workbook; integrity hardening (all sets sealed, eval-v1 freeze incl. graders/pricing, versioned immutable runs, negative tests passed). Project remains in Phase 0 |
| 2 | 2026-11-21 | **No model measurements (still no API access).** Added: blind-authored held-out set (40; 20 AR) sealed; config frozen with enforced integrity checks; held-out dry run 40/40; PowerPoint validation packs (2 × 10 slides): 0 pictures, 16/16 connectors attached, 170/170 Arabic paragraphs RTL, 0 overflow, LibreOffice render 10/10; font finding (Arabic web subset lacks Latin digits → full fonts required); secret scans clean incl. full git history. NO-GO unchanged (doc 14) |
