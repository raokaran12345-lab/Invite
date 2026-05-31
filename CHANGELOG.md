# DebtIQ v6 — Changelog

## MASTER program — Regulatory Source Manifest ingest + provenance layer

Ingested the authority document (`docs/regulatory-source-manifest.md`) and
honoured its core rule: **don't treat any threshold as authoritative until
the operative clause is read from the official instrument.**

- **Attempted source fetches** of every official URL (APRA APS 220 / APG 223,
  ASIC RG 273 / RG 209 / INFO 146, OAIC APPs). **All returned HTTP 403** in
  this environment — the regulators' sites block automated egress here, so the
  agent could **not** verify clauses at source.
- **`REG_SOURCES` provenance registry** (in `index.html`) — every engine /
  compliance rule now cites its **instrument + sections-to-extract + official
  URL + scope + a `verified` flag**, mapped exactly to the manifest's nine
  instruments (buffer/HEM/shading → APG 223; DTI → APS 220 Att. C; BID →
  RG 273; responsible lending → RG 209; disclosure → INFO 146; ADM/privacy →
  Privacy Act + APPs; VOI → AML/CTF; settlement → ARNECC/ECNL; CDR).
- **Everything is `verified:false`** (fetch blocked) → surfaced as
  `LEGAL-REVIEW`. No manifest paraphrase was promoted to "confirmed"; the
  Phase-4 thresholds (6× / 20% / +3%) are now explicitly tagged as encoded-
  but-**not-yet-verified-at-source**.
- **Serviceability worksheet** gains a **Regulatory provenance** section: a
  table of each rule → instrument (clickable official link) → sections to
  extract → what's encoded → `verified` / `LEGAL-REVIEW` badge, with an honest
  "source verification pending (HTTP 403)" banner. The DTI footnote now cites
  APS 220 Att. C via `regProvenance()`.
- **`REVIEW-REGISTER.md`** updated with the 0/11 source-verification table and
  the exact "extract clause → set verified" action for a network-permitted run.
- Smoke: +7 provenance checks; worksheet-step assertion updated to 7 sections
  (**380/380 passing**).

> To complete verification: run the fetches from a network-permitted
> environment (or open the URLs manually), extract the operative clauses, and
> set each `REG_SOURCES[...].verified` to instrument + section + version date.


## MASTER program — Phase 8 (CDR decision) + Phase 9 (finish & verify)

Closing gates of the program.

### Phase 8 — CDR / Open Banking (conditional)
- **Decision: DebtIQ stays OUT of CDR scope; nothing built live.** The
  data model is document-upload + OCR, not direct bank-feed ingestion, so
  CDR accreditation isn't engaged today. `CDR.md` documents the
  determination and the gating conditions (`LEGAL-REVIEW` accreditation +
  `ARCH-REVIEW` isolated subsystem) if direct feeds are ever elected.

### Phase 9 — Finish & verify
- **UX-QA emoji → SVG.** Added `search / upload / check / alert / info /
  x` to the SVG `ICONS` set and converted the standalone affordance emoji
  — toast glyphs, the pipeline search icon, the OCR drop-zone, and the
  dashboard + Verified KPI tiles. (Inline ratio status marks left for a
  brand-guide-driven pass once the guide is committed.)
- **Brand re-verify.** Zero functional violet; ink monogram confirmed at
  every site; tokens documented PRIMITIVE → SEMANTIC → COMPONENT; numbers
  mono + tabular.
- **No un-gated changes.** `/api/*`, auth, and `lenders.js` are untouched
  since the program start; both schema migrations (`0001`, `0002`) remain
  **DRAFT / not applied**; every new capability is localStorage-only and
  demo + live both boot.
- **`REVIEW-REGISTER.md`** — the consolidated `LEGAL-REVIEW` (12 items) /
  `ARCH-REVIEW` (11 items) register for counsel and the owner, plus the
  Phase 9 verification snapshot.
- Smoke: +4 Phase 9 checks (**373/373 passing**).

### Program status
Phases 0, 1-finish, 4, 5, 6, 7, 8, 9 delivered on this branch; Phases 2 & 3
were already shipped (pending visual diff against the authority mockups).
Phases anchored to the authority files (exact DTI thresholds §5, disclosure
field content, ADM wording) are built against publicly-known frameworks and
**flagged `LEGAL-REVIEW`** for verification once the compliance map / brand
guide / mockups are committed.


## MASTER program — Phase 7: settlement coordination layer

DebtIQ now **coordinates** the post-approval path to the conveyancing
handoff. It **does not settle and holds no trust money** — stated plainly
in the UI.

- **New Settlement tab** (broker shell), routed through `WS_RENDERERS` +
  the tab maps, per-deal.
- **Status tracker** across the required stages: formal approval → loan
  docs issued → loan docs signed → settlement booked → **discharge of
  vendor mortgage (key dependency)** → funds cleared → settled. Each
  stage marks done/undo with a timestamp, gated by `settlement.action`
  (Phase 5) and logged.
- **Pre-condition gating:** loan-docs-signed is blocked until **VOI is
  complete** (Phase 6 link); **settled** is blocked until the **discharge**
  is booked; when a **large deposit** is flagged, settled is blocked until
  source-of-funds **clearance** is confirmed.
- **ELNO adapter — isolated, mock by default** (`ELNO_ADAPTER`, PEXA mock):
  create-workspace + book-settlement return simulated results with **no
  network and no credentials**. Real connectivity, subscriber eligibility,
  and any trust-money flow are flagged `ARCH-REVIEW` / `LEGAL-REVIEW` and
  left for a human-enabled step.
- **Settlement risk flags:** VOI status + large-deposit/AML clearance
  timing surfaced as risks; `AML → LEGAL-REVIEW` (reporting-entity status).
- **Persistence:** `state.settlement` keyed by deal id, localStorage
  (`debtiq.settlement.v1`), hydrated on boot. No backend contract change.
- Smoke: +10 Phase 7 checks (**369/369 passing**).


## MASTER program — Phase 6: compliance-evidence features

Built the FEATURES that **evidence and enable** the compliance-map
obligations — product scaffolding, **not** legal conclusions. The code
never states the portal "is compliant", holds a licence, or is an
AML/CDR entity.

> **LEGAL-REVIEW (carried):** disclosure field content & wording, the
> volume-bonus statement, IDR/EDR membership, ACL number, ADM notice
> wording, VOI certified/original/NAATI rules, AML reporting-entity
> status, sub-processor DPAs, and the NDB plan are for counsel.

- **Disclosure-document spine.** `DISCLOSURE_DOCS` registry of six docs
  (Credit Guide, Quote, Credit Proposal Disclosure, Preliminary
  Assessment, Needs Analysis, Pre-contractual) with per-doc **required-
  field lists**. `generateDisclosure()` validates fields, **versions**,
  and **timestamps**; `signDisclosure()` captures a **signed copy**
  (signer + method + time) and blocks signing until fields are complete.
  Everything is attributed to the audit trail.
- **BID & suitability (§3–4).** The existing R&O generator stays; added a
  **living-expense reconciliation** (declared vs HEM floor) and framed
  the extraction→verification→serviceability trail as suitability
  evidence.
- **VOI capture (§6).** Structured per category (primary photographic /
  secondary government / financial), in-date checks, verified flag,
  capture method. `voiComplete()` makes **VOI completeness a settlement
  pre-condition** (consumed by Phase 7). AML flagged `LEGAL-REVIEW`.
- **ADM disclosure (§9).** Plain-language automated-decision explanation
  + version-stamped acknowledgement (`acknowledgeADM()`). Wording flagged
  `LEGAL-REVIEW` (privacy-notice text due 10 Dec 2026).
- **Privacy / retention (§9).** APP 5 collection notice (`recordAPP5()`),
  retention period control (`setRetention()`), and a privileged,
  re-auth'd, logged **PII deletion** action (`deleteClientPII()`). Least-
  privilege + audit come from the Phase 5 access layer.
- **UI.** A "Compliance & evidence" layer appended to the Compliance page
  — disclosure spine cards (generate / re-generate / capture signed copy,
  with missing-field + signed-by readouts), VOI matrix, suitability
  reconciliation, ADM notice + acknowledgement, and privacy/retention
  controls. Guarded re-render (`rerenderCompliance()`).
- **Persistence.** `state.compliance` keyed by deal id, localStorage
  (`debtiq.compliance.v1`), hydrated on boot. No backend contract change;
  persisting to Supabase is flagged `ARCH-REVIEW`.
- **`COMPLIANCE.md`** — disclosure register, **data-flow map**, **breach-
  response runbook stub**, ADM explanation, and the full evidence map,
  all with `LEGAL-REVIEW`/`ARCH-REVIEW` markers.
- Smoke: +11 Phase 6 checks (**359/359 passing**).


## MASTER program — Phase 4: serviceability engine, 2026 rules

Updated the engine to the current APRA framing. Buffer **+3%**, the
**HEM floor** `max(declared, band)`, and **per-lender income shading**
were already in place; this phase reworks the **DTI** treatment from a
generic 6×/9× "restricted threshold" into a **per-lender appetite
FLAG**, never a hard block.

> **LEGAL-REVIEW:** all DTI thresholds, the ~20% high-DTI bucket, and the
> exemption set reflect the publicly-known APRA framework and are
> **indicative pending the compliance map (§5)**. They are surfaced as
> lender-appetite intelligence; the code never asserts compliance.

- **`dtiPolicy(lender)`** — derives the high-DTI threshold (default 6×),
  very-high band (9×), and the high-DTI **bucket %** per lender: ADIs
  (`apra_regulated`) → 6× / ~20% of new lending; non-ADIs → flagged for
  appetite with **no APRA bucket** (specialist book). Honours optional
  `dti_high` / `dti_bucket_pct` overrides on a lender policy.
- **`dealSegment(purpose)`** — owner-occupier vs investment separation.
- **`dtiExempt(purpose)`** — **owner-occupier bridging** and
  **new-build/construction** are exempt from the high-DTI bucket.
- **`dtiAssessment(value, lender, purpose)`** — the canonical structured
  result (`value, threshold, segment, adi, bucketPct, exempt, high,
  veryHigh, flagged, countsToBucket`), ridden along on every
  `computeServiceability()` result as `r.dtiAssess`.
- **DTI never changes the verdict.** `verdict` is still driven by NDI +
  DSR only — a high DTI flags appetite, it does not fail serviceability
  (verified in the smoke suite).
- **`dtiFlagText()`** — one appetite-framed sentence shared by the
  worksheet, verdict insights, conditions, gap-finder and the submission
  pack. No "exceeds restricted threshold" / "fail" language for the 6×
  band; ≥9× recommends specialist/non-ADI with documented rationale.
- **Serviceability worksheet** — the DTI row is now a **flag, not a
  ceiling** (never renders `fail` on its own), shows the bucket/segment
  working inline, and a footnote explains the appetite-flag treatment +
  exemptions + the `LEGAL-REVIEW` caveat.
- Re-framed every downstream surface: assessor decline-reasons (now a
  medium appetite flag), deal conditions (`DTI01` — "High DTI — appetite
  flag", with the exemption-aware text), deal-spine insights (shows
  bucket consumption), the gap-finder, and the submission-pack policy
  flags (now shown whenever flagged, independent of verdict).
- Smoke: +8 Phase 4 checks (**348/348 passing**).


## MASTER program — Phase 1-finish (brand foundation cleanup)

Low-risk, no-backend interleave done while the authority files are
pending. Confirmed most of Phase 1 was already shipped (tokens, fonts,
ink-monogram logo at every site, violet colour fully retired,
mono+tabular numbers global) and closed the genuine remnants:

- **Violet remnants removed (honesty).** The colour was already gone
  (`--brand-grad:var(--ink)`, no violet hex, no `--logo-grad`); the only
  leftovers were the `.violet` **class names**. Renamed the functional
  class and all references to `.neutral` (pill style, `STATUS_META`
  AI-Processing/Submitted, the Processing status maps, the lender-policy
  buffer pill, the AI-recommended pill, the intel tag map, and the
  serviceability-commentary card tone). The lone surviving mention of
  "violet" is a comment documenting that the palette has *none*.
- **Token architecture made explicit.** Annotated the `:root` header to
  name the three layers — PRIMITIVE (raw values, this block only) →
  SEMANTIC (purpose aliases components reference) → COMPONENT (per-widget
  vars) — so the "no raw hex in components" rule has a documented home.
- **In-app styleguide entry.** The brand styleguide was reachable only
  via `?styleguide=1`; added an **Open brand styleguide ↗** button in
  Settings → Account (`openStyleguide()`, opens in a new tab so the
  working session is kept) and updated the styleguide footer note.
- **Verified** the ink monogram is identical across favicon, login,
  broker cmd-bar, assessor cmd-bar, and the submission-pack masthead.
- Smoke: +4 Phase 1-finish checks (**340/340 passing**).

> Deferred to Phase 9 (UX-QA sweep): converting inline status **emoji**
> (✓/✕/➜/⚠/🔍) to SVG — that's a UX-QA item, not part of Phase 1's
> stated scope, and is best done against the brand guide once committed.


## MASTER program — Phase 0 (audit) + Phase 5 (access control / RBAC)

First two gates of the full-integration program. **Phase 0** was a
read-only audit (no code change) delivered in chat: stack/state/
routing/backend inventory, a dependency-ordered build plan, and a
`LEGAL-REVIEW:`/`ARCH-REVIEW:` register. Key finding — the six
authority files (compliance map, brand guide, the mockups) are **not
in the repo**; phases anchored to them (4, 6, and the visual diffs of
2/3) wait until they're committed. The live repo is well ahead of the
prompt's assumed snapshot (brand tokens, fonts, violet-retirement,
broker overhaul and lending-group model already shipped).

Housekeeping: removed the stray, unrelated `Engagement Invite`
wedding-invitation HTML from the repo root.

### Phase 5 — Access control / RBAC (owner-held)

Built the access model **structure-first and demo-first**: no real
accounts, passwords, or secrets are created by the agent; no `/api/*`
contract, auth flow, or live schema is changed. Both demo and live
keep working.

- **Roles** (highest→lowest): Owner → Admin → Broker → Processor →
  Read-only. **Deny-by-default** capability map (`CAPABILITIES`) —
  `can(cap)` is false unless the effective role explicitly holds it.
- **State + persistence.** `state.access` (org, members, invitations,
  append-only `authLog`, session) persisted to `localStorage`
  (`debtiq.access.v1`), mirroring the new draft migration. Hydrated on
  boot; session clock started on boot.
- **Demo vs live.** Demo enforces the simulated/own member role (with a
  "view as role" preview so deny-by-default is visible). Live mode,
  until membership tables are wired (`ARCH-REVIEW`), keeps today's
  per-user RLS behaviour so nothing breaks.
- **Owner primacy.** Only an Owner can grant/revoke Owner; Owner can't
  be granted by invite; **at least one active Owner must always exist**
  (enforced in-app and by the `enforce_last_owner` trigger in the
  migration). Admins manage everyone except Owners.
- **Helpers:** `can`, `requirePermission` (toasts + logs denied
  attempts), `effectiveRole`, `inviteMember`, `revokeInvite`,
  `acceptInviteDemo`, `changeMemberRole`, `removeMember`, `isOwner`,
  `ownerCount`, `authAudit`, session helpers (`startSession`,
  `touchSession`, `checkSessionTimeout`, `requireReauth`,
  `reauthFresh`), `canViewPII`, `maskPII`, `exportPII`,
  `setSimulatedRole`.
- **Invitation flow.** Owner/Admin issues a scoped, time-limited,
  token-**hashed** invite; the invitee completes their own credential
  setup via the normal sign-in path — DebtIQ never sets a password or
  creates the account. Demo "simulate accept" + revoke included.
- **Sessions.** Configurable idle timeout (default 30 min) + **re-auth
  for sensitive actions** (role change, member removal, PII export,
  settlement) cached 5 min; visible session info.
- **PII controls.** Email/phone **masked** for roles without
  `pii.view`; **PII export** is privileged (`pii.export`) + re-auth +
  audit-logged, producing a downloadable JSON.
- **Audit & privilege log.** Append-only; every auth/privilege event
  recorded. Mirrors `auth_audit_log` (insert+select, no update/delete).
- **UI.** New **Team & Access** settings tab — members table (inline
  role editing where permitted; Owner rows protected), invite form +
  pending list, sessions panel, PII export, a full **permission
  matrix** reference, the audit log, and a secrets-posture note.
  Keyboard + `:focus-visible` rings throughout.
- **Enforcement wired** (additive, no-op when live-unwired) into
  `startNewDeal` (deal.create), `submitDeal` (deal.submit),
  `generateSubmissionPack` / `generateGroupPack` (pack.generate),
  `openCreateGroupPrompt` (group.manage).
- **Reviewable migration — NOT applied:**
  `supabase/migrations/0002_access_control.sql` — `organisations`,
  `memberships` (role enum), `invitations` (token-hashed),
  `auth_audit_log` (append-only), `has_org_role()` helper,
  `enforce_last_owner` trigger, additive nullable `deals.org_id`, RLS
  on every table. Applying it is an `ARCH-REVIEW`/owner action.
- **`SECURITY.md`** — secrets posture, the RBAC matrix, audit/session
  model, PII controls, and a gated security baseline (recommended CSP/
  `_headers`, CORS tightening, rate limiting) with the full
  `LEGAL-REVIEW:`/`ARCH-REVIEW:` register.
- **Smoke harness:** +19 Phase 5 checks (**336/336 passing**) — helper
  exposure, deny-by-default, owner-all / readonly-none, view-as
  simulation flips `can()`, PII masking, owner-only invite + no
  owner-by-invite, last-owner protection, logged role change,
  append-only log growth, persistence, access-pane render, and
  readonly being blocked from `startNewDeal`.

**Gate:** stopping here for review before Phase 6. Phases 1-finish, 4,
6, 7 still pending; 4/6 need the authority files.


## Lending Group brief — Phase 4: polish + voice + re-verify

Final pass on the round-2 lending-group work. Small but deliberate
quality fixes; full smoke re-verified end-to-end across the new
Pipeline Deals/Groups round-trip.

- **"Signal not a gate" hint on the group detail.** When a group has
  any unresolved blockers, an amber inline callout surfaces above
  the rollup: *"N pending items across the group — listed under
  each deal below. You can still generate the pack; strict
  stability is a quality signal, not a submission gate."* This
  makes the user's locked decision (strict rules but still
  submittable) explicit in the UI, so brokers see exactly what's
  pending without thinking the system is blocking them.
- **Group pack button stays enabled regardless of stability.** The
  Generate-group-pack CTA never disables — confirmed by smoke.
- **AU spelling sweep.** Searched the codebase for US/UK divergence
  hotspots (organise/organize, finalise/finalize, analyse/analyze,
  customise, optimise, colour/color, behaviour/behavior, favourite,
  enrolment, licence/license). The only remaining `behavior` hits
  are the DOM-API `scrollIntoView({behavior:'smooth'})` and CSS
  `scroll-behavior:auto` — both must stay (browser API + CSS
  keyword). "Credit licence (ACL)" already correct (noun = -ce).
- **Brand voice review of the new Phase 2/3 surfaces.**
  - Group empty state, proposal banner body, recut hint, fac-hint,
    pack lede paragraph, and signal-not-gate body all use the
    italic Georgia serif for soft copy (matches the existing
    editorial voice for explanatory text).
  - Stability pills, rollup labels, deal-row IDs, facility tags,
    pack pills, and pack table headers all use Menlo/mono with
    tabular-nums + uppercase letter-spacing (matches the existing
    "data atom" type system).
  - Group titles, page heads, deal-card names, and pack section H2s
    use the serif at 500 weight with -.005em letter-spacing (matches
    the existing display type).
- **Keyboard + focus accessibility on every new control.**
  - Pipeline toggle: role="tablist", aria-selected, focus-visible ring.
  - Group cards + group deal cards: role="button", tabindex=0,
    Enter/Space keydown handlers.
  - Facility rows in group detail: tabindex=0, `M` keyboard shortcut
    to open the move chooser (per the multiway re-cut decision).
  - Facility editor P&I/IO toggle: role="tablist", aria-selected,
    focus-visible ring.
  - Security chips: aria-pressed=true|false per toggle state.
- **Smoke harness final** — +4 Phase 4 checks (317/317 passing):
  - signal-not-gate hint renders for unstable groups
  - group pack button is never disabled
  - Pipeline Groups view persists through tab round-trip
  - Pipeline Deals view returns to the existing deal grid intact
    (no regression in the Phase-1 dashboard render path)

## Lending Group brief — Phase 3: facility editor + re-cut UI + group pack

Second half of Part B. The model from Phase 2 is now interactive end
to end: brokers edit facilities per deal, move them between deals in a
group with three different interaction methods, and generate a single
coordinated submission pack spanning the whole group.

### Per-deal facility editor (B6)
Replaces Step 7's single-loan inputs with a unified facility list.
- **Model.** `state.calc.facilities[]` siblings `state.calc.newLoan`.
  Primary (facility[0]) keeps living in `newLoan` so the ~30 legacy
  callers (KPI strip, copilot, commentary, max-loan finder, AI
  prompts) keep working. Extras live in `facilities[]`. The editor
  treats them identically — broker sees one list.
- **Helpers** (all globally callable): `allFacilities()`,
  `primaryFacilityFromCalc()`, `addFacility()`, `removeFacility(id)`,
  `splitFacility(id)`, `updateFacilityField(id, field, value)`,
  `toggleFacilitySecurity(id, secId)`, `totalFacilityAmount()`,
  `totalNewLoanMonthly(buffer)`.
- **UI.** Living-expenses card (Adults + Dependants) on top; below it,
  a Facilities card with one row per facility. Each row: P&I/IO
  toggle · Amount · Rate · Term · IO yrs (when IO) · security chips
  (multi-select for cross-collateralisation) · [Split] · [Remove]
  (primary can't be removed). + Add facility button at the bottom.
- **Serviceability multi-facility.** `computeServiceability()` now
  sums payments across every facility. IO facilities assess at the
  *higher* of IO-pay or post-IO P&I-revert over the residual term
  (lender-standard treatment — avoids understating debt service).
  LVR and DTI use `totalNewAmt` across facilities, not just primary.
- **assessedRate** on the serviceability return still reflects the
  primary's contract + buffer (the headline figure brokers recognise);
  the per-facility breakdown lives in the new `r.facilities` array.

### Re-cut UI (B5) — three interaction methods, per your "multiway 1,2,3"
Brokers can move a facility from one deal to another within the same
group three different ways — choose whatever's fastest in context.
- **(1) Drag-and-drop.** Each facility row in group detail is
  `draggable="true"`; deal cards accept drops via dragover/drop
  handlers. Source row goes translucent (`.dragging`); target deal
  gets a dashed steel-blue ring (`.drop-target`).
- **(2) Move-control.** Each facility row has a "Move →" button
  that opens a chooser listing the other deals in the group.
- **(3) Keyboard alt.** Focus a facility row and press `M` to open
  the same chooser. Row hint: *"drag a facility onto another deal
  in this group · or use the Move button · or focus a row and
  press M"*.
- **`moveFacility(srcDeal, facId, tgtDeal)`** splices the facility
  out of source, re-ids it under the target deal, pushes onto
  target, then bumps the group's `proposal_status` to `'recut'`
  (the proposal banner flips amber so the broker has a visual
  marker the group is no longer the AI's proposed shape).
- **Primary facility can't be detached** — it's the deal's anchor,
  so a primary move means moving the whole deal (the brief calls
  this out). Move on a primary toasts the explanation.

### Group submission pack (B7) — cover + per-deal append + cross-deal summary
- **Cover page.** Group id + name + broker + date + status badge
  (proposed / confirmed / re-cut) + stability badge + a lede
  paragraph in italic Georgia that frames the submission for the
  assessor, followed by a rollup table (total lending, group LVR,
  security value, securities count, serviceable deals, status).
- **Deal index.** One row per deal with applicants, lender,
  lending amount, security count, stability pill.
- **Per-deal one-pagers** (one section per deal, page-break-before
  in print): purpose, lender, applicants, totals, facilities table
  (type/amount/rate/term/IO-yrs/secured-by), securities table,
  pending-items callout when stability blockers exist.
- **Cross-deal summary** at the end: every facility in one table
  (with group total), every security in one table (with group
  security value), and a final group-metrics block. Opens in a new
  tab via the existing `openPackWindow()` helper; the new tab is
  fully self-contained (Georgia / Menlo type, ASIC-pack look) and
  prints to A4 with proper page breaks.

### Hydration safety
- `synthCalcForDeal(deal)` derives a minimal calc snapshot from the
  deal blob + `DEMO_DEAL_INTEL` for seeded deals that haven't been
  opened yet — so group rollup, stability and facility rows render
  *something useful* even when `deal.calc` is undefined.
- `dealFacilities`, `computeDealStability`, `computeGroupRollup`
  all route through the synth fallback.

### Smoke harness — +23 Phase 3 checks (313/313 passing)
- Helper exposure · primary facility synthesis from newLoan ·
  addFacility / updateFacilityField / splitFacility / removeFacility ·
  toggleFacilitySecurity flip · computeServiceability sums across
  facilities · `r.facilities` array · Step 7 facility editor render ·
  group-detail re-cut row + Move button + recut hint · moveFacility
  source/target round-trip + 'recut' status flip · group pack
  DOCTYPE + title + cover + deal index + per-deal pages + cross-deal
  summary + facilities/securities tables.

## Lending Group brief — Phase 2: model + Pipeline Deals/Groups toggle

First half of Part B. Introduces the **Lending Group → Deals →
Facilities ↔ Securities** model in-memory + localStorage, and the
Pipeline's new **Deals | Groups** toggle with full group-list +
group-detail views. Facility editing per deal + the re-cut UI ship
in Phase 3. The Supabase migration stays DRAFT (not applied).

- **State + model.** `state.lendingGroups`, `state.activeGroup`,
  `state.pipelineView`. Each group is a thin index over `DEALS` —
  `{ id:'G-N', name, kind, proposal_status, deal_ids:[], data }`.
  Deals stay in `DEALS[]`; group membership is a single id per deal
  (per the user's "deals can move between groups freely" rule).
- **localStorage persistence** under `debtiq.lendingGroups.v1` —
  groups + the chosen pipeline view round-trip across reloads.
  Hydrated on boot via `loadLendingGroups()`. No Supabase changes.
- **Helpers** (all globally callable):
  - `createGroup({ name, kind, deal_ids, proposal_status })`
  - `addDealToGroup(dealId, groupId)` / `removeDealFromGroup(dealId)`
  - `renameGroup(id, name)` / `deleteGroup(id)` /
    `setGroupProposalStatus(id, 'proposed'|'confirmed'|'recut')`
  - `groupOfDeal(dealId)` / `dealsInGroup(groupId)` /
    `ungroupedDeals()`
  - `dealFacilities(deal)` — derives a single implicit facility
    from `deal.calc.newLoan` + every security on the deal. Phase 3
    replaces the derivation with broker-edited facility rows.
  - `computeDealStability(deal)` — strict rules: purpose set, ≥1
    applicant with positive income, ≥1 security with value, ≥1
    facility with amount, no unresolved document conflicts. Returns
    `{ ready, blockers:[] }`. Per the user's "Strict but still
    able to submit" pick, this is a *signal* not a *gate* — the
    Generate-group-pack button never disables.
  - `computeGroupStability(group)` rolls up per-deal stability with
    a per-deal blocker list; `computeGroupRollup(group)` returns
    total lending / group LVR / security value / serviceable count.
- **Pipeline toggle (Deals | Groups).** Sits in the page-head;
  state persists. Switching to Groups while a group is open
  collapses the detail screen back to the list.
- **Groups list view.** Group cards with `id · name · deal count ·
  total lending · stability pill`. Expand inline to see each deal's
  one-line summary + per-deal stability pill + "Open group view"
  CTA. Below: an "Ungrouped deals" section listing deals with no
  group assignment, each with a "Move to group →" button.
- **Group detail view.** Header (id, name, stability + meta) +
  proposal banner + group rollup bar (total lending, group LVR,
  security value, serviceable deals) + per-deal expandable cards
  showing applicants, purpose, facilities, securities, blockers,
  and "Open deal-builder →" / "Remove from group" actions.
- **Proposal banner (B4 — "proposed, not imposed").** Three states:
  `proposed` (steel-blue, Confirm/Re-cut buttons) → `confirmed`
  (green, Re-cut button) → `recut` (amber, Confirm-split button).
  Banner copy explains the default split rule (one deal per
  borrowing entity).
- **Stability pill semantics.** Stable (green) when every deal in
  the group is ready. Pending (amber, with tooltip listing the
  specific blockers per deal) otherwise. Empty (muted) for a group
  with zero deals.
- **Create / move / delete** via the lightweight `window.prompt`
  flows — keeps the surface small. Phase 3 replaces these with a
  proper dialog as part of the re-cut UI work.
- **Empty state** for "no groups yet" explains what a lending
  group IS in editorial voice (family-style submissions, business
  across entities, refi + new purchase) + a Create-group button.
- **Generate group pack** wired to a minimal placeholder — toasts
  the group totals; the full pack generator ships in Phase 3 by
  re-using the existing `buildPackHTML` patterns.
- **setActiveDeal hardened.** When loading a deal that predates
  the Phase 3 purpose field, hydrate `state.calc.purpose` from
  `wizDealTypeToPurpose(d.type)` so stability + the deal-spine
  banner have something to render.
- **Smoke harness** +25 Phase 2 checks (helpers exposed, default
  state, toggle render, empty state, create/add/remove/delete,
  groupOfDeal / ungroupedDeals, persistence round-trip, group
  detail render, proposal banner state transitions, stability
  blocker detection + resolution). **290/290 passing.**

**Deferred to Phase 3 (queued, not half-shipped):**
- Per-deal facility editing (add / remove / split / merge facility
  rows within the atomic deal-builder).
- Re-cut UI (drag-and-drop + Move-control + keyboard alt) for
  moving facilities between deals.
- Full group submission pack generator (replaces the toast).

## Lending Group brief — Phase 0/1: audit + Part A polish (A2 + A9)

Round-2 brief. Phase 0 was an audit-only pass with one new artefact:
the **proposed Supabase migration** for the Lending Group model
(`supabase/migrations/0001_lending_groups.sql`). The migration is
DRAFT — uncommitted-by-default — and must be applied manually via the
Supabase SQL editor. No live database change.

Phase 1 picked up the two Part A items that the previous overhaul
left half-done after the user's confirmation pass:

- **A2 — broker shell spacing parity.** Broker command bar promoted to
  `height:54px` and `padding:10px 18px` so it matches the assessor's
  `.ac-cmd-bar` rhythm exactly. Hairline thickness, gap, vertical
  separators all aligned. Broker chrome stays light paper; assessor
  stays dark ink — by design (per user confirmation), to keep the
  visual distinction between client work and lender review.
  Added the `.cmd-sep` primitive that rhymes with assessor's
  `.ac-cmd-sep`.
- **A9 — progressive disclosure on Calculate.** Completed steps
  auto-collapse to a one-line summary; broker can re-expand any step
  at any time, and that explicit choice always wins over the auto
  rule (the page never fights the broker).
  - `isStepComplete(num)` — Step 1 = purpose set, Step 2 = at least
    one included entity with at least one positive income, Step 3 =
    at least one security with a value, Step 7 = loan amount + rate
    both > 0. Step 6 is the deferred stub and never collapses.
  - `isStepCollapsed(num)` — `state.calc.stepsManual[num]` wins; else
    falls back to `isStepComplete(num)`.
  - `toggleStepCollapse(num)` — toggles + persists user intent.
  - `stepSummary(num)` — emits a calm one-liner (mono+tabular for
    the numbers): "Refinance" / "2 applicants · 4 income, 1 liability
    line" / "1 security · $1,000,000 total" / "$785,000 over 30 yrs
    at 6.24%".
  - `stepHeader(num, title, desc, badge, opts)` now accepts a
    `{ collapsed, summary, clickable }` options bag. The head becomes
    a `role="button"` with `aria-expanded`, full keyboard handling
    (Enter + Space), and a small steel "Edit" pill on collapsed steps.
    CSS gates body visibility via `.step-frame.collapsed`.
- **Smoke** +8 Part A checks (command-bar height + padding, helper
  exposure, Step 1 auto-collapse, summary line render, Step 6
  deferred head is not interactive, user-toggle persists). **265/265
  passing.**

**Schema migration — for review only**
`supabase/migrations/0001_lending_groups.sql` (NEW). Five new tables:
`lending_groups`, `facilities`, `securities`, `facility_securities`
(many-to-many), plus three additive columns on existing `deals`
(`group_id`, `purpose`, `entity_kind`). Full RLS mirrors the existing
`deals` policies; `public.touch_updated_at()` trigger reused. The
existing `deals.data jsonb` blob is untouched so `loadDeals()` /
`saveDeal()` continue to work byte-for-byte. Apply via the Supabase
SQL editor when ready; the frontend will adopt the new shape during
Phase 2 of this brief and gracefully fall back to the existing shape
when the new tables don't exist.

## Broker overhaul — Phase 4: voice & finish

Calm copy, semantic tokens everywhere they belong, monospaced
numbers, AU framing. Small but felt-everywhere.

- **Calmer toasts.** "Deal D-XYZ submitted successfully!" →
  "Deal D-XYZ submitted." "Welcome back, Jordan!" → "Welcome back."
  Same for the broker + assessor variants.
- **Decorative emoji removed** from AI Copilot insights:
  📎 (no docs), 👥 (multi-applicant), 🏠 (multi-security),
  📂 (missing docs), 📝 (extraction review), 🔔 (overdue) all
  replaced with the calmer ⚠ / ▲ / ℹ glyph family already in use
  for semantic state. Document-type icons (used in extraction
  listings) intentionally kept — they're functional, not decoration.
- **Marketing glyphs out** of lender comparison tables. The "★"
  next to recommended lenders and "🏆" next to the best rate become
  small editorial pills ("recommended" / "best") in the green
  semantic colour. AI Pilot button drops its "▶" play arrow.
- **noDealPrompt empty state** retired the 👤 / 🏠 / 📂 ghost emoji
  in favour of the ink monogram SVG already used by the logo;
  copy moved to serif italic for the brand voice.
- **Raw hex literals scrubbed** from components — `#CBD2DC` (5
  dashed-border instances in upload zones and the OCR test pane)
  now `var(--line2)`; `#A7F3D0` (the green-on-ink JSON output)
  now `var(--green-on-ink)`. Inline JS handlers updated to use
  CSS variable references too (`this.style.borderColor='var(--line2)'`)
  since the browser resolves them at paint time.
- **Numbers wear mono + tabular**. `.lvr-badge` (the wizard's
  large LVR/loan/security badge) was sized for impact but rendered
  in Plus Jakarta; now `font-family:var(--mono)` +
  `font-variant-numeric:tabular-nums` so the digits don't jiggle
  as values change.
- **Inline rule explainers.** Income and Liabilities subsection
  headers in the calculator now carry a tiny italic note:
  - Income: "variable types (overtime, bonus, commission, rental)
    are shaded per lender policy. Hover the assessed value for the
    rule."
  - Liabilities: "credit cards stress to 3.8% of limit; HECS to 1%;
    amortising debt at rate + buffer."
- **AU spelling pass** confirmed clean (no `analyze`, `customize`,
  `organization`, `behavior`, `optimize`, `prioritize` in
  user-facing strings). `autocomplete="organization"` retained on
  the login form — it's an HTML attribute name browsers expect in
  US spelling.
- **Smoke harness** +10 Phase 4 checks (raw-hex scrub, toast tone,
  emoji removal in insights + tables + empty state, mono on LVR
  badge, inline shading + liability explainers, monogram in
  noDealPrompt). **257/257 passing.**

## Broker overhaul — Phase 3: deal-as-spine + atomic stepped builder

The deal is the spine, and Calculate is a view of it. Restructured
the calculator into named, numbered steps so the architecture is
visible, not just true. AI Pilot wears the same banner so the shared
record is obvious from both sides.

- **Deal-spine banner** — small editorial line at the top of both
  Calculate and AI Pilot: deal ID + a one-line note that the two
  pages share the same record + a CTA to jump between them. Hidden
  when no deal is active.
- **Step framework primitives.** `stepHeader(num, title, desc, badge)`
  emits the numbered head with a serif title, italic intent line, and
  a status badge (`ok` / `attn` / `note` / `muted`). `.step-frame`
  wraps each atom as a clinical card on the editorial canvas.
- **Step 1 — Purpose** (new). Four tile options
  (Purchase / Refinance / Investment / Construction) in a radiogroup.
  Persisted to `state.calc.purpose`; seeded on deal creation from
  the wizard's `dealType` via `wizDealTypeToPurpose()` (Owner Occupier
  / First Home / SMSF / Commercial → purchase; Investment → investment;
  Refinance → refinance).
- **Step 2 — Applicants & details.** Wraps the existing entity cards
  in a labelled step frame; per-entity Income (Step 4) and
  Liabilities (Step 5) remain nested inside each card with their
  existing tables.
- **Step 3 — Securities.** Wraps the existing `securitiesBuilderHTML()`
  builder. Step badge reads "ok" when securities are listed,
  "needs attention" when implicit-only.
- **Step 6 — Assets.** Rendered as a deferred step frame — clear
  "Coming soon" note pointing users to the Documents tab for now.
  This is honest about scope: per-entity asset rows need a careful
  state-model addition and are queued for a follow-up.
- **Step 7 — Living expenses & loan structure.** The existing
  loan-amount / rate / term / adults / dependants block, re-headed
  with a description that names HEM and the rate buffer explicitly.
- **Step 8 — Result.** Lives in the right pane (the existing
  verdict hero + gauges). No structural change; the step framework
  acknowledges this is the deliberate "calm output" half of the
  calculator.
- **AI Pilot copy** updated — the hero paragraph now explains that
  Pilot writes into the same record the Calculator reads from
  ("enter once, never re-key") and surfaces the spine banner.
- **Architectural note: shared record.** `state.calc` was already the
  single source of truth for both Calculate and AI Pilot —
  `applyExtractedProfile()` writes directly into `state.calc.entities`,
  `state.calc.newLoan` and friends. Phase 3 makes this *visible*
  through the spine banner + step framework; no data flow was changed
  (low regression risk on `mergeExtracted()`, `reconcile()`, lender
  ranking, or the serviceability engine).
- **Smoke harness** +17 Phase 3 checks (helper primitives, default
  purpose, wizard → calc purpose mapping, step frames 1-7 present,
  Step 6 deferred-state visible, Purpose tile activation reflects
  state, AI Pilot spine banner + copy, banner hidden when no active
  deal). **247/247 passing.**

**Deferred from Phase 3** — flagged for follow-up rather than
half-shipped:
- Per-entity Assets data model + UI (Step 6 placeholder shows the
  intended scope).
- Multipart scenarios under one deal (split loans, scenario
  comparison). Needs deal-level `scenarios:[]` array + a switcher
  + scenario-aware deal save/restore — designed as its own pass.
- Step-by-step progressive disclosure animation (the current
  rendering shows all steps at once; happy-path collapse on
  completion is a polish item, queued behind core flow validation).

## Broker overhaul — Phase 2: consolidated right dock

Replaced three separate right-side surfaces — the always-open AI
copilot panel, the floating Policy & Rates drawer, and the bottom
Live Timeline strip — with **one tabbed, collapsible right dock**.
Closable. Persisted. Same mental model whichever tab you're on.

- **New `#rightDock`** (`<aside>`) sits where `#copilotPanel` used to
  be. Four tabs: **AI Copilot · Policy · Timeline · Conditions**.
  Header carries the dock title, model metadata, the live AI dot,
  and a collapse chevron.
- **Collapse to rail.** Clicking the chevron collapses the dock to a
  48px-wide vertical icon strip (`AI · PO · TL · CN`) and gives the
  width back to the workspace. The rail's expand button opens it back
  up. State persists per browser (`debtiq.dock.v1` localStorage).
- **Tab switch from rail expands the dock** to the chosen tab —
  calmer than a silent no-op when the user clicks into a collapsed
  surface.
- **Floating Policy & Rates drawer + `#pdHandle` retired** —
  `togglePolicyDrawer()` is now a back-compat shim that routes
  through `expandRightDock('policy')`. `renderPolicyDrawer()` no
  longer needs its `policyDrawerOpen` guard and writes into the
  dock's policy pane.
- **Bottom Live Timeline strip retired.** `renderTimeline()` writes
  vertical events into the Timeline pane (no more truncation; the
  dock body scrolls). `toggleTimeline()` shim routes through
  `expandRightDock('timeline')`. Dot colours upgraded for legibility
  on the light dock background.
- **Conditions tab** uses the existing `derivedConditions()` engine
  via `panelConditions()` — outstanding/satisfied cards with the
  same code chips. A small count badge sits on the Conditions tab
  showing outstanding items; tab gains `.has-attention` styling when
  > 0. Tab refreshes automatically on `setActiveDeal` /
  `clearActiveDeal`; empty state when no deal is active.
- **CSS housekeeping.** Removed orphaned styles for `#liveTimeline`,
  `.tl-label`, `.pd-handle`, `#policyDrawer`, `.pd-head`, `.pd-title`,
  `.pd-icon`, `.pd-btns`. Kept `.pd-ctx`, `.pd-row-*`, `.tl-event`,
  `.tl-dot`, `.tl-time`, `.tl-text` since they're still used inside
  the dock panes. Print + responsive selectors updated to reference
  `#rightDock`.
- **State + persistence.** New `state.rightDockOpen` /
  `state.rightDockTab` keys hydrated from localStorage on boot
  (separate key from broker preferences — preferences are a
  considered choice, dock state is ephemeral session UI).
- **Smoke harness.** +14 Phase 2 checks (dock structure, tab switch
  + aria-selected, collapse/expand, rail render, conditions cards,
  conditions empty state, persistence round-trip, legacy shims).
  Two existing assertions about the retired drawer + timeline strip
  rewritten to target the dock instead. **230/230 passing.**

## Broker overhaul — Phase 1: shell · home routing · account · settings

First phase of the broker-side architecture + UX pass driven by user
critique. Frontend only — no `functions/`, no `supabase/`, no
`lenders.js`, no `/api/*` contract changes. Demo and live modes both
work identically afterwards.

- **Three-layer token architecture.** Added a semantic layer
  (`--surface-editorial`, `--surface-clinical`, `--text-primary`,
  `--text-secondary`, `--accent-interactive`, `--status-pass`/-`caution`/
  -`fail`, `--hairline`, `--focus-ring`) and a numeric spacing
  (`--space-1`…`--space-9`) + type (`--fs-xs`…`--fs-5xl`) scale on top
  of the existing brand primitives. Primitives unchanged; existing
  compatibility aliases unchanged; new code references semantics.
- **Density + reduced-motion classes** (`body.density-compact`,
  `body.reduced-motion`) driven by Settings → Preferences. Compact
  shrinks chrome heights and tightens card padding; reduced-motion
  collapses transitions/animations across the board.
- **Logo is a real home button** in both shells. Broker logo →
  `goTab('pipeline')`; assessor logo → assessment queue (via
  `setAssessView('queue')` if present, otherwise `initAssessorShell`).
  Focusable, keyboard-operable, visible focus ring.
- **Role toggle switches workspaces** (was: cosmetic class flip
  that only hid the Assessment tab). `setRole('assessor')` now hides
  `#app`, shows `#assessorApp`, and runs `initAssessorShell()`;
  `setRole('broker')` does the reverse via `init()`. Idempotent —
  no-op when already on the requested role.
- **Avatar becomes the account menu trigger** in both shells. Click
  opens **Account · Settings · Sign out**; Account opens Settings on
  the Account tab; Settings opens Settings on the Preferences tab;
  Sign out runs the existing `doSignOut()` (clears Supabase session +
  reloads back to the branching login). Click-away and ESC dismiss.
  ESC also closes the settings overlay (previously needed an X-click).
- **Settings → Preferences** — new tab with five toggles, persisted
  to `localStorage` under `debtiq.settings.v1` and re-hydrated on
  every boot before the first render:
  - **Density** (comfortable | compact)
  - **Number format** (1,234,567 grouped | 1234567 plain) — read by
    `fmtMoney` so it applies everywhere money is rendered
  - **Reduce motion** — toggles `body.reduced-motion`
  - **Default lender** — seeds `state.lender` on each new deal
  - **Default assessment buffer** — seeds `state.manual.bufferPct`
    on each new deal (existing deals keep what they were set up with;
    consistent with the "seeds new deals only" note in the UI copy)
- **Settings persistence helpers**: `loadSettings()` /
  `saveSettings()` / `applySettings()` / `setSetting(key,value)`.
  Boot calls `loadSettings()` + `applySettings()` before
  `initBackend()` so density/reduced-motion are visible from frame 1.
- **Lingering "Netlify" copy** in the AI settings pane updated to
  "Cloudflare Pages" (post-migration cleanup).
- **Smoke harness** extended with 21 Phase 1 checks (semantic
  tokens, spacing/type scale, home button DOM, account menu DOM +
  open/close + aria-expanded, Preferences pane fields, density and
  reduced-motion class application, localStorage round-trip,
  `fmtMoney` numberFormat both modes, `startNewDeal` seeding from
  preferences, `setRole` workspace switch, `goHome` route, sign-out
  wiring). **216/216 passing.**

## Round (platform migration) — Netlify → Cloudflare Pages + Pages Functions

Moved every backend handler off Netlify Functions to Cloudflare Pages
Functions. Static hosting moves to Cloudflare Pages in the same step.
**Zero frontend changes** — the `/api/*` contract is preserved
verbatim (Pages Functions' file-path-as-route covers it natively), so
the `state.backend` auto-detect, the demo-mode fallback, and the
existing Supabase session gating all work unchanged.

- **New `functions/api/`** structure:
  - `config.js` → `/api/config` (returns public Supabase vars)
  - `claude.js` → `/api/claude` (Anthropic proxy)
  - `extract.js` → `/api/extract` (Claude vision OCR)
  - `classify.js` → `/api/classify` (document type ID)
  - `forensics.js` → `/api/forensics` (three-layer tamper-signal scan)
  - `_lib.js` — shared CORS / json / `requireSupabaseSession` /
    `parseJsonLoose` helpers (kept tiny; each handler still
    self-contained).
- **Handler signatures converted** from Netlify's
  `exports.handler = async (event) => ({ statusCode, headers, body })`
  to Pages Functions' Web-standard
  `export const onRequestPost = async ({ request, env }) => Response`.
  Method-specific exports replace the `event.httpMethod` switch;
  preflight `OPTIONS` is its own `onRequestOptions` export.
- **One Node-ism rewritten** — `forensics.js` previously did
  `Buffer.from(b64,'base64').toString('latin1')` on the Node runtime.
  Replaced with the Web-standard `atob(b64)`, which Cloudflare Workers
  supports natively. Confirmed byte-for-byte equivalent on a sample
  payload, so the META01–META06 metadata-forensics rules behave
  identically. No `nodejs_compat` flag needed.
- **Env vars** — same three (`ANTHROPIC_API_KEY`, `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`), now read from `env.*` instead of
  `process.env.*`. Set in the Cloudflare Pages project Settings →
  Environment variables (Production + Preview).
- **`wrangler.toml`** — minimal project config for local dev
  (`wrangler pages dev .`). Secrets go in a gitignored `.dev.vars`.
- **`.gitignore`** — added (was missing): ignores `.dev.vars`,
  `.wrangler/`, `node_modules/`, `.DS_Store`.
- **Deploy workflow** — `.github/workflows/cloudflare-deploy.yml`
  uses `wrangler pages deploy . --project-name=debtiq`. Skips
  cleanly when `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`
  aren't set. **Recommended path is still the Cloudflare Pages →
  Git integration in the dashboard** (no workflow secret management
  needed); the action is a fallback.
- **Retired**: `netlify.toml`, all of `netlify/functions/*`,
  `.github/workflows/netlify-deploy.yml`.
- **`BACKEND.md` rewritten** with the Cloudflare Pages setup
  walkthrough, local dev steps, env-var table, and the same
  security/RLS guidance.

**Verification.** Imported each ported handler in Node and drove it
with synthetic `request` / `env` objects:
- `/api/config` returns the configured Supabase pair in normal mode,
  empty strings in demo mode (same shape the boot code expects).
- `/api/claude` returns 500 when `ANTHROPIC_API_KEY` is missing and
  401 when Supabase is configured but the request carries no Bearer
  token — same gating as before.
- `/api/forensics` produces the expected META01 (Photoshop producer
  string), META02 (modified-after-creation), and META03 (multiple
  `%%EOF` markers) findings from a synthetic Photoshop-produced PDF
  — proves the `atob` ↔ `Buffer.from(b64).toString('latin1')` swap
  preserves the exact byte stream the metadata regexes consume.

**Frontend smoke** still 192/192 — `index.html` was not touched.

Files touched: `functions/api/*` (new), `wrangler.toml` (new),
`.gitignore` (new), `BACKEND.md` (rewrite),
`.github/workflows/cloudflare-deploy.yml` (new); removed
`netlify/`, `netlify.toml`, `.github/workflows/netlify-deploy.yml`.
No `supabase/`, `lenders.js`, or `index.html` changes.

## Round (brand system v1.0) — Full app rollout (tokens · ink monogram · screens · voice)

A non-feature compliance refactor. Backend, schema, auth, IDs, render
function signatures, data flow, and demo/live behaviour all preserved.

**Phase 1 — Tokens as single source of truth.** Reconciled `:root` to
the brief's authoritative block.
- Added: `--brass`, `--ui`, `--green-bg`, `--amber-bg`, `--steel-bg`,
  `--ink-bg`, plus on-ink legibility variants (`--green-on-ink`,
  `--steel-on-ink`, `--amber-on-ink`, `--red-on-ink`).
- Fixed `--sh-1` opacity to brief value (.05).
- `--mono` fallback chain now `'DM Mono',ui-monospace,monospace`.
- Mapped legacy aliases (`--bg`, `--surface`, `--brand`, `--border`,
  `--t3`, `--t4`, `--teal`, `--brand-bg`, `--brand-soft`,
  `--brand-grad`, `--sh-brand`, `--r-clinical`) to the new tokens —
  none are extended, all are kept only so existing CSS cascades.
- `body { font-family: var(--ui) }`. All `'Plus Jakarta Sans'`
  literals removed except the two token declarations themselves.
- `.mono` now also sets `font-feature-settings:"tnum"` alongside
  `font-variant-numeric:tabular-nums`.
- Replaced the income-flow chart's hex series (ink/amber/amber/warm-
  slate/status) — amber reserved for the lender being conservative
  (debt + stressed new loan), green/red only for the surplus.
- Replaced the legacy `.verdict` gradient blocks with flat status
  colours (the new `verdictHero()` is the real verdict surface).
- Replaced `'Plus Jakarta Sans'` literals in the Submission Pack
  stylesheet with `var(--ui)`; added `--brass` + `--line2` to the
  pack's `:root`.

**Phase 2 — Ink monogram, violet retired.**
- New ink monogram SVG — a serif "D" rising from a faint ledger column
  with serif feet top and bottom. Ink stroke on a paper square with a
  hairline border. Inline SVG so it goes anywhere, sized via the host
  element. Ink-on-paper for light surfaces, paper-on-ink for dark
  (the assessor command bar).
- Replaced every glyph site: login hero, broker command bar, assessor
  command bar, submission-pack masthead, browser favicon (inline SVG
  data URI).
- **Deleted `--logo-grad`** and every `#5B4FF5 / #8B5CF6 / #A78BFA`
  reference. The audit-trail AI dot (was `#7A3FB0`) and the org-swatch
  palette (had violet entries) both retired to brass + the brand
  family.

**Phase 3 — Screen sweep.** Every screen now reads through tokens.
Specific cleanups (called out by the brief):
- Copilot-info tint → `var(--steel)` + `var(--steel-bg)`.
- KPI/tile/market-card accents — already token-driven.
- Tab badge / nav badge / demo banner → `var(--amber-bg)` + `var(--amber)`.
- Timeline actor dots → on-ink legibility variants of the brand tokens
  (steel-on-ink, amber-on-ink, green-on-ink) + brass for AI + warm
  t3 for system.
- `--logo-grad` already-removed; `@keyframes glow` already-removed.
- Spinner/skeleton borders → `var(--line2)` / gradient through
  `var(--paper)`.

**Phase 4 — Voice & finish.**
- Removed decorative `✦` glyph from "Why it works" / "AI Assessment"
  buttons. Plain English headings: "Why it works" / "What to change"
  and "Ask the assistant for an assessment".
- Global reduced-motion override already present (line 210); 4 further
  scoped blocks neutralise animation in specific surfaces.
- Final search: **0 violet hex** anywhere, **0 `--logo-grad`** refs,
  **0 hard-coded body-font** outside the two `--ui` token
  declarations, **0 stray hex** outside token blocks / data URIs.

**Styleguide.** `?styleguide=1` (legacy `?preview=1` still works)
renders the brand catalogue: brand mark in both variants, token
swatches in three columns (surfaces / structure / status with bg
variants), type scale, and the signature components (VerdictHero,
MetricGauges, LedgerRow, StatusPills, IntegrityChips, CodeChips).

**Smoke harness +4 brand checks** (192/192 total): styleguide caption
+ ink monogram + brass swatch present, brand tokens defined,
`--logo-grad` retired, no violet hex anywhere.

Files touched: `index.html` only. No `netlify/`, `supabase/`,
`/api/*`, or `lenders.js` changes.

## Round (lender side · Pass 4) — Provenance reveals (worksheet + submission pack)

Both sides now see the same evidence the broker built. Every figure in
the worksheet (and in the Submission Pack) reveals its source on hover
or focus — no toast, no modal, no extra navigation.

- **New `provReveal(value, prov)` primitive.** Wraps a numeric/text
  value in a focusable `<span>` (`tabindex="0"`,
  `aria-describedby="pr-tt-N"`). A pure-CSS popover anchored above the
  value shows:
  - Source document name (`MITCHELL_PAYSLIP_01.PDF`)
  - Source field (`gross_period`, mono)
  - Source-text quote (serif italic, "Gross (annualised) $142,000")
  - Confidence percentage with a verified flag where present
    (`97% confidence · Verified 2026-05-20`, green)
- **System-source variant** for engine/policy values that aren't
  document-backed (buffer, HEM benchmark, ratio ceilings, loan amount,
  contract rate). Same chassis, slate-italic source line, brass dotted
  underline so the assessor can tell at a glance which figures are
  doc-backed and which are policy/engine.
- **Wired into the worksheet:**
  - Step 1 — declared income per line (doc prov on file, fallback to
    "Applicant declaration" otherwise).
  - Step 2 — liability balance per line (same fallback rule).
  - Step 3 — buffer percentage (system: lender policy) +
    loan amount (application) + contract rate (lender pricing).
  - Step 4 — HEM benchmark (system: Melbourne Institute table).
  - Step 6 — each policy ceiling (system: `activePolicy()`).
- **Wired into the Submission Pack** (`buildPackHTML`). Same prov CSS
  inlined into the pack's stylesheet so the standalone HTML stays
  self-contained. Income FY-current and liability balance/limit
  columns both trigger the reveal.
- **Keyboard-accessible, not hover-only.** `tabindex="0"` makes every
  wrapper tab-reachable; the popover opens on `:focus`,
  `:focus-within`, and `:hover`; `aria-describedby` points to the
  popover with `role="tooltip"`; reduced-motion neutralises the
  opacity transition.
- **Clipping fixed**: `.ws-table td`, `.ws-ratio td`, and the
  `.ac-card` shells set `overflow:visible` so the popover renders
  above the table edge.
- **Smoke harness +10 checks** (188/188 total): doc-prov on income
  row, doc-prov on liability row, system-prov on policy values,
  keyboard accessibility attributes, `role="tooltip"`, confidence text,
  verified flag, pack inlines prov CSS, pack income + liability
  rows use provReveal.

Files touched: `index.html` (CSS for `.prov-*` + JS `provReveal()` +
worksheet wiring + pack wiring + pack CSS). No backend, schema, or
`lenders.js` changes.

## Round (lender side · Pass 3) — Serviceability Worksheet (line-for-line working)

The centrepiece of the lender side — an exhaustive, traceable view of
the serviceability math. Generated entirely from
`computeServiceability()` and the same primitives the engine itself
uses (`getShadedIncome`, `assessLiability`, `hecsExclusion`, `getHEM`,
`activeBuffer`, `activePolicy`, `PMT`). No hardcoded numbers anywhere.

- **Step 1 · Assessed income.** Per-line table: Declared (yr) → Shade
  % → Assessed (yr), with shaded rows tinted amber and a serif-italic
  policy basis ("Overtime shaded by APRA prudential expectation",
  "Self-employed — 2-year average where evidence exists", etc.). The
  Working column shows the literal arithmetic
  `$X × 80% × 50% = $Y`. Total row + monthly equivalent applied in
  Steps 5–6.
- **Step 2 · Existing commitments.** Per-liability table: Balance/limit
  · Rate · Term · Assessed · Working. The Working column emits the
  rule verbatim — credit cards as `limit × 3.8% ÷ 12`, HECS as
  `balance × 1% ÷ 12 − exclusion`, amortising debts as
  `PMT(balance, rate + buffer, term)`. Existing-debt-service total
  matches `computeServiceability()`.
- **Step 3 · Proposed loan — stressed.** Two-card grid (Loan amount,
  Contract rate) followed by an amber-toned formula chip:
  `contractRate + buffer = assessmentRate · PMT(amount, rate, term) =
  $X/mo`. Buffer pulled live from `activeBuffer()`.
- **Step 4 · HEM.** Four cells (Household, Income band, Declared
  monthly, HEM benchmark) followed by the literal call
  `getHEM($X/yr, N adults, N deps) = $Y/mo` and the floor applied
  (`max(declared, HEM)`). When no declared expenses are on file (the
  detailed mode), the renderer says so explicitly.
- **Step 5 · NDI waterfall.** Proportional bar rows: Assessed income →
  − Existing debt → − New loan → − HEM floor → Net surplus.
  - **One orchestrated motion moment per screen** — bars grow from
    `width:0` to their final width via a 0.55s cubic-bezier; bypassed
    under `prefers-reduced-motion`.
  - Solid bars for income/surplus, **hatched** (45° stripes) for
    deductions. **Amber reserved for shading/stress** (existing debt,
    new loan); steel hatching for HEM; green solid for surplus; red
    solid when surplus turns negative.
- **Step 6 · Policy ratios.** DSR / LVR / DTI table: name · formula ·
  result · ceiling (from `activePolicy()`) · headroom. Result + headroom
  coloured by verdict tone (`pass` / `borderline` / `fail`).
- **Verdict footer.** Ink band with the serif statement (Serviceable /
  Borderline / Does not service.) and four mono stat columns (NDI/mo,
  DSR, LVR, DTI). Statement colour tones for the verdict.
- **Reachable two ways.** New segmented toggle in the assessor file
  header (Decision · Worksheet); new "Show working ↓ / ↑" button on
  the broker Calculate screen that expands the worksheet inline below
  the verdict.
- **Craft details.** `font-feature-settings:"tnum"` locked on `.ws-root`
  so every numeric column lines up. Arithmetic operators (×, +, =, ÷)
  rendered in a muted token (`.ws-op`). On widths ≤900px the Working
  column hides via CSS; below that the loan/HEM grids collapse to a
  single column and the verdict footer reflows to 2 cols.
- **Failing-file path.** Verified against the Mitchell file at CBA
  (NDI positive but DSR 65.5% vs 45% ceiling, DTI 6.6× vs 6× cap):
  ratios row red, verdict statement red, headroom negative. When NDI
  itself goes negative, the surplus bar also goes red.
- **A11y.** Worksheet is `role="img"` on the waterfall with an
  `aria-label`; the broker-side toggle button uses `aria-expanded` +
  `aria-controls`; every focusable control keeps its steel
  focus-visible ring.
- **Smoke harness +13 checks** (178/178 total): 6-step structure,
  income/liability column emission, formula text presence, HEM
  `getHEM` text, waterfall bar count with `data-target-w`, ratio
  rows for DSR/LVR/DTI, verdict footer tone class, tabular-nums
  feature, failing-file ratio class + verdict tone.

Files touched: `index.html` (CSS for `.ws-*` + JS for
`buildWorksheetData`, `renderWorksheet` + step renderers,
`setAssessView`, `toggleCalcWorking`, and the assessor file-head
view toggle). No backend, schema, or `lenders.js` changes.

## Round (lender side · Pass 2) — Assessment Console (queue · decision · 4 Cs · routing · conditions · audit)

Second pass — the assessor workspace is now fully operational, built
entirely from the engine state (no hardcoded per-file decisions).

- **Queue (left, 320px).** Filterable list of every file in `DEALS`,
  sorted newest first. Status square (steel/amber/red/green by stage) +
  id + applicant + mono money/LVR + serif-italic purpose + stage tag.
  Filter chips (All · New · In review · Referred · Closed) carry mono
  counts; the active chip is inverted (ink on white).
  Stage is derived from `deal.assessorAction || deal.status`, so a
  Refer/Decline pressed by the assessor flips the queue tag without
  touching the broker-side status pill.
- **File header.** id + serif applicant name + mono money/purpose/lender/LVR
  + serif-italic broker line ("Submitted by …  ACL …") + an integrity
  chip derived from `worstForensicStatus(dealId)`. The right column also
  shows the live NDI/DSR for quick orientation before the decision card.
- **Decision Engine Output.** Two-column card. Left: serif statement
  (Approve / Refer / Decline), mono code line with confidence percentage,
  serif-italic note, timestamp, and a ledger of coded reason chips
  (SRV01, DTI01, LMI01, IQA07, CON01, M033, VAL01) — each carrying a
  monochrome severity tag (HIGH/MED/LOW). `decideAssessment(r)`
  augmented (additive) with per-reason `sev`.
- **Approval routing.** A/B/C/D 4-segment scale (green/steel/amber/red
  highlight on the active segment) + DCA referral / LMI / Policy waiver
  / DSR-ceiling rows + serif-italic routing note. **Approve / Refer /
  Decline** action buttons with steel focus rings — each calls
  `logAssessorAction()` which stamps `deal.assessorAction` and writes
  an ASSESSOR_DECISION row to `state.auditTrail` (and a coloured
  audit-trail entry via `logEvent`).
- **The 4 Cs.** Reuses `fourCs(r)`. Four cards (Character, Capacity,
  Capital, Collateral), rating chip (strong/adequate/weak), serif-italic
  basis. 2-up on narrow widths, 4-up at ≥1200px.
- **Conditions & Verification.** Reuses `derivedConditions()`. Header
  row shows `done / total satisfied` + animated progress bar +
  percentage. Each condition: code chip + category + title + status
  chip (Satisfied/Outstanding) + detail line with the resolve-at stage.
- **Audit trail.** Reuses `state.eventLog`. Up to 10 most recent events,
  actor-coloured dot (AI violet / broker steel / assessor green /
  processor amber / system slate), `HH:MM · Actor` + serif-italic text.
- **Light-touch deal hydration.** New `loadAssessFile(id)` is a slimmer
  cousin of `setActiveDeal()` for the assessor shell — it sets
  `state.activeDeal`, restores `state.calc` from the deal's saved
  snapshot (or the demo intel template), and re-renders the console.
  Does NOT call `goTab()` (no broker-shell side-effects).
- **Empty state** when no file is selected — a centred prompt with a
  matched serif headline.
- **A11y.** Queue items are `role="listitem"` with `tabindex="0"` and
  Enter/Space activation; filter chips use `aria-pressed`; the progress
  bar uses `role="progressbar"` with min/max/now; action buttons live
  inside a `role="group"`; every interactive control carries a
  `:focus-visible` steel ring.
- **Responsive.** Queue narrows to 260px at ≤1100px; decision card
  collapses to single column. At ≤760px the queue moves above the
  console (max-height 240px).
- **Smoke harness +8 checks** (165/165 total): queue presence + counts,
  default-file console body (decision + 4 Cs + audit), filter narrowing,
  `loadAssessFile` switching, `logAssessorAction` audit + stage flip.

Files touched: `index.html` (CSS for queue/console + JS for
`assessStageOf`, `assessQueueAll/Filtered`, `loadAssessFile`,
`setAssessFilter`, `logAssessorAction`, `renderAssessmentConsole` +
subrenderers). No backend, schema, or `lenders.js` changes.

## Round (lender side · Pass 1) — Branching login + assessor workspace shell

First pass of the lender/assessor integration. Login now branches by role
and routes the user into a separate workspace; Pass 2 will fill the
assessor console with the queue, decision engine, 4 Cs, routing,
conditions, and audit trail.

- **Role selector** on the login card as an ARIA `radiogroup` with two
  options (Broker · Lender/Assessor). `:focus-visible` steel ring;
  `aria-checked` toggled in JS. Persists into `state.loginRole`.
- **Hero motif branches by role.** The ink left panel keeps its
  positioning headline + motif + proof points pattern, but swaps content
  per role via a `data-mode` attribute on `#login` (no DOM swap — both
  variants live in the document and CSS hides the inactive one):
  - **Broker:** "A credit-grade brokerage *operating system*." · motif
    *Serviceable.* · NDI +$847/mo · proof points = 25 lenders / 3
    forensic layers / 100% source-traced.
  - **Lender:** "A credit-grade assessment *console*." · motif
    *Decided in minutes.* · Median SLA 02:38 · proof points = 4 Cs /
    A–D routing / 100% audited.
- **`#loginOrg` (Lending institution)** field appears only in lender
  mode (additive — leaves `#loginEmail` / `#loginPass` / `doLogin()` /
  `#authExtra` / demo-creds untouched).
- **Button label** flips between "Enter broker workspace" and "Enter
  assessment console".
- **Post-login routing.** `doLogin()` captures the role and org from the
  form (overlays existing Supabase auth where present — TODO comment for
  when the session exposes role/org natively). `enterApp()` branches:
  broker → existing `#app` shell + `init()`; lender → new `#assessorApp`
  shell + `initAssessorShell()`.
- **`#assessorApp` shell.** Separate top-level container (ink command
  bar with institution identity + colour swatch + global search +
  avatar + sign-out, then a paper body). Pass 1 renders a placeholder
  card via `renderAssessmentConsole()`; Pass 2 will replace it with the
  full console.
- **Demo + live both work.** Demo mode skips the Supabase round-trip
  and routes directly. Live mode signs in via Supabase first, then
  applies the captured role/org (until the session payload carries
  them natively).
- **Smoke harness +15 checks** (157/157 total): default role state,
  data-mode, button-label flip, org-field reveal, motif + proof points
  both present in DOM, lender doLogin routes to `#assessorApp`, org name
  rendered in the cmd bar, placeholder visible.

Files touched: `index.html` (login HTML + role-selector CSS +
assessor-shell CSS + JS auth/route branching + state).
No changes to `netlify/`, `supabase/`, `/api/*`, `lenders.js`.

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
