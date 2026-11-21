# 16: PowerPoint & Keynote Manual Validation Protocol

> Status: **ready to run (2026-11-21); not yet executed.** Microsoft PowerPoint and Apple Keynote are not available in the build environment, so these checks need a person on real machines.
> Purpose: confirm that exported decks are **genuinely editable** and **correct in Arabic and English** in the apps customers use. Document rendering differences, connector behaviour, Arabic typography and editability.
> Test files: `phase0/results/validation-pack/validation-pack-ar.pptx` and `validation-pack-en.pptx` (10 slides each, built by `phase0/experiments/e-pptx/build_validation_pack.py` from the same code paths as product exports). Each test slide shows its test ID (T01–T08) in the top corner, and **its speaker notes contain the exact steps and the expected result.**

## 1. Test matrix

| App | Platform | Version to record | Required for Gate 0 |
|---|---|---|---|
| Microsoft PowerPoint (Microsoft 365) | Windows 11 | Build number from File → Account | ✅ |
| Microsoft PowerPoint (Microsoft 365) | macOS (current) | Version from PowerPoint → About | ✅ |
| Apple Keynote | macOS (current) | Version from Keynote → About | ✅ if available |
| PowerPoint for the web | Browser | Date | Informational |
| Google Slides (import) | Browser | Date | Informational |

**Font conditions** (run the Arabic deck twice on one Windows machine):
- **A. Fonts installed:** IBM Plex Sans Arabic and Inter installed from their official OFL releases (full families, not web subsets).
- **B. Fonts not installed:** what most recipients will see; the fallback font is recorded.

**People:** designer (DS) + export engineer (FS3) + one native Arabic reader (AE). Allow about 2 hours per app.

## 2. Test cases

| ID | Slide | What it tests | Pass criterion |
|---|---|---|---|
| T01 | Typography specimen | Arabic shaping, diacritics, mixed Arabic/Latin order, both digit systems, %, dates, bold weight; typing at the end of an RTL line | All lines correctly shaped and in logical order; typing continues right-to-left; substitutions recorded |
| T02 | SWOT (RTL table) | Mirrored quadrant order, right-aligned text, cell editing, table resize | Strengths top-right (AR) / top-left (EN); edits keep direction |
| T03 | Heat matrix + register | Heat matrix intentionally **not** mirrored; register mirrored; Arabic-Indic digits | As described in the notes |
| T04 | Options table | Long-text editing, wrapping, numeric alignment | Text wraps in the cell; nothing crosses the slide edge |
| T05 | Action plan table | New row via Tab inherits direction and font | New row is RTL (AR) with the same font |
| T06 | Gantt (shapes + attached connectors) | Dependency arrows follow moved bars; time direction | Arrows stay attached and re-route; time runs right-to-left in Arabic |
| T07 | Connector lab | Straight, elbow and curved connectors on rectangle, diamond and ellipse; delete + undo | All 4 connectors stay attached after every move; undo restores them |
| T08 | Process diagram (paginated) | Connectors on many shapes, off-page link markers, text edits at ≥ 10 pt | Connectors follow; link labels match across slides; text fits. *(BPMN is deferred from launch; T08 tests connector and text behaviour only)* |

General checks for every deck: opens **without a repair prompt**; no "fonts missing" dialog in condition A; slide count = 10; speaker notes present.

## 3. Known observations from the automated LibreOffice run (to confirm or refute in real apps)

| # | Observation (LibreOffice 7.x on Linux) | Interpretation | What to check in PowerPoint/Keynote |
|---|---|---|---|
| O1 | Western digits inside an Arabic line rendered letter-spaced ("2 0 2 6") on T01 | Test machine's Arabic font file is a **web subset without Latin digits** (verified: the glyph for "2" is absent), so the renderer fell back per glyph | Condition A: digits should render normally. Condition B: record the fallback behaviour |
| O2 | After a shape was moved and the file re-saved, LibreOffice re-routed 1–2 of 3 attached connectors; all stayed attached | LibreOffice recalculates some connector paths only | T06/T07/T08: PowerPoint should re-route **all** attached connectors when a shape moves |
| O3 | Elbow/curve paths are computed by the app, not by our layout | Attached connectors trade path control for editability | Record whether paths look acceptable without manual adjustment |
| O4 | RTL tables mirror columns; heat matrix not mirrored; Arabic-Indic digits applied | As designed | Confirm identical behaviour |

## 4. How to record results

For each app × deck (AR, EN) × font condition, fill one row per test in `phase0/results/validation-pack/manual-results.csv`:

```
app,app_version,os,deck,font_condition,test_id,result,severity,notes,screenshot_file
PowerPoint,16.0.xxxxx,Windows 11,ar,A,T01,PASS,,,
PowerPoint,16.0.xxxxx,Windows 11,ar,A,T07,FAIL,high,"connector C→D detached after undo",T07-win-ar-A.png
```

`result`: PASS · FAIL · PARTIAL · N/A. `severity` for non-pass results: critical (file unusable or wrong meaning) · high (editability or RTL broken) · medium (visual defect) · low (cosmetic).
Store screenshots in `phase0/results/validation-pack/screens/`. Never include customer data; the pack contains only synthetic content.

## 5. What the write-up must cover (appended to doc 13 as an update)

1. **Rendering differences** between PowerPoint Windows, PowerPoint Mac and Keynote (fonts, line breaks, table borders, connector paths, colours).
2. **Connector behaviour:** attached or detached after moves, after undo, after copy-paste between slides, and after a round trip through Keynote.
3. **Arabic typography:** shaping, diacritics, digit systems, mixed-direction order, line spacing, font substitution in condition B.
4. **Editability:** text, tables, shapes and connectors editable with expected behaviour; no unexpected autofit shrink.
5. A pass/fail summary against doc 12 §E.2.

## 6. Exit criteria (from doc 12 §E.2)

All of the following, in PowerPoint Windows **and** Mac (Keynote: no critical or high findings):
- 100% of decks open without repair.
- T01–T06 PASS in both languages.
- T07 and T08: every connector stays attached after moves and undo.
- No critical or high typography finding in condition A. Condition B findings are documented, with a mitigation (e.g. the "system font" export mode).

Any failure becomes an export-service issue (doc 15) with the screenshot and the test ID.
