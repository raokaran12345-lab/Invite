#!/usr/bin/env node
/* ============================================================
   DebtIQ Council — the autonomous engine + loop
   Runs deliberation rounds with no human in the loop:
     1. ingest evidence        4. solutions + actions
     2. problem-finding        5. red-flag scan
     3. agenda + maturity      6. persist + carry forward
   Two governors keep it honest: maturity is capped without real
   evidence, and the loop stalls itself when the score flatlines.
   ============================================================ */
import 'dotenv/config';

import { BRIEF, MEMBERS, CHAIR, SENTINEL, MATURITY_BANDS, TUNABLES } from './config.js';
import { askJson } from './lib/anthropic.js';
import { isOffline } from './lib/offline.js';
import { pushAlert } from './lib/notify.js';
import {
  ensureDirs,
  loadMemory,
  saveMemory,
  ingestEvidence,
  evidencePending,
  writeRoundRecord,
  writeLatest,
  appendRedFlags,
  recentContext,
} from './lib/store.js';

/* ── CLI + env config ─────────────────────────────────────── */
function parseArgs(argv) {
  const cfg = {
    mode: 'continuous', // once | rounds | continuous
    rounds: Infinity,
    interval: numEnv('COUNCIL_INTERVAL', TUNABLES.DEFAULT_INTERVAL_SECONDS),
    model: process.env.COUNCIL_MODEL || TUNABLES.DEFAULT_MODEL,
    maxTokens: numEnv('COUNCIL_MAX_TOKENS', TUNABLES.DEFAULT_MAX_TOKENS),
    temperature: numEnv('COUNCIL_TEMPERATURE', TUNABLES.DEFAULT_TEMPERATURE),
    severity: numEnv('SEVERITY_THRESHOLD', TUNABLES.SEVERITY_THRESHOLD),
  };
  for (const arg of argv.slice(2)) {
    const [k, v] = arg.replace(/^--/, '').split('=');
    if (k === 'once') cfg.mode = 'once';
    else if (k === 'rounds') {
      cfg.mode = 'rounds';
      cfg.rounds = Math.max(1, parseInt(v, 10) || 1);
    } else if (k === 'interval') cfg.interval = Math.max(5, parseInt(v, 10) || cfg.interval);
    else if (k === 'model') cfg.model = v || cfg.model;
    else if (k === 'severity') cfg.severity = parseInt(v, 10) || cfg.severity;
    else if (k === 'mock' || k === 'offline') process.env.COUNCIL_OFFLINE = '1';
    else if (k === 'live') process.env.COUNCIL_OFFLINE = '0';
    else if (k === 'help' || k === 'h') {
      printHelp();
      process.exit(0);
    }
  }
  return cfg;
}

function numEnv(name, fallback) {
  const v = parseFloat(process.env[name]);
  return Number.isFinite(v) ? v : fallback;
}

function printHelp() {
  console.log(`DebtIQ Council — autonomous AI advisory loop

  node council.js --once               one round, then exit
  node council.js --rounds=5           up to five rounds (stops early if stalled)
  node council.js                      continuous (interval from .env)
  node council.js --interval=600 --model=claude-opus-4-8
  node council.js --once --mock        run with NO key (simulated, labelled)

Drop real-world data (.md/.txt/.json/.csv) into ./evidence to let the
maturity score climb past ${TUNABLES.MATURITY_CAP_NO_EVIDENCE}.

With no ANTHROPIC_API_KEY set, the council runs in offline mode (deterministic,
clearly-labelled [SIMULATED] output) so you can see the full loop. Set a key
(or pass --live) for real model deliberation through the same code path.`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const bandFor = (score) =>
  MATURITY_BANDS.find((b) => score >= b.min && score <= b.max)?.label || 'unknown';

/* ── Prompt builders ──────────────────────────────────────── */
function evidenceBlock(items) {
  if (!items.length) {
    return 'No new real-world evidence this round. Treat the brief as unvalidated hypotheses.';
  }
  return (
    `NEW REAL-WORLD EVIDENCE this round (${items.length} item(s) — this is ground truth, weight it heavily):\n` +
    items.map((it) => `--- ${it.name} ---\n${it.text}`).join('\n\n')
  );
}

const baseContext = (ctx, evidence) =>
  `# DebtIQ — the business under advisement\n${BRIEF}\n\n# Where things stand\n${ctx.recap}\n\n# Evidence\n${evidenceBlock(evidence.items)}`;

/* Step 2 — each member surfaces their single biggest problem. */
async function findProblem(member, ctx, evidence) {
  const system = `You are "${member.name}", an advisor on the DebtIQ council.
Your lens: ${member.role}.
${member.lens}
Find the SINGLE problem, through your lens, most likely to sink this business.
One problem only — your sharpest one. Be concrete and specific to DebtIQ, not
generic startup advice. Reply with VALID JSON ONLY.`;

  const prompt = `${baseContext(ctx, evidence)}

Return JSON:
{
  "problem": "one sentence naming the single biggest threat through your lens",
  "why_fatal": "2-3 sentences on why this could actually sink DebtIQ",
  "evidence_needed": "the one piece of real-world data that would confirm or kill this concern",
  "confidence": 0.0-1.0
}`;

  try {
    const j = await askJson({
      system,
      prompt,
      model: ctx.cfg.model,
      maxTokens: ctx.cfg.maxTokens,
      temperature: ctx.cfg.temperature,
    });
    return { member: member.name, role: member.role, ...j };
  } catch (e) {
    return {
      member: member.name,
      role: member.role,
      problem: `(no usable response: ${e.message})`,
      why_fatal: '',
      evidence_needed: '',
      confidence: 0,
      error: true,
    };
  }
}

/* Step 3 — Chair forces focus + scores maturity. */
async function chairAgenda(problems, ctx, evidence) {
  const system = `${CHAIR.persona}
You score MATURITY 0-100 — how close DebtIQ is to a sustainable, expandable
business. Bands: ${MATURITY_BANDS.map((b) => `${b.min}-${b.max} ${b.label}`).join(' | ')}.
Iron rule: PLANS AND ANALYSIS DO NOT RAISE THE SCORE. Only validated reality
(paying brokers, retention, real per-deal cost, signed distribution) earns
above 50. Reply with VALID JSON ONLY.`;

  const raised = problems
    .map((p) => `- [${p.member}] ${p.problem} (why: ${p.why_fatal})`)
    .join('\n');

  const prompt = `${baseContext(ctx, evidence)}

The members each raised their single biggest problem:
${raised}

Current maturity is ${ctx.memory.maturity}/100. You may not move it by more than
${TUNABLES.MAX_MATURITY_JUMP_PER_ROUND} points this round, and not above
${TUNABLES.MATURITY_CAP_NO_EVIDENCE} unless this round contains real-world evidence.

Return JSON:
{
  "agenda": [
    { "title": "the 2-3 highest-leverage problems to focus on now",
      "raised_by": ["member name(s)"],
      "rationale": "why this is highest leverage" }
  ],
  "maturity": 0-100,
  "maturity_rationale": "what the number reflects and why it did/didn't move",
  "what_unlocks_next_band": "the specific validated reality needed to climb"
}
Provide 2 or 3 agenda items, no more.`;

  return askJson({
    system,
    prompt,
    model: ctx.cfg.model,
    maxTokens: ctx.cfg.maxTokens,
    temperature: 0.4,
  });
}

/* Step 4 — sharpest fix + prioritized actions per agenda item. */
async function solve(agenda, ctx, evidence) {
  const system = `You are the DebtIQ council in solution mode. For each agenda
problem give the SHARPEST fix and 3-5 prioritized actions — cheapest validation
FIRST. Distinguish what can be reasoned from what only real-world data can
answer. No busywork; bias to the cheapest test that could prove you wrong.
Reply with VALID JSON ONLY.`;

  const list = agenda.agenda.map((a, i) => `${i + 1}. ${a.title} — ${a.rationale}`).join('\n');

  const prompt = `${baseContext(ctx, evidence)}

Agenda for this round:
${list}

Return JSON:
{
  "solutions": [
    {
      "problem": "the agenda item",
      "sharpest_fix": "the single most effective response",
      "actions": [
        { "action": "concrete step", "cost": "cheap|medium|expensive", "priority": 1 }
      ],
      "data_questions": ["questions only real-world data can answer"]
    }
  ]
}`;

  return askJson({
    system,
    prompt,
    model: ctx.cfg.model,
    maxTokens: ctx.cfg.maxTokens,
    temperature: 0.5,
  });
}

/* Step 5 — risk sentinel scans the whole round for red flags. */
async function redFlagScan(round, ctx, evidence) {
  const system = `${SENTINEL.persona}
Categories: "compliance" | "cash" | "fatal-risk" | "building-without-validation".
Severity 1-5 (5 = drop everything). Reply with VALID JSON ONLY.`;

  const digest = `Problems raised:\n${round.problems
    .map((p) => `- [${p.member}] ${p.problem}`)
    .join('\n')}

Chair maturity: ${round.maturityRaw}/100 — ${round.agenda.maturity_rationale}

Solutions/actions:\n${(round.solutions.solutions || [])
    .map(
      (s) =>
        `- ${s.problem}: ${s.sharpest_fix} [actions: ${(s.actions || [])
          .map((a) => a.action)
          .join('; ')}]`
    )
    .join('\n')}`;

  const prompt = `${baseContext(ctx, evidence)}

This round produced:
${digest}

Scan for red flags a DebtIQ founder must see now. Return JSON:
{
  "flags": [
    {
      "category": "compliance|cash|fatal-risk|building-without-validation",
      "severity": 1-5,
      "summary": "one line",
      "detail": "what and why it matters",
      "recommended_action": "the single next move"
    }
  ]
}
Return an empty array if nothing genuinely warrants interrupting a human.`;

  try {
    const j = await askJson({
      system,
      prompt,
      model: ctx.cfg.model,
      maxTokens: ctx.cfg.maxTokens,
      temperature: 0.3,
    });
    return Array.isArray(j.flags) ? j.flags : [];
  } catch {
    return [];
  }
}

/* ── Maturity governor ────────────────────────────────────── */
function governMaturity(rawScore, hasEvidenceEver, memory) {
  let score = Math.max(0, Math.min(100, Math.round(Number(rawScore) || 0)));
  const notes = [];

  if (!hasEvidenceEver && score > TUNABLES.MATURITY_CAP_NO_EVIDENCE) {
    notes.push(
      `capped at ${TUNABLES.MATURITY_CAP_NO_EVIDENCE} (no real-world evidence ingested yet)`
    );
    score = TUNABLES.MATURITY_CAP_NO_EVIDENCE;
  }

  const jump = score - memory.maturity;
  if (jump > TUNABLES.MAX_MATURITY_JUMP_PER_ROUND) {
    notes.push(`climb throttled to +${TUNABLES.MAX_MATURITY_JUMP_PER_ROUND}/round`);
    score = memory.maturity + TUNABLES.MAX_MATURITY_JUMP_PER_ROUND;
  }
  return { score, notes };
}

/* Stall = score barely moved across the stall window. */
function isStalled(history) {
  const w = TUNABLES.STALL_WINDOW;
  if (history.length < w) return false;
  const recent = history.slice(-w).map((h) => h.score);
  return Math.max(...recent) - Math.min(...recent) <= TUNABLES.STALL_DELTA;
}

/* ── Persistence + rendering ──────────────────────────────── */
function renderLatest(round) {
  const { number, maturity, band, agenda, solutions, problems, flags, evidenceCount } = round;
  const lines = [];
  lines.push(`# DebtIQ Council — Round ${number}`);
  lines.push(`_${new Date().toISOString()}_\n`);
  lines.push(`**Maturity:** ${maturity}/100 — ${band}`);
  if (round.maturityNotes.length) lines.push(`_governor: ${round.maturityNotes.join('; ')}_`);
  lines.push(`**Evidence ingested (cumulative):** ${evidenceCount}\n`);

  lines.push(`## Agenda (forced focus)`);
  for (const a of agenda.agenda || []) {
    lines.push(`- **${a.title}** — ${a.rationale} _(raised by ${(a.raised_by || []).join(', ')})_`);
  }
  lines.push(`\n_What unlocks the next band:_ ${agenda.what_unlocks_next_band || '—'}\n`);

  lines.push(`## Solutions & actions`);
  for (const s of solutions.solutions || []) {
    lines.push(`### ${s.problem}`);
    lines.push(`**Sharpest fix:** ${s.sharpest_fix}`);
    const actions = [...(s.actions || [])].sort((a, b) => (a.priority || 9) - (b.priority || 9));
    for (const a of actions) lines.push(`- [${a.cost}] ${a.action}`);
    if (s.data_questions?.length) {
      lines.push(`_Data questions:_ ${s.data_questions.join(' · ')}`);
    }
    lines.push('');
  }

  lines.push(`## Every member's problem`);
  for (const p of problems) {
    lines.push(`- **${p.member}** (${p.role}): ${p.problem}`);
  }

  lines.push(`\n## Red flags this round`);
  if (!flags.length) lines.push(`_None above the noise floor._`);
  for (const f of flags) {
    lines.push(`- \`${f.category}\` **sev ${f.severity}** — ${f.summary} → ${f.recommended_action}`);
  }
  return lines.join('\n') + '\n';
}

async function emitRedFlags(flags, threshold, round) {
  const pinged = flags.filter((f) => (f.severity || 0) >= threshold);

  // Always append the full scan to the log.
  if (flags.length) {
    const md =
      `\n## Round ${round} — ${new Date().toISOString()}\n` +
      flags
        .map(
          (f) =>
            `- \`${f.category}\` **sev ${f.severity}**${
              f.severity >= threshold ? ' 🔔' : ''
            } — ${f.summary}\n  - ${f.detail}\n  - → ${f.recommended_action}`
        )
        .join('\n') +
      '\n';
    await appendRedFlags(md);
  }

  // Terminal + push for the ones above threshold.
  for (const f of pinged) {
    console.log(
      `\n🔔 RED FLAG [${f.category} · sev ${f.severity}] ${f.summary}\n   ${f.detail}\n   → ${f.recommended_action}`
    );
  }
  if (pinged.length) {
    const title = `DebtIQ: ${pinged.length} red flag(s) (round ${round})`;
    const message = pinged
      .map((f) => `• [${f.category} sev ${f.severity}] ${f.summary} → ${f.recommended_action}`)
      .join('\n');
    const sent = await pushAlert(title, message);
    const channels = Object.entries(sent)
      .filter(([, ok]) => ok)
      .map(([k]) => k);
    if (channels.length) console.log(`   (pushed via ${channels.join(', ')})`);
  }
  return pinged.length;
}

/* ── One full round ───────────────────────────────────────── */
async function runRound(cfg, memory) {
  const number = memory.lastRound + 1;
  console.log(`\n${'═'.repeat(60)}\n🏛  Round ${number}  ·  model ${cfg.model}\n${'═'.repeat(60)}`);

  // 1. Ingest evidence (and archive it).
  const evidence = await ingestEvidence();
  if (evidence.count) console.log(`📥 Ingested ${evidence.count} evidence item(s).`);
  memory.evidenceCount += evidence.count;
  const hasEvidenceEver = memory.evidenceCount > 0;

  const ctx = { cfg, memory, recap: recentContext(memory) };

  // 2. Problem-finding — all members in parallel.
  console.log(`🔎 ${MEMBERS.length} advisors hunting for the fatal problem…`);
  const problems = await Promise.all(MEMBERS.map((m) => findProblem(m, ctx, evidence)));

  // 3. Chair: agenda + maturity.
  console.log(`⚖️  Chair forcing focus + scoring maturity…`);
  const agenda = await chairAgenda(problems, ctx, evidence);
  const { score: maturity, notes: maturityNotes } = governMaturity(
    agenda.maturity,
    hasEvidenceEver,
    memory
  );
  const band = bandFor(maturity);
  console.log(`   maturity ${memory.maturity} → ${maturity}/100 (${band})`);
  if (maturityNotes.length) console.log(`   governor: ${maturityNotes.join('; ')}`);

  // 4. Solutions + actions.
  console.log(`🛠  Drawing the sharpest fixes + cheapest-first actions…`);
  const solutions = await solve(agenda, ctx, evidence);

  // 5. Red-flag scan.
  console.log(`🚨 Sentinel scanning for red flags…`);
  const roundForScan = { problems, agenda, solutions, maturityRaw: agenda.maturity };
  const flags = await redFlagScan(roundForScan, ctx, evidence);
  const pinged = await emitRedFlags(flags, cfg.severity, number);
  console.log(
    `   ${flags.length} flag(s), ${pinged} at/above severity ${cfg.severity}.`
  );

  // 6. Persist + carry forward.
  const round = {
    number,
    timestamp: new Date().toISOString(),
    model: cfg.model,
    evidenceThisRound: evidence.items.map((i) => i.name),
    evidenceCount: memory.evidenceCount,
    problems,
    agenda,
    solutions,
    flags,
    maturity,
    maturityRaw: agenda.maturity,
    maturityNotes,
    band,
  };

  await writeRoundRecord(number, round);
  await writeLatest(renderLatest(round));

  memory.lastRound = number;
  memory.maturity = maturity;
  memory.maturityHistory.push({ round: number, score: maturity });
  memory.rounds.push({
    round: number,
    maturity,
    agenda: (agenda.agenda || []).map((a) => a.title),
  });
  // Carry the agenda forward as commitments for the next round to build on.
  memory.decisions.push(
    ...(agenda.agenda || []).map((a) => `R${number}: ${a.title}`)
  );
  memory.decisions = memory.decisions.slice(-24); // bound the carry-forward
  await saveMemory(memory);

  console.log(`💾 Saved round ${number}. → state/LATEST.md`);
  return { round, stalled: isStalled(memory.maturityHistory) };
}

/* ── Stall handling ───────────────────────────────────────── */
async function announceStall(memory) {
  console.log(
    `\n⏸  STALL — maturity has flatlined at ${memory.maturity}/100 for ${TUNABLES.STALL_WINDOW} rounds.`
  );
  console.log(
    `   The council cannot make this number climb by reasoning alone. Go validate something real`
  );
  console.log(
    `   and drop the finding (paying broker, real per-deal cost, retention, signed distribution)`
  );
  console.log(`   into ./evidence — it will resume automatically.`);
  await pushAlert(
    'DebtIQ Council stalled',
    `Maturity flatlined at ${memory.maturity}/100. Drop real-world evidence into ./evidence to resume.`
  );
}

/* ── Main loop ────────────────────────────────────────────── */
async function main() {
  const cfg = parseArgs(process.argv);
  await ensureDirs();
  const memory = await loadMemory();

  const offline = isOffline();
  console.log(
    `DebtIQ Council 🏛  — mode: ${cfg.mode} · ${offline ? 'OFFLINE (simulated)' : `live · ${cfg.model}`}`
  );
  if (offline) {
    console.log(
      '⚠  No ANTHROPIC_API_KEY → offline mode: output is deterministic and [SIMULATED],\n' +
        '   not real model analysis. Set a key (or pass --live) for genuine deliberation.'
    );
  } else if (!process.env.ANTHROPIC_API_KEY) {
    // --live (or COUNCIL_OFFLINE=0) forced live, but there is no key.
    console.error(
      '\n✗ Live mode requires ANTHROPIC_API_KEY. Set it in .env, or drop --live to run\n' +
        '  in offline/simulated mode.'
    );
    process.exit(1);
  }

  // Single round.
  if (cfg.mode === 'once') {
    await runRound(cfg, memory);
    return;
  }

  // Fixed number of rounds — stop early on a stall.
  if (cfg.mode === 'rounds') {
    for (let i = 0; i < cfg.rounds; i++) {
      const { stalled } = await runRound(cfg, memory);
      if (stalled) {
        await announceStall(memory);
        break;
      }
      if (i < cfg.rounds - 1) {
        console.log(`\n⏱  next round in ${cfg.interval}s…`);
        await sleep(cfg.interval * 1000);
      }
    }
    return;
  }

  // Continuous, unattended.
  for (;;) {
    const stalledBefore = isStalled(memory.maturityHistory);
    if (stalledBefore && !(await evidencePending())) {
      // Don't burn calls reasoning in a vacuum — wait for ground truth.
      await sleep(cfg.interval * 1000);
      continue;
    }
    if (stalledBefore) {
      console.log(`\n▶️  New evidence detected — resuming from stall.`);
    }
    const { stalled } = await runRound(cfg, memory);
    if (stalled && !(await evidencePending())) await announceStall(memory);
    console.log(`\n⏱  next round in ${cfg.interval}s…`);
    await sleep(cfg.interval * 1000);
  }
}

main().catch((err) => {
  console.error('\n✗ Council crashed:', err?.stack || err?.message || err);
  process.exit(1);
});
