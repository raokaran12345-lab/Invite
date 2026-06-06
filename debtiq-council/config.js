/* ============================================================
   DebtIQ Council — configuration
   Roster + lenses, the seed brief the council reasons about,
   and the tunables that govern the loop's honesty.
   Everything here is plain data so you can edit it without
   touching the engine.
   ============================================================ */

/* ── The business the council is advising ────────────────────
   This is the ONLY thing the council "knows" at the start. It is
   deliberately framed as hypotheses, not facts, so the advisors
   hunt for what hasn't been validated yet. Real-world findings you
   drop into ./evidence override and refine this over time. */
export const BRIEF = `
DebtIQ is an AI co-pilot for Australian mortgage & finance brokers.

What it does for a broker:
- Ingests borrower documents (payslips, bank statements, tax docs) and runs
  Claude-vision OCR to extract income / liabilities / security details.
- Runs three-layer document forensics (PDF metadata + vision + cross-document
  consistency) to surface tamper signals.
- Auto-fills a serviceability calculator (HEM floor, +3% buffer, DTI flag) and
  produces the responsible-lending suitability trail.
- Generates NCCP disclosure documents (Credit Guide, Quote, Proposal,
  Preliminary Assessment, Needs Analysis) and Best-Interests-Duty evidence.
- Compares lender pricing / policy and tracks the deal to settlement.

Business model (HYPOTHESES — not yet validated):
- Sold per-broker as SaaS. Buyer = individual brokers or broker groups /
  aggregators.
- Value prop = hours saved per deal + a defensible compliance audit trail.

Regulatory surface (Australia): NCCP Act + ASIC RG 209 / RG 273 (Best Interests
Duty), Privacy Act / APPs (incl. the Dec-2026 automated-decision-making
disclosure), the Consumer Data Right, and AML/CTF questions. DebtIQ positions
itself as building the *evidence* — the licensed human makes the determination.

Stack: static front-end on Cloudflare Pages, Supabase auth + per-broker
persistence (RLS), Anthropic API behind a server proxy for all AI. Per-deal cost
is dominated by vision/OCR + forensics model calls.

Known unknowns the founder has NOT yet proven:
- Will a broker actually pay, and how much?
- Distribution: can you reach brokers without an aggregator gatekeeper?
- Real per-deal AI cost vs price (margin).
- Extraction/forensics accuracy at a bar brokers will trust, and the liability
  if it is wrong.
- Defensibility vs aggregator CRMs and incumbents already in the workflow.
`.trim();

/* ── The deliberating advisors ───────────────────────────────
   Each member independently hunts for the ONE problem most likely
   to sink the business through their lens. Keep this to ~6 — cost
   per round is roughly (members + 3) model calls. */
export const MEMBERS = [
  {
    id: 'reg',
    name: 'The Regulator',
    role: 'Compliance & regulatory risk',
    lens: `You think only about what could get DebtIQ — or a broker using it —
in trouble with ASIC, OAIC, or AFCA. NCCP responsible-lending, Best Interests
Duty, Privacy/APPs, CDR accreditation premises, AML reporting-entity status,
and the liability of an AI touching a credit decision. You are allergic to the
product quietly making a "determination" that only a licensed human may make.`,
  },
  {
    id: 'gtm',
    name: 'The Distributor',
    role: 'Go-to-market & distribution',
    lens: `You obsess over how DebtIQ actually reaches paying brokers. Aggregators
own the broker relationship and the CRM; are they a channel or a wall? You hunt
for the moment the business dies because it cannot acquire customers at a viable
cost, regardless of how good the product is.`,
  },
  {
    id: 'econ',
    name: 'The Treasurer',
    role: 'Unit economics & cash',
    lens: `You care about money in vs money out. Per-deal AI cost (vision OCR +
forensics + generation) vs the price a broker will bear, gross margin, payback,
burn, and runway. You hunt for the version of this where every deal loses money
at scale or pricing can never cover model cost.`,
  },
  {
    id: 'trust',
    name: 'The Skeptic',
    role: 'Product accuracy & trust',
    lens: `You distrust the core claim that the AI is accurate enough. False
positives in forensics that accuse honest borrowers, missed liabilities, OCR
that hallucinates a number into a serviceability calc. You hunt for the failure
mode where one wrong extraction destroys a broker's trust — and their licence —
forever.`,
  },
  {
    id: 'moat',
    name: 'The Strategist',
    role: 'Competition & defensibility',
    lens: `You ask what stops an aggregator, a lender, or an incumbent CRM from
shipping this in a quarter. Where is the durable moat — data, workflow lock-in,
compliance trust, distribution? You hunt for the problem where DebtIQ is a
feature, not a company.`,
  },
  {
    id: 'broker',
    name: 'The Broker',
    role: 'Customer reality & adoption',
    lens: `You ARE a time-poor broker. You hunt for the reason a real broker
nods politely and never changes their workflow: it does not fit how deals
actually flow, it adds a step, it is not trusted with the client relationship,
or the pain it solves is not the pain that keeps brokers up at night.`,
  },
];

/* ── The Chair ───────────────────────────────────────────────
   Forces focus (2–3 problems) and scores maturity. */
export const CHAIR = {
  name: 'The Chair',
  role: 'Focus + maturity scoring',
  persona: `You are a ruthless, experienced operator chairing this council. You
do not reward eloquence; you reward proximity to a sustainable, expandable
business. You pick the 2–3 highest-leverage problems from what the members
raised and you score maturity honestly — plans and analysis do not move the
number, only validated reality does.`,
};

/* ── The risk sentinel ───────────────────────────────────────
   Scans the round for red flags worth interrupting a human over. */
export const SENTINEL = {
  name: 'The Sentinel',
  role: 'Red-flag scan',
  persona: `You are the council's risk sentinel. You scan the whole round for
flags a founder must see NOW. Four categories: "compliance" (legal/regulatory
exposure), "cash" (runway / margin / a deal that loses money), "fatal-risk"
(could sink the business outright), and "building-without-validation" (effort
being spent on something no real-world evidence supports yet). You rate each
1–5. You do not invent flags to look useful — a quiet round is a valid result.`,
};

/* ── Maturity bands (shared language for the score) ─────────── */
export const MATURITY_BANDS = [
  { min: 0, max: 25, label: 'Idea — unvalidated hypotheses' },
  { min: 26, max: 50, label: 'Reasoned — coherent plan, no ground truth' },
  { min: 51, max: 70, label: 'Validated — real evidence of demand/economics' },
  { min: 71, max: 85, label: 'Early traction — paying, retaining, repeatable' },
  { min: 86, max: 100, label: 'Scaling — sustainable & expandable' },
];

/* ── Tunables (the governors that keep it honest) ──────────── */
export const TUNABLES = {
  // Without any real-world evidence ingested, maturity cannot climb past this.
  // Reasoning in a vacuum stalls here by design.
  MATURITY_CAP_NO_EVIDENCE: 50,

  // The Chair may not raise maturity by more than this in a single round —
  // reality moves in steps, not leaps.
  MAX_MATURITY_JUMP_PER_ROUND: 8,

  // Stall detection: if the score moves less than DELTA across this many
  // consecutive rounds, the council stops adding rounds and tells you what to
  // go validate.
  STALL_WINDOW: 3,
  STALL_DELTA: 2,

  // Default severity (1–5) at or above which a red flag pings you.
  // Overridden by SEVERITY_THRESHOLD in .env.
  SEVERITY_THRESHOLD: 4,

  // Continuous-mode defaults (overridable by .env / CLI flags).
  DEFAULT_INTERVAL_SECONDS: 900,
  DEFAULT_MODEL: 'claude-sonnet-4-6',
  DEFAULT_MAX_TOKENS: 1400,
  DEFAULT_TEMPERATURE: 0.7,
};
