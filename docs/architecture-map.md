# DebtIQ — architectural map (connect-the-dots edition)

Every "dot" below names a **file**, the **function or section** inside it, what it
does in one line, and the most common things to change/check. Read top-to-bottom
once to get oriented; then jump to the section for the issue you're fixing.

> The codebase is ~95% in `index.html` (one big SPA file) + `lenders.js` (policy
> DB) + `functions/api/*.js` (5 Cloudflare Pages Functions). Everything else is
> docs and the two DRAFT Supabase migrations.

---

## 0. Mental model in 5 lines

1. **One single-page app** (`index.html`) holds every screen. There is no router
   except a simple tab system; switching tabs swaps the contents of `#workspace`.
2. **One global `state` object** is the source of truth at runtime. All slices
   (deals, calc, workflows, access, compliance, settlement, broker-tasks) sit on it.
3. **Each major slice has a load/save pair** that round-trips to `localStorage`
   under a `debtiq.<name>.v1` key, and is hydrated on boot.
4. **The serviceability engine** (`computeServiceability()`) reads `state.calc`
   + the active lender's policy from `lenders.js` and produces one result object
   consumed everywhere.
5. **Backend is optional.** When Supabase env vars are set, `/api/config` returns
   them and the app upgrades from demo (in-memory) to live (Supabase + Anthropic
   proxy). Otherwise demo mode keeps working.

---

## 1. File layout

| File | Purpose | When to touch |
|---|---|---|
| `index.html` | The entire SPA — state + CSS + JS + HTML shell | Almost every change |
| `lenders.js` | Per-lender policy DB (buffer, DSR cap, income shading, max LVR, etc.) | Adding/changing lenders or their rules |
| `functions/api/config.js` | Returns public Supabase config | Almost never |
| `functions/api/claude.js` | Anthropic proxy (session-gated) | Changing AI prompts/models |
| `functions/api/extract.js` | OCR via Claude vision | Doc-extraction tuning |
| `functions/api/classify.js` | Doc type classification | Adding new doc types |
| `functions/api/forensics.js` | Tamper-signal detection | Forensic-rule tuning |
| `functions/api/_lib.js` | Shared helpers (CORS, session check) | Cross-cutting fixes (e.g. CORS) |
| `supabase/schema.sql` | Live `deals` table + RLS | One-time setup |
| `supabase/migrations/0001_lending_groups.sql` | **DRAFT** group/facility/security schema | Apply when ready |
| `supabase/migrations/0002_access_control.sql` | **DRAFT** org/membership/audit_log schema | Apply when ready |
| `BACKEND.md` · `SECURITY.md` · `COMPLIANCE.md` · `CDR.md` · `REVIEW-REGISTER.md` · `docs/regulatory-source-manifest.md` · `CHANGELOG.md` | Docs + the LEGAL/ARCH review register | Reference, not code |

---

## 2. The state object — where data lives

`index.html` near **line 2343**: `const state = { ... }`. Every slice is here.

| Slice | What it holds | localStorage key | Backend persistence path |
|---|---|---|---|
| `state.calc` | Active deal's calc snapshot (entities, securities, newLoan, facilities, purpose, adults, dependants) | — (lives on `deal.calc`) | `deals.data jsonb` |
| `DEALS[]` | In-memory list of all deals | — | `deals` table (RLS per `user_id`) |
| `DOCS[]` | In-memory list of all documents (per-deal) | — | Demo-only today |
| `state.lendingGroups[]` | Groups with `deal_ids[]` | `debtiq.lendingGroups.v1` | Migration 0001 (DRAFT) |
| `state.access` | org / members / invitations / authLog / session / simulateRole | `debtiq.access.v1` | Migration 0002 (DRAFT) |
| `state.compliance[dealId]` | disclosure docs · VOI · ADM · APP5 · retention | `debtiq.compliance.v1` | ARCH-REVIEW pending |
| `state.settlement[dealId]` | 7-stage tracker · workspaceId · bookedDate · largeDeposit | `debtiq.settlement.v1` | ARCH-REVIEW pending |
| `state.workflows[dealId]` | one-page workflow (7 stages, tasks, verify[]) | `debtiq.workflows.v1` | Round-trips on `deal.workflow` |
| `state.brokerTasks[dealId]` | cross-wall channel tasks | `debtiq.brokerTasks.v1` | ARCH-REVIEW pending |
| `state.settings` | Broker prefs (density, defaults, number format) | `debtiq.settings.v1` | — |
| `state.auditTrail[]` | 200-entry FIFO log of every action | — (in-memory) | `auth_audit_log` in migration 0002 |
| `state.rightDockOpen/Tab` | Right-dock UI state | `debtiq.dock.v1` | — |

**Pattern for adding a new slice:**
1. Add `state.<name>` declaration in the state object.
2. Add `loadX()` / `saveX()` near other `load*` functions.
3. Call `loadX()` in the `boot()` block (around line ~10286).
4. Add `X_LS_KEY = 'debtiq.<name>.v1'` constant.

---

## 3. Deal lifecycle (cradle to settlement) — what to touch

| Stage | Function | Approx. line | What to change for common fixes |
|---|---|---|---|
| New deal (wizard) | `startNewDeal()` · `openWizardModal()` · `submitDeal()` | 7586 / 7595 / 4546 | Add new fields → update `newEntity()`, the wizard step, and `submitDeal`'s deal-creation block |
| Active deal selection | `setActiveDeal(dealId)` | 8898 | Hydrate new state slices when a deal opens; backfill defensive shims here (we already do for `purpose` + `assets`) |
| Render deal page | `renderServiceability(el)` | 5007 | The deal page composer — adds the workflow + broker-tasks containers below the calc-split |
| Build the atomic calculator | `renderCalcEditor()` | 5037 | The 7-step builder. Order: `stepPurpose + stepApplicants + stepSecurities + stepAssets + stepLoanWrapped` |
| Live results panel | `renderCalcResults(animate)` | 5422 | Reads `computeServiceability()`. Verdict hero, gauges, insights. |
| Submission pack | `generateSubmissionPack()` | ~6456 | Build the print-ready credit memo for one deal |
| Group pack | `generateGroupPack(groupId)` | ~3463 | Same but for a multi-deal Lending Group |

**Pattern for a new field on a deal:**
1. Add the default value to the entity/security/facility/newLoan defaults in `state.calc`.
2. Mirror the default in `newEntity()` / `newSecurity()` / `newAsset()` (line ~3631).
3. Add the input in the relevant step renderer (`renderCalcEditor` for steps 1–7).
4. Add an `update<Field>()` helper that mutates `state.calc` and calls `updateStatusStrip()` / `updateCalc()`.
5. If it affects assessment, update `computeServiceability()` and add a worksheet row in `renderWsStepN`.
6. Add a defensive shim in `setActiveDeal` so old saved deals don't break.

---

## 4. The serviceability engine — the heart

| Dot | Function | Approx. line | Role |
|---|---|---|---|
| Entry | `computeServiceability()` | 2883 | Returns `{income, totalDebt, ndi, dsr, lvr, dti, dtiAssess, verdict, ...}` |
| Income build | `getShadedIncome(inc, lender)` | 2696 | Per-income shading; reads `lender.income_shading` from `lenders.js` |
| Liability assess | `assessLiability(l, buffer)` | 2122 | Stressed PMT per type; credit-card limit = LIMIT × 3.8% / 12 |
| HECS rule | `hecsExclusion(l, incomeMonthly)` | ~2724 | Per-lender HECS exclusion |
| Multi-facility | `allFacilities()` + `totalNewLoanMonthly(buffer)` | ~2563 | Sums every facility's stressed PMT; IO uses max(IO-pay, post-IO P&I) |
| HEM | `getHEM(annualIncome, adults, deps)` | 2133 | Band lookup table |
| Buffer/DSR ceilings | `activeBuffer()` · `activeDsrMax()` | 3084/3085 | Per-lender via `activePolicy()` |
| DTI flag | `dtiPolicy()` · `dtiAssessment()` · `dtiFlagText()` | 3086+ | Per-lender appetite flag (6× threshold + 20% bucket + bridging/new-build exemptions). **DTI never changes the verdict** |
| Verdict | inline in `computeServiceability` | ~3315 | `PASS` if NDI > 0 AND DSR < dsrMax; `BORDERLINE` if close; `FAIL` otherwise |
| Result consumers | verdict hero, KPI strip, worksheet, BID prompt, pack, copilot, max-loan finder, conditions emitter | scattered | All re-read `computeServiceability()` results — change the engine, every consumer updates |

**Pattern for changing an engine rule:**
1. Update `computeServiceability()` (or the helper it calls).
2. Update the corresponding worksheet step (`renderWsStep1`–`renderWsStep6`).
3. Update the `REG_SOURCES` provenance entry (in the worksheet's "Regulatory provenance" section) with the new clause + source link.
4. Add/update a smoke check in `/tmp/diqtest/smoke.js`.

---

## 5. RBAC + audit (Phase 5)

| Dot | Function | Line | Role |
|---|---|---|---|
| Capability map | `CAPABILITIES` | 3005 | The single source of truth for who can do what — **edit this to grant/revoke a permission** |
| Sensitive caps (need re-auth) | `SENSITIVE_CAPS` | ~3024 | Force re-auth before action |
| Check | `can(cap)` | ~3050 | Returns boolean. Deny-by-default. |
| Gate | `requirePermission(cap, label)` | ~3060 | Same as `can()` but toasts + audit-logs on deny |
| Re-auth | `requireReauth(label, cb)` | ~3160 | Caches a fresh re-auth for 5 minutes |
| Effective role | `effectiveRole()` | ~3080 | Honours `state.access.simulateRole` (demo "view as") |
| Owner primacy | `changeMemberRole()` · `removeMember()` | ~3110/3140 | Owner-only checks; >=1 owner enforcement |
| Audit | `authAudit(event, detail, targetId)` | ~3170 | Append-only log |

**Pattern for a new capability:**
1. Add to `CAPABILITIES` with the list of roles that hold it.
2. (Optional) Add to `SENSITIVE_CAPS` if it should require re-auth.
3. Wrap every mutator with `if(!requirePermission('cap','label')) return;`.
4. Add a smoke check that confirms denied for non-holders.

---

## 6. Documents + extraction

| Dot | Function | Approx. line | Role |
|---|---|---|---|
| Render | `renderDocuments(el)` | 5952 | Whole Documents page |
| Doc rows | `renderDocBody()` | 5994 | One row per `DOCS[i]`. Carries `data-doc-name` for `openVerificationDoc()` highlights |
| Upload | `uploadDocs(files)` · `bulkIngest(files, dealId)` | 6008 / nearby | Adds to `DOCS[]`, calls scan/extract |
| Forensics | `scanDoc(doc, file)` · `scanAllDocs(dealId)` | search for `scanDoc` | Calls `/api/forensics` (live) or returns demo signals |
| Extraction | `bulkIngest` orchestrates → `/api/classify` → `/api/extract` | server-side | Writes to `doc.extracted.fields[]` |
| Cross-doc | `consistencySectionHTML(dealId)` + `/api/forensics?mode=crosscheck` | search | Conflicts → `state.conflicts[dealId]` |
| Conflict resolution | `markReviewed(idx)` · `approveExtraction(doc)` · `trustAllHighConf()` | search | Updates the conflict + audit-logs |

**Pattern to add a new doc type:**
1. Add it to the `type` enum string in `functions/api/classify.js` SYSTEM prompt.
2. Add a render tag in the docs table (`renderDocBody()`).
3. Add to `VERIFY_DOC_TYPES` (in `index.html`) with its field schema for workflow verification.
4. If extraction differs, update `functions/api/extract.js`.

---

## 7. Workflow + broker tasks

| Dot | Function | Approx. line | Role |
|---|---|---|---|
| Stage definitions | `WF_STAGES` | ~7980 | The 7 stages + per-stage tasks + verifiable inputs. **Edit this to add/change tasks.** |
| Verify schemas | `VERIFY_DOC_TYPES` | ~7950 | The field-schema per doc type |
| Per-deal workflow init | `getOrInitWorkflow(dealId)` | search | Seeds tasks on first access; upgrades old workflows |
| Task mutators | `wfSetTaskStatus` · `wfSetTaskCommentary` · `wfSetTaskInput` | search | All RBAC-gated via `wfCanEditStage()` |
| Verify mutators | `wfSetVerifyState` · `wfSetVerifyEvidence` · `wfSetVerifyDoc` · `wfSetVerifyNotes` | search | All RBAC-gated |
| Access regime | `wfIsBrokerView` · `wfVisibleStages` · `wfCanEditStage` · `wfStageUnlocked` · `wfCanOverride` | search | The broker-wall logic |
| Override | `wfOverrideMoveStage` · `wfPromptOverrideMove` | search | Owner/admin moves the file to any stage |
| Send-back | `wfSendBack` · `wfPromptSendBack` | search | Lender-internal, broker-invisible, audit-logged |
| Render | `renderWorkflow(host, dealId)` · `_wfRenderTask` · `_wfRenderVerifyRow` | search | The whole workflow UI |
| Broker tasks | `getBrokerTaskBoard` · `btRaiseTask` · `btRespond` · `btAttachDoc` · `btClose` · `btReopen` · `renderBrokerTasks` | search | The cross-wall channel |

**Pattern to add a new workflow task:**
1. Add it to the relevant stage's `tasks:[]` in `WF_STAGES`, with `inputs:[{key, label, verify?, doc_type?}]`.
2. `getOrInitWorkflow` will seed it for new deals. Existing deals see it after the v1→v2 upgrade path runs.

---

## 8. Backend / API

All under `functions/api/*.js`. Cloudflare Pages auto-routes `/api/<file>` to `<file>.js`.

| Route | File | Auth | What it does |
|---|---|---|---|
| `/api/config` | `config.js` | none | Returns public Supabase URL + anon key |
| `/api/claude` | `claude.js` | requires Supabase JWT | Proxies to Anthropic with the server-side key |
| `/api/extract` | `extract.js` | requires Supabase JWT | Claude vision OCR |
| `/api/classify` | `classify.js` | requires Supabase JWT | Doc type classification |
| `/api/forensics` | `forensics.js` | requires Supabase JWT | 3-layer tamper detection |
| `_lib.js` | shared | — | CORS + `requireSupabaseSession()` helpers |

**Pattern to add a new API route:**
1. Add `functions/api/<name>.js` exporting `onRequest`.
2. Call `requireSupabaseSession(request, env)` from `_lib.js` for session-gating.
3. The Anthropic key lives ONLY in Cloudflare Pages env vars — never reference it from `index.html`.

---

## 9. Demo vs Live detection

| Function | What it does |
|---|---|
| `initBackend()` (line ~9750) | Fetches `/api/config`; if Supabase values come back, initialises `sbClient` and toggles `state.backend = true` |
| `aiLive()` | Shortcut: `state.backend && state.user` |
| `accessLive()` | Same as `aiLive` — but with a different name in the access module |
| `enterApp()` (line ~9755) | If `aiLive()`, calls `loadDeals()` to pull from Supabase; otherwise sticks with demo seeds |
| `saveDeal(d)` (line ~9770) | No-op in demo; upserts to Supabase in live |

**Pattern to make new live functionality:**
- Always make the feature work in demo first (`localStorage`).
- Mirror onto `deal.<field>` so `saveDeal` round-trips when live.
- For dedicated tables (like the workflow), add a migration in `supabase/migrations/` — DRAFT, not applied.

---

## 10. Smoke harness (the tests)

Location: `/tmp/diqtest/smoke.js` (a jsdom-based shim, not in the repo by design — it lives outside the prod artifact).

| Block | What it covers |
|---|---|
| `Ph1`–`Ph9` checks | The MASTER program phases |
| `WF1`–`WF5` checks | Workflow brief phases |
| `WF2.*verify*` | Field verification |
| `WF3.*` | Access regimes |
| `WF4.*` | Broker tasks |
| `Def-A` / `Def-B` | Deferred-items closure (Assets + emoji) |
| `RS` | Regulatory source provenance |
| `P5.*RBAC` | Access control |
| `P4` | Serviceability + DTI flag |

Run: `node /tmp/diqtest/smoke.js` from the repo root. **449/449 must pass before commit.**

---

## 11. Deployment

- Branch `main` → Cloudflare Pages auto-builds production for the four Pages projects (`debtiq`, `debtiq1`, `debtiq2`, `invite`).
- Other branches → preview builds.
- GitHub Actions has a `deploy` workflow that also runs on push to main (`.github/workflows/cloudflare-deploy.yml`).
- Env vars (`ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`) are configured per-environment in the Cloudflare Pages project, **never** in the repo.

---

## 12. Connect-the-dots: common issues → exact fix

| If you see this | Look here | What to change |
|---|---|---|
| A new lender needs different shading | `lenders.js` — that lender's `income_shading` map | Add/change keys to match `INCOME_TYPES` (line 2319) |
| DTI threshold needs updating | `dtiPolicy(id)` in `index.html` (~line 3090) | Adjust `high` / `veryHigh` / `bucketPct` defaults or lender overrides |
| A new role needs to edit a stage | `CAPABILITIES['stage.<X>.edit']` in `index.html` (~3005) | Add the role to the holders list |
| A workflow task needs a new field | `WF_STAGES[<stage>].tasks[<task>].inputs[]` (~line 7980) | Add `{key, label, verify?, doc_type?}` |
| A new doc type for verification | `VERIFY_DOC_TYPES` (~line 7950) | Add a new entry with `fields:[]` |
| Engine result missing a field | `computeServiceability()` return statement (~line 3324) | Add it to the `return { ... }` object; consumers read by key |
| A migration needs applying | Run `supabase/migrations/0001` or `0002` in Supabase SQL editor | DRAFT in repo — apply manually; document the date in `REVIEW-REGISTER.md` |
| A new audit event | Call `auditLog(action, detail, actor, role)` or `authAudit(event, detail, targetId)` | The 200-entry FIFO at `state.auditTrail` picks it up |
| A regulatory source needs updating | `REG_SOURCES` (in the worksheet section, ~line 3180) | Add/update the entry with `instrument`, `url`, `verified`, `clause`, `match` |
| New seed deal for the demo | `DEALS` (~line 2158) + `DEMO_DEAL_INTEL` (~line 6555) | Add the deal row + the per-entity intel template |
| Boot order changed | The `boot()` IIFE at ~line 10280 | Add new `loadX()` calls before `initBackend()` |
| Brand token is wrong somewhere | `:root` block at ~line 15–115 | Update the PRIMITIVE value; SEMANTIC + COMPONENT layers cascade |
| A new tab on the deal page | `WS_RENDERERS` at ~line 3478 + the tab strip at ~line 2005 + a new `renderX(el)` function | Three small edits, all referenced from `goTab(id)` |
| Smoke test breaks | `/tmp/diqtest/smoke.js` | The smoke harness lives outside the repo; update the failing assertion to match the new behaviour OR fix the code |

---

## 13. Things that should be there but aren't (be aware)

| Gap | Why it matters | How to close |
|---|---|---|
| No real test framework | jsdom smoke shim is fragile and doesn't run in CI | Move to Playwright + Vitest |
| No TypeScript | Refactors are risky | Migrate gradually — start with helpers files |
| No build pipeline | One 700KB HTML doesn't tree-shake | Adopt Vite; split into modules |
| Supabase RLS for the new slices isn't applied | `state.compliance/settlement/workflows/brokerTasks` only persist to localStorage in live | Apply migrations + wire `saveX()` to upsert |
| `CORS: '*'` on `/api/*` | Any origin can call the proxy if they have a valid JWT | Restrict to deployed origins in `functions/api/_lib.js` |
| No CSP / `_headers` | Vulnerable to XSS injection | Add a `_headers` file with a Content-Security-Policy |
| No rate limiting | Anthropic credit burn risk | Add Cloudflare WAF rules at the project level |
| No e2e browser tests | UX regressions slip through | Playwright with one happy-path test per major flow |
| `ANTHROPIC_API_KEY` rotation | If ever leaked, takes time to find every call site | Add a key-rotation runbook to `SECURITY.md` |

---

## 14. One last thing — when in doubt

- **Don't edit `/api/*`, auth flows, or `lenders.js` without a propose-and-gate PR.** They're the live contract surface.
- **Don't apply migrations silently.** Both `0001` and `0002` are DRAFT for a reason — they restructure access control.
- **Don't disable RBAC checks "just to debug."** Run with `setSimulatedRole('owner')` instead; the can() check returns true.
- **Don't commit secrets.** `.gitignore` excludes `.dev.vars` and `.wrangler/`; double-check before pushing.
- **Run the smoke suite before pushing.** `node /tmp/diqtest/smoke.js` → must read `449/449 checks passed`.
