"""Experiment E validation: structure (native/editable), RTL correctness, shaped text fit, LibreOffice render,
and a 'connector follows moved shape' edit test."""
import json, os, re, glob, shutil, subprocess, zipfile, copy
import uharfbuzz as hb, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from pptx import Presentation
from pptx.util import Emu, Inches
from pptx.oxml.ns import qn

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "results", "e-pptx")
AR = re.compile(r"[؀-ۿ]")
FONTS = {"ar": {False: os.path.expanduser("~/.fonts/IBMPlexSansArabic-arabic-400.ttf"), True: os.path.expanduser("~/.fonts/IBMPlexSansArabic-arabic-700.ttf")},
         "arlat": {False: os.path.expanduser("~/.fonts/IBMPlexSansArabic-latin-400.ttf"), True: os.path.expanduser("~/.fonts/IBMPlexSansArabic-latin-700.ttf")},
         "en": {False: "/usr/share/fonts/opentype/inter/Inter-Regular.otf", True: "/usr/share/fonts/opentype/inter/Inter-Bold.otf"}}
_cache = {}
def hbfont(path):
    if path not in _cache:
        blob = hb.Blob.from_file_path(path); face = hb.Face(blob); f = hb.Font(face); _cache[path] = (f, face.upem)
    return _cache[path]
def width_pt(text, size_pt, lang, bold):
    """Shaped advance width. Arabic runs shaped with the Arabic face; Latin/digit runs with the matching Latin face."""
    total = 0.0
    for run in re.findall(r"[؀-ۿ٠-٩\s،؛؟٪٫]+|[^؀-ۿ٠-٩]+", text):
        is_ar = bool(AR.search(run)) or bool(re.search(r"[٠-٩]", run))
        path = FONTS["ar" if is_ar else ("arlat" if lang == "ar" else "en")][bold]
        f, upem = hbfont(path); buf = hb.Buffer(); buf.add_str(run); buf.guess_segment_properties()
        hb.shape(f, buf, {}); total += sum(p.x_advance for p in buf.glyph_positions) / upem * size_pt
    return total
def wrap_lines(text, size, lang, bold, avail):
    lines = 0
    for para in text.split("\n"):
        words = para.split(" "); cur = ""; n = 1
        for w in words:
            t = (cur + " " + w).strip()
            if width_pt(t, size, lang, bold) <= avail or not cur: cur = t
            else: n += 1; cur = w
        lines += n
    return lines

def frame_fit(tf, w_emu, h_emu, lang):
    """Returns (overflow_w, overflow_h, detail). Single words wider than the box count as width overflow."""
    d = lambda val, default: default if val is None else val   # 0 is a valid margin (validator bug fixed in run 3)
    ml = d(tf.margin_left, Inches(0.1)) + d(tf.margin_right, Inches(0.1)); mt = d(tf.margin_top, Inches(0.05)) + d(tf.margin_bottom, Inches(0.05))
    avail_w = (w_emu - ml) / 12700.0; avail_h = (h_emu - mt) / 12700.0
    used_h = 0.0; worst_word = 0.0
    for p in tf.paragraphs:
        txt = "".join(r.text for r in p.runs)
        if not txt: continue
        size = p.runs[0].font.size.pt if p.runs[0].font.size else 18; bold = bool(p.runs[0].font.bold)
        for w in txt.split(" "): worst_word = max(worst_word, width_pt(w, size, lang, bold))
        used_h += wrap_lines(txt, size, lang, bold, avail_w) * size * 1.2
    return worst_word > avail_w + 0.5, used_h > avail_h + 0.5, {"avail_w": round(avail_w, 1), "avail_h": round(avail_h, 1), "used_h": round(used_h, 1)}

def check_deck(path):
    lang = "ar" if path.endswith("-ar.pptx") else "en"
    prs = Presentation(path)
    r = {"slides": len(prs.slides), "pictures": 0, "tables": 0, "autoshapes": 0, "textboxes": 0, "connectors": 0, "connectors_glued_both_ends": 0,
         "connectors_dangling_refs": 0, "arabic_paragraphs": 0, "arabic_paragraphs_rtl": 0, "runs_missing_cs_font": 0,
         "text_frames_checked": 0, "overflow_width": [], "overflow_height": [], "min_font_pt": 99}
    with zipfile.ZipFile(path) as z:
        r["pictures"] = sum(len(re.findall(r"<p:pic>", z.read(n).decode())) for n in z.namelist() if n.startswith("ppt/slides/slide"))
    for si, slide in enumerate(prs.slides, 1):
        ids = {sh.shape_id for sh in slide.shapes}
        for sh in slide.shapes:
            el = sh._element
            if el.tag == qn("p:cxnSp"):
                r["connectors"] += 1; c = el.find(qn("p:nvCxnSpPr")).find(qn("p:cNvCxnSpPr"))
                st, en = c.find(qn("a:stCxn")), c.find(qn("a:endCxn"))
                if st is not None and en is not None:
                    r["connectors_glued_both_ends"] += 1
                    if int(st.get("id")) not in ids or int(en.get("id")) not in ids: r["connectors_dangling_refs"] += 1
                continue
            frames = []
            if sh.has_table:
                r["tables"] += 1; tbl = sh.table
                for ri, row in enumerate(tbl.rows):
                    for ci, cell in enumerate(row.cells):
                        frames.append((cell.text_frame, tbl.columns[ci].width, row.height, f"s{si}-table-r{ri}c{ci}"))
            elif sh.has_text_frame:
                if sh.shape_type == 17: r["textboxes"] += 1
                else: r["autoshapes"] += 1
                if sh.text_frame.text.strip(): frames.append((sh.text_frame, sh.width, sh.height, f"s{si}-{sh.name}"))
            else:
                r["autoshapes"] += 1
            for tf, w, h, label in frames:
                for p in tf.paragraphs:
                    txt = "".join(x.text for x in p.runs)
                    if AR.search(txt):
                        r["arabic_paragraphs"] += 1
                        pPr = p._p.find(qn("a:pPr"))
                        if pPr is not None and pPr.get("rtl") == "1": r["arabic_paragraphs_rtl"] += 1
                    for run in p.runs:
                        if run.font.size: r["min_font_pt"] = min(r["min_font_pt"], run.font.size.pt)
                        rPr = run._r.find(qn("a:rPr"))
                        if rPr is None or rPr.find(qn("a:cs")) is None: r["runs_missing_cs_font"] += 1
                if not tf.text.strip(): continue
                r["text_frames_checked"] += 1
                ow, oh, d = frame_fit(tf, w, h, lang)
                if ow: r["overflow_width"].append({"where": label, "text": tf.text[:60], **d})
                if oh: r["overflow_height"].append({"where": label, "text": tf.text[:60], **d})
    return r

def render(path):
    tmp = os.path.join(OUT, "render"); os.makedirs(tmp, exist_ok=True)
    res = subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", tmp, path], capture_output=True, text=True, timeout=180)
    pdf = os.path.join(tmp, os.path.basename(path).replace(".pptx", ".pdf"))
    ok = os.path.exists(pdf)
    pages = 0
    if ok:
        info = subprocess.run(["pdfinfo", pdf], capture_output=True, text=True).stdout
        pages = int(re.search(r"Pages:\s+(\d+)", info).group(1))
        subprocess.run(["pdftoppm", "-r", "50", "-png", pdf, pdf[:-4]], check=True)
    return {"rendered": ok, "pdf_pages": pages, "stderr": res.stderr.strip()[:200]}

def edit_follow_test(path):
    """Move one BPMN task shape; let LibreOffice re-save the file; check whether glued connectors were re-routed
    to the shape's new position (i.e. connectors 'follow' the shape)."""
    prs = Presentation(path); slide = prs.slides[-1]
    slide = next(sl for sl in prs.slides if any(sh.name == "node-t1" for sh in sl.shapes))
    task = next(sh for sh in slide.shapes if sh.name == "node-t1")
    tid = task.shape_id; dx, dy = Inches(0.6), Inches(0.35)
    attached = [sh for sh in slide.shapes if sh._element.tag == qn("p:cxnSp") and any(
        (c is not None and int(c.get("id")) == tid) for c in (sh._element.find(qn("p:nvCxnSpPr")).find(qn("p:cNvCxnSpPr")).find(qn("a:stCxn")), sh._element.find(qn("p:nvCxnSpPr")).find(qn("p:cNvCxnSpPr")).find(qn("a:endCxn"))))]
    before = {sh.name: (sh.begin_x, sh.begin_y, sh.end_x, sh.end_y) for sh in attached}
    task.left += dx; task.top += dy
    moved = path.replace(".pptx", "-moved.pptx"); prs.save(moved)
    tmp = os.path.join(OUT, "resaved"); os.makedirs(tmp, exist_ok=True)
    subprocess.run(["soffice", "--headless", "--convert-to", "pptx", "--outdir", tmp, moved], capture_output=True, timeout=180)
    resaved = os.path.join(tmp, os.path.basename(moved))
    idx = [i for i, sl in enumerate(prs.slides) if sl == slide][0]
    p2 = Presentation(resaved); s2 = p2.slides[idx]
    # LibreOffice may rename shapes; match connectors by order of appearance among connectors
    conns2 = [sh for sh in s2.shapes if sh._element.tag == qn("p:cxnSp")]
    conns1 = [sh for sh in Presentation(moved).slides[idx].shapes if sh._element.tag == qn("p:cxnSp")]
    followed = 0; checked = 0; still_glued = 0
    for i, c1 in enumerate(conns1):
        if c1.name not in before: continue
        checked += 1; c2 = conns2[i]
        b = before[c1.name]; a = (c2.begin_x, c2.begin_y, c2.end_x, c2.end_y)
        if max(abs(x - y) for x, y in zip(a, b)) > Inches(0.2): followed += 1
        cn = c2._element.find(qn("p:nvCxnSpPr")).find(qn("p:cNvCxnSpPr"))
        if cn.find(qn("a:stCxn")) is not None and cn.find(qn("a:endCxn")) is not None: still_glued += 1
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf", "--outdir", tmp, resaved], capture_output=True, timeout=180)
    pdf = resaved.replace(".pptx", ".pdf")
    if os.path.exists(pdf): subprocess.run(["pdftoppm", "-r", "50", "-png", "-f", str(idx + 1), "-l", str(idx + 1), pdf, pdf[:-4]])
    return {"moved_shape": task.name, "attached_connectors": checked, "rerouted_after_move": followed, "still_glued_after_resave": still_glued}

if __name__ == "__main__":
    report = {}
    for f in sorted(glob.glob(os.path.join(OUT, "deck-*.pptx"))):
        if f.endswith("-moved.pptx"): continue
        name = os.path.basename(f)
        report[name] = {"structure": check_deck(f), "render": render(f)}
        if "P2" in name: report[name]["edit_follow"] = edit_follow_test(f)
    json.dump(report, open(os.path.join(ROOT, "results", "e-pptx.json"), "w"), ensure_ascii=False, indent=1)
    for k, v in report.items():
        s = v["structure"]
        print(k, {x: s[x] for x in ["min_font_pt", "slides", "pictures", "tables", "connectors", "connectors_glued_both_ends", "connectors_dangling_refs", "arabic_paragraphs", "arabic_paragraphs_rtl", "runs_missing_cs_font", "text_frames_checked"]},
              "overflow_w", len(s["overflow_width"]), "overflow_h", len(s["overflow_height"]), v["render"], v.get("edit_follow"))
