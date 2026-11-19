# 11: Evaluation Framework & Test Cases (Phase 0)

> Status: **v0.1 (2026-11-19).** Test assets live in `/phase0/eval` (machine-readable source of truth). This document explains them; the table in §4 is generated from `phase0/eval/scenarios.json`.
> ⚠️ **Not yet independently reviewed.** The same team wrote the scenarios and the recommender's seed matrices. All results on this set are **in-sample** until the held-out set (EV-2) exists (§7).

## 1. Principles

1. **Measure capabilities, not demos.** A capability is "ready" only when it meets quantitative thresholds across multiple scenarios, in both languages, on held-out data, with its limitations documented.
2. **Separate the layers.** Test the deterministic layer (rules, scoring, calculations) apart from the model layer (diagnosis, re-ranking, generation, critique). A failure then points to its cause.
3. **Freeze before scoring.** Seed matrices and rules are committed before a test set is scored (git commit `243e0fc` froze v0.2 before the first run). Any change made after seeing results is labelled **in-sample** and must be re-tested on held-out data.
4. **Repeat runs.** Model experiments run ≥ 2 times per case. Stability (same top-1 across runs) is itself a metric.
5. **Arabic is not a translation of English.** Arabic cases are written natively, not translated, and parity is a gated metric.
6. **Honest graders.** Deterministic graders where possible. An LLM judge (a different model from the generator) only for semantic criteria, calibrated against human grades (EV-5) before its numbers count for Gate 0.

## 2. Test asset inventory

| Asset | File | Size | Used by | Status |
|---|---|---|---|---|
| Business scenarios | `eval/scenarios.json` | 29 (11 Arabic, 18 English) | A (oracle, perturbation, model), B (8 of them) | Drafted; needs SME review |
| Certainty-wording set | `eval/certainty-wording.json` | 40 statements (20 AR / 20 EN) incl. hard negatives | C (L1 lexical rule) | Drafted |
| Critic L1 seeded artifacts | generated in `experiments/c-critic-l1.mjs` (fixed seed) | 60 artifacts (risk matrices, option sets, action plans); 57 seeded defects; 15 clean | C (L1) | Ready |
| Critic L2/L3 semantic set | `eval/critic-semantic.json` | 16 artifacts (8 framework, 4 project, 4 clean); 14 seeded defects; 5 Arabic | C (model) | Drafted; expand to ≥ 40 |
| BPMN processes | `experiments/d-bpmn/models.mjs` | 6 processes (8–70 nodes, 3–6 lanes) × AR/EN; 5 edit operations each | D | Ready |
| Deck fixtures | `experiments/e-pptx/build_pptx.py` | 2 processes × AR/EN = 4 decks (8–9 slides each) | E | Ready |

## 3. Scenario coverage

| Category (requested) | Scenarios | Arabic | What they stress |
|---|---|---|---|
| Organisational restructuring | ORG-01, ORG-02, ORG-03 | 1 | Org Chart vs Operating Model Canvas; restructuring that is really a people-alignment problem |
| Process inefficiency | PROC-01, PROC-02, PROC-03 | 1 | SIPOC vs BPMN vs VSM; root cause vs mapping |
| Root cause analysis | RCA-01, RCA-02, RCA-03 | 1 | Cause & Effect vs 5 Whys; hearsay causes |
| Risk assessment | RSK-01, RSK-02, RSK-03 | 2 | Risk Matrix vs Impact/Effort (audit findings) |
| Stakeholder management | STK-01, STK-02, STK-03 | 1 | Stakeholder Map vs Charter; external parties |
| Strategic planning | STR-01 … STR-04 | 2 | SWOT vs PEST/STEEPLE; "what should we do?" (Strategic Options); prioritising 23 ideas |
| Project execution | PRJ-01, PRJ-02, PRJ-03 | 1 | Charter vs Action Plan/Gantt; slipping project with mutual blame |
| No Good Fit / out of scope | NGF-01 … NGF-04 | 1 | Customer journey design, consumer perception mapping (no catalogue method), financial modelling, choosing between named people |
| Insufficient context | INS-01 … INS-03 | 1 | Vague requests that must trigger questions, not recommendations |

## 4. Test cases: expected diagnoses and acceptable recommendations

| ID | Category | Lang | Title | Expected domain (any of) | Expected stage | Gate | Ideal | Acceptable | Unacceptable in top 3 |
|---|---|---|---|---|---|---|---|---|---|
| ORG-01 | organisational restructuring | EN | Merged directorates with duplicated roles | ORG.STRUCTURE, ORG.ACCOUNTABILITY | DESIGN_ORGANISATION | proceed | org_chart | op_model_canvas, stakeholder_map, cause_effect | pest_steeple, gantt, risk_matrix |
| ORG-02 | organisational restructuring | AR | تصميم مركز الخدمات المشتركة | ORG.OPERATING_MODEL | DESIGN_ORGANISATION | proceed | op_model_canvas | org_chart, sipoc, stakeholder_map, strategic_options, project_charter | five_whys, cause_effect, pest_steeple |
| ORG-03 | organisational restructuring | EN | Restructuring announced, leadership not aligned | PPL.ADOPTION, PRJ.STAKEHOLDERS | ALIGN_PEOPLE | proceed | stakeholder_map | action_plan, project_charter, risk_matrix | org_chart, pest_steeple, vsm, bpmn |
| PROC-01 | process inefficiency | AR | تأخر إنجاز طلبات التراخيص | OPS.PERFORMANCE | FIND_ROOT_CAUSE | proceed | cause_effect | vsm, five_whys, sipoc, bpmn | swot, pest_steeple, gantt, org_chart |
| PROC-02 | process inefficiency | EN | Undocumented purchase request process | OPS.PROCESS_DEFINITION | MAP_CURRENT_STATE | proceed | sipoc | bpmn, stakeholder_map | vsm, swot, pest_steeple, risk_matrix, five_whys |
| PROC-03 | process inefficiency | EN | Order fulfilment lead time with waiting between steps | OPS.WASTE, OPS.PERFORMANCE | MAP_CURRENT_STATE, FIND_ROOT_CAUSE | proceed | vsm | bpmn, cause_effect, impact_effort | sipoc, swot, stakeholder_map, org_chart |
| RCA-01 | root cause analysis | EN | Insurance claim rejections at a clinic chain | OPS.QUALITY | FIND_ROOT_CAUSE | proceed | cause_effect | five_whys, sipoc, bpmn | swot, pest_steeple, org_chart, gantt |
| RCA-02 | root cause analysis | AR | تقرير يومي يتأخر بسبب مهمة ليلية | OPS.QUALITY, OPS.PERFORMANCE | FIND_ROOT_CAUSE | proceed | five_whys | cause_effect, action_plan | swot, pest_steeple, stakeholder_map, org_chart, op_model_canvas |
| RCA-03 | root cause analysis | EN | Rising B2B churn | CX.EXPERIENCE, FIN.REVENUE | FIND_ROOT_CAUSE | proceed | cause_effect | five_whys, swot | gantt, org_chart, bpmn, project_charter |
| RSK-01 | risk assessment | EN | Core banking migration risks | RSK.ASSESSMENT | MANAGE_RISK | proceed | risk_matrix | project_charter, stakeholder_map, action_plan | five_whys, swot, org_chart, vsm |
| RSK-02 | risk assessment | AR | مخاطر تنظيم فعالية دولية | RSK.ASSESSMENT | MANAGE_RISK | proceed | risk_matrix | action_plan, stakeholder_map, project_charter | five_whys, cause_effect, swot, org_chart, vsm |
| RSK-03 | risk assessment | AR | أولويات معالجة ملاحظات التدقيق | RSK.COMPLIANCE | MANAGE_RISK, PRIORITISE_DECIDE | proceed | risk_matrix | impact_effort, action_plan | swot, pest_steeple, org_chart, vsm |
| STK-01 | stakeholder management | AR | منصة رقمية بين إدارات متعارضة | PRJ.STAKEHOLDERS | ALIGN_PEOPLE | proceed | stakeholder_map | project_charter, risk_matrix, action_plan | five_whys, vsm, pest_steeple, org_chart |
| STK-02 | stakeholder management | EN | New CEO, disengaged steering committee | PRJ.STAKEHOLDERS | ALIGN_PEOPLE | proceed | stakeholder_map | project_charter, action_plan, risk_matrix | five_whys, vsm, bpmn, org_chart |
| STK-03 | stakeholder management | EN | Factory expansion with community and regulators | PRJ.STAKEHOLDERS | ALIGN_PEOPLE | proceed | stakeholder_map | risk_matrix, pest_steeple, project_charter, action_plan | five_whys, vsm, org_chart, sipoc |
| STR-01 | strategic planning | AR | استراتيجية خمسية لمجموعة مدارس | STR.ENVIRONMENT, STR.DIRECTION | UNDERSTAND_CONTEXT | proceed | pest_steeple, swot | strategic_options, stakeholder_map | five_whys, gantt, bpmn, vsm, sipoc |
| STR-02 | strategic planning | EN | Where do we stand against competitors? | STR.POSITION, STR.DIRECTION | UNDERSTAND_CONTEXT | proceed | swot | pest_steeple, strategic_options | five_whys, gantt, bpmn, sipoc, org_chart |
| STR-03 | strategic planning | EN | Causes known: what should we do? | DEC.OPTIONS, STR.DIRECTION | GENERATE_OPTIONS | proceed | strategic_options | impact_effort, action_plan | cause_effect, five_whys, pest_steeple, org_chart |
| STR-04 | strategic planning | AR | ٢٣ فكرة تحسين وميزانية محدودة | DEC.PRIORITISATION | PRIORITISE_DECIDE | proceed | impact_effort | strategic_options, action_plan | cause_effect, five_whys, pest_steeple, sipoc, org_chart |
| PRJ-01 | project execution | EN | E-invoicing compliance project with unclear scope | PRJ.INITIATION | PLAN_EXECUTION | proceed | project_charter | stakeholder_map, risk_matrix, sipoc | five_whys, swot, vsm, pest_steeple |
| PRJ-02 | project execution | AR | ١٢ إجراءً متفقًا عليها تحتاج خطة | PRJ.PLANNING | PLAN_EXECUTION | proceed | action_plan, gantt | project_charter, risk_matrix | cause_effect, five_whys, swot, pest_steeple, strategic_options |
| PRJ-03 | project execution | EN | ERP rollout slipping, mutual blame | PRJ.DELIVERY | FIND_ROOT_CAUSE, PLAN_EXECUTION | proceed | cause_effect | five_whys, action_plan, risk_matrix, stakeholder_map | swot, pest_steeple, org_chart, op_model_canvas |
| NGF-01 | no good fit | EN | Design an omnichannel customer journey | CX.EXPERIENCE | MAP_CURRENT_STATE, UNDERSTAND_CONTEXT, GENERATE_OPTIONS | proceed | **No Good Fit / out of scope** | closest: sipoc, bpmn, strategic_options | swot, pest_steeple, risk_matrix, gantt, org_chart |
| NGF-02 | no good fit | AR | موقع علامتنا في أذهان المستهلكين | STR.POSITION | UNDERSTAND_CONTEXT | proceed | **No Good Fit / out of scope** | closest: swot, strategic_options | five_whys, cause_effect, gantt, bpmn, org_chart |
| NGF-03 | no good fit | EN | NPV of a solar investment | FIN.REVENUE, FIN.COST, X.OUT_OF_SCOPE | PRIORITISE_DECIDE, UNDERSTAND_CONTEXT | proceed | **No Good Fit / out of scope** | closest: risk_matrix, strategic_options | five_whys, cause_effect, swot, org_chart, bpmn |
| NGF-04 | no good fit | EN | Which team lead should I promote? | X.OUT_OF_SCOPE | PRIORITISE_DECIDE | proceed | **No Good Fit / out of scope** | closest: — | swot, impact_effort, risk_matrix, strategic_options |
| INS-01 | insufficient context | EN | Vague: department has problems | — | — | ask | — | — | — |
| INS-02 | insufficient context | AR | غامض: نريد تحسين الأداء | — | — | ask | — | — | — |
| INS-03 | insufficient context | EN | Vague: slow and unhappy | — | — | ask | — | — | — |

Full texts, expected `must_surface` items (facts a good diagnosis must capture), `must_not_be_verified` items (hearsay that must not be presented as established fact), chain hints and gold slot values are in `phase0/eval/scenarios.json`.

## 5. Metrics and grading rules

### 5.1 Experiment A: diagnosis and recommendation

| Metric | Definition | Grader |
|---|---|---|
| Stage accuracy | LLM `stage_primary` ∈ expected `stage_any_of` | Deterministic |
| Domain accuracy | Top domain ∈ `domains_any_of` ∪ `domains_acceptable` | Deterministic |
| Gate correctness | `ask` cases → `insufficient_context`; others not blocked (false-block rate) | Deterministic |
| Top-1 acceptable | Rank-1 approach ∈ ideal ∪ acceptable (Gantt ≡ Action Plan) | Deterministic |
| Top-3 hit | At least one *ideal* approach in the top 3 | Deterministic |
| Unacceptable in top 3 | Any listed unacceptable approach shown | Deterministic |
| No Good Fit recall / false-NGF rate | NGF cases → `no_good_fit` or `out_of_scope`; recommendation cases wrongly declared NGF | Deterministic |
| Confusable-set accuracy | Pass rate per confusable set (§6) | Deterministic |
| Typing violations | `origin = user_input` statements whose quote is not a verbatim substring of the challenge (I3) | Deterministic |
| Must-surface coverage | Share of `must_surface` items captured (yes = 1, partial = 0.5) | LLM judge (calibrated) |
| Hearsay handled | `must_not_be_verified` items presented as unproven | LLM judge (calibrated) |
| Top-1 stability | Same status and top-1 across repeated runs | Deterministic |
| Language parity | Pass-rate gap between Arabic and English cases | Deterministic |

A scenario **passes** if: gate correct; for recommendation cases, top-1 acceptable ∧ top-3 hit ∧ no unacceptable in the top 3; for NGF cases, `no_good_fit` or `out_of_scope`.

### 5.2 Experiment B: Strategic Options

| Metric | Definition | Grader |
|---|---|---|
| Structural pass | 3–5 options + exactly 1 baseline; valid preferred id; every non-baseline option addresses something and lists assumptions | Deterministic |
| Rubric (1–5 each) | Distinctness, relevance to causes/goals, rationale soundness, assessment plausibility, trade-off clarity, language quality | LLM judge (calibrated) |
| No fabricated facts | No invented figures presented as facts | LLM judge |
| Preferred vs weighted | Whether the AI-preferred option equals the top option under default weights (reported, not gated: disagreement is legitimate when explained) | Deterministic |

### 5.3 Experiment C: Critic

| Metric | Definition |
|---|---|
| L1 precision / recall | Exact match of (artifact, rule, target) against seeded ground truth |
| L1 false alarms | Findings on clean artifacts |
| L2/L3 recall | Seeded defect matched if any finding's `target_ids` overlap it |
| L2/L3 serious precision | Critical/High findings on seeded artifacts that match a seeded defect |
| Serious false alarms on clean | Critical/High findings on clean artifacts |
| Explanation & correction | Every finding has non-empty explanation and suggested correction |

### 5.4 Experiments D and E
Defined with their thresholds in doc 12 (§D, §E). All are computed automatically by `d-bpmn/run.mjs` and `e-pptx/validate_pptx.py`, except the manual PowerPoint/Keynote checklist.

### 5.5 Experiment F
Per route and effort: latency p50/p90, input/output tokens, cache-read share, cost per call. Composed: cost per single-framework analysis and per 4-step chain. Refusal, max-tokens and parse-failure rates.

## 6. Confusable sets (discrimination tests)

| Set | Scenarios now | Target (EV-2) |
|---|---|---|
| SWOT vs PEST/STEEPLE | STR-01, STR-02 | ≥ 15 |
| Cause & Effect vs 5 Whys | RCA-01, RCA-02, RCA-03, PROC-01 | ≥ 15 |
| SIPOC vs BPMN vs VSM | PROC-01, PROC-02, PROC-03 | ≥ 15 |
| Project Charter vs Action Plan/Gantt | PRJ-01, PRJ-02 | ≥ 15 |
| Org Chart vs Operating Model Canvas | ORG-01, ORG-02 | ≥ 15 |
| Impact/Effort vs Risk Matrix | RSK-03, STR-04 | ≥ 15 |
| Strategic Options vs Impact/Effort | STR-03, STR-04 | ≥ 15 |

## 7. Statistical honesty and limitations

- **Small n.** With 22 recommendation cases, an observed 100% top-1 has a 95% confidence interval of roughly 85–100% (Wilson). Observed 95.5% (21/22) has roughly 78–99%. Results must be read as "promising", not "proven".
- **In-sample.** Scenarios, gold slots and seed matrices share an author. The v0.3/v0.3b rule changes were made *after* seeing v0.2 failures on this same set. Only held-out results (EV-2) count for Gate 0.
- **Oracle ≠ end-to-end.** Oracle-mode tests feed *perfect* diagnoses to the rules. End-to-end accuracy depends on the model's extraction, especially stage classification.
- **LLM judge.** Uncalibrated judge numbers are reported but not gated until EV-5 shows ≥ 0.8 agreement with human grades.
- **Generated L1 set.** Seeded defects are synthetic and target the defect classes the rules implement. High L1 scores prove correct implementation, not coverage of real-world errors.

## 8. Expansion plan (weeks 2–4)

| Item | Target |
|---|---|
| Held-out scenarios by an independent author (EV-2) | ≥ 30 (≥ 40% Arabic) + ≥ 15 per confusable set |
| Real anonymised cases from design partners (with consent) | ≥ 10 |
| Critic L2/L3 semantic set | ≥ 40 artifacts (≥ 10 clean), SME-reviewed |
| Judge calibration (EV-5) | 20 human-graded items per judged metric |
