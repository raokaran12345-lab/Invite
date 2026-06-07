# DebtIQ — live integration hand-off

Two integrations are **gated on credentials / agreements you must provide**. Both
are built up to a clean boundary: the app runs honestly without them (clearly
labelled, nothing faked) and activates the moment you supply what's listed here.

---

## 1. Billing — Stripe (wired to the boundary)

**State:** the app calls a real endpoint; it just needs a key to charge.

- Endpoint: `functions/api/checkout.js` → `POST /api/checkout { plan }`.
- App wiring: Billing → **Choose plan** calls `choosePlan()`, which hits the
  endpoint when signed in. The Billing page shows a "demo billing — no card
  charged" banner until configured.

**To go live:**
1. Create a Stripe account; get your **secret key** (`sk_live_…` or `sk_test_…`).
2. On the host (Cloudflare Pages → Settings → Environment variables) set:
   - `STRIPE_SECRET_KEY` = your secret key  *(server-only, never shipped to the browser)*
   - `APP_URL` = your deployed origin (e.g. `https://debtiq.pages.dev`) — used for
     the success/cancel redirect URLs. Optional; falls back to the request origin.
3. (Recommended) Replace the inline `price_data` in `checkout.js` with your own
   Stripe **Price IDs** once you've created Products/Prices, and set
   `line_items[0][price]` instead of `price_data`.
4. (Recommended) Add a **webhook** (`checkout.session.completed`,
   `customer.subscription.updated/deleted`) to a new `functions/api/stripe-webhook.js`
   to record subscription state server-side. The current flow acknowledges success
   client-side via `?billing=success`; a webhook is the source of truth for real
   entitlement.

**What is NOT faked:** with no key set, `/api/checkout` returns `{configured:false}`
and the app saves the plan locally only, telling the user no card was charged.

---

## 2. Settlement — PEXA / Sympli (ELNO) — boundary only

**State:** isolated adapter, **mock by default**, by design. Real connectivity is
gated on eligibility you must establish — this is not something code alone can turn
on.

- Adapter: `ELNO_ADAPTER` in `index.html` (`mode:'mock'`). `createWorkspace()` /
  `bookSettlement()` return demo identifiers and the UI labels them clearly.

**To go live you must first (LEGAL-REVIEW / ARCH-REVIEW):**
1. Become an eligible **ELNO subscriber** (PEXA and/or Sympli) — this requires the
   relevant subscriber agreement and, typically, a licensed conveyancer/lawyer or
   an authorised practitioner in the workflow. DebtIQ **coordinates** to the
   conveyancing handoff; it does **not** settle and holds **no trust money** — keep
   it that way unless counsel advises otherwise.
2. Obtain API credentials / certificate from the ELNO and confirm interoperability
   (ARNECC/ECNL) requirements for your jurisdiction.
3. Implement a server-side adapter (e.g. `functions/api/elno.js`) that holds the
   ELNO credential **server-side only** (never in the browser), mirroring the
   `/api/claude` key pattern. Switch `ELNO_ADAPTER.mode` to `'live'` to route
   `createWorkspace()` / `bookSettlement()` through it.
4. Confirm **trust-money** boundaries and **subscriber eligibility** with counsel
   before processing any real settlement (REVIEW-REGISTER L4, L5).

**Why this can't be "finished" in code here:** it depends on a signed subscriber
agreement and credentials that only you can obtain. The adapter interface is ready;
the connection is yours to authorise.

---

## Environment variables summary

| Var | Where | Purpose | Without it |
|-----|-------|---------|-----------|
| `ANTHROPIC_API_KEY` | host (server) | All AI (extract/forensics/claude) | demo / mock AI |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | host | Auth + persistence + RLS | static demo |
| `STRIPE_SECRET_KEY` | host (server) | Real subscriptions | demo billing (no charge) |
| `APP_URL` | host | Checkout redirect origin | falls back to request origin |
| (ELNO credential) | host (server, future) | Real PEXA/Sympli settlement | mock adapter |
