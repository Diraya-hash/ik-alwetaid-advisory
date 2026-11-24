// Guided intake: the user's structured description of a challenge, and its deterministic mapping to the
// recommender's slots. Every value here is entered or confirmed by the user; nothing is invented.
import type { OutOfScope } from "@/content/taxonomy";
import type { DataAvailable, Domain, Recurrence, Scope, Slots, Stage, StructureFocus } from "./types";

export type StatementRole = "symptom" | "cause" | "goal" | "impact" | "constraint" | "context";
/** verified = the user has evidence; unverified = reported but not checked; assumption = believed, not evidenced. */
export type Truth = "verified" | "unverified" | "assumption";
export interface Statement { id: string; role: StatementRole; text: string; truth: Truth }

export interface Intake {
  stagePrimary: Stage | null;
  stageSecondary: Stage | null;
  domains: Domain[]; // ordered by importance, max 3
  scope: Scope | null;
  outOfScope: OutOfScope;
  statements: Statement[];
  symptomClarity: "concrete" | "vague";
  stakeholders: string[];
  deadline: string | null; // ISO date
  options: string[];
  recurrence: Recurrence | null;
  causalComplexity: number | null; // 1..5
  processBoundaries: boolean | null;
  stepsKnown: boolean | null;
  measurableSymptom: boolean | null;
  dataAvailable: DataAvailable | null;
  newInitiative: boolean;
  externalFocus: boolean;
  structureFocus: StructureFocus;
  itemsAreThreats: boolean;
}

export const emptyIntake = (): Intake => ({
  stagePrimary: null, stageSecondary: null, domains: [], scope: null, outOfScope: "none", statements: [], symptomClarity: "concrete",
  stakeholders: [], deadline: null, options: [], recurrence: null, causalComplexity: null, processBoundaries: null, stepsKnown: null,
  measurableSymptom: null, dataAvailable: null, newInitiative: false, externalFocus: false, structureFocus: "none", itemsAreThreats: false,
});

const has = (i: Intake, role: StatementRole) => i.statements.some((s) => s.role === role && s.text.trim().length > 0);

export function toSlots(i: Intake): Slots {
  return {
    symptom: has(i, "symptom") ? (i.symptomClarity === "concrete" ? true : "vague") : false,
    stage: { primary: i.stagePrimary, secondary: i.stageSecondary },
    domains: i.domains,
    scope: i.scope,
    goal: has(i, "goal") ? 1 : 0,
    impact: has(i, "impact") ? 1 : 0,
    stakeholders: i.stakeholders.filter((s) => s.trim()).length,
    constraints: has(i, "constraint") || !!i.deadline,
    deadline_known: !!i.deadline,
    recurrence: i.recurrence,
    causal_complexity: i.causalComplexity,
    process_boundaries: i.processBoundaries,
    steps_known: i.stepsKnown,
    measurable_symptom: i.measurableSymptom,
    data_available: i.dataAvailable,
    options_listed: i.options.filter((o) => o.trim()).length,
    new_initiative: i.newInitiative,
    external_focus: i.externalFocus,
    structure_focus: i.structureFocus,
    items_are_threats: i.itemsAreThreats,
    out_of_scope: i.outOfScope !== "none",
  };
}

// ---------- Reading the free-text description (deterministic keyword cues; the user confirms every suggestion)

/** Normalises Arabic (diacritics, alef/yaa/taa marbuta forms) and case so keyword cues match reliably. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه");
}

type Cue<T> = { value: T; en: string[]; ar: string[] };
const STAGE_CUES: Cue<Stage>[] = [
  { value: "FIND_ROOT_CAUSE", en: ["why ", "root cause", "keeps happening", "keep happening", "reason for", "causing", "cause of"], ar: ["لماذا", "سبب", "اسباب", "يتكرر", "تتكرر"] },
  { value: "PLAN_EXECUTION", en: ["implement", "roll out", "rollout", "execution", "action plan", "timeline", "schedule", "deliver the"], ar: ["تنفيذ", "خطه عمل", "جدول زمني", "اطلاق", "تطبيق"] },
  { value: "GENERATE_OPTIONS", en: ["options", "alternatives", "what should we do", "how could we", "possible ways", "ideas"], ar: ["خيارات", "بدائل", "ماذا نفعل", "حلول ممكنه"] },
  { value: "PRIORITISE_DECIDE", en: ["prioriti", "which first", "decide between", "choose between", "too many initiatives", "where to start"], ar: ["اولويات", "اولويه", "المفاضله", "نختار", "من اين نبدا"] },
  { value: "ALIGN_PEOPLE", en: ["stakeholder", "resistance", "buy-in", "buy in", "support from", "convince"], ar: ["اصحاب المصلحه", "مقاومه", "اقناع", "دعم الاداره"] },
  { value: "MANAGE_RISK", en: ["risk", "threat", "what could go wrong", "contingency"], ar: ["مخاطر", "مخاطره", "تهديد", "طوارئ"] },
  { value: "DESIGN_ORGANISATION", en: ["restructur", "org chart", "organisation structure", "organization structure", "reporting line", "operating model", "roles and responsibilities"], ar: ["الهيكل التنظيمي", "اعاده الهيكله", "خطوط التبعيه", "نموذج التشغيل", "الادوار والمسؤوليات"] },
  { value: "MAP_CURRENT_STATE", en: ["map the process", "current process", "how the process works", "steps in the process", "process is unclear"], ar: ["العمليه الحاليه", "خطوات العمل", "رسم العمليه", "الاجراءات الحاليه"] },
  { value: "UNDERSTAND_CONTEXT", en: ["market", "competitor", "trend", "environment", "position", "landscape"], ar: ["السوق", "المنافسين", "المنافسه", "اتجاهات", "البيئه الخارجيه"] },
];
const DOMAIN_CUES: Cue<Domain>[] = [
  { value: "OPS.PERFORMANCE", en: ["delay", "late", "slow", "backlog", "waiting", "turnaround", "productivity", "throughput"], ar: ["تاخير", "تاخر", "بطء", "تراكم", "انتظار", "انتاجيه"] },
  { value: "OPS.QUALITY", en: ["error", "defect", "rework", "quality", "mistake"], ar: ["اخطاء", "خطا", "جوده", "اعاده العمل", "عيوب"] },
  { value: "OPS.WASTE", en: ["waste", "inefficien", "duplicat", "redundan"], ar: ["هدر", "عدم الكفاءه", "ازدواجيه", "تكرار العمل"] },
  { value: "OPS.PROCESS_DEFINITION", en: ["process", "procedure", "workflow"], ar: ["عمليه", "اجراء", "اجراءات", "سير العمل"] },
  { value: "OPS.HANDOFFS", en: ["handoff", "hand-off", "hand off", "between teams", "between departments", "silo"], ar: ["التسليم", "بين الفرق", "بين الادارات", "صوامع"] },
  { value: "CX.SERVICE_LEVEL", en: ["service level", "sla", "response time", "waiting time"], ar: ["مستوى الخدمه", "زمن الاستجابه", "وقت الانتظار"] },
  { value: "CX.EXPERIENCE", en: ["customer", "complaint", "satisfaction", "client"], ar: ["عملاء", "العميل", "شكاوى", "شكوى", "رضا"] },
  { value: "CX.DEMAND", en: ["demand", "volume", "peak"], ar: ["الطلب", "حجم", "الذروه"] },
  { value: "STR.ENVIRONMENT", en: ["regulation change", "economic", "trend", "external"], ar: ["اقتصادي", "اتجاهات", "خارجيه"] },
  { value: "STR.POSITION", en: ["market share", "competitor", "competitive", "position"], ar: ["حصه سوقيه", "المنافسين", "تنافسي", "موقع"] },
  { value: "STR.DIRECTION", en: ["strategy", "strategic", "vision", "direction", "growth plan"], ar: ["استراتيجيه", "استراتيجي", "رؤيه", "توجه"] },
  { value: "STR.EXECUTION", en: ["strategy execution", "not delivering the strategy", "kpi", "okr", "objectives"], ar: ["تنفيذ الاستراتيجيه", "مؤشرات الاداء", "الاهداف"] },
  { value: "DEC.OPTIONS", en: ["options", "alternatives", "choose", "decision"], ar: ["خيارات", "بدائل", "قرار"] },
  { value: "DEC.PRIORITISATION", en: ["prioriti", "too many initiatives", "which first"], ar: ["اولويات", "اولويه"] },
  { value: "ORG.STRUCTURE", en: ["structure", "reporting line", "org chart", "span of control"], ar: ["الهيكل", "التبعيه", "نطاق الاشراف"] },
  { value: "ORG.ACCOUNTABILITY", en: ["accountab", "responsib", "ownership", "who owns"], ar: ["مساءله", "مسؤوليه", "المسؤول", "ملكيه"] },
  { value: "ORG.OPERATING_MODEL", en: ["operating model", "shared service", "centralis", "centraliz", "decentralis"], ar: ["نموذج التشغيل", "الخدمات المشتركه", "مركزيه"] },
  { value: "PPL.CAPABILITY", en: ["skill", "capabilit", "competenc", "training"], ar: ["مهارات", "قدرات", "كفاءات", "تدريب"] },
  { value: "PPL.ENGAGEMENT", en: ["morale", "engagement", "turnover", "attrition", "motivation"], ar: ["معنويات", "ارتباط", "دوران الموظفين", "تسرب", "تحفيز"] },
  { value: "PPL.ADOPTION", en: ["adoption", "not using", "new system", "change management"], ar: ["تبني", "لا يستخدمون", "النظام الجديد", "اداره التغيير"] },
  { value: "PRJ.INITIATION", en: ["new initiative", "launch", "start a project", "new project", "kick off"], ar: ["مبادره جديده", "مشروع جديد", "اطلاق"] },
  { value: "PRJ.PLANNING", en: ["plan", "timeline", "milestone", "schedule"], ar: ["خطه", "جدول", "مراحل"] },
  { value: "PRJ.DELIVERY", en: ["project is late", "over budget", "delivery", "deadline"], ar: ["المشروع متاخر", "تجاوز الميزانيه", "تسليم", "الموعد النهائي"] },
  { value: "PRJ.STAKEHOLDERS", en: ["stakeholder", "sponsor", "buy-in"], ar: ["اصحاب المصلحه", "الراعي"] },
  { value: "RSK.ASSESSMENT", en: ["risk", "threat"], ar: ["مخاطر", "تهديد"] },
  { value: "RSK.COMPLIANCE", en: ["compliance", "regulat", "audit", "policy breach"], ar: ["امتثال", "تنظيمي", "تدقيق", "مراجعه"] },
  { value: "RSK.CONTINUITY", en: ["continuity", "outage", "disruption", "resilien"], ar: ["استمراريه", "انقطاع", "تعطل"] },
  { value: "FIN.COST", en: ["cost", "budget", "expense", "spend"], ar: ["تكلفه", "تكاليف", "ميزانيه", "مصروفات", "انفاق"] },
  { value: "FIN.REVENUE", en: ["revenue", "sales", "income", "growth"], ar: ["ايرادات", "مبيعات", "دخل", "نمو"] },
];
const OOS_CUES: Cue<OutOfScope>[] = [
  { value: "legal_advice", en: ["lawsuit", "sue ", "legal advice", "court"], ar: ["دعوى", "قضيه", "استشاره قانونيه", "محكمه"] },
  { value: "medical", en: ["diagnos my", "medication", "symptoms of illness", "my doctor"], ar: ["دواء", "علاج مرض", "تشخيص مرض"] },
  { value: "financial_modelling", en: ["valuation", "dcf", "discounted cash flow", "financial model"], ar: ["تقييم الشركه", "التدفقات النقديه المخصومه", "نموذج مالي"] },
  { value: "individual_employment_decision", en: ["should i fire", "fire him", "fire her", "dismiss him", "dismiss her"], ar: ["هل افصل", "فصل الموظف"] },
];

function score<T>(text: string, cues: Cue<T>[]): { value: T; hits: string[] }[] {
  const t = ` ${normalise(text)} `;
  return cues
    .map((c) => ({ value: c.value, hits: [...c.en, ...c.ar].filter((k) => t.includes(normalise(k))) }))
    .filter((x) => x.hits.length > 0)
    .sort((a, b) => b.hits.length - a.hits.length);
}

export interface Suggestions { stages: Stage[]; domains: Domain[]; outOfScope: OutOfScope | null; cues: string[] }
/** Suggests stages and business areas from the description. Suggestions are shown as such and must be confirmed. */
export function suggestFromText(text: string): Suggestions {
  const st = score(text, STAGE_CUES), dm = score(text, DOMAIN_CUES), oos = score(text, OOS_CUES);
  return {
    stages: st.slice(0, 2).map((x) => x.value),
    domains: dm.slice(0, 3).map((x) => x.value),
    outOfScope: oos[0]?.value ?? null,
    cues: [...new Set([...st, ...dm].flatMap((x) => x.hits))].slice(0, 8),
  };
}
