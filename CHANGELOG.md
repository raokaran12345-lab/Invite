# DebtIQ v6 — Changelog

## Round (redesign · Phase 4) — Polish (popover · portal mobile · a11y · integrity chip)

Final polish round closing out the redesign brief.

- **AI Assessment popover (`showAssessment`)** restyled in the editorial
  language: the slide-over now leads with a `VerdictHero` (serif statement +
  featured NDI), followed by a paper commentary block on an ink margin rule.
  Lender + active-deal id in the panel sub-title.
- **Client Portal — mobile-first.** Phone frame moved from a hard-coded
  280×560px box to a responsive shell: ink chassis, paper screen, serif
  italic sub-copy in the phone header. Below 700px the phone expands to
  `max-width:360px` with `height:auto`, centred — usable on real handsets.
- **Calmer integrity chip.** `.fz-chip` (the Documents-tab Clear / Caution /
  Review / Scanning chip) restyled to the IntegrityChip aesthetic: mono +
  tabular, white background, coloured outline only (no filled tint), tiny
  hover brightness shift.
- **Accessibility additions.** Added `role="button"`, `tabindex="0"`, and
  semantic `aria-label`s to the bare-character row controls (`× Remove
  income`, `× Remove liability`, `🗑 Delete document`) so screen readers
  announce them properly.
- **No code-only sweeps needed.** AU-spelling pass: searched for
  Authoriz/Customiz/Organiz/Color/etc. — every hit was either an HTTP header
  name (must remain `Authorization`) or a CSS property (`color`). No copy
  changes required.
- **Print stylesheet** already shipped in the integration round (`@page{
  margin:16mm}` + `print-color-adjust:exact` + `break-inside:avoid` on the
  submission pack); the in-app commentary print rules were validated.

**Verification:** `node --check` clean; jsdom smoke **142/142** (3 new Phase 4
checks: Assessment popover uses verdict-hero; row × buttons carry aria-label;
integrity chip uses mono typography).

## Round (redesign · Phase 3) — Screen polish (Pipeline · Client · Review · Compliance · AI Pilot)

Targeted polish on the remaining journey screens to bring them into the
Editorial + Clinical language. No backend or contract changes; primitives from
Phase 1 reused throughout.

- **Pipeline filter chips** now carry per-stage **mono counts** (`All 6 ·
  My Review 1 · Docs Needed 1 · Approved 1`), so filtering is informative at
  a glance.
- **Client tab — compact entity editor** (new `.ent-compact` cards via
  `renderEntityCompactEditor()`). Per-entity kind / role selects, name +
  conditional ABN/trustee inputs, ownership %, **include-in-serviceability**
  toggle, and a remove × when >1. `+ Individual/Joint/Company/Trust/SMSF/
  Partnership` buttons add an entity inline. The full income/liability editor
  stays on Calculate per the audit decision; this delivers the "compact
  editor on Client" ambiguity choice.
- **Extraction Review — serif source-text callouts.** Replaced the inline
  `rev-src` snippet with a styled `<blockquote class="rev-quote">` showing
  the full extracted source text in Newsreader italic, on a paper background
  with an ink left-rule and ornamental quote marks. Low-confidence fields now
  show a calm `Low conf.` status pill instead of an emoji warning.
- **Compliance AI — calmer gating.** API-key-required / blocked / policy-flag
  banners now use a two-column `.comp-gate` pattern (label · body) on paper
  with role-coloured left rules — info=steel, warn=amber, blocked=red — and
  Newsreader italic copy. The four generator cards become `.comp-card`s with
  editorial section heads (caption + serif title); the Full Submission Pack
  card is the featured `.comp-card.featured` (paper + ink rule). Buttons are
  flat ink; emoji generator glyphs removed.
- **AI Pilot — calm DEMO chip + ink hero.** Hero recoloured to flat ink with
  serif headline and italic note; the loud yellow `DEMO` badge is replaced
  with a hairline `.ai-demo-chip` (mono, white-on-ink, pill). The hero's `✦`
  glyph is gone.

**Verification:** `node --check` clean; jsdom smoke **139/139** (5 new Phase 3
checks: filter-chip counts, Client compact editor, Review serif callout,
Compliance comp-card surfaces, AI Pilot calm DEMO chip).

## Round (redesign · Phase 2) — Shell: role toggle · Assessment screen · Conditions tab · actor-coloured timeline

Phase 2 of the broader frontend refresh — wiring the new design system through
the shell. No backend changes; existing screens keep working.

**Role toggle (Broker | Assessor)** in the command bar — a segmented control
(monospace, ink-on-page) next to the avatar. `setRole(role)` flips
`state.role`, toggles `body.role-assessor`, updates button `aria-pressed`, and
logs the role-switch to the timeline. Defaults to *Broker*.

**Assessment tab** (Assessor role only). Added a 7th tab `data-tab="assessment"`
that's CSS-hidden under broker mode (`body:not(.role-assessor) .os-tab[data-tab="assessment"]{display:none}`).
Switching to broker while on Assessment auto-returns to Pipeline.

**`renderAssessment` (new workspace screen)** — deterministic from existing
signals, no new `/api/*` calls:
- **Decision Engine Output** band: serif statement (`APPROVE` /
  `RR05-Referred` / `DECLINE`) in role colour, italic plain-English note,
  timestamp, and a lending-category block (A/B/C/D) with routing line.
- **Decision Analysis** — `CodeChip` reasons derived from the file:
  `LMI01` (LVR>80), `DTI01` (DTI>6), `IQA07` (forensic REVIEW), `CON01`
  (open conflicts), `M033` (low-confidence extractions), `VAL01` (no certified
  valuation), `SRV01` (FAIL serviceability).
- **The 4 Cs** — Character · Capacity · Capital · Collateral, each
  Strong/Adequate/Weak with a one-line italic basis pulled from
  `computeServiceability()` + integrity/conflict signals + securities.
- **Approve / Refer to DCA / Decline** action buttons; `logAssess(action)`
  writes an `ASSESSOR_DECISION` audit entry with role `assessor`.

**Conditions panel tab** (slide-over deal panel). New tab between Documents and
Commentary. `derivedConditions()` auto-derives a list from current signals —
`VAL01` (certified valuation), `INC02` (income docs present), `LMI01` (LVR>80),
`DTI01` (DTI>6), `IQA0n` per forensic review doc, `CON0n` per open conflict.
Each card shows the `CodeChip`, category, italic detail, resolve-at stage, and
Outstanding/Satisfied. Progress bar at the top: "*N* of *M* satisfied".

**Timeline actor dots.** `logEvent(text, actor)` now records an actor
(`broker` / `processor` / `assessor` / `ai` / `system`), and each `.tl-event`
renders a coloured `.tl-dot` prefix. `auditLog` passes its role through to
`logEvent` so forensic / extraction / pipeline events show as `ai`, broker
actions as `broker`, etc. Seeded timeline events tagged.

**Calm copilot quick-actions** — replaced the emoji glyphs (📄 ✦ ⚖ 🛡) on the
copilot panel with calm mono text labels (`Pack`, `Pilot`, `Compare`, `Scan`),
matching "no mascot, no emoji" from the brief.

**Verification:** `node --check` clean; jsdom smoke **134/134** (10 new Phase 2
checks: role default + Assessment hidden; `setRole(assessor)` flips state +
buttons; Assessment renders Decision Engine Output + 4 Cs + reason CodeChips;
`logAssess` writes an Assessor audit entry; `setRole(broker)` returns to
pipeline; Conditions panel tab renders derived `VAL01/INC02/LMI01/...`
cards; timeline events carry actor-coloured dots; copilot quick-actions are
calm text labels).

## Round (redesign · integration) — Login split, Editorial pack, Verdict reveal, Violet sweep

Four-pass integration of the finished design language into the live screens. No
backend, contract, auth, or `lenders.js` changes; demo and live-backend modes
both still work; every existing handler/ID/data flow preserved.

**Pass 1 — Login split layout.** `#login` is now a two-column grid: left **ink**
editorial hero (logo glyph + serif positioning line + a muted *Serviceable.*
verdict motif + 25-lender / 3-layer / 100% proof points + foot caption); right
clinical **paper** sign-in card at 8px radius. Kept exactly: `#loginEmail`,
`#loginPass`, `onclick="doLogin()"`, the `#authExtra` slot, and the demo-creds
block. Primary button is flat `--ink`; focus rings are steel
`box-shadow:0 0 0 4px rgba(59,111,181,.16)` with `border-color:var(--steel)`.
Gentle `loginFadeUp` entrance with a `prefers-reduced-motion` guard. Stacks
under 860px to a compact ink header + form (proof tiles hide on mobile).

**Pass 2 — Submission pack.** `buildPackHTML(r,pol,d,nl,ent,deal,bidText,
servicingText)` rewritten as a credit-memo: Newsreader masthead + section
titles, Plus Jakarta Sans column heads, DM Mono figures throughout; numbered
sections **01–12** (Application Summary · Applicants & Entities · Securities ·
Employment & Income · Liabilities · Serviceability · R&O · Commentary · Policy
Alignment · Document Checklist · Broker Declaration · Source Documents). The
Serviceability section now renders a **verdict band** (serif statement +
italic note, ink rule + assessment-buffer block) and **four hairline gauges
with ceiling ticks** (DSR / NDI / LVR / DTI). Commentary blocks use an ink
margin rule and Newsreader body. Provenance appendix renders source-text in
serif italic with mono confidence. Print button = `--ink` (no violet shadow);
dedicated `@page{margin:16mm}` + `print-color-adjust:exact` +
`break-inside:avoid` on sections / tables / gauges / commentary. Every data
expression (`computeServiceability`, `getShadedIncome`, `assessLiability`,
`lenderChecklist`, `collectProvenance`, `totalSecurityValue`, etc.) and the
function signature are untouched.

**Pass 3 — Verdict reveal.** A four-step pipeline (Reading documents · Shading
income · Stress-testing · Checking policy) runs in `#calcResults` before the
result panel paints. Each step animates ~420ms with a steel spinner that
resolves to a green tick. The verdict then renders via the existing
`renderCalcResults` (so gauges sweep on their own CSS transition), NDI
**counts up** to the real value via `animateCount`, and a **"Caught before
lodgement" stamp** + discreet **↻ replay** chip prepend to the results.
Everything reads off `computeServiceability()` — no hardcoded figures.
`useLender` and `applyLever` reset the reveal flag so switching lender or
applying a lever re-runs the pipeline. `prefers-reduced-motion` skips the
pipeline and renders the final state immediately.

**Pass 4 — Violet sweep & motion guard.** Eradicated every remaining
`rgba(91,79,245,…)`, `#5B4FF5`, `#8B5CF6`, `#A78BFA` outside the brand-mark
`--logo-grad`. Sites recoloured to ink/steel tints:
focus rings (`#globalSearch`, `.search input`, `.inp …:focus`) → steel
`rgba(59,111,181,.16)`; `.copilot-suggestion`, `.bulk-drop:hover/.over`,
`.pill.violet`, `.tile.sel`, `.addback-row`, `.market-card.active`,
`.pilot-step.running .pilot-ico`, the dashboard KPI icon, the documents
processing KPI, the market-row highlight, the Compliance "Full Pack" card,
and the chart series in both flow visualisations all moved to ink/steel.
The `rankLenders` non-AU default colour moved to ink. The `@keyframes glow`
block was deleted (the brief bans glow). A single global
`@media (prefers-reduced-motion: reduce)` block now collapses
animation/transition durations to ~0 across the page.

**Verification.** `node --check` clean. Sentinels confirmed empty:
`rgba(91,79,245`, literal `#5B4FF5`/`#8B5CF6` outside `--logo-grad`,
`animation:glow`. jsdom smoke **124/124 green**, including 7 new assertions:
reveal completes → `state.calcRevealed=true`, caught-stamp present, replay
button present, `useLender` re-resolves the reveal, `replayCalcReveal`
returns to a revealed state, plus a DOM-wide scan confirming no violet
literals leak outside the brand-mark gradient.

## Round (redesign · Phase 1) — Editorial + clinical design system

Frontend refresh: token system, fonts, and primitive components. No backend or
contract changes; existing rendering keeps working via back-compat aliases.

**Defaults locked for the 7 audit ambiguities** (Phase 0 deliverable, recorded
here): single-file vanilla JS idiom retained; storybook lives at
`?preview=1`; Client tab will gain a compact entity editor (Calculate keeps the
full one); source-text rendered as a callout in Review (no image-overlay);
Assessor decisions are deterministic off existing signals (no new API);
Newsreader added as the serif; AU-spelling sweep happens during Phase 3 screens.

**New token system** (`:root`):
- Surfaces: `--page #EEEAE1`, `--paper #FBFAF6`, `--white #FFFFFF`.
- Structural/interactive: `--ink #1E2A44` (replaces violet), `--steel #3B6FB5`.
- Hairlines: `--line #E7E2D6` (warm, paper), `--line2 #EAEDF1` (cool, white).
- Text: `--t1/t2`, plus `--t3-warm` and `--t3-cool` for paper vs clinical labels.
- Status: `--green #0B6B4F`, `--amber #9A5A00`, `--red #A92626` (deepened).
- Brand identity: `--logo-grad` keeps the violet gradient *only* on the brand
  mark (`.logo-mark` + `.login-logo`). `--brand-grad` aliased to flat `--ink` so
  every other surface (buttons, hero strips, wiz head, market hero, deal pill,
  drawer handle) instantly recolours to ink.
- Radii tightened: cards/inputs/buttons → 8px, pills → 100px, clinical squares → 2px.
- Shadows minimal (`0 1px 2px rgba(60,50,30,.04)`); hairlines do the work;
  `--sh-brand` glow removed.
- Type: Newsreader loaded as `--serif`; Plus Jakarta Sans and DM Mono retained.

**Primitive components** (CSS class + JS helper) ready for Phase 3 reuse:
- `VerdictHero` (`.verdict-hero` + `verdictHero(verdict, note, label, value)`):
  ruled caption · serif statement (Serviceable. / Borderline. / Does not service.)
  in role colour · italic plain-English note · featured mono figure.
- `MetricGauge` (`.metric-gauge` + `metricGauge(label, value, cap, {format})`):
  hairline track with **ceiling tick** and a mono cap label.
- `LedgerRow` (`.ledger`/`.ledger-row` + `ledgerRow({status,color,label,note,value})`):
  status square · colour-dot · label · serif-italic note · right-aligned mono.
- `CodeChip`, `StatusPill`, `IntegrityChip`, `ConfidenceBar`, surface helpers
  (`.surface-paper`/`.surface-white`/`.rule`/`.caption`), `.serif`/`.num` helpers.

**`?preview=1` storybook route.** A gallery page (renderered by `showDesignPreview`)
showing every primitive on `--page`, including VerdictHero in all three states,
two banks of MetricGauges, a multi-lender ledger with italic policy citations,
status/integrity/code chips, and a typography exhibit.

**Verification:** `node --check` clean; jsdom smoke **117/117 green** (8 new P1
checks: verdictHero PASS/FAIL renderers, metricGauge cap-tick rendering and
over-cap severity, ledgerRow value/note, codeChip output, integrityChip mapping,
`showDesignPreview` gallery boots).

**Visual impact note:** because the existing app uses `--bg / --surface / --brand`
extensively, this round automatically recolours the running UI — backgrounds warm
to paper, accents become ink, corners tighten to 8px. Old screens are now
*calmer* but still use the legacy markup; Phase 3 will swap them to use the new
primitives end-to-end. The brand-mark gradient survives only on the logo glyph.

## Round (bugfix-27) — 5-stage fix: calculator output, deal capture, persistence, state desync, markup

Surgical second bugfix pass building on the previous round, covering the remaining
items in the 27-bug brief. No refactor outside the quoted edits.

**Stage 1 — calculator output**
- **1.2** Coerced every `nl.rate.toFixed(...)` site (4×) with `(+nl.rate||0).toFixed(...)`
  so clearing the rate field doesn't crash the calculator.
- **1.3** `fmtMoney` guards `NaN`/`undefined` → `"$0"` instead of `"$NaN"`.
- **1.9** Rate-slider floor lowered `min="3"` → `min="2"` in all three sites
  (detailed calc, manual editor, loan tab).
- *(1.1 verdict, 1.4 HEM 28% floor, 1.5 card-limit DTI, 1.6 manual DTI, 1.7 self-emp shade ×, 1.8 engine lender id — already applied in the prior bugfix round; sentinels confirmed zero.)*

**Stage 2 — deal capture**
- *(2.1 wizard step 2 wiring, 2.2 unique deal id + real borrower name, 2.5 AI-Pilot 2-year income shape — already applied; sentinels zero.)*
- `esc` promoted to top-level (now a `function esc` alias of `escHtml`); the local
  redefinition inside `buildPackHTML` was removed.

**Stage 3 — persistence**
- **3.1** `saveDeal` snapshots `state.calc` onto `d.calc` when saving the active deal.
  `loadDealIntoCalc` and `setActiveDeal` now restore from `d.calc` when present (so
  reopening a saved deal returns its incomes/liabilities/entities — not the default).
- **3.2** `loadDeals` maps Supabase rows through `mkDeal` so older saved records pick
  up new schema defaults.
- **3.3** `saveAccount` now writes a visible name (`#cmdUserName` added next to the
  command-bar avatar) and stores it on `state.userName`.

**Stage 4 — state desync**
- **4.1** `advanceDeal` refuses to move a deal whose status isn't in the workflow
  order (e.g. `MORE_INFO`) — was silently snapping back to `DOCS_PENDING`.
- **4.2** When the slide-over panel is open on the active deal, `advanceDeal`
  re-renders it so the status pill updates.
- **4.4** The AI-progress ticker is held on `state._aiTicker`, idles when nothing is
  processing, and re-renders only when `#page-dashboard` is mounted.
- *(4.3 removeEntity min-1 guard, 4.5 portal `simUpload` doc creation, 4.6 seed dates — already applied.)*

**Stage 5 — markup & polish**
- **5.5** LVR fallback removed (`nl.amount/0.8`/`|| 1` were producing fake 80% / huge
  LVRs); `computeServiceability` now returns `propValue` + `lvrAvailable`, and the
  visible LVR sites (gauges, result boxes, deal-strip chip) render `'—'` when no
  security value is set.
- **5.6** `deleteDoc` looks up the target object first, then removes by stable
  index — so deletion from a re-ordered list always removes the intended row. Added
  a null guard around the re-render so it can be called when the Documents tab
  isn't mounted.
- *(5.2 user-string escaping, 5.4 panel close transition — already applied.)*

**Verification:** `node --check` clean. Sentinels confirmed zero:
`ndi>-500`, `892+Math.floor`, `name:'New Application'`, `*0.28`, bare
`nl.rate.toFixed(`, `min="3" max="12"`, `(parseFloat(nl.amount)/0.8)`. jsdom smoke
**109/109** green, including 6 new assertions: `fmtMoney(NaN)`→`"$0"`,
`advanceDeal('MORE_INFO')` no-op, `deleteDoc` removes the targeted object across
re-orderings, `saveDeal` attaches `d.calc` for the active deal, `loadDeals` runs rows
through `mkDeal`.

## Round (bugfix) — verdict logic, unique deal id + real borrower name, wizard data capture, DTI card-limit fix, manual DTI, HEM floor removal, self-emp shade display, portal upload, AI-pilot income shape, panel transition, output escaping, engine lender-id, seed dates

Targeted, surgical bug fixes — no refactor. Every change quoted in the brief is applied verbatim across all occurrences.

- **C1 — verdict logic.** `else if(ndi>-500 || dsr<dsrMax+10)` (2× in `computeServiceability` and `computeManual`) becomes `else if(ndi > -250 && dsr < dsrMax+5)`. A deal $50k/mo underwater now returns FAIL instead of BORDERLINE.
- **C2 — unique deal id + real name.** `submitDeal` now generates a monotonic id (`'D-'+(maxNum+1)` from the existing DEALS) and names the new deal from the wizard's borrower fields (`firstName`+`lastName`) — fallback to entity 0 name, then `'New Application'`. Email/phone also carried.
- **C3 — wizard borrower step.** Every input wired to `state.wizData` (`firstName/lastName/email/phone/dob`) and Dependants to `state.calc.dependants`; values restored from state on re-render. `state.wizData` defaults extended. `wizGo` syncs entity 0's name from the borrower fields.
- **C4 — DTI no longer counts card limits as debt.** `totalLiab += parseFloat(l.balance)||0;` (2×) is guarded by `if(l.type!=='credit_card')`. A $15k card with $0 balance no longer inflates DTI by $15k.
- **C5 — manual DTI.** Uses APRA-correct DTI = (existing-debt **balance** + new loan) / gross income. Adds an optional `existingDebtBalance` input (state + editor) for accuracy; otherwise a ~5-year-of-repayments proxy from the monthly figure.
- **C6 — HEM floor.** The extra `income*0.28` / `incomeMo*0.28` floor (4 occurrences across `computeServiceability`, `computeManual`, `baseFigures`, and the manual editor copy) is removed. The HEM band table is already correct.
- **H4 — self-emp shade ×.** `updateCalc` now computes the displayed × from the *assessable* base (post add-backs) the same way `getShadedIncome` does, so a self-employed line correctly shows e.g. ×0.80 instead of ×1.07.
- **H5 — portal upload.** `simUpload` now creates a real DOC entry (then auto-verifies it) and logs to the timeline; the previous version only marked the tile done.
- **H6 — AI Pilot output shape.** `applyExtractedProfile` emits incomes with the full 2-year shape (`amount_y1/amount_y2/use_average/evidence_years`) so the calculator's FY columns are populated.
- **M1 — panel transition.** `.panel` gets `transition:transform`; `.panel.show` is now a transform toggle (not an animation), so the panel slides closed as well as open.
- **M2 — output escaping.** A global `esc()` alias of `escHtml` is wired into deal-card name, panel email, panel portal copy, global-search results, Client-tab title, and the two `next_action_note` render sites. A name like `O'Brien & <Sons>` now renders literally.
- **M5 — engine lender id.** Both engine income passes now call `getShadedIncome(inc, state.lender)` explicitly, so per-lender shading (Westpac OT, HSBC foreign) is applied consistently in baseline computations.
- **L1 — seed dates.** D-891 and D-890 `next_action_date` are now relative to TODAY (+2 and +4 days) so the "Next action soon" banner is always live in the demo.

**Verification:** `node --check` clean; sentinels confirmed absent (`grep -nE "ndi>-500|892\+Math\.floor|name:'New Application'|\*0\.28"` returns nothing); jsdom smoke **103/103** green — including new assertions B-C1 (severe shortfall → FAIL), B-C4 (card limit doesn't inflate DTI), B-H4 (self-emp shade respects assessable base), B-M2 (markup in deal name escaped, no injection), B-L1 (D-891 next action date ≥ today), B-H5 (portal upload creates a DOC).

## Round (complexity) — reopenable deal panel, searchable lender picker with buffer explainer, true multi-entity applicant builder, full multi-security model with addresses/valuations/rental, aggregate-LVR rework

Four corrective/additive fixes so the app can hold real broker complexity (multi-applicant, multi-security deals like AOL captures) without losing the simple consolidated output.

**FIX 1 — Reopenable deal panel.** A floating right-edge pill ("⟨ <client> · <id>") appears whenever `state.activeDeal` is set and the slide-over `#panel` is closed; clicking it reopens. The Deal Strip gains an "Open details" (⛶) button next to the back arrow, and a new `togglePanel()` toggles open/closed. `Escape` closes the panel. The panel is never a dead end (three reopen affordances + the deal card).

**FIX 2 — Lender picker.** Wizard step 1 now shows **all 25 AU lenders** (no accreditation gating at deal creation), grouped under "Banks (ADI)" and "Non-bank lenders" sub-headings, sorted alphabetically. A search input (`#lenderSearch` → `filterLenderTiles`) filters tiles live by label / type ("non-bank"/"adi"). Each tile shows type · **buffer %** · max LVR, and a one-line explainer defines buffer ("APRA 3% for banks; lower buffer = higher capacity").

**FIX 3 — Multi-entity applicants.** Entity model now includes `{kind, name, role, abn, trustee_name, ownership_pct, included}`. Wizard step 3 is a true builder: entity cards with kind/role selects, name input, conditional ABN + trustee for company/trust/SMSF/partnership, ownership %, include-toggle, and per-entity income/liability counters with an "Edit financials →" link. `+ Individual/Joint/Company/Trust/SMSF/Partnership` buttons add; remove respects a minimum of one. `computeServiceability`, `baseFigures` and `figuresForLender` now multiply each entity's shaded income by `entityWeight()` (0 if `included===false`, else `ownership_pct/100`), so the engine consolidates cleanly into a **single PASS/BORDERLINE/FAIL verdict**. The submission pack gains a new "Applicants & Entities" section with kind/role/ABN/trustee/ownership.

**FIX 4 — Multi-security model.** New `state.calc.securities[]` with `{address, suburb, state, postcode, property_type, purpose, transaction, value, value_basis, zoning, first_mortgage, existing_mortgage, existing_lender, rental_income, rental_frequency, owner_entity_id, title:{folio,section,block}}`. Wizard step 4 is split into **Part A — Securities** (cards, +Add another, collapsible Torrens title details) and **Part B — Loan structure**. The Loan tab uses the same builder. `totalSecurityValue()` sums `securities[].value` and falls back to `wizData.propValue` when empty — used by `updateWizLVR`, `computeServiceability` LVR, the deal strip, `buildBIDPrompt` and `buildPackHTML`. The submission pack adds a new "Securities" table (Address · Type · Purpose · Transaction · Value · Basis · Owner entity · Existing mortgage · Rental).

**Persistence + demo seeding.** `persistDealIntel(dealId)` now also snapshots `{entities, securities}` to `deal.intel`; `setActiveDeal` restores them. Three demo templates (`DEMO_DEAL_INTEL`) are seeded so the multi-entity complexity is visible on activation: **D-891 Mitchell** (Sarah + Tom, 50/50, 1 OO security), **D-890 Chen Property Trust** (trust + corporate trustee + 2 guarantors + 3 investment securities with rental), **D-888 Patel SMSF** (SMSF + corporate trustee + 1 SMSF residential security). Demo provenance is also baked into the Mitchell template so source-tracing demos survive deal activation.

**Copilot insights.** Now also flag entity count, security count, blank security values and included entities with no income.

**Verification:** `node --check` clean; jsdom smoke **97/97 green**, including: panel open→pill appears→togglePanel reopens; 25 lenders rendered with search filtering and the buffer explainer; multi-entity (add/remove with min-1 guard, `included===false` excluded, `ownership_pct` scales income, single consolidated verdict in the result panel); multi-security (LVR = total lending / total security value, `propValue` fallback when empty, pack renders multi-row Securities table, Chen Trust seed has 4 entities + 3 securities, `deal.intel` survives a JSON round-trip).

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
