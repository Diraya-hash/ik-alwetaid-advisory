"""Consolidated results workbook for the manual PowerPoint / Keynote validation (doc 16).
One row per run × test, six assessment dimensions with dropdowns, pre-marked N/A where a dimension does not apply,
a cross-app differences log, and a Summary sheet with exit-criteria formulas.
Output: results/validation-pack/PowerPoint-Manual-Test-Results.xlsx
"""
import os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import CellIsRule
from openpyxl.utils import get_column_letter

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "results", "validation-pack", "PowerPoint-Manual-Test-Results.xlsx")
NAVY, GREY, HEAD = "0B1F3A", "D9D9D9", "EAF4FF"
DIMS = ["Visual rendering", "Arabic typography", "Text direction", "Shape editability", "Connector behaviour", "Layout consistency"]
TESTS = [("T01", "Typography specimen"), ("T02", "SWOT table (RTL table)"), ("T03", "Heat matrix + risk register"), ("T04", "Options table"),
         ("T05", "Action plan table"), ("T06", "Gantt: shapes + attached connectors"), ("T07", "Connector lab"), ("T08", "Process diagram (paginated)")]
RUNS = [("R1", "PowerPoint", "Windows", "ar", "A"), ("R2", "PowerPoint", "Windows", "en", "A"), ("R3", "PowerPoint", "Windows", "ar", "B"),
        ("R4", "PowerPoint", "macOS", "ar", "A"), ("R5", "PowerPoint", "macOS", "en", "A"), ("R6", "Keynote", "macOS", "ar", "A"), ("R7", "Keynote", "macOS", "en", "A")]

def applies(dim, test, deck):
    if dim == "Connector behaviour": return test in ("T06", "T07", "T08")
    if dim == "Arabic typography": return deck == "ar" or test == "T01"   # EN T01 has a mixed-direction Arabic line
    if dim == "Shape editability": return True                            # text/table/shape editing is part of every test
    return True

thin = Side(style="thin", color="BFBFBF"); border = Border(left=thin, right=thin, top=thin, bottom=thin)
def header(ws, cols, widths):
    for i, (c, w) in enumerate(zip(cols, widths), 1):
        cell = ws.cell(row=1, column=i, value=c); cell.font = Font(bold=True, color="FFFFFF"); cell.fill = PatternFill("solid", fgColor=NAVY)
        cell.alignment = Alignment(wrap_text=True, vertical="center"); cell.border = border; ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = "A2"; ws.row_dimensions[1].height = 42

wb = Workbook()
# ---------------- Instructions
ws = wb.active; ws.title = "Instructions"; ws.column_dimensions["A"].width = 120
lines = [
 ("PowerPoint & Keynote manual validation: consolidated results (doc 16)", True),
 ("Files: phase0/results/validation-pack/validation-pack-ar.pptx and validation-pack-en.pptx. Each slide shows its test ID; steps and the expected result are in the speaker notes.", False),
 ("1) Fill the Setup sheet (one row per run R1–R7). 2) For each run, open the deck and do tests T01–T08. 3) In Results, set each dimension to PASS / PARTIAL / FAIL (grey cells are N/A).", False),
 ("4) For any PARTIAL or FAIL: set Severity, write one sentence in Notes, and save a screenshot named <Run>-<Test>.png in results/validation-pack/screens/.", False),
 ("5) Record differences between apps in the Differences sheet. 6) The Summary sheet shows the exit criteria automatically.", False),
 ("Dimensions:", True),
 ("Visual rendering: colours, borders, shapes, fonts look as in the reference render; nothing missing or clipped.", False),
 ("Arabic typography: letters joined and shaped, diacritics placed correctly, digits correct (both systems), no unexpected font substitution.", False),
 ("Text direction: Arabic paragraphs right-to-left, mixed Arabic/Latin in correct order, tables mirrored (except the heat matrix, by design), Gantt time right-to-left in Arabic.", False),
 ("Shape editability: text, table cells and shapes can be edited/moved/resized as native objects; typing keeps direction and font.", False),
 ("Connector behaviour: connectors stay attached and re-route when shapes move; undo restores; no detached ends.", False),
 ("Layout consistency: positions, line breaks and sizes match the reference; no overflow; no unexpected autofit shrink.", False),
 ("Severity: critical = file unusable or meaning wrong · high = editability or RTL broken · medium = visible defect · low = cosmetic.", False),
 ("Font condition A = IBM Plex Sans Arabic + Inter installed (full families). B = fonts not installed (what most recipients see).", False),
 ("— تعليمات مختصرة —", True),
 ("املأ ورقة Setup لكل تشغيل، ثم نفِّذ الاختبارات T01–T08 وضع لكل بُعد PASS أو PARTIAL أو FAIL (الخلايا الرمادية غير منطبقة). عند PARTIAL أو FAIL اختر الخطورة واكتب ملاحظة من جملة واحدة واحفظ لقطة شاشة. سجِّل الفروق بين التطبيقات في ورقة Differences.", False),
]
for i, (t, b) in enumerate(lines, 1):
    c = ws.cell(row=i, column=1, value=t); c.font = Font(bold=b, size=13 if i == 1 else 11, color=NAVY if b else "000000"); c.alignment = Alignment(wrap_text=True)
ws.cell(row=16, column=1).alignment = Alignment(wrap_text=True, horizontal="right", readingOrder=2)

# ---------------- Setup
su = wb.create_sheet("Setup")
header(su, ["Run", "App", "Platform", "Deck", "Font condition", "App version / build", "OS version", "Tester", "Date", "Opened without repair prompt? (Y/N)", "Font substitution observed", "Notes"],
       [6, 12, 11, 7, 10, 22, 16, 18, 12, 16, 24, 40])
yn = DataValidation(type="list", formula1='"Y,N"', allow_blank=True); su.add_data_validation(yn)
for r, run in enumerate(RUNS, 2):
    for c, v in enumerate(run, 1): su.cell(row=r, column=c, value=v).border = border
    for c in range(6, 13): su.cell(row=r, column=c).border = border
    yn.add(su.cell(row=r, column=10))

# ---------------- Results
rs = wb.create_sheet("Results")
cols = ["Run", "App", "Platform", "Deck", "Font", "Test ID", "Test"] + DIMS + ["Overall (auto)", "Severity (worst)", "Notes", "Screenshot file"]
header(rs, cols, [6, 11, 10, 6, 6, 7, 30] + [14] * 6 + [12, 12, 45, 22])
res = DataValidation(type="list", formula1='"PASS,PARTIAL,FAIL,N/A"', allow_blank=True); rs.add_data_validation(res)
sev = DataValidation(type="list", formula1='"critical,high,medium,low"', allow_blank=True); rs.add_data_validation(sev)
grey = PatternFill("solid", fgColor=GREY)
row = 2
for run in RUNS:
    rid, app, plat, deck, font = run
    for tid, tname in TESTS:
        for c, v in enumerate([rid, app, plat, deck, font, tid, tname], 1): rs.cell(row=row, column=c, value=v).border = border
        for k, d in enumerate(DIMS):
            cell = rs.cell(row=row, column=8 + k); cell.border = border; cell.alignment = Alignment(horizontal="center")
            if applies(d, tid, deck): res.add(cell)
            else: cell.value = "N/A"; cell.fill = grey
        rng = f"H{row}:M{row}"
        rs.cell(row=row, column=14, value=f'=IF(COUNTIF({rng},"FAIL")>0,"FAIL",IF(COUNTIF({rng},"PARTIAL")>0,"PARTIAL",IF(COUNTIF({rng},"PASS")+COUNTIF({rng},"N/A")=6,"PASS","")))').border = border
        sev.add(rs.cell(row=row, column=15))
        for c in (15, 16, 17): rs.cell(row=row, column=c).border = border; rs.cell(row=row, column=c).alignment = Alignment(wrap_text=True)
        row += 1
last = row - 1
for col in ("H", "I", "J", "K", "L", "M", "N"):
    rng = f"{col}2:{col}{last}"
    rs.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=['"FAIL"'], fill=PatternFill("solid", fgColor="F8CBAD")))
    rs.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=['"PARTIAL"'], fill=PatternFill("solid", fgColor="FFE699")))
    rs.conditional_formatting.add(rng, CellIsRule(operator="equal", formula=['"PASS"'], fill=PatternFill("solid", fgColor="C6EFCE")))
rs.auto_filter.ref = f"A1:{get_column_letter(len(cols))}{last}"

# ---------------- Differences
df = wb.create_sheet("Differences")
header(df, ["#", "Test ID", "Dimension", "PowerPoint Windows", "PowerPoint Mac", "Keynote", "Impact (critical/high/medium/low)", "Screenshot(s)", "Follow-up issue (doc 15)"],
       [5, 8, 18, 34, 34, 34, 14, 22, 22])
for r in range(2, 32):
    df.cell(row=r, column=1, value=r - 1)
    for c in range(1, 10): df.cell(row=r, column=c).border = border; df.cell(row=r, column=c).alignment = Alignment(wrap_text=True, vertical="top")

# ---------------- Summary (exit criteria, doc 16 §6)
sm = wb.create_sheet("Summary")
header(sm, ["Item", "Value", "Rule"], [70, 16, 60])
R = f"Results!$A$2:$Q${last}"
def cnt(cond): return f"COUNTIFS({cond})"
items = [
 ("Rows completed (Overall not blank)", f'=COUNTIF(Results!N2:N{last},"?*")', f"of {last - 1} rows"),
 ("FAIL rows, all runs", f'=COUNTIF(Results!N2:N{last},"FAIL")', "informational"),
 ("PARTIAL rows, all runs", f'=COUNTIF(Results!N2:N{last},"PARTIAL")', "informational"),
 ("Runs opened WITHOUT repair prompt (Y)", f'=COUNTIF(Setup!J2:J8,"Y")', "must be 7 of 7"),
 ("PowerPoint (Win+Mac), T01–T06 not PASS", '=SUMPRODUCT((Results!B2:B{0}="PowerPoint")*(Results!E2:E{0}="A")*((Results!F2:F{0}="T01")+(Results!F2:F{0}="T02")+(Results!F2:F{0}="T03")+(Results!F2:F{0}="T04")+(Results!F2:F{0}="T05")+(Results!F2:F{0}="T06"))*(Results!N2:N{0}<>"PASS"))'.format(last), "must be 0"),
 ("PowerPoint (Win+Mac), connector behaviour not PASS on T06–T08", '=SUMPRODUCT((Results!B2:B{0}="PowerPoint")*((Results!F2:F{0}="T06")+(Results!F2:F{0}="T07")+(Results!F2:F{0}="T08"))*(Results!L2:L{0}<>"PASS"))'.format(last), "must be 0"),
 ("Critical/high findings, font condition A (Arabic typography)", '=SUMPRODUCT((Results!E2:E{0}="A")*((Results!I2:I{0}="FAIL")+(Results!I2:I{0}="PARTIAL"))*((Results!O2:O{0}="critical")+(Results!O2:O{0}="high")))'.format(last), "must be 0"),
 ("Keynote critical/high findings", '=SUMPRODUCT((Results!B2:B{0}="Keynote")*((Results!O2:O{0}="critical")+(Results!O2:O{0}="high")))'.format(last), "must be 0"),
 ("Font condition B findings documented (rows with Notes)", '=SUMPRODUCT((Results!E2:E{0}="B")*(Results!P2:P{0}<>""))'.format(last), "documented with mitigation (no gate)"),
 ("EXIT CRITERIA MET (doc 16 §6)", '=IF(AND(B2={0},B5=7,B6=0,B7=0,B8=0,B9=0),"YES","NO")'.format(last - 1), "all of the above"),
]
for i, (a, b, c) in enumerate(items, 2):
    sm.cell(row=i, column=1, value=a).border = border; sm.cell(row=i, column=2, value=b).border = border; sm.cell(row=i, column=3, value=c).border = border
sm.cell(row=len(items) + 1, column=1).font = Font(bold=True); sm.cell(row=len(items) + 1, column=2).font = Font(bold=True)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
if os.path.exists(OUT): raise SystemExit(f"REFUSED: {OUT} exists (never overwrite a results workbook; testers may have filled it).")
wb.save(OUT); print(OUT, f"{last - 1} result rows, {len(RUNS)} runs")
