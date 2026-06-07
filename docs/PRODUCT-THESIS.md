# DebtIQ — product thesis (one page)

*Working strategy, v1 · 2026-06-06. Grounded in the council's market research
(`debtiq-council/evidence-seed/`). A hypothesis to validate, not a finished plan.*

## The one line
**DebtIQ is the agentic glue between the broker tools that already exist** — it
takes a deal from raw documents to a *verified, serviceable, compliance-evidenced*
file in one pass, doing the parts no incumbent will.

## The insight (why there's a seam)
The Australian credit stack is a set of **owned point-tools that don't talk to each
other**, and each is locked to its category and channel:
- **Serviceability** → Quickli (owns ~13–14k brokers).
- **CDR bank data + auto-populate** → NextGen Financial Passport / Frollo (free, on
  the ApplyOnline rail).
- **Document fraud / extraction** → Fortiro (sells to lenders, *not* brokers).
- **Compliance workflow** → aggregator CRMs (Mercury Nexus, Salestrekker, Effi).

**No one stitches them into one agentic assessment**, and none of them will: Quickli
won't take compliance liability, Fortiro can't reach brokers, the CRMs can't do real
forensics, the CDR rails don't cover the documents alt-doc deals run on. That
unowned glue — *data + forensics + serviceability + auto-generated responsible-
lending evidence, in one flow* — is the opening.

## What we build (orchestrate, don't rebuild)
A broker-side **AI assessment agent** that:
1. **Consumes the owned rails** — CDR bank data via NextGen/Frollo (don't re-clone it).
2. **Adds the unowned glue we already have built**: document **forensics** on the
   non-CDR docs (payslips, tax returns, BAS, accountant declarations) that
   self-employed / alt-doc / SME deals depend on; multi-lender **serviceability**
   synthesis; and an auto-generated **BID / responsible-lending evidence trail +
   audit log**.
3. **Outputs** a lodgement-ready, defensible file — one agentic pass, not four tools.

## Why now
The **2026 compliance wave** forces buying the generalist CRMs are slow on: ADM
disclosure (due 10 Dec 2026), AML reforms, CDR for non-bank lenders (from 13 Jul
2026), BNPL credit licensing. Plus the market is shifting from point-tools to
**agents** — incumbency protects the old category, not the new one.

## Why us
The four hard pieces are **already built** in the DebtIQ codebase: document
forensics, a multi-lender serviceability engine, NCCP/BID compliance-evidence
generation, and document extraction. The remaining work is **orchestration +
a commercial extension**, not a ground-up build.

## Beachhead: commercial / SME finance broking
SMEs ≈ 98% of Australian businesses; brokers are moving into commercial/asset
finance; and **no Quickli-grade serviceability or compliance tool exists for
commercial** — Quickli, Fortiro and the CDR rails are all residential-first. Thinnest
competition, real demand. (Residential alt-doc is the fallback; pure-PAYG residential
is the weakest — owned on every axis.)

## Who pays (pick one for the first dollar)
1. **Brokers-direct, premium tier** above Quickli's ~$99/mo — justified because it
   does the *whole* prelim assessment, not just serviceability. (Don't price like
   Quickli or you're fighting Quickli.)
2. **Aggregator white-label / acquisition** — precedent: AFG bought BrokerEngine,
   LMG bought The Brokers' Bible. Sell them "leapfrog on AI compliance + forensics."
3. **Commercial / asset-finance aggregators** — pay for the tool that doesn't exist
   for their segment.

## Moat (what compounds)
The integration *across* categories (which each incumbent structurally won't cross),
compliance trust + the audit-trail dataset, and — in commercial — a proprietary
lender-policy/serviceability library no one else has built.

## The validation plan (2 weeks, before more build)
- Show the unified flow to **5 brokers**; price-test the premium tier.
- Email **AFG & LMG corporate development**: build / partner / buy?
- Ask **2 commercial/asset-finance aggregators** what serviceability/compliance tool
  they wish existed.
- Confirm **1 platform vendor** (Salestrekker/Effi) is partner, not fast-follower.
**First to return a paying "yes" (or a corp-dev "let's talk") sets the roadmap.**

## Honest risks (kill-criteria)
- Brokers prefer to keep Quickli + their CRM separate → the unified pitch is dead.
- An aggregator/CRM ships the same orchestration first → become a feature.
- Commercial serviceability is too non-standardised to systematise affordably.
- The whole thing is most valuable as an **acqui-hire**, not a standalone venture —
  a legitimate outcome, not a failure.
