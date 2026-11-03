// Checks WCAG contrast of every text token against every surface token, in both themes.
import { readFileSync } from "node:fs";
const css = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");
const block = (sel) => Object.fromEntries([...css.split(sel)[1].split("}")[0].matchAll(/--([\w-]+):\s*(\d+) (\d+) (\d+)/g)].map((m) => [m[1], [+m[2], +m[3], +m[4]]]));
const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const mix = (a, b, t) => a.map((v, i) => Math.round(v * t + b[i] * (1 - t)));
let fail = 0;
for (const [name, sel] of [["light", ":root {"], ["dark", ".dark {"]]) {
  const t = block(sel);
  const surfaces = { bg: t.bg, surface: t.surface, "surface-2": t["surface-2"], "surface-3": t["surface-3"], "primary-soft": t["primary-soft"], "primary-soft/60": mix(t["primary-soft"], t.surface, 0.6) };
  const pairs = [["text", 7], ["text-muted", 4.5], ["text-subtle", 4.5], ["primary", 4.5], ["primary-soft-fg", 4.5]];
  for (const [fg, min] of pairs) for (const [sn, sv] of Object.entries(surfaces)) {
    const r = ratio(t[fg], sv);
    if (r < min) { fail++; console.log(`${name}: ${fg} on ${sn} = ${r.toFixed(2)} (< ${min})`); }
  }
  for (const k of ["fact", "claim", "assumption", "system", "danger", "warning"]) {
    const r = ratio(t[k], t[`${k}-soft`]);
    if (r < 4.5) { fail++; console.log(`${name}: ${k} on ${k}-soft = ${r.toFixed(2)}`); }
  }
  const r = ratio(t["primary-fg"], t.primary); if (r < 4.5) { fail++; console.log(`${name}: primary-fg on primary = ${r.toFixed(2)}`); }
  const n = ratio(t["navy-fg"], t.navy); if (n < 7) { fail++; console.log(`${name}: navy-fg on navy = ${n.toFixed(2)}`); }
}
console.log(fail ? `${fail} failing pair(s)` : "All token pairs meet WCAG AA");
process.exit(fail ? 1 : 0);
