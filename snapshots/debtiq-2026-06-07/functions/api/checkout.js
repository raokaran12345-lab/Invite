/* ============================================================
   DebtIQ — Billing checkout (Cloudflare Pages Function)
   POST /api/checkout  { plan: 'Starter'|'Professional'|'Aggregator' }
   Creates a Stripe Checkout Session and returns its URL.

   BOUNDARY, honestly drawn:
   - With STRIPE_SECRET_KEY unset, this returns { configured:false } and the app
     stays in demo billing (no card charged). Nothing here fakes a payment.
   - With the key set, it creates a real subscription Checkout Session via the
     Stripe REST API (no SDK needed) using inline price_data, so you don't have to
     pre-create products. Swap to your own Price IDs once you have them.
   Requires a valid Supabase session, like the other /api/* routes.
   ============================================================ */
import { json, corsPreflight, requireSupabaseSession } from './_lib.js';

export const onRequestOptions = () => corsPreflight();

// Plan → monthly price in cents (AUD). Free is handled client-side (no checkout).
// Adjust or replace with Stripe Price IDs. See docs/PRICING.md.
const PLANS = {
  Commercial: { amount:  9900, label: 'DebtIQ Commercial' },
  Complete:   { amount: 19900, label: 'DebtIQ Complete' },
};

function appOrigin(request, env){
  if (env.APP_URL) return env.APP_URL.replace(/\/$/, '');
  const origin = request.headers.get('origin');
  if (origin) return origin.replace(/\/$/, '');
  try { return new URL(request.url).origin; } catch { return ''; }
}

export const onRequestPost = async ({ request, env }) => {
  const authFail = await requireSupabaseSession(request, env);
  if (authFail) return authFail;

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const plan = PLANS[body.plan] ? body.plan : null;
  if (!plan) return json(400, { error: 'Unknown plan' });

  // Honest boundary: no payments provider configured.
  const key = env.STRIPE_SECRET_KEY;
  if (!key) {
    return json(200, {
      configured: false,
      message: 'Payments are not connected. Set STRIPE_SECRET_KEY (and optionally APP_URL) on the host to enable real subscriptions.',
    });
  }

  const origin = appOrigin(request, env);
  const p = PLANS[plan];

  // Stripe Checkout Session via REST (form-encoded). Inline price_data avoids
  // needing pre-created Products/Prices for a first integration.
  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('success_url', `${origin}/?billing=success&plan=${encodeURIComponent(plan)}`);
  form.set('cancel_url', `${origin}/?billing=cancelled`);
  form.set('line_items[0][quantity]', '1');
  form.set('line_items[0][price_data][currency]', 'aud');
  form.set('line_items[0][price_data][unit_amount]', String(p.amount));
  form.set('line_items[0][price_data][recurring][interval]', 'month');
  form.set('line_items[0][price_data][product_data][name]', p.label);
  form.set('allow_promotion_codes', 'true');

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + key,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
    });
    const data = await res.json();
    if (!res.ok) return json(res.status, { error: (data && data.error && data.error.message) || 'Stripe error' });
    return json(200, { configured: true, url: data.url, id: data.id });
  } catch (e) {
    return json(502, { error: 'Could not reach the payments provider' });
  }
};

export const onRequest = () => json(405, { error: 'Method not allowed' });
