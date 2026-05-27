# DebtIQ v6 — Changelog

## Round 3 — backend (Netlify Functions + Supabase)

Turns the static app into a deployable product **without breaking demo mode**.
The app auto-detects the backend via `/api/config`; with no backend it runs
exactly as before (mock AI, no auth, nothing saved). Full guide in `BACKEND.md`.

**New files**
- `netlify.toml` — publish `.`, functions dir, `/api/claude` + `/api/config` redirects.
- `netlify/functions/claude.js` — **Anthropic proxy**. Key lives in `ANTHROPIC_API_KEY`
  (server env only); verifies the caller's Supabase JWT before spending credits.
- `netlify/functions/config.js` — returns the **public** Supabase URL + anon key
  from env so the static page can boot the client (empty ⇒ demo mode).
- `supabase/schema.sql` — `deals` table (per-user `jsonb`), `updated_at` trigger,
  and row-level-security policies (each broker sees only their own rows).
- `BACKEND.md` — Supabase + Anthropic + Netlify deploy steps and env vars.

**`index.html` changes (all guarded; demo-safe)**
- Loads `@supabase/supabase-js` (CDN). `boot()` calls `initBackend()` → fetches
  `/api/config`; if Supabase is configured it enables auth + persistence + live AI.
- **AI now runs through the proxy.** `callClaude()` POSTs to `/api/claude` with the
  user's Supabase access token — **no direct browser→Anthropic call, no key in the
  browser**. Falls back to local mock text in demo mode. (`aiLive()` =
  backend + signed in; drives the DEMO/Live pill, AI Pilot label/gate, and the
  Compliance "connected" notice via `syncAi()`.)
- **Auth:** login screen does real Supabase sign-in when configured, with
  **Create account** + **Email magic link**; `doSignOut()` in Settings → Account.
  Demo button + credentials shown only in demo mode.
- **Persistence:** `loadDeals()` on sign-in (empty ⇒ first-run empty state);
  `saveDeal()` upserts on submit and on stage-advance (RLS-scoped to the user).
- Settings **AI** tab now shows proxy connection status (no client key input);
  **Account** tab shows signed-in identity + sign-out, or a deploy hint in demo.

**Verification:** jsdom smoke harness still **all green** in demo mode (backend
unreachable ⇒ falls back), incl. new checks that the backend functions exist,
`aiLive()` is false offline, and `callClaude()` resolves to mock text. JS syntax
valid; Netlify functions pass `node --check`.

### Deferred / can't be done from the sandbox
- I can't deploy to Netlify or provision your Supabase project — you run the
  deploy and set the three env vars (see `BACKEND.md`). Until then the live path
  is untested end-to-end (logic verified in jsdom only).
- Real document **OCR** in the AI Pilot is still simulated.

---

## Round 2 — engine + compliance batch

Surgical edits to `index.html`. Verified with the jsdom smoke harness (all
checks green) and a JS syntax check. Two commits: bugs/income/extraction, then
pack/compliance/settings.

**Part 1 — critical bugs**
- **BUG 1:** `updateCalc()` now uses `activeBuffer()` (was `m().buffer`) and the
  inline income "shade ×" + assessed $ now come from `getShadedIncome(inc, state.lender)`,
  so the calculator's per-row figures track the selected lender.
- **BUG 2:** `applyExtractedProfile()` is gated behind `state.anthropicKey` (shows a
  demo toast and returns otherwise); AI Pilot results show a "demo data" disclaimer
  until a key is set.
- **BUG 3:** added `TODAY`/`TODAY_STR`; replaced all 7 hardcoded `2026-05-27`
  references (next-action comparisons, `closed`/activity dates, doc dates) and the
  Settled-MTD month filter with live dates.

**Part 2 — two-year income + add-backs**
- Income model gains `amount_y1`/`amount_y2`/`use_average` and self-employed
  add-backs (`addback_depreciation`/`interest`/`lease`, `business_loan_repayments`).
- `getShadedIncome()` assesses on the 2-yr average when toggled and applies
  self-employed add-backs (less business loan repayments) before shading.
- Calculator income row redesigned: **Type | FY current | FY prior | Avg | Assessed | ×**,
  with a collapsible self-employed add-backs panel (net assessable shown live).
  Default income seeded with y1/y2.

**Part 3 — multi-entity extraction**
- `wizUpload(i, name, entityIdx)` / `wizExtract(name, entityIdx)` route extracted
  income/liabilities to the correct entity (step 5 passes index 0 for now).

**Part 4 — AOL submission pack**
- `generateSubmissionPack()` → `buildPackHTML()` → `openPackWindow()`: a print-ready,
  branded credit submission (cover, application summary, employment & income with
  FY columns + add-backs, liabilities, serviceability verdict + DSR/NDI/LVR/DTI
  metrics, R&O + servicing commentary, lender policy match, document checklist,
  broker declaration, print/close controls). AI prompts (`buildBIDPrompt`,
  `buildServicingPrompt`) used when a key is set; otherwise falls back to existing
  commentary/placeholders. Buttons added in Commentary header and wizard step 8.

**Part 5 — Compliance AI**
- New nav item + page (`renderCompliance`): generate R&O (RG209), HEM explanation,
  serviceability commentary, or the full pack. `validateBIDBeforeGenerate()` blocks
  generation on a FAIL verdict and surfaces DTI/LVR/NDI/HEM policy warnings. Output
  cards support copy + inline edit.

**Part 6 — settings / print / polish**
- `@media print` block for clean PDF export of the in-app commentary.
- Settings **Account** save updates the sidebar name + avatar initials (`saveAccount`).
- **Accredited Lenders** (Settings → Lenders): `state.accreditedLenders` filters both
  the calculator lender dropdown and the Compare table (`toggleAccredited`).
- Billing copy "All 6 markets" → "AU + NZ markets". Debounced deal search
  (`debouncedRenderDealGrid`, 150ms). `advanceDeal` restores the search box value.

### Deferred (unchanged from round 1)
- Real Anthropic key via backend proxy and real Supabase auth/persistence still
  require a backend — the AI Pilot and live generation remain demo/fallback until
  then. Per-lender `base_rate` remains indicative. Both `index.html` + `lenders.js`
  deploy together.

---

# DebtIQ v6 — Critique Fix Batch (Round 1)

Applied the 24-point evidence-backed critique. Changes are surgical edits to
`index.html` + `lenders.js` (no rewrite). Shipped in four logical commits:
data/finance → structure → features → polish.

Verified with a jsdom smoke harness (`/tmp/diqtest/smoke.js`): login, all six
nav pages, tabbed deal panel, Lenders sub-tabs, Settings, manual tab, compute
(DTI/HEM), lender capacity, Apply levers, commission KPIs — all green.

## Done

**Strategy & data**
- **§1 Markets → AU + NZ only.** Removed US/UK/CA/IN. Country picker removed from
  the sidebar (static caption); switching moved to Settings. NZ shows a
  "database arrives Q3" banner and falls back to market-default buffers.
- **§2 Commission economics.** Per-deal `upfront`/`trail` rates (+ `COMMISSION`
  defaults editable in Settings). Dashboard now shows **Expected Upfront** and
  **Settled MTD** (replacing Pipeline Value); every deal card shows est. upfront +
  trail.
- **§4 Shared wizard/calculator state.** Wizard loan step writes straight to
  `state.calc.newLoan`; no re-defaults when opening the calculator.
- **§6 DTI.** Computed in the engine (debt balance ÷ gross shaded income), shown in
  the status strip and as a serviceability check; >6x flagged restricted, >9x
  outside major-bank policy.
- **§7 Liability terms.** Type-specific defaults (personal/car 5y, BNPL 1y, other
  5y, mortgage 25y) — no silent 25y. Empty non-CC/HECS term shows a warning.
- **§8 HEM table.** `getHEM(income, adults, dependants)` (income band × household)
  replaces the flat $2,200; `adults` control added to the calculator.
- **§9 Conditional income shading.** Per-income `evidence_years` + emergency-
  services/healthcare flags; Westpac 100% emergency overtime, bonus excluded
  without 2yr history, 1yr self-employed shaded to 50%.
- **§10 Explicit HECS field.** `monthly_deduction` (from payslip) drives CBA's
  12-month exclusion; NAB <$20k rule retained.
- **§22 CRM-lite.** Deals carry phone, email, referral source, next-action
  date/note, and an activity log; "next action" surfaces on the card and panel.

**UX architecture**
- **§3 Nav → 6 items** (Pipeline / New Deal / Calculate / AI Pilot / Lenders /
  Settings). Documents/Commentary/Portal moved into the deal panel; Market Intel
  folded into Lenders as a sub-tab.
- **§5 Explain-the-verdict.** Binding-constraint headline + ranked levers, each
  with a one-click **Apply** (drop loan / switch lender / extend term).
- **§11 Policy-aware Compare.** Per-lender borrowing capacity, verdict, and a
  deal-specific "policy edge", with a **Use this lender** action.
- **§12 Wizard documents wired.** Uploads append to `DOCS` and extract into the
  calculator (varies by filename keyword); retagged to the deal on submit.
- **§16 KPI trends.** ▲/▼ deltas on each KPI.
- **§17 Status strip conditional** (Calculate + AI Pilot only).
- **§18 Empty states.** First-run Pipeline welcome + empty Documents tab.
- **§20 Settings page** (Account / Market / AI / Commission).
- **§21 Tabbed deal panel** (Overview / Documents / Commentary / Portal / Activity).

**Visual / copy / a11y**
- **§14 Status strip** is solid navy (legibility) — gradient kept for buttons/hero.
- **§15 Icons.** Inline Lucide-style SVGs replace emoji in the nav.
- **§13 AI Pilot labelled DEMO** until an Anthropic key is set (nav badge + hero note).
- **§19 Copy.** "pipeline" not "portfolio"; panel CTA "Open in Calculator"; topbar
  shows **DEMO MODE** until a key is set.
- **§23 Demo banner** + Supabase sign-in stub in Settings.
- **§24 Accessibility.** Skip-to-content link, `:focus-visible` rings, aria-labels
  on icon buttons/inputs, labels tied to settings inputs, sequential tab order.

## Deferred (need a backend — out of scope for a static single file)

- **§7.1 / §13 Anthropic key via backend proxy.** A browser-embedded key is
  insecure. The Settings field + DEMO labelling are in place, and `callClaude`
  still falls back to local mock; **a real key must be proxied through a backend
  (e.g. a Vercel/Next edge function)** before live AI is enabled. Not buildable in
  a static `index.html`.
- **§7.2 / §23 Real Supabase auth + persistence.** `doLogin()` remains a demo
  gateway; the "Sign in with Supabase" button and demo banner are stubs.
  Real auth (email/password + magic link), `created_by` tagging, and row-level
  security require Supabase wiring + env config — a separate phase.
- **§5.1 Real AI Pilot.** Still a simulated chain (now clearly labelled DEMO);
  becomes real once the backend proxy above exists.
- **NZ lender database.** AU is fully wired (25 lenders); NZ uses market defaults
  until real ASB/ANZ NZ/BNZ/Kiwibank policy is ingested.

## Notes / partials

- **§3.1/§3.2 contrast:** the unreadable gradient strip is fixed (solid navy).
  A full automated Lighthouse/contrast sweep wasn't run here (no browser in the
  build env); the known failing surface was addressed.
- Per-lender `base_rate` remains **indicative** (no pricing feed) — flagged in
  `lenders.js`.
- Two source files must be deployed together (`index.html` + `lenders.js`).
