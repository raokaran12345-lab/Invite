/* ============================================================
   lib/offline.js — deterministic offline responder
   Lets the WHOLE council loop run with no API key and no network:
   every advisor reply is generated locally so you can see the
   engine, the maturity governor, the red-flag path, persistence,
   and stall detection actually work end-to-end.

   This is NOT AI analysis. Every string is hand-seeded and labelled
   [SIMULATED]. Set ANTHROPIC_API_KEY (or unset COUNCIL_OFFLINE) to
   get real model deliberation through the identical code path.
   ============================================================ */

const TAG = '[SIMULATED — offline mode, no model was called]';

// Pull a few facts back out of the prompt the engine built, so the offline
// replies react to evidence / round number just like a real model would.
function readContext(prompt) {
  const round = Number(/Round about to run:\s*(\d+)/.exec(prompt)?.[1] || 1);
  const evidenceCount = Number(
    /evidence items ingested to date:\s*(\d+)/i.exec(prompt)?.[1] || 0
  );
  const curMaturity = Number(/Current maturity(?: score)?:?\s*(\d+)/i.exec(prompt)?.[1] || 0);
  const hasNewEvidence = /NEW REAL-WORLD EVIDENCE this round \((\d+)/.test(prompt);
  return { round, evidenceCount, curMaturity, hasNewEvidence };
}

// One canned "biggest problem" per advisor, keyed by the name in the system prompt.
const MEMBER_PROBLEMS = {
  'The Regulator': {
    problem:
      'DebtIQ auto-filling serviceability and producing suitability evidence may be construed as automated decision-making in a credit process, triggering disclosure/explanation duties and liability if wrong.',
    why_fatal:
      'If the AI is seen to make (not just evidence) a determination, the line DebtIQ relies on collapses. The Dec-2026 ADM disclosure and BID obligations could expose both DebtIQ and the broker to ASIC/AFCA action.',
    evidence_needed:
      'A lawyer-reviewed opinion on whether the current extraction→serviceability flow is "assisting" vs "deciding", plus one real broker file run end-to-end against that line.',
    confidence: 0.7,
  },
  'The Distributor': {
    problem:
      'Aggregators own the broker relationship, the CRM and the compliance workflow — DebtIQ may have no viable path to brokers that does not run through a gatekeeper who can copy or block it.',
    why_fatal:
      'A product nobody can buy at a sane CAC dies regardless of quality. If every broker is locked to an aggregator stack, direct sales stall and the aggregator becomes a chokepoint, not a channel.',
    evidence_needed:
      'Outcomes of 10 cold broker conversations: can you sell direct, or does the aggregator gate it — and would one aggregator sign a paid pilot?',
    confidence: 0.75,
  },
  'The Treasurer': {
    problem:
      'Per-deal AI cost (vision OCR + three-layer forensics + document generation) may exceed what a broker will pay per deal, so every deal could lose money at scale.',
    why_fatal:
      'If marginal cost per deal is above marginal price, growth burns cash faster. A multi-document deal can mean many large vision calls; without measured cost-per-deal, the unit economics are unknown and possibly negative.',
    evidence_needed:
      'Measured fully-loaded model spend across 20 real deals vs the price a broker actually agreed to pay.',
    confidence: 0.65,
  },
  'The Skeptic': {
    problem:
      'A single hallucinated OCR figure flowing into the serviceability calc — or a forensic false-positive accusing an honest borrower — can destroy a broker’s trust and expose their licence.',
    why_fatal:
      'Brokers carry the regulatory liability. One wrong number in a not-unsuitable assessment, or one false tamper accusation, and the broker abandons the tool permanently and warns peers.',
    evidence_needed:
      'Extraction + forensics accuracy (precision/recall) measured against a labelled set of real borrower documents.',
    confidence: 0.7,
  },
  'The Strategist': {
    problem:
      'Nothing durable stops an aggregator, a lender, or an incumbent broker CRM from shipping the same OCR + compliance assist within a quarter — DebtIQ risks being a feature, not a company.',
    why_fatal:
      'The components (vision OCR, doc generation, a serviceability calc) are increasingly commoditised. Without data, workflow lock-in or distribution that compounds, an incumbent with the broker relationship wins by default.',
    evidence_needed:
      'Evidence of a compounding moat: a proprietary labelled-document/outcome dataset, switching cost, or an exclusive distribution agreement.',
    confidence: 0.6,
  },
  'The Broker': {
    problem:
      'It may not fit how deals actually flow — if DebtIQ adds a step, lives outside the aggregator CRM, or is not trusted near the client relationship, a time-poor broker nods and never changes their workflow.',
    why_fatal:
      'Adoption, not signup, is the business. Brokers optimise for speed and trust; a parallel tool that duplicates data entry or that they can’t defend to a client gets abandoned after the first busy week.',
    evidence_needed:
      'Observed workflow sessions with 5 real brokers: does DebtIQ remove steps in their actual process, or add them?',
    confidence: 0.7,
  },
  'The Rainmaker': {
    problem:
      'There is still no proven path to the first paid dollar: no priced offer, no broker who has said yes at a number, and the strategy is spread across a hard-to-win portal play instead of the beatable Quickli-style serviceability wedge.',
    why_fatal:
      'A product with no buyer at a known price is a hobby, not a business. Competing as an ApplyOnline-style lodgement portal is near-unwinnable; without a sharp, priced serviceability+forensics wedge aimed where Quickli is weak, DebtIQ never starts making money and the build burns runway.',
    evidence_needed:
      'A priced pilot offer tested on 10 brokers: how many say yes, at what monthly price, and explicitly for serviceability/forensics vs a portal — plus Quickli’s real price point to undercut or out-value.',
    confidence: 0.8,
  },
};

function memberName(system) {
  return /You are "([^"]+)"/.exec(system)?.[1] || null;
}

function problemReply(system) {
  const name = memberName(system);
  const base = MEMBER_PROBLEMS[name] || {
    problem: 'Unspecified advisor problem.',
    why_fatal: '',
    evidence_needed: '',
    confidence: 0.5,
  };
  return { ...base, problem: `${TAG} ${base.problem}` };
}

function agendaReply(prompt) {
  const { evidenceCount, curMaturity, hasNewEvidence } = readContext(prompt);

  // Offline maturity logic: with no ground truth, propose a number that the
  // engine's governor will then cap at 50 — demonstrating the cap and, after a
  // few flat rounds, the stall detector. Real evidence nudges it upward.
  let proposed;
  if (evidenceCount === 0) proposed = 64; // will be capped to 50 by the governor
  else proposed = Math.min(72, curMaturity + (hasNewEvidence ? 6 : 1));

  return {
    agenda: [
      {
        title: 'Distribution: prove a path to brokers that does not depend on an aggregator gate',
        raised_by: ['The Distributor', 'The Strategist'],
        rationale:
          'Highest leverage because acquisition cost and channel control gate everything else; a great product brokers cannot buy is worthless.',
      },
      {
        title: 'Unit economics: measure real fully-loaded cost per deal vs a price a broker will pay',
        raised_by: ['The Treasurer'],
        rationale:
          'If each deal loses money, growth accelerates the burn — this must be known before scaling spend.',
      },
      {
        title: 'Trust bar: quantify extraction + forensics accuracy on real documents',
        raised_by: ['The Skeptic', 'The Regulator'],
        rationale:
          'Accuracy is the precondition for both adoption and regulatory defensibility; one bad number ends a broker relationship.',
      },
    ],
    maturity: proposed,
    maturity_rationale: `${TAG} The plan is coherent but ${
      evidenceCount === 0
        ? 'no real-world evidence has been ingested, so this remains analysis, not validated reality.'
        : `${evidenceCount} evidence item(s) have been ingested, nudging the score within the throttle.`
    }`,
    what_unlocks_next_band:
      'A paying broker (or signed paid pilot), a measured cost-per-deal under the agreed price, and accuracy numbers on a real document set.',
  };
}

function solveReply() {
  return {
    solutions: [
      {
        problem: 'Distribution path to brokers',
        sharpest_fix:
          'Run a direct-to-broker validation sprint before assuming aggregators are either channel or wall — get to a yes/no on direct sales fast.',
        actions: [
          { action: 'Cold-contact 10 independent brokers and ask to watch one real deal', cost: 'cheap', priority: 1 },
          { action: 'Ask 3 aggregators whether a paid pilot inside their stack is possible', cost: 'cheap', priority: 2 },
          { action: 'Draft a one-page paid-pilot offer and test it on 5 brokers', cost: 'cheap', priority: 3 },
          { action: 'If gated, prototype one aggregator-CRM integration spike', cost: 'medium', priority: 4 },
        ],
        data_questions: [
          'Can a broker buy DebtIQ without aggregator permission?',
          'What is the realistic CAC per broker via the cheapest channel?',
        ],
      },
      {
        problem: 'Unit economics per deal',
        sharpest_fix:
          'Instrument real per-deal model spend now; do not price until cost-per-deal is measured on real documents.',
        actions: [
          { action: 'Log token/$ cost per /api/* call and sum per deal across 20 real deals', cost: 'cheap', priority: 1 },
          { action: 'Test a price point with 5 brokers and record yes/no + number', cost: 'cheap', priority: 2 },
          { action: 'Model gross margin at 3 pricing tiers from measured cost', cost: 'cheap', priority: 3 },
        ],
        data_questions: [
          'What is the fully-loaded cost of a typical multi-document deal?',
          'What price will a broker actually agree to, and per what unit?',
        ],
      },
      {
        problem: 'Accuracy / trust bar',
        sharpest_fix:
          'Build a small labelled real-document set and measure precision/recall before claiming the tool is trustworthy.',
        actions: [
          { action: 'Assemble 50 real (consented) borrower docs with ground-truth labels', cost: 'medium', priority: 1 },
          { action: 'Measure extraction accuracy and forensic false-positive rate against it', cost: 'cheap', priority: 2 },
          { action: 'Add a mandatory human-confirm step on any figure entering serviceability', cost: 'cheap', priority: 3 },
        ],
        data_questions: [
          'What is the false-positive rate of the forensics layer on honest documents?',
          'How often does OCR misread a figure that changes the serviceability verdict?',
        ],
      },
    ],
  };
}

function flagsReply(prompt) {
  const { evidenceCount } = readContext(prompt);
  const flags = [
    {
      category: 'compliance',
      severity: 4,
      summary: `${TAG} AI-assisted serviceability may cross into automated decision-making.`,
      detail:
        'The extraction→serviceability→suitability flow could be read as the AI making a credit determination, engaging ADM disclosure (due Dec 2026) and BID liability. This is the premise the whole product rests on.',
      recommended_action:
        'Get a qualified Australian credit lawyer to rule on the assist-vs-decide line before scaling.',
    },
    {
      category: 'cash',
      severity: 3,
      summary: `${TAG} Per-deal AI cost is unmeasured and may exceed price.`,
      detail:
        'Vision OCR + three-layer forensics + generation per deal has never been summed against a real price. Margin could be negative and growth would worsen it.',
      recommended_action: 'Instrument cost-per-deal across the next 20 real deals before any pricing commitment.',
    },
  ];
  if (evidenceCount === 0) {
    flags.push({
      category: 'building-without-validation',
      severity: 4,
      summary: `${TAG} Effort is accruing with zero real-world evidence ingested.`,
      detail:
        'No broker interviews, costs, accuracy numbers or distribution outcomes have been fed in. Every conclusion so far is reasoning in a vacuum; the maturity cap is doing its job.',
      recommended_action:
        'Drop one real finding into ./evidence (a broker conversation, a measured cost, a yes/no on price) to let the loop progress.',
    });
  }
  return { flags };
}

/**
 * Produce a deterministic offline JSON STRING for whichever council step this
 * prompt represents. Inferring the step from the schema keys in the prompt
 * keeps this decoupled from the engine — no call sites change.
 */
export function offlineResponse(system, prompt) {
  let value;
  if (prompt.includes('"why_fatal"')) value = problemReply(system);
  else if (prompt.includes('"what_unlocks_next_band"')) value = agendaReply(prompt);
  else if (prompt.includes('"sharpest_fix"')) value = solveReply();
  else if (prompt.includes('"recommended_action"')) value = flagsReply(prompt);
  else value = { note: `${TAG} unrecognised step` };
  return JSON.stringify(value);
}

/** True when the council should use the offline responder instead of the API. */
export function isOffline() {
  if (process.env.COUNCIL_OFFLINE === '1') return true;
  if (process.env.COUNCIL_OFFLINE === '0') return false;
  return !process.env.ANTHROPIC_API_KEY; // no key → fall back to offline
}
