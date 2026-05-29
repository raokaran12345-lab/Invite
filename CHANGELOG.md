# DebtIQ v6 — Changelog

## Round (doc-intelligence) — bulk ingest pipeline, classification, type-specific extraction, intelligent reconciliation, extraction review workspace, source tracing/provenance, missing-doc intelligence

Drop a whole client file (up to 100 docs) and get back a classified, extracted,
fraud-scanned, cross-verified, source-traced application with zero manual entry.
Live via the backend proxy; full demo-mode mocks.

**Backend:** new `netlify/functions/classify.js` → `/api/classify` (JWT-gated)
returns `{type, applicant_hint, period, issuer, confidence}`. `extract.js` gains a
backward-compatible **type-aware mode** (`{docType, schema}`) returning
`{fields:{name:{value,confidence,source_text}}}`. `netlify.toml` updated.

**Pipeline (Part 1-2):** a bulk drop zone (≤100 files) creates `Queued` docs and
runs them through a **concurrency-3 queue**; each doc flows
classify → extract → scan (forensics) → reconcile → done with a live progress panel
(`doc.pipeline.stage`). `DOC_TYPES` catalogue + `EXTRACT_SCHEMAS` per type.

**Extraction (Part 3):** type-aware schemas with **per-field confidence + source_text**
(the text the value was read from — powers provenance). Multi-period aware (payslip
YTD cross-check, tax-return 2-year model).

**Reconciliation (Part 4):** `reconcile()` matches each doc to an entity
(`applicant_hint` → entity name) and maps fields into `state.calc`
(payslip→annualised salary, tax_return→self_emp, company_financials→add-backs,
existing_loan→liability, rental→rental income, noa→HECS). Conflicting values are
**never silently overwritten** — they raise a conflict the broker resolves (logged).

**Review workspace (Part 5):** split view (document preview ‖ editable fields with
confidence bars + source_text), inline forensic status, per-doc Approve, and
"Trust all high-confidence". Nothing commits until reviewed.

**Source tracing (Part 6):** every reconciled figure carries a provenance object;
a `ⓘ` affordance on calculator rows shows "from <doc> · '<source_text>' · N%
confidence". The submission pack gains a **Source Documents appendix**. Provenance
persists on `deal.docIntel` (survives save/load).

**Dashboard + copilot (Part 7):** a pipeline summary card (docs · extracted ·
high-confidence · need review · integrity flags · conflicts · missing) and copilot
insights for reviews, conflicts and **missing document types** by deal type
(self-employed ⇒ tax returns/NOAs/company financials).

**Demo (Part 8):** demo docs are pre-classified/extracted with provenance; a D-889
income conflict is seeded; bulk-drop animates the full pipeline offline.

**Hardening:** uploaded filenames and extracted values are user-controlled, so all
render paths that emit them (document table, provenance badges, conflict cards,
review workspace) now escape via `escHtml` (HTML) / `escArg` (onclick JS-string +
attribute), closing a markup/onclick-injection vector flagged in review.

**Verification:** `node --check` clean on `index.html`, `classify.js`, `extract.js`,
`forensics.js`; jsdom smoke **69/69 green** (bulk ingest + concurrency, pipeline
stages, classification, typed extraction w/ confidence+source_text, reconciliation
+ provenance, conflict resolution without overwrite, review workspace, source
tracing, missing-doc gaps, provenance round-trip).

## Round (fraud) — document integrity / tamper detection

The wedge feature: tamper-signal detection no AU broker tool ships. All analysis
runs **server-side** via a new `/api/forensics` Netlify function (Supabase-JWT
gated, key never in the browser), with a full demo-mode mock fallback.

**Backend (`netlify/functions/forensics.js` → `/api/forensics`)** — three layers:
1. **PDF metadata/structure forensics (pure JS, no AI):** edit-tool Producer/Creator
   detection (META01), modified-after-creation (META02), `%%EOF` revision count
   (META03), `/TouchUp_TextEdit` traces (META04), mixed embedded/system fonts
   (META05), stripped metadata (META06).
2. **AI visual forensics (Claude vision):** misaligned baselines, font-weight
   changes, cloning/whiteout, failed arithmetic (YTD/net/running-balance),
   impossible dates — returns JSON observations + arithmetic_checks.
3. **Cross-document consistency (`mode:'crosscheck'`):** contradictions across the
   file's extracted figures (income vs payslip vs NOA vs salary credits, etc).
   Scoring → CLEAR / CAUTION / REVIEW REQUIRED.

**Honesty rule:** never renders "Genuine"/"Authentic" — only "No tampering signals
detected" with a disclaimer that absence of signals is not proof of authenticity.

**Client + UI:** `callForensics(file,dealId)` (PDF → raw base64 for Layer 1 +
`pdfToImages` PNGs for Layer 2), `runCrossCheck(dealId)`, `auditLog('FORENSIC_RUN')`.
Auto-scan on upload; an **Integrity column** in the Documents table (✓ Clear /
▲ Caution / ⚠ Review); a slide-over **forensic report** (findings grouped by
Metadata/Visual/Cross-document with severity + mono code chips, always-on
disclaimer, a "what to do" box on REVIEW, and Re-scan/Mark-reviewed/Request-original
actions); a **Consistency** section showing conflicting values side-by-side; copilot
integrity insights; a deal-strip integrity dot; and "Scan all" buttons on the
Documents tab + copilot. Demo seeds vary the demo docs (payslip CLEAR, trust deed
CAUTION/META02, tax return REVIEW/META01+visual) and a D-889 cross-check discrepancy.

**Verification:** `node --check` clean on `index.html` + `forensics.js`; jsdom smoke
**51/51 green**, incl. asserting "Genuine"/"Authentic" never appear as a status and
the disclaimer is present on every report.

## Round 7 — Floating Policy & Rates drawer (per-file)

- **`#policyDrawer`** — a floating, collapsible panel on the right edge that shows
  the **lender policy + rate comparison for the file currently being lodged**.
  Reuses the engine's `rankLenders()` so it is fully contextual to the active deal:
  each Australian lender's **buffer, assessed rate, borrowing capacity, OK/FAIL
  verdict and policy edge**, sorted by approvability then capacity, with the
  recommended lender (★) and the currently-selected lender highlighted, plus a
  **policy-detail card** for the active lender (LVR caps, DSR ceiling, genuine
  savings, self-employed minimum, HECS rule, submission channel, key notes).
- **Expand / contract:** collapsed it is a thin `⚖ Policy & Rates` handle on the
  right edge (`togglePolicyDrawer`); expanded it slides out at 440px and a `⤢`
  control widens it to ~720px (`togglePolicyWide`). Header shows the deal id/name.
- **Live:** refreshes alongside the deal strip + copilot — wired into
  `updateStatusStrip()` and `renderWorkspace()`, so it tracks every calculator
  edit, lender switch and tab change. `Use` on any row switches the assessed lender.
- Sits below modals/overlays (z-index 650) so it never blocks the wizard/settings.

**Verification:** `node --check` clean; jsdom smoke harness **38/38 green** (7 new
drawer checks: collapsed→expand, file context, lender rows with assessed rate +
verdict, policy-detail card, widen, contract).

## Round 6 — UI architecture rebuild (single-canvas operating system)

Replaced the entire shell, layout and navigation model. **No financial engine,
lender database, AI, wizard or data-structure logic was changed** — only how the
app is framed and navigated.

**New shell (HTML + CSS)**
- **Command Bar** (full-width, 52px): logo, centred global search (`#globalSearch`
  → `globalSearchHandler`, filters deals live + dropdown results), **+ New Deal**,
  Settings gear, user avatar. No sidebar, no topbar, no country pill.
- **Deal Strip** (40px, only when a deal is active): back arrow, ID · client ·
  lender (colour dot) · amount · status, plus **live DSR / NDI / DTI / LVR chips**
  that recompute on every state change — the old status strip, reimagined per deal.
- **Tab Strip**: Pipeline · Client · Loan · Documents · Calculate · AI Pilot.
- **AI Copilot panel** (always-visible, 320px; hidden < 900px): contextual
  insights (`generateCopilotInsights` → verdict, best-lender suggestion, DTI/LVR
  flags, missing docs, self-employed/next-action), quick actions (pack / pilot /
  compare), and a deal-aware chat (`submitCopilotQuery` → `callClaude` with
  `buildDealContext`).
- **Live Timeline** (dark, bottom; click to expand 80↔240px): `logEvent` /
  `renderTimeline` / `formatRelativeTime`, seeded with demo events and wired into
  submit, advance, upload, lender switch, R&O, pack, AI assessment, add income/liab.
- **Settings overlay** (`openSettings`/`renderSettingsOverlay`) replaces the
  settings page; Billing folded in as a settings tab. Market switching lives in
  Settings.
- **New Deal wizard** now opens as a modal overlay (`openWizardModal`); submit
  closes it and activates the new deal.

**New tabs**
- **Client** (`renderClientTab`) — contact/referral, status + next action, income &
  entity summary; **Loan** (`renderLoanTab`) — lender select + loan structure +
  property/LVR, all writing to `state.calc` and updating the deal strip live. Both
  show a friendly prompt (`noDealPrompt`) when no deal is selected.

**Navigation model**
- New core `renderWorkspace(page)` renders into `#workspace` keeping
  `id="page-<id>"`, so every existing `navigate('x')` / re-render call site keeps
  working unchanged. `navigate()` is now a thin shim; `goTab(tab)` drives the tab
  strip and logs to the timeline. `updateStatusStrip()` now refreshes the Deal
  Strip + Copilot, so all existing calculator edits update them live. Deal cards
  open via `setActiveDeal` (→ Client tab). The slide-over `#panel` is retained for
  the AI Assessment popover.

**Verification:** JS syntax valid (`node --check`). A jsdom smoke harness drives the
new shell — **31/31 checks green**: login → flex shell, 6 tabs, pipeline + deal
cards, copilot insights, seeded timeline, no-deal prompts, deal activation + live
strip metrics, global search, calculate/loan/ai-pilot tabs, lender switch, settings
overlay open/close, wizard modal open/advance/close, timeline expand, copilot chat,
and clear-deal. No browser was available to run a full visual pass.

**Note / minor deviation:** the Documents tab still lists all documents (not
filtered to the active deal) — preserved from the original `renderDocuments`.

## Round 5 — OCR tester + client-side PDF fallback

- **PDF → image fallback:** PDFs are now rasterised to PNG in the browser via
  pdf.js (first ~3 pages) before being sent to `/api/extract`, so extraction works
  even when an Anthropic account can't accept PDFs directly; raw-PDF upload remains
  the fallback if pdf.js fails to load. Refactored client OCR into shared helpers
  (`fileToPayload`/`pdfToImages`/`buildExtractPayload`/`callExtract`).
- **Drag-and-drop tester:** the Compliance AI page now has a tester that takes a
  PNG/JPEG/PDF and shows the raw extracted JSON (`testExtract` → `#ocrTestOut`), so
  OCR can be sanity-checked before relying on it in a deal. Demo mode shows a
  backend-required message instead of calling out.
- Loaded pdf.js (legacy UMD) via CDN; `BACKEND.md` updated.

**Verification:** jsdom smoke still all green in demo mode — new checks confirm the
OCR helpers + tester exist and that `testExtract` shows the backend-required
message offline. JS syntax valid.

---

## Round 4 — CI deploy + real document OCR

- **GitHub Actions → Netlify** (`.github/workflows/netlify-deploy.yml`): deploys
  on push to `main` / the working branch using `netlify-cli`. Gated on
  `NETLIFY_AUTH_TOKEN` + `NETLIFY_SITE_ID` repo secrets; skips cleanly if unset.
- **Real OCR** (`netlify/functions/extract.js` → `/api/extract`): sends uploaded
  images/PDFs to Claude vision and returns structured income/liability JSON
  (server-side key, Supabase-session gated). Client `extractFiles()` reads files
  to base64, calls the function, and `mergeExtracted()` validates the returned
  type codes before pushing lines into the calculator. Wired into the deal
  **Documents** tab upload: live AI extraction when signed in, filename-based
  mock in demo mode. Route added to `netlify.toml`; `BACKEND.md` updated.

**Verification:** jsdom smoke still all green in demo mode (extraction guarded by
`aiLive()` ⇒ falls back to mock; `mergeExtracted` validated to ingest valid lines
and reject unknown type codes). `extract.js` passes `node --check`.

---

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
