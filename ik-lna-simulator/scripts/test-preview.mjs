// Smoke-tests the single-file preview inside a host-like skeleton (hash routing, no confirm()).
import { createServer } from "node:http";
import { readFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const SHOTS = process.env.SHOTS_DIR ?? "screenshots-preview";
mkdirSync(SHOTS, { recursive: true });
const page0 = readFileSync("out-preview/ik-lna-simulator.html", "utf8");
const doc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0}</style></head><body>${page0}</body></html>`;
const AXE = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
const server = createServer((_, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end(doc); }).listen(0);
const base = `http://localhost:${server.address().port}/`;
const problems = [];
const browser = await chromium.launch();

for (const locale of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const vp of [{ n: "desktop", width: 1440, height: 900 }, { n: "mobile", width: 390, height: 844 }]) {
  const tag = `${locale}-${theme}-${vp.n}`;
  const ctx = await browser.newContext({ viewport: vp, colorScheme: theme });
  await ctx.addInitScript(([t, l]) => { try { localStorage.setItem("ik-theme", t); localStorage.setItem("ik-locale", l); } catch {} }, [theme, locale]);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`[pageerror ${tag}] ${e.message}`));
  page.on("console", (m) => m.type() === "error" && !/fonts\.(googleapis|gstatic)|Failed to load resource/.test(m.text()) && problems.push(`[console ${tag}] ${m.text()}`));
  page.on("dialog", (d) => { problems.push(`[dialog ${tag}] native ${d.type()} used`); d.dismiss(); });
  const shot = (n) => page.screenshot({ path: `${SHOTS}/${tag}-${n}.png`, fullPage: vp.n === "desktop" });
  const en = locale === "en";

  await page.goto(base);
  await page.waitForFunction((l) => location.hash === `#${l}-home`, locale);
  if ((await page.evaluate(() => document.documentElement.dir)) !== (en ? "ltr" : "rtl")) problems.push(`[dir ${tag}]`);
  await shot("dashboard");
  for (const route of ["scenarios", "methodology", "preferences", "analytics", "development", "insights", "simulations"]) {
    await page.goto(`${base}#${locale}-${route}`);
    await page.waitForTimeout(150);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(`[overflow ${tag}] ${route}`);
    if (await page.getByText(en ? "Not found" : "غير موجود").count()) problems.push(`[route ${tag}] ${route} not found`);
    if (vp.n === "desktop" && theme === "light") {
      await page.addScriptTag({ content: AXE });
      const v = await page.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
      v.forEach((x) => problems.push(`[axe ${tag} ${route}] ${x}`));
    }
  }

  // Navigate by clicking, start an engagement.
  await page.goto(`${base}#${locale}-scenarios`);
  await page.getByRole("link", { name: en ? "The Accuracy Problem" : "معضلة الدقة" }).click();
  await page.waitForFunction(() => location.hash.endsWith("scenarios--claims-quality"));
  await page.getByRole("button", { name: en ? /Start new engagement/ : /ابدأ مهمة جديدة/ }).click();
  await page.waitForFunction(() => location.hash.includes("-simulate--"));
  const advance = page.getByRole("button", { name: en ? /Proceed to stakeholder/ : /انتقل إلى استكشاف/ });
  if (!(await advance.isDisabled())) problems.push(`[flow ${tag}] could advance without framing`);
  await page.getByRole("button", { name: en ? /Review/ : /راجِع/ }).first().click();
  await page.locator("#framing-f-gap").check();
  await page.getByRole("button", { name: en ? "Record framing" : "سجّل التأطير" }).click();
  await shot("stage1");
  await advance.click();
  const pick = (n) => page.locator("nav button").filter({ hasText: n }).first().click();
  await pick(en ? "Faisal Al-Shammari" : "فيصل الشمري");
  await page.getByRole("button", { name: en ? /^Ask/ : /^اسأل/ }).first().click();
  if (!(await page.getByText(en ? /Corporate Contract at Risk/ : /عقد مؤسسي معرّض للخطر/).count())) problems.push(`[flow ${tag}] COO evidence not revealed`);
  await shot("stage2");

  // Language switch keeps the attempt.
  const other = en ? "ar" : "en";
  if (vp.n === "mobile") await page.getByRole("button", { name: /^(Menu|القائمة)$/ }).click();
  await page.getByRole("button", { name: other === "ar" ? /العربية/ : /English/ }).last().click();
  await page.waitForFunction((o) => location.hash.startsWith(`#${o}-simulate--`), other);
  const step = await page.locator('[aria-current="step"]').innerText();
  if (!/[2٢]/.test(step)) problems.push(`[i18n ${tag}] stage lost: ${step}`);

  // In-page delete confirmation.
  await page.goto(`${base}#${locale}-simulations`);
  await page.getByRole("button", { name: en ? /^Delete:/ : /^حذف:/ }).click();
  await page.getByRole("button", { name: en ? "Confirm" : "تأكيد" }).click();
  if (!(await page.getByText(en ? "You haven't started any engagements yet." : "لم تبدأ أي مهمة بعد.").count())) problems.push(`[confirm ${tag}] attempt not deleted`);

  // Data panel (no download offered in preview).
  await page.goto(`${base}#${locale}-preferences`);
  await page.getByRole("button", { name: en ? "Show my data" : "اعرض بياناتي" }).click();
  if (!(await page.locator("#data-json").count())) problems.push(`[data ${tag}] panel missing`);
  if (await page.getByRole("button", { name: en ? "Download file" : "نزّل الملف" }).count()) problems.push(`[data ${tag}] download offered in preview`);
  await ctx.close();
}
await browser.close(); server.close();
console.log(problems.length ? problems.join("\n") + `\n${problems.length} problem(s)` : `Preview checks passed. Screenshots in ${SHOTS}`);
process.exit(problems.length ? 1 : 0);
