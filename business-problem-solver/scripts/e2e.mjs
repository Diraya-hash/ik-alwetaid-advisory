// End-to-end checks on the static build, served with the production security headers (CSP) from vercel.json:
// full journey (challenge → intake → diagnosis → recommendations → framework), persistence across reload,
// Arabic RTL, JSON export/import, axe (WCAG 2 A/AA) in ar/en × light/dark × desktop/mobile, CSP violations.
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const OUT = path.resolve("out");
const SHOTS = process.env.SHOTS_DIR ?? "screenshots";
const AXE = await readFile(require.resolve("axe-core/axe.min.js"), "utf8");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".json": "application/json", ".txt": "text/plain" };
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
const check = (cond, msg) => { if (!cond) problems.push(msg); else console.log(`  ✓ ${msg}`); };
const browser = await chromium.launch();

async function axe(page, tag) {
  await page.addScriptTag({ content: AXE });
  const v = await page.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa"] })).violations.map((x) => `${x.id}: ${x.nodes[0]?.target}`));
  v.forEach((x) => problems.push(`[axe ${tag}] ${x}`));
}
function watch(page, tag) {
  page.on("console", (m) => { if (m.type() === "error") problems.push(`[console ${tag}] ${m.text()}`); });
  page.on("pageerror", (e) => problems.push(`[pageerror ${tag}] ${e.message}`));
}

// ---------- 1. Full journey (English, desktop)
console.log("Journey (en)");
const ctx = await browser.newContext({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
watch(page, "journey");
await page.goto(`${base}/en/`);
await page.getByLabel("Describe your business challenge").fill("Why do our invoice errors keep coming back every month? 12% of invoices are re-issued and customers complain about billing mistakes.");
await page.getByRole("button", { name: "Start solving" }).click();
await page.waitForURL(/\/en\/project\/\?id=/);
await page.getByText("Suggested from your description").waitFor();
check(true, "suggestions shown from the description");
await page.getByRole("button", { name: "Confirm" }).first().click();
await page.getByRole("button", { name: "Continue" }).click();
check(await page.getByRole("radio", { name: "Find why a problem happens" }).isChecked(), "suggested need applied (root cause)");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("radio", { name: "One team" }).click();
await page.getByRole("button", { name: "Continue" }).click();
for (const [role, text] of [["Symptom", "12% of invoices are re-issued each month"], ["Goal", "Cut re-issued invoices below 3% by June"], ["Impact", "Customers pay late and complain"], ["Constraint", "No budget for a new billing system"]]) {
  await page.getByRole("button", { name: `Add ${role}` }).click();
  await page.getByPlaceholder("Write one statement").last().fill(text);
}
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("button", { name: "Add stakeholder" }).click();
await page.getByPlaceholder("A person, role or group").last().fill("Billing team");
await page.getByRole("button", { name: "Add stakeholder" }).click();
await page.getByPlaceholder("A person, role or group").last().fill("Finance manager");
await page.getByRole("button", { name: "Continue" }).click();
await page.getByRole("radio", { name: "Repeatedly" }).click();
await page.getByRole("radio", { name: "Two" }).click();
await page.screenshot({ path: `${SHOTS}/03-intake-details-en.png`, fullPage: true });
await page.getByRole("button", { name: "See the diagnosis" }).click();
await page.waitForURL(/tab=diagnosis/);
check(await page.getByText("A challenge in", { exact: false }).first().isVisible(), "diagnosis shows the problem statement");
await page.screenshot({ path: `${SHOTS}/04-diagnosis-en.png`, fullPage: true });
await axe(page, "diagnosis en light");
await page.getByRole("button", { name: "See recommendations" }).click();
await page.waitForURL(/tab=recommendations/);
const first = await page.locator("article h3").first().textContent();
check(first === "5 Whys", `top recommendation is 5 Whys (got ${first})`);
check(await page.getByText("Considered and set aside").isVisible(), "rejected frameworks are explained");
await page.screenshot({ path: `${SHOTS}/05-recommendations-en.png`, fullPage: true });
await axe(page, "recommendations en light");
await page.getByRole("button", { name: "Work on this framework" }).first().click();
await page.waitForURL(/tab=frameworks/);
check(true, "framework added to the project");

// Persistence across reload
const url = page.url();
await page.reload();
await page.goto(url.replace(/tab=frameworks.*/, "tab=recommendations"));
check((await page.locator("article h3").first().textContent()) === "5 Whys", "project persisted across reload");

// Arabic RTL on the same project
await page.goto(url.replace("/en/", "/ar/").replace(/tab=frameworks.*/, "tab=recommendations"));
check((await page.getAttribute("html", "dir")) === "rtl", "Arabic page is RTL");
check(await page.getByText("المنهجية الموصى بها").isVisible(), "Arabic recommendations render");
await page.screenshot({ path: `${SHOTS}/06-recommendations-ar.png`, fullPage: true });
await axe(page, "recommendations ar light");

// Export and import
await page.goto(`${base}/en/settings/`);
const [dl] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export all projects (JSON)" }).click()]);
const exported = JSON.parse(await readFile(await dl.path(), "utf8"));
check(exported.app === "business-problem-solver" && Object.keys(exported.data.projects).length === 1, "workspace export contains the project");
await page.setInputFiles('input[type="file"]', { name: "b.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(exported)) });
check(await page.getByText("Imported 1 project(s)").isVisible(), "import adds a copy without overwriting");
await page.setInputFiles('input[type="file"]', { name: "bad.json", mimeType: "application/json", buffer: Buffer.from("{\"x\":1}") });
check(await page.getByText("not a valid Business Problem Solver export").isVisible(), "invalid import rejected");
await page.goto(`${base}/en/projects/`);
await page.locator("main li.card").first().waitFor();
check((await page.locator("main li.card").count()) === 2, "projects list shows original and imported copy");

// Corrupted storage is quarantined and recovered
await page.evaluate(() => localStorage.setItem("bps.workspace.v1", "{broken"));
await page.goto(`${base}/en/`);
check(await page.getByRole("alert").filter({ hasText: "could not be read" }).isVisible(), "corrupted data triggers recovery notice");
check(await page.evaluate(() => Object.keys(localStorage).some((k) => k.startsWith("bps.workspace.v1.corrupt."))), "unreadable data quarantined, not deleted");
await ctx.close();

// ---------- 2. Every page: axe in ar/en × light/dark × desktop/mobile
console.log("Pages");
const pages = ["", "projects/", "library/", "library/fw_five_whys/", "settings/", "privacy/"];
for (const locale of ["en", "ar"]) for (const theme of ["light", "dark"]) for (const vp of [{ n: "desktop", w: 1360, h: 900 }, { n: "mobile", w: 390, h: 844 }]) {
  const c = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, colorScheme: theme });
  const pg = await c.newPage();
  watch(pg, `${locale}-${theme}-${vp.n}`);
  for (const p of pages) {
    await pg.goto(`${base}/${locale}/${p}`);
    await pg.waitForLoadState("networkidle");
    const overflow = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (overflow) problems.push(`[overflow ${locale}-${theme}-${vp.n}] /${p}`);
    await axe(pg, `${locale}-${theme}-${vp.n} /${p}`);
    if (theme === "light" && vp.n === "desktop" && ["", "library/"].includes(p)) await pg.screenshot({ path: `${SHOTS}/page-${locale}-${p.replace(/\//g, "") || "home"}.png`, fullPage: true });
  }
  await c.close();
}
console.log("  ✓ 6 pages × 2 languages × 2 themes × 2 viewports scanned");

await browser.close();
server.close();
if (problems.length) { console.log(`\n${problems.length} problem(s):`); problems.forEach((p) => console.log(" - " + p)); process.exit(1); }
console.log("\nAll end-to-end checks passed");
