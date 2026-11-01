/**
 * Transparent scoring engine. Every dimension is a list of named criteria with
 * points earned / points available, derived only from scenario data and the
 * user's recorded actions. No randomness, no opaque model.
 */
import { DIMENSIONS, type Dimension, type L, type QuestionNode, type Scenario, type SimState, type Stakeholder } from "./types";

export interface Criterion {
  id: string;
  label: L;
  earned: number;
  max: number;
  detail?: L;
}
export interface DimensionResult {
  dimension: Dimension;
  score: number;
  criteria: Criterion[];
  cap?: { value: number; reason: L };
}
export type Band = "orderTaker" | "practitioner" | "partner" | "consultant";

export interface Insights {
  missedQuestions: { stakeholderId: string; questionId: string }[];
  lowQualityQuestions: { stakeholderId: string; questionId: string }[];
  missedEvidence: string[];
  framingKind: string | null;
  firstFramingKind: string | null;
  hypothesisMisses: string[];
  distractorsAccepted: string[];
  trueCausesMissed: string[];
  unsupportedCauses: string[];
  gapErrors: string[];
  harmfulInterventions: string[];
  uncoveredCauses: string[];
  kpiIssues: { kpiId: string; issue: "level" | "owner" | "irrelevant" }[];
  prematureTraining: boolean;
  strengths: Dimension[];
  focus: Dimension[];
}

export interface ScoreResult {
  overall: number;
  band: Band;
  weights: Record<Dimension, number>;
  dimensions: Record<Dimension, DimensionResult>;
  insights: Insights;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const ratio = (n: number, d: number) => (d <= 0 ? 0 : clamp01(n / d));
const r1 = (n: number) => Math.round(n * 10) / 10;
const crit = (id: string, en: string, ar: string, earned: number, max: number, detail?: L): Criterion => ({
  id,
  label: { en, ar },
  earned: r1(earned),
  max,
  detail,
});
const fmt = (en: string, ar: string): L => ({ en, ar });

export function bandOf(score: number): Band {
  if (score >= 80) return "consultant";
  if (score >= 60) return "partner";
  if (score >= 40) return "practitioner";
  return "orderTaker";
}

interface Asked {
  q: QuestionNode;
  s: Stakeholder;
}

function askedQuestions(sc: Scenario, st: SimState): Asked[] {
  const out: Asked[] = [];
  for (const s of sc.stakeholders) for (const q of s.questions) if (st.asked.includes(q.id)) out.push({ q, s });
  return out;
}

/** Interview points for a dimension, judged against half of all points available (the budget never allows all). */
function interviewComponent(sc: Scenario, asked: Asked[], d: Dimension, max: number): Criterion {
  const available = sc.stakeholders.flatMap((s) => s.questions).reduce((n, q) => n + Math.max(0, q.dimensions[d] ?? 0), 0);
  const earned = asked.reduce((n, a) => n + (a.q.dimensions[d] ?? 0), 0);
  const target = available * 0.5;
  return crit(
    `${d}-interview`,
    "Interview evidence for this dimension",
    "أدلة المقابلات لهذا البُعد",
    max * ratio(earned, target),
    max,
    fmt(`${r1(earned)} points earned against a target of ${r1(target)} (half of all available)`, `${r1(earned)} نقطة مكتسبة مقابل مستهدف ${r1(target)} (نصف المتاح)`)
  );
}

export function score(sc: Scenario, st: SimState): ScoreResult {
  const asked = askedQuestions(sc, st);
  const trueCauses = sc.rootCauses.filter((c) => c.isTrue);
  const distractors = sc.rootCauses.filter((c) => !c.isTrue);
  const markedRoot = Object.entries(st.causes).filter(([, v]) => v.verdict === "root").map(([id]) => id);
  const ev = (id: string) => sc.evidence.find((e) => e.id === id);
  const finalFraming = sc.framing.options.find((o) => o.id === st.framings.at(-1));
  const firstFraming = sc.framing.options.find((o) => o.id === st.framings[0]);
  const dims = {} as Record<Dimension, DimensionResult>;

  // 1. Strategic alignment
  {
    const framingPts = { "performance-gap": 35, symptom: 15, "cause-assumption": 8, solution: 0 }[finalFraming?.kind ?? "solution"];
    const docs = sc.evidence.filter((e) => e.initiallyAvailable);
    const reviewed = docs.filter((d) => st.reviewed.includes(d.id)).length;
    const strategicKpis = sc.kpis.filter((k) => k.level === "strategic" && k.relevant);
    const chosenStrategic = strategicKpis.filter((k) => st.kpis[k.id]);
    const kpiPts = chosenStrategic.some((k) => st.kpis[k.id]!.level === "strategic") ? 25 : chosenStrategic.length ? 12 : 0;
    dims.strategicAlignment = {
      dimension: "strategicAlignment",
      score: 0,
      criteria: [
        crit("sa-framing", "Framed the problem as a performance gap linked to strategy", "أطّر المشكلة فجوةَ أداء مرتبطة بالاستراتيجية", framingPts, 35),
        crit("sa-context", "Reviewed the strategic context documents", "راجع وثائق السياق الاستراتيجي", 15 * ratio(reviewed, docs.length), 15,
          fmt(`${reviewed} of ${docs.length} documents reviewed`, `روجعت ${reviewed} من ${docs.length} وثائق`)),
        interviewComponent(sc, asked, "strategicAlignment", 25),
        crit("sa-kpi", "Measurement includes a strategic KPI, correctly classified", "يتضمن القياس مؤشرًا استراتيجيًا مصنّفًا بشكل صحيح", kpiPts, 25),
      ],
    };
  }

  // 2. Stakeholder engagement
  {
    const interviewed = new Set(st.transcript.map((t) => t.stakeholderId));
    const critical = sc.stakeholders.filter((s) => s.critical);
    const covered = critical.filter((s) => interviewed.has(s.id)).length;
    const trusted = [...interviewed].filter((id) => (st.openness[id] ?? 0) >= 50).length;
    dims.stakeholderEngagement = {
      dimension: "stakeholderEngagement",
      score: 0,
      criteria: [
        crit("se-coverage", "Interviewed every critical stakeholder group", "قابل جميع فئات أصحاب المصلحة الأساسية", 40 * ratio(covered, critical.length), 40,
          fmt(`${covered} of ${critical.length} critical stakeholders`, `${covered} من ${critical.length} من أصحاب المصلحة الأساسيين`)),
        crit("se-trust", "Kept stakeholders open (openness 50 or above)", "حافظ على انفتاح أصحاب المصلحة (٥٠ فأكثر)", 30 * ratio(trusted, interviewed.size), 30,
          fmt(`${trusted} of ${interviewed.size} interviewed stakeholders`, `${trusted} من ${interviewed.size} ممن قوبلوا`)),
        interviewComponent(sc, asked, "stakeholderEngagement", 30),
      ],
    };
  }

  // 3. Diagnostic thinking
  {
    const good = asked.filter((a) => a.q.quality === "critical" || a.q.quality === "strong").length;
    const allCritical = sc.stakeholders.flatMap((s) => s.questions).filter((q) => q.quality === "critical");
    const askedCritical = asked.filter((a) => a.q.quality === "critical").length;
    const challenges = sc.stakeholders.flatMap((s) => s.questions).filter((q) => q.kind === "challenge");
    const askedChallenges = asked.filter((a) => a.q.kind === "challenge").length;
    const poor = asked.filter((a) => a.q.quality === "leading" || a.q.quality === "solution-first").length;
    dims.diagnosticThinking = {
      dimension: "diagnosticThinking",
      score: 0,
      criteria: [
        crit("dt-quality", "Share of high-quality questions among all questions asked", "نسبة الأسئلة عالية الجودة من مجموع الأسئلة", 35 * ratio(good, asked.length), 35,
          fmt(`${good} of ${asked.length} questions were critical or strong`, `${good} من ${asked.length} أسئلة جوهرية أو قوية`)),
        crit("dt-critical", "Asked the critical diagnostic questions", "طرح الأسئلة التشخيصية الجوهرية", 25 * ratio(askedCritical, allCritical.length * 0.6), 25,
          fmt(`${askedCritical} of ${allCritical.length} critical questions (target 60%)`, `${askedCritical} من ${allCritical.length} أسئلة جوهرية (المستهدف ٦٠٪)`)),
        crit("dt-challenge", "Challenged assumptions with evidence", "اختبر الافتراضات بالأدلة", 20 * ratio(askedChallenges, Math.min(2, challenges.length)), 20,
          fmt(`${askedChallenges} challenge questions used`, `استُخدم ${askedChallenges} من أسئلة الاختبار بالدليل`)),
        crit("dt-hypotheses", "Logged hypotheses to test", "سجّل فرضيات للاختبار", st.hypotheses.length > 0 ? 20 : 0, 20),
        crit("dt-penalty", "Penalty: leading or solution-first questions (−5 each)", "خصم: أسئلة إيحائية أو تقفز إلى الحل (−٥ لكل منها)", -Math.min(20, poor * 5), 0),
      ],
    };
  }

  // 4. Root cause identification
  const unsupported: string[] = [];
  {
    let recall = 0;
    for (const c of trueCauses) {
      if (!markedRoot.includes(c.id)) continue;
      const supported = (st.causes[c.id]?.evidenceIds ?? []).some((id) => ev(id)?.supports.includes(c.id));
      if (!supported) unsupported.push(c.id);
      recall += c.weight * (supported ? 1 : 0.3);
    }
    const falsePos = distractors.filter((c) => markedRoot.includes(c.id)).length;
    dims.rootCauseIdentification = {
      dimension: "rootCauseIdentification",
      score: 0,
      criteria: [
        crit("rc-recall", "Identified the true root causes (weighted; unsupported causes earn 30%)", "حدّد الأسباب الجذرية الحقيقية (مرجّحة؛ السبب غير المدعوم يُحتسب بنسبة ٣٠٪)", 60 * recall, 60,
          fmt(`${trueCauses.filter((c) => markedRoot.includes(c.id)).length} of ${trueCauses.length} true causes identified`, `حُدّد ${trueCauses.filter((c) => markedRoot.includes(c.id)).length} من ${trueCauses.length} أسباب حقيقية`)),
        crit("rc-precision", "Avoided plausible distractors", "تجنّب البدائل المضللة", 40 * (1 - ratio(falsePos, distractors.length)), 40,
          fmt(`${falsePos} of ${distractors.length} distractors accepted as root causes`, `قُبل ${falsePos} من ${distractors.length} بدائل مضللة سببًا جذريًا`)),
      ],
    };
  }

  // 5. Evidence-based decisions
  {
    const critical = sc.evidence.filter((e) => e.critical);
    const found = critical.filter((e) => st.discovered.includes(e.id)).length;
    const supportedMarks = markedRoot.filter((id) => (st.causes[id]?.evidenceIds ?? []).some((e) => ev(e)?.supports.includes(id))).length;
    const contradicted = markedRoot.filter((id) => st.discovered.some((e) => ev(e)?.contradicts.includes(id))).length;
    const ruledOutWell = distractors.filter(
      (c) => st.causes[c.id]?.verdict === "ruled-out" && st.causes[c.id]!.evidenceIds.some((e) => ev(e)?.contradicts.includes(c.id))
    ).length;
    dims.evidenceBasedDecisions = {
      dimension: "evidenceBasedDecisions",
      score: 0,
      criteria: [
        crit("eb-critical", "Discovered the critical evidence", "اكتشف الأدلة الجوهرية", 30 * ratio(found, critical.length), 30,
          fmt(`${found} of ${critical.length} critical evidence items`, `${found} من ${critical.length} أدلة جوهرية`)),
        crit("eb-support", "Linked supporting evidence to each root cause selected", "ربط كل سبب جذري مختار بدليل داعم", 40 * ratio(supportedMarks, markedRoot.length), 40,
          fmt(`${supportedMarks} of ${markedRoot.length} selected causes are evidenced`, `${supportedMarks} من ${markedRoot.length} أسباب مختارة مدعومة بدليل`)),
        crit("eb-contradiction", "Did not accept causes contradicted by evidence in hand", "لم يقبل أسبابًا تناقضها أدلة متاحة لديه", 15 * (1 - ratio(contradicted, Math.max(1, markedRoot.length))), 15),
        crit("eb-ruleout", "Ruled out distractors with contradicting evidence", "استبعد البدائل المضللة بأدلة مناقضة", 15 * ratio(ruledOutWell, distractors.length), 15,
          fmt(`${ruledOutWell} of ${distractors.length} distractors ruled out with evidence`, `استُبعد ${ruledOutWell} من ${distractors.length} بدائل بالدليل`)),
      ],
    };
  }

  // 6. Capability assessment
  {
    const gaps = sc.capabilityGaps;
    const verdictOk = gaps.filter((g) => st.gaps[g.id] && (st.gaps[g.id]!.verdict === "gap") === g.isGap).length;
    const real = gaps.filter((g) => g.isGap);
    let natureScore = 0;
    for (const g of real) {
      const a = st.gaps[g.id];
      if (!a || a.verdict !== "gap") continue;
      if (a.nature === g.nature) natureScore += 1;
      else if ((a.nature === "skill") === (g.nature === "skill")) natureScore += 0.5;
    }
    const skillCorrect = gaps.filter((g) => {
      const a = st.gaps[g.id];
      if (!a) return false;
      const saysSkill = a.verdict === "gap" && a.nature === "skill";
      return saysSkill === (g.isGap && g.nature === "skill");
    }).length;
    dims.capabilityAssessment = {
      dimension: "capabilityAssessment",
      score: 0,
      criteria: [
        crit("ca-verdict", "Distinguished real gaps from claimed ones", "ميّز الفجوات الحقيقية من المزعومة", 40 * ratio(verdictOk, gaps.length), 40,
          fmt(`${verdictOk} of ${gaps.length} candidates judged correctly`, `قُيّم ${verdictOk} من ${gaps.length} بشكل صحيح`)),
        crit("ca-nature", "Classified each real gap correctly", "صنّف كل فجوة حقيقية تصنيفًا صحيحًا", 40 * ratio(natureScore, real.length), 40),
        crit("ca-skill", "Separated individual skill gaps from organisational barriers", "فصل الفجوات المهارية الفردية عن العوائق المؤسسية", 20 * ratio(skillCorrect, gaps.length), 20),
      ],
    };
  }

  // 7. Solution appropriateness
  let premature = false;
  {
    const chosen = sc.interventions.filter((i) => st.interventions[i.id]);
    const fitVal = { essential: 1, supportive: 0.6, neutral: 0, harmful: -1 } as const;
    const essentialCount = sc.interventions.filter((i) => i.fit === "essential").length;
    const fitSum = chosen.reduce((n, i) => n + fitVal[i.fit], 0);
    const covered = trueCauses.filter((c) => chosen.some((i) => (i.fit === "essential" || i.fit === "supportive") && i.addresses.includes(c.id)));
    const coverage = covered.reduce((n, c) => n + c.weight, 0);
    const harmful = chosen.filter((i) => i.fit === "harmful");
    const justified = chosen.filter((i) => st.interventions[i.id]!.causeIds.some((c) => i.addresses.includes(c))).length;
    const trainingChosen = chosen.some((i) => i.type === "training");
    const diagnosedSkill = markedRoot.some((id) => sc.rootCauses.find((c) => c.id === id)?.type === "skill");
    const trueSkill = trueCauses.some((c) => c.type === "skill");
    premature = trainingChosen && (!diagnosedSkill || !trueSkill);
    dims.solutionAppropriateness = {
      dimension: "solutionAppropriateness",
      score: 0,
      criteria: [
        crit("sol-fit", "Interventions fit the real diagnosis", "توافق التدخلات مع التشخيص الحقيقي", 40 * ratio(fitSum, essentialCount), 40,
          fmt(`Fit points ${r1(fitSum)} against ${essentialCount} essential interventions`, `نقاط التوافق ${r1(fitSum)} مقابل ${essentialCount} تدخلات أساسية`)),
        crit("sol-coverage", "Every true root cause is treated (weighted)", "عولج كل سبب جذري حقيقي (مرجّح)", 30 * coverage, 30,
          fmt(`${covered.length} of ${trueCauses.length} true causes treated`, `عولج ${covered.length} من ${trueCauses.length} أسباب حقيقية`)),
        crit("sol-harm", "No harmful interventions", "لا تدخلات ضارة", harmful.length ? 0 : 15, 15),
        crit("sol-justified", "Each intervention is justified by the cause it treats", "كل تدخل مبرَّر بالسبب الذي يعالجه", 15 * ratio(justified, chosen.length), 15,
          fmt(`${justified} of ${chosen.length} interventions linked to a cause they treat`, `${justified} من ${chosen.length} تدخلات مرتبطة بسبب تعالجه`)),
      ],
      cap: premature
        ? {
            value: 40,
            reason: fmt(
              "Training was recommended without a diagnosed skill gap, so this dimension is capped at 40.",
              "أُوصي بالتدريب دون فجوة مهارية مشخّصة، لذا لا تتجاوز درجة هذا البُعد ٤٠."
            ),
          }
        : undefined,
    };
  }

  // 8. Business impact orientation
  {
    const chosen = sc.kpis.filter((k) => st.kpis[k.id]);
    const levelsHit = new Set<string>(
      chosen.filter((k) => k.relevant).map((k) => (k.level === "behavioural" || k.level === "capability" ? "people" : k.level))
    );
    const coverage = ["strategic", "operational", "people"].filter((l) => levelsHit.has(l)).length;
    const levelOk = chosen.filter((k) => st.kpis[k.id]!.level === k.level).length;
    const relevant = chosen.filter((k) => k.relevant).length;
    const owners = chosen.filter((k) => k.owners.includes(st.kpis[k.id]!.ownerId)).length;
    const learning = chosen.filter((k) => k.level === "learning").length;
    const separated = chosen.length > 0 && learning < chosen.length && learning <= chosen.length / 2;
    dims.businessImpact = {
      dimension: "businessImpact",
      score: 0,
      criteria: [
        crit("bi-levels", "KPIs span strategic, operational and behavioural/capability levels", "تغطي المؤشرات المستويات الاستراتيجية والتشغيلية والسلوكية/القدرات", 30 * (coverage / 3), 30,
          fmt(`${coverage} of 3 levels covered`, `غُطّي ${coverage} من ٣ مستويات`)),
        crit("bi-classify", "Classified each KPI at the right level", "صنّف كل مؤشر في مستواه الصحيح", 25 * ratio(levelOk, chosen.length), 25),
        crit("bi-relevant", "Chose KPIs that measure this diagnosis", "اختار مؤشرات تقيس هذا التشخيص", 20 * ratio(relevant, chosen.length), 20),
        crit("bi-owners", "Assigned credible owners", "حدّد مالكين مناسبين", 15 * ratio(owners, chosen.length), 15),
        crit("bi-separate", "Kept learning metrics separate from organisational impact", "فصل مؤشرات التعلم عن الأثر المؤسسي", separated ? 10 : 0, 10),
      ],
    };
  }

  // Totals, caps, weights.
  const weights = Object.fromEntries(DIMENSIONS.map((d) => [d, sc.weights?.[d] ?? 1])) as Record<Dimension, number>;
  for (const d of DIMENSIONS) {
    const res = dims[d];
    const max = res.criteria.reduce((n, c) => n + c.max, 0);
    const earned = res.criteria.reduce((n, c) => n + c.earned, 0);
    let s = Math.round(100 * ratio(earned, max));
    if (res.cap) s = Math.min(s, res.cap.value);
    res.score = s;
  }
  const wSum = DIMENSIONS.reduce((n, d) => n + weights[d], 0);
  const overall = Math.round(DIMENSIONS.reduce((n, d) => n + dims[d].score * weights[d], 0) / wSum);

  const sorted = [...DIMENSIONS].sort((a, b) => dims[b].score - dims[a].score);
  const askedIds = new Set(st.asked);
  const insights: Insights = {
    missedQuestions: sc.stakeholders.flatMap((s) =>
      s.questions.filter((q) => q.quality === "critical" && !askedIds.has(q.id)).map((q) => ({ stakeholderId: s.id, questionId: q.id }))
    ),
    lowQualityQuestions: asked
      .filter((a) => ["weak", "leading", "solution-first"].includes(a.q.quality))
      .map((a) => ({ stakeholderId: a.s.id, questionId: a.q.id })),
    missedEvidence: sc.evidence.filter((e) => e.critical && !st.discovered.includes(e.id)).map((e) => e.id),
    framingKind: finalFraming?.kind ?? null,
    firstFramingKind: firstFraming?.kind ?? null,
    hypothesisMisses: st.hypotheses.filter((h) => !trueCauses.some((c) => c.type === h.causeType)).map((h) => h.id),
    distractorsAccepted: distractors.filter((c) => markedRoot.includes(c.id)).map((c) => c.id),
    trueCausesMissed: trueCauses.filter((c) => !markedRoot.includes(c.id)).map((c) => c.id),
    unsupportedCauses: unsupported,
    gapErrors: sc.capabilityGaps
      .filter((g) => {
        const a = st.gaps[g.id];
        return !a || (a.verdict === "gap") !== g.isGap || (g.isGap && a.nature !== g.nature);
      })
      .map((g) => g.id),
    harmfulInterventions: sc.interventions.filter((i) => st.interventions[i.id] && i.fit === "harmful").map((i) => i.id),
    uncoveredCauses: trueCauses
      .filter((c) => !sc.interventions.some((i) => st.interventions[i.id] && (i.fit === "essential" || i.fit === "supportive") && i.addresses.includes(c.id)))
      .map((c) => c.id),
    kpiIssues: sc.kpis
      .filter((k) => st.kpis[k.id])
      .flatMap((k) => {
        const a = st.kpis[k.id]!;
        const issues: Insights["kpiIssues"] = [];
        if (!k.relevant) issues.push({ kpiId: k.id, issue: "irrelevant" });
        if (a.level !== k.level) issues.push({ kpiId: k.id, issue: "level" });
        if (!k.owners.includes(a.ownerId)) issues.push({ kpiId: k.id, issue: "owner" });
        return issues;
      }),
    prematureTraining: premature,
    strengths: sorted.slice(0, 2),
    focus: sorted.slice(-2).reverse(),
  };

  return { overall, band: bandOf(overall), weights, dimensions: dims, insights };
}
