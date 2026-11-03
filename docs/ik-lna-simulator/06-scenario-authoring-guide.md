# Scenario authoring and content management

Scenarios are code-reviewed content: TypeScript data files validated at test time. There is no CMS.
Adding a scenario is a content task. The engine, UI, scoring, report and analytics need no changes.

## 1. Files

```
ik-lna-simulator/content/scenarios/<scenario-id>/
  discovery.ts   meta, organisation, strategy, evidence, stakeholders and questions
  decisions.ts   root causes, capability candidates, interventions, KPIs, framing, debrief
  index.ts       export const myScenario: Scenario = { ...meta, evidence, stakeholders, ...decisions }
```

Register it in `content/scenarios/index.ts` (array order is library order). Copy an existing scenario of
the same difficulty as a starting point; `service-centre` is the most compact.

Helpers in `content/kit.ts`:

| Helper | Use |
|---|---|
| `L(en, ar)` | Every user-facing string. Both languages are mandatory. |
| `doc(...)` | A Stage 1 document (costs hours to review). |
| `found(...)` | Evidence revealed by an interview reply. |
| `q(id, quality, text, responses, dimensions, whyItMatters, opts)` | A question card. `opts`: `cost`, `challenge`, `available`. |
| `r(reply, opennessDelta, reveals?, when?)` | A reply. The **last** reply of a question must have no `when`. |
| `has(evidenceId)`, `open(stakeholderId, min)` | Conditions for gating replies and questions. |

## 2. The design standard (enforced where it can be checked)

- An executive stakeholder who owns the strategy; mark stakeholders who must be interviewed `critical: true`.
- Five framing options: one `performance-gap`, one `solution` (the request), cause assumptions, a symptom.
- True root-cause weights sum to 1. Above Foundation, `skill` causes total **0.3 or less**.
- Every true cause has **supporting evidence** and an **essential** intervention.
- At least one poorly fitting **training** option (`neutral` or `harmful`), and a learning-level KPI that is
  kept apart from a relevant strategic KPI.
- At least one capability candidate that is **not** a real gap.
- The hour budget must be **smaller** than the total cost of everything available.
- Every evidence item must be discoverable; every referenced id must exist.

## 3. Writing good content

- **Questions:** mix `critical`, `strong`, `neutral`, `weak`, `leading` and `solution-first`. Poor questions
  lower openness (−10 to −20). Put each insight behind the question an expert would ask. Gate the
  sensitive ones with `open(stakeholder, 50–60)` and give that stakeholder a genuine trust-building question
  first, otherwise the insight is unreachable.
- **Challenges:** `challenge: true` with `available: has("ev-…")`. They appear only when the user holds
  contradicting evidence. Use them to reconcile conflicting stakeholder narratives.
- **Biases:** give every stakeholder a real bias, and let their own data sometimes argue against them.
- **Advanced difficulty:** include ambiguous evidence (a small supporting fact for a distractor), politics
  between stakeholders, and causes that sit with the sponsor.
- **Arabic:** write natural Modern Standard business Arabic, not a translation. Use Arabic-Indic digits and
  the Arabic comma `،` (never `·`, which looks like the Arabic zero). Use «» for quotes.
- **Facts:** every number used anywhere (reports, KPIs, explanations) must be defined in the scenario data.

## 4. Validate

```bash
cd ik-lna-simulator
npm test                    # schema, integrity, solvability, bilingual checks
npm run build && npm run e2e && node scripts/e2e-full.mjs
```

`tests/solvability.test.ts` runs a greedy expert (with one step of lookahead) and a training-first
order-taker on every scenario. The expert must find evidence for every true cause within budget and score
75 or more; the order-taker must score below 40.

## 5. Versioning

Increase `version` when you change a published scenario's content. Attempts started on an older version
still open, with a notice inviting a fresh attempt. Scores are always re-derived from the saved actions, so
a scoring change re-scores history consistently.
