# 07: Development Roadmap

> **v0.2** (2026-11-19). Replaces v0.1 in full. It reflects the approved **24-week plan to GA**, decisions D1–D4, the additional product decisions, and the Phase 0 spikes from the review (08 §8).

**Phase vocabulary:** *Phase 0 Foundations → Beta-1 → Beta-2 → GA → Teams → Enterprise → Scale.* Sprints are 2 weeks. Week 1 is the first week after the Phase 0 kickoff.

> **Superseded for planning by doc 14 §6 (2026-11-21):** 3 engineers, GA week 24 with 13 frameworks, BPMN + VSM at ≈ week 28; Gate 0 slips move the plan one-for-one.

> **Phase 0 update (2026-11-19).** The team is locked at **3 full-stack engineers** (doc 10 §1). The 24-week plan below assumed 4, so either GA moves to ~week 28 with all 15 frameworks, or GA stays at week 24 with 13 frameworks and BPMN + VSM ship at GA+1 (recommended; P0-D1). Phase 0 status, results and the Beta-1 GO/NO-GO are in docs 10–13. Decisions D8, D10 and D14 are resolved/deferred (00-README).

## 1. Team assumption

| Role | FTE | Note |
|---|---|---|
| Product lead | 1 | Owns decisions, discovery, design partners |
| Product designer (bilingual, Arabic-first) | 1 | Owns doc 09 and the design system |
| Full-stack TypeScript engineers | **4** | +1 vs v0.1, to absorb the Critic, Strategic Options, billing and the layout service |
| AI engineer | 1 | Gateway, prompts, evals, Critic rubrics |
| Methodology SME / content lead | 1 | Platform-authored KB, rubrics, golden sets |
| Arabic business editor | 0.5 | Native Arabic content, glossary |
| DevOps / SecOps | 0.5 | Infra, CI, security programme |
| QA (bilingual) | 0.5 | From Beta-1; visual regression, RTL, exports |

**If the team stays at 3 full-stack engineers**, either GA moves to ~week 28–30, or BPMN and VSM move after GA (13 frameworks at GA). Decide by the Phase 0 exit gate.

## 2. Timeline overview (24 weeks to GA)

```
Week:     1  2  3  4 | 5  6  7  8  9 10 11 12 |13 14 15 16 17 18 19 20 |21 22 23 24
Phase:    Phase 0     | Beta-1                  | Beta-2                  | GA hardening
Sprints:  S0    S1    | S2    S3    S4    S5    | S6    S7    S8    S9    | S10   S11
Milestone:      Gate 0^                  Beta-1^                  Beta-2^          GA^
```

| Milestone | Week | Meaning |
|---|---|---|
| **Gate 0** | 4 | Foundations, spikes, content and UX ready; feature work may start |
| **Beta-1** | 12 | Closed beta with 5–8 design-partner organisations (30–50 users, Arabic-majority) |
| **Beta-2** | 20 | Feature-complete MVP; expanded beta (~150 users) |
| **GA** | 24 | Paid launch in KSA |

## 3. Phase 0: Foundations & de-risking (weeks 1–4, S0–S1)

**No feature implementation.** Only foundations, spikes, content and design.

| ID | Task | Owner | Exit criteria |
|---|---|---|---|
| E-1 | Monorepo scaffolding (`apps/bps-*`, `packages/*`), CI (typecheck, unit, i18n coverage, contrast/axe, schema checks) | Eng | Green pipeline |
| E-2 | Port i18n/RTL/tokens/fonts from `ik-lna-simulator` into `packages/i18n`, `packages/ui-tokens`; bilingual app shell | Eng | AR/EN shell, RTL verified |
| E-3 | Postgres schema v1 (05 v0.2) + RLS + migrations; cross-tenant tests; `kb_internal` with no API grants | Eng | RLS and grant tests pass |
| E-4 | Model Gateway + Prompt Registry + AI Run logging + eval runner skeleton | AI eng | One structured call end-to-end, validated |
| E-5 | **Statement model library** (`core/statement.v2`, invariants I1–I8 as tests) | Eng + AI eng | Property tests: no edit path changes truth status/origin |
| E-6 | **Slot Registry + Port Type Registry** with CI consistency checks | AI eng | Every reference resolves |
| SP-1 | **Spike: cost & latency** on 20 golden cases, per-route effort sweep | AI eng | Baseline cost per analysis; latency vs. NFRs; route effort defaults |
| SP-2 | **Spike: PPTX RTL** (matrix + swimlane flow, AR/EN; PowerPoint Win/Mac, Keynote) | Eng | Pass/fail per visual family → input to D8 |
| SP-3 | **Spike: layout service** (Chromium-based, AR/EN geometry parity) | Eng | ≤ 1 px node drift; ≤ 300 ms p90 per diagram |
| SP-4 | **Eval: long context vs. retrieval** (60 grounding questions) | AI eng | Confirms or rejects deferring vector search |
| K-1 | Record the reference PDF as an internal reference (`kb_internal`, restricted bucket, mappings for 16 entries); **no ingestion** | Content lead | D1 controls in place |
| K-2 | Platform-authored KB for Beta-1 frameworks (8) + Strategic Options (AR/EN, native) | SME + editor | Reviewed incl. originality check |
| K-3 | Taxonomy v1.0 (axes A, B, D, E) + discriminator rules (04 §5.3) | SME + AI eng | ≥ 5 examples per L2 per language |
| K-4 | Golden set v0: 150 cases + ≥ 15 per confusable set + 40 No Good Fit cases | SME | κ ≥ 0.6 between two SMEs |
| K-5 | Critic rubrics v1 for Beta-1 frameworks + seeded-defect set v0 | SME + AI eng | Rubrics reviewed |
| D-1 | Doc 09 → clickable prototype (Arabic first) of: composer, diagnosis, approach, Consultant mode, options, review | Design | 5 usability sessions with AR-first users |
| S-1 | Legal/privacy: PDPL/GDPR readiness, privacy policy AR/EN, AI disclosure; optional licence enquiry to the rights holder (D1 follow-up) | Product | Memo + drafts |
| B-0 | Billing design: gateway selection (mada), VAT, ZATCA e-invoicing approach | Product + Eng | Design note |

**Gate 0 (week 4) exit criteria:** E-1…E-6 done; SP-1…SP-4 reported; K-2…K-4 ready for Beta-1 frameworks; prototype tested; open decisions D8 and the team size resolved.

## 4. Beta-1 (weeks 5–12, S2–S5)

| Sprint | Weeks | Scope |
|---|---|---|
| **S2** | 5–6 | Auth (magic link, Google/Microsoft), personal org/workspace auto-creation; projects; conversation + SSE; **Diagnosis Engine v2** with statements; trust labels in the UI (09 §8.4); PII warn mode; data-classification notice |
| **S3** | 7–8 | Sufficiency gate + clarify loop (slot-based, discriminator bonus); **Recommendation Engine** with discriminators and **No Good Fit**; demand log; platform KB in cached prefix; layout service in the worker; **SWOT** and **PEST/STEEPLE** in Consultant mode |
| **S4** | 9–10 | Framework Builder: **draft-first + workshop modes**, accept/edit/reject/challenge, checkpoint versioning, statement history panel; **Critic Item + Framework levels**; **5 Whys**, **Cause & Effect**, **SIPOC** |
| **S5** | 11–12 | **Strategic Options** (generate, compare, weights, preferred option); **Impact/Effort**; **Risk Matrix**; **Action Plan** (table); Assumptions Register; **PDF + PNG/SVG export** (AR/EN); golden-set evals in CI |

**Beta-1 exit metrics:** top-3 hit ≥ 0.80; No Good Fit precision ≥ 0.75; critic precision ≥ 0.75; activation ≥ 25 %; AR/EN completion gap ≤ 10 pts; zero AI statements shown as verified; no open P1 security findings.

## 5. Beta-2 (weeks 13–20, S6–S9)

| Sprint | Weeks | Scope |
|---|---|---|
| **S6** | 13–14 | **Gantt view** of the Action Plan; **Stakeholder Map** (axis variants); **Project Charter**; **chaining** (ports, copy-with-link, "source changed" indicator, chain view) |
| **S7** | 15–16 | **BPMN (core subset)**; **Org Chart** (role-based, CSV import); evidence upload (text extraction, FTS, citable evidence); **PPTX exporter** (native tables, matrices, canvases, lists) |
| **S8** | 17–18 | **Value Stream Mapping** (data-light / data-rich); **Operating Model Canvas**; **Critic Project level** + pre-export Consultant Review; **Problem-Solving Summary** |
| **S9** | 19–20 | **Export language** (Arabic / English / original; translated versions with review); PPTX for graph types per D8; read-only share link + comments; mobile review & approve |

**Beta-2 exit metrics:** all 15 frameworks + Strategic Options live; top-3 hit ≥ 0.85, top-1 ≥ 0.70; confusable-pair accuracy ≥ 0.80; critic precision ≥ 0.80, Critical/High recall ≥ 0.70; G1 ≤ 20 minutes in usability tests; activation ≥ 30 %.

## 6. GA hardening (weeks 21–24, S10–S11)

| Sprint | Weeks | Scope |
|---|---|---|
| **S10** | 21–22 | **Billing**: plans and entitlements (prices still TBD), mada + cards, 15 % VAT, ZATCA e-invoices; usage view; performance tuning to NFRs; WCAG 2.2 AA audit; **pen test** |
| **S11** | 23–24 | AR/EN visual regression for all visual types and exports (PowerPoint Win/Mac, Keynote, PDF viewers); eval gates at GA thresholds; onboarding content and GCC example library; runbooks; **GA** |

**GA criteria:** the PRD GA targets (01 §4, §9); pricing approved from measured costs (SP-1 and beta usage); legal documents published in Arabic and English; incident response tested.

## 7. After GA

| Phase | Indicative window | Scope |
|---|---|---|
| **Teams** | Weeks 25–36 | Shared workspaces UI, roles UI, brand templates, DOCX/XLSX, co-editing (CRDT), outcome check-ins on Action Plans, BPMN 2.0 XML export, **first activations from the 34 pending methods** (ordered by demand signals; independently authored content only) |
| **Enterprise** | Weeks 37–52 | SSO/SCIM, admin console, org KB (embeddings if SP-4/eval require), deployment profiles `gcc` and **`ksa-sovereign`** (after the verification gate, 02 §7.1), BYOK, SOC 2 Type I / ISO 27001 Stage 1 |
| **Scale** | Year 2 | Learning-to-rank, deep-analysis mode, integrations (Microsoft 365, Jira/Azure DevOps), remaining catalogue activations, certifications |

## 8. Cross-phase workstreams

| Workstream | Cadence |
|---|---|
| Eval & quality | Every PR touching AI assets; weekly review of disagreements, No Good Fit logs, critic rejects |
| Content | Platform-authored KB per sprint ahead of each framework; originality checks |
| Arabic quality | Bi-weekly native-reviewer sample (20 outputs) |
| Design-partner programme | Fortnightly sessions from Beta-1 |
| Cost | Weekly per-route token and cost report; effort tuning with eval evidence |
| Security | Monthly dependency/infra review; quarterly restore drill |

## 9. Risks to the timeline

| Risk | Mitigation |
|---|---|
| Team below the assumed size | Decide at Gate 0: extend GA or move BPMN/VSM after GA |
| PPTX RTL graph exports fail the spike | D8 fallback (vector picture + "edit in app"); PDF always native-quality |
| Layout service too slow | HarfBuzz/WASM fallback (02 §6.4a) |
| Critic is noisy | Noise budget; rubric tuning; precision gate before Beta-2 |
| Arabic quality below bar | Native editor from Phase 0; Arabic-specific eval gates |
| Billing/ZATCA integration delays | Start gateway/ZATCA approach in Phase 0 (B-0); allow free beta extension if paid launch slips |

## 10. Decision status

| # | Decision | Status |
|---|---|---|
| D1 | Reference PDF = internal reference only | ✅ Approved |
| D2 | Five-dimension information model | ✅ Approved |
| D3 | Three-level Critic | ✅ Approved |
| D4 | Strategic Options + No Good Fit | ✅ Approved |
| D5 | No vector search in MVP if the eval confirms | ✅ Approved (conditional on SP-4) |
| D6 | Gantt = view of the Action Plan | ✅ Approved |
| D7 | Export in Arabic, English or original language | ✅ Approved |
| D9 | 24-week plan | ✅ Approved |
| D12 | Draft-first default + guided mode | ✅ Approved |
| — | Keep all 15 frameworks + differentiation rules | ✅ Approved |
| — | Design for a future KSA in-Kingdom option | ✅ Approved (02 §7.1) |
| D11 | Pricing | ⏸ Deliberately undecided until costs are measured |
| **D8** | PPTX policy for graph diagrams | ⏳ **Open**: decide at Gate 0 using SP-2 results |
| **D10** | Segment sequencing (private sector first; government after in-Kingdom verification) | ⏳ **Open** |
| **D13** | Brand name (product identity "Business Problem Solver" adopted in docs) | ⏳ **Open** |
| **D14** | Expert Review add-on (human consultant) | ⏳ **Open** |
| **Team** | 4 vs 3 full-stack engineers | ⏳ **Open**: decide at Gate 0 |
