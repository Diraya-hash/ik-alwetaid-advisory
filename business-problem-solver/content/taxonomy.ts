import type { Domain, L, Scope, Stage } from "@/engine/types";

/** Problem-solving stages, phrased as "what do you need to do now?" */
export const STAGE_LABEL: Record<Stage, { label: L; hint: L }> = {
  UNDERSTAND_CONTEXT: { label: { en: "Understand the situation", ar: "فهم الوضع" }, hint: { en: "Make sense of the environment, position and forces at play before deciding anything.", ar: "استيعاب البيئة والموقع والعوامل المؤثرة قبل اتخاذ أي قرار." } },
  MAP_CURRENT_STATE: { label: { en: "Map how work happens today", ar: "رسم طريقة العمل الحالية" }, hint: { en: "Make the current process, inputs, outputs and hand-offs visible.", ar: "إظهار العملية الحالية ومدخلاتها ومخرجاتها ونقاط التسليم فيها." } },
  FIND_ROOT_CAUSE: { label: { en: "Find why a problem happens", ar: "معرفة سبب المشكلة" }, hint: { en: "Get beneath the symptoms to the causes you can act on.", ar: "تجاوز الأعراض للوصول إلى الأسباب القابلة للمعالجة." } },
  GENERATE_OPTIONS: { label: { en: "Generate options", ar: "توليد الخيارات" }, hint: { en: "Develop distinct, realistic courses of action.", ar: "تطوير مسارات عمل متمايزة وواقعية." } },
  PRIORITISE_DECIDE: { label: { en: "Prioritise and decide", ar: "تحديد الأولويات واتخاذ القرار" }, hint: { en: "Choose between options or decide what comes first.", ar: "المفاضلة بين الخيارات أو تحديد ما يأتي أولًا." } },
  PLAN_EXECUTION: { label: { en: "Plan the execution", ar: "تخطيط التنفيذ" }, hint: { en: "Turn a decision into owned actions, dates and dependencies.", ar: "تحويل القرار إلى إجراءات بمسؤولين وتواريخ وارتباطات." } },
  ALIGN_PEOPLE: { label: { en: "Align people", ar: "مواءمة الأطراف المعنية" }, hint: { en: "Win support and manage the people and groups affected.", ar: "كسب الدعم وإدارة الأفراد والجهات المتأثرة." } },
  MANAGE_RISK: { label: { en: "Manage risk", ar: "إدارة المخاطر" }, hint: { en: "Identify, assess and respond to what could go wrong.", ar: "تحديد ما قد يسوء وتقييمه والاستجابة له." } },
  DESIGN_ORGANISATION: { label: { en: "Design the organisation", ar: "تصميم المنظمة" }, hint: { en: "Shape structure, roles, accountabilities or the operating model.", ar: "تشكيل الهيكل والأدوار والمساءلة أو نموذج التشغيل." } },
};

export const DOMAIN_GROUPS: { key: string; label: L; domains: Domain[] }[] = [
  { key: "OPS", label: { en: "Operations", ar: "العمليات" }, domains: ["OPS.PERFORMANCE", "OPS.QUALITY", "OPS.WASTE", "OPS.PROCESS_DEFINITION", "OPS.HANDOFFS"] },
  { key: "CX", label: { en: "Customers", ar: "العملاء" }, domains: ["CX.SERVICE_LEVEL", "CX.EXPERIENCE", "CX.DEMAND"] },
  { key: "STR", label: { en: "Strategy", ar: "الاستراتيجية" }, domains: ["STR.ENVIRONMENT", "STR.POSITION", "STR.DIRECTION", "STR.EXECUTION"] },
  { key: "DEC", label: { en: "Decisions", ar: "القرارات" }, domains: ["DEC.OPTIONS", "DEC.PRIORITISATION"] },
  { key: "ORG", label: { en: "Organisation", ar: "التنظيم" }, domains: ["ORG.STRUCTURE", "ORG.ACCOUNTABILITY", "ORG.OPERATING_MODEL"] },
  { key: "PPL", label: { en: "People", ar: "الأفراد" }, domains: ["PPL.CAPABILITY", "PPL.ENGAGEMENT", "PPL.ADOPTION"] },
  { key: "PRJ", label: { en: "Projects", ar: "المشاريع" }, domains: ["PRJ.INITIATION", "PRJ.PLANNING", "PRJ.DELIVERY", "PRJ.STAKEHOLDERS"] },
  { key: "RSK", label: { en: "Risk", ar: "المخاطر" }, domains: ["RSK.ASSESSMENT", "RSK.COMPLIANCE", "RSK.CONTINUITY"] },
  { key: "FIN", label: { en: "Finance", ar: "المالية" }, domains: ["FIN.COST", "FIN.REVENUE"] },
];

export const DOMAIN_LABEL: Record<Domain, L> = {
  "OPS.PERFORMANCE": { en: "Speed and throughput", ar: "السرعة والإنتاجية" },
  "OPS.QUALITY": { en: "Quality, errors and rework", ar: "الجودة والأخطاء وإعادة العمل" },
  "OPS.WASTE": { en: "Waste and inefficiency", ar: "الهدر وعدم الكفاءة" },
  "OPS.PROCESS_DEFINITION": { en: "Unclear or undefined process", ar: "عملية غير واضحة أو غير محددة" },
  "OPS.HANDOFFS": { en: "Hand-offs between teams", ar: "التسليم بين الفرق" },
  "CX.SERVICE_LEVEL": { en: "Service levels and response times", ar: "مستويات الخدمة وأوقات الاستجابة" },
  "CX.EXPERIENCE": { en: "Customer experience and complaints", ar: "تجربة العملاء والشكاوى" },
  "CX.DEMAND": { en: "Demand and volumes", ar: "الطلب والأحجام" },
  "STR.ENVIRONMENT": { en: "External environment and trends", ar: "البيئة الخارجية والاتجاهات" },
  "STR.POSITION": { en: "Competitive position", ar: "الموقع التنافسي" },
  "STR.DIRECTION": { en: "Strategic direction", ar: "التوجه الاستراتيجي" },
  "STR.EXECUTION": { en: "Strategy execution", ar: "تنفيذ الاستراتيجية" },
  "DEC.OPTIONS": { en: "Choosing between options", ar: "المفاضلة بين الخيارات" },
  "DEC.PRIORITISATION": { en: "Prioritising initiatives", ar: "ترتيب أولويات المبادرات" },
  "ORG.STRUCTURE": { en: "Structure and reporting lines", ar: "الهيكل وخطوط التبعية" },
  "ORG.ACCOUNTABILITY": { en: "Roles and accountability", ar: "الأدوار والمساءلة" },
  "ORG.OPERATING_MODEL": { en: "Operating model", ar: "نموذج التشغيل" },
  "PPL.CAPABILITY": { en: "Skills and capability", ar: "المهارات والقدرات" },
  "PPL.ENGAGEMENT": { en: "Engagement and morale", ar: "الارتباط والمعنويات" },
  "PPL.ADOPTION": { en: "Adoption of change", ar: "تبنّي التغيير" },
  "PRJ.INITIATION": { en: "Starting a new initiative", ar: "إطلاق مبادرة جديدة" },
  "PRJ.PLANNING": { en: "Project planning", ar: "تخطيط المشروع" },
  "PRJ.DELIVERY": { en: "Project delivery", ar: "تسليم المشروع" },
  "PRJ.STAKEHOLDERS": { en: "Stakeholders and support", ar: "أصحاب المصلحة والدعم" },
  "RSK.ASSESSMENT": { en: "Risk assessment", ar: "تقييم المخاطر" },
  "RSK.COMPLIANCE": { en: "Compliance and regulation", ar: "الامتثال والأنظمة" },
  "RSK.CONTINUITY": { en: "Continuity and resilience", ar: "الاستمرارية والمرونة" },
  "FIN.COST": { en: "Costs", ar: "التكاليف" },
  "FIN.REVENUE": { en: "Revenue and growth", ar: "الإيرادات والنمو" },
};

export const SCOPE_LABEL: Record<Scope, L> = {
  team: { en: "One team", ar: "فريق واحد" },
  department: { en: "One department", ar: "إدارة واحدة" },
  cross_functional: { en: "Several departments", ar: "عدة إدارات" },
  organisation: { en: "The whole organisation", ar: "المنظمة بأكملها" },
  multi_entity_ecosystem: { en: "Several organisations or partners", ar: "عدة منظمات أو شركاء" },
};

export const OUT_OF_SCOPE = ["none", "legal_advice", "medical", "personal_matter", "individual_employment_decision", "unlawful", "non_business", "financial_modelling"] as const;
export type OutOfScope = (typeof OUT_OF_SCOPE)[number];
export const OUT_OF_SCOPE_LABEL: Record<OutOfScope, L> = {
  none: { en: "No, it is a business or management problem", ar: "لا، إنها مشكلة أعمال أو إدارة" },
  legal_advice: { en: "It needs legal advice", ar: "تحتاج إلى استشارة قانونية" },
  medical: { en: "It is a medical or health question", ar: "إنها مسألة طبية أو صحية" },
  personal_matter: { en: "It is a personal matter", ar: "إنها مسألة شخصية" },
  individual_employment_decision: { en: "It is a decision about a named individual (hire, fire, discipline)", ar: "إنها قرار بشأن فرد بعينه (تعيين أو فصل أو تأديب)" },
  unlawful: { en: "It involves something unlawful", ar: "تتضمن أمرًا مخالفًا للقانون" },
  non_business: { en: "It is not a business question", ar: "ليست مسألة أعمال" },
  financial_modelling: { en: "It needs a financial model or valuation", ar: "تحتاج إلى نموذج مالي أو تقييم" },
};
