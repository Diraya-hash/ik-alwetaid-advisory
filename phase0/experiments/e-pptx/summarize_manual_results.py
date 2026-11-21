"""Summarises the filled PowerPoint/Keynote results workbook (doc 16) from raw cell values (formulas are not trusted),
per dimension × app × deck, and recomputes the exit criteria. Output JSON is consumed by the GO/NO-GO evidence report.
Usage: python3 experiments/e-pptx/summarize_manual_results.py <workbook.xlsx> [--out results/validation-pack/manual-summary.json]
"""
import sys, json, os
from openpyxl import load_workbook

DIMS = ["Visual rendering", "Arabic typography", "Text direction", "Shape editability", "Connector behaviour", "Layout consistency"]
path = sys.argv[1]; out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else None
wb = load_workbook(path, data_only=False)
su, rs = wb["Setup"], wb["Results"]
hdr = [c.value for c in rs[1]]; col = {h: i for i, h in enumerate(hdr)}
setup = {}
for r in su.iter_rows(min_row=2, values_only=True):
    if r[0]: setup[r[0]] = {"app": r[1], "platform": r[2], "deck": r[3], "font": r[4], "version": r[5], "os": r[6], "tester": r[7], "date": str(r[8] or ""), "opened_without_repair": r[9], "font_substitution": r[10]}
rows, missing = [], []
for r in rs.iter_rows(min_row=2, values_only=True):
    if not r[0]: continue
    d = {h: r[col[h]] for h in hdr if h in col}
    vals = {dim: (d.get(dim) or "").strip() if isinstance(d.get(dim), str) else (d.get(dim) or "") for dim in DIMS}
    blank = [dim for dim, v in vals.items() if v == ""]
    if blank: missing.append(f"{d['Run']}/{d['Test ID']}: {', '.join(blank)}")
    overall = "FAIL" if "FAIL" in vals.values() else "PARTIAL" if "PARTIAL" in vals.values() else ("PASS" if not blank else "")
    rows.append({"run": d["Run"], "app": d["App"], "platform": d["Platform"], "deck": d["Deck"], "font": d["Font"], "test": d["Test ID"], "dims": vals, "overall": overall,
                 "severity": (d.get("Severity (worst)") or "").strip() if d.get("Severity (worst)") else "", "notes": d.get("Notes") or ""})
started = any(r["overall"] for r in rows)
complete = started and not missing and all(s.get("opened_without_repair") in ("Y", "N") for s in setup.values())
def is_app(r, app, plat=None): return r["app"] == app and (plat is None or r["platform"] == plat)
ppt = [r for r in rows if r["app"] == "PowerPoint"]
crit = {
 "all_runs_opened_without_repair": sum(1 for s in setup.values() if s.get("opened_without_repair") == "Y") == len(setup),
 "powerpoint_T01_T06_all_PASS_condition_A": all(r["overall"] == "PASS" for r in ppt if r["font"] == "A" and r["test"] in ("T01", "T02", "T03", "T04", "T05", "T06")),
 "powerpoint_connectors_PASS_T06_T08": all(r["dims"]["Connector behaviour"] == "PASS" for r in ppt if r["test"] in ("T06", "T07", "T08")),
 "no_critical_high_typography_condition_A": not any(r["font"] == "A" and r["dims"]["Arabic typography"] in ("FAIL", "PARTIAL") and r["severity"] in ("critical", "high") for r in rows),
 "keynote_no_critical_high": not any(is_app(r, "Keynote") and r["severity"] in ("critical", "high") for r in rows),
}
by_dim = {dim: {f"{a}|{p}|{dk}": {k: sum(1 for r in rows if r["app"] == a and r["platform"] == p and r["deck"] == dk and r["dims"][dim] == k) for k in ("PASS", "PARTIAL", "FAIL", "N/A")}
               for (a, p) in (("PowerPoint", "Windows"), ("PowerPoint", "macOS"), ("Keynote", "macOS")) for dk in ("ar", "en")} for dim in DIMS}
res = {"evidence_class": "cross_platform_manual_test" if complete else "cross_platform_manual_test (INCOMPLETE)",
       "workbook": os.path.basename(path), "status": "complete" if complete else ("in_progress" if started else "not_started"),
       "missing_cells": missing[:50], "missing_cells_count": len(missing), "setup": setup,
       "exit_criteria": crit, "exit_criteria_met": complete and all(crit.values()),
       "by_dimension": by_dim, "failures": [r for r in rows if r["overall"] in ("FAIL", "PARTIAL")]}
txt = json.dumps(res, ensure_ascii=False, indent=1)
if out: open(out, "w", encoding="utf-8").write(txt)
print(json.dumps({k: res[k] for k in ("evidence_class", "status", "missing_cells_count", "exit_criteria_met", "exit_criteria")}, ensure_ascii=False, indent=1))
