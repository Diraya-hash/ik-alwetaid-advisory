import path from "node:path"; import { createRequire } from "node:module"; import { fileURLToPath } from "node:url";
import { P1, P2 } from "./models.mjs";
const require = createRequire(import.meta.url); const { chromium } = require("playwright");
const here = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch(); const p = await b.newPage();
await p.goto("file://" + path.resolve(here, "../../results/d-bpmn/page.html")); await p.addScriptTag({ path: path.join(here, "layout.js") });
await p.evaluate(async () => { await document.fonts.load('500 13px "IBM Plex Sans Arabic"', "عربي"); await document.fonts.load("500 13px Inter", "a"); });
for (const m of [P1, P2, P1]) for (const lang of ["ar"]) {
  const rows = await p.evaluate(([m, lang]) => { const r = BPMN.layout(m, lang, "rtl"); const fit = BPMN.render(r);
    const c = document.createElement("canvas").getContext("2d"); c.font = '500 13px "IBM Plex Sans Arabic"';
    const bad = []; r.nodes.forEach(n => n.lines.forEach((ln, k) => { const t = document.querySelector(`text[data-node="${n.id}"]`).querySelectorAll("tspan")[k];
      const sv = t.getComputedTextLength(), cv = c.measureText(ln).width; if (Math.abs(sv - cv) > 3) bad.push({ id: n.id, ln, sv: +sv.toFixed(1), cv: +cv.toFixed(1), fam: getComputedStyle(t).fontFamily, w: getComputedStyle(t).fontWeight }); }));
    return { model: m.id, fit, bad }; }, [m, lang]);
  console.log(JSON.stringify(rows));
}
await b.close();
