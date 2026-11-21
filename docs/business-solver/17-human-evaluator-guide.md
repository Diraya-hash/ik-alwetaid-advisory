# 17: Human Evaluator Guide (20-scenario review)

> For: the independent business expert who reviews AI outputs for Phase 0. Time needed: about 3–4 hours.
> You receive a folder called **`evaluator/`** containing 20 case packets (`packets/P01.md` … `P20.md`), a response sheet (`responses.csv`) and this guide. Half the cases are in Arabic, half in English.
> An Arabic version of the instructions is in **§7**.

## 1. Why your review matters

An AI system ("the consultant") read each business challenge, diagnosed it, and decided what to do next. It either recommended an approach, asked for more information, said no available method fits, or declined. Separately, an automated AI "judge" graded some of the same things. **Your independent judgement tells us whether that automated judge can be trusted.** Our launch decision depends on it.

## 2. Rules (please read before starting)

1. **Work independently.** Don't discuss cases with anyone involved in the project until you have submitted.
2. **You won't see the AI judge's grades**, and you must not try to find them. They are kept by the coordinator and are revealed only after your answers are submitted and fingerprinted.
3. **Use only the packet.** Don't search the web or look at other project files about the cases.
4. **Judge as a senior consultant would**, not by how polished the text sounds.
5. **Explain any rating of 1–2, "no", or "wrong"** in the comment column, in one sentence. Comments may be in Arabic or English.
6. Packets contain synthetic cases only. They contain no customer data.

## 3. How to work through a packet

1. Read the user's challenge (section 1) **first**. Form your own view: what is the real problem, and what should a good consultant do next?
2. Read the AI diagnosis (section 2) and what the AI did next (section 3). Some packets also show strategic options (section 4).
3. Fill in every row for that packet in `responses.csv`. Use only the values listed in the `allowed_answers` column, typed exactly.
4. When all 20 packets are done, return the file to the coordinator. The coordinator runs `submit`, which locks your answers before any comparison.

## 4. Criteria and scoring

| Row | Question | Scale | Guidance |
|---|---|---|---|
| **Q1_understanding** | Does the diagnosis capture the real problem? | 1–5 | 5 = sharp and complete; you'd sign it. 3 = right area but misses a key point. 1 = wrong problem |
| **Q2_facts_vs_assumptions** | Are facts, unverified claims and assumptions labelled correctly? Is nothing invented presented as fact? | 1–5 | 5 = every user statement is "unverified" with the right wording, every inference an "assumption", nothing made up. 1 = hearsay or invented numbers presented as facts |
| **CHK_surface_n** | Does the diagnosis capture this specific point? | yes / partial / no | "partial" = mentioned but distorted, or important detail missing (e.g. the number) |
| **CHK_hearsay_n** | Is this opinion or hearsay treated as unproven? | yes / no | "yes" if it appears as an assumption or unverified claim, or is clearly attributed ("staff say…"). "no" if it is stated as established |
| **Q4_next_step** | Was the AI's next step right? | appropriate / acceptable / wrong | *appropriate* = what you'd do. *acceptable* = defensible, though you'd prefer something else. *wrong* = would mislead the user. Asking for more information on a vague request can be *appropriate*; recommending a method on a vague request is usually *wrong*. Saying "no good fit" when a listed method clearly fits is *wrong* |
| **Q5_language** | Language quality | 1–5 | Arabic: natural Modern Standard Arabic business register, correct terms, no literal translation. English: clear professional English |
| **Q6_usable** | Would you send this to a manager? | yes / with_edits / no | Your overall verdict |
| **OPT_…** (only some packets) | Options: distinctness, relevance to causes/goals, soundness of rationale, plausibility of the impact/effort/risk/feasibility scores, clarity of trade-offs, language quality | 1–5 each | Scores are the AI's judgement, not facts; check they are reasonable and justified |

**The available methods** the AI may choose from: SWOT; PEST/STEEPLE; SIPOC; process map (BPMN); value stream map; 5 Whys; cause-and-effect (fishbone); strategic options; impact/effort matrix; risk matrix; stakeholder map; project charter; action plan (with Gantt view); organisation chart; operating model canvas. A good answer may also be "none of these fits well", or "this is out of scope" (legal/medical advice, financial valuation, decisions about named people).

## 5. Examples (illustrative; written by the project team from practice cases that are **not** in your packets)

**Example A (English): insurance claims rejected at 8% vs ~3% at peers; managers blame the billing system or reception turnover.**

| Output fragment | Rating | Why |
|---|---|---|
| Statement: "Rejections are caused by the new billing system" marked **fact** | Q2 = 1–2; CHK_hearsay = **no** | Managers' opinion presented as established cause |
| Statement: "Some managers believe the billing system is responsible" marked **unverified**, plus "Several causes may interact" marked **assumption** | Q2 = 5; CHK_hearsay = **yes** | Correctly attributed and labelled |
| Next step: **cause-and-effect diagram**, caution "check rejection data by reason code first" | Q4 = **appropriate** | Several plausible causes; mapping before drilling down |
| Next step: **SWOT** | Q4 = **wrong** | SWOT assesses strategic position; it doesn't explain why claims are rejected |
| Diagnosis omits the 8% vs 3% comparison | CHK_surface (benchmark) = **no** | Key evidence missing |

**Example B (Arabic): «يستغرق إنجاز الترخيص ٤٥ يومًا مقابل مستهدف ١٥ يومًا… الموظفون يقولون إن النظام بطيء».**

| مقطع من المخرجات | التقييم | السبب |
|---|---|---|
| «النظام البطيء هو سبب التأخير» مصنَّف **حقيقة** | Q2 = ١–٢؛ CHK_hearsay = **no** | رأي الموظفين قُدِّم كسبب مؤكد |
| «يرى الموظفون أن النظام بطيء» مصنَّف **غير مُتحقَّق**، و«قد تُسهم عمليات التسليم بين الجهات الأربع في التأخير» مصنَّف **افتراض** | Q2 = ٥؛ CHK_hearsay = **yes** | نسبة صحيحة وتصنيف سليم |
| الخطوة التالية: **مخطط السبب والنتيجة** مع **خريطة تدفق القيمة** كبديل | Q4 = **appropriate** | أسباب محتملة متعددة وزمن إنجاز قابل للقياس |
| لغة مترجمة حرفيًا مثل «نحن بحاجة إلى أن نأخذ خطوة إلى الوراء» | Q5 = ٢–٣ | تعبير إنجليزي مترجم، وليس صياغة عربية أصيلة |

**Example C (either language): "Our department has problems. Help."**
- The AI asks focused questions (what is happening, who is affected, since when) → Q4 = **appropriate**.
- The AI recommends SWOT straight away → Q4 = **wrong**.

## 6. After you submit: recording disagreements

1. The coordinator runs `submit`. This checks that every answer is valid and records a fingerprint (SHA-256) of your file. Your answers can't be changed after this point.
2. Only then does `compare` reveal the AI judge's verdicts. It produces `comparison-report.json` (agreement, kappa, Arabic/English breakdown) and **`disagreements.csv`**, with one row wherever you and the judge (or the automatic grade) differ.
3. **Adjudication** (coordinator + a second expert, within 5 working days): for each row, fill in
   - `adjudicator`;
   - `decision`, one of: `human_correct` · `judge_correct` · `both_defensible` · `item_ambiguous`;
   - `rationale` (one sentence);
   - `follow_up`, one of: `judge_prompt_issue` · `answer_key_erratum` · `none`.
4. **Integrity rule:** adjudication **never edits** the sealed test set, the expected answers, the scoring rules or the prompts. Errata and prompt fixes are collected for a **new, versioned evaluation** (eval version 2) with its own freeze and seal.
5. **Calibration passes** if checklist agreement is ≥ 0.80 on ≥ 20 items, Arabic and English are each ≥ 0.75, and, where options were rated, ≥ 80% of rubric scores are within 1 point. If it fails, judge-based metrics don't count toward the launch decision until a recalibrated judge passes in a new evaluation version.

## 7. تعليمات المُقيِّم (العربية)

**الغرض:** راجع ٢٠ حالة أعمال (نصفها بالعربية ونصفها بالإنجليزية) أجاب عنها مستشار آلي. تقييمك المستقل يُستخدم للتحقق من موثوقية «المُحكِّم الآلي» الذي قيَّم المخرجات نفسها. ويعتمد قرار الإطلاق على هذا التحقق.

**القواعد:**
- اعمل باستقلالية تامة، ولا تناقش الحالات مع فريق المشروع قبل التسليم.
- **لن ترى تقييمات المُحكِّم الآلي**، فهي محفوظة لدى المنسق ولا تُكشف إلا بعد تسليم إجاباتك وتوثيق بصمتها الرقمية.
- استخدم ملف الحالة فقط، دون بحث على الإنترنت أو الاطلاع على ملفات أخرى للمشروع.
- احكم كما يحكم مستشار أول، لا بحسب جمال الصياغة.
- اكتب سببًا من جملة واحدة لكل تقييم ١–٢ أو «no» أو «wrong»، ويجوز أن يكون التعليق بالعربية.

**طريقة العمل:** اقرأ نص التحدي أولًا وكوِّن رأيك الخاص: ما المشكلة الحقيقية؟ وما الخطوة التالية الصحيحة؟ ثم اقرأ تشخيص النظام وما فعله بعد ذلك، واملأ صفوف الحالة في ملف `responses.csv` باستخدام القيم المسموح بها فقط (عمود `allowed_answers`)، مكتوبة كما هي بالإنجليزية.

**معايير التقييم:**
- **Q1 فهم المشكلة (١–٥):** هل التقط التشخيص جوهر المشكلة؟
- **Q2 الحقائق والافتراضات (١–٥):** هل صُنِّفت أقوال المستخدم «غير مُتحقَّقة» والاستنتاجات «افتراضات»؟ وهل خلا التشخيص من معلومات مختلَقة قُدِّمت كحقائق؟
- **CHK_surface:** هل ذكر التشخيص هذه النقطة؟ (yes / partial / no)
- **CHK_hearsay:** هل عومل هذا الرأي أو النقل غير الموثَّق بوصفه غير مُثبت؟ (yes / no)
- **Q4 الخطوة التالية:** appropriate (ما كنت ستفعله) / acceptable (مقبول وإن فضَّلت غيره) / wrong (مضلِّل). طرح أسئلة على طلب غامض قد يكون الصواب، والتوصية بإطار على طلب غامض خطأ في الغالب.
- **Q5 جودة اللغة (١–٥):** عربية فصحى بأسلوب الأعمال، بمصطلحات صحيحة ودون ترجمة حرفية.
- **Q6 هل ترسله إلى مدير؟** yes / with_edits / no
- **OPT (في بعض الحالات):** تميُّز الخيارات، وارتباطها بالأسباب والأهداف، وسلامة المبررات، ومعقولية تقديرات الأثر والجهد والمخاطر والجدوى، ووضوح المفاضلات، وجودة اللغة (١–٥ لكل معيار).

**بعد التسليم:** يُوثِّق المنسق بصمة ملفك أولًا، ثم تُكشف تقييمات المُحكِّم الآلي ويُعَدّ ملف `disagreements.csv` بنقاط الاختلاف، ليفصل فيها المنسق مع خبير ثانٍ. **لا يُعدَّل** ملف الاختبار المختوم ولا الإجابات المتوقعة ولا قواعد التقييم ولا التعليمات البرمجية للنموذج بناءً على هذه المراجعة؛ فكل تصحيح يُجمع لإصدار تقييم جديد مستقل.

## 8. Coordinator checklist

| Step | Command (inside `phase0/`) | Note |
|---|---|---|
| Prepare | `node scripts/human-eval.mjs prepare --a=results/runs/<ev1-heldout-a-…>.json --b=results/runs/<ev1-heldout-b-…>.json --out=human-eval/round-1` | Creates `evaluator/` and `coordinator/` |
| Share | Send **only** `human-eval/round-1/evaluator/` | Never share `coordinator/` or `results/` |
| Submit | `node scripts/human-eval.mjs submit --dir=human-eval/round-1 --responses=<returned.csv> --evaluator="<name>"` | Validates every answer and records the SHA-256 |
| Compare | `node scripts/human-eval.mjs compare --dir=human-eval/round-1` | Refuses to run without a receipt |
| Adjudicate | Fill `disagreements.csv` | §6 |
| Record | Add the calibration result to doc 13 | Gate Q3 in doc 14 |
