/* ============================================================
   DebtIQ — shared helpers for the /api/* Pages Functions.
   Kept tiny on purpose; each handler is otherwise self-contained.
   ============================================================ */
export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export function json(status, obj){
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' }
  });
}

export const corsPreflight = () => new Response('', { status: 204, headers: CORS });

/* Verify a Supabase access-token against the auth endpoint, mirroring the
   gate the Netlify functions used. Returns null on success, or a Response
   the caller should return directly on failure. Skipped when Supabase isn't
   configured (demo mode). */
export async function requireSupabaseSession(request, env){
  const supaUrl = env.SUPABASE_URL, anon = env.SUPABASE_ANON_KEY;
  if (!(supaUrl && anon)) return null;
  const auth = request.headers.get('authorization') || '';
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
  return null;
}

/* Best-effort JSON parser (matches the Netlify functions' defensive style). */
export function parseJsonLoose(text){
  try { return JSON.parse(text); }
  catch (e) {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch (e2) {} }
  }
  return null;
}
