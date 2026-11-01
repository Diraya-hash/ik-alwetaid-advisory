// Builds a single self-contained HTML file of the app (hash-routed) for sandboxed preview hosting.
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const OUT_DIR = path.resolve(process.env.PREVIEW_OUT ?? "out-preview");
mkdirSync(OUT_DIR, { recursive: true });
const tmpCss = path.join(OUT_DIR, "tw.css");

execFileSync("npx", ["tailwindcss", "-c", "tailwind.config.ts", "-i", "app/globals.css", "-o", tmpCss, "--minify"], { stdio: "inherit" });
const css = readFileSync("styles/tokens.css", "utf8") + readFileSync(tmpCss, "utf8");

const result = await build({
  entryPoints: ["preview/main.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  write: false,
  legalComments: "none",
  logLevel: "warning",
  define: { "process.env.NODE_ENV": '"production"', "process.env.NEXT_PUBLIC_PREVIEW": '"1"' },
  alias: {
    "next/link": "./preview/shims/link.tsx",
    "next/navigation": "./preview/shims/navigation.ts",
    "@/lib/location": "./preview/shims/location.ts",
  },
});
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const html = `<title>IK Strategic LNA Simulator</title>
<meta name="description" content="Bilingual strategic learning-needs-analysis simulator: diagnose before you prescribe.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&family=Inter:wght@300..700&family=JetBrains+Mono:wght@400&display=swap">
<style>${css}</style>
<div id="root"></div>
<script>${js}</script>
`;
const file = path.join(OUT_DIR, "ik-lna-simulator.html");
writeFileSync(file, html);
console.log(`${file} (${(html.length / 1024).toFixed(0)} KB)`);
