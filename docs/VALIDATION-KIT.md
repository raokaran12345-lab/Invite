# DebtIQ — 2-week validation kit

*Everything needed to run the test in `PRODUCT-THESIS.md`. The assets are ready;
the **conversations are yours** — an AI can't and shouldn't cold-contact real
brokers or corporate-development teams on your behalf. Goal: get one paying "yes"
or one corp-dev "let's talk" before building anything new.*

## The tracker (fill as you go)

| # | Channel | Target | Asked | Result | Verdict |
|---|---------|--------|-------|--------|---------|
| 1 | Brokers (×5) | _your network_ | demo + price-test | | |
| 2 | Aggregator corp-dev | AFG | build/partner/buy email | | |
| 3 | Aggregator corp-dev | LMG | build/partner/buy email | | |
| 4 | Commercial aggregator (×2) | _e.g. Platform Finance_ | discovery Qs | | |
| 5 | Platform vendor | Salestrekker / Effi | partner-or-compete | | |

**Pass:** any paying yes from #1, or a "let's talk" from #2/#3, or a clear unmet
need from #4. **No-go signals** are the kill-criteria in `PRODUCT-THESIS.md`.

---

## Asset 1 — Aggregator corp-dev email (AFG / LMG)
*Find the right person via LinkedIn ("Corporate Development" / "Head of Strategy" /
"CTO"). Keep it short. Replace [...] fields.*

> **Subject:** AI compliance + forensics module for brokers — build/partner/buy?
>
> Hi [Name],
>
> I'm [Your name], founder of DebtIQ. We've built an AI assessment layer for
> brokers that does the part the current tools don't: it takes a deal from raw
> documents to a **verified, serviceable, compliance-evidenced** file in one pass —
> document forensics on the non-CDR docs (payslips, tax, BAS), multi-lender
> serviceability, and an auto-generated Best-Interests-Duty / responsible-lending
> audit trail.
>
> With ADM disclosure (Dec 2026), AML reform and CDR for non-bank lenders all
> landing in 2026, I think there's a real "leapfrog" opportunity for [AFG/LMG], and
> I'd rather explore it with you than around you.
>
> Could I get **15 minutes** to show you the working product and understand whether
> this is a build, partner, or buy conversation for you?
>
> Thanks,
> [Your name] · [phone] · [link/deck]

---

## Asset 2 — 5-broker demo script + price-test (~10 min each)
*Use brokers in your network. Watch a REAL deal if possible. The price answer is
the prize.*

1. **Context (1 min):** "I'm not selling — I want to know if this is useful and
   what it's worth. Be brutal."
2. **Watch them work (2 min):** "Walk me through how you do a prelim assessment
   today — Quickli, your CRM, document checks. Where does it hurt?"
3. **Show the unified flow (4 min):** documents in → forensic flags → serviceability
   across lenders → a generated responsible-lending file. "One pass, not four tools."
4. **The two questions that matter (3 min):**
   - "Would you actually change your workflow for this — yes or no, honestly?"
   - **"It does the whole prelim assessment, not just serviceability. Quickli's
     ~$99/mo. Would you pay $X/mo for this on top of, or instead of, that?"**
     *(Test 2–3 price points: e.g. $79, $129, $199. Record the exact number and
     whether they'd drop Quickli.)*
5. **Kill-listen-for:** "I'd rather keep Quickli + my CRM separate." If ≥3 of 5 say
   that → the unified pitch is dead; pivot to white-label/commercial.

---

## Asset 3 — Commercial / asset-finance aggregator discovery (×2)
*Open questions — you're validating a gap, not pitching. Targets: Platform Finance,
SME/commercial-focused groups, Connective Commercial.*

1. "How do your brokers do **serviceability for commercial/SME** deals today?"
   (Listen for: spreadsheets, manual, per-lender, painful.)
2. "Is there a Quickli-equivalent for commercial? What's missing?"
3. "How do they evidence **responsible-lending / compliance** on commercial files?"
4. "If a tool did commercial serviceability + document verification + a compliant
   file in one pass, would that be a vitamin or a painkiller?"
5. "Who would pay for it — the broker, you as the aggregator, or the lender?"

---

## Asset 4 — Platform vendor probe (Salestrekker / Effi)
*One question, by email or a call:* "You're adding AI compliance/document
verification. Is there room to **partner** on a forensics + serviceability +
responsible-lending evidence engine, or are you building it yourselves?" (Their
answer tells you partner vs fast-follower — a kill-signal if the latter.)

---

## How to read the fortnight
- **Best outcome:** a corp-dev "let's talk" (validates acqui-hire/white-label) OR
  ≥2 brokers commit to a real price → build toward that buyer.
- **Pivot outcome:** brokers love it but won't pay standalone, yet commercial
  aggregators describe real pain → aim at commercial.
- **Stop outcome:** everyone's covered (brokers keep Quickli; aggregators happy;
  vendors building it) → the honest answer is acqui-hire or shelve. That is a
  *result*, not a failure — it saves you months.

> Drop your findings into `debtiq-council/evidence-seed/` (e.g. `broker-pricetest.md`)
> and run `npm run seed && node council.js --once` (with an API key) so the council
> deliberates on the REAL result — that's the first evidence that can move maturity
> past 50.
