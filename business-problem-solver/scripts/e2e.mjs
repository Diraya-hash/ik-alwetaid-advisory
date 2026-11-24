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
const url = page.url();
await page.getByRole("button", { name: "Work on this framework" }).first().click();
await page.waitForURL(/tab=frameworks/);
check(true, "framework added to the project");

// ---- 5 Whys: chain of three, root cause on an unverified step stays a hypothesis
console.log("Builders (en)");
check((await page.locator("#whys-problem").inputValue()) === "12% of invoices are re-issued each month", "5 Whys problem seeded from the intake symptom");
await page.getByRole("button", { name: "Ask the first why" }).click();
const why = (n) => page.getByLabel(`Why ${n}?`);
await why(1).fill("Invoices carry the wrong contract price");
await page.locator("div[id^=item-why]", { has: why(1) }).getByLabel("Status").selectOption("verified");
await page.getByRole("button", { name: "Ask why" }).first().click();
await why(2).fill("Price changes are typed in manually from emails");
await page.locator("div[id^=item-why]", { has: why(2) }).getByLabel("Status").selectOption("unverified");
await page.getByRole("button", { name: "Ask why" }).nth(1).click();
await why(3).fill("The contract system does not feed the billing system");
await page.locator("div[id^=item-why]", { has: why(3) }).getByLabel("Status").selectOption("verified");
await page.locator("div[id^=item-why]", { has: why(3) }).getByLabel("Mark as root cause").check();
await page.getByPlaceholder("What will remove this cause?").fill("Build a nightly price feed from contracts to billing");
check(await page.getByText("Root-cause hypothesis").first().isVisible(), "root cause on an unverified chain is labelled a hypothesis");
check(await page.getByText("Not yet a proven root cause: step 2").isVisible(), "critic names the weak step");
await page.getByRole("button", { name: "Add another cause" }).first().click();
await page.getByPlaceholder("Because…").last().fill("Staff are careless");
check(await page.getByText("This blames a person").isVisible(), "critic flags blaming a person");
await page.screenshot({ path: `${SHOTS}/07-five-whys-en.png`, fullPage: true });
await axe(page, "5 whys en");

// ---- Fishbone
await page.getByLabel("Add a framework").selectOption("fw_cause_effect");
await page.waitForURL(/fw=fw_cause_effect/);
for (const c of ["Manual price entry", "Two pricing spreadsheets in use", "Lack of training"]) { await page.getByRole("button", { name: "Add cause" }).click(); await page.getByPlaceholder("A possible cause").last().fill(c); }
await page.getByRole("tab", { name: /Technology/ }).click();
for (const c of ["Billing system cannot import price files", "No validation of price changes"]) { await page.getByRole("button", { name: "Add cause" }).click(); await page.getByPlaceholder("A possible cause").last().fill(c); }
await page.getByRole("button", { name: "Likely" }).first().click();
check(await page.getByText("Phrased as a missing solution").first().isVisible(), "fishbone critic flags a cause phrased as a missing solution");
check((await page.locator("svg[role=group] text", { hasText: "Billing system cannot" }).count()) === 1, "fishbone diagram renders the causes");
await page.screenshot({ path: `${SHOTS}/08-fishbone-en.png`, fullPage: true });
await axe(page, "fishbone en");

// ---- Impact / effort
await page.getByLabel("Add a framework").selectOption("fw_impact_effort");
await page.waitForURL(/fw=fw_impact_effort/);
for (const x of ["Nightly price feed", "Price-change approval checklist", "Replace the billing system", "Monthly price audit"]) { await page.getByLabel("Add initiative").fill(x); await page.getByRole("button", { name: "Add initiative" }).click(); }
const pt = page.getByRole("slider", { name: /Price-change approval checklist/ });
await pt.focus();
for (const k of ["ArrowUp", "ArrowUp", "ArrowLeft"]) await pt.press(k);
check(await page.getByRole("slider", { name: "Price-change approval checklist: impact 5, effort 2" }).count() === 1, "keyboard moves a point on the matrix");
const nf = page.locator("li", { has: page.getByPlaceholder("Initiative or idea").first() }).first();
await nf.getByLabel("Impact", { exact: true }).selectOption("5"); await nf.getByLabel("Effort", { exact: true }).selectOption("4");
check(await page.getByText("Quick wins").first().isVisible(), "quadrants computed");
check((await page.locator("section ol li").filter({ hasText: "Price-change approval checklist" }).first().textContent()).includes("Quick wins"), "quick win identified in the priority list");
await page.screenshot({ path: `${SHOTS}/09-matrix-en.png`, fullPage: true });
const [png] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Download diagram (PNG)" }).click()]);
const pngBuf = await readFile(await png.path());
check(pngBuf.subarray(1, 4).toString() === "PNG" && pngBuf.length > 5000, `matrix PNG export works under the production CSP (${pngBuf.length} bytes)`);
await axe(page, "matrix en");

// ---- SWOT
await page.getByLabel("Add a framework").selectOption("fw_swot");
await page.waitForURL(/fw=fw_swot/);
const addSw = async (q, text) => { await page.getByLabel(`Add: ${q}`).first().fill(text); await page.getByRole("button", { name: `Add: ${q}` }).click(); };
await addSw("Strengths", "Billing team resolves disputes within 2 days"); await addSw("Weaknesses", "Communication");
await addSw("Opportunities", "Customers ask for e-invoicing"); await addSw("Threats", "Regulator fines for repeated billing errors");
check(await page.getByText("Too vague to act on").isVisible(), "SWOT critic flags a vague entry");
check(await page.getByText("A SWOT without implications").isVisible(), "SWOT critic asks for implications");
await page.getByRole("button", { name: "Add implication" }).click();
await page.getByPlaceholder("What should the organisation do?").fill("Use fast dispute handling to win e-invoicing customers");
await page.getByRole("button", { name: /^S · Billing team/ }).click(); await page.getByRole("button", { name: /^O · Customers ask/ }).click();
check(!(await page.getByText("A SWOT without implications").isVisible()), "implication clears the critic point");
await axe(page, "swot en");

// ---- Action plan from the analysis
await page.getByRole("button", { name: "Turn this into an action plan" }).click();
await page.waitForURL(/fw=fw_action_plan/);
check((await page.locator("#plan-objective").inputValue()) === "Cut re-issued invoices below 3% by June", "plan objective seeded from the goal");
check(await page.getByText("Suggested from your analysis").isVisible(), "actions suggested from the analysis");
await page.getByRole("button", { name: "Add as action" }).first().click();
await page.getByRole("button", { name: "Add as action" }).first().click();
const act = page.locator("li[id^=item-act_]");
check((await act.count()) === 2, "suggestions added as linked actions");
await act.nth(0).getByLabel("Owner", { exact: true }).fill("Head of Billing"); await act.nth(0).getByLabel("Start", { exact: true }).fill("2027-01-04"); await act.nth(0).getByLabel("Due", { exact: true }).fill("2027-02-26");
await act.nth(1).getByLabel("Owner", { exact: true }).fill("Finance manager"); await act.nth(1).getByLabel("Start", { exact: true }).fill("2027-01-11"); await act.nth(1).getByLabel("Due", { exact: true }).fill("2027-01-29");
await page.getByLabel("Plan deadline").fill("2027-06-30");
await page.getByRole("button", { name: "Add indicator" }).click();
await page.getByPlaceholder("Indicator").fill("Share of invoices re-issued"); await page.getByPlaceholder("Baseline").fill("12%"); await page.getByPlaceholder("Target").fill("3%");
check(!(await page.getByText("Add at least one measurable success indicator").isVisible()), "indicator satisfies the plan critic");
check((await page.locator("svg[role=img] rect").count()) >= 2, "timeline renders the actions");
await page.screenshot({ path: `${SHOTS}/10-action-plan-en.png`, fullPage: true });
await axe(page, "plan en");

// ---- Report and exports
await page.getByRole("tab", { name: "Report & export" }).click();
await page.waitForURL(/tab=report/);
for (const h of ["Executive summary", "Recommended approach", "Analysis", "Action plan", "Assumptions register", "Open review points"]) check(await page.getByRole("heading", { level: 2, name: new RegExp(`${h}$`) }).isVisible(), `report section: ${h}`);
const [csv] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Action plan (CSV)" }).click()]);
check((await readFile(await csv.path(), "utf8")).includes("Head of Billing"), "action plan CSV export");
await page.emulateMedia({ media: "print" });
await page.screenshot({ path: `${SHOTS}/11-report-print-en.png`, fullPage: true });
await page.emulateMedia({ media: "screen" });
await axe(page, "report en");

// ---- History: save, compare, restore
await page.getByRole("tab", { name: "History" }).click();
await page.getByPlaceholder("Version name (optional)").fill("Plan drafted");
await page.getByRole("button", { name: "Save a version" }).click();
check(await page.getByText("Plan drafted").isVisible(), "manual version saved");
const intakeVersion = page.locator("li.card", { hasText: "Intake completed" }).first();
await intakeVersion.getByRole("button", { name: "Compare with current" }).click();
check(await intakeVersion.getByText(/difference\(s\) from the current state/).isVisible(), "comparison lists differences");
await intakeVersion.getByRole("button", { name: "Restore" }).click();
await intakeVersion.getByRole("button", { name: "Confirm" }).click();
check(await page.getByText("Version restored").isVisible(), "version restored");
check(await page.locator("li.card", { hasText: "Before restore" }).count() === 1, "state before restore is kept");
await axe(page, "history en");
const before = page.locator("li.card", { hasText: "Before restore" }).first();
await before.getByRole("button", { name: "Restore" }).click(); await before.getByRole("button", { name: "Confirm" }).click();
await page.getByRole("tab", { name: "Frameworks" }).click();
await page.waitForURL(/tab=frameworks/);
await page.getByRole("navigation", { name: "Frameworks" }).getByRole("button").nth(4).waitFor();
check((await page.getByRole("navigation", { name: "Frameworks" }).getByRole("button").count()) === 5, "undo restore brings all five builders back");

// ---- Arabic: builders mirror for RTL
await page.goto(page.url().replace("/en/", "/ar/").replace(/tab=[a-z]+.*/, "tab=frameworks&fw=fw_cause_effect"));
const head = await page.locator("svg[role=group] rect.fill-deep").first().getAttribute("x");
check(Number(head) < 100, "fishbone head is on the left in Arabic (RTL)");
check(await page.getByText("مراجعة المستشار").isVisible(), "consultant review in Arabic");
await page.screenshot({ path: `${SHOTS}/12-fishbone-ar.png`, fullPage: true });
await axe(page, "fishbone ar");
await page.goto(page.url().replace(/fw=[a-z_]+/, "fw=fw_action_plan"));
await page.screenshot({ path: `${SHOTS}/13-action-plan-ar.png`, fullPage: true });
await axe(page, "plan ar");
for (const theme of ["dark"]) { await page.emulateMedia({ colorScheme: theme }); await page.goto(page.url().replace(/fw=[a-z_]+/, "fw=fw_impact_effort")); await axe(page, `matrix ar ${theme}`); await page.goto(page.url().replace(/tab=frameworks.*/, "tab=report")); await axe(page, `report ar ${theme}`); }
await page.emulateMedia({ colorScheme: "light" });
await page.goto(url.replace(/tab=frameworks.*/, "tab=recommendations"));

// Persistence across reload
await page.reload();
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
