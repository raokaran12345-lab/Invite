# Evidence — Sustainable pricing analysis (2026-06-06)

Type: analysis grounded in CURRENT Claude pricing (claude-api skill) + market
anchors (web). Answers "what's a sustainable price for DebtIQ?" = cost floor +
competitive anchor + value ceiling. The per-deal cost is a MODELLED estimate (not
measured) — corroborated by the earlier broker anecdote (~$0.38 for a 3-doc deal).

## Cost floor — the "sustainable" constraint (and it's tiny)
Current Claude pricing (per 1M tokens): Haiku 4.5 $1 in / $5 out · Sonnet 4.6 $3 /
$15 · Opus 4.8 $5 / $25. Document images are billed as input tokens (~1,600
tokens per rasterised page on Sonnet-class).

Modelled per-deal token budget (typical residential, ~15 page-images across
extraction + 3-layer forensics + 5 generated docs):
- ~61,000 input tokens (mostly vision) + ~8,000 output tokens.

| Model used for the deal | Per-deal AI cost |
|---|---|
| Haiku 4.5 | ~$0.10 |
| Sonnet 4.6 | ~$0.30 |
| Opus 4.8 | ~$0.50 |
| Blended (Sonnet vision + Haiku text) | **~$0.20–$0.35** |
| Heavy alt-doc/SME deal (2× docs) | ~$0.60; worst case ~$1.00 |

So per-deal AI cost is **well under $1**. At 20 deals/mo that's **~$4–$10 COGS per
broker**; at 40 deals/mo ~$8–$20. **The AI cost is NOT the binding constraint** —
this is the headline. It also means you can offer UNLIMITED deals per seat safely
(no metering anxiety), which is a selling point.

## Competitive anchor — what brokers already pay
- **Quickli**: Core ~$530–590/yr +GST; **Pro ~$99/user/mo** +GST (~$1,188/yr).
  13–14k brokers pay this — for serviceability ALONE.
- Effi / BrokerEngine / Salestrekker: per-seat subscriptions (per-deal metering is
  NOT the market norm — brokers want predictable seat pricing).
So the reference band is **~$99/broker/mo**, and it's proven.

## Value ceiling — what it's worth to the broker
- AU broker upfront commission ≈ 0.65–0.70% of the loan → ~$4,900 on a $700k loan,
  plus ~$1,050/yr trail. (Track My Trail / MFAA.)
- DebtIQ does the WHOLE prelim assessment (docs → verified → serviceable →
  compliant file), saving ~2–3 hrs/deal and reducing compliance risk. Capturing
  even ~1–2% of a single deal's commission per month (~$50–$100) is trivially
  justified. Value per deal dwarfs the ~$0.30 cost.

## Recommended price
**~$149 / broker / month, unlimited deals** (premium tier), annual ~$1,490/yr
(2 months free, mirroring Quickli Core). **Founding-partner price ~$89/mo locked
for the first ~10 brokers.**

Rationale:
- **Margin:** ~$8–$20 COGS/mo per broker → **~87–97% gross margin** at $149. Even a
  worst-case heavy-deal broker (40 deals × $1) = $40 COGS → still ~73% margin.
  Sustainable with enormous headroom; infra (Cloudflare/Supabase) is a small fixed
  cost on top.
- **Positioning:** sits JUST ABOVE Quickli's $99 — defensible only because it does
  the whole prelim assessment, not just serviceability. **Do NOT price at or below
  $99** or you signal "same thing as Quickli." The premium IS the message.
- **Packaging:** per-seat, unlimited deals (matches market norms; you can afford it
  because per-deal cost is trivial — turn that into the pitch: "unlimited, no
  per-deal fees").
- **Founding price** wins the first logos without anchoring the list price low.

Optional tiers: Solo $149/mo · Team (5+ seats) ~$129/seat · Aggregator/white-label
custom (the partner path from the other evidence files).

## Honest caveats + the test
- The per-deal cost is MODELLED, not measured. Instrument real spend across the
  next ~20 deals to confirm (the broker anecdote of ~$0.38/3-doc deal supports it).
- One broker said they'd switch — NOT at what price. Willingness-to-pay at $149 is
  untested. The test is the founding-partner ask: "$89/mo locked, unlimited, starts
  at launch — deposit/LOI now?" A yes validates the model; a no at $89 is the most
  important early signal there is.

## Sources
Claude pricing: claude-api skill (current). Broker commission: Track My Trail,
MFAA remuneration factsheet 2025. Software pricing: quickli.com.au/pricing, Effi,
BrokerEngine. (Some publisher pages 403 on direct fetch; figures from search
extraction.)
