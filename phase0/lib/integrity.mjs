// Anti-tuning controls (doc 14 §3): the scoring configuration is hash-locked, and the held-out set is sealed.
// The suite refuses to score a held-out set if either hash differs from the recorded one.
import fs from "node:fs";
import crypto from "node:crypto";
const here = new URL("./", import.meta.url);
export const CONFIG_FILES = ["catalogue.mjs", "recommender.mjs", "schemas.mjs", "prompts.mjs", "critic-rules.mjs"];
export const sha256 = buf => crypto.createHash("sha256").update(buf).digest("hex");
export function configHash() {
  const parts = CONFIG_FILES.map(f => [f, sha256(fs.readFileSync(new URL(f, here)))]);
  return { files: Object.fromEntries(parts), combined: sha256(parts.map(p => p.join(":")).join("\n")) };
}
export function readFrozen() {
  const f = new URL("frozen-config.json", here);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f)) : null;
}
export function checkFrozen() {
  const fz = readFrozen(), now = configHash();
  if (!fz) return { ok: false, reason: "no frozen-config.json", now };
  if (fz.combined !== now.combined) {
    const changed = Object.keys(now.files).filter(k => fz.files[k] !== now.files[k]);
    return { ok: false, reason: `configuration changed since freeze: ${changed.join(", ")}`, now, frozen: fz };
  }
  return { ok: true, now, frozen: fz };
}
export function checkSeal(setPath) {
  const sealPath = setPath.replace(/\.json$/, ".SEAL.json");
  if (!fs.existsSync(sealPath)) return { ok: false, reason: `no seal file ${sealPath}` };
  const seal = JSON.parse(fs.readFileSync(sealPath)); const h = sha256(fs.readFileSync(setPath));
  return h === seal.sha256 ? { ok: true, seal } : { ok: false, reason: "held-out set modified after sealing", seal, now: h };
}
