"""Manual PowerPoint/Keynote validation pack (doc 16). One deck per language. Every test slide carries:
- a visible test ID in the corner, and
- speaker notes with the exact steps and the expected result, so testers on different apps record comparable results.
Reuses the Phase 0 exporter (build_pptx.py) so the pack tests the same code paths as product exports.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_pptx import (T, ROOT, NAVY, BLUE, MUTED, set_text, title, table, slide_swot, slide_risk, slide_options,
                        slide_plan, slide_gantt, slide_bpmn, ar_digits, _arrow)
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn

NOTES = {
 "T01": ("Typography specimen", "1) Read every line at 100% zoom. 2) Check: Arabic letters joined, no isolated forms; diacritics placed on the right letters; Latin acronyms (SWOT, KPI, ZATCA) stay inside the Arabic sentence in the right order; percent and numbers read correctly; bold line visibly bolder. 3) Click into line 3 and type two Arabic words at the end.",
         "All lines render right-to-left, shaped and in logical order; typing continues right-to-left at the end of the line; no font substitution warning (or note which font was substituted)."),
 "T02": ("SWOT table (RTL table)", "1) Check quadrant order: Strengths top-right in Arabic, top-left in English. 2) Click a bullet cell, add a new line, type text. 3) Resize the table width by dragging its edge.",
         "Columns mirrored in Arabic; text right-aligned; editing keeps RTL; resizing does not break the layout."),
 "T03": ("Heat matrix + risk register", "1) Check the heat matrix is NOT mirrored (likelihood up the side, impact left-to-right in both languages, by design). 2) In the register, edit a score cell. 3) Check Arabic-Indic digits in the Arabic deck.",
         "Matrix axes non-mirrored in both decks; register columns mirrored in Arabic; cells editable."),
 "T04": ("Options table", "1) Edit an option title (long text) and press Enter at the end. 2) Check numeric columns stay aligned.",
         "Row grows, text wraps inside its cell, no overlap with the slide edge."),
 "T05": ("Action plan table", "1) Add a row with Tab at the last cell. 2) Check new row inherits direction and font.",
         "New row is RTL in Arabic and uses the same font."),
 "T06": ("Gantt (native shapes + attached connectors)", "1) Drag bar 2 one centimetre along the time axis. 2) Drag bar 1 down. 3) Watch the dependency arrows. 4) Check time direction: right-to-left in Arabic.",
         "Arrows stay attached to both bars and re-route; time flows right-to-left in Arabic, left-to-right in English."),
 "T07": ("Connector behaviour lab", "1) Drag shape B to the far side of the slide. 2) Drag shape C below shape A. 3) Select an elbow connector and drag its yellow adjustment handle (if shown). 4) Delete shape D and undo.",
         "All four connectors stay attached and re-route on every move; undo restores the connection. Record any connector that detaches or keeps its old path."),
 "T08": ("Process diagram, slide 1 of n (paginated, attached connectors)", "1) Drag two tasks and one gateway. 2) Check off-page link markers match between slides (same label). 3) Double-click a task and edit its Arabic/English text.",
         "Connectors follow moved shapes; link labels match across slides; text edits stay inside shapes at >= the stated font size. Note: BPMN is deferred from the initial launch; this slide tests connector and text behaviour only."),
}

def tag(slide, test_id, W):
    tb = slide.shapes.add_textbox(W - Inches(1.1), Inches(0.05), Inches(1.0), Inches(0.3))
    set_text(tb.text_frame, test_id, 10, "en", bold=True, color=RGBColor(0xB9, 0x1C, 0x1C), align=PP_ALIGN.RIGHT)
    tb.name = f"test-id-{test_id}"

def notes(slide, test_id, lang):
    name, steps, expected = NOTES[test_id]
    slide.notes_slide.notes_text_frame.text = f"{test_id} — {name} ({lang.upper()})\nSTEPS: {steps}\nEXPECTED: {expected}\nRECORD: app + version, OS, PASS/FAIL, screenshot if FAIL (doc 16 results sheet)."

def typography(prs, lang):
    s = prs.slides.add_slide(prs.slide_layouts[6]); W = prs.slide_width
    title(s, "نموذج الخطوط والاتجاه" if lang == "ar" else "Typography & direction specimen", lang, W)
    if lang == "ar":
        lines = ["١. ارتفع زمن إنجاز الطلبات إلى ٤٥ يومًا مقابل مستهدف ١٥ يومًا (+٣٠٪ في الشكاوى).",
                 "٢. نستخدم تحليل SWOT ومؤشرات KPI ضمن متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA).",
                 "٣. اكتب هنا كلمتين إضافيتين:",
                 "٤. نصّ مُشكَّل: إِنَّ التَّحْسِينَ المُسْتَمِرَّ يَبْدَأُ بِالسُّؤَالِ الصَّحِيحِ.",
                 "٥. التاريخ: ١٥ جمادى الآخرة ١٤٤٨هـ الموافق 2026-11-21م — أرقام غربية: 2,450 ريال",
                 "٦. سطر عريض للمقارنة"]
    else:
        lines = ["1. Turnaround rose to 45 days against a 15-day target (+30% complaints).",
                 "2. Mixed direction: the Arabic term «تحليل SWOT» inside an English sentence.",
                 "3. Type two more words here:",
                 "4. Numbers and units: SAR 2,450 · 3.7 · 15% · 2026-11-21",
                 "5. Long word wrap test: interdepartmental-coordination-responsibilities",
                 "6. Bold line for comparison"]
    tb = s.shapes.add_textbox(Inches(0.8), Inches(1.3), W - Inches(1.6), Inches(5.2))
    set_text(tb.text_frame, lines, 20, lang, anchor=MSO_ANCHOR.TOP)
    tb.text_frame.paragraphs[-1].runs[0].font.bold = True
    return s

def connector_lab(prs, lang):
    s = prs.slides.add_slide(prs.slide_layouts[6]); W = prs.slide_width
    title(s, "مختبر الموصلات" if lang == "ar" else "Connector behaviour lab", lang, W)
    labels = ["أ", "ب", "ج", "د"] if lang == "ar" else ["A", "B", "C", "D"]
    pos = [(1.5, 2.0), (6.0, 2.0), (1.5, 4.8), (6.0, 4.8)]
    if lang == "ar":  # mirror positions so A sits at the reading start (right) — fixed after visual review of run 1
        pos = [(13.333 - x - 2.0, y) for x, y in pos]
    shapes = []
    for (x, y), lb, kind in zip(pos, labels, [MSO_SHAPE.ROUNDED_RECTANGLE, MSO_SHAPE.DIAMOND, MSO_SHAPE.OVAL, MSO_SHAPE.ROUNDED_RECTANGLE]):
        sh = s.shapes.add_shape(kind, Inches(x), Inches(y), Inches(2.0), Inches(1.0))
        sh.fill.solid(); sh.fill.fore_color.rgb = RGBColor(255, 255, 255); sh.line.color.rgb = BLUE; sh.line.width = Pt(1.5)
        set_text(sh.text_frame, lb, 18, lang, bold=True, align=PP_ALIGN.CENTER); shapes.append((sh, kind))
    ell = {0: 0, 1: 2, 2: 4, 3: 6}
    def glue(a, ai, b, bi, kind):
        c = s.shapes.add_connector(kind, 0, 0, 0, 0); c.begin_connect(a[0], ai); c.end_connect(b[0], bi)
        cx = c._element.find(qn("p:nvCxnSpPr")).find(qn("p:cNvCxnSpPr"))
        if a[1] == MSO_SHAPE.OVAL: cx.find(qn("a:stCxn")).set("idx", str(ell[ai]))
        if b[1] == MSO_SHAPE.OVAL: cx.find(qn("a:endCxn")).set("idx", str(ell[bi]))
        c.line.color.rgb = NAVY; c.line.width = Pt(1.25); _arrow(c)
    rtl = lang == "ar"
    glue(shapes[0], 1 if rtl else 3, shapes[1], 3 if rtl else 1, MSO_CONNECTOR.STRAIGHT)
    glue(shapes[0], 2, shapes[2], 0, MSO_CONNECTOR.ELBOW)
    glue(shapes[1], 2, shapes[3], 0, MSO_CONNECTOR.ELBOW)
    glue(shapes[2], 1 if rtl else 3, shapes[3], 3 if rtl else 1, MSO_CONNECTOR.CURVE)
    return s

def build_pack(lang, out):
    prs = Presentation(); prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5); W = prs.slide_width
    cover = prs.slides.add_slide(prs.slide_layouts[6])
    tb = cover.shapes.add_textbox(Inches(0.8), Inches(2.4), W - Inches(1.6), Inches(2.4))
    set_text(tb.text_frame, ["حزمة التحقق اليدوي من PowerPoint" if lang == "ar" else "PowerPoint manual validation pack",
                             "الخطوات والنتائج المتوقعة في ملاحظات المتحدث لكل شريحة" if lang == "ar" else "Steps and expected results are in each slide's speaker notes"], 24, lang, bold=True)
    built = [("T01", typography(prs, lang)), ("T02", slide_swot(prs, lang)), ("T03", slide_risk(prs, lang)), ("T04", slide_options(prs, lang)),
             ("T05", slide_plan(prs, lang)), ("T06", slide_gantt(prs, lang)), ("T07", connector_lab(prs, lang))]
    n_before = len(prs.slides)
    slide_bpmn(prs, lang, os.path.join(ROOT, "results", "d-bpmn", "geometry", f"P1-{lang}.json"))
    for sl in list(prs.slides)[n_before:]: built.append(("T08", sl))
    for test_id, sl in built: tag(sl, test_id, W); notes(sl, test_id, lang)
    prs.save(out)
    return len(prs.slides)

if __name__ == "__main__":
    outdir = os.path.join(ROOT, "results", "validation-pack"); os.makedirs(outdir, exist_ok=True)
    for lang in ("ar", "en"):
        out = os.path.join(outdir, f"validation-pack-{lang}.pptx")
        print(out, build_pack(lang, out), "slides")
