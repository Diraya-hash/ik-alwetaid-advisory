// Conditional Recommendation Assumption Integrity (eval v1 reporting layer; thresholds-v1.json → S7).
// Shared definitions for scripts/assumption-judge.mjs (AI judge), scripts/human-eval.mjs (blinded human calibration)
// and scripts/evidence-report.mjs (gate). Reads ONLY stored per-case outputs of experiment A; frozen scoring unchanged.

// Same segment rule as evidence-report.mjs / thresholds-v1.json "segments".
export function segmentOf(sc) {
  const e = sc.expected; const doms = e.domains_any_of || [];
  if (e.gate === "ask" || sc.category === "insufficient_context") return "incomplete_information";
  if (sc.category === "out_of_scope" || doms.includes("X.OUT_OF_SCOPE")) return "out_of_scope";
  if (e.recommendation?.no_good_fit || sc.category === "no_good_fit") return "outside_catalogue";
  if (sc.category === "ambiguous") return "ambiguous";
  return "clear";
}

// Eligibility: an ambiguous case where a CONDITIONAL recommendation was actually provided, i.e. recommendations were
// displayed (status ok, ≥ 1 recommendation) and the model rated its rank-1 fit below "high" (it signalled that the
// recommendation depends on uncertain conditions). Clarification requests, No Good Fit, declines and unconditional
// (high-fit) recommendations are NOT eligible and are never penalised by this metric.
export function eligibility(r, sc) {
  if (!sc || segmentOf(sc) !== "ambiguous") return { eligible: false, reason: "not an ambiguous case" };
  if (!r.ok) return { eligible: false, reason: "run error (counted elsewhere)" };
  if (r.status !== "ok") return { eligible: false, reason: `no recommendation provided (status ${r.status})` };
  if (!(r.output?.recommendations || []).length) return { eligible: false, reason: "no recommendation displayed" };
  if (!r.llmFits?.[0] || r.llmFits[0] === "high") return { eligible: false, reason: "unconditional recommendation (rank-1 fit high)" };
  return { eligible: true, reason: `conditional recommendation (rank-1 fit ${r.llmFits[0]})` };
}

// The three criteria. Identical wording is shown to the AI judge and to the human evaluator (doc 17 §3b).
export const ITEMS = [
  { key: "AI1_assumptions_explicit", ask: "Does the recommendation EXPLICITLY state the assumption(s) it depends on, i.e. what must be true for this approach to be the right one? Answer 'no' if the dependence is only implied." },
  { key: "AI2_assumptions_supported_or_unverified", ask: "Is EVERY assumption the recommendation relies on either supported by information in the user's challenge, or clearly labelled as unverified / to be confirmed? Answer 'no' if it relies on anything not in the challenge presented as established, or if no assumption is stated." },
  { key: "AI3_change_if_wrong", ask: "Does it explain how the recommendation would CHANGE if those assumptions prove incorrect (e.g. which other approach to use, or what to check first)? Answer 'no' if no assumption is stated." },
];
// A case passes only if all three criteria are 'yes' ('partial' does not pass).
export const rowPass = v => ITEMS.every(i => v?.[i.key] === "yes");
export const rowComplete = v => ITEMS.every(i => ["yes", "partial", "no"].includes(v?.[i.key]));

export const AIJ_SYSTEM = `You are an expert evaluator for a business-consulting AI. You assess ONLY whether a conditional recommendation handles its assumptions with integrity. Judge strictly against the user's challenge text; do not reward plausible-sounding content that the challenge does not support. Return a verdict (yes / partial / no) for each item key with a one-line note. Return no scores.`;

export function judgeUserMessage(sc, r) {
  const o = r.output || {};
  return [`<challenge lang="${sc.language}">`, sc.text, "</challenge>", "",
    "<diagnosis_statements>", JSON.stringify((o.statements || []).map(s => ({ role: s.role, text: s.text, truth_status: s.truth_status }))), "</diagnosis_statements>",
    "<identified_unknowns>", JSON.stringify(o.unknowns || []), "</identified_unknowns>", "",
    "<recommendation_shown_to_user>", JSON.stringify({ recommendations: (o.recommendations || []).map(x => ({ approach: x.approach_id, fit: x.fit, why_it_fits: x.why_it_fits, caution: x.caution })), not_recommended: o.not_recommended || [] }), "</recommendation_shown_to_user>", "",
    "Judge the recommendation as presented to the user (the ranked approaches with their fit, reasons and cautions).", "Items:",
    ...ITEMS.map(i => `${i.key}: ${i.ask}`)].join("\n");
}
