# Phase 0 Human Evaluation: Role Assignment (eval v1)

> Fill in one copy per round. Keep the signed copy **outside** the repository (the repository is public). Record only the names and dates in doc 13 after the round.

## 1. Roles

| Role | Name | Email / contact | Languages | Confirmed (date) |
|---|---|---|---|---|
| **Evaluator** (rates all packets, blind) | | | Arabic ☐ English ☐ | |
| **Adjudicator** (resolves disagreements after submission) | | | Arabic ☐ English ☐ | |
| **Coordinator** (prepares and distributes packets, keeps `coordinator/` private) | | | | |
| Alternate evaluator (if the evaluator withdraws) | | | Arabic ☐ English ☐ | |

**Rules for filling the roles**
- One **bilingual** evaluator is preferred: native or near-native Modern Standard Arabic business register, and professional English. If no single person covers both, name one evaluator per language; the coordinator combines their answers into one `responses.csv` and records both names (e.g. `"<AR name> (AR); <EN name> (EN)"`).
- The evaluator, adjudicator and coordinator must be **three different people**.
- The evaluator should have senior management-consulting or business-analysis experience, so they can judge which method a senior consultant would use.

## 2. Independence and blinding declaration (evaluator)

I confirm that, **until I have submitted my completed `responses.csv`**:

- ☐ I have not seen, and will not open, the project repository on GitHub, including its branches, results, evaluation sets or AI-judge verdicts. (The repository is public, so this is a personal commitment.)
- ☐ I have not taken part in writing the evaluation scenarios, their expected answers, the scoring rules or the AI prompts.
- ☐ I will use only the packets and the evaluator guide in the folder I received, with no internet look-ups about the cases.
- ☐ I will not discuss the cases with the project team or the adjudicator before I submit.
- ☐ I understand that my answers are final once submitted, and that a SHA-256 fingerprint of my file is recorded.

Signature: ____________________   Date: __________

## 3. Adjudicator declaration

- ☐ I am not the evaluator for this round.
- ☐ For every disagreement I will record a decision (`human_correct`, `judge_correct`, `both_defensible` or `item_ambiguous`), a one-sentence rationale and a follow-up (`judge_prompt_issue`, `answer_key_erratum` or `none`).
- ☐ I understand that follow-ups only feed the **next** evaluation version; nothing frozen or sealed is changed.

Signature: ____________________   Date: __________

## 4. Scope and effort

| Part | Content | Estimated effort |
|---|---|---|
| Calibration packets | 20 packets (10 Arabic, 10 English): diagnosis questions, checklist items, next step, language, usefulness, and options where present | About 4 hours |
| S7 assumption-integrity packets | Every ambiguous case where the AI gave a conditional recommendation (up to 15 per language with 3 runs; the real number depends on the model's outputs): 3 short questions each | 1–2 hours |
| Adjudication | All judge-vs-human disagreements (typically 15–30 rows) | 1–2 hours |

## 5. Schedule

| Step | Owner | Target date |
|---|---|---|
| Evaluation run completed (results branch available) | Product lead | |
| Packets prepared and sent (only the `evaluator/` folder) | Coordinator | |
| Completed `responses.csv` returned | Evaluator | |
| Submission recorded (`human-eval submit`) and comparison produced (`compare`) | Coordinator | |
| Disagreements adjudicated (`disagreements.csv` complete) and `summarise` run | Adjudicator, then coordinator | |

## 6. What the coordinator sends and keeps

- **Send:** only the folder `human-eval/round-1/evaluator/` (packets, `responses.csv`, `EVALUATOR-GUIDE.md`).
- **Keep private:** `human-eval/round-1/coordinator/` and `manifest.json`. They hold the AI-judge verdicts and must not reach the evaluator before submission. The `human-eval/` folder is git-ignored and must never be committed.
- Procedure: doc 17 §8.
