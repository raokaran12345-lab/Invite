# Evidence — DebtIQ product-state audit (2026-06-06)

Source: direct review of the DebtIQ codebase (index.html ~11.7k lines, functions/api/*,
supabase/*, compliance docs) plus the remediation work that followed. This is REAL
ground truth about the product as built — not a hypothesis — so the council may use
it to move maturity off the analysis-only ceiling for the PRODUCT dimension.

It does NOT contain market ground truth (no paying broker, no real per-deal cost, no
distribution outcome), so the council should still cap maturity until those exist.

## What is actually built (verified in code)
- Production-grade core: serviceability calculator (HEM floor, +3% buffer, DTI,
  per-lender income shading), a 23-lender policy library, NCCP disclosure generators,
  document OCR (/api/extract), 3-layer forensics (/api/forensics), settlement tracker.
- Auth + per-broker persistence via Supabase with own-rows RLS (data is tenant-safe).
- Backend auto-detects: runs as a static demo with mock AI when no key/Supabase.

## Build order (the prioritisation finding)
- ~9 phases of compliance/forensics/serviceability machinery were built with ZERO
  evidence of customer validation first — no broker interview, willingness-to-pay
  test, or distribution plan anywhere in the changelog. The most fundamental problem
  (does a broker want/pay for this, and can you reach them past the aggregator) was
  never solved before the expensive ones.

## Correctness/honesty defects found AND FIXED this session
1. Serviceability verdict used an arbitrary `ndi > -250` BORDERLINE band and DTI never
   affected the verdict; negative surplus slipped through as BORDERLINE. → Fixed:
   income-scaled "thin" margin, DTI downgrades a clean pass to BORDERLINE, negative
   surplus now FAILs.
2. Compliance docs generated on a passive warning for thin-NDI / high-DTI / LVR>90.
   → Fixed: high-severity flags now require an audit-logged broker attestation + a
   runtime guard before any generator runs.
3. Forensics flagged a lone "produced by Acrobat" PDF as high-severity "tampering". →
   Fixed: PDF converters are now medium and need corroboration; image editors stay high.
4. AI Pilot fabricated a hardcoded "Sarah Mitchell (extracted)" profile ONLY when a key
   was set — i.e. paying users were shown invented figures labelled "extracted", no
   disclaimer. → Fixed: live uses real extractions (or prompts to upload); demo shows a
   clearly-labelled unverified SAMPLE.
5. Wizard/portal marked demo uploads "Verified 96%" and minted fake "secure links";
   Billing showed hardcoded usage. → Fixed: honest demo labels, real local usage,
   persistent plan selection.

## Still open — external dependencies (cannot be closed in code)
- Supabase RBAC migrations (0002) authored + client-wired (fail-safe) but NOT APPLIED
  to a live DB — owner action.
- Stripe billing endpoint built; needs STRIPE_SECRET_KEY to charge.
- ELNO/PEXA settlement is a labelled mock; needs a subscriber agreement.
- Legal register unresolved: ACL placeholder in Credit Guide, AML status, NDB plan
  stub, ADM wording (due 10 Dec 2026). Needs counsel.

## Council read
- Product maturity: real and above the "idea" band — coherent, mostly-correct, now
  honest. But market validation = zero. Highest-leverage next problems remain
  distribution, willingness-to-pay, and per-deal unit economics, none of which more
  code can answer. The cheapest disconfirming test is still: put the calculator +
  lender library + forensic signal in front of 5–10 real brokers and get a yes/no on
  paying.
