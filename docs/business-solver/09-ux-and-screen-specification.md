# 09: UX & Screen Specification

> **v0.2** (2026-11-19). New document. Resolves review finding H12 and implements decisions D2 (information model in the UI), D3 (Critic UX), D4 (Strategic Options, No Good Fit), draft-first, Gantt-as-view, Problem-Solving Summary and export language.
> Scope: information architecture, screen-by-screen journeys and wireframe descriptions, interaction rules, empty/loading/error states, responsive behaviour, the bilingual design system, and export consistency.
> **Arabic is the design-first language.** Wireframes below are drawn in Arabic (RTL) orientation unless marked otherwise. English is the mirror.

---

## 1. UX principles

| # | Principle | What it means in practice |
|---|---|---|
| U1 | **A consultant, not a tool** | The product talks first, restates the problem, asks few sharp questions, and proposes a draft. Controls appear when needed, not all at once |
| U2 | **Draft first, refine second** | After an approach is chosen, the user sees a complete first draft in seconds (Consultant mode). Step-by-step (Workshop mode) is one click away |
| U3 | **Honest about certainty** | Every statement shows whether it is verified, unverified or an assumption, and whether AI wrote it. Labels are calm and consistent, never decorative |
| U4 | **Never a dead end** | Every screen offers a next best action. AI failure always has a manual path. "No Good Fit" offers paths, not an apology |
| U5 | **The user is in charge** | AI and Critic propose; the user decides. Nothing the user approved changes without their action |
| U6 | **Arabic-native craft** | Layout, typography, numbers, dates and diagrams are designed in Arabic first and are equally polished in English |
| U7 | **Board-ready by default** | What you see is what you export: same geometry, labels and language |
| U8 | **Progressive disclosure** | Details (history, evidence, metadata, low-severity findings) are one click away, never in the way |

---

## 2. Information architecture

```
Business Problem Solver
├── Home                                   /[locale]
│   ├── New challenge (composer)
│   ├── Recent projects
│   └── Example challenges
├── Projects                               /[locale]/projects
│   └── Project workspace                  /[locale]/p/[projectId]
│       ├── Problem (challenge + diagnosis)        …/problem
│       ├── Approach (recommendations)             …/approach
│       ├── Analysis (framework instances)         …/a/[instanceId]?view=&mode=
│       ├── Options                                 …/options/[optionSetId]
│       ├── Plan (Action Plan ⇄ Gantt)             …/a/[actionPlanId]?view=gantt
│       ├── Review (Consultant Review)              …/review
│       ├── Summary & Export                        …/summary
│       ├── Evidence                                …/evidence
│       └── History                                 …/history
├── Library (frameworks & capability)      /[locale]/library  ·  /[locale]/library/[frameworkId]
├── Settings                               /[locale]/settings/{profile,organisation,language-region,privacy}
├── Plan & usage                           /[locale]/settings/plan
└── Shared view (read-only)                /[locale]/s/[shareToken]
```

**Navigation model**
- **Global header:** logo · Projects · Library · language switch (ع / EN) · help · account. A "New challenge" primary button is always present.
- **Inside a project:** the **Journey Rail** (§4.2) replaces the global navigation for that project. The global header is condensed.
- **URL holds the locale**; switching UI language keeps the route. **Content language** belongs to the project, set independently of the UI language.

---

## 3. Screen inventory

| ID | Screen | Primary persona task | Phase |
|---|---|---|---|
| S01 | Sign in | Get in with no password friction | Beta-1 |
| S02 | Onboarding (3 steps) | Set language, role, country/workweek; read the data notice | Beta-1 |
| S03 | Home & composer | Describe a challenge; resume work | Beta-1 |
| S04 | Projects list | Find and manage projects | Beta-1 |
| S05 | Project workspace shell | Orientation inside a project | Beta-1 |
| S06 | Problem: Diagnosis (+ clarify) | Confirm what the problem really is | Beta-1 |
| S07 | Approach: Recommendations / No Good Fit | Choose how to tackle it | Beta-1 |
| S08 | Analysis: Consultant mode | Review an AI-drafted framework | Beta-1 |
| S09 | Analysis: Workshop mode | Build a framework step by step | Beta-1 |
| S10 | Strategic Options | Compare courses of action and decide | Beta-1 |
| S11 | Plan: Action Plan ⇄ Gantt | Assign owners, dates, dependencies | Beta-1 (table) · Beta-2 (Gantt) |
| S12 | Consultant Review (project critic) | Fix gaps before sharing | Beta-2 |
| S13 | Problem-Solving Summary | Read and edit the one-page synthesis | Beta-2 |
| S14 | Export dialog & Deliverables | Produce PPTX / PDF / images | Beta-1 (PDF/PNG) · Beta-2 (PPTX, language) |
| S15 | History & compare | See, compare, restore versions | Beta-1 |
| S16 | Evidence | Upload and cite documents | Beta-2 |
| S17 | Library & framework detail | Learn about and start a framework | Beta-1 |
| S18 | Settings | Language, numerals, calendar, workweek, privacy | Beta-1 |
| S19 | Plan & usage | See limits and usage; manage subscription | GA |
| S20 | Shared view | Read and comment without editing | Beta-2 |

---

## 4. Global layout & shell

### 4.1 App shell (desktop ≥ 1280 px, RTL)

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ [الشعار] حل مشكلات الأعمال     المشاريع   المكتبة      [+ تحدٍّ جديد]   ع|EN   ؟   (حسابي) │  ← header 64px
├───────────────┬────────────────────────────────────────────────────────┬──────────────────┤
│ مسار الحل     │                                                        │  المستشار        │
│ (Journey Rail)│                MAIN CANVAS / CONTENT                   │  (Consultant     │
│ 248px         │                (fluid)                                 │   panel, 360px,  │
│ ● المشكلة      │                                                        │   collapsible)   │
│ ● النهج        │                                                        │  tabs:           │
│ ◐ التحليل      │                                                        │  محادثة | مراجعة │
│   └ عظمة السمكة│                                                        │  | التفاصيل      │
│   └ لماذا ×5   │                                                        │                  │
│ ○ الخيارات     │                                                        │                  │
│ ○ الخطة        │                                                        │                  │
│ ○ المراجعة     │                                                        │                  │
│ ○ الملخص       │                                                        │                  │
└───────────────┴────────────────────────────────────────────────────────┴──────────────────┘
```
In LTR the rail sits on the left and the Consultant panel on the right, mirrored by logical properties (`inline-start` / `inline-end`).

### 4.2 Journey Rail

- **Items:** Problem · Approach · Analysis (with chained instances nested) · Options · Plan · Review · Summary & Export. Evidence and History are reached from the rail footer.
- **Item states:** `○ not started` · `◐ in progress` · `● done` · `⚠ needs attention` (stale upstream, open Critical/High findings) · `🔒 not yet available` (shown as muted text, never blocking; clicking explains what's needed).
- **Behaviour:** guidance, not a gate. Users can open any started item. The **next best action** appears at the rail bottom as a primary button ("Generate options for the top 3 causes").
- **Counts:** small badges show open findings (severity colour) and assumptions awaiting verification.

### 4.3 Consultant panel (inline-end side)

| Tab | Content |
|---|---|
| **Conversation** | Chat with the consultant, scoped to the current screen. Requests ("make the risks more specific to procurement") create **new versions**, never silent overwrites. Each AI reply that changed content shows a diff chip "Updated 3 items · View". |
| **Review** | Critic findings for the current screen (item and framework level), grouped by severity (§5.10) |
| **Details** | The Inspector for the selected item (§5.7): truth status, origin, authorship, evidence, history |

The panel collapses to a 48 px icon strip; its state is remembered per user.

---

## 5. Screen specifications

Each screen lists **Purpose · Entry/Exit · Wireframe · Components · Interaction rules · States · Responsive · Events**.

### S01 · Sign in
- **Purpose:** low-friction access. **Entry:** landing, invite link. **Exit:** S02 (first time) or S03.
- **Wireframe:** centred card: product name, one-line promise, "Continue with Microsoft", "Continue with Google", email field + "Send sign-in link". Language toggle in the corner. Privacy and terms links.
- **Rules:** the magic link expires in 15 min and is single-use. The email field is always LTR, even in the Arabic UI.
- **States:** link sent ("Check your inbox at …", resend after 60 s); expired link; SSO error (with a retry and support link).
- **Responsive:** single column at all sizes.

### S02 · Onboarding (3 steps, skippable after step 1)
1. **Language:** UI language (العربية / English) and default content language. Numerals: Western (123) / Arabic-Indic (١٢٣). Calendar: Gregorian / Umm al-Qura / both.
2. **About you:** role chips (Manager · Consultant · PMO/Excellence · Business owner · Other), organisation size, **country**. The workweek defaults from the country (KSA Sun–Thu; UAE Mon–Fri) and is editable.
3. **Your data:** a short notice about confidentiality and classified data, the AI disclosure, and the PII mode explained. "Got it".
- **States:** each step validates inline; "Skip" (steps 2–3) applies defaults.

### S03 · Home & composer

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                ما التحدي الذي تواجهه؟                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐    │
│  │ صِف التحدي بكلماتك… ماذا يحدث؟ منذ متى؟ ما أثره؟                     │    │
│  │                                                                      │    │
│  │ [📎 إرفاق]                         لغة المحتوى: العربية ▾   [ابدأ ←] │    │
│  └──────────────────────────────────────────────────────────────────────┘    │
│  أمثلة: [زمن إنجاز المعاملات طويل] [إطلاق مبادرة جديدة] [مقاومة نظام جديد] … │
│                                                                              │
│  مشاريعك الأخيرة                                               عرض الكل ←   │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐                                │
│  │ عنوان       │ │ …          │ │ …          │   card: title, stage chip,    │
│  │ ◐ التحليل   │ │            │ │            │   last edited, open findings  │
│  └────────────┘ └────────────┘ └────────────┘                                │
└──────────────────────────────────────────────────────────────────────────────┘
```
- **Composer rules:** grows to 12 lines then scrolls; Enter = new line; Ctrl/⌘+Enter = start. A soft hint under 20 words: "A bit more detail helps: what happens, how often, who is affected." It never blocks: "Start anyway" is available. Language is auto-detected and shown as a chip (editable). Attachments: drag-drop or button; type/size validated immediately.
- **PII nudge:** if a likely personal name or ID is detected, an inline amber note appears: "This looks like personal data. Consider using a role instead ('a finance officer')." Actions: [Replace] [Keep]. In redact/block org modes the behaviour follows policy (06 §5).
- **Examples:** 6 chips relevant to the persona and GCC context. Clicking fills the composer (editable), never auto-submits.
- **States:** *First use* shows the example gallery larger and no "recent projects". *Loading recent projects* shows 3 skeleton cards. *Attachment error* shows an inline row error with the reason (size, type, scan failed).
- **Events:** `composer_started`, `challenge_submitted {words, lang, attachments}`.

### S04 · Projects list
- Table/grid toggle. Columns: title, stage (rail state), frameworks used (icons), open findings, last edited, owner. Filters: stage, framework, category, date. Search (Arabic-normalised: أ/إ/آ → ا, ة/ه, ى/ي).
- Row actions: open, rename, duplicate (Teams), archive, delete (soft, 30-day restore).
- **Empty:** "No projects yet. Describe your first challenge." [New challenge]. **No results:** "No projects match these filters." [Clear filters].

### S05 · Project workspace shell
- See §4. Project title is editable inline in the condensed header, with the content language chip, the share button (Beta-2) and the export button (always visible, opens S14).
- **Stale banner** (when upstream changed): "The diagnosis changed after this analysis was created. [Review differences] [Keep as is]".

### S06 · Problem: Diagnosis (+ clarifying questions)

**Purpose:** confirm the real problem before choosing an approach.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ المشكلة كما فهمناها                                    كفاية السياق ▓▓▓▓▓▓░░ 72% │
│ ┌───────────────────────────────────────────────────────────────────────────┐ │
│ │ «يستغرق إنجاز طلبات التراخيص ٤٥ يومًا مقابل مستهدف ١٥ يومًا…»             │ │
│ │  [غير مُتحقَّق · من إدخالك]                                    ✎  ⋯      │ │
│ └───────────────────────────────────────────────────────────────────────────┘ │
│ إعادة الصياغة المقترحة: «كيف نخفض زمن إنجاز التراخيص إلى ١٥ يومًا…»          │
│  [افتراض · اقتراح ذكاء اصطناعي]   [قبول] [تعديل] [رفض]                        │
│                                                                               │
│ ┌ الأعراض ───────────┐ ┌ الأسباب المحتملة ───┐ ┌ الأهداف والقيود ─────────┐  │
│ │ • … [غير مُتحقَّق]   │ │ • بطء النظام [افتراض]│ │ • … [غير مُتحقَّق]          │  │
│ │ • …                 │ │ • … [افتراض · AI]   │ │ • …                       │  │
│ └────────────────────┘ └─────────────────────┘ └───────────────────────────┘  │
│ ┌ أصحاب المصلحة ─────┐ ┌ ما زلنا لا نعرف ──────────────────────────────────┐  │
│ │ …                  │ │ • من الأكثر تأثرًا؟  لماذا يهم: …                  │  │
│ └────────────────────┘ └───────────────────────────────────────────────────┘  │
│ التصنيف: العمليات › الأداء (عالٍ) · المرحلة: البحث عن السبب الجذري · النطاق: إدارة │
│                                                                               │
│ ┌ سؤالان سيساعدانني على اختيار النهج الأنسب ─────────────────────────────────┐│
│ │ ١) هل لديك قائمة بحلول محتملة؟  [نعم] [لا] [غير متأكد]   ⓘ لماذا أسأل؟     ││
│ │ ٢) ما الجهات المشاركة في الإجراء؟  [__________]                            ││
│ │                                         [تخطَّ]  [إرسال الإجابات]          ││
│ └───────────────────────────────────────────────────────────────────────────┘│
│                                              [اختر النهج ←] (enabled at gate) │
└───────────────────────────────────────────────────────────────────────────────┘
```

- **Streaming:** sections fill progressively as the diagnosis streams: reframed problem first (≤ 3 s), then symptoms/causes, then classification. Skeleton lines show for pending sections. A subtle status line reads "Analysing your challenge…".
- **Sufficiency meter:** 0–100 % with a 3-segment colour (low / OK / good). Clicking opens the breakdown by slot ("Missing: who is affected · how often"). The meter text comes from slots, not the model.
- **Clarifying questions:** 1–4 per round, max 2 rounds. Answer widgets come from the Slot Registry (chips, short text, number). Each has "Why I'm asking" (tooltip/sheet). "Skip" stores the skip so the question isn't asked again.
- **Gate:** "Choose an approach" is enabled when the gate passes. Otherwise it reads "Choose an approach anyway" with a confirmation dialog listing the assumptions that will be relied on.
- **Editing:** every statement is editable inline; changes are labelled per §8.4. Editing marks downstream items stale (S05 banner). A "Re-run diagnosis" action is available after edits.
- **States:**

| State | Presentation |
|---|---|
| Streaming | Progressive fill, skeletons, cancel link |
| Partial (one section failed validation and repaired) | Section shows "Refined automatically", no error |
| Repair failed | Card with "We couldn't complete the diagnosis automatically." [Try again] [Fill in manually] (manual form pre-filled with valid parts) |
| Model refusal / out of scope | Neutral card explaining the limit, plus the business-side alternative ("I can't advise on the legal interpretation, but I can help you assess compliance risk") |
| Network lost | Inline banner "Connection lost. Reconnecting…"; the SSE stream resumes from the last event |

- **Responsive:** sections stack to one column below 1024 px; questions become a bottom sheet on mobile.
- **Events:** `diagnosis_viewed`, `statement_edited`, `clarify_answered {slot}`, `gate_override`.

### S07 · Approach: Recommendations, No Good Fit, insufficient context

**Default (status `ok`):**
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ النهج المقترح                                                                  │
│ ┌─ ١ ───────────────────────────── ملاءمة عالية ─┐ ┌─ ٢ ──── ملاءمة متوسطة ─┐  │
│ │ مخطط السبب والنتيجة                             │ │ تحليل «لماذا» الخماسي  │  │
│ │ لماذا يناسبك:                                   │ │ …                      │  │
│ │ • توجد أسباب محتملة متعددة (من التشخيص ↗)       │ │                        │  │
│ │ • تشكّ في السبب الظاهر (من إدخالك ↗)            │ │                        │  │
│ │ ما ستحصل عليه: …        المدة: ~٢٠ دقيقة        │ │                        │  │
│ │ تنبيه: …                                        │ │                        │  │
│ │                         [ابدأ بهذا النهج]       │ │ [اختيار]               │  │
│ └─────────────────────────────────────────────────┘ └────────────────────────┘  │
│ المسار المقترح: السبب والنتيجة ← لماذا×٥ ← الخيارات ← الأثر/الجهد ← خطة العمل  │
│ [اعتماد المسار كاملًا]                                                          │
│ ▸ لماذا لم نقترح SWOT؟  «SWOT يصف موقعك، وسؤالك عن سبب الأخطاء.»               │
│ هل تريد اختيار نهج آخر؟ [تصفح المكتبة]                                          │
└────────────────────────────────────────────────────────────────────────────────┘
```
- Cards: rank, name, **fit band** (High/Medium/Low as text plus a colour bar, never a percentage), "Why it fits" bullets with links (↗) that highlight the source statement in S06, what you'll get, typical time, caution. A Strategic Options card uses the same layout with a "capability" tag.
- **Chain:** a horizontal sequence (RTL order in Arabic). "Adopt the whole path" creates the planned instances in the rail (not started).
- **Feedback:** 👍/👎 on each card; 👎 opens reason chips.

**No Good Fit (status `no_good_fit`):**
```
┌────────────────────────────────────────────────────────────────────────────────┐
│ لا يوجد إطار مناسب بدرجة كافية لهذه المشكلة                                    │
│ لماذا: «مشكلتك تتعلق بتجربة العملاء عبر القنوات، ولا يغطيها أي من الأطر الحالية│
│ بشكل جيد.»                                                                      │
│ الأقرب (مع القيود):                                                             │
│ • SIPOC: يوضح حدود العملية، لكنه لا يصف تجربة العميل.                          │
│ ماذا يمكنك أن تفعل:                                                             │
│ [توليد خيارات استراتيجية مباشرة]  [تصفح المكتبة]  [إعادة صياغة المشكلة]        │
│ ✓ سجّلنا هذه الحاجة لتطوير أطر جديدة.                                           │
└────────────────────────────────────────────────────────────────────────────────┘
```
- **Never** shows a "Recommended" card. Tone: confident and helpful, not apologetic.

**Insufficient context:** the S06 questions are shown inline with "I need a little more information before recommending an approach."

- **Events:** `approach_shown {status}`, `approach_selected {rank}`, `chain_adopted`, `no_good_fit_path {path}`, `recommendation_feedback`.

### S08 · Analysis: Consultant mode (default)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ مخطط السبب والنتيجة   [وضع المستشار ● | وضع الورشة ○]   عرض: [المخطط|الجدول]  ⋯ ↥ تصدير │
│ ┌ شريط المراجعة ────────────────────────────────────────────────────────────────────┐ │
│ │ أعددتُ مسودة كاملة: ١٨ عنصرًا · ١٢ بانتظار مراجعتك · ٥ افتراضات · ملاحظتان (عالية) │ │
│ │ [مراجعة العناصر واحدًا تلو الآخر]  [قبول الكل]  [عرض الملاحظات]                    │ │
│ └───────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────── CANVAS ───────────────────────────────────────────┐ │
│ │      (fishbone, head at inline-start in RTL: problem box at the left edge)        │ │
│ │  items carry compact trust markers: ◆ verified  ◇ unverified  △ assumption  ✦ AI   │ │
│ └───────────────────────────────────────────────────────────────────────────────────┘ │
│ zoom − 100% +   ⤢ fit   ☰ table view   ◐ trust overlay                                │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
- **Draft generation:** after selection, the canvas renders a skeleton of the framework's shape, then streams items in by group. Generation can be cancelled. Typical ≤ 30 s (p90).
- **Review strip:** counts of pending AI items, assumptions and findings. "Review one by one" steps through items in reading order, focusing each with the Inspector open: [Accept] [Edit] [Reject] [Challenge] [Skip]. Keyboard: A / E / R / C / → (next in reading direction).
- **Bulk accept:** accepts AI items as part of the analysis. **It does not verify them.** A confirmation tooltip on first use says so.
- **Canvas editing:** double-click to edit text inline; Enter commits; Esc cancels; Tab moves to the next item. Adding: "+" affordances at the end of lists/branches. Deleting: Delete key with an undo toast (10 s).
- **Table view:** every visual has an equivalent table (accessible, sortable), which is also the mobile default.
- **Mode switch:** switching to Workshop keeps all content; steps already covered show as done.
- **States:** *Generating* (skeleton shape + streaming); *Partially generated* (one group failed: inline "Couldn't draft this section. [Retry] [Fill in manually]"); *Empty manual* (shape with placeholders: "Add your first category"); *Stale upstream* (banner); *Conflict* (another tab saved first: "This analysis changed elsewhere. [Review & merge]").

### S09 · Analysis: Workshop mode

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ① حدد المشكلة ✓ ── ② اسأل «لماذا؟» ● ── ③ أكّد السبب الجذري ○ ── ④ إجراءات ○     │
├───────────────────────────────┬──────────────────────────────────────────────────┤
│ الخطوة ٢: اسأل «لماذا؟»        │  LIVE PREVIEW (canvas)                           │
│ إرشاد: …                      │                                                  │
│ نصائح: …                      │                                                  │
│ [اقترح لي]  (AI prefill)      │                                                  │
│ ┌ لماذا ١ ─────────────────┐  │                                                  │
│ │ …                        │  │                                                  │
│ └──────────────────────────┘  │                                                  │
│ [+ أضف «لماذا» أخرى]          │                                                  │
│ ⚠ ملاحظة: إجابتان متشابهتان    │                                                  │
│            [السابق] [التالي]   │                                                  │
└───────────────────────────────┴──────────────────────────────────────────────────┘
```
- Step instructions and tips are platform-authored (AR/EN). "Suggest for me" pre-fills only this step.
- Validation messages (deterministic) show under fields; Critic findings show in the panel's Review tab.
- "Next" is enabled when required fields are valid. Optional steps have "Skip".
- **Facilitation option:** "Present mode" hides the editing chrome for screen-sharing in workshops (Teams phase).

### S10 · Strategic Options

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ الخيارات الاستراتيجية                         المعايير والأوزان ⚙   عرض: [جدول|مصفوفة] │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ الخيار                    │ الأثر │ الجهد │ المخاطر │ الجدوى │ الدرجة │ القرار    │ │
│ │ ★ ٢. أتمتة التحقق المسبق   │ ٤ ⓘ  │ ٢ ⓘ  │ ٢ ⓘ    │ ٤ ⓘ   │ ٣٫٧   │ [قبول][رفض]│ │
│ │ ٣. إعادة توزيع الصلاحيات   │ ٤    │ ٣    │ ٣      │ ٣     │ ٣٫٤   │ …         │ │
│ │ ١. الاستمرار كما هو (أساس) │ ١    │ ١    │ ٢      │ ٥     │ ٢٫٢   │ …         │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│ التوصية: الخيار ٢ (اقتراح ذكاء اصطناعي)                                               │
│ لماذا: …   المفاضلات: …   اختر الخيار ٣ إذا: …                                         │
│ الافتراضات التي تعتمد عليها التوصية: △ … [تحقّق]  △ … [تحقّق]                          │
│ [+ أضف خيارًا]  [أعد التقييم]                    [اعتماد الخيار المختار ← خطة العمل]   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
- **Rows expand** to show the description, rationale (linked to causes/goals ↗), assumptions, dependencies and time-to-value.
- **ⓘ on a score** shows its basis and linked assumptions. Scores are editable by the user. An edited score is marked "your assessment".
- **Weights dialog:** four sliders that sum to 100 %, with a live re-rank (computed in code; no AI call). "Reset to defaults".
- **Too close to call:** when the top two differ by < 0.3, the recommendation block reads "Options 2 and 3 are close; your choice depends on …" and no star is shown.
- **Decide:** Accept / Reject / Defer per option. Accepting ≥ 1 option enables "Continue to Action Plan" (or "Prioritise with Impact/Effort" when ≥ 4 are accepted).
- **Matrix view:** impact × effort scatter of the options (same data).
- **States:** *Generating* (rows stream in); *Inputs thin* (banner: "Options will be stronger after a root-cause step. [Run Cause & Effect first] [Continue anyway]"); *All rejected* ("None of these fit? [Generate different options] [Add your own]").

### S11 · Plan: Action Plan ⇄ Gantt view (same data)

**Table view (default):** columns: action · linked to (cause/option ↗) · owner · start · end · status · dependencies. Inline editing; owners from a free-text list (or stakeholder list via port). Rows can be grouped by option or workstream.

**Gantt view:**
```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ خطة العمل    عرض: [جدول | جانت ●]     المقياس: [أسبوع|شهر]   التقويم: ميلادي/هجري    │
├───────────────────┬──────────────────────────────────────────────────────────────────┤
│ الإجراء            │ ← time flows right-to-left in RTL                               │
│ ١. …               │                       ██████████                                 │
│ ٢. …               │           ████████  ← dependency connector                       │
│ ◆ معلم: …          │       ◆                                                          │
├───────────────────┴──────────────────────────────────────────────────────────────────┤
│ بلا تواريخ (٣):  [… ] [… ] [… ]   ← drag onto the timeline to schedule              │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
- Drag bar = move dates; drag the bar edge = change duration; drag from the dependency handle = create a dependency. Non-working days (org workweek) are shaded. Dual calendar headers are optional.
- **Rule:** the table and the Gantt are the same data; any edit appears in both instantly. Selecting "Gantt Chart" from the library opens this view.
- **Validation:** end before start, dependency cycles and owner missing are Item-level Critic findings (deterministic).

### S12 · Consultant Review (project-level Critic)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ مراجعة المستشار قبل التصدير                         آخر مراجعة: قبل دقيقتين [إعادة] │
│ الاتساق: المشكلة ← التشخيص ← الأطر ← النتائج ← التوصيات ← الخطة   ●●●●◐○             │
│ ┌ حرجة (١) ─────────────────────────────────────────────────────────────────────────┐ │
│ │ ● الإجراء «…» لا يرتبط بأي سبب أو خيار معتمد.                                     │ │
│ │   لماذا يهم: …                                                                   │ │
│ │   التصحيح المقترح: ربطه بالخيار ٢ أو حذفه.     [قبول التصحيح] [رفض] [تجاهل] [اذهب ↗]│ │
│ └───────────────────────────────────────────────────────────────────────────────────┘ │
│ ▸ عالية (٣)   ▸ متوسطة (٥)   ▸ منخفضة (٢)                                           │
│ سجل الافتراضات: ٤ افتراضات تعتمد عليها التوصيات  [عرض]                              │
│ بيانات متقادمة: تحليل «لماذا» يعتمد على نسخة أقدم من مخطط السبب والنتيجة  [مراجعة]   │
│                                                     [متابعة إلى الملخص والتصدير ←]   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
- **Finding card:** severity, title, explanation (*why it matters*), suggested correction, actions **Accept correction · Reject (reason) · Dismiss · Go to item**. Accept applies the correction as *your* change (the history shows "Applied critic suggestion"). Corrections that need a decision ("verify this assumption") open the relevant dialog instead of applying anything.
- **Alignment strip:** six dots for the chain problem → … → plan. Each dot's state comes from the project-level findings in that segment.
- **Continue with Critical findings open:** opens an acknowledgement dialog listing them, with a checkbox "I understand these issues remain"; the acknowledgement is recorded in the export manifest.
- **History:** a "Review history" link shows past runs with counts and how each finding ended (accepted/rejected/dismissed/resolved).
- **States:** *Running* (progress with the segment being checked); *Clean* ("No issues found. Your analysis is consistent from problem to plan." ✓); *Failed* ("The review couldn't run. [Retry] [Continue without review]"; continuing is recorded in the manifest).

### S13 · Problem-Solving Summary

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ ملخص حل المشكلة                                       [تحرير] [إعادة التوليد]  ↥ تصدير│
│ ١. التحدي الأصلي        «…»                                                          │
│ ٢. التشخيص              …                                                            │
│ ٣. المنهجية المختارة     السبب والنتيجة ← لماذا×٥ ← الخيارات ← خطة العمل               │
│ ٤. أهم النتائج           • … ◆   • … △                                               │
│ ٥. التوصية               الخيار ٢: … (لماذا، المفاضلات)                               │
│ ٦. خارطة التنفيذ         ٥ إجراءات · ٣ أشهر · أول معلم: …                             │
│ ٧. افتراضات مفتوحة       ٤ (٢ تعتمد عليها التوصية)                                     │
│ ٨. حالة المراجعة         ٩ ملاحظات عولجت · ١ مُقرّة                                    │
└──────────────────────────────────────────────────────────────────────────────────────┘
```
- Generated from existing statements only. Every line links ↗ to its source. Statements keep their trust markers.
- Editable like any artifact; edits are user-authored. "Regenerate" creates a new version and shows a diff before replacing.
- **Empty/early state:** sections without upstream content show "Not yet done: [Go to Options]".

### S14 · Export dialog & Deliverables

```
┌ تصدير ───────────────────────────────────────────────────────────────┐
│ الصيغة:   (●) عرض تقديمي PowerPoint  ( ) تقرير PDF  ( ) صورة PNG/SVG │
│ اللغة:    (●) لغة العمل الأصلية (العربية)  ( ) العربية  ( ) الإنجليزية │
│           ⓘ التصدير بلغة أخرى ينشئ نسخة مترجمة يمكنك مراجعتها        │
│ المحتوى:  ☑ ملخص حل المشكلة  ☑ مخطط السبب والنتيجة  ☑ الخيارات       │
│           ☑ خطة العمل (☐ جدول  ☑ جانت)  ☑ سجل الافتراضات  ☑ الأدلة    │
│ وسوم الحالة: (●) مختصرة  ( ) كاملة  ( ) في الملحق فقط                 │
│ الخط:     (●) خط المنصة  ( ) خط النظام (توافق أعلى)                    │
│ إفصاح الذكاء الاصطناعي: ☑                                              │
│ المراجعة: ✓ لا ملاحظات حرجة مفتوحة                                     │
│                                         [إلغاء]  [تصدير]               │
└──────────────────────────────────────────────────────────────────────┘
```
- **Language rules (D7):** "Original working language" exports as-is. Choosing the other language triggers translation, with a progress step "Preparing translated version…". Afterwards a banner offers "Review translation" before downloading. The export carries "Translated, not yet reviewed" in the manifest and, if the org enables it, in the footer, until a user reviews it.
- **Pre-export review:** the dialog shows the Consultant Review status. If it is not current, it runs automatically (S12 states). Critical findings require the acknowledgement step.
- **Deliverables list** (inside S14 and in the project): file name, format, language, created, version pins, status (queued / rendering / ready / failed / expired link), download, regenerate.
- **States:** *Rendering* (progress: compose → layout → render → package); *Failed* ("Export failed at layout. [Retry] [Export as PDF instead]"); *Ready* (toast with "Download" and "Open folder").

### S15 · History & compare
- **Version timeline** per artifact: checkpoint entries with reason icons (AI run, step complete, critic accept, restore, translation), author, time.
- **Compare:** pick two versions; side-by-side canvas with highlighted changes, plus a list diff of statements (added / removed / text changed / **truth status changed**, in emphasis).
- **Restore:** creates a new version ("Restored from v7"); confirmation dialog.
- **Statement history** (from the Inspector): chronological list "Created by AI · 10:02 → Edited by Sara · 10:05 → Marked as assumption by Sara · 10:06 (reason: …)".

### S16 · Evidence
- Upload area (drag-drop) with per-file status: uploading → scanning → extracting → ready / rejected (reason).
- File list: name, pages, language detected, used in N statements, delete.
- **Citing:** from the Inspector's "Add evidence", search inside evidence (FTS) and select a passage. The statement shows "📎 Q3 report, p. 4". Verified-by-evidence uses this flow.
- **Empty:** "Add documents such as reports, KPIs or audit findings. The consultant will use them and cite them."

### S17 · Library & framework detail
- Grid of the 15 frameworks + the Strategic Options capability, filterable by stage ("Find root causes", "Prioritise", …) and family. **Pending catalogue entries are not shown.**
- **Detail page:** what it is, when to use, **when not to use**, inputs needed, typical time, steps overview, an example (platform-authored), originators, related frameworks. Actions: "Use in a new project", "Add to current project".
- "Explain" answers cite platform KB passages only.

### S18 · Settings
- **Profile:** name, UI language, default content language.
- **Language & region:** numerals, calendar, **country → workweek** (editable), date format preview in both languages.
- **Privacy:** PII mode (org admins), data-classification ceiling, AI disclosure default, raw prompt retention (off).
- **Organisation** (admins, Teams+): members, roles.

### S19 · Plan & usage
- Current plan, entitlements, usage this period (analyses, exports) with simple bars; history. Upgrade/manage actions.
- **Before pricing is approved:** shows usage and limits only; no prices displayed.
- Invoices (ZATCA-compliant PDFs, Arabic) download list.

### S20 · Shared view (read-only)
- Same layout without editing controls; comments on items (Beta-2). Banner: "Shared by … · View only". The export button is available if the sharer allowed it.

---

## 6. Cross-cutting interaction rules

| Area | Rule |
|---|---|
| **AI changes** | AI never edits user-approved content. AI-produced changes create a new version and show a diff chip ("Updated 3 items · View · Undo") |
| **Truth status** | Changed only through the Inspector's status control or the verify dialog; each change asks for an optional reason and is recorded |
| **Undo** | Ctrl/⌘+Z in editors (session stack); a 10 s undo toast for deletions; version restore for anything older |
| **Autosave** | Local draft continuous (IndexedDB); server checkpoints per 02 §6.7. The header shows "Saved · 2 min ago" / "Saving…" / "Offline: changes kept on this device" |
| **Concurrency** | Optimistic. On a 409: "This changed in another tab or by a collaborator. [Review & merge] [Keep mine as new version]" |
| **Confirmations** | Only for destructive or consequential actions: delete project, restore version, continue with Critical findings, override the gate. Never for reversible edits |
| **Streaming** | Show partial content as it arrives; never a spinner without text for > 2 s; long operations show a stage label |
| **Keyboard** | Full keyboard operation. Shortcuts shown in tooltips; `?` opens the shortcut sheet. Horizontal arrow keys follow the reading direction (→ = next in LTR, ← = next in RTL) |
| **Next best action** | Each screen exposes exactly one primary button (the next step); secondary actions are visually quieter |
| **Feedback** | 👍/👎 on recommendations, options and findings; free-text optional; never modal |

---

## 7. State patterns catalogue

| Pattern | Visual | Copy (EN / AR) | Recovery |
|---|---|---|---|
| **Empty** | Illustration-free; one line + primary action | "Nothing here yet." / «لا يوجد شيء هنا بعد.» | Primary action to create |
| **Loading (data)** | Skeletons matching final layout | (none) | — |
| **Streaming (AI)** | Progressive fill + stage label + cancel | "Drafting the causes…" / «أعِدّ الأسباب…» | Cancel keeps partial content |
| **Partial** | Section-level inline notice | "Couldn't draft this section." / «تعذّر إعداد هذا القسم.» | Retry · Fill in manually |
| **Repairing** | Silent (≤ 1 automatic repair) | — | — |
| **AI unavailable / refusal** | Neutral card | "We couldn't analyse this automatically. You can continue manually." / «تعذّر التحليل تلقائيًا، ويمكنك المتابعة يدويًا.» | Manual mode |
| **Stale** | Amber banner on downstream items | "Based on an older version of …" / «مبني على نسخة أقدم من …» | Review differences · Keep |
| **Conflict** | Modal-less banner | see §6 | Merge · Save as new version |
| **Offline** | Header indicator + banner | "You're offline. Changes are kept on this device." / «أنت غير متصل. تُحفَظ التغييرات على هذا الجهاز.» | Auto-sync on reconnect |
| **Permission denied** | Inline lock + explanation | "You have view access only." / «لديك صلاحية العرض فقط.» | Request access |
| **Limit reached** | Inline card (not a blocking modal) | "You've used this month's analyses." / «استخدمت تحليلات هذا الشهر.» | View plan · Wait until reset |
| **Not found / deleted** | Full-page | "This project was deleted. Restore within 30 days." | Restore · Back to projects |
| **Server error** | Inline with a reference ID | "Something went wrong (ref ABC123)." | Retry · Contact support |

---

## 8. Bilingual design system

### 8.1 Foundations: tokens

Reuses the approved IK palette and token architecture from `ik-lna-simulator/styles/tokens.css` (RGB channel variables, light and dark). It is moved into `packages/ui-tokens` as-is and extended with the tokens below.

| Token group | Tokens | Notes |
|---|---|---|
| Surfaces | `--bg`, `--surface`, `--surface-2`, `--surface-3`, `--border`, `--border-strong` | Existing |
| Text | `--text`, `--text-muted`, `--text-subtle` | Existing; AA verified by `scripts/contrast.mjs` |
| Brand / action | `--primary`, `--primary-hover`, `--primary-fg`, `--primary-soft`, `--navy` | Existing |
| **Truth status** [mapped] | `--fact` → **Verified**, `--claim` → **Unverified**, `--assumption` → **Assumption** (+ `-soft`) | Existing tokens, re-mapped to the D2 vocabulary |
| **Origin** [new] | `--origin-ai` (uses `--system` hue + sparkle icon), `--origin-external` (neutral + document icon), user = no marker | Origin is shown with an icon, not colour alone |
| **Severity** [new] | `--sev-critical` (= `--danger`), `--sev-high` (warm orange, new), `--sev-medium` (= `--warning`), `--sev-low` (= `--text-subtle`) | Each with `-soft`; new values must pass the contrast check in both themes |
| Data viz [new] | 8 categorical, 1 sequential (heat matrix 5 steps), 1 diverging | Colour-blind-safe; never colour-only (scores as text in cells) |
| Spacing | 4-px base: 4, 8, 12, 16, 24, 32, 48, 64 | |
| Radius | 4 (inputs), 8 (cards), 12 (panels), full (chips) | |
| Elevation | 0 (flat), 1 (cards: border only), 2 (popovers), 3 (dialogs) | Shadows use `--shadow` |
| Motion | 120 ms (micro), 200 ms (panels), 320 ms (canvas transitions); `prefers-reduced-motion` → none | |

### 8.2 Typography

| Role | Arabic | English | Notes |
|---|---|---|---|
| Family | **IBM Plex Sans Arabic** (400/500/600/700) | **Inter Variable** | Already bundled; each script's font is first in its locale's stack, the other is the fallback for mixed text |
| Display L | 40/56 · 700 | 40/48 · 700 | Arabic needs taller line height for ascenders/descenders and dots |
| Display M | 30/44 · 700 | 30/38 · 700 | |
| Heading 1 | 24/36 · 600 | 24/32 · 600 | |
| Heading 2 | 20/32 · 600 | 20/28 · 600 | |
| Body | **17/30** · 400 | 16/26 · 400 | Arabic body set ~1 px larger for equal perceived size |
| Body small | 15/26 · 400 | 14/22 · 400 | |
| Caption / labels | **14/22** · 500 | 12/18 · 500 | **Arabic never below 14 px** |
| Mono | JetBrains Mono (IDs, refs only) | same | |

**Rules**
- **No letter-spacing on Arabic** (`--tracking-tight: 0` for `lang=ar`, as already implemented). No negative tracking.
- **No italics in Arabic.** Emphasis uses weight (600) or colour. English also avoids italics in UI for parity.
- **No ALL CAPS** in English labels, for parity with Arabic (no case).
- **Diacritics (tashkeel)** are preserved in stored text but not added by default in UI copy.
- **Kashida/tatweel** is never used for justification. Text is aligned to the **start**, never justified, in the UI. PDF body may justify Arabic only with proper inter-word spacing.
- **Mixed direction:** every user-generated string renders inside `<bdi>`, or `unicode-bidi: plaintext` per paragraph. Latin acronyms (SWOT, KPI), emails, URLs and codes inside Arabic are isolated. Numbers with units keep their unit order per locale («٤٥ يومًا» / "45 days").
- **Numerals:** per org setting (Western by default). Applied by `Intl.NumberFormat` across UI, diagrams and exports. Percent and decimal separators follow the locale («٣٫٧» vs "3.7" when Arabic-Indic digits are on).
- **Truncation:** prefer line-clamp at word boundaries; tooltips show full text; never truncate inside a bidi-isolated run.

### 8.3 RTL / LTR behaviour

| Element | RTL rule |
|---|---|
| Layout | Logical CSS properties only (`margin-inline-start`, `inset-inline-end`, `text-align: start`). Lint rule bans physical left/right in components |
| Shell | Rail at inline-start (right in RTL); Consultant panel at inline-end |
| Icons that imply direction | **Mirror:** back/forward arrows, chevrons, "next", undo/redo, indent, list bullets with arrows, progress direction, send |
| Icons that don't mirror | Checkmark, clock, play/pause/media, search, download/upload, charts with real axes, logos, the ↗ "go to source" icon (universal) |
| Tables | First column at inline-start; numeric columns end-aligned; column order mirrors |
| Forms | Labels above fields; email, URL, phone and code inputs `dir="ltr"` inside RTL forms; numeric inputs follow the numeral setting |
| Steppers / chains / journey | Flow follows the reading direction |
| Diagrams | Per 02 §6.5 (flows mirror; matrices keep mathematical axes; Gantt time runs right-to-left) |
| Keyboard | Horizontal arrows follow the reading direction; Tab order follows the visual order |
| Toasts | Appear at the bottom inline-start |
| Drag handles | At inline-start of rows |

### 8.4 Trust labels: the information model in the UI (D2)

Each statement can show up to three compact markers. They are always icon + short text, never colour alone. **[v0.3]** Truth, review and decision are three separate controls in the Inspector. Accepting AI content or choosing an option never changes the truth marker (03 §3.1).

| Dimension | Marker | Example (AR / EN) |
|---|---|---|
| Truth status | ◆ Verified (solid, `--fact`) — shows the method on hover: "with evidence" / "confirmed by you" | «مُتحقَّق» / "Verified" |
| | ◇ Unverified (`--claim`) | «غير مُتحقَّق» / "Unverified" |
| | △ Assumption (`--assumption`) | «افتراض» / "Assumption" |
| Origin | ✦ AI generated (pending review → filled sparkle; accepted → outline sparkle) · 📄 External source · (none for user input) | «اقتراح ذكاء اصطناعي» / "AI suggestion" |
| Review status [v0.3] | ✦ filled = AI content awaiting review · ✦ outline = kept by user · struck-through + note = challenged · hidden (in history) = rejected | «بانتظار المراجعة» / "Awaiting review" |
| Decision status [v0.3] (proposals only) | ✓ Chosen · ⏸ Deferred · ✕ Rejected · (none = proposed) | «تم الاختيار» / "Chosen" |
| Evidence | 📎 count | «📎 ٢» |

- **Density:** the default *compact* mode shows only the truth-status icon plus ✦ on canvases, and full chips in lists and the Inspector. *Full* shows chips everywhere. *Clean* hides the markers on the canvas (the trust overlay toggle brings them back). The density preference is per user.
- **Inspector (Details tab):**
```
┌ تفاصيل العنصر ───────────────────────────────┐
│ النص: [__________________________________] │
│ الحالة: (◆ مُتحقَّق) (◇ غير مُتحقَّق) (△ افتراض) │  ← explicit control; reason optional
│ المصدر: اقتراح ذكاء اصطناعي · قبلته سارة        │  ← origin + review state (read-only)
│ أنشأه: الذكاء الاصطناعي ١٠:٠٢ · آخر تعديل: سارة ١٠:٠٥ │
│ الأدلة: 📎 تقرير الربع الثالث ص٤  [+ إضافة دليل] │
│ يعتمد عليه: الخيار ٢، الإجراء ٤               │
│ السجل ▸                                       │
│ ملاحظات المراجعة (١) ▸                        │
│ [اعتراض]  [حذف]                               │
└──────────────────────────────────────────────┘
```
- **Verify dialog:** two choices: "Attach evidence" (opens evidence search) or "I confirm this is correct" (attested; optional note). **Editing text never shows this dialog**; only the status control does.
- **Challenge:** opens a reason field. The item stays visible, struck through with "Challenged by you" (or kept with a dispute note, at the user's choice).

### 8.5 Core components (specs summary)

| Component | Key specs |
|---|---|
| Button | Primary / secondary / quiet / danger; 40 px height (44 px touch); icon position mirrors |
| Chip | Selection chips (answers), status chips (trust, severity); 28 px; Arabic label 14 px |
| Card | 8 px radius, 1 px border, 16–24 px padding; header / body / actions zones |
| Approach card | Rank, name, fit band (text + bar), reasons with source links, time, caution, primary action |
| Finding card | Severity marker, title, explanation, correction, 4 actions; collapsed variant for Medium/Low |
| Journey Rail item | Icon state, label, nested children, badges |
| Canvas toolbar | Zoom, fit, view switch (diagram/table), trust overlay, export; floating, bottom-centre |
| Inspector | §8.4 |
| Stepper (Workshop) | Numbered steps follow the reading direction; states done / current / upcoming / skipped |
| Data table | Sticky header, inline edit, keyboard grid navigation, RTL column mirroring |
| Toast | 6 s default (10 s with undo); max 3 stacked |
| Dialog | Focus-trapped; Esc closes; destructive actions on the inline-end with danger styling |

### 8.6 Accessibility
- WCAG 2.2 AA: contrast (CI check extended to the new tokens), focus visible (2 px `--primary` ring), **target size ≥ 24 px** (44 px on touch), no colour-only meaning.
- Every diagram has an equivalent **table view** and an `aria-describedby` summary ("Fishbone with 6 categories and 18 causes").
- Screen readers: statement markers are announced ("Assumption, AI suggestion, pending review"). `lang` attributes are set on mixed-language spans so Arabic and English voices switch correctly.
- Streaming regions use `aria-live="polite"` with batched announcements (not per token).
- `prefers-reduced-motion` respected; no auto-playing motion.

### 8.7 Voice and tone (consultant persona)

| Do | Don't |
|---|---|
| Restate before advising: "So the core issue seems to be …" | Start with a framework name |
| Be direct and warm: "I'd challenge the assumption that the system is the cause." | Hedge everything or over-apologise |
| Explain why: "I'm asking because it decides between two approaches." | Ask questions without purpose |
| Name uncertainty plainly: "This is an assumption; here's how to check it." | Present guesses as facts |
| Arabic: Modern Standard Arabic, business register, short sentences, native phrasing (not translated English) | Literal translations of English idioms; colloquial dialect in the UI |

Microcopy lives in the i18n dictionaries (AR and EN written separately). Terminology follows the glossary.

---

## 9. Responsive behaviour

| Breakpoint | Width | Workspace layout | Editing |
|---|---|---|---|
| **XL** | ≥ 1440 | Rail (248) + canvas + Consultant panel (360) | Full |
| **L** | 1024–1439 | Rail collapsible to icons (64) + canvas; panel as an overlay drawer | Full |
| **M** (tablet) | 640–1023 | Rail becomes a top horizontal stepper; canvas full width; panel as a bottom sheet; canvas defaults to fit-to-width | Full on tablet landscape; diagram editing via the table view in portrait |
| **S** (phone) | < 640 | Single column; table view default for all frameworks; diagrams viewable (pinch-zoom) | **Review & approve**: read, accept/reject AI items, act on findings, verify assumptions, comment, download exports. Authoring new frameworks shows "Best on a larger screen" with a "Continue anyway" option |

- Composer, diagnosis, approach and options screens are fully usable on phones (stacked cards).
- Touch targets ≥ 44 px; hover-only interactions always have a tap equivalent.
- Print styles exist for the Summary and diagnosis (A4, RTL-correct).

---

## 10. Export consistency

**Goal:** what users see is what they export. Same geometry, labels, language and meaning.

### 10.1 Single source of geometry
All exports use the stored canonical `LaidOutDiagram` (02 §6.4a). There is no re-layout at export time, so labels, line breaks and positions match the screen at the canonical size.

### 10.2 Token → export theme mapping

| App token | PPTX | PDF |
|---|---|---|
| Colours (light theme) | Theme colour scheme (dk1 = `--text`, lt1 = white, accent1 = `--primary`, accent2..6 = data-viz categorical) + explicit fills for truth/severity | CSS tokens (print theme) |
| Typography | Theme fonts: **Latin = Inter**, **Complex Script (`cs`) = IBM Plex Sans Arabic**; sizes scaled by the slide recipe (title 28, body 16, labels 12 pt; Arabic +1 pt) | Same families, embedded subsets |
| Spacing / radius | Slide grid: 16:9 (13.333 × 7.5 in), 12 columns, 0.5 in outer margins, 0.25 in gutters | A4, 20 mm margins, 12-column grid |
| Trust markers | Icon glyphs + short labels per the export density setting (compact / full / appendix only) | Same |
| Dark theme | **Not used** in exports (always the light/print theme) | Same |

### 10.3 RTL in exports
- **PPTX:** slide layouts mirrored for Arabic (title block and content anchors on the right). Paragraphs carry `rtl="1"` and `algn="r"`. Tables set `rtl="1"` (column order mirrors). Charts and diagrams follow 02 §6.5. Latin runs inside Arabic paragraphs are isolated, and number formatting follows the numeral setting.
- **PDF:** rendered by Chromium from the same React components with `dir="rtl"`. Running headers/footers and page numbers mirror.
- **Mixed-language decks:** not supported. A deliverable is entirely in one language (original or translated version).

### 10.4 Fonts on recipients' machines
IBM Plex Sans Arabic and Inter may not be installed where a PPTX is opened. Export offers **"Platform font"** (default; best fidelity, with a fallback chain declared in the theme to *Segoe UI* / *Arial*, which ship with Arabic support) or **"System font (maximum compatibility)"** (Arial/Segoe UI throughout; the layout service re-measures with that font before export). PDFs always embed fonts.

### 10.5 Slide structure (default deck)
1. Title (project title, date in the chosen calendar, organisation)
2. **Problem-Solving Summary** (1–2 slides)
3. Diagnosis (problem, symptoms vs. causes, key unknowns)
4. One section per framework instance (slide recipes from each definition), action titles
5. Strategic Options (comparison table + recommendation and trade-offs)
6. Action Plan (table) and/or Gantt (timeline)
7. Appendix: Assumptions Register, evidence list, methodology notes (originators), review summary, AI disclosure

### 10.6 Consistency tests (CI)
- Golden files per visual type × {AR, EN} × {PPTX, PDF, PNG}. PPTX is rendered to images via LibreOffice for automated comparison, and checked manually in PowerPoint (Win/Mac) and Keynote at each release.
- Geometry parity: screen vs. export node boxes within 1 px at the canonical size.
- Text overflow detector: no label exceeds its box in any export.
- Language purity: no untranslated strings in a translated deliverable (dictionary + script detection).

---

## 11. Analytics events (privacy-safe)

Content-free events (no user text), each with `{project_id hash, locale, plan, device_class}`:
`composer_started` · `challenge_submitted` · `diagnosis_viewed` · `clarify_answered` · `gate_override` · `approach_shown` · `approach_selected` · `no_good_fit_path` · `draft_generated` · `ai_item_reviewed {action}` · `truth_status_changed {from,to,method}` · `mode_switched` · `options_generated` · `option_decided` · `weights_changed` · `critic_finding_acted {level,severity,action}` · `review_completed` · `summary_generated` · `export_requested {format,language,translated}` · `export_ready` · `version_restored` · `limit_reached`.

---

## 12. Usability validation plan

| When | Study | Participants | Key questions |
|---|---|---|---|
| Phase 0 (prototype) | Moderated, think-aloud, Arabic first | 5 AR-first + 2 EN | Do users understand the trust labels? Is draft-first trusted? Do they find "No Good Fit" helpful? |
| Beta-1 | Task-based (G1 ≤ 20 min) | 8–10 design-partner users | Time to export; review-strip efficiency; clarifying-question tolerance |
| Beta-2 | Consultant Review & options | 8 users incl. 3 consultants | Critic noise; options trust; export language flow |
| Pre-GA | Accessibility audit + screen-reader sessions (AR + EN) | 3 users with assistive tech | Table views, announcements |

**Open UX questions to test:** matrix axis mirroring in RTL (02 §6.5); default trust-label density; whether "Accept all" should exist on the first draft for new users; whether to show the alignment strip on smaller screens.
