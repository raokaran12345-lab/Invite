/* ============================================================
   DebtIQ — Anthropic proxy (Cloudflare Pages Function)
   POST /api/claude
   The API key lives ONLY here (Cloudflare env: ANTHROPIC_API_KEY).
   Browser code calls /api/claude — the key is never shipped to clients.
   Requires a valid Supabase session so anonymous visitors can't burn
   credits when Supabase is configured.
   ============================================================ */
import { CORS, json, corsPreflight, requireSupabaseSession } from './_lib.js';

export const onRequestOptions = () => corsPreflight();

export const onRequestPost = async ({ request, env }) => {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) return json(500, { error: 'ANTHROPIC_API_KEY not configured on the server' });

  const authFail = await requireSupabaseSession(request, env);
  if (authFail) return authFail;

  let body;
  try { body = await request.json(); } catch (e) { body = {}; }
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

export const onRequest = ({ request }) => json(405, { error: 'Method not allowed' });
