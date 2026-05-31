# DebtIQ — Regulatory Source Manifest (for Claude Code)

> Purpose: this is a **pointer document**, not a copy of the regulations. It tells Claude Code which official instruments govern DebtIQ's serviceability engine and compliance features, where to fetch the authoritative text, which clauses matter, and how each maps into the build. **Claude Code (or a human) must fetch the real documents from the official URLs below and extract clauses from those — never from paraphrase, including this file's summaries.** This file's summaries are orientation only and must not be treated as the legal text.
>
> **Not legal advice.** Currency must be verified at source; instruments are amended. Anything requiring a legal determination is flagged `LEGAL-REVIEW:`.

---

## How to use this with the engine
1. Fetch each instrument from its official URL (below).
2. Extract the operative clauses listed under "Extract".
3. Encode the rule per "Engine mapping", **per lender** (ADI vs non-ADI differ).
4. Store the source citation (instrument + section/paragraph + version date) next to each rule in the lender-policy config, so the serviceability worksheet can show provenance.
5. Where the instrument's wording is ambiguous for an automated rule, emit `LEGAL-REVIEW:` rather than guessing.

---

## 1. APS 220 Credit Risk Management — Attachment C (Macroprudential credit measures)
**The binding instrument behind the 1 Feb 2026 DTI limit.** A prudential *standard* (enforceable), not a guide.
- Official source: https://www.apra.gov.au/credit-risk-management  (locate the in-force APS 220 + Attachment C)
- Context/explanation (read alongside, do not cite as the rule): https://www.apra.gov.au/activation-of-debt-to-income-limits-as-a-macroprudential-policy-tool
- **Extract:** the DTI limit mechanics — the 20% cap basis; definition of DTI used; the ≥6× threshold; owner-occupier vs investor separation; the measurement period (quarterly); the exemptions (owner-occupier bridging loans; loans for purchase/construction of new dwellings); any proportionate treatment for smaller ADIs.
- **Engine mapping:** DTI ≥ 6× → **per-lender 20%-bucket FLAG, NOT a hard block**; separate OO and investor tracking; apply the bridging/new-build exemptions; surface as lender-appetite intelligence. Buffer/DTI are ADI rules — model non-ADI lenders separately (see §2 scope note).
- `LEGAL-REVIEW:` confirm the exact DTI definition and exemption boundaries against the in-force standard before coding thresholds.

## 2. APG 223 Residential Mortgage Lending (Prudential Practice Guide, June 2022)
**Guidance on sound serviceability practice — the buffer/floor/HEM source.**
- Official PDF: https://www.apra.gov.au/sites/default/files/2022-06/Final%20Prudential%20Practice%20Guide%20APG%20223%20Residential%20Mortgage%20Lending.pdf
- Landing/history: https://www.apra.gov.au/prudential-practice-guide-apg-223-residential-mortgage-lending
- Licence: CC BY 3.0 Australia (may reproduce with attribution to APRA; no implied endorsement) — so the real text *can* be quoted in DebtIQ's own compliance docs.
- **Extract:** the serviceability buffer guidance (the +3.00 percentage-point expectation, confirmed retained in 2026); the floor-rate guidance; expectations on assessing living expenses (HEM as a floor / greater-of declared vs benchmark); income treatment/shading expectations; debt-commitment treatment.
- **Engine mapping:** buffer **+3.00%** over actual rate (per lender; non-ADI may differ); HEM as `max(declared, HEM band)`; per-lender income shading; stress existing + new debts at rate+buffer via PMT. Show each rule's working in the serviceability worksheet.
- Scope note: APG 223 binds **ADIs**; APRA's reach over **non-ADI** lenders applies only where they materially contribute to systemic risk (currently not the case) — which is why non-banks can run lower buffers. Model buffer/DTI/shading **per lender**.

## 3. ASIC RG 273 — Mortgage brokers: Best Interests Duty (June 2020)
- Official PDF: https://download.asic.gov.au/media/5641325/rg273-published-24-june-2020.pdf
- **Extract:** the best-interests obligation (Pt 3-5A National Credit Act); the conflict priority rule; expectation to present more than one option where appropriate; record-keeping expectations.
- **Build mapping:** R&O / BID narrative generator must record *why* a recommendation suits the client, alternatives considered, and the basis — into the immutable attributed audit trail. This is the artefact ASIC reviews.

## 4. ASIC RG 209 — Credit licensing: Responsible lending conduct
- Official source: https://asic.gov.au/regulatory-resources/credit/responsible-lending/
- **Extract:** reasonable-inquiries and verification expectations; the "not unsuitable" assessment; living-expense inquiry/verification.
- **Build mapping:** the extraction → verification → serviceability trail as suitability evidence; living-expense reconciliation (declared vs statements vs HEM).

## 5. ASIC INFO 146 — Responsible lending disclosure obligations
- Official source: https://www.asic.gov.au/regulatory-resources/credit/responsible-lending/responsible-lending-disclosure-obligations-overview-for-credit-licensees-and-representatives/
- **Extract:** required content of the Credit Guide (s126 NCCP), Quote (reg 28D), Credit Proposal Disclosure (regs 28E/28G, s121), Preliminary Assessment (s116/s132), pre-contractual statement (s16 NCC) — field-by-field content lists.
- **Build mapping:** disclosure-document generators with field validation against these content lists; versioned, timestamped, signed-copy capture.

## 6. Privacy Act 1988 + APPs, and the 2024 amendments (OAIC)
- APPs: https://www.oaic.gov.au/privacy/australian-privacy-principles
- 2024 amendment / ADM disclosure: https://www.oaic.gov.au/privacy/privacy-legislation
- NDB scheme: https://www.oaic.gov.au/privacy/notifiable-data-breaches
- **Extract:** APP 1/5/6/11/12/13 obligations; the automated-decision-making disclosure requirement (mandatory 10 Dec 2026); NDB notification triggers/timeframes.
- **Build mapping (DebtIQ's DIRECT obligation):** privacy policy + **ADM disclosure** (DebtIQ uses AI for assessment); APP 5 collection notices at upload; retention/deletion controls; least-privilege + audit logging; breach runbook. `LEGAL-REVIEW:` the privacy-policy wording and sub-processor DPAs.

## 7. AML/CTF Act 2006 + 2024 reforms (AUSTRAC) — commence 31 Mar 2026
- Source: https://www.austrac.gov.au/
- **Extract:** reporting-entity definition; KYC/CDD; suspicious-matter reporting; VOI standard.
- **Build mapping:** structured VOI capture (document types, in-date, original/certified/NAATI rules) with provenance; VOI completeness as a settlement pre-condition. `LEGAL-REVIEW:` whether DebtIQ is a reporting entity.

## 8. E-conveyancing / settlement (ARNECC MOR & MPR; ECNL)
- Source: https://www.arnecc.gov.au/  · ELNOs: https://www.pexa.com.au/ , https://www.sympli.com.au/
- **Extract:** subscriber eligibility (legal practitioners + financial institutions meeting insurance threshold — not individuals); mandated-jurisdiction lodgement; trust-money handling.
- **Build mapping:** DebtIQ **coordinates to the conveyancing handoff, does not settle, holds no trust money**; PEXA/Sympli as an isolated adapter (mock by default). `ARCH-REVIEW:`/`LEGAL-REVIEW:` real ELNO connectivity, eligibility, trust money.

## 9. Consumer Data Right (ACCC/OAIC) — expanding to non-bank lenders from 2026
- Source: https://www.cdr.gov.au/  · privacy safeguards: https://www.oaic.gov.au/consumer-data-right
- **Build mapping:** document-upload model likely keeps DebtIQ outside CDR; **direct bank-feed ingestion → accreditation is a gating project** (`LEGAL-REVIEW:` + `ARCH-REVIEW:`).

---

## Instruction to Claude Code
For each instrument: fetch the official document, extract the listed clauses from the real text, encode the engine/build mapping **per lender**, and store the citation (instrument + section + version date) beside each rule so the serviceability worksheet and compliance features can show provenance. Do not encode any threshold or rule from this manifest's summaries alone — the summaries orient you; the regulator's text governs. Emit `LEGAL-REVIEW:` wherever the wording is ambiguous for an automated rule, and never state the portal "is compliant".

---

## Fetch status (recorded by the build agent)

Fetches were attempted **twice** (initial ingest + an explicit retry). Both
failed. The block is **environment-wide outbound network policy**, not a
per-site issue: in this execution environment even `https://example.com`
returns **HTTP 403** through the egress proxy, and `legislation.gov.au` does
not connect at all (`000`). Only internal allowlisted endpoints (the git
remote, the Anthropic API) are reachable. The official regulator domains
(apra.gov.au, asic.gov.au, oaic.gov.au, austrac.gov.au, legislation.gov.au)
are therefore **not retrievable from here at all** — retrying will not help.

**Update — official PDFs supplied by the human.** The owner subsequently
provided the official **APG 223** (Sep 2022) and **RG 273** (24 Jun 2020)
PDFs plus the ASIC responsible-lending overview page. The agent extracted the
operative clauses directly from those documents and **verified 4 of 11 rules**
(`REG_SOURCES[...].verified = true`, with the quoted clause + citation):

| Rule | Verified from | Operative clause |
|---|---|---|
| `buffer` | APG 223 quoting **APS 220 Att. C** | "ADI must apply a buffer over a loan's interest rate of **at least 3.0 per cent**… ignoring any discounted introductory or honeymoon rates"; used with an interest-rate floor. |
| `hem_floor` | APG 223 | "the **higher of** the borrower's declared living expenses **or** an appropriately scaled version of the HEM… a margin linked to the borrower's income". |
| `income_shading` | APG 223 | "discounts of **at least 20 per cent** on most types of non-salary income" (bonuses, overtime, rental, variable commissions). |
| `bid` | RG 273 | s158LA duty; s158LB conflict priority; RG 273.20 "present… **more than one option**"; RG 273.172 record alternatives + reasons. |

The encoded engine matches the verified text in each case (no threshold
mismatch found). The remaining **7 rules stay `verified:false` →
`LEGAL-REVIEW`** because their instruments were **not** supplied: APS 220
Attachment C (the DTI mechanics — APG 223 only quotes its buffer clause),
ASIC RG 209 and INFO 146 (operative detail; only the overview page was given),
and the Privacy Act/APPs, AML/CTF, ARNECC/ECNL and CDR instruments.

The engine carries each rule with its `verified` provenance flag (see
`REG_SOURCES` in `index.html`); unverified rules are surfaced as
`LEGAL-REVIEW` in the serviceability worksheet.

To verify, one of:
1. **Re-run this session in an environment whose network policy permits
   egress** to the regulator domains (configured when the environment is
   created — see https://code.claude.com/docs/en/claude-code-on-the-web).
   Then the agent can fetch each instrument, extract the operative clauses,
   and set each `REG_SOURCES[...].verified` to instrument + section + version.
2. **Attach the official PDFs to the repo** (e.g. under `docs/sources/`) — the
   agent reads local files freely and will extract clauses from those.
3. **A human opens the official URLs**, extracts the clauses, and the flags
   are flipped.
