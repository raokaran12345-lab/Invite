/* ============================================================
   DebtIQ — Document forensics / tamper-signal detection
   POST /api/forensics  (Cloudflare Pages Function)
   Three layers, all server-side:
     1. PDF metadata & structure forensics (pure JS, no AI)
     2. AI visual/content forensics (Claude vision via the key held here)
     3. Cross-document consistency (AI, mode:'crosscheck')
   Key stays server-side; requires a valid Supabase session.
   HONESTY: this detects TAMPERING SIGNALS. A clean result means
   "no signals found", NOT that a document is authentic/genuine.
   ============================================================ */
import { CORS, json, corsPreflight, requireSupabaseSession, parseJsonLoose } from './_lib.js';

const DISCLAIMER = 'Signal-based analysis. Absence of signals is not proof of authenticity. A clean result means no tampering indicators were found, not that the document is verified genuine.';

// Consumer editors that legitimate bank/payroll PDFs are essentially never produced by.
const EDIT_TOOLS = ['photoshop','illustrator','acrobat pro','pdfescape','ilovepdf','smallpdf',
  'foxit phantompdf','sejda','pdf-xchange editor','nitro pro','canva'];

const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

/* ---------- scoring ---------- */
function scoreFindings(findings){
  const hasHigh = findings.some(f => f.severity === 'high');
  const hasMed  = findings.some(f => f.severity === 'medium');
  if (hasHigh) return { status: 'REVIEW REQUIRED', integrity: 'Tampering signals detected' };
  if (hasMed)  return { status: 'CAUTION',         integrity: 'Minor anomalies — verify manually' };
  return            { status: 'CLEAR',           integrity: 'No tampering signals detected' };
}

/* ---------- LAYER 1: PDF metadata & structure (pure JS) ---------- */
function parsePdfDate(s){
  // PDF date: D:YYYYMMDDHHmmSS...
  const m = /D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?/.exec(s || '');
  if (!m) return null;
  const [, y, mo='01', d='01', h='00', mi='00', se='00'] = m;
  const dt = new Date(Date.UTC(+y, (+mo||1)-1, +d||1, +h, +mi, +se));
  return isNaN(dt.getTime()) ? null : dt;
}
function metadataForensics(base64){
  const findings = [];
  let str = '';
  // atob() decodes base64 → a binary string (each char is the byte value 0-255),
  // exactly the same payload Buffer.from(b64,'base64').toString('latin1') produced
  // on the Netlify (Node) runtime.
  try { str = atob(base64); } catch (e) { return findings; }
  if (str.slice(0, 1024).indexOf('%PDF') === -1 && str.indexOf('%PDF') === -1) return findings; // not a PDF

  const grab = (re) => { const m = re.exec(str); return m ? m[1] : ''; };
  const producer = grab(/\/Producer\s*\(([^)]{0,200})\)/);
  const creator  = grab(/\/Creator\s*\(([^)]{0,200})\)/);
  const creationRaw = grab(/\/CreationDate\s*\(([^)]{0,40})\)/);
  const modRaw      = grab(/\/ModDate\s*\(([^)]{0,40})\)/);

  // META01 — Producer/Creator is a known editing tool
  const tool = [producer, creator].map(s => (s || '').toLowerCase());
  const hit = EDIT_TOOLS.find(t => tool.some(s => s.includes(t)));
  if (hit) findings.push({ layer:'metadata', severity:'high', code:'META01',
    finding:'Produced by a known editing tool',
    detail:`PDF Producer/Creator contains "${hit}" (${producer || creator}). Bank/payroll PDFs are not legitimately produced by image/PDF editors.` });

  // META02 — Modified after creation
  const created = parsePdfDate(creationRaw), modified = parsePdfDate(modRaw);
  if (created && modified && modified.getTime() > created.getTime()) {
    const gapH = (modified - created) / 36e5;
    findings.push({ layer:'metadata', severity: gapH > 24 ? 'medium' : 'low', code:'META02',
      finding:'Modified after creation date',
      detail:`CreationDate ${created.toISOString().slice(0,10)} → ModDate ${modified.toISOString().slice(0,10)} (re-saved ${gapH>24?Math.round(gapH/24)+' day(s)':Math.round(gapH)+' hour(s)'} later).` });
  }

  // META03 — Multiple revisions / incremental saves
  const eofs = (str.match(/%%EOF/g) || []).length;
  if (eofs > 1) findings.push({ layer:'metadata', severity:'medium', code:'META03',
    finding:'Multiple revisions / incremental saves detected',
    detail:`Found ${eofs} %%EOF markers — the file was saved/edited after its initial export.` });

  // META04 — Touch-up text-edit traces
  if (/TouchUp_TextEdit/.test(str)) findings.push({ layer:'metadata', severity:'high', code:'META04',
    finding:'Touch-up text-edit traces found',
    detail:'A /TouchUp_TextEdit marker is present — text content was manually edited in a PDF editor.' });

  // META05 — Font embedding inconsistency in (likely) numeric/value fields
  const fonts = Array.from(str.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+\-_.,]{1,80})/g)).map(m => m[1]);
  const uniq = [...new Set(fonts)];
  const subset   = uniq.some(f => /^[A-Z]{6}\+/.test(f));            // e.g. ABCDEF+Arial
  const baseSys  = uniq.some(f => /(Helvetica|Arial|Times|Courier)/i.test(f) && !/^[A-Z]{6}\+/.test(f));
  if (subset && baseSys) findings.push({ layer:'metadata', severity:'low', code:'META05',
    finding:'Mixed embedded and system fonts',
    detail:`Document mixes embedded subset fonts with non-embedded system fonts (${uniq.slice(0,4).join(', ')}). Coarse signal — verify that numeric fields use the same font as surrounding text.` });

  // META06 — No metadata at all (stripped)
  if (!producer && !creator && !creationRaw) findings.push({ layer:'metadata', severity:'medium', code:'META06',
    finding:'No document metadata',
    detail:'No Producer, Creator or CreationDate present — metadata was stripped, which is itself unusual for a genuine bank/payroll export.' });

  return findings;
}

/* ---------- Anthropic helper ---------- */
async function callAnthropic(key, { system, content, max_tokens }){
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type':'application/json', 'x-api-key': key, 'anthropic-version':'2023-06-01' },
    body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: max_tokens || 1200, system, messages: [{ role:'user', content }] })
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data && data.error && data.error.message) || 'Anthropic API error');
  return (data && data.content && data.content[0] && data.content[0].text) || '';
}

const VISUAL_SYSTEM =
`You are a forensic document examiner specialising in Australian financial documents (payslips, bank statements, tax returns, NOAs). Examine this document image for signs of digital tampering or fabrication. Look for:
- Misaligned text baselines or inconsistent character spacing in numbers
- Font weight/size changes within the same field (sign of overtyping)
- Background pattern interruptions behind numbers (cloning/whiteout)
- Arithmetic that doesn't add up (YTD vs gross, net vs gross-minus-tax, running balance vs transactions)
- Inconsistent date formats or impossible dates
- Logos that are low-resolution relative to the rest of the document
- Alignment of tabular data (genuine statements have rigid grids)
Report ONLY what you observe. Do NOT guess. For each observation give a severity (high/medium/low) and the specific location. If you see nothing suspicious, say so explicitly. Respond ONLY in this JSON format:
{"observations":[{"severity":"...","area":"...","observation":"..."}],"arithmetic_checks":[{"check":"...","result":"pass"|"fail","detail":"..."}],"overall":"..."}`;

async function visualForensics(key, images){
  if (!key || !images || !images.length) return [];
  const content = images.slice(0, 4)
    .filter(im => im && im.data && im.media_type)
    .map(im => ({ type:'image', source:{ type:'base64', media_type: im.media_type, data: im.data } }));
  if (!content.length) return [];
  content.push({ type:'text', text:'Examine the attached document image(s) and respond in the required JSON only.' });
  const text = await callAnthropic(key, { system: VISUAL_SYSTEM, content, max_tokens: 1400 });
  const parsed = parseJsonLoose(text);
  const findings = [];
  if (!parsed) return findings;
  let i = 0;
  (parsed.observations || []).forEach(o => {
    const sev = ['high','medium','low'].includes(o.severity) ? o.severity : 'low';
    findings.push({ layer:'visual', severity: sev, code:'VIS' + String(++i).padStart(2,'0'),
      finding: o.observation || 'Visual observation', detail: o.area ? ('Area: ' + o.area) : '' });
  });
  let j = 0;
  (parsed.arithmetic_checks || []).forEach(c => {
    if (c && c.result === 'fail') findings.push({ layer:'visual', severity:'high', code:'ARI' + String(++j).padStart(2,'0'),
      finding: 'Arithmetic does not reconcile: ' + (c.check || ''), detail: c.detail || '' });
  });
  return findings;
}

const CROSSCHECK_SYSTEM =
`You are auditing a mortgage application for internal consistency. Below are extracted figures from multiple documents for the same applicant. Identify any contradictions that would indicate fabrication or error:
- Income on the application vs payslip YTD annualised vs NOA vs salary credits in the bank statement
- Employer name consistency across payslip and bank salary descriptor
- Account numbers / BSBs consistency
- Dates that don't align (employment start, statement periods)
For each contradiction, give severity and the two conflicting values. Respond ONLY in JSON: {"contradictions":[{"severity":"...","field":"...","value_a":"...","source_a":"...","value_b":"...","source_b":"...","note":"..."}]}`;

async function crossCheck(key, documents){
  if (!key) throw new Error('AI unavailable');
  const content = [{ type:'text', text: 'Documents (JSON):\n' + JSON.stringify(documents, null, 2) }];
  const text = await callAnthropic(key, { system: CROSSCHECK_SYSTEM, content, max_tokens: 1200 });
  const parsed = parseJsonLoose(text) || {};
  const findings = (parsed.contradictions || []).map((c, i) => ({
    layer:'crosscheck',
    severity: ['high','medium','low'].includes(c.severity) ? c.severity : 'medium',
    code: 'XCK' + String(i+1).padStart(2,'0'),
    finding: (c.field || 'Field') + ' mismatch',
    detail: `${c.value_a} (${c.source_a}) vs ${c.value_b} (${c.source_b})${c.note ? ' — ' + c.note : ''}`,
    value_a: c.value_a, source_a: c.source_a, value_b: c.value_b, source_b: c.source_b
  }));
  return findings;
}

/* ---------- handler ---------- */
export const onRequestOptions = () => corsPreflight();

export const onRequestPost = async ({ request, env }) => {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) return json(500, { error: 'ANTHROPIC_API_KEY not configured on the server' });

  const authFail = await requireSupabaseSession(request, env);
  if (authFail) return authFail;

  let body;
  try { body = await request.json(); } catch (e) { return json(400, { error: 'Bad JSON' }); }

  // ---- Cross-document consistency mode ----
  if (body.mode === 'crosscheck') {
    const documents = Array.isArray(body.documents) ? body.documents : [];
    if (documents.length < 2) return json(400, { error: 'Need at least 2 documents to cross-check' });
    try {
      const findings = await crossCheck(key, documents);
      const { status, integrity } = scoreFindings(findings);
      return json(200, { mode:'crosscheck', dealId: body.dealId || null, status, integrity,
        findings, checked: documents.length, analysedAt: new Date().toISOString(), disclaimer: DISCLAIMER });
    } catch (e) { return json(502, { error: 'Cross-check failed: ' + e.message }); }
  }

  // ---- Single-document forensic mode ----
  const fileName = String(body.fileName || 'document');
  const mimeType = String(body.mimeType || '');
  const base64   = typeof body.base64 === 'string' ? body.base64 : '';
  const images   = Array.isArray(body.images) ? body.images : [];

  const findings = [];
  // Layer 1 — metadata (PDF only)
  if (mimeType === 'application/pdf' && base64) {
    try { findings.push(...metadataForensics(base64)); } catch (e) { /* non-fatal */ }
  }
  // Layer 2 — AI visual (images: rasterised PDF pages or an uploaded image)
  let visualImages = images;
  if (!visualImages.length && base64 && mimeType.startsWith('image/')) {
    visualImages = [{ media_type: mimeType, data: base64 }];
  }
  try { findings.push(...await visualForensics(key, visualImages)); }
  catch (e) { findings.push({ layer:'visual', severity:'info', code:'VIS00', finding:'Visual analysis unavailable', detail: e.message }); }

  const { status, integrity } = scoreFindings(findings);
  return json(200, {
    fileName, status, integrity, findings,
    analysedAt: new Date().toISOString(),
    disclaimer: DISCLAIMER
  });
};

export const onRequest = () => json(405, { error: 'Method not allowed' });
