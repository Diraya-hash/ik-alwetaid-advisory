# Phase 0 PowerPoint Cross-Platform Test: Tester Assignment

> Protocol: doc 16. Workbook: `phase0/results/validation-pack/PowerPoint-Manual-Test-Results.xlsx`. Decks: `validation-pack-ar.pptx` and `validation-pack-en.pptx` in the same folder. This test does **not** depend on the API run and can start now.

## 1. Testers and machines

| Run | App | Platform | Language deck | Font condition | Tester | Machine / app version | Date done |
|---|---|---|---|---|---|---|---|
| R1 | PowerPoint (Microsoft 365) | Windows 11 | Arabic | A: fonts installed | | | |
| R2 | PowerPoint (Microsoft 365) | Windows 11 | English | A: fonts installed | | | |
| R3 | PowerPoint (Microsoft 365) | Windows 11 | Arabic | B: fonts **not** installed | | | |
| R4 | PowerPoint (Microsoft 365) | macOS (current) | Arabic | A | | | |
| R5 | PowerPoint (Microsoft 365) | macOS (current) | English | A | | | |
| R6 | Keynote | macOS (current) | Arabic | A | | | |
| R7 | Keynote | macOS (current) | English | A | | | |
| (info) | PowerPoint for the web / Google Slides | Browser | Both | — | | | |

**Minimum staffing:** one Windows tester (R1–R3) and one Mac tester (R4–R7). One person with both machines can do all runs. R6–R7 are required if Keynote is available.

**Requirements**
- Read Arabic well enough to judge text direction, line breaks and typography (Arabic runs).
- Condition A: install **IBM Plex Sans Arabic** and **Inter** from their official OFL releases (full families, not web subsets). Condition B (R3): run on a Windows machine **without** those fonts, or after uninstalling them.
- Record the exact app build (Windows: File → Account; Mac: PowerPoint/Keynote → About).

## 2. Tasks per run (summary of doc 16)

1. Open the deck. Record whether a repair prompt appears (any repair prompt is a failure).
2. Go through T01–T10 in the workbook, one row per test: PASS / FAIL / N/A, with a short note and a screenshot name for every FAIL.
3. Connector tests (T07, T08): move shapes, undo, and copy-paste between slides; record whether every connector stays attached.
4. Log every visible difference between apps in the **Differences** sheet.
5. Save the workbook. Do not edit formulas or the summary sheet.

## 3. Effort and deliverables

| Item | Estimate |
|---|---|
| Per run | 30–40 minutes |
| All 7 runs | About 4 hours (Windows about 1.5 h; Mac about 2.5 h) |
| Deliverable | The completed workbook and a folder of screenshots named `<run>-<test>-<n>.png`, sent to the product lead |

## 4. After the tests

The product lead (or Claude, in a session) runs:

```bash
cd phase0 && python3 experiments/e-pptx/summarize_manual_results.py results/validation-pack/PowerPoint-Manual-Test-Results.xlsx --out results/validation-pack/manual-summary.json
```

This recomputes the exit criteria from the cell values (doc 16 §6). Any failure becomes an export-service issue (doc 15) with its screenshot and test ID.

## 5. Tester confirmation

- ☐ I recorded the exact app version for every run.
- ☐ Every FAIL has a note and a screenshot.
- ☐ I did not change the decks before testing them.

Tester: ____________________   Date: __________
