// Experiment D: editable BPMN visualisation (AR/EN). Layout + render + metrics + simulated canvas edits.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { ALL } from "./models.mjs";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../..");
const outDir = path.join(root, "results", "d-bpmn"); fs.mkdirSync(path.join(outDir, "geometry"), { recursive: true });

const fontDir = path.join(root, "node_modules/@fontsource");
const ff = (fam, file, w, range) => `@font-face{font-family:${fam};src:url(file://${fontDir}/${file}) format('woff2');font-weight:${w};${range ? `unicode-range:${range};` : ""}}`;
const css = [400, 500, 600].map(w => ff('"IBM Plex Sans Arabic"', `ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-arabic-${w}-normal.woff2`, w, "U+0600-06FF,U+0750-077F,U+0870-088E,U+0890-0891,U+0897-08E1,U+08E3-08FF,U+200C-200E,U+2010-2011,U+204F,U+2E41,U+FB50-FDFF,U+FE70-FE74,U+FE76-FEFC")
  + ff('"IBM Plex Sans Arabic"', `ibm-plex-sans-arabic/files/ibm-plex-sans-arabic-latin-${w}-normal.woff2`, w, "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD")
  + ff("Inter", `inter/files/inter-latin-${w}-normal.woff2`, w)).join("\n");
const html = path.join(outDir, "page.html");
fs.writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>${css} body{margin:0;background:#fff}</style></head><body></body></html>`);

// ---- edit operations (what canvas edits do to the model)
const clone = m => structuredClone(m);
const midTask = m => m.nodes.filter(n => n.type === "task")[Math.floor(m.nodes.filter(n => n.type === "task").length / 2)];
const OPS = {
  rename_long: m => { const t = midTask(m); t.label = { en: "Re-validate the supporting documents against the updated policy and record exceptions", ar: "إعادة التحقق من المستندات الداعمة وفق السياسة المحدثة وتسجيل الاستثناءات" }; return m; },
  insert_after: m => { const t = midTask(m); const id = "new1"; m.nodes.splice(m.nodes.indexOf(t) + 1, 0, { id, type: "task", lane: t.lane, label: { en: "Notify stakeholders", ar: "إشعار أصحاب المصلحة" } });
    m.edges.filter(e => e.from === t.id).forEach(e => { e.from = id; e.id = `${id}-${e.to}`; }); m.edges.push({ id: `${t.id}-${id}`, from: t.id, to: id }); return m; },
  move_lane: m => { const t = midTask(m); const other = m.lanes.find(l => l.id !== t.lane); t.lane = other.id; return m; },
  add_branch: m => { const g = m.nodes.find(n => n.type === "gateway"); if (!g) return m; const end = m.nodes.find(n => n.type === "end");
    m.nodes.push({ id: "esc", type: "task", lane: g.lane, label: { en: "Escalate to director", ar: "التصعيد إلى المدير" } });
    m.edges.push({ id: `${g.id}-esc`, from: g.id, to: "esc", label: { en: "Escalate", ar: "تصعيد" } }, { id: `esc-${end.id}`, from: "esc", to: end.id }); return m; },
  delete_task: m => { const t = m.nodes.find(n => n.type === "task" && m.edges.filter(e => e.to === n.id).length === 1 && m.edges.filter(e => e.from === n.id).length === 1);
    if (!t) return m; const inn = m.edges.find(e => e.to === t.id), out = m.edges.find(e => e.from === t.id);
    m.nodes = m.nodes.filter(n => n !== t); m.edges = m.edges.filter(e => e !== inn && e !== out); m.edges.push({ id: `${inn.from}-${out.to}`, from: inn.from, to: out.to, ...(inn.label ? { label: inn.label } : {}) }); return m; },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto("file://" + html);
await page.addScriptTag({ path: path.join(here, "layout.js") });
// Font readiness gate (finding from run 1: canvas measurement before fonts are fully ready gave up to 24px error).
await page.evaluate(async () => {
  const specs = [400, 500, 600].flatMap(w => [`${w} 13px "IBM Plex Sans Arabic"`, `${w} 13px Inter`, `${w} 11px Inter`, `${w} 11px "IBM Plex Sans Arabic"`]);
  for (const s of specs) { await document.fonts.load(s, "عربي Latin"); }
  const warm = document.createElement("div"); warm.style.cssText = "position:absolute;visibility:hidden";
  warm.innerHTML = '<span style="font:500 13px \'IBM Plex Sans Arabic\'">عربي اختبار</span><span style="font:500 13px Inter">Latin test</span>';
  document.body.appendChild(warm); await document.fonts.ready; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); warm.remove();
});
// Self-test (finding from run 2: fonts.load() was not enough — first canvas measurements still used fallback
// metrics). The layout service must not serve until canvas and rendered-SVG widths agree for probe strings.
const selfTest = await page.evaluate(async () => {
  const probes = [["التحقق من توفر الميزانية", '"IBM Plex Sans Arabic"'], ["Fill purchase request with budget code", "Inter"]];
  const c = document.createElement("canvas").getContext("2d"); const ns = "http://www.w3.org/2000/svg";
  for (let attempt = 1; attempt <= 50; attempt++) {
    let worst = 0;
    for (const [txt, fam] of probes) {
      c.font = `500 13px ${fam}`; const cw = c.measureText(txt).width;
      const svg = document.createElementNS(ns, "svg"); const t = document.createElementNS(ns, "text");
      t.setAttribute("font-family", fam); t.setAttribute("font-size", 13); t.setAttribute("font-weight", 500); t.textContent = txt;
      svg.appendChild(t); document.body.appendChild(svg); const sw = t.getComputedTextLength(); svg.remove();
      worst = Math.max(worst, Math.abs(cw - sw));
    }
    if (worst < 1) return { ok: true, attempts: attempt, worstDeltaPx: +worst.toFixed(2) };
    await new Promise(r => setTimeout(r, 50));
  }
  return { ok: false };
});
if (!selfTest.ok) throw new Error("layout service self-test failed: canvas/SVG measurement mismatch");
const fontsOK = await page.evaluate(() => [document.fonts.check('500 13px "IBM Plex Sans Arabic"', "عربي"), document.fonts.check("500 13px Inter", "Latin")]);

const FIXED = process.argv.includes("--fixed-columns");
async function run(model, lang, dir, shot) {
  const r = await page.evaluate(([m, lang, dir, fixed]) => { const r = BPMN.layout(m, lang, dir, { fixedColumns: fixed }); const met = BPMN.metrics(r); const t0 = performance.now(); const fit = BPMN.render(r); return { r, met, fit, renderMs: +(performance.now() - t0).toFixed(1) }; }, [model, lang, dir, FIXED]);
  if (shot) await page.locator("svg").screenshot({ path: path.join(outDir, `${model.id}-${lang}${FIXED ? "-fixed" : ""}.png`) });
  return r;
}

const results = [];
for (const m of ALL) for (const [lang, dir] of [["en", "ltr"], ["ar", "rtl"]]) {
  const base = await run(m, lang, dir, true);
  fs.writeFileSync(path.join(outDir, "geometry", `${m.id}-${lang}${FIXED ? "-fixed" : ""}.json`), JSON.stringify(base.r));
  const pos0 = Object.fromEntries(base.r.nodes.map(n => [n.id, [n.x, n.y]]));
  const struct0 = Object.fromEntries(base.r.nodes.map(n => [n.id, `${n.layer}|${n.lane}`]));
  const edits = [];
  for (const [op, fn] of Object.entries(OPS)) {
    const mm = fn(clone(m)); const t0 = Date.now(); const er = await run(mm, lang, dir, false); const roundTrip = Date.now() - t0;
    const moved = er.r.nodes.filter(n => pos0[n.id]).map(n => Math.hypot(n.x - pos0[n.id][0], n.y - pos0[n.id][1]));
    const kept = er.r.nodes.filter(n => struct0[n.id]); const structStable = kept.filter(n => struct0[n.id] === `${n.layer}|${n.lane}`).length;
    edits.push({ op, ...er.met, labelOverflow: er.fit.labelOverflow, layoutMs: er.r.layoutMs, roundTripMs: roundTrip,
      unchangedNodesStablePct: +(100 * moved.filter(d => d < 5).length / moved.length).toFixed(1), structurallyStablePct: +(100 * structStable / kept.length).toFixed(1), meanDisplacementPx: +(moved.reduce((a, b) => a + b, 0) / moved.length).toFixed(1) });
  }
  results.push({ model: m.id, lang, dir, size: { W: Math.round(base.r.W), H: Math.round(base.r.H) }, ...base.met, ...base.fit, layoutMs: base.r.layoutMs, renderMs: base.renderMs, edits });
}
await browser.close();

const agg = (k, f = Math.max) => f(...results.map(r => r[k]));
const allEdits = results.flatMap(r => r.edits);
const summary = {
  experiment: "D-bpmn", fontsLoaded: fontsOK, selfTest, runs: results.length, models: ALL.map(m => `${m.id}:${m.nodes.length}n/${m.edges.length}e/${m.lanes.length}l`),
  base: { nodeOverlaps_total: results.reduce((a, r) => a + r.nodeOverlaps, 0), edgeThroughNode_total: results.reduce((a, r) => a + r.edgeThroughNode, 0),
    edgeCrossings_by_run: Object.fromEntries(results.map(r => [`${r.model}-${r.lang}`, r.edgeCrossings])),
    collinearOverlaps_total: results.reduce((a, r) => a + r.collinearOverlaps, 0), edgeThroughLabel_total: results.reduce((a, r) => a + r.edgeThroughLabel, 0),
    labelOverflow_total: results.reduce((a, r) => a + r.labelOverflow, 0), labelLines_total: results.reduce((a, r) => a + r.labelLines, 0),
    flowDirectionCorrectPct_min: agg("flowDirectionCorrectPct", Math.min), nodesInsideLanePct_min: agg("nodesInsideLanePct", Math.min),
    measureParityMaxDeltaPx: agg("measureParityMaxDeltaPx"), layoutMs_max: agg("layoutMs"), renderMs_max: agg("renderMs") },
  edits: { n: allEdits.length, collinearOverlaps_total: allEdits.reduce((a, e) => a + e.collinearOverlaps, 0), edgeThroughLabel_total: allEdits.reduce((a, e) => a + e.edgeThroughLabel, 0), nodeOverlaps_total: allEdits.reduce((a, e) => a + e.nodeOverlaps, 0), edgeThroughNode_total: allEdits.reduce((a, e) => a + e.edgeThroughNode, 0),
    labelOverflow_total: allEdits.reduce((a, e) => a + e.labelOverflow, 0), roundTripMs_p90: allEdits.map(e => e.roundTripMs).sort((a, b) => a - b)[Math.floor(allEdits.length * 0.9)],
    stableNodesPct_mean: +(allEdits.reduce((a, e) => a + e.unchangedNodesStablePct, 0) / allEdits.length).toFixed(1),
    structurallyStablePct_mean: +(allEdits.reduce((a, e) => a + e.structurallyStablePct, 0) / allEdits.length).toFixed(1),
    structurallyStablePct_by_op: Object.fromEntries(Object.keys(OPS).map(op => [op, +(allEdits.filter(e => e.op === op).reduce((a, e) => a + e.structurallyStablePct, 0) / allEdits.filter(e => e.op === op).length).toFixed(1)])),
    stableNodesPct_by_op: Object.fromEntries(Object.keys(OPS).map(op => [op, +(allEdits.filter(e => e.op === op).reduce((a, e) => a + e.unchangedNodesStablePct, 0) / allEdits.filter(e => e.op === op).length).toFixed(1)])) },
};
summary.fixedColumns = FIXED;
fs.writeFileSync(path.join(root, "results", `d-bpmn${FIXED ? "-fixed" : ""}.json`), JSON.stringify({ summary, results }, null, 1));
console.log(JSON.stringify(summary, null, 1));
for (const r of results) console.log(`${r.model}-${r.lang}: ${r.nodes}n overlaps=${r.nodeOverlaps} edgeThroughNode=${r.edgeThroughNode} crossings=${r.edgeCrossings} dir=${r.flowDirectionCorrectPct}% overflow=${r.labelOverflow}/${r.labelLines} parity=${r.measureParityMaxDeltaPx}px layout=${r.layoutMs}ms size=${r.size.W}x${r.size.H}`);
