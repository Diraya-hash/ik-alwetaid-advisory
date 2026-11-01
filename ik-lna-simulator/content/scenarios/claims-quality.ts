import type { Scenario } from "@/engine/types";

/**
 * FOUNDATION · Performance & Operations · Quality and Error Reduction
 * Fictional organisation. All facts used anywhere in the simulation are defined here.
 */
export const claimsQuality: Scenario = {
  id: "claims-quality",
  version: 1,
  category: "performance",
  difficulty: "foundation",
  complexity: 2,
  estMinutes: 35,
  competencyFocus: ["diagnosticThinking", "evidenceBasedDecisions", "rootCauseIdentification"],
  budgetHours: 16,
  title: {
    en: "The Accuracy Problem",
    ar: "معضلة الدقة",
  },
  summary: {
    en: "Claims errors have tripled in two quarters and the regulator has noticed. Operations wants accuracy training for every processor by quarter end.",
    ar: "تضاعفت أخطاء المطالبات ثلاث مرات خلال ربعين، ولاحظت الجهة الرقابية ذلك. وتطلب إدارة العمليات تدريبًا على الدقة لجميع معالجي المطالبات قبل نهاية الربع.",
  },
  request: {
    from: "kh",
    text: {
      en: "Our claims error rate has gone from 2.1% to 6.8%. My people are rushing and getting careless. I need a two-day 'Accuracy & Attention to Detail' workshop for all 120 processors before the quarter closes. Can L&D make that happen?",
      ar: "ارتفع معدل الأخطاء في المطالبات من ٢٫١٪ إلى ٦٫٨٪. فريقي يستعجل ولم يعد يدقق. أحتاج ورشة لمدة يومين بعنوان «الدقة والانتباه للتفاصيل» لجميع المعالجين الـ١٢٠ قبل إقفال الربع. هل يمكن لإدارة التعلم والتطوير تنفيذ ذلك؟",
    },
  },
  organization: {
    name: { en: "Masar Health Insurance", ar: "مسار للتأمين الصحي" },
    sector: { en: "Health insurance", ar: "التأمين الصحي" },
    size: { en: "1,900 employees · 410,000 members", ar: "١٬٩٠٠ موظف، ٤١٠ آلاف عضو" },
    background: {
      en: "A mid-sized health insurer that grew quickly through corporate contracts. Eight months ago it replaced its 12-year-old claims system with a new platform, ClaimsOne, as part of a cost-to-serve programme.",
      ar: "شركة تأمين صحي متوسطة الحجم نمت بسرعة عبر عقود الشركات. قبل ثمانية أشهر استبدلت نظام المطالبات القديم الذي عمل اثني عشر عامًا بمنصة جديدة اسمها «كليمز ون» ضمن برنامج لخفض تكلفة الخدمة.",
    },
    structure: [
      { name: { en: "Claims Operations", ar: "عمليات المطالبات" }, headcount: 140, note: { en: "120 processors in 8 teams, team leads, QA unit", ar: "١٢٠ معالجًا في ٨ فرق، وقادة فرق، ووحدة ضمان الجودة" } },
      { name: { en: "Technology & Digital", ar: "التقنية والتحول الرقمي" }, headcount: 85, note: { en: "Owns the ClaimsOne platform", ar: "تملك منصة «كليمز ون»" } },
      { name: { en: "Human Resources", ar: "الموارد البشرية" }, headcount: 32, note: { en: "HR business partner model; L&D sits in HR", ar: "نموذج شريك أعمال الموارد البشرية؛ ويتبع التعلم والتطوير للموارد البشرية" } },
      { name: { en: "Medical Network & Providers", ar: "الشبكة الطبية ومقدمو الخدمة" }, headcount: 60 },
    ],
  },
  strategy: {
    priorities: [
      { en: "Claims turnaround under 5 working days", ar: "إنجاز المطالبات في أقل من ٥ أيام عمل" },
      { en: "Reduce cost-to-serve by 15% by end of 2027", ar: "خفض تكلفة الخدمة بنسبة ١٥٪ بنهاية ٢٠٢٧" },
      { en: "Zero material regulatory findings", ar: "عدم وجود أي ملاحظات رقابية جوهرية" },
    ],
    initiatives: [
      { en: "ClaimsOne platform replacement (went live in January)", ar: "استبدال منصة المطالبات بـ«كليمز ون» (التشغيل الفعلي في يناير)" },
      { en: "Operational productivity programme", ar: "برنامج رفع الإنتاجية التشغيلية" },
    ],
    successMeasures: [
      { en: "Turnaround time, cost per claim, claims accuracy, regulatory findings", ar: "مدة الإنجاز، وتكلفة المطالبة الواحدة، ودقة المطالبات، والملاحظات الرقابية" },
    ],
    externalPressures: [
      { en: "The insurance regulator is tightening scrutiny of wrongful denials and overpayments", ar: "الجهة الرقابية على التأمين تشدد رقابتها على حالات الرفض الخاطئ والمبالغ المدفوعة بالزيادة" },
      { en: "Corporate clients are renegotiating contracts on service quality", ar: "عملاء الشركات يعيدون التفاوض على العقود بناءً على جودة الخدمة" },
    ],
  },

  evidence: [
    // ---- Stage 1: documents pack ----
    {
      id: "ev-strategy",
      kind: "document",
      title: { en: "2026 Strategy on a Page", ar: "استراتيجية ٢٠٢٦ في صفحة واحدة" },
      body: {
        en: "Three enterprise targets: claims turnaround under 5 days, cost-to-serve down 15%, zero material regulatory findings. ClaimsOne and the productivity programme are listed as the two enablers. Claims accuracy is listed as a measure but has no target or named owner.",
        ar: "ثلاثة أهداف على مستوى الشركة: إنجاز المطالبات في أقل من ٥ أيام، وخفض تكلفة الخدمة ١٥٪، وعدم وجود ملاحظات رقابية جوهرية. وتُذكر منصة «كليمز ون» وبرنامج الإنتاجية بوصفهما الممكّنين الرئيسيين. أما دقة المطالبات فمدرجة كمؤشر، لكن دون مستهدف أو مالك محدد.",
      },
      sourceLabel: { en: "Strategy Office", ar: "مكتب الاستراتيجية" },
      initiallyAvailable: true,
      reviewCostHours: 1,
      supports: ["rc-kpi"],
      contradicts: [],
      critical: false,
    },
    {
      id: "ev-dashboard",
      kind: "data",
      title: { en: "Claims Operations Dashboard (last 3 quarters)", ar: "لوحة مؤشرات عمليات المطالبات (آخر ٣ أرباع)" },
      body: {
        en: "Error rate: 2.1% → 4.4% → 6.8%. Claims per processor per day: 45 → 53 → 58. Average turnaround: 7.2 → 5.6 → 4.9 days. Cost per claim down 11%. The two curves (productivity and errors) rise together from the same month.",
        ar: "معدل الأخطاء: ٢٫١٪ ← ٤٫٤٪ ← ٦٫٨٪. عدد المطالبات لكل معالج يوميًا: ٤٥ ← ٥٣ ← ٥٨. متوسط مدة الإنجاز: ٧٫٢ ← ٥٫٦ ← ٤٫٩ أيام. وانخفضت تكلفة المطالبة ١١٪. ويرتفع المنحنيان (الإنتاجية والأخطاء) معًا بدءًا من الشهر نفسه.",
      },
      sourceLabel: { en: "Operations MIS", ar: "نظام معلومات العمليات" },
      initiallyAvailable: true,
      reviewCostHours: 1,
      supports: ["rc-kpi"],
      contradicts: [],
      critical: true,
    },
    {
      id: "ev-regulator",
      kind: "document",
      title: { en: "Regulator Supervisory Letter", ar: "خطاب الجهة الرقابية" },
      body: {
        en: "The regulator cites 46 sampled claims with errors. 31 involve benefits paid above, or denied below, the member's annual coverage limit. Masar must submit a remediation plan within 90 days.",
        ar: "تشير الجهة الرقابية إلى ٤٦ مطالبة ضمن العينة تحتوي على أخطاء، منها ٣١ مطالبة تتعلق بمنافع صُرفت فوق الحد السنوي للتغطية أو رُفضت رغم أنها ضمنه. ويجب على «مسار» تقديم خطة معالجة خلال ٩٠ يومًا.",
      },
      sourceLabel: { en: "Compliance", ar: "إدارة الالتزام" },
      initiallyAvailable: true,
      reviewCostHours: 1,
      supports: ["rc-rules"],
      contradicts: [],
      critical: true,
    },
    {
      id: "ev-training-history",
      kind: "data",
      title: { en: "Learning Records: Claims Operations", ar: "سجلات التعلم: عمليات المطالبات" },
      body: {
        en: "Last year, 96% of processors completed the 'Accuracy & Attention to Detail' e-learning module (average assessment score 88%). Error rates in the three months after completion were unchanged.",
        ar: "في العام الماضي أكمل ٩٦٪ من المعالجين الوحدة الإلكترونية «الدقة والانتباه للتفاصيل» (متوسط درجة التقييم ٨٨٪). ولم يتغير معدل الأخطاء في الأشهر الثلاثة التالية لإكمالها.",
      },
      sourceLabel: { en: "Learning Management System", ar: "نظام إدارة التعلم" },
      initiallyAvailable: true,
      reviewCostHours: 1,
      supports: [],
      contradicts: ["rc-carelessness", "rc-broad-skill"],
      critical: false,
    },

    // ---- Discovered through interviews ----
    {
      id: "ev-head-claim",
      kind: "claim",
      title: { en: "Head of Claims: 'They're careless'", ar: "رئيس المطالبات: «إنهم لا يدققون»" },
      body: {
        en: "Khalid attributes the errors to processors rushing and losing focus, and sees a workshop as the fix.",
        ar: "يعزو خالد الأخطاء إلى استعجال المعالجين وتراجع تركيزهم، ويرى أن الورشة هي الحل.",
      },
      sourceStakeholderId: "kh",
      initiallyAvailable: false,
      reviewCostHours: 0,
      supports: ["rc-carelessness"],
      contradicts: [],
      critical: false,
    },
    {
      id: "ev-error-taxonomy",
      kind: "data",
      title: { en: "QA Error Taxonomy (last quarter)", ar: "تصنيف الأخطاء من ضمان الجودة (الربع الأخير)" },
      body: {
        en: "58% coverage-limit errors (benefit limits not checked against the member's policy schedule) · 22% medical coding errors, concentrated in complex inpatient claims · 20% data entry and other.",
        ar: "٥٨٪ أخطاء في حدود التغطية (عدم مطابقة حدود المنافع مع جدول وثيقة العضو)، ٢٢٪ أخطاء في الترميز الطبي تتركز في مطالبات التنويم المعقدة، ٢٠٪ أخطاء إدخال بيانات وغيرها.",
      },
      sourceStakeholderId: "sa",
      initiallyAvailable: false,
      reviewCostHours: 0,
      supports: ["rc-rules", "rc-onboarding"],
      contradicts: ["rc-carelessness"],
      critical: true,
    },
    {
      id: "ev-tenure-split",
      kind: "data",
      title: { en: "Error Rate by Tenure", ar: "معدل الأخطاء حسب مدة الخدمة" },
      body: {
        en: "Processors with 2+ years' tenure: 1.8% → 4.9%. Processors hired in the last 9 months: 9.6%. Errors rose for both groups, including people who were accurate for years.",
        ar: "المعالجون بخبرة سنتين فأكثر: من ١٫٨٪ إلى ٤٫٩٪. المعالجون المعيّنون خلال آخر ٩ أشهر: ٩٫٦٪. ارتفعت الأخطاء لدى الفئتين، بمن فيهم موظفون حافظوا على دقتهم لسنوات.",
      },
      sourceStakeholderId: "no",
      initiallyAvailable: false,
      reviewCostHours: 0,
      supports: ["rc-rules", "rc-onboarding"],
      contradicts: ["rc-broad-skill"],
      critical: true,
    },
    {
      id: "ev-qa-sampling",
      kind: "document",
      title: { en: "QA Sampling Change Memo", ar: "مذكرة تعديل عينات ضمان الجودة" },
      body: {
        en: "In February, QA sampling was cut from 10% of claims to 3% to free up reviewer capacity for production work. Error feedback to processors moved from monthly to quarterly.",
        ar: "في فبراير خُفّضت عينة ضمان الجودة من ١٠٪ من المطالبات إلى ٣٪ لتحويل جزء من طاقة المراجعين إلى الإنتاج. وأصبحت الملاحظات على الأخطاء تصل للمعالجين كل ربع سنة بدلًا من كل شهر.",
      },
      sourceStakeholderId: "sa",
      initiallyAvailable: false,
      reviewCostHours: 0,
      supports: ["rc-kpi"],
      contradicts: [],
      critical: true,
    },
    {
      id: "ev-kpi-memo",
      kind: "document",
      title: { en: "Productivity Target Memo (January)", ar: "مذكرة مستهدفات الإنتاجية (يناير)" },
      body: {
        en: "Daily target raised from 45 to 60 claims per processor, effective the ClaimsOne go-live month. The quarterly bonus is 100% based on volume. Accuracy is not part of the bonus formula.",
        ar: "رُفع المستهدف اليومي من ٤٥ إلى ٦٠ مطالبة لكل معالج اعتبارًا من شهر تشغيل «كليمز ون». وتُحتسب المكافأة الربعية بالكامل على أساس الحجم، ولا تدخل الدقة في معادلة المكافأة.",
      },
      sourceStakeholderId: "kh",
      initiallyAvailable: false,
      reviewCostHours: 0,
      supports: ["rc-kpi"],
      contradicts: ["rc-carelessness"],
      critical: true,
    },
    {
      id: "ev-rules-backlog",
      kind: "data",
      title: { en: "ClaimsOne Validation Rules Backlog", ar: "قائمة قواعد التحقق المؤجلة في «كليمز ون»" },
      body: {
        en: "212 of the 340 coverage-limit validation rules from the legacy system were not migrated. They were deprioritised to hit the go-live date, with a 'temporary' manual check by processors. The backlog has not been re-prioritised since.",
        ar: "لم تُنقل ٢١٢ قاعدة من أصل ٣٤٠ قاعدة للتحقق من حدود التغطية من النظام القديم. أُجّلت لتحقيق موعد التشغيل، واستُعيض عنها مؤقتًا بتحقق يدوي يجريه المعالجون. ولم يُعَد ترتيب أولوية هذه القائمة منذ ذلك الحين.",
      },
      sourceStakeholderId: "om",
      initiallyAvailable: false,
      reviewCostHours: 0,
      supports: ["rc-rules"],
      contradicts: ["rc-broad-skill", "rc-carelessness"],
      critical: true,
    },
    {
      id: "ev-workaround",
      kind: "observation",
      title: { en: "Processor Workaround: Manual Limit Checks", ar: "حل التفافي لدى المعالجين: التحقق اليدوي من الحدود" },
      body: {
        en: "Processors keep the member's policy schedule PDF open beside ClaimsOne and check limits by hand: 4–6 minutes per complex claim. Several said that at 60 claims a day they skip the check on claims that 'look normal'.",
        ar: "يُبقي المعالجون ملف جدول وثيقة العضو (PDF) مفتوحًا بجانب «كليمز ون» ويتحققون من الحدود يدويًا، ويستغرق ذلك من ٤ إلى ٦ دقائق لكل مطالبة معقدة. وذكر عدد منهم أنهم مع مستهدف ٦٠ مطالبة يوميًا يتجاوزون هذا التحقق في المطالبات التي «تبدو عادية».",
      },
      sourceStakeholderId: "pr",
      initiallyAvailable: false,
      reviewCostHours: 0,
      supports: ["rc-rules", "rc-kpi"],
      contradicts: ["rc-broad-skill"],
      critical: true,
    },
    {
      id: "ev-onboarding",
      kind: "data",
      title: { en: "Workforce & Onboarding Changes", ar: "تغيّرات القوى العاملة والتهيئة" },
      body: {
        en: "Attrition in Claims reached 27% last year. 38 of the 120 processors were hired in the last 9 months. Onboarding was shortened from 6 weeks to 2 weeks, mostly system navigation; complex inpatient coding was removed from the curriculum.",
        ar: "بلغ معدل التسرب في إدارة المطالبات ٢٧٪ العام الماضي. وعُيّن ٣٨ معالجًا من أصل ١٢٠ خلال آخر ٩ أشهر. واختُصر برنامج التهيئة من ٦ أسابيع إلى أسبوعين يغلب عليهما التدريب على التنقل في النظام، وحُذف منه الترميز الطبي لمطالبات التنويم المعقدة.",
      },
      sourceStakeholderId: "no",
      initiallyAvailable: false,
      reviewCostHours: 0,
      supports: ["rc-onboarding"],
      contradicts: [],
      critical: true,
    },
    {
      id: "ev-provider-quality",
      kind: "data",
      title: { en: "Provider Submission Quality", ar: "جودة مطالبات مقدمي الخدمة" },
      body: {
        en: "The rejection rate for incomplete provider submissions has held steady at 3–4% for 18 months, before and after go-live.",
        ar: "ظل معدل رفض المطالبات غير المكتملة الواردة من مقدمي الخدمة مستقرًا بين ٣٪ و٤٪ طوال ١٨ شهرًا، قبل التشغيل وبعده.",
      },
      sourceStakeholderId: "om",
      initiallyAvailable: false,
      reviewCostHours: 0,
      supports: [],
      contradicts: ["rc-provider"],
      critical: false,
    },
    {
      id: "ev-exit-interviews",
      kind: "claim",
      title: { en: "Exit Interview Themes", ar: "محاور مقابلات نهاية الخدمة" },
      body: {
        en: "The two most cited reasons for leaving are 'unrealistic daily targets' and 'fighting the new system'. Nobody cited lack of training.",
        ar: "أكثر سببين تكرارًا للمغادرة هما «مستهدفات يومية غير واقعية» و«المعاناة مع النظام الجديد». ولم يذكر أحد نقص التدريب.",
      },
      sourceStakeholderId: "no",
      initiallyAvailable: false,
      reviewCostHours: 0,
      supports: ["rc-kpi", "rc-rules"],
      contradicts: ["rc-broad-skill"],
      critical: false,
    },
  ],

  stakeholders: [
    // ---------------- Khalid — Head of Claims Operations (requester) ----------------
    {
      id: "kh",
      role: "buHead",
      name: { en: "Khalid Al-Mutairi", ar: "خالد المطيري" },
      title: { en: "Head of Claims Operations", ar: "رئيس عمليات المطالبات" },
      perspective: {
        en: "Made the training request. Under pressure from the COO and the regulator. Proud of the turnaround gains.",
        ar: "صاحب طلب التدريب. يقع تحت ضغط الرئيس التنفيذي للعمليات والجهة الرقابية، ويعتز بالتحسن في مدة الإنجاز.",
      },
      objectives: [
        { en: "Get the error rate down fast", ar: "خفض معدل الأخطاء بسرعة" },
        { en: "Protect the turnaround and cost gains", ar: "الحفاظ على مكاسب مدة الإنجاز والتكلفة" },
      ],
      concerns: [
        { en: "Being seen as having caused the problem", ar: "أن يُنظر إليه على أنه سبب المشكلة" },
      ],
      bias: {
        type: { en: "Fundamental attribution error", ar: "خطأ الإسناد الأساسي" },
        note: {
          en: "Attributes performance problems to people's attitude rather than to the system and targets he designed.",
          ar: "يعزو مشكلات الأداء إلى سلوك الأفراد لا إلى المنظومة والمستهدفات التي وضعها بنفسه.",
        },
      },
      initialOpenness: 55,
      questions: [
        {
          id: "q-kh-outcome",
          text: { en: "What business outcome would tell you this problem is solved?", ar: "ما النتيجة على مستوى الأعمال التي ستؤكد لك أن المشكلة حُلّت؟" },
          costHours: 1,
          quality: "critical",
          responses: [
            {
              reply: {
                en: "The error rate back under 2.5% and a remediation plan the regulator accepts. And I can't give back the turnaround gains. The board celebrated those.",
                ar: "أن يعود معدل الأخطاء إلى أقل من ٢٫٥٪، وأن تقبل الجهة الرقابية خطة المعالجة. ولا يمكنني التفريط في التحسن الذي حققناه في مدة الإنجاز؛ فقد احتفى به مجلس الإدارة.",
              },
              opennessDelta: 10,
            },
          ],
          dimensions: { strategicAlignment: 2, businessImpact: 2 },
          whyItMatters: {
            en: "Anchors the engagement in a business result, not an activity. It also surfaces the tension between speed and accuracy early.",
            ar: "يربط المهمة بنتيجة على مستوى الأعمال لا بنشاط تدريبي، ويكشف مبكرًا التوتر بين السرعة والدقة.",
          },
        },
        {
          id: "q-kh-timing",
          text: { en: "When exactly did errors start climbing, and what else changed around that time?", ar: "متى بدأت الأخطاء في الارتفاع تحديدًا؟ وما الذي تغيّر أيضًا في تلك الفترة؟" },
          costHours: 1,
          quality: "critical",
          responses: [
            {
              when: { opennessGte: ["kh", 65] },
              reply: {
                en: "February. We went live on ClaimsOne in January, and I reset the daily targets from 45 to 60 at the same time. The new system was supposed to make that easy. Here's the memo if you want it.",
                ar: "في فبراير. بدأنا تشغيل «كليمز ون» في يناير، ورفعت المستهدف اليومي من ٤٥ إلى ٦٠ في الوقت نفسه؛ كان يفترض أن يجعل النظام الجديد ذلك سهلًا. هذه المذكرة إن أردت الاطلاع عليها.",
              },
              reveals: ["ev-kpi-memo"],
              opennessDelta: 5,
            },
            {
              reply: {
                en: "Around February. ClaimsOne went live in January, but IT says it's working fine. We also set new-year targets, but that happens every year.",
                ar: "تقريبًا في فبراير. بدأ تشغيل «كليمز ون» في يناير، لكن التقنية تقول إنه يعمل بشكل جيد. كما وضعنا مستهدفات العام الجديد، وهذا يحدث كل عام.",
              },
              opennessDelta: 5,
            },
          ],
          dimensions: { diagnosticThinking: 2, evidenceBasedDecisions: 1 },
          whyItMatters: {
            en: "Timing is one of the most powerful diagnostic clues. When a performance drop coincides with system or target changes, people's skills are rarely the primary cause.",
            ar: "التوقيت من أقوى المؤشرات التشخيصية؛ فحين يتزامن تراجع الأداء مع تغيير في الأنظمة أو المستهدفات، نادرًا ما تكون مهارات الأفراد هي السبب الرئيسي.",
          },
        },
        {
          id: "q-kh-cause",
          text: { en: "What do you believe is causing the errors?", ar: "ما الذي تعتقد أنه يسبب هذه الأخطاء؟" },
          costHours: 1,
          quality: "neutral",
          responses: [
            {
              reply: {
                en: "Honestly? Carelessness. They rush, they don't double-check. A sharp two-day workshop on accuracy would wake them up.",
                ar: "بصراحة؟ قلة التدقيق. يستعجلون ولا يراجعون عملهم. ورشة مركّزة لمدة يومين عن الدقة ستعيد إليهم الانتباه.",
              },
              reveals: ["ev-head-claim"],
              opennessDelta: 0,
            },
          ],
          dimensions: { stakeholderEngagement: 1 },
          whyItMatters: {
            en: "Useful for capturing the requester's mental model, but on its own it collects opinion, not evidence. Record it as a claim to be tested.",
            ar: "مفيد لفهم التصور الذهني لصاحب الطلب، لكنه وحده يجمع رأيًا لا دليلًا. سجّله بوصفه ادعاءً يحتاج إلى اختبار.",
          },
        },
        {
          id: "q-kh-which-training",
          text: { en: "Which accuracy training would you like us to roll out, and by when?", ar: "ما برنامج الدقة الذي تريدنا أن نطلقه، ومتى؟" },
          costHours: 1,
          quality: "solution-first",
          responses: [
            {
              reply: {
                en: "Good, that's what I want to hear. Two days, all 120 processors, before quarter end. Can you send me vendor options this week?",
                ar: "ممتاز، هذا ما أريد سماعه. يومان لجميع المعالجين الـ١٢٠ قبل نهاية الربع. هل يمكنك إرسال خيارات المزودين هذا الأسبوع؟",
              },
              opennessDelta: -15,
            },
          ],
          dimensions: { diagnosticThinking: -2, solutionAppropriateness: -2 },
          whyItMatters: {
            en: "Accepting the solution before diagnosing positions you as an order-taker. It also commits you to an intervention the evidence may not support.",
            ar: "قبول الحل قبل التشخيص يضعك في موقع منفّذ الطلبات، ويلزمك بتدخل قد لا تدعمه الأدلة.",
          },
        },
        {
          id: "q-kh-leading",
          text: { en: "Wouldn't you agree your team simply needs to be more careful?", ar: "ألا توافق على أن فريقك يحتاج ببساطة إلى مزيد من الحرص؟" },
          costHours: 1,
          quality: "leading",
          responses: [
            {
              reply: {
                en: "Exactly my point. I'm glad someone in HR finally gets it.",
                ar: "هذه وجهة نظري تمامًا. يسعدني أن أحدًا في الموارد البشرية فهمها أخيرًا.",
              },
              opennessDelta: -10,
            },
          ],
          dimensions: { diagnosticThinking: -2 },
          whyItMatters: {
            en: "A leading question confirms the stakeholder's bias and yields no new information. Diagnostic questions are open and neutral.",
            ar: "السؤال الإيحائي يعزز انحياز صاحب المصلحة ولا يضيف معلومة جديدة. الأسئلة التشخيصية مفتوحة ومحايدة.",
          },
        },
        {
          id: "q-kh-ch-tenure",
          kind: "challenge",
          available: { hasEvidence: "ev-tenure-split" },
          text: {
            en: "Errors also nearly tripled among your experienced processors, people who were accurate for years. What changed for them?",
            ar: "تضاعفت الأخطاء تقريبًا ثلاث مرات حتى لدى معالجيك ذوي الخبرة، وهم من حافظوا على دقتهم لسنوات. ما الذي تغيّر بالنسبة لهم؟",
          },
          costHours: 1,
          quality: "critical",
          responses: [
            {
              reply: {
                en: "…That's a fair point. They were at 1.8%. The only things that changed for them are the system and, fine, the 60-a-day target. I'll share the target memo.",
                ar: "…هذه ملاحظة في محلها. كانوا عند ١٫٨٪. الشيئان الوحيدان اللذان تغيّرا بالنسبة لهم هما النظام، وحسنًا، مستهدف الستين مطالبة يوميًا. سأشاركك مذكرة المستهدفات.",
              },
              reveals: ["ev-kpi-memo"],
              opennessDelta: 10,
            },
          ],
          dimensions: { diagnosticThinking: 3, evidenceBasedDecisions: 3, stakeholderEngagement: 1 },
          whyItMatters: {
            en: "Using data to respectfully test a stakeholder's assumption is the core consulting move. Experienced people becoming less accurate points to the environment, not to capability.",
            ar: "استخدام البيانات لاختبار افتراض صاحب المصلحة باحترام هو جوهر العمل الاستشاري. وتراجع دقة ذوي الخبرة يشير إلى بيئة العمل لا إلى القدرات.",
          },
        },
        {
          id: "q-kh-ch-training",
          kind: "challenge",
          available: { hasEvidence: "ev-training-history" },
          text: {
            en: "96% of processors completed accuracy e-learning last year and error rates didn't move. Why would more training work now?",
            ar: "أكمل ٩٦٪ من المعالجين برنامجًا إلكترونيًا عن الدقة العام الماضي ولم يتغير معدل الأخطاء. لماذا سينجح مزيد من التدريب الآن؟",
          },
          costHours: 1,
          quality: "strong",
          responses: [
            {
              reply: {
                en: "I assumed a workshop would land better than e-learning. But if training didn't move the number then, I can't promise it would now.",
                ar: "افترضت أن الورشة الحضورية ستكون أكثر أثرًا من التعلم الإلكتروني. لكن إن لم يحرّك التدريب الرقم حينها، فلا أستطيع أن أضمن أنه سيحركه الآن.",
              },
              opennessDelta: 5,
            },
          ],
          dimensions: { evidenceBasedDecisions: 2, solutionAppropriateness: 2 },
          whyItMatters: {
            en: "Prior intervention history is evidence. If the same solution already failed to move the metric, the problem probably isn't a knowledge gap.",
            ar: "سجل التدخلات السابقة دليل بحد ذاته؛ فإذا فشل الحل نفسه سابقًا في تحريك المؤشر، فالأرجح أن المشكلة ليست فجوة معرفية.",
          },
        },
      ],
    },

    // ---------------- Noura — HR Business Partner ----------------
    {
      id: "no",
      role: "hrbp",
      name: { en: "Noura Al-Dosari", ar: "نورة الدوسري" },
      title: { en: "HR Business Partner, Operations", ar: "شريكة أعمال الموارد البشرية للعمليات" },
      perspective: {
        en: "Supports Claims Operations on people matters. Has raised attrition concerns before without much traction.",
        ar: "تدعم عمليات المطالبات في شؤون الموظفين، وسبق أن نبّهت إلى ارتفاع التسرب دون تجاوب يُذكر.",
      },
      objectives: [{ en: "Reduce attrition and stabilise the workforce", ar: "خفض التسرب وتحقيق الاستقرار في القوى العاملة" }],
      concerns: [{ en: "HR being blamed for an operational problem", ar: "تحميل الموارد البشرية مسؤولية مشكلة تشغيلية" }],
      bias: {
        type: { en: "Functional lens", ar: "عدسة التخصص" },
        note: {
          en: "Tends to frame every problem as a people or HR-process issue, and may under-weight technology factors.",
          ar: "تميل إلى تأطير كل مشكلة على أنها مسألة أفراد أو إجراءات موارد بشرية، وقد تقلل من وزن العوامل التقنية.",
        },
      },
      initialOpenness: 60,
      questions: [
        {
          id: "q-no-workforce",
          text: { en: "How has the claims workforce changed over the past year?", ar: "كيف تغيّرت القوى العاملة في المطالبات خلال العام الماضي؟" },
          costHours: 1,
          quality: "strong",
          responses: [
            {
              reply: {
                en: "A lot. Attrition hit 27%, so a third of the processors are new. To fill seats faster, Operations cut onboarding from six weeks to two. I flagged the risk at the time.",
                ar: "تغيّرت كثيرًا. بلغ التسرب ٢٧٪، فأصبح ثلث المعالجين جددًا. ولسد الشواغر بسرعة اختصرت العمليات التهيئة من ستة أسابيع إلى أسبوعين، وقد نبّهت إلى المخاطر حينها.",
              },
              reveals: ["ev-onboarding"],
              opennessDelta: 5,
            },
          ],
          dimensions: { capabilityAssessment: 2, stakeholderEngagement: 1 },
          whyItMatters: {
            en: "Workforce composition changes can create real, but localised, capability gaps. The point is to find who has the gap, not to assume everyone does.",
            ar: "التغيرات في تركيبة القوى العاملة قد تُحدث فجوات حقيقية لكنها محصورة. المهم أن تحدد من لديه الفجوة لا أن تفترض أنها لدى الجميع.",
          },
        },
        {
          id: "q-no-tenure",
          text: { en: "Can we break error rates down by tenure?", ar: "هل يمكننا تقسيم معدلات الأخطاء حسب مدة الخدمة؟" },
          costHours: 1,
          quality: "critical",
          responses: [
            {
              reply: {
                en: "Sara and I pulled this last month. New hires are at 9.6%, which is what I expected. What surprised me is that the experienced group went from 1.8% to 4.9%.",
                ar: "استخرجتها مع سارة الشهر الماضي. الموظفون الجدد عند ٩٫٦٪، وهذا متوقع. لكن ما فاجأني أن الفئة ذات الخبرة ارتفعت من ١٫٨٪ إلى ٤٫٩٪.",
              },
              reveals: ["ev-tenure-split"],
              opennessDelta: 5,
            },
          ],
          dimensions: { diagnosticThinking: 3, evidenceBasedDecisions: 2 },
          whyItMatters: {
            en: "Segmenting the data separates a capability gap (new hires only) from a system problem (everyone). That one cut reframes the whole diagnosis.",
            ar: "تقسيم البيانات يفصل بين فجوة القدرات (لدى الجدد فقط) ومشكلة المنظومة (لدى الجميع). وهذا التقسيم وحده يعيد تأطير التشخيص بالكامل.",
          },
        },
        {
          id: "q-no-exit",
          text: { en: "What are people saying in exit interviews?", ar: "ماذا يقول الموظفون في مقابلات نهاية الخدمة؟" },
          costHours: 1,
          quality: "strong",
          responses: [
            {
              when: { opennessGte: ["no", 55] },
              reply: {
                en: "Two themes, consistently: the targets are unrealistic, and the new system makes them fight for every claim. Nobody has said they lacked training.",
                ar: "محوران يتكرران باستمرار: المستهدفات غير واقعية، والنظام الجديد يجعلهم يكافحون في كل مطالبة. ولم يقل أحد إنه كان ينقصه التدريب.",
              },
              reveals: ["ev-exit-interviews"],
              opennessDelta: 5,
            },
            {
              reply: {
                en: "The usual reasons. I'd rather not go into individual cases.",
                ar: "الأسباب المعتادة. أفضّل عدم الدخول في الحالات الفردية.",
              },
              opennessDelta: 0,
            },
          ],
          dimensions: { stakeholderEngagement: 1, evidenceBasedDecisions: 1 },
          whyItMatters: {
            en: "Exit data is an underused, low-cost source of root-cause signals about workload, systems and management practices.",
            ar: "بيانات مقابلات نهاية الخدمة مصدر منخفض التكلفة وقليل الاستخدام لإشارات الأسباب الجذرية المتعلقة بعبء العمل والأنظمة وممارسات الإدارة.",
          },
        },
        {
          id: "q-no-rewards",
          text: { en: "How are processors' goals and bonuses set?", ar: "كيف تُحدد أهداف المعالجين ومكافآتهم؟" },
          costHours: 1,
          quality: "strong",
          responses: [
            {
              when: { opennessGte: ["no", 60] },
              reply: {
                en: "Operations owns it. The bonus is purely volume, and the target went to 60 in January. Accuracy isn't in the formula at all. Here's the memo; I've raised this before.",
                ar: "العمليات هي من تحددها. المكافأة قائمة على الحجم فقط، ورُفع المستهدف إلى ٦٠ في يناير، ولا تدخل الدقة في المعادلة إطلاقًا. هذه المذكرة، وقد سبق أن أثرت الموضوع.",
              },
              reveals: ["ev-kpi-memo"],
              opennessDelta: 5,
            },
            {
              reply: {
                en: "Operations sets them. It's volume-based, I believe. You'd have to ask Khalid for the detail.",
                ar: "تحددها العمليات، وأظنها قائمة على الحجم. عليك أن تسأل خالد عن التفاصيل.",
              },
              opennessDelta: 0,
            },
          ],
          dimensions: { diagnosticThinking: 2, capabilityAssessment: 1 },
          whyItMatters: {
            en: "People do what the system rewards. Consequences and incentives are one of the most common non-training causes of performance problems.",
            ar: "الناس يفعلون ما تكافئه المنظومة. والعواقب والحوافز من أكثر الأسباب غير التدريبية شيوعًا لمشكلات الأداء.",
          },
        },
        {
          id: "q-no-framework",
          text: { en: "What competency framework do processors work against?", ar: "ما إطار الجدارات الذي يعمل المعالجون وفقه؟" },
          costHours: 1,
          quality: "neutral",
          responses: [
            {
              reply: {
                en: "There is one, last updated in 2022, before ClaimsOne. It doesn't mention any of the new system's validation steps.",
                ar: "يوجد إطار حُدّث آخر مرة في ٢٠٢٢، أي قبل «كليمز ون»، ولا يذكر أيًّا من خطوات التحقق في النظام الجديد.",
              },
              opennessDelta: 0,
            },
          ],
          dimensions: { capabilityAssessment: 1 },
          whyItMatters: {
            en: "Reasonable background, but a framework review rarely explains a sudden performance drop. Mind the hours.",
            ar: "معلومة خلفية معقولة، لكن مراجعة إطار الجدارات نادرًا ما تفسر تراجعًا مفاجئًا في الأداء. انتبه لرصيد الساعات.",
          },
        },
        {
          id: "q-no-vendor",
          text: { en: "Which training vendor have we used for accuracy programmes before?", ar: "أي مزود تدريب استعنّا به سابقًا في برامج الدقة؟" },
          costHours: 1,
          quality: "solution-first",
          responses: [
            {
              reply: {
                en: "We used an e-learning provider last year. I can dig out the contract, but are we sure that's the problem?",
                ar: "استعنّا بمزود تعلم إلكتروني العام الماضي. يمكنني إحضار العقد، لكن هل نحن متأكدون أن هذه هي المشكلة؟",
              },
              opennessDelta: -10,
            },
          ],
          dimensions: { solutionAppropriateness: -2, diagnosticThinking: -1 },
          whyItMatters: {
            en: "Procurement questions belong after diagnosis. Even the HRBP is questioning the premise here.",
            ar: "أسئلة التعاقد تأتي بعد التشخيص، وحتى شريكة الأعمال هنا تشكك في المنطلق.",
          },
        },
      ],
    },

    // ---------------- Omar — ClaimsOne Product Owner ----------------
    {
      id: "om",
      role: "expert",
      name: { en: "Omar Haddad", ar: "عمر حداد" },
      title: { en: "Product Owner, ClaimsOne Platform", ar: "مالك منتج منصة «كليمز ون»" },
      perspective: {
        en: "Led the go-live. The project was declared a success on time and on budget.",
        ar: "قاد مرحلة التشغيل. وأُعلن نجاح المشروع في موعده وضمن ميزانيته.",
      },
      objectives: [{ en: "Protect the platform's reputation", ar: "حماية سمعة المنصة" }],
      concerns: [{ en: "The project being reopened or blamed", ar: "إعادة فتح المشروع أو تحميله المسؤولية" }],
      bias: {
        type: { en: "Defensive / sunk-cost", ar: "دفاعية / التكلفة الغارقة" },
        note: {
          en: "Frames issues as user behaviour to protect a project that was declared a success.",
          ar: "يؤطر المشكلات على أنها سلوك مستخدمين ليحمي مشروعًا أُعلن نجاحه.",
        },
      },
      initialOpenness: 40,
      questions: [
        {
          id: "q-om-change",
          text: { en: "What did the ClaimsOne migration change for processors day to day?", ar: "ما الذي غيّره الانتقال إلى «كليمز ون» في العمل اليومي للمعالجين؟" },
          costHours: 1,
          quality: "strong",
          responses: [
            {
              reply: {
                en: "Faster screens, an integrated provider portal, fewer clicks. A few validations moved to manual checks during cutover, which is standard on any migration.",
                ar: "شاشات أسرع، وبوابة مدمجة لمقدمي الخدمة، ونقرات أقل. وتحوّلت بعض عمليات التحقق إلى تحقق يدوي أثناء الانتقال، وهذا معتاد في أي عملية ترحيل.",
              },
              opennessDelta: 10,
            },
          ],
          dimensions: { diagnosticThinking: 2, stakeholderEngagement: 1 },
          whyItMatters: {
            en: "An open, non-threatening question builds trust with a defensive stakeholder. Note the phrase 'moved to manual checks'.",
            ar: "سؤال مفتوح وغير مهدِّد يبني الثقة مع صاحب مصلحة دفاعي. لاحظ عبارة «تحوّلت إلى تحقق يدوي».",
          },
        },
        {
          id: "q-om-rules",
          text: { en: "Which of the legacy validation rules are live in ClaimsOne today?", ar: "أي قواعد التحقق من النظام القديم تعمل حاليًا في «كليمز ون»؟" },
          costHours: 1,
          quality: "critical",
          responses: [
            {
              when: { opennessGte: ["om", 50] },
              reply: {
                en: "Between us: 212 of the 340 coverage-limit rules didn't make it. We parked them to hit the go-live date and asked processors to check limits manually 'for now'. That backlog never got re-prioritised.",
                ar: "بيني وبينك: ٢١٢ قاعدة من أصل ٣٤٠ قاعدة لحدود التغطية لم تُنقل. أجّلناها لتحقيق موعد التشغيل، وطلبنا من المعالجين التحقق من الحدود يدويًا «مؤقتًا». ولم يُعَد ترتيب أولوية تلك القائمة قط.",
              },
              reveals: ["ev-rules-backlog"],
              opennessDelta: 5,
            },
            {
              reply: {
                en: "Most of the important ones. The platform is working as designed.",
                ar: "معظم القواعد المهمة. المنصة تعمل كما صُممت.",
              },
              opennessDelta: 0,
            },
          ],
          dimensions: { diagnosticThinking: 3, rootCauseIdentification: 2 },
          whyItMatters: {
            en: "Specific, factual questions about the environment get past opinions. Whether you get a candid answer depends on the trust you've built.",
            ar: "الأسئلة المحددة والوقائعية عن بيئة العمل تتجاوز الآراء، لكن الحصول على إجابة صريحة يعتمد على الثقة التي بنيتها.",
          },
        },
        {
          id: "q-om-blame",
          text: { en: "Is the system the reason for all these errors?", ar: "هل النظام هو سبب كل هذه الأخطاء؟" },
          costHours: 1,
          quality: "leading",
          responses: [
            {
              reply: {
                en: "No. The system works as designed. Processors need to follow the procedure. If you're here to blame the project, we're done.",
                ar: "لا. النظام يعمل كما صُمم، وعلى المعالجين اتباع الإجراءات. إن كنت هنا لتحميل المشروع المسؤولية فلا داعي للاستمرار.",
              },
              opennessDelta: -15,
            },
          ],
          dimensions: { stakeholderEngagement: -2 },
          whyItMatters: {
            en: "An accusatory framing triggers defensiveness and locks away the insight you need. Ask about specifics, not blame.",
            ar: "الصياغة الاتهامية تثير الدفاعية وتغلق الباب أمام المعلومة التي تحتاجها. اسأل عن التفاصيل لا عن المسؤول.",
          },
        },
        {
          id: "q-om-ch-limits",
          kind: "challenge",
          available: { hasEvidence: "ev-error-taxonomy" },
          text: {
            en: "QA says 58% of errors are coverage-limit errors. Are coverage-limit checks automated in ClaimsOne?",
            ar: "يفيد ضمان الجودة بأن ٥٨٪ من الأخطاء تتعلق بحدود التغطية. هل التحقق من حدود التغطية مؤتمت في «كليمز ون»؟",
          },
          costHours: 1,
          quality: "critical",
          responses: [
            {
              reply: {
                en: "…Not all of them. 212 of the 340 limit rules were deferred at go-live, and processors check those by hand. I hadn't connected that to the QA numbers.",
                ar: "…ليس كلها. أُجّلت ٢١٢ قاعدة من أصل ٣٤٠ عند التشغيل، ويتحقق منها المعالجون يدويًا. لم أربط ذلك بأرقام ضمان الجودة من قبل.",
              },
              reveals: ["ev-rules-backlog"],
              opennessDelta: 10,
            },
          ],
          dimensions: { evidenceBasedDecisions: 3, rootCauseIdentification: 3 },
          whyItMatters: {
            en: "Bringing specific evidence from one stakeholder to another turns a defensive conversation into a joint problem-solving one.",
            ar: "نقل دليل محدد من صاحب مصلحة إلى آخر يحوّل الحوار الدفاعي إلى حل مشترك للمشكلة.",
          },
        },
        {
          id: "q-om-provider",
          text: { en: "Has the quality of provider submissions changed since go-live?", ar: "هل تغيّرت جودة المطالبات الواردة من مقدمي الخدمة منذ التشغيل؟" },
          costHours: 1,
          quality: "strong",
          responses: [
            {
              reply: {
                en: "No. Rejections for incomplete submissions have sat at 3–4% for eighteen months. If anything, the portal made submissions cleaner.",
                ar: "لا. ظلت نسبة رفض المطالبات غير المكتملة بين ٣٪ و٤٪ طوال ثمانية عشر شهرًا، بل إن البوابة جعلت المطالبات أكثر اكتمالًا.",
              },
              reveals: ["ev-provider-quality"],
              opennessDelta: 5,
            },
          ],
          dimensions: { diagnosticThinking: 2, evidenceBasedDecisions: 1 },
          whyItMatters: {
            en: "Ruling out alternative explanations is as important as confirming one. This closes off the 'bad inputs' hypothesis.",
            ar: "استبعاد التفسيرات البديلة لا يقل أهمية عن تأكيد تفسير واحد، وهذا يغلق فرضية «سوء المدخلات».",
          },
        },
        {
          id: "q-om-fix",
          available: { hasEvidence: "ev-rules-backlog" },
          text: { en: "What would it take to migrate the remaining rules?", ar: "ما الذي يتطلبه نقل القواعد المتبقية؟" },
          costHours: 1,
          quality: "strong",
          responses: [
            {
              reply: {
                en: "Roughly ten weeks with two business analysts. It was never re-prioritised because nobody asked. Operations never escalated it.",
                ar: "نحو عشرة أسابيع بمحللَي أعمال اثنين. لم يُعَد ترتيب أولويته لأن أحدًا لم يطلب ذلك؛ فالعمليات لم تصعّد الأمر قط.",
              },
              opennessDelta: 5,
            },
          ],
          dimensions: { solutionAppropriateness: 2, businessImpact: 1 },
          whyItMatters: {
            en: "Testing the feasibility of a non-training intervention early makes your later recommendation credible and costed.",
            ar: "اختبار جدوى التدخل غير التدريبي مبكرًا يجعل توصيتك اللاحقة موثوقة ومحددة التكلفة.",
          },
        },
      ],
    },

    // ---------------- Sara — QA Lead ----------------
    {
      id: "sa",
      role: "expert",
      name: { en: "Sara Al-Qahtani", ar: "سارة القحطاني" },
      title: { en: "Quality Assurance Lead, Claims", ar: "قائدة ضمان الجودة، المطالبات" },
      perspective: {
        en: "Runs claims audits. Her team lost capacity this year and she is frustrated about it.",
        ar: "تدير تدقيق المطالبات. فقد فريقها جزءًا من طاقته هذا العام، وهي مستاءة من ذلك.",
      },
      objectives: [{ en: "Restore QA coverage", ar: "استعادة نطاق تغطية ضمان الجودة" }],
      concerns: [{ en: "QA being treated as overhead", ar: "التعامل مع ضمان الجودة كتكلفة إضافية" }],
      bias: {
        type: { en: "Advocacy bias", ar: "انحياز المناصرة" },
        note: {
          en: "Wants her function's capacity restored, so may present QA cuts as the main cause.",
          ar: "تسعى لاستعادة طاقة وحدتها، وقد تقدّم تقليص ضمان الجودة على أنه السبب الرئيسي.",
        },
      },
      initialOpenness: 50,
      questions: [
        {
          id: "q-sa-types",
          text: { en: "What types of errors are you finding?", ar: "ما أنواع الأخطاء التي تجدونها؟" },
          costHours: 1,
          quality: "critical",
          responses: [
            {
              reply: {
                en: "Fifty-eight percent are coverage-limit errors: benefits paid over the limit or wrongly denied. Twenty-two percent are coding errors on complex inpatient claims. The rest is data entry.",
                ar: "ثمانية وخمسون بالمئة أخطاء في حدود التغطية: منافع صُرفت فوق الحد أو رُفضت خطأً. واثنان وعشرون بالمئة أخطاء ترميز في مطالبات التنويم المعقدة، والباقي إدخال بيانات.",
              },
              reveals: ["ev-error-taxonomy"],
              opennessDelta: 10,
            },
          ],
          dimensions: { diagnosticThinking: 3, rootCauseIdentification: 2 },
          whyItMatters: {
            en: "'Errors' is not one problem. Classifying the errors usually reveals distinct causes that need distinct solutions.",
            ar: "«الأخطاء» ليست مشكلة واحدة؛ وتصنيفها يكشف غالبًا أسبابًا مختلفة تتطلب حلولًا مختلفة.",
          },
        },
        {
          id: "q-sa-process",
          text: { en: "How has the QA process changed this year?", ar: "كيف تغيّرت عملية ضمان الجودة هذا العام؟" },
          costHours: 1,
          quality: "critical",
          responses: [
            {
              when: { opennessGte: ["sa", 50] },
              reply: {
                en: "In February we went from sampling 10% of claims to 3%, to free reviewers for production. Feedback to processors went from monthly to quarterly. People don't find out they're wrong until months later.",
                ar: "في فبراير خفّضنا العينة من ١٠٪ إلى ٣٪ لتحويل المراجعين إلى الإنتاج، وأصبحت الملاحظات للمعالجين ربع سنوية بعد أن كانت شهرية. لا يعرف الموظفون أنهم أخطؤوا إلا بعد أشهر.",
              },
              reveals: ["ev-qa-sampling"],
              opennessDelta: 5,
            },
            {
              reply: {
                en: "There were some resourcing changes. It's a sensitive topic.",
                ar: "حدثت بعض التغييرات في الموارد، والموضوع حساس.",
              },
              opennessDelta: 0,
            },
          ],
          dimensions: { diagnosticThinking: 2, evidenceBasedDecisions: 2 },
          whyItMatters: {
            en: "Feedback loops drive accuracy. When people don't learn about their errors, performance drifts regardless of skill.",
            ar: "حلقات التغذية الراجعة هي ما يحافظ على الدقة؛ فحين لا يعرف الناس أخطاءهم ينحرف الأداء بغض النظر عن المهارة.",
          },
        },
        {
          id: "q-sa-concentration",
          text: { en: "Are errors concentrated in particular claim types or teams?", ar: "هل تتركز الأخطاء في أنواع معينة من المطالبات أو في فرق بعينها؟" },
          costHours: 1,
          quality: "strong",
          responses: [
            {
              reply: {
                en: "Coding errors cluster in teams with lots of new hires. Limit errors are everywhere, including my most senior processors. Noura has the tenure split.",
                ar: "أخطاء الترميز تتركز في الفرق التي تضم كثيرًا من الموظفين الجدد. أما أخطاء الحدود فموجودة في كل مكان، حتى لدى أقدم المعالجين. ولدى نورة التقسيم حسب مدة الخدمة.",
              },
              reveals: ["ev-tenure-split"],
              opennessDelta: 5,
            },
          ],
          dimensions: { diagnosticThinking: 2, capabilityAssessment: 2 },
          whyItMatters: {
            en: "The pattern of who makes which errors separates a localised skill gap from an organisation-wide barrier.",
            ar: "نمط من يرتكب أي نوع من الأخطاء يميّز فجوة المهارة المحصورة عن العائق المنتشر على مستوى المنظمة.",
          },
        },
        {
          id: "q-sa-names",
          text: { en: "Who is making the most mistakes, so we can target them?", ar: "من الأكثر ارتكابًا للأخطاء لنستهدفه؟" },
          costHours: 1,
          quality: "weak",
          responses: [
            {
              reply: {
                en: "I could give you names, but naming people won't tell you why it's happening. And it'll get around the floor fast.",
                ar: "يمكنني إعطاؤك أسماء، لكن تسمية الأشخاص لن تخبرك لماذا يحدث ذلك، وسينتشر الخبر في القسم بسرعة.",
              },
              opennessDelta: -5,
            },
          ],
          dimensions: { diagnosticThinking: -1, stakeholderEngagement: -1 },
          whyItMatters: {
            en: "Individual blame is a symptom-level response. Ask about patterns and conditions, not culprits.",
            ar: "لوم الأفراد استجابة على مستوى الأعراض؛ اسأل عن الأنماط والظروف لا عن المذنبين.",
          },
        },
      ],
    },

    // ---------------- Processors focus group ----------------
    {
      id: "pr",
      role: "employee",
      name: { en: "Claims Processors", ar: "معالجو المطالبات" },
      title: { en: "Focus group: 6 processors, mixed tenure", ar: "مجموعة نقاش: ٦ معالجين من مستويات خبرة مختلفة" },
      perspective: {
        en: "The people doing the work. Wary that the session is about blame.",
        ar: "من يؤدون العمل فعليًا. يخشون أن تكون الجلسة لتحميلهم المسؤولية.",
      },
      objectives: [{ en: "Hit the target without getting into trouble", ar: "تحقيق المستهدف دون التعرض للمساءلة" }],
      concerns: [{ en: "Being blamed for the error rate", ar: "تحميلهم مسؤولية معدل الأخطاء" }],
      bias: {
        type: { en: "Group defensiveness", ar: "الدفاعية الجماعية" },
        note: {
          en: "May understate genuine skill gaps among newer colleagues to protect the group.",
          ar: "قد يقللون من الفجوات المهارية الفعلية لدى الزملاء الجدد حماية للمجموعة.",
        },
      },
      initialOpenness: 35,
      questions: [
        {
          id: "q-pr-walkthrough",
          text: { en: "Walk me through how you process a complex claim, step by step.", ar: "اشرحوا لي خطوة بخطوة كيف تعالجون مطالبة معقدة." },
          costHours: 2,
          quality: "critical",
          responses: [
            {
              reply: {
                en: "We open the claim in ClaimsOne and the member's policy PDF beside it, then check each benefit against the limit table by hand. That's four to six minutes on a complex one. At sixty a day… some of us skip it on claims that look normal.",
                ar: "نفتح المطالبة في «كليمز ون» ونفتح بجانبها ملف وثيقة العضو، ثم نطابق كل منفعة مع جدول الحدود يدويًا. يستغرق ذلك من أربع إلى ست دقائق في المطالبة المعقدة. ومع ستين مطالبة يوميًا… يتجاوز بعضنا هذه الخطوة في المطالبات التي تبدو عادية.",
              },
              reveals: ["ev-workaround"],
              opennessDelta: 15,
            },
          ],
          dimensions: { diagnosticThinking: 3, rootCauseIdentification: 2, stakeholderEngagement: 2 },
          whyItMatters: {
            en: "Observing the real workflow (gemba) exposes workarounds that never appear in dashboards or management accounts.",
            ar: "ملاحظة سير العمل الفعلي في موقعه تكشف الحلول الالتفافية التي لا تظهر في لوحات المؤشرات ولا في روايات الإدارة.",
          },
        },
        {
          id: "q-pr-barriers",
          text: { en: "What gets in the way of getting claims right first time?", ar: "ما الذي يمنعكم من إنجاز المطالبة بشكل صحيح من المرة الأولى؟" },
          costHours: 1,
          quality: "critical",
          responses: [
            {
              when: { opennessGte: ["pr", 45] },
              reply: {
                en: "Honestly, the number. If you check every limit properly you hit forty-five, not sixty, and your bonus goes. And we hear about mistakes months later, so you can't correct yourself.",
                ar: "بصراحة، الرقم. إن تحققت من كل حد كما يجب فستصل إلى خمس وأربعين لا ستين، وتخسر مكافأتك. ونسمع عن أخطائنا بعد أشهر، فلا نستطيع تصحيح أنفسنا.",
              },
              reveals: ["ev-workaround"],
              opennessDelta: 10,
            },
            {
              reply: {
                en: "It's fine. We manage.",
                ar: "الأمور بخير، نتدبر أمرنا.",
              },
              opennessDelta: 5,
            },
          ],
          dimensions: { diagnosticThinking: 2, rootCauseIdentification: 2 },
          whyItMatters: {
            en: "Asking about barriers rather than mistakes invites candour. What you get depends on the psychological safety you've built first.",
            ar: "السؤال عن العوائق بدلًا من الأخطاء يشجع على الصراحة، لكن ما تحصل عليه يعتمد على الأمان النفسي الذي بنيته أولًا.",
          },
        },
        {
          id: "q-pr-onboarding",
          text: { en: "For newer colleagues: what did onboarding prepare you for, and what didn't it?", ar: "للزملاء الجدد: ما الذي هيأكم له برنامج التهيئة، وما الذي لم يهيئكم له؟" },
          costHours: 1,
          quality: "strong",
          responses: [
            {
              reply: {
                en: "Two weeks, mostly how to navigate the screens. Nobody taught us inpatient coding. We learn it from whoever sits next to us.",
                ar: "أسبوعان، معظمهما عن التنقل بين الشاشات. لم يعلّمنا أحد ترميز مطالبات التنويم، نتعلمه ممن يجلس بجانبنا.",
              },
              reveals: ["ev-onboarding"],
              opennessDelta: 5,
            },
          ],
          dimensions: { capabilityAssessment: 3 },
          whyItMatters: {
            en: "This is where a genuine, targeted learning need lives: complex coding for recent hires. It is specific, bounded and evidenced.",
            ar: "هنا تكمن حاجة تعلم حقيقية ومحددة: الترميز المعقد للموظفين الجدد. وهي حاجة دقيقة ومحصورة ومدعومة بالأدلة.",
          },
        },
        {
          id: "q-pr-training",
          text: { en: "Would accuracy training help you?", ar: "هل سيساعدكم تدريب على الدقة؟" },
          costHours: 1,
          quality: "solution-first",
          responses: [
            {
              reply: {
                en: "…Sure, if you want. We did an accuracy course last year.",
                ar: "…لا بأس إن أردتم. حضرنا دورة عن الدقة العام الماضي.",
              },
              opennessDelta: -10,
            },
          ],
          dimensions: { diagnosticThinking: -2, solutionAppropriateness: -1 },
          whyItMatters: {
            en: "A yes/no solution question gets polite compliance, not insight, and signals that the decision has already been made.",
            ar: "سؤال الحل بنعم أو لا يجلب موافقة مجاملة لا رؤية، ويوحي بأن القرار قد اتُّخذ مسبقًا.",
          },
        },
        {
          id: "q-pr-why-mistakes",
          text: { en: "Why are you making more mistakes than before?", ar: "لماذا ترتكبون أخطاء أكثر من السابق؟" },
          costHours: 1,
          quality: "leading",
          responses: [
            {
              reply: {
                en: "(Silence.) …We're doing our best with what we've got.",
                ar: "(صمت.) …نبذل أقصى ما نستطيع بما هو متاح لنا.",
              },
              opennessDelta: -15,
            },
          ],
          dimensions: { stakeholderEngagement: -2 },
          whyItMatters: {
            en: "The question presumes individual fault. Frontline groups go quiet when they feel accused, and their insight is lost.",
            ar: "السؤال يفترض خطأ الأفراد. وتصمت مجموعات الخط الأمامي حين تشعر بالاتهام، فتضيع رؤيتها.",
          },
        },
      ],
    },
  ],

  rootCauses: [
    {
      id: "rc-rules",
      type: "technology",
      title: { en: "Coverage-limit validation rules were not migrated", ar: "عدم نقل قواعد التحقق من حدود التغطية" },
      explanation: {
        en: "212 of 340 automated limit checks were deferred at go-live and replaced by a manual check that is slow and easily skipped.",
        ar: "أُجّل ٢١٢ فحصًا آليًا من أصل ٣٤٠ عند التشغيل، واستُبدلت بتحقق يدوي بطيء ويسهل تجاوزه.",
      },
      isTrue: true,
      weight: 0.4,
    },
    {
      id: "rc-kpi",
      type: "governance",
      title: { en: "Volume-only targets and reduced quality feedback", ar: "مستهدفات قائمة على الحجم فقط وتراجع التغذية الراجعة على الجودة" },
      explanation: {
        en: "Targets rose 33% with a volume-only bonus while QA sampling fell from 10% to 3%. The system rewards speed and hides errors.",
        ar: "ارتفعت المستهدفات ٣٣٪ مع مكافأة قائمة على الحجم فقط، بينما انخفضت عينة ضمان الجودة من ١٠٪ إلى ٣٪؛ فالمنظومة تكافئ السرعة وتُخفي الأخطاء.",
      },
      isTrue: true,
      weight: 0.35,
    },
    {
      id: "rc-onboarding",
      type: "skill",
      title: { en: "New-hire gap in complex inpatient coding", ar: "فجوة لدى الموظفين الجدد في ترميز مطالبات التنويم المعقدة" },
      explanation: {
        en: "Onboarding was compressed and complex coding was removed, creating a real but bounded skill gap among 38 recent hires.",
        ar: "اختُصرت التهيئة وحُذف منها الترميز المعقد، فنشأت فجوة مهارية حقيقية لكنها محصورة لدى ٣٨ موظفًا جديدًا.",
      },
      isTrue: true,
      weight: 0.25,
    },
    {
      id: "rc-carelessness",
      type: "motivation",
      title: { en: "Processors are careless and lack attention to detail", ar: "المعالجون لا يدققون ويفتقرون إلى الانتباه للتفاصيل" },
      explanation: {
        en: "The requester's hypothesis. Contradicted by experienced staff's long accuracy record and by the timing of the decline.",
        ar: "فرضية صاحب الطلب، ويناقضها سجل الدقة الطويل لذوي الخبرة وتوقيت التراجع.",
      },
      isTrue: false,
      weight: 0,
    },
    {
      id: "rc-broad-skill",
      type: "skill",
      title: { en: "The whole workforce lacks accuracy skills", ar: "جميع العاملين يفتقرون إلى مهارات الدقة" },
      explanation: {
        en: "Contradicted by last year's training having no effect and by errors rising among skilled, tenured staff.",
        ar: "يناقضه انعدام أثر تدريب العام الماضي، وارتفاع الأخطاء لدى ذوي المهارة والخبرة.",
      },
      isTrue: false,
      weight: 0,
    },
    {
      id: "rc-provider",
      type: "process",
      title: { en: "Provider submission quality has declined", ar: "تراجع جودة المطالبات الواردة من مقدمي الخدمة" },
      explanation: {
        en: "Ruled out: provider rejection rates have been stable for 18 months.",
        ar: "مستبعد: معدلات رفض مطالبات مقدمي الخدمة مستقرة منذ ١٨ شهرًا.",
      },
      isTrue: false,
      weight: 0,
    },
  ],

  capabilityGaps: [
    {
      id: "gap-coding",
      title: { en: "Complex inpatient medical coding", ar: "الترميز الطبي لمطالبات التنويم المعقدة" },
      nature: "skill",
      population: { en: "38 processors hired in the last 9 months", ar: "٣٨ معالجًا عُيّنوا خلال آخر ٩ أشهر" },
      current: 2,
      required: 4,
    },
    {
      id: "gap-validation",
      title: { en: "Automated coverage-limit validation", ar: "التحقق الآلي من حدود التغطية" },
      nature: "technology",
      population: { en: "ClaimsOne platform", ar: "منصة «كليمز ون»" },
      current: 2,
      required: 5,
    },
    {
      id: "gap-quality-governance",
      title: { en: "Balanced performance and quality governance", ar: "حوكمة متوازنة للأداء والجودة" },
      nature: "governance",
      population: { en: "Claims Operations leadership", ar: "قيادة عمليات المطالبات" },
      current: 2,
      required: 4,
    },
  ],
};
