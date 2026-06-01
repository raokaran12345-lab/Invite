# DebtIQ — Compliance Evidence Map (features, not legal conclusions)

This document records the **product features** that evidence and enable the
obligations in the Australian compliance map, plus the supporting artefacts
(data-flow map, breach-response runbook stub, disclosure register). It does
**not** assert that DebtIQ "is compliant", holds a credit licence, is an AML
reporting entity, or is CDR-accredited. Items marked `LEGAL-REVIEW:` /
`ARCH-REVIEW:` are for qualified Australian counsel / the owner.

> **The determination is the licensed humans'. The portal builds the evidence.**

---

## 1. Disclosure-document spine (NCCP §1–2)

Generators with **versioned, timestamped, signed-copy capture** and
required-field validation (`DISCLOSURE_DOCS` in `index.html`,
`generateDisclosure()` / `signDisclosure()`):

| Document | Reg | Required fields (validated) |
|---|---|---|
| Credit Guide | NCCP s.113/126/160 | licensee, ACL no., fees, top-6 lenders, commission range, volume-bonus statement, IDR/EDR |
| Quote | NCCP s.114 | licensee, ACL no., fees, services |
| Credit Proposal Disclosure | NCCP s.121 | licensee, ACL no., lender, commission range, fees |
| Preliminary Assessment | NCCP s.116/120 | client, requirements & objectives, financial situation, not-unsuitable reason |
| Needs Analysis | Best Interests Duty | client, requirements & objectives, priorities, scope |
| Pre-contractual Statement | NCCP s.16/17 | lender, amount, rate, term, fees |

`LEGAL-REVIEW:` exact field content, fee/commission wording, the
volume-bonus statement, IDR/EDR (real AFCA membership no.), and ACL number.

## 2. BID evidence (§3)

Requirements & Objectives narrative + alternatives-considered + basis are
generated on the Compliance page and written to the **attributed audit
trail** (`auditLog`). The serviceability gate ensures BID docs are only
produced for a loan that services.

## 3. Responsible-lending suitability (§4)

The **extraction → verification → serviceability** trail is the suitability
evidence (documents → OCR → forensic signals → calculator → verdict), all
attributed in the audit log. **Living-expense reconciliation** (declared vs
HEM floor) is shown on the Compliance page; the +3% buffer and HEM floor are
applied in every assessment.

## 4. VOI capture (§6)

Structured capture (`VOI_CATEGORIES`, `setVoiDoc()`): primary photographic /
secondary government / financial, with in-date checks and a verified flag.
**VOI completeness is a settlement pre-condition** (`voiComplete()` feeds the
settlement tracker — Phase 7).
- `LEGAL-REVIEW:` certified/original/NAATI rules, and **AML reporting-entity
  status** (the portal does not assert it is one).

## 5. Conditions / valuation / approval (§7)

Coded conditions (`DTI01`, `LMI01`, `INC02`, `IQA*`, `CON*`…) carry a
`resolveAt` stage; the settlement tracker (Phase 7) advances formal approval →
loan docs → settlement.

## 6. ADM disclosure (§9, due 10 Dec 2026)

Because DebtIQ uses AI to assist assessment, an **automated-decision-making
disclosure** + plain-language explanation surface is provided, with
acknowledgement capture (`acknowledgeADM()`, version-stamped).
- `LEGAL-REVIEW:` final ADM/privacy-notice wording.

## 7. Privacy / data (§9)

- **APP 5 collection notice** recorded at document upload (`recordAPP5()`).
- **Retention/deletion controls** (`setRetention()`, `deleteClientPII()` —
  privileged + re-auth + logged).
- **Least-privilege + audit logging** delivered by the Phase 5 access layer.
- `LEGAL-REVIEW:` sub-processor DPAs. `ARCH-REVIEW:` backend purge on deletion.

---

## Data-flow map (current)

```
Borrower documents (PNG/JPEG/PDF)
   │  uploaded in the deal's Documents tab (APP 5 notice recorded)
   ▼
Browser ──► /api/extract  (Claude vision OCR, session-gated)      [Anthropic]
        ──► /api/classify (document type)                         [Anthropic]
        ──► /api/forensics (tamper signals)                       [Anthropic]
   │  structured income/liability/security data
   ▼
state.calc  ──► computeServiceability() (buffer, HEM, shading, DTI flag)
   │
   ├─► Deals persisted as deals.data jsonb (RLS by user_id)       [Supabase]
   ├─► Compliance evidence persisted (localStorage today)
   └─► Audit trail (in-app; auth_audit_log when 0002 applied)     [Supabase]

Secrets (ANTHROPIC_API_KEY server-only; SUPABASE_* ) live in the
Cloudflare Pages secret store — never in the browser, never in code.
```

Sub-processors: **Anthropic** (AI), **Supabase** (auth + data), **Cloudflare**
(hosting + functions). `LEGAL-REVIEW:` DPAs with each.

## Breach-response runbook (STUB — for counsel/owner to complete)

1. **Detect & contain** — disable affected sessions/keys (rotate in the secret
   store); the append-only `auth_audit_log` is the forensic record.
2. **Assess** — scope of PII involved (deals/groups, exported PII actions are
   logged via `PII_EXPORTED`).
3. **Notify** — `LEGAL-REVIEW:` OAIC Notifiable Data Breaches assessment +
   timing; affected-individual notification.
4. **Remediate & review** — root cause, controls, retention check.

`LEGAL-REVIEW:` This stub is a starting point, not a compliant NDB plan.

---

## Open register (Phase 6 additions)

`LEGAL-REVIEW:` disclosure field content & wording · volume-bonus statement ·
IDR/EDR membership · ACL number · ADM notice wording · VOI certified/NAATI
rules · AML reporting-entity status · sub-processor DPAs · NDB plan.

`ARCH-REVIEW:` persist compliance evidence to Supabase (currently
localStorage) · backend PII purge on deletion.
