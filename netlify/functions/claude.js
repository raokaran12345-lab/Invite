/* ============================================================
   DebtIQ — Anthropic proxy (Netlify Function)
   The API key lives ONLY here (Netlify env: ANTHROPIC_API_KEY).
   Browser code calls /api/claude — the key is never shipped to clients.
   Requires a valid Supabase session so anonymous visitors can't burn credits.
   ============================================================ */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (statusCode, obj) => ({ statusCode, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(obj) });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return json(500, { error: 'ANTHROPIC_API_KEY not configured on the server' });

  // Gate on a valid Supabase session when Supabase is configured.
  const supaUrl = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (supaUrl && anon) {
    const auth = event.headers.authorization || event.headers.Authorization || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token) return json(401, { error: 'Not authenticated' });
    try {
      const u = await fetch(supaUrl.replace(/\/$/, '') + '/auth/v1/user', {
        headers: { Authorization: 'Bearer ' + token, apikey: anon }
      });
      if (!u.ok) return json(401, { error: 'Invalid or expired session' });
    } catch (e) {
      return json(502, { error: 'Auth verification failed' });
    }
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { body = {}; }
  const prompt = String(body.prompt || '').slice(0, 12000);
  if (!prompt) return json(400, { error: 'Missing prompt' });
  const model = body.model || 'claude-sonnet-4-20250514';
  const max_tokens = Math.min(parseInt(body.max_tokens, 10) || 700, 1500);

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model, max_tokens, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    if (!res.ok) return json(res.status, { error: (data && data.error && data.error.message) || 'Anthropic API error' });
    const text = (data && data.content && data.content[0] && data.content[0].text) || '';
    return json(200, { text });
  } catch (e) {
    return json(502, { error: 'Upstream request failed' });
  }
};
