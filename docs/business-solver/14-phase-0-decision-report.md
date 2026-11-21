# 14: Phase 0 Decision Report

> Status: **2026-11-21. Beta-1 recommendation: NO-GO (unchanged). Full product implementation is not started.**
> Next milestone: **prove the AI consultant's reliability with actual model calls and independent evaluation.** GO will be recommended only when the exit criteria in §5 are met and documented in doc 13.
> This report supersedes the decision tables in docs 07, 10 and 13 where they differ.

## 1. Approved decisions (2026-11-21)

| # | Decision | Effect | Docs updated |
|---|---|---|---|
| A1 | **Team: 3 full-stack engineers** (+ AI engineer, designer, SME/content lead, product lead; Arabic editor 0.5; DevOps 0.5) | Workstreams in §6 | 07, 10 |
| A2 | **Target launch (GA): week 24** | Plan in §6 | 07 |
| A3 | **Launch scope: 13 frameworks** (SWOT, PEST/STEEPLE, 5 Whys, Cause & Effect, SIPOC, Impact/Effort, Risk Matrix, Action Plan + Gantt view, Stakeholder Map, Project Charter, Org Chart, Operating Model Canvas) + Strategic Options capability | Catalogue waves | 01 §8, 03 §7.1 |
| A4 | **BPMN and Value Stream Mapping deferred to ≈ week 28 (GA+1)**. BPMN stays out until connector-routing defects are fixed and diagrams pass visual and structural validation | Re-entry criteria §5.3; export slide type `process` disabled | 01, 03, 07, 15 |
| A5 | **Python-based PowerPoint export service**, subject to a clean service boundary and a documented API contract | Contract written: doc 15 (stateless, no DB/AI, internal-only, fail-closed validation, versioned JSON Schemas) | 02 (DR-26), 15 |
| A6 | **Recommendation engine: rule set v0.3b** (stage-aware sufficiency gate; weak candidates below 0.40 hidden; joint-fit gap only *flags* a probable No Good Fit) | Frozen in `phase0/lib/frozen-config.json` (combined hash `7df429b0…`) | 04 §4, §5.7 |
| A7 | **No Good Fit: the model may downgrade a recommendation to No Good Fit, but must never force an unsuitable framework** | Asymmetric rule; the prompt and validator enforce candidate-only recommendations | 04 §5.7, 02 §3.2 |
| A8 | Held-out set authored by a **blind AI author** (context-isolated agent), to be reviewed by a human SME before its results count for Gate 0 | Sealed `heldout-v1` (40 scenarios) | §3 |

Carried over from earlier approvals: decisions D1–D7, D9 and D12; information model v0.3 (Truth / Review / Decision statuses); segments (consultants, business professionals, department managers); human-review add-on deferred; product name undecided; pricing undecided until cost is measured.

## 2. Outstanding experiments

**No model-based measurement exists yet.** This session still has no API access (`ANTHROPIC_API_KEY` is not set). Everything below is prepared and verified in dry-run mode only.

| Exp. | Capability | Prepared | Blocked by | Run command (inside `phase0/`) | Est. effort once unblocked |
|---|---|---|---|---|---|
| A.2 | Problem diagnosis + framework recommendation (end to end) | ✅ Harness; tuning set (29) and **sealed held-out set (40)**; graders; blinded human-evaluation tool (doc 17) | API key | `node experiments/llm-suite.mjs a --set=heldout --effort=high --runs=2` (and `--effort=medium`) | ½ day |
| B | Strategic Options | ✅ Harness; 8 tuning + 6 held-out scenarios | API key | `… b --set=heldout …` | ¼ day |
| C.2 | AI Critic, framework & project levels | ✅ Harness; 16 seeded artifacts (authored by the rules author; not independent, see R6) | API key | `… c …` | ¼ day |
| F | Cost & latency | ✅ Aggregator; every call logs latency, tokens, cache use, stop reason, cost | Runs of A, B, C | `node experiments/f-cost-latency.mjs` | ¼ day |
| EV-5 | Human evaluation (20 scenarios) & AI-judge calibration | ✅ **Evaluator guide (doc 17, AR/EN)**; blinded tool `scripts/human-eval.mjs` (prepare → submit with SHA-256 receipt → compare); disagreement log with adjudication fields. Tested end to end on a synthetic fixture | A.2/B held-out results + an evaluator | Doc 17 §8 | 3–4 h evaluator + ½ day adjudication |
| SME | Human review of the held-out set | ✅ Set sealed; review = errata list, never edits | SME availability | Review `eval/heldout/heldout-v1.json`; record disagreements in `heldout-v1.REVIEW.md` | 1 day |
| E.2 | Manual PowerPoint (Windows, Mac) + Keynote validation | ✅ Validation pack (AR/EN, 10 slides each, steps in speaker notes); protocol doc 16 | Machines + testers | Doc 16 | 1 day |
| D-3 | BPMN port-aware router + incremental layout | Not started (deferred with BPMN to GA+1) | Prioritisation | — | 6–8 pd |

**Run order once the key is available:** (1) A.2 tuning set, as a smoke test of cost and errors at small `--runs=1`; (2) A.2, B, C held-out at high effort; (3) the same at medium effort; (4) F; (5) EV-5 calibration; (6) record in doc 13 Update 2. Budget cap per process: `--max-usd` (default US$15); the run stops when it is reached.

## 3. Held-out evaluation set and anti-tuning controls

| Control | Status | Evidence |
|---|---|---|
| Independent authorship | **Blind AI author** working from a brief containing only public framework descriptions, the taxonomy and the output format. Instructed not to read rules, matrices, prompts, the tuning set, results or docs, and not to use the web | Brief recorded in this session; author reported it modified nothing else |
| Composition | 40 scenarios, **20 Arabic / 20 English**: 16 clear (all 7 requested categories, ≥ 2 each), **10 ambiguous**, **6 incomplete-information (must ask)**, **5 out-of-catalogue (No Good Fit)**, **3 out-of-scope** | `heldout-v1.SEAL.json` |
| Structural validation | 40/40 valid; all framework ids valid; no id listed as both acceptable and unacceptable; ask-cases carry no recommendations | Validation run 2026-11-21 (content not printed or inspected by the rules author) |
| Sealing | SHA-256 `c020635a…de18e38` recorded and committed **before any scoring** | `phase0/eval/heldout/heldout-v1.SEAL.json` |
| Configuration freeze | **Eval version 1.** Rules, matrices, schemas, prompts and critic rules were hash-locked **before the held-out set was received**. On 2026-11-21, **before any model result existed**, the freeze scope was widened to include the graders, metrics and pricing table (`llm-suite.mjs`, `f-cost-latency.mjs`, `llm.mjs`). Rule and prompt files are byte-identical to the first freeze (verified); both freezes are recorded | `lib/frozen-config.json` (combined `945f2b7b…`), `lib/frozen-config-history.jsonl` |
| All sets sealed | Tuning set (29), held-out (40), critic seeded set (16), certainty set (40). Sealed sets can never be re-sealed: a change needs a new versioned file | `eval/**/*.SEAL.json` |
| Enforcement | The suite refuses to run **any** experiment if the config or any seal it uses doesn't match. `freeze-config` refuses to re-freeze once the version has a model result (`--new-eval-version=N` required). Results go to immutable per-run files `results/runs/ev<N>-<set>-<exp>-<effort>-<time>.json`, and every call log carries `run_id` and `eval_version`. CI and the pre-commit hook run `verify-integrity` | Negative tests 2026-11-21: tampered set → refused; tampered prompt → refused; re-freeze after results → refused; re-seal → refused |
| Usage rule | Once evaluation starts, **no change** to test scenarios, expected answers, scoring rules, graders or prompts within that version. Any change creates **eval version N+1**, with its own freeze, a new sealed held-out set where the old one has been seen, and separately reported results. Human-review errata and judge disagreements are collected for the next version, never applied in place | This section, doc 17 §6 |

**Limitation (honest):** the blind author is the same model family as the rules author, so biases may be correlated. A human SME review (errata only, no edits) is required before held-out results count for Gate 0. A second, human-authored set remains desirable before GA.

## 4. Security: API key setup with restricted environment secrets

### 4.1 Rules
- The key **never** appears in source code, `.env` files in the repository, commit messages, logs, results, screenshots, chat messages or shared environments.
- A **dedicated key** is used only for Phase 0 evaluation, with a **spend limit**. It is rotated after Phase 0 (or every 30 days), and revoked immediately if exposure is suspected.
- Least access: only the evaluation job can read it, and only after a human approves the run.

### 4.2 Recommended setup: GitHub Actions environment secret (restricted, reviewer-gated)
1. **Anthropic Console:** create a dedicated workspace (e.g. `bps-phase0-eval`) with a monthly spend limit. Create an API key in that workspace named `bps-phase0-eval-<yyyymm>`. Copy it once; don't store it anywhere else.
2. **GitHub → repository Settings → Environments → New environment `phase0-eval`:**
   - **Required reviewers:** the product lead (and one alternate).
   - **Deployment branches:** selected branches only (`main` and the Phase 0 branch).
   - **Environment secret** `ANTHROPIC_API_KEY`: paste the key here, in the GitHub UI only.
   - On private repositories, environment protection rules depend on the GitHub plan; verify yours supports required reviewers.
3. The workflow `.github/workflows/phase0-eval.yml` is already in the repository. GitHub only lists manually dispatched workflows that exist on the **default branch**, so merge that file (with `phase0/`) to the default branch through a reviewed PR.
4. **Run it:** Actions → `phase0-eval` → Run workflow (choose set, effort, runs, budget). The reviewer approves the job; only then is the secret released to it.
5. **What the workflow guarantees:**
   - Inputs are choice lists (no free-text injection).
   - The key is passed only to the experiment step as an environment variable; GitHub masks it in logs.
   - The repository is secret-scanned before the run, and the results are scanned before anything is committed.
   - Results are pushed to a separate branch `phase0-eval-results/run-<id>`, never to `main`.
   - Spending is capped per process.
6. **After Phase 0:** delete the key in the Console and the environment secret in GitHub.

### 4.3 Alternatives (if Actions can't be used)

| Option | Restriction level | Use only if |
|---|---|---|
| Claude Code cloud environment | **Weaker.** For Anthropic's own API the key can only be an *environment variable* (network secrets don't apply to `api.anthropic.com`). It is readable by commands in every session that uses that environment | You create a **dedicated personal environment** for Phase 0 only (not the Default, not organisation-shared), use the dedicated low-limit key, and remove the variable after the runs |
| A trusted local machine | Medium: key in the OS keychain, exported only in the terminal running the suite | Single operator; no `.env` file in the repo (`.gitignore` blocks `.env*` anyway) |

### 4.4 Controls already implemented and verified (2026-11-21)

| Control | Where | Verified |
|---|---|---|
| Key read only by the official SDK from the environment; never passed in code | `phase0/lib/llm.mjs` | Code review |
| Redaction of key-like strings and auth headers in any logged error | `redact()` in `lib/llm.mjs` | Test: `sk-ant-…` → `[REDACTED]` |
| Secret scanner (tracked files, staged changes, a directory, or full git history) | `phase0/scripts/check-no-secrets.sh` | Repo: clean · **full history: clean** · results: clean · planted fake key: detected (exit 1) |
| Opt-in pre-commit hook | `.githooks/pre-commit` (`git config core.hooksPath .githooks`) | Script verified |
| `.env*`, `*.pem`, `*.key` ignored | `/.gitignore` | — |
| Results scanned in CI before commit | `phase0-eval.yml` | — |
| Run manifest records config hash, set hash and git head; **no credentials** | `llm-suite.mjs` `MANIFEST` | Code review |

## 5. Beta-1 readiness criteria (Gate 0)

GO for Beta-1 requires **every** criterion below to be met and recorded in doc 13. Current status in the right-hand column.

### 5.1 AI capability gates: held-out set, both languages (thresholds from doc 12)

| # | Criterion | Threshold | Status |
|---|---|---|---|
| G1 | Stage accuracy | ≥ 85% | ⛔ not measured |
| G2 | Domain accuracy | ≥ 80% | ⛔ not measured |
| G3 | Top-1 acceptable / top-3 hit | ≥ 80% / ≥ 85% | ⛔ not measured |
| G4 | Unacceptable approach in top 3 | ≤ 5% | ⛔ not measured |
| G5 | No Good Fit + out-of-scope recall / false No Good Fit | ≥ 75% / ≤ 5% | ⛔ not measured |
| G6 | Incomplete-information cases asked (no recommendation) / false gate block | 100% / ≤ 5% | ⛔ not measured |
| G7 | Statement typing violations / hearsay handled | ≤ 2% / ≥ 90% | ⛔ not measured |
| G8 | Arabic vs English pass-rate gap | ≤ 10 points | ⛔ not measured |
| G9 | Strategic Options: structural pass / rubric mean / no fabricated facts | ≥ 95% / ≥ 4.0 (no criterion < 3.5) / ≥ 95% | ⛔ not measured |
| G10 | Critic L2/L3: recall / serious precision / serious false alarms on clean runs | ≥ 70% / ≥ 80% / ≤ 1 per 8 | ⛔ not measured |
| G11 | Cost per single-framework analysis / refusal & parse-failure rate | ≤ US$0.90 / ≤ 1% each | ⛔ not measured |
| G12 | Latency p90: diagnosis / recommendation | ≤ 25 s / ≤ 15 s | ⛔ not measured |

### 5.2 Evidence-quality gates

| # | Criterion | Status |
|---|---|---|
| Q1 | Held-out set sealed before scoring; config frozen; integrity checks pass | ✅ met |
| Q2 | Human SME review of the held-out set completed (errata documented; disputed cases excluded or re-graded, never rules changed) | ⏳ |
| Q3 | AI judge calibrated against the blinded human evaluator: checklist agreement ≥ 0.80 on ≥ 20 items, **Arabic and English each ≥ 0.75**, options rubric within ±1 for ≥ 80% (doc 17 §6) | ⏳ (guide, tool and workbook ready) |
| Q4 | Results reported with sample sizes and 95% confidence intervals; in-sample and held-out reported separately | ⏳ (method ready) |
| Q5 | Trust-model invariants I1–I10 have passing property tests in the statement library | ⏳ (Phase 0 foundation task E-5) |

### 5.3 Product & technical gates

| # | Criterion | Status |
|---|---|---|
| P1 | Manual PowerPoint (Win + Mac) checks pass per doc 16 §6; Keynote has no critical/high finding | ⏳ protocol & pack ready |
| P2 | Export service contract (doc 15) approved; schemas committed | ⏳ contract drafted |
| P3 | Critic L1 deterministic checks: precision/recall ≥ 95% on seeded defects | ✅ met (100% / 100%, synthetic set) |
| P4 | Deterministic recommender robust to diagnosis errors (perturbation L2 ≥ 90%, false No Good Fit ≤ 5%) | ✅ met in-sample (v0.3b: 100% / 0%) |

**BPMN / VSM re-entry criteria (for the GA+1 release, not for Beta-1):** all doc 12 §D gates on reference processes P1–P4 in AR and EN, i.e.:
- 0 overlapping parallel segments (excluding fan-in) and 0 edges through labels (currently 38 and 16);
- structural edit stability ≥ 90% for every operation type (currently 23% for delete, 69% for insert);
- visual review sign-off by the designer;
- `process` slides passing doc 16 T08 in PowerPoint Win/Mac at ≥ 10 pt body text (currently 8.4–9.1 pt for a 4-lane process).

## 6. Updated 3-engineer delivery plan

Week numbers count from the start of Phase 0 (2026-11-19 = week 1). **Gate 0 is planned for the end of week 4. Each week it slips (for example, waiting for API access) moves Beta-1, Beta-2 and GA by one week**, unless scope is reduced.

### 6.1 Roles
| Owner | Workstream |
|---|---|
| **FS1**, platform | Auth, workspace, statement library (invariants I1–I10), versioning/checkpoints, RLS, billing & ZATCA |
| **FS2**, frameworks & canvas | Layout service (font discipline + self-test), renderers, Builder (draft-first + workshop), framework definitions; BPMN router after GA |
| **FS3**, deliverables | Python export service (doc 15), PDF, PNG/SVG, translation versions, Critic L1 rules, export validation |
| **AI** | Diagnosis, recommendation (v0.3b), Strategic Options, Critic L2/L3, eval suite, cost tuning |
| DS / SME / AE / PL | UX & validation pack · KB content & held-out review · Arabic quality · decisions & design partners |

### 6.2 Timeline

| Weeks | Phase | FS1 | FS2 | FS3 | AI | Exit |
|---|---|---|---|---|---|---|
| 1–4 | **Phase 0** (in progress) | Scaffolding, schema + RLS, statement library | Layout-service hardening (font gate, self-test) | Export-service skeleton per contract; manual PPTX run (doc 16) | **Model runs A/B/C/F on held-out**; judge calibration | **Gate 0 (§5)** |
| 5–12 | **Beta-1** | Projects, conversation/SSE, versioning, history UI | Builder + 8 frameworks (SWOT, PEST/STEEPLE, 5 Whys, C&E, SIPOC, Impact/Effort, Risk, Action Plan) | PDF + PNG/SVG export; Critic L1 in product | Diagnosis, gate, recommendation v0.3b, No Good Fit, Strategic Options, Critic L2 | Beta-1 metrics (07 §4) on the live product |
| 13–20 | **Beta-2** | Chaining (ports), Assumptions Register, Problem-Solving Summary | +5 frameworks (Stakeholder Map, Charter, Gantt view, Org Chart, OMC) → **13** | **PPTX via Python service** (all launch slide types), translated-version export | Critic L3 + pre-export review; cost/effort tuning | Beta-2 metrics; doc 16 re-run on product exports |
| 21–24 | **GA hardening** | Billing (plans, mada, VAT, ZATCA), entitlements | Performance, accessibility (WCAG 2.2 AA) | Load test of export service; golden files | Final held-out run on release candidate | **GA (week 24), 13 frameworks** |
| 25–28 | **GA+1** | Share link + comments (moved from GA to protect capacity) | **BPMN + VSM**: port-aware router, incremental layout | `process` slide type re-enabled after T08 passes | — | BPMN/VSM re-entry criteria (§5.3) |

**Capacity notes:** the read-only share link and comments move from GA hardening to GA+1 to keep the three engineers' load realistic; this is reversible if the load allows. DOCX/XLSX, brand templates and co-editing stay in the Teams phase. Phase 0 evaluation work continues as a regression suite (sampled per PR, full nightly) throughout.

## 7. Unresolved risks

| # | Risk | Likelihood | Impact | Mitigation / owner |
|---|---|---|---|---|
| R1 | **Core AI capability unproven**: no model measurements | Certain until runs happen | Critical | API access via §4 (PL); run plan §2 (AI) |
| R2 | Gate 0 slips while waiting for access → GA slips one-for-one | Medium | High | Decide the access route this week; scope options in §6 |
| R3 | Stage misclassification by the model (a wrong stage puts an unacceptable approach in the top 3 in ~31% of perturbed cases, measured) | Medium | High | Gate G1 ≥ 85%; disambiguation question at low confidence |
| R4 | Blind AI author shares biases with the rules author | Medium | Medium | Human SME review (Q2); human-authored set before GA |
| R5 | LLM judge unreliable for semantic metrics | Medium | Medium | Calibration (Q3) before judged metrics count |
| R6 | Critic L2/L3 seeded set written by the rules author (not independent) | High | Medium | Commission a blind-authored critic set (same protocol as §3) before Gate 0 sign-off |
| R7 | PowerPoint behaviour differs from LibreOffice (connector rerouting, fonts) | Medium | High (key objective) | Doc 16 run in week 2 |
| R8 | Font availability on recipients' machines (Arabic) | Medium | Medium | Full-font packaging, glyph-coverage check, "system font" mode (doc 15 §6) |
| R9 | Python service adds a second runtime to operate | Certain | Low–Medium | Strict contract, separate image, golden-file CI (doc 15) |
| R10 | 3-engineer capacity for 13 frameworks + PPTX + billing in 20 build weeks | Medium | High | Share/comments moved to GA+1; weekly burn-up; next cut candidate: Org Chart → GA+1 |
| R11 | Model cost/latency over budget | Unknown | High | Measure (F); effort tuning; caching with a larger stable prefix |
| R12 | BPMN routing and edit stability (deferred) | Confirmed | Medium (post-GA) | D-3 router and incremental layout in weeks 25–28 |

## 8. Measured results to date (no model measurements)

All numbers come from committed code and files in `phase0/results/`. Details: doc 13.

| Area | Result | Status |
|---|---|---|
| Deterministic recommender (oracle, 22 cases, **in-sample**) | v0.2: 95.5% top-1; v0.3b: 100% top-1, 0 unacceptable in top 3 | In-sample only |
| Robustness (5,280 perturbed trials per variant) | v0.3b: 99.5–100% top-1 with 1–3 extraction errors, 0% false No Good Fit; 85.5% with a wrong primary stage (30.8% unacceptable in top 3) | Measured |
| Critic L1 (60 synthetic artifacts) | 100% precision, 100% recall, 0 false alarms; lexical certainty rule 75% / 60% (moved to L2) | Measured |
| BPMN (12 layouts, 60 edits) | 0 overlaps, 0 overflow, 0.04 px measurement parity, 100% RTL direction; **38 overlapping segments, 16 edge-label crossings, delete stability 23%** | Measured: **not launch-ready** (deferred) |
| PPTX decks (4) + validation packs (2) | 0 pictures; 100% connectors attached (16–20 per deck); 100% Arabic paragraphs RTL; 0 text overflow (HarfBuzz); all slides render in LibreOffice; 4-lane process body text 8.4–9.1 pt | Measured (automated); manual pending |
| Font finding | Arabic web-subset font lacks Latin digits (verified), which caused letter-spaced digits in render → ship full fonts + glyph-coverage check | Measured |
| Harness | Held-out dry run builds 40/40 diagnosis requests; options harness selects 6 held-out scenarios | Verified (no model calls) |
| Security | Secret scan clean: tracked files, **full git history**, results; detector and redaction verified | Measured |

## 8b. Status update 2026-11-21 (second update)

- **API:** still no credential in the build environment. No bypass attempted. Model experiments remain ready (protected-environment workflow, spending cap, redaction, run manifests).
- **Human evaluation:** evaluator guide (doc 17) and blinded tooling are ready. Blinding is enforced by process, and the tool was tested end to end on a synthetic fixture: no verdicts in the evaluator folder; compare refused before submission; tampered responses and re-submission refused.
- **PowerPoint:** Windows/Mac/Keynote packs are ready, plus a consolidated six-dimension results workbook with automatic exit criteria (doc 16 §4).
- **Integrity:** every set is sealed; the eval-v1 freeze covers rules, prompts, schemas, graders and pricing; versioned immutable runs; negative tests passed.
- **No new measured results.** Synthetic tests verify the tools only and are not reported as results.

**Next milestone, consolidated GO/NO-GO report.** It will be produced only after **all** of the following are done:
1. Model-based experiments A, B and C completed on the sealed held-out set (eval v1).
2. Human evaluator calibration completed (Q3).
3. Arabic **and** English each meet their documented thresholds (§5.1).
4. PowerPoint manual testing completed (P1; workbook says *EXIT CRITERIA MET: YES*, or failures documented).
5. Actual cost and latency measured (F).

The project stays in **Phase 0**. Beta-1 implementation is not started.

## 8c. Evaluation reporting requirements (2026-11-21, third update)

| Requirement | How it is enforced | Where |
|---|---|---|
| Calibration reported **by criterion and by language**; disagreements documented with rationales | `human-eval compare` (criterion × language, *n*, agreement, kappa, small-sample flags) and `human-eval summarise` (refuses incomplete adjudication; writes `disagreements-log.md`) | doc 17 §6 |
| Results **segmented** into clear / ambiguous / incomplete information / outside catalogue / out of scope | Evidence report §4 (segment gates S1–S6 per language: estimate, 95% CI on distinct scenarios, *k/n*, scenarios, threshold pass, statistically established); **approved and gating**, see §8d | doc 11 §4b, `eval/thresholds-v1.json` |
| **Arabic and English pass independently**; no compensation | Every gate evaluated per language; a gate passes only if both pass; pooled figures never decide. Tested on synthetic data (E5): AR 0.50 / EN 1.00 → gate fails | `thresholds-v1.json` principle; `evidence-report.mjs` |
| **Evidence classes kept separate** | Classes E1–E5 (doc 11 §4b, doc 13 §0b); only E1 can decide; synthetic inputs refused, or the report is watermarked and its verdict forced to INVALID | `evidence-report.mjs` |
| **No change to frozen components**; changes need a new evaluation version | Eval-v1 scoring freeze unchanged (`945f2b7b…`); reporting layer locked separately (`176e114b…`); all seals intact; locks refuse changes once v1 has results | `verify-integrity`, CI, pre-commit |
| NO-GO maintained until prerequisites are complete | The generator returns NO-GO while any of the 6 prerequisites is missing. Run on the real state today: **NO-GO**, 6 missing | `scripts/evidence-report.mjs` |

**Consolidated GO/NO-GO report.** Once the prerequisites exist, it will be generated by:
```
node scripts/evidence-report.mjs --effort=high --human=human-eval/round-1 --pptx=results/validation-pack/manual-summary.json
```
It contains: verdict and reasons; an evidence-class inventory; a prerequisite checklist; every approved gate with Arabic and English values, 95% intervals and pass/fail; segment × language tables; options, critic, cost and latency per language; calibration per criterion × language with the disagreement summary; PowerPoint exit criteria; failures; automatic limitations; and recommendations (any fix → new evaluation version). It is reviewed and signed off by a person before it is published as the GO/NO-GO decision.

## 8d. Segment thresholds approved and reporting configuration locked for eval v1 (2026-11-21, fourth update)

**Approved** (with the Ambiguous adjustment): S1 clear first framework ≥ 80%; S2 ambiguous **correct handling** ≥ 75% (clarifying questions, conditional recommendations, stated uncertainty or alternatives, or identifying missing information all count; a single framework is not required); S3 unsuitable framework in the top 3 ≤ 5% (clear + ambiguous); S4 incomplete information requests information = 100%; S5 outside catalogue identifies and communicates No Good Fit ≥ 75%; S6 out of scope declined or redirected = 100%. Exact numerators and denominators: doc 11 §4b and `eval/thresholds-v1.json` → `segment_acceptance`.

| Requirement | Implementation |
|---|---|
| Exact numerator and denominator for every threshold | Written in `thresholds-v1.json` for every S, A, B, C and F rate gate, and printed in the report |
| CIs and sample sizes | Each gate shows estimate, 95% Wilson CI (n = distinct scenarios, since repeated runs are not independent), *k/n* runs and scenario count |
| Threshold pass vs statistical confidence | Two separate flags per gate and language: *threshold pass* (decides) and *statistically established* (information only) |
| No aggregate compensation | S1–S6 are evaluated per language and per segment; each must pass in Arabic **and** English; pooled numbers never decide |
| Missing evidence → NO-GO | No data, denominator 0 or an uncalibrated judge → gate ⛔ not passed → NO-GO |
| Nature of thresholds | Stated in the file and in every report: operational acceptance thresholds, **not** statistically validated performance claims |

Consequential changes in the reporting layer only (the frozen scoring components are unchanged: config hash `945f2b7b…`): A.top1_acceptable, A.top3_hit and A.false_gate_block apply to clear cases only (ambiguity is governed by S2); the cross-language gap uses the segment "case correct" indicators. Known strictness: in the frozen harness a rule-decided No Good Fit has no generated explanation, so it counts against S5; fixing that requires eval v2.

Verified (E4/E5 only, not results): the real state → **NO-GO**, 6 prerequisites missing; a synthetic fixture (scratchpad only) with weak Arabic fails S1/S3/S5 in Arabic while English passes, and the language gap gate fails. The verdict is forced to INVALID on synthetic input. **Reporting layer re-locked for eval v1** (`lib/reporting-lock.json`, combined hash `14ee8eb6…`); any further change needs evaluation version 2.

## 8e. S7 Conditional Recommendation Assumption Integrity added; final eval-v1 reporting lock (2026-11-21, fifth update)

**Decision (Option B):** assumption integrity in conditional recommendations is a gating product-quality requirement. The S1–S6 thresholds are unchanged.

| Item | Definition |
|---|---|
| Threshold | ≥ 90%, per language (Arabic and English independently) |
| Eligible (denominator) | Ambiguous scenario-runs where a conditional recommendation was actually provided: status ok, ≥ 1 recommendation shown, model's rank-1 fit below "high". Clarification requests, No Good Fit, declines and unconditional recommendations are excluded and never penalised |
| Passing (numerator) | Judge "yes" on all of AI1 assumptions explicit, AI2 supported or labelled unverified, AI3 how the recommendation changes if they are wrong ("partial" fails) |
| Reported | Ambiguous runs, eligible runs, judged runs, passing runs, estimate, 95% CI on distinct scenarios, scenario count, per-item rates, reasons for non-eligibility, threshold pass vs statistically established |
| Measurement | `scripts/assumption-judge.mjs`: AI judge (same judge model and schema as the frozen config, imported unchanged) on stored experiment-A outputs. It refuses unless the config is frozen, the seal is intact, the reporting layer is locked and the source is a real held-out A run |
| Calibration | Blinded: `human-eval prepare --aij` adds AI1–AI3 for **every** eligible case; the judge's verdicts stay in `coordinator/` until submit. Per language: all eligible cases rated, ≥ 12 item pairs, item agreement ≥ 0.80, adjudication complete |
| Cannot evaluate → NO-GO | No eligible case, an eligible run without a complete verdict, an eligibility mismatch with the A outputs, a judge run on another A run or lock, or failed calibration → S7 not established → NO-GO |

**Known limitations (reported automatically).** The frozen re-rank schema has no dedicated "assumptions" or "if wrong" field, so the judge assesses the free-text reasons and cautions; S7 may therefore fail, and that would be a genuine product finding for eval v2. There are at most 10 eligible runs per language (5 ambiguous scenarios × 2 runs). If the model mostly asks for clarification on ambiguous cases, S7 or its calibration may be not established and the verdict stays NO-GO; running with `runs=3` raises the ceiling to 15.

**Workflow:** `phase0-eval` runs the S7 judge after experiment A. Verified only on synthetic fixtures in the scratchpad (E5), and the real state stays NO-GO with 7 prerequisites missing:
- An Arabic 3/5 result fails while English 10/10 passes ("not established" statistically).
- Without calibration, S7 is not established.
- An incomplete verdict makes S7 not established.
- An eligibility mismatch is reported as a problem.
- Clarification runs are excluded.

**Evaluation scope is now closed for eval v1.** The reporting layer has been re-locked (combined hash `5a92509c…`; it now also covers `lib/assumption-integrity.mjs` and `scripts/assumption-judge.mjs`), and the lock is recorded in `lib/frozen-config-history.jsonl`. No further thresholds or scope changes; any change after the first run requires eval v2.

## 9. Recommendation

**Beta-1: NO-GO (unchanged).** No full product implementation.

**To reach a supported GO:**
1. Provision the restricted key (§4.2): product lead, this week.
2. Run A, B and C on the sealed held-out set at two effort levels, then F (§2): AI engineer, about 1–2 days.
3. Complete the SME review of the held-out set, judge calibration, and a blind-authored critic set (Q2, Q3, R6).
4. Run the manual PowerPoint/Keynote protocol (doc 16).
5. Record everything in doc 13 Update 2 and re-assess against §5.

A GO will be recommended only if every gate in §5.1–5.3 is met on held-out data in both languages.
