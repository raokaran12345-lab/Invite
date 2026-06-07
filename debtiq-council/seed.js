#!/usr/bin/env node
/* ============================================================
   seed.js — copy committed, version-controlled ground truth from
   ./evidence-seed into the council's ./evidence inbox so the next
   round folds it in. The inbox itself is gitignored (real evidence
   is private); evidence-seed/ is the durable, shareable subset that
   travels with the repo. Run: npm run seed
   ============================================================ */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED = path.join(__dirname, 'evidence-seed');
const INBOX = path.join(__dirname, 'evidence');

const run = async () => {
  let files;
  try {
    files = await fs.readdir(SEED, { withFileTypes: true });
  } catch {
    console.log('No evidence-seed/ directory — nothing to seed.');
    return;
  }
  await fs.mkdir(INBOX, { recursive: true });
  let n = 0;
  for (const f of files) {
    if (!f.isFile() || f.name.startsWith('.')) continue;
    await fs.copyFile(path.join(SEED, f.name), path.join(INBOX, f.name));
    console.log('seeded →', f.name);
    n++;
  }
  console.log(
    n
      ? `\nCopied ${n} seed file(s) into evidence/. Run \`node council.js --once\` to fold them in.`
      : 'evidence-seed/ is empty — nothing to seed.'
  );
};

run().catch((e) => {
  console.error('seed failed:', e.message);
  process.exit(1);
});
