/* ============================================================
   DebtIQ — Document extraction (Netlify Function)
   Real OCR via Claude vision/PDF. Accepts base64 files, returns
   structured income/liability data the calculator can ingest.
   Key stays server-side; requires a valid Supabase session.
   ============================================================ */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (statusCode, obj) => ({ statusCode, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(obj) });

const ALLOWED = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(500, { error: 'ANTHROPIC_API_KEY not configured on the server' });

  // Require a valid Supabase session.
  const supaUrl = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (supaUrl && anon) {
    const token = (event.headers.authorization || event.headers.Authorization || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return json(401, { error: 'Not authenticated' });
    try {
      const u = await fetch(supaUrl.replace(/\/$/, '') + '/auth/v1/user', { headers: { Authorization: 'Bearer ' + token, apikey: anon } });
      if (!u.ok) return json(401, { error: 'Invalid or expired session' });
    } catch (e) { return json(502, { error: 'Auth verification failed' }); }
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return json(400, { error: 'Bad JSON' }); }
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
      let parsed = null;
      try { parsed = JSON.parse(text); } catch (e) { const m = text.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} } }
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
    // Pull the JSON object out of the response defensively.
    let parsed = null;
    try { parsed = JSON.parse(text); }
    catch (e) { const m = text.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} } }
    if (!parsed) return json(200, { extracted: { applicant_name: '', incomes: [], liabilities: [] }, raw: text });
    return json(200, { extracted: parsed });
  } catch (e) {
    return json(502, { error: 'Upstream request failed' });
  }
};
