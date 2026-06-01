# DebtIQ — Backend Setup (Cloudflare Pages + Supabase)

DebtIQ runs as a **static demo with zero backend** by default (mock AI, no
sign-in, nothing saved). Follow this to enable the real backend:

- **Anthropic proxy** (`/api/claude`) — your API key lives only on the server.
- **Supabase auth** — email/password + magic link.
- **Per-broker persistence** — deals saved with row-level security (each broker
  sees only their own).

The app **auto-detects** the backend: if `/api/config` returns Supabase values it
switches on auth + persistence + live AI; otherwise it stays in demo mode. No
code changes needed to toggle.

> The five `/api/*` routes are Cloudflare **Pages Functions** living under
> `functions/api/*.js` — file path = URL route, no `_redirects` needed.

---

## 1. Supabase (database + auth)

1. Create a project at supabase.com.
2. SQL editor → paste & run **`supabase/schema.sql`** (creates the `deals` table
   + RLS policies + `updated_at` trigger).
3. Authentication → Providers → enable **Email**. For magic links, add your site
   URL (e.g. `https://debtiq.pages.dev`) under **URL Configuration →
   Redirect URLs**.
4. Project Settings → API → copy the **Project URL** and **anon public** key.

## 2. Anthropic

- Get an API key from console.anthropic.com (`sk-ant-...`).

## 3. Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** (leave empty — pure static)
   - **Build output directory:** `/` (the repo root)
4. **Environment variables** → add for **Production** *and* **Preview**:

   | Key | Value | Exposed to browser? |
   |-----|-------|---------------------|
   | `ANTHROPIC_API_KEY` | your `sk-ant-...` | **No** — server only |
   | `SUPABASE_URL` | `https://xxxx.supabase.co` | yes (returned by `/api/config`) |
   | `SUPABASE_ANON_KEY` | the anon public key | yes (public, RLS-protected) |

5. Deploy. Visit the site → **Create account** → sign in. Deals now persist and
   AI (Pilot, Compliance, commentary) runs live through the proxy.

---

## How it fits together

- `functions/api/config.js` → `/api/config` returns the **public** Supabase
  values so the static page can boot the client (anon key is designed to be
  public; RLS is what protects data).
- `functions/api/claude.js` → `/api/claude` holds `ANTHROPIC_API_KEY`,
  **verifies the caller's Supabase session**, then calls Anthropic. The key is
  never sent to the browser.
- `functions/api/extract.js` → `/api/extract` runs Claude vision OCR on
  uploaded payslips / statements / tax docs.
- `functions/api/forensics.js` → `/api/forensics` runs three-layer tamper-signal
  analysis (PDF metadata in pure JS + Claude vision + cross-document
  consistency).
- `functions/api/classify.js` → `/api/classify` identifies the document type.
- The browser calls Supabase directly for auth + `deals` CRUD (guarded by RLS),
  and calls `/api/*` for AI.

## Security notes

- The Anthropic key is server-only. Anonymous visitors can't call the proxy —
  it requires a valid Supabase JWT.
- The Supabase **anon** key is meant to be public; do **not** expose the
  `service_role` key anywhere client-side.
- RLS policies ensure each authenticated user can read/write **only** their own
  `deals` rows.

## 4. Auto-deploy from GitHub (optional)

The cleanest path is the **Cloudflare Pages Git integration** set up in step 3 —
every push to your tracked branch deploys automatically. No GitHub Actions
needed.

If you'd rather drive deploys from a workflow, use the
[`cloudflare/wrangler-action`](https://github.com/cloudflare/wrangler-action)
with a `wrangler pages deploy .` command and two repo secrets:

| Secret | Where to get it |
|--------|-----------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → **Create Token** with the *Edit Cloudflare Workers* template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → Workers & Pages → right-hand sidebar |

Env vars (`ANTHROPIC_API_KEY`, `SUPABASE_*`) still live in the **Cloudflare
Pages project**, not in GitHub.

## Document extraction (real OCR)

`functions/api/extract.js` → `/api/extract` sends uploaded images/PDFs to
Claude vision and returns structured income/liability JSON. When signed in,
uploading in a deal's **Documents** tab runs real extraction and fills the
calculator; in demo mode it falls back to a filename-based mock. Supported:
PNG/JPEG/WebP/PDF, ~6MB each, up to 6 files.

- **PDF fallback:** PDFs are rasterised to PNG **in the browser** (pdf.js, first
  ~3 pages) before upload, so extraction works even if your Anthropic account
  can't take PDFs directly. If pdf.js fails to load, the raw PDF is sent instead.
- **Tester:** the **Compliance AI** page has a drag-and-drop tester that shows the
  raw JSON the model returns — use it to sanity-check extraction before relying on
  it in a deal.

## Local dev

```sh
npm i -g wrangler
wrangler pages dev .          # serves index.html + functions at http://localhost:8788
```

No `wrangler.toml` needed — the `.` argument tells wrangler the project
root. Create a `.dev.vars` file at the repo root for local secrets
(gitignored):

```
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=...
```

When `SUPABASE_URL` / `SUPABASE_ANON_KEY` are unset locally, the app falls back
to the static demo path, identically to production.

## Deferred / notes

- Per-lender `base_rate` in `lenders.js` is indicative (no live pricing feed).
- Document **OCR** is live via `/api/extract` whenever the user is signed in;
  the AI Pilot's per-document narration still uses simulated extraction in the
  demo path.
