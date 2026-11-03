# Pilot scenario review: "The Accuracy Problem" (Foundation)

An LNA and Organisational Effectiveness review of the pilot against the five capabilities the
simulator must assess, with the changes made in scenario version 2.

## Assessment coverage

| Capability to assess | v1 | v2 (now) | How the scenario tests it |
|---|---|---|---|
| **Understand strategy and business priorities** | Weak: context was readable but nothing tested it | ✅ | A required **problem-framing decision** before any interview, with five options (solution, two cause assumptions, symptom, performance gap). The **COO** forces an explicit trade-off between speed, cost and compliance, and reveals what is at stake: a SAR 140M contract with a 98% accuracy SLA against 93.2% actual. |
| **Identify performance and OE gaps** | Partial | ✅ | The framing separates the *symptom* ("error rate too high") from the *performance gap in business terms* (accuracy 97.9%→93.2% while productivity rose 29%, putting a strategic priority at risk). The evidence shows a measurement and ownership gap: accuracy has no target and no executive owner. |
| **Distinguish capability gaps from process, structural, technological and governance issues** | Partial: no structural cause, no executive layer | ✅ | Four true causes of different types: **technology** (212 validation rules not migrated, weight 0.35), **governance** (volume-only targets and bonus, reduced feedback, 0.30), **structure** (QA reports to the function it audits, 0.15), and **skill** (new-hire coding gap, 0.20). Distractors: carelessness (motivation), workforce-wide skill gap, provider quality. Only 20% of the cause weight is a skill gap, and it affects 38 of 120 people. |
| **Challenge stakeholder assumptions with evidence** | ✅ (3 challenges) | ✅ (4 challenges) | Challenge questions unlock only when the user holds the contradicting evidence. Example: tenure data → Head of Claims; error taxonomy → product owner; training history → Head of Claims; rules backlog → COO's target. Each stakeholder carries an explicit bias that the debrief will explain. |
| **Identify root causes before recommending interventions** | Partial | ✅ (engine-enforced) | Stage 2 cannot start until the problem is framed. Solution-first questions cost trust and score negatively. Some insights (QA independence, the COO's ownership admission, the product owner's backlog) only appear with built rapport. Scoring of root-cause selection arrives in Phase 3. |

## What changed in v2

1. **Problem-framing decision (engine + UI).** `FRAME_PROBLEM` is a new recorded action that
   costs no hours and is required before Stage 2. Revisions are kept as history, so Phase 3 can
   score both the first instinct and the final framing. Explanations are stored for the debrief
   and not shown during play.
2. **New executive stakeholder: Faisal Al-Shammari, COO.** Strategy owner and transformation
   sponsor, with a "success narrative" bias. Five questions, including one challenge.
3. **New true root cause (structure):** QA reports to the Head of Claims Operations, so sampling
   was cut without independent challenge. It is surfaced through a new QA question that is gated
   by rapport.
4. **Four new evidence items:** contract at risk; no executive owner for accuracy; business-case
   assumptions (the 60/day target assumed 100% rule automation); QA reporting line.
5. **Stricter content validation** (applies to every future scenario): there must be an
   executive stakeholder, a performance-gap framing and a solution-first distractor, and true
   cause weights must sum to 1.
6. Budget raised from 16 to 18 hours for the extra stakeholder. The budget still covers well
   under half of everything available, so prioritisation still matters.

## Residual gaps (addressed in later phases)

- **No scoring or debrief yet (Phase 3).** The data needed is recorded: framing history, question
  quality, evidence found, and challenges used.
- **Stage 3–6 tools (Phase 3):** root-cause selection with evidence linking, the capability
  matrix (skill vs barrier), the intervention fit matrix, and the KPI tree.
- **Arabic review:** all new Arabic was written as natural business Arabic. A native-speaker
  review is still recommended before external use.
