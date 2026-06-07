/* ============================================================
   DebtIQ — CDR live rates (Cloudflare Pages Function)
   GET/POST /api/cdr-rates   { bank?: 'cba'|'nab'|..., baseUri?, productId? }

   Australia's Consumer Data Right requires ADIs to expose PRODUCT REFERENCE
   DATA (rates & fees) via PUBLIC, UNAUTHENTICATED APIs — no registration, no
   consumer consent (that's only for account data). This pulls current home-loan
   rates from a bank's public CDR endpoint so the serviceability engine can use a
   real rate instead of a hard-coded one.

   HONESTY: CDR gives the lender's CARDED/advertised rate, not the discounted rate
   a specific borrower gets, and not the lender's internal assessment-rate floor.
   It is a real accuracy upgrade over a static base_rate, not "the lender's number".

   Base URIs come from the CDR Register / each bank's developer portal
   (https://www.cdr.gov.au) — verify/extend the registry below from there.
   ============================================================ */
import { json, corsPreflight } from './_lib.js';

export const onRequestOptions = () => corsPreflight();

// Public CDR base URIs (the part before /cds-au/v1/...). Sourced from each ADI's
// published CDR endpoint; confirm against the CDR Register before relying on them.
const CDR_BANKS = {
  cba:      { label: 'CommBank',  base: 'https://api.commbank.com.au/public' },
  nab:      { label: 'NAB',       base: 'https://openbank.api.nab.com.au' },
  westpac:  { label: 'Westpac',   base: 'https://digital-api.westpac.com.au/cds-au/v1/banking/products' /* may already include path */ },
  anz:      { label: 'ANZ',       base: 'https://api.anz' },
  macquarie:{ label: 'Macquarie', base: 'https://api.macquariebank.io' },
};

// Normalise a base into the products URL.
function productsUrl(base){
  const b = String(base).replace(/\/+$/,'');
  return /\/banking\/products$/.test(b) ? b : b + '/cds-au/v1/banking/products';
}

async function cdrGet(url, version){
  const res = await fetch(url, { headers: { 'x-v': String(version), 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('CDR ' + res.status + ' for ' + url);
  return res.json();
}

// Pull the headline variable owner-occ P&I rate out of a product-detail payload.
function pickRate(detail){
  const rates = (detail && detail.data && detail.data.lendingRates) || [];
  const oo = rates.filter(r => !r.loanPurpose || /OWNER_OCCUPIED/i.test(r.loanPurpose));
  const pi = oo.filter(r => !r.repaymentType || /PRINCIPAL_AND_INTEREST/i.test(r.repaymentType));
  const variable = (pi.length?pi:oo).find(r => /VARIABLE/i.test(r.lendingRateType||''));
  const any = variable || pi[0] || oo[0] || rates[0];
  if (!any) return null;
  const pct = (any.rate != null && !isNaN(+any.rate)) ? +any.rate * 100 : null;  // CDR rate is a decimal string e.g. "0.0619"
  return { rateType: any.lendingRateType, rate: pct, raw: any.rate, purpose: any.loanPurpose, repayment: any.repaymentType };
}

export const onRequestPost = handler;
export const onRequestGet = handler;

async function handler({ request }){
  let body = {};
  try { body = request.method === 'POST' ? await request.json() : Object.fromEntries(new URL(request.url).searchParams); }
  catch (e) { body = {}; }

  const bank = body.bank && CDR_BANKS[body.bank] ? CDR_BANKS[body.bank] : null;
  const base = body.baseUri || (bank && bank.base);
  if (!base) return json(400, { error: 'Provide ?bank=cba (or a baseUri). Known: ' + Object.keys(CDR_BANKS).join(', ') });

  try {
    // 1. List residential-mortgage products (public, x-v:3).
    const list = await cdrGet(productsUrl(base) + '?product-category=RESIDENTIAL_MORTGAGES&page-size=100', 3);
    const products = ((list.data && list.data.products) || []).map(p => ({ productId: p.productId, name: p.name, brand: p.brand }));

    // 2. If a productId was asked for, return its rate detail (x-v:4).
    if (body.productId) {
      const detail = await cdrGet(productsUrl(base) + '/' + encodeURIComponent(body.productId), 4);
      return json(200, { bank: bank ? bank.label : base, product: body.productId, rate: pickRate(detail), source: 'CDR product reference data (public, carded rate — not the discounted/assessed rate)' });
    }

    return json(200, { bank: bank ? bank.label : base, count: products.length, products: products.slice(0, 60),
      note: 'Public CDR product reference data. Call again with &productId=<id> for that product\'s carded rate. Carded ≠ discounted/assessed.' });
  } catch (e) {
    return json(502, { error: 'Could not reach CDR endpoint: ' + e.message, hint: 'Verify the base URI against the CDR Register at cdr.gov.au.' });
  }
}

export const onRequest = () => json(405, { error: 'Method not allowed' });
