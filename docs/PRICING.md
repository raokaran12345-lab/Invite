# DebtIQ — pricing model

*v1 · 2026-06-06. Grounded in `debtiq-council/evidence-seed/2026-06-06-pricing-analysis.md`.
Prices in AUD, per broker / month. A hypothesis to validate (the founding-partner
ask is the test), not a committed price list.*

## The structure (Claude-style tiers)

| Tier | Price | What you get | Who it's for |
|---|---|---|---|
| **Free** | **$0** | **Indicative residential serviceability** across 26 lenders (indicative figures, *not* each lender's live calculator — a fast sanity check, not a Quickli replacement), lender policy & SLA library, funds-to-complete, product comparison. No AI document processing. | Every broker — land-and-expand |
| **Commercial** | **$99/mo** | Everything in Free **+ commercial & SME serviceability**, asset/commercial lending tools, commercial policy library. | Brokers doing commercial/SME |
| **Complete** | **$199/mo** | Everything in Commercial **+ AI document forensics** (tamper detection), automated extraction → calculator, and the **responsible-lending / BID compliance-evidence engine** — the full agentic prelim assessment. | Brokers who want the whole deal done |

**Annual:** 2 months free (~17% off) → Commercial **$990/yr**, Complete **$1,990/yr**.
**Founding partners (first ~10):** Complete at **$99/mo locked for life**.
**Brokerage / Team (5+ seats):** Complete at **$149/seat**.
**Aggregator / white-label:** custom (the partner path — see the acquire/niche evidence).

## Why this structure works (the COGS-aligned logic)

The genius of putting Quickli's feature **free** is that it costs almost nothing to
serve, while the things you charge for are exactly the things that cost money:

- **Free & Commercial tiers are ~$0 marginal cost.** Serviceability is pure math;
  the lender policy library is static data. No AI calls → no COGS. So a free
  residential tier is sustainable *and* undercuts Quickli's $99 entirely — pure
  customer acquisition.
- **Only the Complete tier carries real COGS** — the AI document forensics,
  extraction, and compliance generation (~$0.20–$0.35/deal, ~$8–$20/broker/month).
  At $199 that's **~90–96% gross margin**, and it's the only tier where cost scales
  with usage at all.

So the model monetises the AI-cost features and gives away the zero-cost ones —
the cleanest possible alignment of price to cost.

## Why these numbers

- **Free undercuts Quickli ($99 for serviceability alone).** That's the wedge:
  match their core feature at $0, then upsell the two things they don't do.
- **Commercial at $99** = the differentiated vertical with no Quickli competitor,
  anchored at the price band brokers already accept.
- **Complete at $199** = the full "whole prelim assessment" (docs → verified →
  serviceable → compliant file). Priced as a clear step up so the tiering reads
  cleanly, and justified because it replaces Quickli + manual doc checks + part of
  the compliance workflow.

## The honest part (Rainmaker)

- **Free Quickli-features is a deliberate land-and-expand bet.** You give up
  near-term revenue on the feature brokers already pay for, to acquire cheaply and
  upsell. It's defensible *because* that tier has ~zero marginal cost — but it only
  works if a meaningful share of free users convert to Commercial/Complete. Track
  free→paid conversion as the make-or-break metric.
- **The $99/$199 willingness-to-pay is untested.** The test is the founding-partner
  ask: *"Complete at $99/mo locked, unlimited — deposit/LOI now?"* A yes validates
  the model; a no is the most valuable early signal there is.
- Costs are **modelled, not measured** — instrument real per-deal spend before
  committing the Complete price.
