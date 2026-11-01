// End-to-end smoke test: serves ./out, plays through the pilot scenario in every
// locale × theme combination, captures screenshots, runs axe, and fails on console errors.
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = path.resolve("out");
const SHOTS = path.resolve(process.env.SHOTS_DIR ?? "screenshots");
const AXE = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".svg": "image/svg+xml" };

const server = createServer(async (req, res) => {
  let p = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  try { if ((await stat(p)).isDirectory()) p = path.join(p, "index.html"); } catch { p = p.endsWith(".html") ? p : `${p}.html`; }
  try { res.writeHead(200, { "content-type": types[path.extname(p)] ?? "application/octet-stream" }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end("not found"); }
}).listen(0);
const base = `http://localhost:${server.address().port}`;
await mkdir(SHOTS, { recursive: true });

const browser = await chromium.launch();
const problems = [];

async function axe(page, label) {
  await page.addScriptTag({ content: AXE });
  const r = await page.evaluate(async () => (await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target}`));
  r.forEach((v) => problems.push(`[axe ${label}] ${v}`));
}

for (const locale of ["en", "ar"]) {
  for (const theme of ["light", "dark"]) {
    for (const vp of [{ name: "desktop", width: 1440, height: 900 }, { name: "mobile", width: 390, height: 844 }]) {
      const tag = `${locale}-${theme}-${vp.name}`;
      const ctx = await browser.newContext({ viewport: vp, colorScheme: theme });
      await ctx.addInitScript((t) => { try { localStorage.setItem("ik-theme", t); } catch {} }, theme);
      const page = await ctx.newPage();
      page.on("console", (m) => m.type() === "error" && problems.push(`[console ${tag}] ${m.text()}`));
      page.on("pageerror", (e) => problems.push(`[pageerror ${tag}] ${e.message}`));
      const shot = async (name) => { await page.waitForTimeout(250); await page.screenshot({ path: `${SHOTS}/${tag}-${name}.png`, fullPage: vp.name === "desktop" }); };

      for (const route of ["", "scenarios", "methodology", "settings", "simulations", "analytics", "development", "insights"]) {
        await page.goto(`${base}/${locale}/${route}${route ? "/" : ""}`);
        await page.waitForLoadState("networkidle");
        const dir = await page.evaluate(() => document.documentElement.dir);
        if (dir !== (locale === "ar" ? "rtl" : "ltr")) problems.push(`[dir ${tag}] ${route} has dir=${dir}`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        if (overflow) problems.push(`[overflow ${tag}] /${route} scrolls horizontally`);
        if (vp.name === "desktop") await axe(page, `${tag} /${route}`);
        if (["", "scenarios", "methodology"].includes(route) || vp.name === "desktop") await shot(route || "dashboard");
      }

      // Play through: briefing → start → review documents → advance → interview with a challenge.
      await page.goto(`${base}/${locale}/scenarios/claims-quality/`);
      await page.waitForLoadState("networkidle");
      await shot("briefing");
      await page.locator("aside button, main button").filter({ hasText: locale === "en" ? "Start new engagement" : "ابدأ مهمة جديدة" }).first().click();
      await page.waitForURL(/simulate/);
      const review = page.getByRole("button", { name: locale === "en" ? /Review/ : /راجِع/ });
      await review.first().click();
      await review.first().click();
      await page.locator("#hyp-text").fill(locale === "en" ? "Higher targets may be trading accuracy for speed" : "قد تكون المستهدفات الأعلى تُقدّم السرعة على الدقة").catch(() => {});
      if (vp.name === "mobile") {
        await page.getByRole("tab").nth(1).click();
        await page.locator("#hyp-text").fill(locale === "en" ? "Higher targets may be trading accuracy for speed" : "قد تكون المستهدفات الأعلى تُقدّم السرعة على الدقة");
        await page.locator("form button[type=submit]").click();
        await shot("stage1-evidence");
        await page.getByRole("tab").nth(0).click();
      } else {
        await page.locator("form button[type=submit]").click();
      }
      await shot("stage1");
      await page.locator("#framing-f-gap").check();
      await page.getByRole("button", { name: locale === "en" ? "Record framing" : "سجّل التأطير" }).click();
      await page.getByRole("button", { name: locale === "en" ? /Proceed to stakeholder/ : /انتقل إلى استكشاف/ }).click();
      const pick = (name) => page.locator("nav button").filter({ hasText: name }).first().click();
      await pick(locale === "en" ? "Sara Al-Qahtani" : "سارة القحطاني");
      const ask = page.getByRole("button", { name: locale === "en" ? /^Ask/ : /^اسأل/ });
      await ask.first().click();
      await pick(locale === "en" ? "Omar Haddad" : "عمر حداد");
      const challenge = page.locator("h3").filter({ hasText: locale === "en" ? "Challenge with evidence" : "اختبر الافتراض بالدليل" });
      if (!(await challenge.count())) problems.push(`[flow ${tag}] challenge question did not unlock`);
      await page.getByRole("button", { name: locale === "en" ? /^Ask/ : /^اسأل/ }).first().click();
      await shot("stage2");
      if (vp.name === "desktop") await axe(page, `${tag} /simulate`);

      // Switching language must keep the attempt and progress.
      const omarBubbles = await page.locator(".rounded-se-sm").count();
      if (omarBubbles !== 1) problems.push(`[flow ${tag}] expected 1 question in Omar's transcript, saw ${omarBubbles}`);
      const other = locale === "en" ? "ar" : "en";
      const toggle = page.getByRole("button", { name: other === "ar" ? /العربية/ : /English/ });
      if (vp.name === "mobile") await page.getByRole("button", { name: /^(Menu|القائمة)$/ }).click();
      await toggle.last().click();
      await page.waitForURL(new RegExp(`/${other}/simulate/?\\?attempt=`));
      await page.waitForLoadState("networkidle");
      const step = await page.locator('[aria-current="step"]').innerText();
      if (!/[2٢]/.test(step)) problems.push(`[i18n ${tag}] stage lost after language switch: "${step}"`);
      await page.locator("nav button").filter({ hasText: other === "ar" ? "عمر حداد" : "Omar Haddad" }).first().click();
      const after = await page.locator(".rounded-se-sm").count();
      if (after !== 1) problems.push(`[i18n ${tag}] Omar's transcript lost after language switch (saw ${after})`);
      const hours = await page.getByText(other === "ar" ? /متبقٍّ/ : /hours left/).first().innerText();
      await shot(`stage2-after-switch-to-${other}`);
      if (!hours) problems.push(`[i18n ${tag}] budget missing after switch`);
      await ctx.close();
    }
  }
}
await browser.close();
server.close();
if (problems.length) { console.log(problems.join("\n")); console.log(`\n${problems.length} problem(s)`); process.exit(1); }
console.log("All checks passed. Screenshots in", SHOTS);
