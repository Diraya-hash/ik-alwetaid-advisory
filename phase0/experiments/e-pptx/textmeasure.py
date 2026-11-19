"""Shaped text measurement (HarfBuzz) shared by the exporter and the validator."""
import os, re
import uharfbuzz as hb
AR = re.compile(r"[؀-ۿ]")
FONTS = {"ar": {False: os.path.expanduser("~/.fonts/IBMPlexSansArabic-arabic-400.ttf"), True: os.path.expanduser("~/.fonts/IBMPlexSansArabic-arabic-700.ttf")},
         "arlat": {False: os.path.expanduser("~/.fonts/IBMPlexSansArabic-latin-400.ttf"), True: os.path.expanduser("~/.fonts/IBMPlexSansArabic-latin-700.ttf")},
         "en": {False: "/usr/share/fonts/opentype/inter/Inter-Regular.otf", True: "/usr/share/fonts/opentype/inter/Inter-Bold.otf"}}
_cache = {}
def _font(path):
    if path not in _cache:
        face = hb.Face(hb.Blob.from_file_path(path)); _cache[path] = (hb.Font(face), face.upem)
    return _cache[path]
def width_pt(text, size_pt, lang, bold=False):
    total = 0.0
    for run in re.findall(r"[؀-ۿ٠-٩\s،؛؟٪٫]+|[^؀-ۿ٠-٩]+", text):
        is_ar = bool(re.search(r"[؀-ۿ٠-٩]", run))
        f, upem = _font(FONTS["ar" if is_ar else ("arlat" if lang == "ar" else "en")][bold])
        buf = hb.Buffer(); buf.add_str(run); buf.guess_segment_properties(); hb.shape(f, buf, {})
        total += sum(p.x_advance for p in buf.glyph_positions) / upem * size_pt
    return total
