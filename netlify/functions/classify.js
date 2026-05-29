/* ============================================================
   DebtIQ — Document classification (Netlify Function)
   Identifies an Australian mortgage document's type + metadata via
   Claude vision. Key stays server-side; requires a valid Supabase session.
   ============================================================ */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (statusCode, obj) => ({ statusCode, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(obj) });

const SYSTEM =
`You are classifying an Australian mortgage application document. Identify the document type and key identifying metadata. Respond ONLY in JSON: {"type":"<one of: payslip, bank_statement, tax_return, noa, group_certificate, trust_deed, company_financials, bas, rates_notice, rental_statement, id_document, contract_of_sale, existing_loan_statement, credit_card_statement, savings_statement, other>","applicant_hint":"<name on the document if visible>","period":"<statement period or FY if visible>","issuer":"<bank/employer/agency name>","confidence":<0-100>}`;

function parseJsonLoose(text){
  try { return JSON.parse(text); }
  catch (e) { const m = text.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch (e2) {} } }
  return null;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(500, { error: 'ANTHROPIC_API_KEY not configured on the server' });

  const supaUrl = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
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
  const images = Array.isArray(body.images) ? body.images : [];
  const content = images.slice(0, 2)
    .filter(im => im && im.data && im.media_type)
    .map(im => ({ type: 'image', source: { type: 'base64', media_type: im.media_type, data: im.data } }));
  if (!content.length && body.base64 && (body.mimeType || '').startsWith('image/')) {
    content.push({ type: 'image', source: { type: 'base64', media_type: body.mimeType, data: body.base64 } });
  }
  if (!content.length) return json(400, { error: 'No document image provided' });
  content.push({ type: 'text', text: 'Classify the attached document. Respond in the required JSON only.' });

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, system: SYSTEM, messages: [{ role: 'user', content }] })
    });
    const data = await res.json();
    if (!res.ok) return json(res.status, { error: (data && data.error && data.error.message) || 'Anthropic API error' });
    const text = (data && data.content && data.content[0] && data.content[0].text) || '';
    const parsed = parseJsonLoose(text) || { type: 'other', confidence: 0 };
    return json(200, parsed);
  } catch (e) {
    return json(502, { error: 'Upstream request failed' });
  }
};
