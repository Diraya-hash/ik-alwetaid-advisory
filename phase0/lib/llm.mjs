// Thin model gateway for Phase 0 experiments: structured outputs, usage/cost/latency logging, dry-run mode.
// Official SDK (@anthropic-ai/sdk). Refusal fallbacks are deliberately NOT enabled here so Phase 0 measures the raw
// refusal rate; the production gateway will enable server-side fallbacks (02 §4.1).
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

export const MODELS = { main: "claude-opus-5-5", judge: "claude-sonnet-5-5" };
// USD per million tokens (list prices as cached in the Claude API skill on 2026-11-03 — verify before reporting costs)
export const PRICES = {
  "claude-opus-5-5": { in: 4.0, out: 20.0, cache_read: 0.20, cache_write: 5.0 },
  "claude-sonnet-5-5": { in: 2.0, out: 10.0, cache_read: 0.10, cache_write: 2.5 },
};
const LOG = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../results/llm-runs.jsonl");

export const DRY_RUN = process.argv.includes("--dry-run") || !process.env.ANTHROPIC_API_KEY;
const argv = k => (process.argv.find(a => a.startsWith(`--${k}=`)) || "").split("=")[1];
const SET = argv("set") || "tuning";
// Hard spending cap per process (default US$15). Exceeding it stops the run; partial logs are kept.
const MAX_USD = +(argv("max-usd") || 15);
let spent = 0;
export const spentUsd = () => spent;
// Credential hygiene (doc 14 §4): the key is read only by the SDK from the environment; nothing that looks like a
// key or an auth header is ever written to logs or results.
export const redact = x => String(x ?? "").replace(/sk-ant-[A-Za-z0-9_\-]+/g, "[REDACTED]").replace(/(x-api-key|authorization)["':\s]+[^\s"',}]+/gi, "$1: [REDACTED]");
let client = null;
const getClient = () => (client ||= new Anthropic());

function cost(model, u) {
  const p = PRICES[model]; if (!p || !u) return null;
  return ((u.input_tokens || 0) * p.in + (u.output_tokens || 0) * p.out + (u.cache_read_input_tokens || 0) * p.cache_read + (u.cache_creation_input_tokens || 0) * p.cache_write) / 1e6;
}

/** Structured call. system = stable (cached) prefix; user = volatile content. */
export async function structured({ route, scenario, model = MODELS.main, effort = "high", system, user, schema, maxTokens = 16000 }) {
  const req = {
    model, max_tokens: maxTokens,
    system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: user }],
    output_config: { effort, format: zodOutputFormat(schema) },
  };
  if (DRY_RUN) {
    const approxTokens = Math.round((system.length + user.length) / 3.2);
    const rec = { at: new Date().toISOString(), dry_run: true, route, scenario, model, effort, approx_input_tokens: approxTokens };
    fs.appendFileSync(LOG.replace(".jsonl", "-dryrun.jsonl"), JSON.stringify(rec) + "\n");
    return { dryRun: true, parsed: null, record: rec };
  }
  const t0 = Date.now(); let res, error = null;
  try { res = await getClient().messages.parse(req); }
  catch (e) { error = { name: e?.constructor?.name, status: e?.status, message: redact(e?.message).slice(0, 300) }; }
  const latency = Date.now() - t0;
  const u = res?.usage;
  const rec = { at: new Date().toISOString(), set: SET, route, scenario, model, served_model: res?.model ?? null, effort, latency_ms: latency, stop_reason: res?.stop_reason ?? null,
    refusal_category: res?.stop_details?.category ?? null, parsed_ok: !!res?.parsed_output, error,
    usage: u ? { input: u.input_tokens, output: u.output_tokens, cache_read: u.cache_read_input_tokens, cache_write: u.cache_creation_input_tokens } : null,
    cost_usd: cost(model, u) };
  fs.appendFileSync(LOG, JSON.stringify(rec) + "\n");
  spent += rec.cost_usd || 0;
  if (spent > MAX_USD) { console.error(`Budget cap reached: spent $${spent.toFixed(2)} > $${MAX_USD}. Stopping; partial logs kept.`); process.exit(3); }
  return { parsed: res?.stop_reason === "refusal" ? null : res?.parsed_output ?? null, record: rec };
}
