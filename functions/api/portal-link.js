/* ============================================================
   DebtIQ — Client Portal signed links (Cloudflare Pages Function)
   POST /api/portal-link  { dealId, docs[] }   → create a signed, expiring link
   GET  /api/portal-link?t=<token>             → verify + return the link payload

   The link is an HMAC-SHA256-signed, time-limited token — NOT a guessable random
   URL. No powerful/secret keys are involved beyond a single PORTAL_SECRET you set
   (any long random string). Creating a link requires a broker Supabase session;
   verifying is public (the borrower has no login) but tamper-proof + expiring.
   ============================================================ */
import { json, corsPreflight, requireSupabaseSession } from './_lib.js';

export const onRequestOptions = () => corsPreflight();

const enc = new TextEncoder();
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64urlToStr = (s) => { s = s.replace(/-/g,'+').replace(/_/g,'/'); return atob(s + '==='.slice((s.length+3)%4)); };

async function hmac(data, secret){
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}
// Constant-time-ish string compare.
function safeEq(a, b){ if(a.length !== b.length) return false; let r=0; for(let i=0;i<a.length;i++) r |= a.charCodeAt(i)^b.charCodeAt(i); return r===0; }

async function makeToken(payload, secret){
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await hmac(body, secret);
  return body + '.' + sig;
}
async function readToken(token, secret){
  const [body, sig] = String(token||'').split('.');
  if(!body || !sig) return { error:'malformed' };
  if(!safeEq(sig, await hmac(body, secret))) return { error:'bad signature' };
  let payload; try { payload = JSON.parse(b64urlToStr(body)); } catch { return { error:'corrupt' }; }
  if(payload.exp && Date.now() > payload.exp) return { error:'expired' };
  return { payload };
}

export const onRequestPost = async ({ request, env }) => {
  const secret = env.PORTAL_SECRET;
  if(!secret) return json(200, { configured:false, message:'Set PORTAL_SECRET (any long random string) on the host to issue real portal links.' });
  const authFail = await requireSupabaseSession(request, env);
  if(authFail) return authFail;
  let body; try { body = await request.json(); } catch { body = {}; }
  const dealId = String(body.dealId || '').slice(0, 64);
  if(!dealId) return json(400, { error:'Missing dealId' });
  const docs = Array.isArray(body.docs) ? body.docs.slice(0, 30).map(d => String(d).slice(0,80)) : [];
  const ttlH = Math.min(168, parseInt(body.expiresHours,10) || 72);  // default 72h, max 7 days
  const payload = { dealId, docs, exp: Date.now() + ttlH*3600*1000, iat: Date.now() };
  const token = await makeToken(payload, secret);
  const origin = (env.APP_URL || request.headers.get('origin') || new URL(request.url).origin).replace(/\/$/,'');
  return json(200, { configured:true, token, url: `${origin}/portal.html?t=${encodeURIComponent(token)}`, expiresHours: ttlH });
};

export const onRequestGet = async ({ request, env }) => {
  const secret = env.PORTAL_SECRET;
  if(!secret) return json(200, { configured:false, message:'Portal links are not configured on this host.' });
  const t = new URL(request.url).searchParams.get('t');
  const { payload, error } = await readToken(t, secret);
  if(error) return json(401, { valid:false, error });
  return json(200, { valid:true, dealId: payload.dealId, docs: payload.docs, expiresAt: payload.exp });
};

export const onRequest = () => json(405, { error:'Method not allowed' });
