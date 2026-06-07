# DebtIQ snapshot — 2026-06-07 (last known good before PR to main)

A frozen copy of the working DebtIQ app (tier-restructured demo: Free / Commercial /
Complete, commercial DSCR, end-to-end AI Pilot, honest indicative serviceability).

## To restore this version
From the repo root:

    cp snapshots/debtiq-2026-06-07/index.html ./index.html
    cp snapshots/debtiq-2026-06-07/lenders.js ./lenders.js
    cp -r snapshots/debtiq-2026-06-07/functions ./
    cp -r snapshots/debtiq-2026-06-07/supabase ./

Or check out the matching git tag:

    git checkout debtiq-snapshot-2026-06-07 -- index.html lenders.js functions supabase

## Note
This folder is a static copy. Cloudflare Pages Functions only run from the
top-level /functions directory, so the copy under here does NOT route — it's
inert backup, safe to keep or delete.
