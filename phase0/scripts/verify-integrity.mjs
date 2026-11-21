// Verifies the frozen configuration and every sealed evaluation set. Exit 0 = intact, 2 = violation.
// Used by CI (phase0-eval workflow) and the pre-commit hook.
import { verifyAll } from "../lib/integrity.mjs";
const r = verifyAll();
const lines = [`config: ${r.config.ok ? "frozen ✓ (eval v" + (r.config.frozen?.eval_version ?? 1) + ")" : "✗ " + r.config.reason}`,
  `reporting layer: ${r.reporting.ok ? "locked ✓" : "✗ " + r.reporting.reason}`,
  ...Object.entries(r.seals).map(([k, v]) => `${k}: ${v.ok ? "sealed ✓" : "✗ " + v.reason}`)];
console.log(lines.join("\n"));
if (!r.ok) { console.error("INTEGRITY CHECK FAILED — create a new versioned evaluation instead of editing frozen/sealed files (doc 14 §3)."); process.exit(2); }
