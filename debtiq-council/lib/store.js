/* ============================================================
   lib/store.js — durable memory + evidence inbox
   The council's only persistence. Memory carries decisions and
   the maturity history forward so each round builds on the last.
   Evidence is real-world ground truth you drop into ./evidence;
   it is read once, folded into the round, then archived.
   ============================================================ */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

export const PATHS = {
  state: path.join(ROOT, 'state'),
  rounds: path.join(ROOT, 'state', 'rounds'),
  memory: path.join(ROOT, 'state', 'memory.json'),
  latest: path.join(ROOT, 'state', 'LATEST.md'),
  redFlags: path.join(ROOT, 'state', 'RED-FLAGS.md'),
  evidence: path.join(ROOT, 'evidence'),
  archive: path.join(ROOT, 'evidence', '_archive'),
};

const EVIDENCE_EXT = new Set(['.md', '.txt', '.json', '.csv']);
const MAX_EVIDENCE_CHARS = 12000; // keep a single dropped file from blowing the context

const FRESH_MEMORY = {
  createdAt: null,
  lastRound: 0,
  evidenceCount: 0, // cumulative real-world items ever ingested
  maturity: 0,
  maturityHistory: [], // [{ round, score }]
  decisions: [], // carried-forward agenda items / commitments
  rounds: [], // compact per-round summaries
};

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

export async function ensureDirs() {
  await Promise.all([
    ensureDir(PATHS.state),
    ensureDir(PATHS.rounds),
    ensureDir(PATHS.evidence),
  ]);
}

export async function loadMemory() {
  try {
    const raw = await fs.readFile(PATHS.memory, 'utf8');
    return { ...structuredClone(FRESH_MEMORY), ...JSON.parse(raw) };
  } catch {
    return { ...structuredClone(FRESH_MEMORY), createdAt: new Date().toISOString() };
  }
}

export async function saveMemory(mem) {
  await ensureDir(PATHS.state);
  await fs.writeFile(PATHS.memory, JSON.stringify(mem, null, 2), 'utf8');
}

/** True if there is at least one unprocessed evidence file waiting. */
export async function evidencePending() {
  try {
    const entries = await fs.readdir(PATHS.evidence, { withFileTypes: true });
    return entries.some(
      (e) =>
        e.isFile() &&
        !e.name.startsWith('.') &&
        e.name.toLowerCase() !== 'readme.md' &&
        EVIDENCE_EXT.has(path.extname(e.name).toLowerCase())
    );
  } catch {
    return false;
  }
}

/**
 * Read every evidence file, then move them into ./evidence/_archive/<ts>/.
 * Returns { items: [{ name, text }], count }.
 */
export async function ingestEvidence() {
  await ensureDir(PATHS.evidence);
  let entries;
  try {
    entries = await fs.readdir(PATHS.evidence, { withFileTypes: true });
  } catch {
    return { items: [], count: 0 };
  }

  const files = entries.filter(
    (e) =>
      e.isFile() &&
      !e.name.startsWith('.') &&
      e.name.toLowerCase() !== 'readme.md' &&
      EVIDENCE_EXT.has(path.extname(e.name).toLowerCase())
  );
  if (files.length === 0) return { items: [], count: 0 };

  const items = [];
  for (const f of files) {
    const full = path.join(PATHS.evidence, f.name);
    let text = await fs.readFile(full, 'utf8');
    if (text.length > MAX_EVIDENCE_CHARS) {
      text = text.slice(0, MAX_EVIDENCE_CHARS) + '\n…[truncated]';
    }
    items.push({ name: f.name, text });
  }

  // Archive so the same file is never counted twice.
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(PATHS.archive, stamp);
  await ensureDir(dest);
  for (const f of files) {
    await fs.rename(path.join(PATHS.evidence, f.name), path.join(dest, f.name));
  }

  return { items, count: items.length };
}

export async function writeRoundRecord(round, record) {
  await ensureDir(PATHS.rounds);
  const file = path.join(PATHS.rounds, `round-${String(round).padStart(4, '0')}.json`);
  await fs.writeFile(file, JSON.stringify(record, null, 2), 'utf8');
  return file;
}

export async function writeLatest(markdown) {
  await ensureDir(PATHS.state);
  await fs.writeFile(PATHS.latest, markdown, 'utf8');
}

export async function appendRedFlags(markdown) {
  await ensureDir(PATHS.state);
  let header = '';
  try {
    await fs.access(PATHS.redFlags);
  } catch {
    header = '# DebtIQ Council — Red Flags\n\nAppend-only log of flags at or above your severity threshold.\n';
  }
  await fs.appendFile(PATHS.redFlags, header + markdown, 'utf8');
}

/**
 * A compact textual recap of where things stand, fed into every advisor prompt
 * so the council builds on itself instead of restarting each round.
 */
export function recentContext(mem, lookback = 4) {
  const lines = [];
  lines.push(`Round about to run: ${mem.lastRound + 1}`);
  lines.push(`Current maturity score: ${mem.maturity}/100`);
  lines.push(`Real-world evidence items ingested to date: ${mem.evidenceCount}`);

  const recentRounds = mem.rounds.slice(-lookback);
  if (recentRounds.length) {
    lines.push('\nRecent rounds:');
    for (const r of recentRounds) {
      lines.push(`- R${r.round} (maturity ${r.maturity}): agenda → ${r.agenda.join('; ')}`);
    }
  }

  const openDecisions = mem.decisions.slice(-6);
  if (openDecisions.length) {
    lines.push('\nCarried-forward focus / commitments:');
    for (const d of openDecisions) lines.push(`- ${d}`);
  }

  return lines.join('\n');
}
