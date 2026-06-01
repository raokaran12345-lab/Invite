# DebtIQ — Consolidated LEGAL-REVIEW / ARCH-REVIEW Register

Handed to the human/counsel at the close of the MASTER integration program.
Every item below was **flagged, never assumed**. The code does not assert the
portal "is compliant", holds a licence, or is an AML/CDR/ELNO entity.

> This program builds the product features that **enable and evidence**
> compliance. Licensing, AML, trust-money, settlement-eligibility, CDR and
> privacy-policy wording are legal determinations for qualified Australian
> counsel.

---

## LEGAL-REVIEW (for counsel)

| # | Item | Raised in | Notes |
|---|---|---|---|
| L1 | **ACL / licensing status** — is the ACL number real & owner-held? | Phase 0/6 | Credit Guide shows a placeholder ACL; disclosure docs must not assert licensure not held. |
| L2 | **AML reporting-entity status** | Phase 0/6/7 | VOI + large-deposit features must not imply DebtIQ is an AML reporting entity. |
| L3 | **ADM disclosure wording** (privacy notice, due 10 Dec 2026) | Phase 6 | Plain-language ADM explanation drafted; final wording is counsel's. |
| L4 | **Trust-money handling** | Phase 7 | Settlement coordinates only; confirm no trust money ever flows. |
| L5 | **PEXA/Sympli subscriber eligibility** | Phase 7 | Gating before any real ELNO connectivity. |
| L6 | **CDR accreditation** | Phase 8 | Gating project; DebtIQ currently out of scope (see CDR.md). |
| L7 | **Sub-processor DPAs** (Anthropic, Supabase, Cloudflare) | Phase 6 | For the data-flow map. |
| L8 | **Disclosure field content & wording** | Phase 6 | Credit Guide / Quote / Proposal / Preliminary Assessment / Needs Analysis / Pre-contractual field lists. |
| L9 | **Volume-bonus statement, IDR/EDR (AFCA membership no.), fee/commission disclosure** | Phase 6 | Placeholder copy pending counsel. |
| L10 | **VOI standard specifics** — certified / original / NAATI rules | Phase 6 | Capture structure built; rules to confirm. |
| L11 | **DTI thresholds, the ~20% high-DTI bucket, and exemptions** | Phase 4 | Reflect publicly-known APRA framing; indicative pending the compliance map (§5). |
| L12 | **Notifiable Data Breach plan** | Phase 6 | COMPLIANCE.md has a runbook *stub* only. |

## ARCH-REVIEW (for the owner / architecture)

| # | Item | Raised in | Notes |
|---|---|---|---|
| A1 | **Apply migration `0001_lending_groups.sql`** | Lending-group brief | DRAFT, not applied. |
| A2 | **Apply migration `0002_access_control.sql`** + wire membership/role reads | Phase 5 | Turns RBAC enforcement on in live mode. DRAFT, not applied. |
| A3 | **Secret-store wiring** beyond Cloudflare Pages env vars | Phase 5 | Owner action; code reads env refs only. |
| A4 | **Owner-account provisioning + real auth** | Phase 5 | Owner action; agent creates no accounts/secrets. |
| A5 | **Security headers / CSP** (`_headers`) | Phase 5 | Recommended config in SECURITY.md; not committed live (CDN inline-script caveat). |
| A6 | **CORS tightening** on `/api/*` (`Access-Control-Allow-Origin: '*'`) | Phase 0/5 | Live contract change → gated. |
| A7 | **Rate limiting** on auth + AI proxy | Phase 5 | Cloudflare WAF / rate rules. |
| A8 | **Live re-auth + active-session revocation** | Phase 5 | Needs server support. |
| A9 | **Persist compliance evidence to Supabase** (currently localStorage) | Phase 6 | Plus backend PII purge on deletion. |
| A10 | **Real ELNO (PEXA/Sympli) connectivity** | Phase 7 | Isolated adapter is mock-by-default; real = human-enabled. |
| A11 | **CDR subsystem** (only if direct bank feeds are elected) | Phase 8 | Isolated, accreditation-gated. |

---

## Regulatory source verification (manifest ingest)

The Regulatory Source Manifest (`docs/regulatory-source-manifest.md`) was
ingested and wired to a provenance layer (`REG_SOURCES` in `index.html`):
every engine/compliance rule cites its instrument + sections-to-extract +
official URL + a `verified` flag, surfaced in the serviceability worksheet's
**Regulatory provenance** section.

**Source-verification status: 5 / 11 verified + 3 partial.** The owner supplied
official PDFs/pages (APG 223, RG 273, ASIC INFO 146 disclosure overview, OAIC
APP/NDB/privacy-legislation + CDR pages, AUSTRAC homepage, Sympli ELNO page).
The agent extracted the operative clauses and verified/partly-verified the rules
below (clause + citation stored in `REG_SOURCES`). Fully-unverified rules stay
`LEGAL-REVIEW`: APS 220 Att. C (DTI), RG 209 operative text, and AML/CTF were
not supplied; the egress block persists.

| Rule | Instrument | Verified? |
|---|---|---|
| Serviceability buffer (≥3.0%) | APRA APG 223 → APS 220 Att. C | ✅ verified (clause quoted) |
| HEM floor (higher-of) | APRA APG 223 | ✅ verified (clause quoted) |
| Income shading (≥20% non-salary) | APRA APG 223 | ✅ verified (clause quoted) |
| BID R&O narrative | ASIC RG 273 (ss 158LA/158LB) | ✅ verified (clause quoted) |
| Disclosure spine field content | ASIC INFO 146 (regs 27A/28/28D/28F/28G/28P/28Q) | ✅ verified (clause quoted) |
| ADM + APP5 + retention + NDB | Privacy Act + APPs (OAIC) | ◑ partial (coverage + 13 APPs + NDB trigger confirmed; APP5/ADM/timeframe pending) |
| Settlement coordination | ARNECC MOR/MPR; ECNL (Sympli) | ◑ partial (external ELNO e-settlement + interoperability + practitioner-use confirmed; ARNECC subscriber-eligibility/trust-money pending) |
| CDR out-of-scope | CDR (ACCC/OAIC) | ◑ partial (accredited-provider premise confirmed → out-of-scope holds; accreditation rules pending) |
| DTI ≥6× / 20% bucket / exemptions | APRA APS 220 Att. C | ❌ pending (doc not supplied) |
| Responsible-lending trail | ASIC RG 209 | ❌ pending (only overview page) |
| VOI capture | AML/CTF Act + 2024 reforms | ❌ pending (AUSTRAC nav only; reporting-entity status LEGAL-REVIEW) |

Reconciliation: for all four verified rules the **encoded engine matches the
operative text** (buffer +3.0% = "at least 3.0 per cent"; HEM max(declared,band)
= "higher of"; non-salary shading 0.80 = "at least 20 per cent"; BID records
alternatives + reasons). No threshold mismatch found.

## Verification snapshot (Phase 9)

- **Brand:** zero violet (colour retired; class names renamed to `.neutral`);
  ink monogram at favicon/login/broker+assessor cmd-bars/pack masthead; tokens
  documented as PRIMITIVE → SEMANTIC → COMPONENT; numbers `.mono` + tabular.
- **UX-QA:** standalone affordance emoji (search, upload, toast, KPI tiles)
  converted to SVG; `:focus-visible` rings + keyboard handlers on new Phase 5–7
  surfaces; reduced-motion honoured globally.
- **Demo + live both work:** RBAC defaults to today's per-user behaviour when
  live membership isn't wired; all new state slices are localStorage-only.
- **No un-gated backend/integration changes:** `/api/*`, auth, and `lenders.js`
  untouched; schema changes delivered as **DRAFT** migrations (`0001`, `0002`),
  not applied.
- **Tests:** in-repo smoke harness green across all phases at handoff.
