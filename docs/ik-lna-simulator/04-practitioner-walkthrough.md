# Practitioner walkthrough: "The Accuracy Problem"

How the simulator is meant to be used, written for an LNA practitioner evaluating it as a
practice tool rather than as an interface. ✅ = playable in the preview today; ⏳ = designed,
arrives in Phase 3.

## The premise
You are an internal performance consultant at Masar Health Insurance. The Head of Claims
Operations asks for a two-day "Accuracy & Attention to Detail" workshop for all 120 processors.
You have **18 consultant hours**. Every document and every question costs time, so you cannot
investigate everything.

## 1. Read the brief, not just the request ✅
**Do:** open the briefing. Notice that the request arrives tagged **Claim**: it is the
requester's view, not a fact.
**Practitioner test:** do you treat "they're careless, train them" as a hypothesis to test or as
the brief?

## 2. Strategic context ✅
**Do:** study the priorities (turnaround under 5 days, cost-to-serve −15%, zero regulatory
findings), then choose which documents to review (1 hour each).
**What to notice:** the dashboard shows errors and productivity rising in the same month. The
strategy lists accuracy as a measure with no target and no owner. Last year's accuracy e-learning
changed nothing.
**Log hypotheses** as you go. They are stored as **Assumptions** and will be tested against the
evidence later.

## 3. Frame the problem: the first decision point ✅
You cannot interview anyone until you record a framing. Five options:
- a training need (the requester's solution)
- careless people (the requester's cause)
- a faulty system (a different jump to a cause)
- "the error rate is too high" (a symptom)
- **the performance gap in business terms:** accuracy 97.9% → 93.2% while productivity rose 29%,
  putting a strategic priority and corporate contracts at risk, with causes not yet known

You can revise later, and every revision is recorded. No feedback is given yet; that is deliberate.

## 4. Stakeholder discovery ✅
Six stakeholders, each with objectives, concerns and a declared bias:
- **Khalid**, Head of Claims and the requester (attribution bias)
- **Faisal**, COO and strategy sponsor (success narrative)
- **Noura**, HR Business Partner (sees problems through an HR lens)
- **Omar**, ClaimsOne product owner (defensive about the platform)
- **Sara**, QA lead (advocates for her own function)
- **A processor focus group** (group defensiveness)

**How it responds to your consulting behaviour:**
- **Openness.** Open, specific questions build trust. Leading, accusatory or solution-first
  questions ("Which training do you want?") lower it. Guarded stakeholders give vague answers
  and keep their insights.
- **Rapport-gated insights.** Omar only admits that 212 of 340 validation rules were never
  migrated once you have asked about day-to-day changes first. Sara only reveals that QA reports
  to Khalid, who cut sampling, once trust is built.
- **Challenge with evidence.** New questions appear only when you hold contradicting evidence.
  For example, with the tenure data you can ask Khalid why experienced staff, accurate for years,
  are now making errors too. With the rules backlog you can ask Faisal whether the 60-a-day target
  should stand when it assumed automation that never arrived.
- **The budget.** 18 hours against roughly 40 hours of possible inquiry. Choosing what to ask is
  the skill.

**A strong path:**
- context documents, then frame the gap
- COO: the trade-off between priorities, which surfaces the SAR 140M contract at risk
- QA: the error types (58% are coverage-limit errors)
- product owner: what changed day to day, then which rules are live
- processors: walk through a complex claim and the manual workaround
- HRBP: error rates by tenure
- challenge the requester and the COO with that evidence

**A weak path:** ask the requester what training he wants, ask the processors whether training
would help, and ask QA for names.

## 5. What you should be able to conclude (ready for Phase 3) ⏳
- **Diagnosis:** select root causes and link each to the evidence that supports it. There are
  four true causes and three plausible distractors:

| True cause | Type | Weight |
|---|---|---|
| Validation rules never migrated | Technology | 35% |
| Volume-only targets and bonus, reduced QA feedback | Governance | 30% |
| New-hire coding gap (38 of 120 staff) | Skill | 20% |
| QA reports to the function it audits | Structure | 15% |

  Distractors: carelessness, a workforce-wide skill gap, provider quality.
- **Capability assessment:** separate the one genuine, bounded skill gap from the organisational
  barriers.
- **Solution architecture:** migrate the rules, rebalance targets and the bonus, make QA
  independent and restore sampling, give accuracy an executive owner, and run targeted coding
  development for recent hires. A two-day workshop for all 120 would be scored as poorly fitted.
- **Impact measurement:** accuracy against the 98% SLA, rework cost, regulatory findings, and
  time-to-proficiency for new hires. These are kept separate from learning metrics.
- **Debrief:** the score on each dimension and its rubric criteria, the critical questions you
  missed and why they matter, how each stakeholder's bias coloured their claims, and your first
  framing against your final one.

## Questions to ask yourself as an evaluator
1. Does the scenario feel like real organisational work, or like a quiz?
2. Would a training-first practitioner be led, convincingly, to a different conclusion?
3. Are any stakeholder replies unrealistic, too easy, or too revealing?
4. Is the budget tight enough to force prioritisation without feeling arbitrary?
5. Does the Arabic read the way a Saudi HR leader would speak?
