import type { ApproachId, L } from "@/engine/types";

/** The five frameworks with an interactive builder in M1. */
export const BUILDERS = ["fw_swot", "fw_five_whys", "fw_cause_effect", "fw_impact_effort", "fw_action_plan"] as const;
export type BuilderId = (typeof BUILDERS)[number];
export const hasBuilder = (id: string): id is BuilderId => (BUILDERS as readonly string[]).includes(id);

/** Approved scope: BPMN and VSM ship after GA (doc 14). */
export const LATER: ApproachId[] = ["fw_bpmn", "fw_vsm"];

export interface FrameworkInfo {
  name: L;
  /** One-line purpose. */
  purpose: L;
  useWhen: L[];
  avoidWhen: L[];
  output: L;
}

// Original descriptions written for this product.
export const FRAMEWORKS: Record<ApproachId, FrameworkInfo> = {
  fw_swot: {
    name: { en: "SWOT analysis", ar: "تحليل SWOT" },
    purpose: { en: "Weigh internal strengths and weaknesses against external opportunities and threats.", ar: "موازنة نقاط القوة والضعف الداخلية مع الفرص والتهديدات الخارجية." },
    useWhen: [{ en: "You need a balanced view of your position before setting direction.", ar: "تحتاج إلى نظرة متوازنة لموقعك قبل تحديد التوجه." }, { en: "Internal and external factors both matter to the decision.", ar: "العوامل الداخلية والخارجية تؤثر معًا في القرار." }],
    avoidWhen: [{ en: "The real question is why a specific problem keeps happening.", ar: "السؤال الحقيقي هو لماذا تتكرر مشكلة محددة." }, { en: "You need a detailed scan of external trends only.", ar: "تحتاج إلى مسح تفصيلي للاتجاهات الخارجية فقط." }],
    output: { en: "Four evidence-tagged quadrants and the strategic implications that follow from them.", ar: "أربعة أرباع موثقة بالأدلة والدلالات الاستراتيجية المستخلصة منها." },
  },
  fw_pest_steeple: {
    name: { en: "PEST / STEEPLE scan", ar: "مسح PEST / STEEPLE" },
    purpose: { en: "Scan the external forces (social, technological, economic, environmental, political, legal, ethical) shaping your future.", ar: "رصد القوى الخارجية (الاجتماعية والتقنية والاقتصادية والبيئية والسياسية والقانونية والأخلاقية) التي تشكل مستقبلك." },
    useWhen: [{ en: "External change is the main uncertainty.", ar: "التغير الخارجي هو مصدر عدم اليقين الرئيسي." }],
    avoidWhen: [{ en: "The issue is mainly inside the organisation.", ar: "المشكلة داخلية في المقام الأول." }],
    output: { en: "External factors by category, with likely impact.", ar: "العوامل الخارجية مصنفة حسب الفئة مع أثرها المتوقع." },
  },
  fw_sipoc: {
    name: { en: "SIPOC", ar: "SIPOC" },
    purpose: { en: "Define a process at high level: suppliers, inputs, steps, outputs and customers.", ar: "تعريف العملية على مستوى عالٍ: الموردون والمدخلات والخطوات والمخرجات والعملاء." },
    useWhen: [{ en: "People disagree about where a process starts and ends.", ar: "هناك خلاف حول بداية العملية ونهايتها." }],
    avoidWhen: [{ en: "The boundaries are clear and you need step-level detail.", ar: "الحدود واضحة وتحتاج إلى تفاصيل على مستوى الخطوات." }],
    output: { en: "A one-page process definition everyone agrees on.", ar: "تعريف للعملية في صفحة واحدة يتفق عليه الجميع." },
  },
  fw_bpmn: {
    name: { en: "Process map (BPMN)", ar: "خريطة العملية (BPMN)" },
    purpose: { en: "Map each step, decision and hand-off of a process.", ar: "رسم كل خطوة وقرار ونقطة تسليم في العملية." },
    useWhen: [{ en: "The process is bounded but its steps are not well understood.", ar: "حدود العملية معروفة لكن خطواتها غير مفهومة جيدًا." }],
    avoidWhen: [{ en: "You first need to agree what the process is.", ar: "تحتاج أولًا إلى الاتفاق على ماهية العملية." }],
    output: { en: "A swimlane map of the current process.", ar: "خريطة مسارات للعملية الحالية." },
  },
  fw_vsm: {
    name: { en: "Value stream map", ar: "خريطة تدفق القيمة" },
    purpose: { en: "Measure flow and waste across a process end to end.", ar: "قياس التدفق والهدر عبر العملية من بدايتها إلى نهايتها." },
    useWhen: [{ en: "You have timing data and suspect delays or waste.", ar: "لديك بيانات زمنية وتشتبه في وجود تأخير أو هدر." }],
    avoidWhen: [{ en: "There is no data on times or volumes.", ar: "لا تتوفر بيانات عن الأزمنة أو الأحجام." }],
    output: { en: "Lead time, value-added time and the biggest sources of waste.", ar: "زمن الدورة والزمن المضيف للقيمة وأكبر مصادر الهدر." },
  },
  fw_five_whys: {
    name: { en: "5 Whys", ar: "الأسئلة الخمسة (لماذا)" },
    purpose: { en: "Trace a single problem back to an actionable root cause by asking why, step by step.", ar: "تتبع مشكلة واحدة حتى سببها الجذري القابل للمعالجة بطرح سؤال «لماذا» خطوة بخطوة." },
    useWhen: [{ en: "The problem is specific and the causes are likely to form one chain.", ar: "المشكلة محددة والأسباب على الأرجح سلسلة واحدة." }, { en: "The issue sits mostly within one team or area.", ar: "المشكلة محصورة غالبًا في فريق أو مجال واحد." }],
    avoidWhen: [{ en: "Several causes interact or the problem spans many departments.", ar: "تتداخل عدة أسباب أو تمتد المشكلة عبر إدارات كثيرة." }],
    output: { en: "A why-chain, a root cause and a countermeasure.", ar: "سلسلة «لماذا» وسبب جذري وإجراء مضاد." },
  },
  fw_cause_effect: {
    name: { en: "Cause-and-effect (fishbone)", ar: "مخطط السبب والنتيجة (عظمة السمكة)" },
    purpose: { en: "Explore many possible causes of one effect, grouped into categories, then focus on the likely few.", ar: "استكشاف الأسباب المحتملة لنتيجة واحدة مصنفةً في فئات، ثم التركيز على القليل الأرجح." },
    useWhen: [{ en: "Several causes may interact.", ar: "قد تتداخل عدة أسباب." }, { en: "The problem crosses teams or functions.", ar: "تمتد المشكلة عبر فرق أو وظائف متعددة." }],
    avoidWhen: [{ en: "There is no clear, observable problem yet.", ar: "لا توجد بعد مشكلة واضحة وملموسة." }],
    output: { en: "A fishbone diagram with the most likely causes marked for verification.", ar: "مخطط عظمة السمكة مع تحديد الأسباب الأرجح للتحقق منها." },
  },
  cap_strategic_options: {
    name: { en: "Strategic options", ar: "الخيارات الاستراتيجية" },
    purpose: { en: "Develop and compare distinct courses of action, including doing nothing.", ar: "تطوير مسارات عمل متمايزة ومقارنتها، بما فيها عدم اتخاذ أي إجراء." },
    useWhen: [{ en: "You have a goal but fewer than two real options.", ar: "لديك هدف لكن أقل من خيارين حقيقيين." }],
    avoidWhen: [{ en: "You are still trying to find out why a problem happens.", ar: "ما زلت تبحث عن سبب المشكلة." }],
    output: { en: "Scored options with trade-offs and a preferred option.", ar: "خيارات مقيّمة مع المفاضلات والخيار المفضل." },
  },
  fw_impact_effort: {
    name: { en: "Impact / effort matrix", ar: "مصفوفة الأثر والجهد" },
    purpose: { en: "Sort ideas or initiatives by the value they create against the effort they need.", ar: "فرز الأفكار أو المبادرات حسب القيمة التي تحققها مقابل الجهد الذي تتطلبه." },
    useWhen: [{ en: "You have four or more candidate actions and must choose what to do first.", ar: "لديك أربعة إجراءات مرشحة أو أكثر وعليك تحديد ما تبدأ به." }],
    avoidWhen: [{ en: "The items are threats; use a risk matrix instead.", ar: "إذا كانت البنود تهديدات، فاستخدم مصفوفة المخاطر." }],
    output: { en: "A 2×2 matrix: quick wins, major projects, fill-ins and items to drop.", ar: "مصفوفة ٢×٢: مكاسب سريعة ومشاريع كبرى ومهام ثانوية وبنود يُستغنى عنها." },
  },
  fw_risk_matrix: {
    name: { en: "Risk matrix", ar: "مصفوفة المخاطر" },
    purpose: { en: "Rate risks by likelihood and impact and plan responses.", ar: "تقييم المخاطر حسب الاحتمالية والأثر وتخطيط الاستجابة لها." },
    useWhen: [{ en: "You are listing threats to a plan or operation.", ar: "تحصر التهديدات التي تواجه خطة أو عملية." }],
    avoidWhen: [{ en: "The items are opportunities to prioritise.", ar: "إذا كانت البنود فرصًا تحتاج إلى ترتيب أولوياتها." }],
    output: { en: "A heat map with owners and responses for the top risks.", ar: "خريطة حرارية بمسؤولين واستجابات لأهم المخاطر." },
  },
  fw_stakeholder_map: {
    name: { en: "Stakeholder map", ar: "خريطة أصحاب المصلحة" },
    purpose: { en: "Map stakeholders by influence and interest and plan how to engage each.", ar: "تصنيف أصحاب المصلحة حسب التأثير والاهتمام وتخطيط طريقة إشراك كل منهم." },
    useWhen: [{ en: "Success depends on support from several people or groups.", ar: "يعتمد النجاح على دعم عدة أفراد أو جهات." }],
    avoidWhen: [{ en: "No stakeholders have been identified yet.", ar: "لم يُحدد أي من أصحاب المصلحة بعد." }],
    output: { en: "An influence–interest grid with an engagement approach per stakeholder.", ar: "شبكة التأثير والاهتمام مع نهج إشراك لكل طرف." },
  },
  fw_project_charter: {
    name: { en: "Project charter", ar: "ميثاق المشروع" },
    purpose: { en: "Define a new initiative: goal, scope, deliverables, roles and success measures.", ar: "تعريف المبادرة الجديدة: الهدف والنطاق والمخرجات والأدوار ومقاييس النجاح." },
    useWhen: [{ en: "You are starting something new and need agreement on what it is.", ar: "تبدأ شيئًا جديدًا وتحتاج إلى اتفاق على ماهيته." }],
    avoidWhen: [{ en: "The initiative is already defined and needs scheduling.", ar: "المبادرة معرّفة بالفعل وتحتاج إلى جدولة." }],
    output: { en: "A one-page charter ready for sponsor approval.", ar: "ميثاق في صفحة واحدة جاهز لاعتماد الراعي." },
  },
  fw_action_plan: {
    name: { en: "Action plan", ar: "خطة العمل" },
    purpose: { en: "Turn a decision into actions with owners, dates and dependencies.", ar: "تحويل القرار إلى إجراءات بمسؤولين وتواريخ وارتباطات." },
    useWhen: [{ en: "The decision is made and you need to execute it.", ar: "اتُّخذ القرار وتحتاج إلى تنفيذه." }],
    avoidWhen: [{ en: "There is no agreed goal yet.", ar: "لا يوجد هدف متفق عليه بعد." }],
    output: { en: "A dated, owned plan with dependency checks and a timeline view.", ar: "خطة مؤرخة بمسؤولين مع فحص للارتباطات وعرض زمني." },
  },
  fw_org_chart: {
    name: { en: "Organisation chart", ar: "الهيكل التنظيمي" },
    purpose: { en: "Show reporting lines and spans of control.", ar: "توضيح خطوط التبعية ونطاقات الإشراف." },
    useWhen: [{ en: "The question is who reports to whom.", ar: "السؤال هو من يتبع لمن." }],
    avoidWhen: [{ en: "The question is how work and capabilities fit together.", ar: "السؤال هو كيف تتكامل الأعمال والقدرات." }],
    output: { en: "An editable reporting structure.", ar: "هيكل تبعية قابل للتعديل." },
  },
  fw_op_model_canvas: {
    name: { en: "Operating model canvas", ar: "لوحة نموذج التشغيل" },
    purpose: { en: "Describe how the organisation delivers value: processes, people, locations, technology, suppliers and governance.", ar: "وصف كيفية تقديم المنظمة للقيمة: العمليات والأفراد والمواقع والتقنية والموردون والحوكمة." },
    useWhen: [{ en: "You are redesigning how a unit delivers its services.", ar: "تعيد تصميم طريقة تقديم وحدة ما لخدماتها." }],
    avoidWhen: [{ en: "The only question is reporting lines.", ar: "إذا كان السؤال الوحيد هو خطوط التبعية." }],
    output: { en: "A canvas of the current or target operating model.", ar: "لوحة لنموذج التشغيل الحالي أو المستهدف." },
  },
};
