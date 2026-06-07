# DebtIQ — honest build map

*2026-06-07. What's real, what's demo, and — bluntly — which gaps I can close with
code vs. which are blocked on real-world inputs only you can get. No "demo-ready"
hand-waving. Status key: ✅ real · 🟡 real-but-approximate/demo-fallback · 🔴 mock ·
⛔ blocked (not a coding problem).*

## The single most important truth
Roughly **half of "finishing" DebtIQ is not code.** A large block of features is
already coded and just needs you to **deploy + add keys**; another block is blocked
on **data, partnerships, legal, or a broker's "yes"** that I cannot produce. I can
build everything in Group A and the code side of Group B. I cannot close Group C.

---

## GROUP A — I can take these to "finished" in code now (no external deps)
| Component | Status | What "finished" means | Effort |
|---|---|---|---|
| Residential serviceability engine | ✅ real math, 🟡 approximate policy | Engine is sound (HEM, buffer, DSR/NDI/DTI, shading). "Finished" *as an indicative engine* = done. Accuracy vs real lender calcs is Group C. | done |
| Commercial / DSCR calculator | 🟡 real math, illustrative thresholds | DSCR logic is real; per-lender commercial policy is Group C. As an indicative tool = done. | done |
| Tier gating / pricing / demo tour | ✅ | Done. | done |
| AI Pilot end-to-end orchestration | ✅ (real when keyed) | Wiring done; goes live the moment a key exists (Group B). | done |
| Honest copy / no overstated claims | 🔴 "Quickli-equivalent" overstated | Replace with accurate language. | 30 min |
| Lender library breadth | 🟡 26 lenders, indicative | I can add more lenders + structure the data model to *accept* live rates/policy. Breadth ↑; **accuracy still Group C.** | hours |
| Client/Loan/Pipeline/Compliance UX | ✅ | Flows render and work on demo data. | done |

**Bottom line for Group A:** I can make every *in-app flow* coherent and honest, and
expand breadth — but I cannot make the serviceability numbers *match a real lender's
calculator*. That's the line.

---

## GROUP B — code is DONE; blocked on YOU flipping a switch
| Component | What's blocking | Who |
|---|---|---|
| Document OCR / extraction (`/api/extract`) | `ANTHROPIC_API_KEY` + deploy | You |
| Document forensics (`/api/forensics`) | same key + deploy | You |
| Compliance generation (`/api/claude`) | same key + deploy | You |
| AI Pilot (real document processing) | same key + deploy | You |
| Auth + per-broker persistence (Supabase) | create a Supabase project + apply `schema.sql` / `0001` / `0002` (`supabase/APPLY.md`) | You |
| Real billing (`/api/checkout`) | a Stripe account + `STRIPE_SECRET_KEY` | You |

**These are not half-built — they're built.** Without the key/deploy they run the
clearly-labelled demo path. With it, they're real. ~1–2 hrs of *your* setup, not mine.

---

## GROUP C — NOT a coding problem (this is where "finished" really lives)
| Gap | Why code can't close it | Who/what it needs |
|---|---|---|
| **Serviceability that matches the lender's real calc (Quickli parity)** | Quickli's moat = ~50 lenders' *actual* servicing-calculator logic + maintained live rates/policy, built over years via lender relationships. I can build the framework to hold it; I cannot source/replicate proprietary, constantly-changing lender calc logic. | Lender data feeds / partnerships / a data team |
| Live interest-rate & policy accuracy | No live pricing feed (`BACKEND.md:136`) | A rates data source |
| Extraction/forensics accuracy "good enough to trust" | Needs measurement against a labelled real-document set | Real consented documents + labelling |
| Compliance disclosure wording, ACL no., IDR/EDR, ADM notice | Legal determinations, not text I can invent | A qualified AU credit lawyer |
| Real settlement (PEXA/Sympli ELNO) | Subscriber agreement + eligibility | You sign agreements |
| **A broker actually committing / paying** | Not a product state — a validated decision | A real conversation you run |

---

## So, honestly:
- **"Can I finish the product?"** I can finish **Group A** and the **code** in Group B.
- **"Will that match Quickli?"** No. Quickli parity is **Group C** (data/partnerships),
  not code. The research already said: don't try to beat Quickli at serviceability —
  lead with what it doesn't do (unified assessment, commercial/DSCR, compliance).
- **"Will that make a broker commit?"** No product state does. Commitment is Group C.

## What "we go build it" can realistically deliver next (Group A)
1. Fix the dishonest Quickli copy (so the demo is defensible).
2. Expand the lender library + build the data model to ingest real rates/policy *when
   you have a feed* (breadth now, accuracy when sourced).
3. Tighten the differentiator flows (commercial, AI Pilot, compliance) so the parts
   that ARE ours are genuinely polished.
4. A real Client Portal endpoint (activates on deploy).
Everything else is Group B (your switch) or Group C (your real-world inputs).
