# 10: Phase 0 Execution Plan: Foundations & De-risking

> Status: **authorised 2026-11-19.** Baseline: design pack v0.2 (+ information model v0.3, doc 03 §3).
> Objective: **prove that we can build a reliable AI management consultant before investing in the full product.** Phase 0 tests the core intelligence and the hardest technical claims against measurable thresholds (doc 12). It does not just set up infrastructure.
> Prototypes live in `/phase0`, isolated from any production app (own `package.json`, never imported by `apps/*`).

## 1. Scope lock (decisions recorded 2026-11-19)

| # | Decision | Effect on the plan |
|---|---|---|
| S1 | **Team: 3 full-stack engineers** (+ AI engineer, designer, SME/content lead, product lead; Arabic editor 0.5; DevOps 0.5) | Phase 0 stays 4 weeks. The GA plan needs a choice between scope and date (§6, decision P0-D1) |
| S2 | **Initial segments: consultants, business professionals, department managers** | Golden set, examples and usability recruits come from these segments. Government/enterprise needs (residency, SSO) stay out of Phase 0 (closes open decision D10) |
| S3 | **Human consultant review (paid add-on): deferred** | No Phase 0 work (closes D14 as deferred) |
| S4 | **Product name: undecided** | Docs keep the identity "Business Problem Solver"; code name `bps` |
| S5 | **Editable PowerPoint is a key product objective** | D8 resolved toward **native, editable objects for every visual type, process diagrams included**. A picture fallback is no longer an acceptable default; at most it is a user-chosen export option. Experiment E tests this directly |
| S6 | **Information model: Truth / Review / Decision are separate statuses** | Done in doc 03 §3 (v0.3), with invariants I1–I10. User acceptance of an AI suggestion never establishes factual accuracy |
| S7 | Phase 0 may build **prototypes only**, no feature implementation | All work in `/phase0`; production scaffolding (E-1…E-3 in 07) only where it doesn't depend on Phase 0 results |

## 2. Experiments (priority order as instructed)

| ID | Experiment | Core question | Spec | Results |
|---|---|---|---|---|
| **A** | AI diagnosis & framework recommendation | Does the hybrid (LLM diagnosis + deterministic rules + LLM re-rank) pick acceptable approaches, refuse to force a fit, and type statements honestly, in Arabic and English? | 12 §A | 13 §A |
| **B** | Strategic Options generation & comparison | Are generated options distinct, grounded, honestly assessed, with a defensible preferred option? | 12 §B | 13 §B |
| **C** | Three-level AI Critic | Does it find seeded defects without nagging, always with an explanation and a correction? | 12 §C | 13 §C |
| **D** | Editable BPMN visualisation | Can we lay out, render and edit lane-based processes in AR/EN with correct RTL and stable geometry? | 12 §D | 13 §D |
| **E** | Arabic & English PowerPoint export | Can we produce native, editable PPTX (tables, matrices, Gantt, BPMN with attached connectors) that is RTL-correct and has no text overflow? | 12 §E | 13 §E |
| **F** | AI cost & latency | What does an analysis really cost, and how long does it take, per route and effort level? | 12 §F | 13 §F |

## 3. Work breakdown

Owner key: **PL** product lead · **AI** AI engineer · **FS1–FS3** full-stack engineers · **DS** designer · **SME** methodology/content lead · **AE** Arabic editor. Effort is in person-days (pd). The **Status** column records what was executed in the 2026-11-19 session (by Claude, as prototypes).

### 3.1 Evaluation assets (doc 11)

| ID | Task | Owner | Depends on | Acceptance criteria | Effort | Status |
|---|---|---|---|---|---|---|
| EV-1 | Scenario suite v0.1: 29 scenarios × 7 categories + No-Good-Fit + insufficient context, ≥ 1/3 Arabic, with expected diagnoses and acceptable recommendations | SME, AE | — | Schema-valid; each scenario has expected domain/stage/gate, ideal/acceptable/unacceptable sets, must-surface items | 4 pd | ✅ Drafted (29; 11 AR). **Not SME-reviewed** |
| EV-2 | **Independent held-out set**: ≥ 30 more scenarios written by a *different* author (not the seed-matrix author), plus ≥ 15 per confusable set | SME (2nd author), AE | EV-1 | Authored blind to `lib/catalogue.mjs`; inter-rater κ ≥ 0.6 on top-3 | 6 pd | ⏳ Open (critical for credibility, §5 R1) |
| EV-3 | Critic seeded sets: deterministic L1 (generated, 60 artifacts) and semantic L2/L3 (16 artifacts incl. 4 clean) | SME, AI | — | Each defect has a target id and category | 3 pd | ✅ Drafted. L2/L3 set needs SME review and expansion to ≥ 40 |
| EV-4 | Certainty-wording labelled set (AR/EN) | AE | — | ≥ 40 items incl. hard negatives | 0.5 pd | ✅ 40 items |
| EV-5 | Graders: deterministic + LLM-judge prompts; judge calibration on 20 human-graded items | AI, SME | EV-1 | Judge–human agreement ≥ 0.8 | 2 pd | ◐ Graders written; **calibration not done** (needs API) |

### 3.2 Experiments

| ID | Task | Owner | Depends on | Acceptance criteria | Effort | Status |
|---|---|---|---|---|---|---|
| A-1 | Deterministic layer prototype (gate, scoring, discriminators, No Good Fit) | AI | EV-1 | Runs on gold slots; thresholds 12 §A.1 | 2 pd | ✅ Done (v0.2 baseline, v0.3, v0.3b variants) |
| A-2 | Robustness test (perturbed diagnoses) | AI | A-1 | Thresholds 12 §A.1 | 1 pd | ✅ Done |
| A-3 | LLM diagnosis + re-rank + judge harness; dry run | AI | A-1 | All requests build; schemas convert | 2 pd | ✅ Done (dry run: 29/29 requests build) |
| A-4 | **Run A with the model** (2 runs × 29 scenarios × efforts high & medium) | AI | API key, EV-5 | Thresholds 12 §A.2 | 1 pd | ⛔ **Blocked: no API key in this environment** |
| B-1 | Options harness (generation, deterministic checks, rubric judge); dry run | AI | — | Requests build | 1 pd | ✅ Done |
| B-2 | **Run B with the model** (8 scenarios × 2 runs) | AI | API key | Thresholds 12 §B | 0.5 pd | ⛔ Blocked: no API key |
| C-1 | Critic L1 rules + seeded-defect test | FS1 | EV-3 | Thresholds 12 §C.1 | 1.5 pd | ✅ Done |
| C-2 | Critic L2/L3 harness; dry run | AI | EV-3 | Requests build | 1 pd | ✅ Done |
| C-3 | **Run C L2/L3 with the model** | AI | API key | Thresholds 12 §C.2 | 0.5 pd | ⛔ Blocked: no API key |
| D-1 | Lane-aware layout + renderer in Chromium (AR/EN), font gate, measurement self-test | FS2 | — | Thresholds 12 §D | 3 pd | ✅ Prototype done |
| D-2 | Edit operations + stability metrics | FS2 | D-1 | Thresholds 12 §D | 1 pd | ✅ Done |
| D-3 | **Port-aware orthogonal router** (to remove overlaps and label crossings) + incremental (stable) layout | FS2 | D-1 | Thresholds 12 §D | 6–8 pd | ⏳ Open (results show it is needed) |
| E-1 | PPTX library spike (pptxgenjs vs python-pptx) | FS3 | — | Attached-connector support confirmed | 0.5 pd | ✅ Done: pptxgenjs has no attached connectors; python-pptx does |
| E-2 | AR/EN deck generator (tables, heat matrix, options, action plan, Gantt, paginated BPMN with attached connectors and off-page links) | FS3 | D-1, E-1 | Thresholds 12 §E | 3 pd | ✅ Prototype done |
| E-3 | Automated validator (structure, RTL, shaped-text overflow, LibreOffice render, connector-follow test) | FS3 | E-2 | Runs in CI | 1.5 pd | ✅ Done |
| E-4 | **Manual verification in PowerPoint (Windows, Mac) and Keynote**: open without repair, edit, move shapes, connectors follow, RTL correct | DS, FS3 | E-2 | Checklist 12 §E.3 all pass | 1 pd | ⏳ Open (needs those apps; not available here) |
| F-1 | Cost & latency aggregator | AI | A-3 | Produces per-route p50/p90 and cost per analysis | 0.5 pd | ✅ Done (waiting for data) |
| F-2 | **Measurement run** (from A-4, B-2, C-3 logs; effort sweep) | AI | A-4, B-2, C-3 | Thresholds 12 §F | 0.5 pd | ⛔ Blocked: no API key |

### 3.3 Foundations that don't depend on results (from roadmap 07)

| ID | Task | Owner | Effort | Note |
|---|---|---|---|---|
| E-1/E-2 (07) | Monorepo scaffolding, i18n/RTL port | FS1 | 5 pd | Start week 2 |
| E-3 (07) | Postgres schema + RLS + statement-events guard (I2, I5, I6) | FS1 | 4 pd | Uses the v0.3 information model |
| E-5 (07) | Statement library with property tests for invariants I1–I10 | FS1, AI | 3 pd | Directly protects the trust model |
| D-1 (07) | Clickable prototype (Arabic first) + 5 usability sessions with consultants and managers | DS, PL | 8 pd | Recruit per S2 |
| K-2 (07) | Platform-authored KB for the Beta-1 frameworks (AR/EN) | SME, AE | 10 pd | No reference-source text (D1) |

## 4. Schedule (4 weeks)

```
Week 1  EV-1 EV-3 EV-4 · A-1 A-2 A-3 · B-1 · C-1 C-2 · D-1 D-2 · E-1 E-2 E-3 · F-1     ← executed 2026-11-19 (prototypes)
Week 2  API key → A-4 B-2 C-3 F-2 (2 days) · EV-2 held-out set · EV-5 judge calibration · scaffolding · E-4 manual PPTX check
Week 3  Re-run A on held-out set · D-3 router + incremental layout · KB authoring · usability sessions
Week 4  Final measurement on held-out set · results doc 13 complete · Gate 0 decision (GO/NO-GO Beta-1)
```

**Critical path:** API key → A-4 → held-out re-run → Gate 0. Every day without a key delays Gate 0 by a day.

## 5. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **In-sample bias**: the same author wrote the scenarios and the seed matrices, so oracle results overstate accuracy | High (already true) | High | EV-2 independent held-out set; report in-sample and held-out separately; matrices frozen before held-out scoring |
| R2 | No API access → core AI unproven at Gate 0 | Medium | Critical | Key requested (13 §0). Harness is ready, so execution takes about 1–2 days once available |
| R3 | Stage misclassification by the LLM (perturbation shows a wrong primary stage drops top-1 to ~85% and puts unacceptable items in the top 3 in ~31% of cases) | Medium | High | Stage accuracy is a hard exit threshold (≥ 85%); ask a disambiguating question when stage confidence isn't high |
| R4 | BPMN routing quality (overlaps, label crossings) | Confirmed | Medium (BPMN is Beta-2) | D-3 router; if not solved by Beta-2, BPMN ships after GA (P0-D1) |
| R5 | PowerPoint behaviour differs from LibreOffice (connector rerouting, RTL tables) | Medium | High (key objective) | E-4 manual checklist on PowerPoint Win/Mac and Keynote before Gate 0 |
| R6 | python-pptx in a TypeScript stack (DR-02) | Confirmed | Low–Medium | Decision P0-D2: Python export sidecar in the worker vs a TS OOXML emitter |
| R7 | Arabic quality of model output untested | Medium | High | B and A judges include language quality; native AE review of 20 outputs in week 2 |
| R8 | Small sample sizes (n = 22 recommendation cases) give wide confidence intervals | High | Medium | Expand to ≥ 60 with EV-2; report 95% CIs |

## 6. Decisions needed during Phase 0

| # | Decision | Options | Recommendation | Needed by |
|---|---|---|---|---|
| **P0-D0** | Provide API access for the evaluation runs | Add `ANTHROPIC_API_KEY` as an environment variable in this environment's settings (visible to commands in sessions using it), or run the suite in your own environment | Add it (cost of the full Phase 0 suite estimated at roughly US$20–60, 13 §F) | Week 2, day 1 |
| **P0-D1** | GA plan with 3 engineers | (a) GA week 28 with all 15 frameworks; (b) GA week 24 with 13; BPMN + VSM in a GA+1 release (week 28) | **(b)**: BPMN routing work (D-3) and its PPTX export are the riskiest items; the other 13 have shown no blocking risk | Gate 0 |
| **P0-D2** | PPTX generation technology | (a) Python sidecar (python-pptx) in the export worker; (b) TS OOXML emitter written in-house; (c) commercial SDK | **(a)** for MVP: proven in E, smallest effort. Revisit (b) post-GA | Gate 0 |
| **P0-D3** | Adopt recommender rule set v0.3b (stage-aware gate, display cutoff, joint-fit "probable No Good Fit" flag confirmed by the LLM) | v0.2 / v0.3 / v0.3b | **v0.3b**, pending held-out confirmation | After held-out run |

## 7. Gate 0 exit criteria (summary; full thresholds in doc 12)

Gate 0 = **GO for Beta-1** only if:
1. **A, B and C (model-based) meet their thresholds on the held-out set**, in both Arabic and English.
2. **F**: measured cost and latency are within the budgets in 12 §F, or a costed mitigation exists.
3. **E**: automated checks pass and the manual PowerPoint/Keynote checklist passes.
4. **D**: the thresholds for Beta-1-relevant visuals pass (BPMN can be deferred under P0-D1(b)).
5. No open Critical finding in the trust model (invariants I1–I10 have passing property tests).
