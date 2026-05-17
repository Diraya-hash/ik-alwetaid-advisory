// Content layer for IK Alwetaid Advisory
// All copy is positioned for the senior advisory practice

export const brand = {
  name: "IK Alwetaid Advisory",
  shortName: "IK ALWETAID",
  principal: "Ibrahim K. Alwetaid",
  tagline: "Workforce capability, advised at the level it deserves.",
  location: "Riyadh · Available globally",
  email: "advisory@ikalwetaid.com",
  phone: "+966 5· ··· ····", // TODO: replace with your real number before launch
};

// ---- Corporate services ----
export type Service = {
  slug: string;
  name: string;
  short: string;
  detail: string;
  outcomes: string[];
};

export const corporateServices: Service[] = [
  {
    slug: "ld-consulting",
    name: "Learning & Development Consulting",
    short: "Diagnose the capability question before answering it with content.",
    detail:
      "I work with HR leaders to clarify what the business actually needs the workforce to do — and design the learning architecture to deliver it. The output is not a training calendar. It is a governance model, a learning strategy, and the analytics to prove return.",
    outcomes: [
      "Five-year learning strategy aligned to business plan",
      "ADDIE-anchored program portfolio governance",
      "Kirkpatrick-aligned ROI measurement",
    ],
  },
  {
    slug: "talent-strategy",
    name: "Talent Development Strategy",
    short: "Build the long-term system for growing your own leaders.",
    detail:
      "A multi-year talent development blueprint covering high-potential identification, leadership pipelines, internal mobility, and capability acceleration. Designed to outlive any single CHRO and embed into your operating rhythm.",
    outcomes: [
      "Talent segmentation framework",
      "HiPo identification methodology",
      "Mobility and acceleration programs",
    ],
  },
  {
    slug: "leadership-programs",
    name: "Leadership Development Programs",
    short: "Tiered programs that produce leaders, not graduates.",
    detail:
      "End-to-end design of leadership programs across emerging, mid, and executive tiers — including curriculum architecture, faculty sourcing, simulation design, and post-program embedding. Built on 70:20:10 with rigorous experiential components.",
    outcomes: [
      "Three-tier leadership architecture",
      "Stretch assignment and coaching integration",
      "Measurable behavioral change",
    ],
  },
  {
    slug: "capability-framework",
    name: "Capability Building Framework Design",
    short: "The architecture beneath every credible capability program.",
    detail:
      "Design of the underlying capability framework that connects business strategy to required workforce competencies — and from there to learning, hiring, and performance systems. The framework most organizations skip and pay for later.",
    outcomes: [
      "Strategic capability map",
      "Build-buy-borrow analysis",
      "Integration with HR systems",
    ],
  },
  {
    slug: "competency-framework",
    name: "Competency Framework Design",
    short: "Behavioral architecture that holds up across functions and levels.",
    detail:
      "Design and validation of competency dictionaries covering technical, behavioral, and leadership domains. Calibrated to your role taxonomy and proficiency levels. Built to integrate with performance, succession, and learning systems.",
    outcomes: [
      "Validated competency library",
      "Proficiency-level rubrics",
      "Role-to-competency mapping",
    ],
  },
  {
    slug: "lna",
    name: "Learning Needs Analysis",
    short: "The diagnostic that determines whether training is even the answer.",
    detail:
      "Rigorous LNA engagements at organizational, functional, and individual levels. Combines competency gap analysis, performance data, and qualitative interviews to surface the real capability priorities — and to challenge the ones that aren't.",
    outcomes: [
      "Prioritized capability gap report",
      "Investment recommendations by intervention type",
      "Baseline metrics for future measurement",
    ],
  },
  {
    slug: "succession-advisory",
    name: "Succession Planning Advisory",
    short: "Build leadership depth before you need it.",
    detail:
      "Advisory engagements on succession architecture — from critical role identification to 9-box calibration, successor readiness assessment, and bench strength reporting. Includes board-level talent reporting frameworks.",
    outcomes: [
      "Critical role and successor map",
      "9-box calibration methodology",
      "Board-ready talent dashboard",
    ],
  },
  {
    slug: "talent-review",
    name: "Talent Review Frameworks",
    short: "The cadence that turns talent data into talent decisions.",
    detail:
      "Design of quarterly and annual talent review processes — including calibration protocols, decision frameworks, and the discipline that prevents reviews from becoming theater. Trains your leaders to make defensible talent calls.",
    outcomes: [
      "Calibration session protocols",
      "Talent decision rubrics",
      "Review-to-action accountability",
    ],
  },
  {
    slug: "performance-development",
    name: "Performance Development Consulting",
    short: "Move from rating people to developing them.",
    detail:
      "Redesign of performance systems to integrate development, coaching, and accountability — without the bureaucracy. Includes manager enablement, goal architecture, and the cultural work that determines whether the system actually changes behavior.",
    outcomes: [
      "Performance philosophy and operating model",
      "Manager capability uplift",
      "Continuous feedback infrastructure",
    ],
  },
  {
    slug: "capability-assessment",
    name: "Organizational Capability Assessment",
    short: "An evidence base for capability investment decisions.",
    detail:
      "Diagnostic engagements that produce a defensible view of organizational capability — across functions, levels, and strategic priorities. Used by executive teams to direct multi-million-riyal capability investments.",
    outcomes: [
      "Capability heatmap by function and level",
      "Strategic risk and opportunity register",
      "Three-year capability roadmap",
    ],
  },
  {
    slug: "academy-design",
    name: "Internal Academy Design",
    short: "Build the institutional vehicle for capability — not a training department.",
    detail:
      "End-to-end design of corporate academies — including governance, curriculum architecture, faculty model, technology stack, and the business case to fund it. Drawing on academies built for Saudi enterprise and financial services.",
    outcomes: [
      "Academy operating model",
      "Faculty and curriculum architecture",
      "Five-year business case and roadmap",
    ],
  },
  {
    slug: "learning-governance",
    name: "Learning Governance Models",
    short: "Structure that turns L&D from cost center to strategic function.",
    detail:
      "Design of governance and operating models for L&D — covering councils, decision rights, investment frameworks, and reporting cadence. The work that determines whether learning has a seat at the executive table.",
    outcomes: [
      "L&D governance charter",
      "Investment and prioritization framework",
      "Executive reporting model",
    ],
  },
];

// ---- Individual services ----
export const individualServices: Service[] = [
  {
    slug: "career-progression",
    name: "Career Progression Advisory",
    short: "Strategic counsel for senior professionals navigating the next move.",
    detail:
      "Confidential advisory for senior professionals at decision points — internal promotion, lateral move, or external transition. Drawing on fifteen years inside the function, I help you read the room, position your candidacy, and make the call with full information.",
    outcomes: [
      "Career positioning assessment",
      "Decision framework for the next move",
      "Ongoing advisory through transition",
    ],
  },
  {
    slug: "executive-coaching",
    name: "Executive Career Coaching",
    short: "Sustained partnership for leaders building their next chapter.",
    detail:
      "A structured coaching engagement — typically six to twelve months — for executives navigating role transitions, expanded mandates, or strategic career shifts. Built around the GROW and CLEAR models, with clear development outcomes.",
    outcomes: [
      "Structured 6-12 month engagement",
      "Quarterly progress reviews",
      "Confidential, evidence-based feedback",
    ],
  },
  {
    slug: "interview-prep",
    name: "Interview Preparation",
    short: "Executive interview rehearsal at the level the stakes demand.",
    detail:
      "Intensive preparation for senior interviews — from role-specific competency rehearsal to STAR-formatted answer architecture and executive presence calibration. Used by candidates for director, VP, and C-suite roles.",
    outcomes: [
      "Tailored competency answer bank",
      "Two live rehearsal sessions",
      "Executive presence calibration",
    ],
  },
  {
    slug: "cv-positioning",
    name: "CV & LinkedIn Positioning",
    short: "Position the document to position the candidate.",
    detail:
      "Strategic positioning of senior CVs and LinkedIn profiles — not formatting, positioning. The work of deciding which roles to lead with, how to frame impact, and how to ensure the first 30 seconds make the case.",
    outcomes: [
      "Repositioned senior CV",
      "LinkedIn profile architecture",
      "Personal narrative framework",
    ],
  },
  {
    slug: "career-strategy",
    name: "Career Growth Strategy",
    short: "A five-year plan for the career you actually want.",
    detail:
      "Strategic engagement to define the career trajectory ahead — including target roles, capability gaps to close, signals to build, and the sequence of moves required. For professionals serious about the next decade.",
    outcomes: [
      "Five-year career trajectory map",
      "Capability development plan",
      "Quarterly progress check-ins",
    ],
  },
  {
    slug: "leadership-presence",
    name: "Leadership Presence Coaching",
    short: "Develop the gravitas that senior rooms quietly require.",
    detail:
      "Targeted coaching on executive presence — including communication, stakeholder management, board interaction, and the harder-to-name signals that determine whether you're heard at the level you've earned.",
    outcomes: [
      "Presence assessment and baseline",
      "Targeted development plan",
      "High-stakes situation rehearsal",
    ],
  },
];

// ---- Methodology phases ----
export const methodology = [
  {
    phase: "01",
    title: "Diagnose",
    description:
      "Before any recommendation, a rigorous read of the situation. Strategic context, stakeholder dynamics, capability evidence, and the question the organization is actually trying to answer.",
  },
  {
    phase: "02",
    title: "Architect",
    description:
      "Design of the framework, system, or program — built on established models (ADDIE, Kirkpatrick, 70:20:10, CIPD) but tailored to your operating reality. Always documented, always defensible.",
  },
  {
    phase: "03",
    title: "Mobilize",
    description:
      "The unglamorous work of implementation. Stakeholder alignment, governance setup, pilot design, change management. Where most engagements quietly fail. Where this one doesn't.",
  },
  {
    phase: "04",
    title: "Govern",
    description:
      "Build the operating cadence that keeps the system alive after the engagement ends. Metrics, reviews, and the executive reporting that turns capability into a board-level conversation.",
  },
];

// ---- Why-work-with-me pillars ----
export const valuePillars = [
  {
    title: "Senior practitioner, not external consultant",
    description:
      "I've spent fifteen years inside HR — building the systems I now advise on. I know what implementation feels like, not just what the deck recommends.",
  },
  {
    title: "Rigor of a global firm, scale of a personal practice",
    description:
      "You work with me, not a junior associate. Every engagement is led personally, with the discretion and depth that senior decisions require.",
  },
  {
    title: "Saudi and Gulf institutional fluency",
    description:
      "Native fluency in the Gulf operating context — Vision 2030, Saudisation, governance norms, and the cultural dynamics that determine whether change actually lands.",
  },
  {
    title: "Outcomes you can defend to a board",
    description:
      "Every engagement produces tangible artifacts — frameworks, dashboards, governance charters — that survive leadership transitions and hold up to executive scrutiny.",
  },
];

// ---- Case studies ----
export type CaseStudy = {
  slug: string;
  client: string;
  sector: string;
  title: string;
  context: string;
  mandate: string;
  approach: string;
  outcome: string;
  metric: { value: string; label: string }[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "national-bank-academy",
    client: "Tier-1 Saudi Bank",
    sector: "Financial Services",
    title: "Designing a corporate academy for a Tier-1 Saudi bank.",
    context:
      "The bank's L&D function was delivering 200+ programs annually with no clear architecture linking learning to strategy. Executive confidence in the function was low.",
    mandate:
      "Design a corporate academy operating model — governance, curriculum, faculty, technology, and the five-year business case to fund it.",
    approach:
      "Twelve-week engagement combining executive interviews, capability diagnostic, benchmark analysis against three peer institutions, and architecture design with the CHRO and CFO.",
    outcome:
      "Academy launched within nine months. Program portfolio consolidated from 200 to 47 strategic offerings. L&D budget restructured around capability investment rather than activity volume.",
    metric: [
      { value: "47", label: "Strategic programs (from 200+)" },
      { value: "9 mo", label: "From design to launch" },
      { value: "31%", label: "Reduction in cost-per-learner" },
    ],
  },
  {
    slug: "government-capability",
    client: "Saudi Government Entity",
    sector: "Public Sector",
    title: "Building a national capability framework for a strategic government entity.",
    context:
      "Entity mandated to deliver a Vision 2030 priority but operating without a capability framework or workforce plan to support the mandate.",
    mandate:
      "Design and validate the capability framework — and the workforce plan — required to deliver the five-year strategic mandate.",
    approach:
      "Sixteen-week engagement with the executive team, including strategic capability mapping, scenario-based workforce modeling, and a build-buy-borrow analysis across 23 critical capabilities.",
    outcome:
      "Framework adopted by the executive committee and integrated into the annual operating plan. Used as the basis for a SAR 84M three-year capability investment program.",
    metric: [
      { value: "23", label: "Critical capabilities mapped" },
      { value: "SAR 84M", label: "Capability investment unlocked" },
      { value: "5 yrs", label: "Strategic horizon" },
    ],
  },
  {
    slug: "succession-multinational",
    client: "Multinational in Saudi Arabia",
    sector: "Industrial",
    title: "Succession architecture for the top three layers of a multinational.",
    context:
      "Regional CHRO inherited a succession process that was largely a spreadsheet. Board pressure to demonstrate leadership pipeline depth.",
    mandate:
      "Build the succession architecture — methodology, calibration process, and board-level reporting — for the top three organizational layers.",
    approach:
      "Ten-week engagement covering critical role identification, successor assessment methodology, 9-box calibration training, and a board reporting framework. Pilot calibration session co-facilitated with the CHRO.",
    outcome:
      "Calibrated succession plan covering 134 critical positions. Board talent committee adopted the quarterly reporting cadence. Three internal successors promoted to executive roles in the following twelve months.",
    metric: [
      { value: "134", label: "Critical roles calibrated" },
      { value: "3", label: "Internal executive promotions" },
      { value: "Quarterly", label: "Board reporting cadence" },
    ],
  },
];

// ---- Insights ----
export type Insight = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
};

export const insights: Insight[] = [
  {
    slug: "trainers-and-architects",
    title: "On trainers and architects.",
    excerpt:
      "Most L&D functions hire trainers when they should be hiring architects. The two are not the same — and the difference compounds over years.",
    category: "Learning & Development",
    readTime: "6 min read",
    date: "April 2026",
  },
  {
    slug: "succession-isnt-spreadsheet",
    title: "Succession is not a spreadsheet.",
    excerpt:
      "Three signs your succession process is decorative — and the operating discipline required to make it real.",
    category: "Succession",
    readTime: "8 min read",
    date: "March 2026",
  },
  {
    slug: "capability-vs-skills",
    title: "Capability is not the same as skills.",
    excerpt:
      "Why conflating the two has produced a decade of misallocated learning spend — and what to measure instead.",
    category: "Capability",
    readTime: "5 min read",
    date: "February 2026",
  },
  {
    slug: "ai-in-hr-real-question",
    title: "AI in HR: the real question executives should ask.",
    excerpt:
      "Most AI-in-HR conversations are about tools. The conversation that matters is about governance, judgment, and where to keep humans in the loop.",
    category: "Strategy",
    readTime: "7 min read",
    date: "February 2026",
  },
  {
    slug: "competency-frameworks-fail",
    title: "Why competency frameworks fail.",
    excerpt:
      "Four reasons competency frameworks become shelf-ware — and the design principles that prevent it.",
    category: "Frameworks",
    readTime: "9 min read",
    date: "January 2026",
  },
  {
    slug: "vision-2030-capability",
    title: "Vision 2030 and the capability question.",
    excerpt:
      "Saudi organizations are eight years into delivering the most ambitious workforce transformation of the century. The capability gap that nobody is naming.",
    category: "Strategy",
    readTime: "10 min read",
    date: "December 2025",
  },
];

// ---- Credentials ----
export const credentials = [
  "CIPD Level 5 Associate Diploma in People Management",
  "Project Management Professional (PMP)",
  "Train-the-Trainer Certified (City & Guilds)",
  "MBA, People Strategy concentration",
  "15+ years across financial services, retail, and government",
];

// ---- Clients served (placeholders for logo strip) ----
export const clientSectors = [
  "Saudi Government",
  "Tier-1 Banking",
  "Retail Enterprise",
  "Industrial",
  "Telecommunications",
  "Healthcare",
];

// ---- FAQ ----
export const faqs = [
  {
    q: "What kinds of engagements do you take on?",
    a: "Strategic advisory engagements — typically 8 to 16 weeks — and longer-term governance work. I do not take on training delivery, content authoring, or facilitation-only engagements. The work is upstream: diagnosis, architecture, governance.",
  },
  {
    q: "What does an engagement typically cost?",
    a: "Engagements are scoped individually. Pricing depends on scope, duration, and the level of involvement required from my side — and it is shared after a first conversation, once I understand what you're actually trying to solve. If budget is a constraint, raise it on the call; we can usually find a path forward.",
  },
  {
    q: "Do you work outside Saudi Arabia?",
    a: "Yes. The practice is based in Riyadh and works across the GCC and selectively internationally. Most engagements involve a mix of on-site work and remote advisory.",
  },
  {
    q: "How do you handle confidentiality?",
    a: "All engagements are governed by NDA before scoping discussions. Case studies are anonymized unless the client elects to be named. Client lists are not shared.",
  },
  {
    q: "Can you support individual professionals?",
    a: "Yes — through the Individual Advisory practice. This covers career progression, executive coaching, and interview preparation for senior professionals. These engagements are kept entirely separate from corporate work.",
  },
  {
    q: "Do you collaborate with other firms or coaches?",
    a: "Selectively. I maintain a network of trusted faculty and specialists who join engagements where their depth is needed. The accountability for any engagement, however, stays with me personally.",
  },
  {
    q: "What is your availability?",
    a: "I typically run two to three active engagements at a time. New engagements are scoped quarterly. If timing matters, raise it in the consultation request.",
  },
];
