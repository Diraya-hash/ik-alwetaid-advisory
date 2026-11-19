"""Experiment E: editable PowerPoint export, Arabic (RTL) and English (LTR).
Native objects only: tables, autoshapes, glued connectors, text. No pictures.
Uses BPMN geometry produced by experiment D (layout service) so screen and export share one geometry.
"""
import json, sys, os, copy
from pptx import Presentation
from pptx.util import Emu, Pt, Inches
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.oxml.ns import qn
from lxml import etree
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from textmeasure import width_pt

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
NAVY, BLUE, MUTED = RGBColor(0x0B, 0x1F, 0x3A), RGBColor(0x14, 0x64, 0xF4), RGBColor(0x3C, 0x4C, 0x61)
FONT_LATIN, FONT_CS = "Inter", "IBM Plex Sans Arabic"

T = {  # slide copy, written natively per language (not translated at runtime)
 "en": {"title": "Licensing turnaround: diagnosis and plan", "sub": "Business Problem Solver · Phase 0 export test",
        "swot": "SWOT: our position", "S": "Strengths", "W": "Weaknesses", "O": "Opportunities", "Tt": "Threats",
        "risk": "Risk assessment (5×5)", "reg": "Risk register", "plan": "Action plan", "gantt": "Timeline (Gantt view of the action plan)",
        "bpmn": "As-is process: commercial licence application", "opts": "Strategic options compared",
        "L": "Likelihood", "I": "Impact", "ai": "Contains AI-generated content. Labels show verification status.",
        "cols_reg": ["ID", "Risk", "L", "I", "Score", "Owner", "Status"], "cols_plan": ["#", "Action", "Owner", "Start", "End", "Depends on"],
        "cols_opt": ["Option", "Impact", "Effort", "Risk", "Feasibility", "Weighted"],
        "swot_items": {"S": ["Experienced licensing officers", "Online portal already live"], "W": ["Four internal hand-offs per application", "No tracking of waiting time"],
                       "O": ["Government digital-services programme funding", "Shared inspection scheduling with municipality"], "Tt": ["Rising application volume (+18%)", "Complaints escalated to the ministry"]},
        "risks": [["R1", "Data migration delays", 4, 4, "PMO", "Assumption"], ["R2", "Inspector availability", 3, 5, "Operations", "Unverified"], ["R3", "Portal outage at launch", 2, 4, "IT", "Assumption"], ["R4", "Resistance from reviewers", 3, 3, "HR", "Verified"]],
        "actions": [["1", "Map waiting time per step", "Process lead", 0, 14, ""], ["2", "Pre-check documents online", "IT", 10, 45, "1"], ["3", "Joint inspection calendar", "Operations", 20, 60, "1"], ["4", "Weekly backlog review", "Licensing head", 15, 90, ""], ["5", "Publish service-level dashboard", "Strategy office", 45, 80, "2"]],
        "options": [["Automate document pre-check", 4, 2, 2, 4, 3.7], ["Redistribute approval authority", 4, 3, 3, 3, 3.4], ["Continue as-is (baseline)", 1, 1, 2, 5, 2.2]],
        "months": ["Jan", "Feb", "Mar", "Apr"]},
 "ar": {"title": "زمن إنجاز التراخيص: التشخيص والخطة", "sub": "حلّال مشكلات الأعمال · اختبار التصدير في المرحلة صفر",
        "swot": "تحليل SWOT: موقعنا", "S": "نقاط القوة", "W": "نقاط الضعف", "O": "الفرص", "Tt": "التهديدات",
        "risk": "تقييم المخاطر (٥×٥)", "reg": "سجل المخاطر", "plan": "خطة العمل", "gantt": "الجدول الزمني (عرض جانت لخطة العمل)",
        "bpmn": "الإجراء الحالي: طلب الترخيص التجاري", "opts": "مقارنة الخيارات الاستراتيجية",
        "L": "الاحتمالية", "I": "الأثر", "ai": "يتضمن محتوى مولدًا بالذكاء الاصطناعي، وتوضح الوسوم حالة التحقق.",
        "cols_reg": ["الرمز", "الخطر", "الاحتمالية", "الأثر", "الدرجة", "المسؤول", "الحالة"], "cols_plan": ["#", "الإجراء", "المسؤول", "البداية", "النهاية", "يعتمد على"],
        "cols_opt": ["الخيار", "الأثر", "الجهد", "المخاطر", "الجدوى", "الدرجة المرجحة"],
        "swot_items": {"S": ["موظفو تراخيص ذوو خبرة", "بوابة إلكترونية قائمة"], "W": ["أربع عمليات تسليم داخلية لكل طلب", "لا يُقاس زمن الانتظار"],
                       "O": ["تمويل برنامج الخدمات الحكومية الرقمية", "جدولة مشتركة للتفتيش مع البلدية"], "Tt": ["ارتفاع حجم الطلبات (+١٨٪)", "تصعيد الشكاوى إلى الوزارة"]},
        "risks": [["خ١", "تأخر ترحيل البيانات", 4, 4, "مكتب المشاريع", "افتراض"], ["خ٢", "توفر المفتشين", 3, 5, "العمليات", "غير مُتحقَّق"], ["خ٣", "تعطل البوابة عند الإطلاق", 2, 4, "تقنية المعلومات", "افتراض"], ["خ٤", "مقاومة المراجعين", 3, 3, "الموارد البشرية", "مُتحقَّق"]],
        "actions": [["١", "قياس زمن الانتظار لكل خطوة", "قائد العمليات", 0, 14, ""], ["٢", "التحقق المسبق من المستندات إلكترونيًا", "تقنية المعلومات", 10, 45, "١"], ["٣", "تقويم تفتيش مشترك", "العمليات", 20, 60, "١"], ["٤", "مراجعة أسبوعية للمتأخرات", "رئيس التراخيص", 15, 90, ""], ["٥", "نشر لوحة مستوى الخدمة", "مكتب الاستراتيجية", 45, 80, "٢"]],
        "options": [["أتمتة التحقق المسبق من المستندات", 4, 2, 2, 4, 3.7], ["إعادة توزيع صلاحيات الاعتماد", 4, 3, 3, 3, 3.4], ["الاستمرار كما هو (أساس)", 1, 1, 2, 5, 2.2]],
        "months": ["يناير", "فبراير", "مارس", "أبريل"]},
}

def ar_digits(s):
    return str(s).translate(str.maketrans("0123456789.", "٠١٢٣٤٥٦٧٨٩٫"))

def style_run(run, size, bold=False, color=NAVY, lang="en"):
    run.font.size = Pt(size); run.font.bold = bold; run.font.color.rgb = color; run.font.name = FONT_LATIN
    rPr = run._r.get_or_add_rPr()
    rPr.set("lang", "ar-SA" if lang == "ar" else "en-US")
    for tag, face in (("a:latin", FONT_LATIN), ("a:cs", FONT_CS)):
        el = rPr.find(qn(tag))
        if el is None: el = etree.SubElement(rPr, qn(tag))
        el.set("typeface", face)
    # schema order: solidFill must precede latin/ea/cs — python-pptx inserts fill correctly; move fonts to the end
    for tag in ("a:latin", "a:cs"):
        el = rPr.find(qn(tag)); rPr.remove(el); rPr.append(el)

def set_text(tf, text, size, lang, bold=False, color=NAVY, align=None, anchor=MSO_ANCHOR.MIDDLE, wrap=True):
    tf.clear(); tf.word_wrap = wrap; tf.vertical_anchor = anchor
    for side in ("margin_left", "margin_right"): setattr(tf, side, Emu(Inches(0.06)))
    tf.margin_top = tf.margin_bottom = Emu(Inches(0.03))
    lines = text if isinstance(text, list) else [text]
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        if lang == "ar": p._p.get_or_add_pPr().set("rtl", "1")
        p.alignment = align if align is not None else (PP_ALIGN.RIGHT if lang == "ar" else PP_ALIGN.LEFT)
        r = p.add_run(); r.text = ln; style_run(r, size, bold, color, lang)

def title(slide, text, lang, W):
    tb = slide.shapes.add_textbox(Inches(0.5), Inches(0.3), W - Inches(1.0), Inches(0.7))
    set_text(tb.text_frame, text, 26, lang, bold=True)
    ft = slide.shapes.add_textbox(Inches(0.5), Inches(7.0), W - Inches(1.0), Inches(0.35))
    set_text(ft.text_frame, T[lang]["ai"], 9, lang, color=MUTED)

def table(slide, rows, x, y, w, h, lang, header=True, col_w=None, fills=None, size=12):
    gf = slide.shapes.add_table(len(rows), len(rows[0]), x, y, w, h); tbl = gf.table
    if lang == "ar": tbl._tbl.tblPr.set("rtl", "1")  # columns flow right-to-left
    if col_w == "auto":  # content-based column sizing with shaped text measurement (finding from E run 1)
        need = [max(width_pt(ar_digits(r[c]) if (lang == "ar" and isinstance(r[c], (int, float))) else str(r[c]).split("\n")[0], size, lang, bold=(header and i == 0)) for i, r in enumerate(rows))
                + 2 * 0.06 * 72 + 6 for c in range(len(rows[0]))]
        total = w / 12700.0
        if sum(need) <= total:  # distribute slack to the widest (text) column
            slack = total - sum(need); k = need.index(max(need)); need[k] += slack
        else:  # shrink only wrappable columns proportionally (keep numeric/short columns at their need)
            fixed = [n for n in need if n < 60]; flex_tot = sum(n for n in need if n >= 60); avail = total - sum(fixed)
            need = [n if n < 60 else n * avail / flex_tot for n in need]
        for i, cw in enumerate(need): tbl.columns[i].width = Emu(int(cw * 12700))
    elif col_w:
        for i, cw in enumerate(col_w): tbl.columns[i].width = cw
    for r, row in enumerate(rows):
        for c, val in enumerate(row):
            cell = tbl.cell(r, c)
            v = ar_digits(val) if (lang == "ar" and isinstance(val, (int, float))) else str(val)
            set_text(cell.text_frame, v, size, lang, bold=(header and r == 0), color=(RGBColor(255, 255, 255) if header and r == 0 else NAVY))
            if fills and (r, c) in fills: cell.fill.solid(); cell.fill.fore_color.rgb = fills[(r, c)]
    return gf

def slide_swot(prs, lang):
    s = prs.slides.add_slide(prs.slide_layouts[6]); W = prs.slide_width; t = T[lang]; title(s, t["swot"], lang, W)
    it = t["swot_items"]; cell = lambda k: [t[k]] + ["• " + x for x in it[k]]
    rows = [["\n".join(cell("S")), "\n".join(cell("W"))], ["\n".join(cell("O")), "\n".join(cell("Tt"))]]
    gf = table(s, rows, Inches(0.8), Inches(1.3), W - Inches(1.6), Inches(5.4), lang, header=False, size=16)
    pal = {(0, 0): RGBColor(0xE8, 0xF5, 0xEE), (0, 1): RGBColor(0xFD, 0xE6, 0xE6), (1, 0): RGBColor(0xEA, 0xF4, 0xFF), (1, 1): RGBColor(0xFD, 0xF1, 0xDE)}
    for (r, c), col in pal.items():
        cl = gf.table.cell(r, c); cl.fill.solid(); cl.fill.fore_color.rgb = col
        tf = cl.text_frame; tf.paragraphs[0].runs[0].font.bold = True; tf.vertical_anchor = MSO_ANCHOR.TOP
    return s

def heat(score):
    return RGBColor(0xB9, 0x1C, 0x1C) if score >= 15 else RGBColor(0xE8, 0x8A, 0x1A) if score >= 8 else RGBColor(0xF2, 0xD2, 0x4B) if score >= 4 else RGBColor(0x9C, 0xD6, 0xB0)

def slide_risk(prs, lang):
    s = prs.slides.add_slide(prs.slide_layouts[6]); W = prs.slide_width; t = T[lang]; title(s, t["risk"], lang, W)
    n = 5; rows = [[""] * (n + 1) for _ in range(n + 1)]; fills = {}
    for i in range(n):
        L = n - i; rows[i][0] = L
        for j in range(n):
            I = j + 1; ids = [r[0] for r in t["risks"] if r[2] == L and r[3] == I]
            rows[i][j + 1] = " ".join(ids); fills[(i, j + 1)] = heat(L * I)
    rows[n] = [""] + list(range(1, n + 1))
    # NOTE: matrix keeps mathematical axis semantics in both languages (02 §6.5): the table is NOT rtl-flipped.
    gf = table(s, rows, Inches(0.9), Inches(1.4), Inches(6.0), Inches(5.0), "en", header=False, fills=fills, size=14)
    if lang == "ar":  # Arabic text/digits inside the non-mirrored grid
        for r in range(n + 1):
            for c in range(n + 1):
                tf = gf.table.cell(r, c).text_frame; v = tf.text
                if v: set_text(tf, ar_digits(v) if v.isdigit() else v, 14, "ar", align=PP_ALIGN.CENTER)
                if (r, c) in fills: cl = gf.table.cell(r, c); cl.fill.solid(); cl.fill.fore_color.rgb = fills[(r, c)]
    ax = s.shapes.add_textbox(Inches(0.05), Inches(3.5), Inches(0.85), Inches(0.5)); set_text(ax.text_frame, t["L"], 10, lang, color=MUTED, align=PP_ALIGN.CENTER)
    ay = s.shapes.add_textbox(Inches(3.0), Inches(6.45), Inches(2.0), Inches(0.4)); set_text(ay.text_frame, t["I"], 11, lang, color=MUTED, align=PP_ALIGN.CENTER)
    reg = [t["cols_reg"]] + [[r[0], r[1], r[2], r[3], r[2] * r[3], r[4], r[5]] for r in t["risks"]]
    table(s, reg, Inches(7.2), Inches(1.4), Inches(5.8), Inches(2.6), lang, size=11, col_w="auto")
    return s

def slide_plan(prs, lang):
    s = prs.slides.add_slide(prs.slide_layouts[6]); W = prs.slide_width; t = T[lang]; title(s, t["plan"], lang, W)
    rows = [t["cols_plan"]] + [[a[0], a[1], a[2], f"D+{a[3]}" if lang == "en" else f"ي+{ar_digits(a[3])}", f"D+{a[4]}" if lang == "en" else f"ي+{ar_digits(a[4])}", a[5]] for a in t["actions"]]
    table(s, rows, Inches(0.6), Inches(1.4), W - Inches(1.2), Inches(3.6), lang, size=14, col_w="auto")
    return s

def slide_gantt(prs, lang):
    """Gantt as native shapes. RTL: time flows right-to-left, task names on the right."""
    s = prs.slides.add_slide(prs.slide_layouts[6]); W = prs.slide_width; t = T[lang]; title(s, t["gantt"], lang, W)
    rtl = lang == "ar"; names_w = Inches(3.6); chart_w = W - Inches(1.2) - names_w; days = 120
    left = Inches(0.6); top = Inches(1.6); row_h = Inches(0.62)
    chart_x = left if rtl else left + names_w; names_x = left + chart_w if rtl else left
    for k, m in enumerate(t["months"]):  # month headers
        mx = chart_x + int(chart_w * (k * 30) / days); mw = int(chart_w * 30 / days)
        if rtl: mx = chart_x + chart_w - int(chart_w * ((k + 1) * 30) / days)
        hb = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, mx, top - Inches(0.45), mw, Inches(0.4)); hb.fill.solid(); hb.fill.fore_color.rgb = RGBColor(0xEA, 0xF4, 0xFF); hb.line.color.rgb = RGBColor(0x9C, 0xC8, 0xF8)
        set_text(hb.text_frame, m, 11, lang, align=PP_ALIGN.CENTER)
    bars = {}
    for i, a in enumerate(t["actions"]):
        y = top + i * row_h
        nb = s.shapes.add_textbox(names_x, y, names_w, row_h - Inches(0.1)); set_text(nb.text_frame, a[1], 12, lang)
        x0 = chart_x + int(chart_w * a[3] / days); bw = int(chart_w * (a[4] - a[3]) / days)
        if rtl: x0 = chart_x + chart_w - int(chart_w * a[4] / days)
        bar = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x0, y + Inches(0.12), bw, row_h - Inches(0.34))
        bar.fill.solid(); bar.fill.fore_color.rgb = BLUE; bar.line.fill.background(); bar.name = f"bar-{i}"
        bars[a[0]] = bar
    for a in t["actions"]:  # dependency connectors, glued: predecessor end -> successor start
        if a[5]:
            p, q = bars[a[5]], bars[a[0]]
            c = s.shapes.add_connector(MSO_CONNECTOR.ELBOW, 0, 0, 0, 0)
            # connection sites on rectangles: 0 top, 1 left, 2 bottom, 3 right
            c.begin_connect(p, 1 if rtl else 3); c.end_connect(q, 3 if rtl else 1)
            c.line.color.rgb = MUTED; c.line.width = Pt(1)
            _arrow(c)
    return s

def _arrow(conn):
    ln = conn.line._get_or_add_ln(); tail = etree.SubElement(ln, qn("a:tailEnd")); tail.set("type", "triangle")

MIN_PT = 10.0  # readability floor for process text on slides

def slide_bpmn(prs, lang, geo_path):
    """Paginated BPMN export. Geometry comes from the layout service (px, 13px font). We map px->EMU so that
    13px == MIN_PT, then split the process by layer ranges so each slide fits; edges that cross a slide boundary
    become paired off-page link markers (BPMN link events) on both slides. Returns (slides, glued, links, font_pt)."""
    g = json.load(open(geo_path, encoding="utf-8")); t = T[lang]; W = prs.slide_width
    rtl = g["dir"] == "rtl"
    scale = MIN_PT * 12700 / 13.0                     # EMU per layout px at the readability floor
    avail_w, avail_h = W - Inches(0.8), Inches(5.6)
    if g["H"] * scale > avail_h: scale = avail_h / g["H"]   # height wins: font may drop below floor (reported)
    font_pt = round(13 * scale / 12700, 1)
    layers = sorted({n["layer"] for n in g["nodes"]})
    span = {L: (min(n["ox"] for n in g["nodes"] if n["layer"] == L), max(n["ox"] + n["ow"] for n in g["nodes"] if n["layer"] == L)) for L in layers}
    content_budget_px = (avail_w / scale) - g["headerW"] - 40
    pages, cur = [], []
    for L in layers:
        cand = cur + [L]; lo = min(span[x][0] for x in cand); hi = max(span[x][1] for x in cand)
        if cur and hi - lo > content_budget_px: pages.append(cur); cur = [L]
        else: cur = cand
    pages.append(cur)
    byId = {n["id"]: n for n in g["nodes"]}; page_of = {n["id"]: next(i for i, p in enumerate(pages) if n["layer"] in p) for n in g["nodes"]}
    glued = links = 0; link_no = 0; pending = {}
    kinds = {"task": MSO_SHAPE.ROUNDED_RECTANGLE, "gateway": MSO_SHAPE.DIAMOND, "start": MSO_SHAPE.OVAL, "end": MSO_SHAPE.OVAL}
    for pi, pg in enumerate(pages):
        s = prs.slides.add_slide(prs.slide_layouts[6])
        title(s, t["bpmn"] + (f" ({pi + 1}/{len(pages)})" if len(pages) > 1 and lang == "en" else (f" ({ar_digits(pi + 1)}/{ar_digits(len(pages))})" if len(pages) > 1 else "")), lang, W)
        lo = min(span[x][0] for x in pg) - 40; hi = max(span[x][1] for x in pg) + 40
        content_w = (hi - lo) + g["headerW"]
        ox, oy = Inches(0.4), Inches(1.15)
        if rtl:  # header on the right; content right-aligned against it
            X = lambda v: int(ox + (v - lo) * scale)
            hx_emu = X(hi)
        else:
            X = lambda v: int(ox + (g["headerW"] + v - lo) * scale)
            hx_emu = int(ox)
        Y = lambda v: int(oy + v * scale); S_ = lambda v: int(v * scale)
        band_x = int(ox); band_w = S_(content_w)
        for i, l in enumerate(g["lanes"]):
            band = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, band_x, Y(l["y"]), band_w, S_(l["h"]))
            band.fill.solid(); band.fill.fore_color.rgb = RGBColor(0xF4, 0xFA, 0xFF) if i % 2 else RGBColor(255, 255, 255); band.line.color.rgb = RGBColor(0x9C, 0xC8, 0xF8)
            hd = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, hx_emu, Y(l["y"]), S_(g["headerW"]), S_(l["h"]))
            hd.fill.solid(); hd.fill.fore_color.rgb = RGBColor(0xEA, 0xF4, 0xFF); hd.line.color.rgb = RGBColor(0x9C, 0xC8, 0xF8)
            set_text(hd.text_frame, l["text"], font_pt, lang, bold=True, align=PP_ALIGN.CENTER)
        shapes = {}
        for n in g["nodes"]:
            if page_of[n["id"]] != pi: continue
            sh = s.shapes.add_shape(kinds[n["type"]], X(n["x"]), Y(n["y"]), S_(n["w"]), S_(n["h"]))
            sh.fill.solid(); sh.name = f"node-{n['id']}"
            sh.fill.fore_color.rgb = {"task": RGBColor(255, 255, 255), "gateway": RGBColor(0xFF, 0xF7, 0xE6), "start": RGBColor(0xE8, 0xF5, 0xEE), "end": RGBColor(0xFD, 0xE6, 0xE6)}[n["type"]]
            sh.line.color.rgb = {"task": BLUE, "gateway": RGBColor(0x9A, 0x58, 0x08), "start": RGBColor(0x1F, 0x7A, 0x4D), "end": RGBColor(0xB9, 0x1C, 0x1C)}[n["type"]]
            sh.line.width = Pt(2.25 if n["type"] == "end" else 1.25)
            if n["type"] == "task":
                set_text(sh.text_frame, n["lines"], font_pt, lang, align=PP_ALIGN.CENTER)
                tf = sh.text_frame; tf.margin_left = tf.margin_right = Emu(S_(8)); tf.margin_top = tf.margin_bottom = Emu(S_(4))
            else:
                lb = s.shapes.add_textbox(X(n["ox"]) - S_(6), Y(n["y"] + n["h"] + 2), S_(n["ow"] + 12), S_(n["oh"] - n["h"] + 2))
                set_text(lb.text_frame, n["lines"], font_pt, lang, align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.TOP)
                tf = lb.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Emu(0); lb.name = f"label-{n['id']}"
            shapes[n["id"]] = (sh, n)
        def site(n, pt):
            cx, cy = n["x"] + n["w"] / 2, n["y"] + n["h"] / 2; dx, dy = pt[0] - cx, pt[1] - cy
            if abs(dx) * n["h"] >= abs(dy) * n["w"]: return 3 if dx > 0 else 1
            return 2 if dy > 0 else 0
        def glue(c, a_sh, a_n, a_site, b_sh, b_n, b_site):
            c.begin_connect(a_sh, a_site); c.end_connect(b_sh, b_site)
            ell = {0: 0, 1: 2, 2: 4, 3: 6}; cx = c._element.find(qn("p:nvCxnSpPr")).find(qn("p:cNvCxnSpPr"))
            if a_n and a_n["type"] in ("start", "end"): cx.find(qn("a:stCxn")).set("idx", str(ell[a_site]))
            if b_n and b_n["type"] in ("start", "end", "link"): cx.find(qn("a:endCxn")).set("idx", str(ell[b_site]))
            if a_n and a_n.get("type") == "link": cx.find(qn("a:stCxn")).set("idx", str(ell[a_site]))
        def link_marker(label, x, y):
            d = S_(26); m = s.shapes.add_shape(MSO_SHAPE.OVAL, x - d // 2, y - d // 2, d, d)
            m.fill.solid(); m.fill.fore_color.rgb = RGBColor(0xEA, 0xF4, 0xFF); m.line.color.rgb = BLUE; m.line.width = Pt(1.25)
            set_text(m.text_frame, label, max(7, font_pt - 2), lang, bold=True, align=PP_ALIGN.CENTER)
            tf = m.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Emu(0); m.name = f"link-{label}"
            return m
        for e in g["edges"]:
            ps_, pt_ = page_of[e["from"]], page_of[e["to"]]
            if ps_ == pi and pt_ == pi:
                (a, an), (b, bn) = shapes[e["from"]], shapes[e["to"]]
                c = s.shapes.add_connector(MSO_CONNECTOR.ELBOW, 0, 0, 0, 0)
                glue(c, a, an, site(an, e["pts"][0]), b, bn, site(bn, e["pts"][-1])); glued += 1
            elif ps_ == pi or pt_ == pi:
                key = e["id"]
                if key not in pending: link_no += 1; pending[key] = ("L" if lang == "en" else "ر") + (str(link_no) if lang == "en" else ar_digits(link_no))
                lbl = pending[key]
                if ps_ == pi:  # outgoing: marker near the slide edge in the flow direction
                    an = byId[e["from"]]; a = shapes[e["from"]][0]
                    mx = (X(hi) - S_(10)) if not rtl else (X(lo) + S_(10)); my = Y(an["y"] + an["h"] / 2)
                    m = link_marker(lbl, mx, my); c = s.shapes.add_connector(MSO_CONNECTOR.ELBOW, 0, 0, 0, 0)
                    glue(c, a, an, (1 if rtl else 3), m, {"type": "link"}, (3 if rtl else 1)); glued += 1; links += 1
                else:  # incoming marker on the target slide
                    bn = byId[e["to"]]; b = shapes[e["to"]][0]
                    mx = (X(lo) + S_(10)) if not rtl else (X(hi) - S_(10)); my = Y(bn["y"] + bn["h"] / 2)
                    m = link_marker(lbl, mx, my); c = s.shapes.add_connector(MSO_CONNECTOR.ELBOW, 0, 0, 0, 0)
                    glue(c, m, {"type": "link"}, (1 if rtl else 3), b, bn, (3 if rtl else 1)); glued += 1; links += 1
            else:
                continue
            c.line.color.rgb = MUTED if e["back"] else NAVY; c.line.width = Pt(1)
            if e["back"]: c.line.dash_style = 4
            _arrow(c); c.name = f"edge-{e['id']}"
            if e.get("text") and ps_ == pi:
                x0, y0 = e["pts"][0]; lb = s.shapes.add_textbox(X(x0) - Inches(0.3), Y(y0) - Inches(0.24), Inches(0.6), Inches(0.22))
                set_text(lb.text_frame, e["text"], max(8, font_pt - 1), lang, color=MUTED, align=PP_ALIGN.CENTER)
                tf = lb.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Emu(0)
    return len(pages), glued, links, font_pt

def slide_options(prs, lang):
    s = prs.slides.add_slide(prs.slide_layouts[6]); W = prs.slide_width; t = T[lang]; title(s, t["opts"], lang, W)
    rows = [t["cols_opt"]] + t["options"]
    table(s, rows, Inches(0.8), Inches(1.5), W - Inches(1.6), Inches(2.6), lang, size=15, col_w="auto")
    return s

def build(lang, geo, out):
    prs = Presentation(); prs.slide_width, prs.slide_height = Inches(13.333), Inches(7.5)
    t = T[lang]
    s = prs.slides.add_slide(prs.slide_layouts[6]); tb = s.shapes.add_textbox(Inches(0.8), Inches(2.6), prs.slide_width - Inches(1.6), Inches(1.2))
    set_text(tb.text_frame, t["title"], 36, lang, bold=True); sb = s.shapes.add_textbox(Inches(0.8), Inches(3.8), prs.slide_width - Inches(1.6), Inches(0.6)); set_text(sb.text_frame, t["sub"], 16, lang, color=MUTED)
    slide_swot(prs, lang); slide_risk(prs, lang); slide_options(prs, lang); slide_plan(prs, lang); slide_gantt(prs, lang)
    pages, glued, links, font_pt = slide_bpmn(prs, lang, geo)
    prs.save(out); return {"bpmn_slides": pages, "glued_connectors": glued, "offpage_links": links, "bpmn_font_pt": font_pt}

if __name__ == "__main__":
    outdir = os.path.join(ROOT, "results", "e-pptx"); os.makedirs(outdir, exist_ok=True)
    geodir = os.path.join(ROOT, "results", "d-bpmn", "geometry")
    report = {}
    for lang in ("en", "ar"):
        for proc in ("P2", "P4"):
            out = os.path.join(outdir, f"deck-{proc}-{lang}.pptx")
            report[f"{proc}-{lang}"] = {"file": os.path.relpath(out, ROOT), **build(lang, os.path.join(geodir, f"{proc}-{lang}.json"), out)}
    print(json.dumps(report, ensure_ascii=False, indent=1))
