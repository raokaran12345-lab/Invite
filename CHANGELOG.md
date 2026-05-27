# DebtIQ v6 — Critique Fix Batch

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
