/* ============================================================
   DebtIQ — Document extraction (Cloudflare Pages Function)
   POST /api/extract
   Real OCR via Claude vision / PDF. Accepts base64 files, returns
   structured income/liability data the calculator can ingest. Key
   stays server-side; requires a valid Supabase session.
   ============================================================ */
import { CORS, json, corsPreflight, requireSupabaseSession, parseJsonLoose } from './_lib.js';

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];

export const onRequestOptions = () => corsPreflight();

export const onRequestPost = async ({ request, env }) => {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) return json(500, { error: 'ANTHROPIC_API_KEY not configured on the server' });

  const authFail = await requireSupabaseSession(request, env);
  if (authFail) return authFail;

  let body;
  try { body = await request.json(); } catch (e) { return json(400, { error: 'Bad JSON' }); }
  const files = Array.isArray(body.files) ? body.files.slice(0, 6) : [];
  if (!files.length) return json(400, { error: 'No files provided' });

  // Build Anthropic content blocks (image or PDF), each capped to keep payloads sane.
  const content = [];
  for (const f of files) {
    if (!f || !ALLOWED.includes(f.media_type) || typeof f.data !== 'string') continue;
    if (f.data.length > 9_000_000) continue;   // ~6.5MB raw; skip oversized
    content.push(f.media_type === 'application/pdf'
      ? { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data } }
      : { type: 'image', source: { type: 'base64', media_type: f.media_type, data: f.data } });
  }
  if (!content.length) return json(400, { error: 'No supported files (png/jpeg/webp/pdf, under ~6MB each)' });

  // ---- Type-aware extraction mode (document intelligence) ----
  if (Array.isArray(body.schema) && body.schema.length) {
    const docType = String(body.docType || 'document');
    content.push({ type: 'text', text:
`Extract the following fields from this ${docType}. For each field return the value and a confidence 0-100. If a field is not present, return null. Respond ONLY in JSON: {"fields":{${body.schema.map(f => `"${f}":{"value":...,"confidence":...,"source_text":"<the text you read it from>"}`).join(',')}}}` });
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content }] })
      });
      const data = await res.json();
      if (!res.ok) return json(res.status, { error: (data && data.error && data.error.message) || 'Anthropic API error' });
      const text = (data && data.content && data.content[0] && data.content[0].text) || '';
      const parsed = parseJsonLoose(text);
      return json(200, { docType, fields: (parsed && parsed.fields) || {}, raw: parsed ? undefined : text });
    } catch (e) { return json(502, { error: 'Upstream request failed' }); }
  }

  content.push({ type: 'text', text:
`You are extracting mortgage application data from the attached document(s) for an Australian broker.
Return ONLY a JSON object (no prose, no code fences) of this exact shape:
{
  "applicant_name": string,
  "incomes": [ { "type": one of ["salary_ft","salary_pt","self_emp","freelance","overtime","bonus","commission","rental_res","rental_com","dividends","trust_dist","pension","family","foreign","boarder","interest"], "amount_y1": number, "amount_y2": number } ],
  "liabilities": [ { "type": one of ["mortgage","personal","car","credit_card","hecs","bnpl","other"], "balance": number, "rate": number, "term": number } ]
}
Use annual gross figures for income (amount_y1 = most recent FY, amount_y2 = prior FY if shown, else 0). For credit cards use the limit as balance. Omit fields you cannot read; never invent values. If nothing is extractable, return {"applicant_name":"","incomes":[],"liabilities":[]}.` });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content }] })
    });
    const data = await res.json();
    if (!res.ok) return json(res.status, { error: (data && data.error && data.error.message) || 'Anthropic API error' });
    const text = (data && data.content && data.content[0] && data.content[0].text) || '';
    const parsed = parseJsonLoose(text);
    if (!parsed) return json(200, { extracted: { applicant_name: '', incomes: [], liabilities: [] }, raw: text });
    return json(200, { extracted: parsed });
  } catch (e) {
    return json(502, { error: 'Upstream request failed' });
  }
};

export const onRequest = () => json(405, { error: 'Method not allowed' });
