// Full product E2E: six-stage expert playthrough, submission, report, CSV export and the
// progress pages, in ar/en x light/dark x desktop/mobile; plus a start-up smoke test of every scenario.
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = path.resolve("out");
const SHOTS = process.env.SHOTS_DIR ?? "screenshots-full";
const AXE = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".txt": "text/plain" };
// Serve with the production security headers from vercel.json so CSP violations fail the run.
const prodHeaders = Object.fromEntries(JSON.parse(await readFile("vercel.json", "utf8")).headers[0].headers.filter((h) => h.key !== "Strict-Transport-Security").map((h) => [h.key, h.value.replace("; upgrade-insecure-requests", "")]));
const server = createServer(async (req, res) => {
  let p = path.join(OUT, decodeURIComponent(new URL(req.url, "http://x").pathname));
  try { if ((await stat(p)).isDirectory()) p = path.join(p, "index.html"); } catch {}
  try { res.writeHead(200, { ...prodHeaders, "content-type": types[path.extname(p)] ?? "application/octet-stream" }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end("nf"); }
}).listen(0);
const base = `http://localhost:${server.address().port}`;
await mkdir(SHOTS, { recursive: true });
const problems = [];
const browser = await chromium.launch();
const SCENARIOS = ["claims-quality", "service-centre", "quiet-team", "platform-adoption", "merger-hangover", "empty-bench", "shared-services", "strategy-stalled", "talent-cliff", "hospital-flow"];

async function axe(page, tag) {
  await page.addScriptTag({ content: AXE });
  const v = await page.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
  v.forEach((x) => problems.push(`[axe ${tag}] ${x}`));
}
const overflow = async (page, tag) => {
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) problems.push(`[overflow ${tag}]`);
};

for (const locale of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const vp of [{ n: "desktop", width: 1440, height: 900 }, { n: "mobile", width: 390, height: 844 }]) {
  const tag = `${locale}-${theme}-${vp.n}`;
  const ctx = await browser.newContext({ viewport: vp, colorScheme: theme, acceptDownloads: true });
  await ctx.addInitScript((t) => { try { localStorage.setItem("ik-theme", t); } catch {} }, theme);
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`[pageerror ${tag}] ${e.message}`));
  page.on("console", (m) => m.type() === "error" && problems.push(`[console ${tag}] ${m.text()}`));
  const mobile = vp.n === "mobile";
  const shot = (n) => page.screenshot({ path: `${SHOTS}/${tag}-${n}.png`, fullPage: !mobile });
  const workTab = async () => { if (mobile) await page.getByRole("tab").nth(0).click(); };
  const advance = async () => { await page.locator('[data-testid="stage-advance"]').click(); await page.waitForTimeout(150); };

  try {
    // Stage 1
    await page.goto(`${base}/${locale}/scenarios/service-centre/`);
    await page.locator("main button").filter({ hasText: locale === "en" ? "Start new engagement" : "ابدأ مهمة جديدة" }).first().click();
    await page.waitForURL(/simulate/);
    await page.locator("#framing-f-gap").waitFor();
    const reviews = page.getByRole("button", { name: locale === "en" ? /^Review/ : /^راجِع/ });
    while (await reviews.count()) await reviews.first().click();
    if (await page.locator('[data-testid="stage-advance"]').isEnabled()) problems.push(`[gate ${tag}] stage 2 open before framing`);
    await page.locator("#framing-f-gap").check();
    await page.getByRole("button", { name: locale === "en" ? "Record framing" : "سجّل التأطير" }).click();
    await advance();
    // Stage 2: an expert sequence
    const plan = [["dm", "q-dm-priority"], ["dm", "q-dm-audit"], ["it", "q-it-design"], ["it", "q-it-durations"], ["sv", "q-sv-day"], ["sv", "q-sv-roster"], ["of", "q-of-walk"], ["of", "q-of-phones"], ["dir", "q-dir-ch-phones"], ["dm", "q-dm-ch-signoff"]];
    for (const [s, qid] of plan) {
      await page.locator(`[data-stakeholder="${s}"]`).click();
      const btn = page.locator(`[data-q="${qid}"] button`);
      if (!(await btn.count())) { problems.push(`[flow ${tag}] question ${qid} not available`); continue; }
      await btn.click();
    }
    await shot("stage2");
    await advance();
    // Stage 3
    const verdict = async (c, i, evs) => {
      await page.locator(`[data-cause="${c}"] [role="radio"]`).nth(i).click();
      for (const e of evs) await page.locator(`#link-${c}-${e}`).check();
    };
    await verdict("rc-booking", 0, ["ev-sc-slots"]);
    await verdict("rc-approvals", 0, ["ev-sc-signoff", "ev-sc-waiting"]);
    await verdict("rc-roster", 0, ["ev-sc-roster"]);
    await verdict("rc-knowledge", 0, ["ev-sc-kb"]);
    await verdict("rc-motivation", 1, ["ev-sc-phones"]);
    await verdict("rc-skills", 1, ["ev-sc-engagement"]);
    await verdict("rc-volume", 1, ["ev-sc-volume"]);
    await shot("stage3");
    await overflow(page, `${tag} stage3`);
    await advance();
    // Stage 4
    const gaps = [["gap-scheduling", "technology"], ["gap-controls", "governance"], ["gap-workforce-scheduling", "process"], ["gap-knowledge", "process"], ["gap-time", null], ["gap-service", null]];
    for (const [g, nature] of gaps) {
      await page.locator(`[data-gap="${g}"] [role="radio"]`).nth(nature ? 0 : 1).click();
      if (nature) await page.locator(`#nature-${g}`).selectOption(nature);
    }
    if (await page.locator('[data-testid="stage-advance"]').isDisabled()) problems.push(`[gate ${tag}] stage 5 locked after assessing all gaps`);
    await advance();
    // Stage 5
    for (const [iv, c] of [["iv-slots", "rc-booking"], ["iv-targeted-control", "rc-approvals"], ["iv-roster", "rc-roster"], ["iv-kb", "rc-knowledge"]]) {
      await page.locator(`#iv-${iv}`).check();
      await page.locator(`[data-iv="${iv}"] [data-chip="${c}"]`).click();
    }
    await shot("stage5");
    await advance();
    // Stage 6
    for (const [k, level, owner] of [["k-wait", "strategic", "dm"], ["k-signoff-wait", "operational", "dir"], ["k-calls", "behavioural", "sv"], ["k-overrun", "operational", "it"]]) {
      await page.locator(`#kpi-${k}`).check();
      await page.locator(`#kpi-${k}-level`).selectOption(level);
      await page.locator(`#kpi-${k}-owner`).selectOption(owner);
    }
    await advance(); // submit
    await page.getByRole("link", { name: locale === "en" ? /View report/ : /اعرض التقرير/ }).click();
    await page.waitForURL(/report/);
    const scoreAttr = await page.locator('[data-testid="overall-score"]').getAttribute("data-score");
    if (Number(scoreAttr) < 75) problems.push(`[score ${tag}] expert path scored ${scoreAttr}`);
    const sections = await page.locator("section.report-section").count();
    if (sections !== 13) problems.push(`[report ${tag}] ${sections} sections`);
    await shot("report");
    await overflow(page, `${tag} report`);
    if (!mobile && theme === "light") await axe(page, `${tag} report`);
    if (!mobile && theme === "light" && locale === "en") {
      const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download CSV" }).click()]);
      const csvPath = await dl.path();
      const csv = await readFile(csvPath, "utf8");
      if (!csv.startsWith("﻿section,item")) problems.push(`[csv ${tag}] unexpected header`);
    }
    // Progress pages now have data
    for (const route of ["", "simulations", "insights", "analytics", "development"]) {
      await page.goto(`${base}/${locale}/${route}${route ? "/" : ""}`);
      await page.waitForTimeout(250);
      await overflow(page, `${tag} /${route}`);
      if (!mobile && theme === "light") await axe(page, `${tag} /${route}`);
    }
    await page.goto(`${base}/${locale}/analytics/`);
    if (!(await page.locator('svg[role="img"]').count())) problems.push(`[analytics ${tag}] chart missing`);
    await shot("analytics");
    await page.goto(`${base}/${locale}/development/`);
    await shot("development");
    await page.goto(`${base}/${locale}/`);
    await page.waitForTimeout(250);
    await shot("dashboard");
  } catch (e) {
    problems.push(`[exception ${tag}] ${e.message.split("\n").slice(0, 4).join(" | ")}`);
    await shot("failure").catch(() => {});
  }
  await ctx.close();
}

// Every scenario starts and renders Stage 1 in both languages.
for (const locale of ["en", "ar"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => problems.push(`[pageerror smoke-${locale}] ${e.message}`));
  for (const id of SCENARIOS) {
    await page.goto(`${base}/${locale}/scenarios/${id}/`);
    await page.locator("main button").filter({ hasText: locale === "en" ? "Start new engagement" : "ابدأ مهمة جديدة" }).first().click();
    await page.waitForURL(/simulate/);
    const ok = await page.locator('[id^="framing-"]').first().waitFor({ timeout: 10000 }).then(() => true, () => false);
    if (!ok) problems.push(`[smoke ${locale}] ${id} stage 1 missing framing`);
  }
  await ctx.close();
}
await browser.close(); server.close();
console.log(problems.length ? problems.join("\n") + `\n${problems.length} problem(s)` : `Full E2E passed. Screenshots in ${SHOTS}`);
process.exit(problems.length ? 1 : 0);
