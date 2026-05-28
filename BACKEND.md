# DebtIQ — Backend Setup (Netlify Functions + Supabase)

DebtIQ runs as a **static demo with zero backend** by default (mock AI, no
sign-in, nothing saved). Follow this to enable the real backend:

- **Anthropic proxy** (`/api/claude`) — your API key lives only on the server.
- **Supabase auth** — email/password + magic link.
- **Per-broker persistence** — deals saved with row-level security (each broker
  sees only their own).

The app **auto-detects** the backend: if `/api/config` returns Supabase values it
switches on auth + persistence + live AI; otherwise it stays in demo mode. No
code changes needed to toggle.

> ⚠️ **Netlify Drop (drag-and-drop) will NOT run Functions.** Use a
> **git-connected Netlify site** or the **Netlify CLI** so `netlify/functions/*`
> are deployed.

---

## 1. Supabase (database + auth)

1. Create a project at supabase.com.
2. SQL editor → paste & run **`supabase/schema.sql`** (creates the `deals` table
   + RLS policies + `updated_at` trigger).
3. Authentication → Providers → enable **Email**. For magic links, add your site
   URL (e.g. `https://your-site.netlify.app`) under **URL Configuration →
   Redirect URLs**.
4. Project Settings → API → copy the **Project URL** and **anon public** key.

## 2. Anthropic

- Get an API key from console.anthropic.com (`sk-ant-...`).

## 3. Netlify

1. Push this repo to GitHub and **import it as a new Netlify site** (or run
   `netlify init` / `netlify deploy --build` with the CLI).
2. `netlify.toml` is already configured (publish `.`, functions
   `netlify/functions`, `/api/*` redirects).
3. Site configuration → **Environment variables** → add:

   | Key | Value | Exposed to browser? |
   |-----|-------|---------------------|
   | `ANTHROPIC_API_KEY` | your `sk-ant-...` | **No** — server only |
   | `SUPABASE_URL` | `https://xxxx.supabase.co` | yes (public) |
   | `SUPABASE_ANON_KEY` | the anon public key | yes (public, RLS-protected) |

4. Deploy. Visit the site → **Create account** → sign in. Deals now persist and
   AI (Pilot, Compliance, commentary) runs live through the proxy.

---

## How it fits together

- `netlify/functions/config.js` → `/api/config` returns the **public** Supabase
  values so the static page can boot the client (anon key is designed to be
  public; RLS is what protects data).
- `netlify/functions/claude.js` → `/api/claude` holds `ANTHROPIC_API_KEY`,
  **verifies the caller's Supabase session**, then calls Anthropic. The key is
  never sent to the browser.
- The browser calls Supabase directly for auth + `deals` CRUD (guarded by RLS),
  and calls `/api/claude` for AI.

## Security notes

- The Anthropic key is server-only. Anonymous visitors can't call the proxy —
  it requires a valid Supabase JWT.
- The Supabase **anon** key is meant to be public; do **not** expose the
  `service_role` key anywhere client-side.
- RLS policies ensure each authenticated user can read/write **only** their own
  `deals` rows.

## 4. Auto-deploy from GitHub (optional)

`.github/workflows/netlify-deploy.yml` deploys to Netlify on every push to
`main` / the working branch. Add two **GitHub** repo secrets
(Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|--------|-----------------|
| `NETLIFY_AUTH_TOKEN` | Netlify → User settings → Applications → Personal access tokens |
| `NETLIFY_SITE_ID` | Netlify → Site configuration → Site details → Site ID |

If the secrets are unset the workflow skips the deploy step (no failure).
Env vars (`ANTHROPIC_API_KEY`, `SUPABASE_*`) still live in **Netlify**, not GitHub.

## Document extraction (real OCR)

`netlify/functions/extract.js` → `/api/extract` sends uploaded images/PDFs to
Claude vision and returns structured income/liability JSON. When signed in,
uploading in a deal's **Documents** tab runs real extraction and fills the
calculator; in demo mode it falls back to a filename-based mock. Supported:
PNG/JPEG/WebP/PDF, ~6MB each, up to 6 files.

## Local dev (optional)

```
npm i -g netlify-cli
netlify dev          # serves index.html + functions at http://localhost:8888
```
Set the same env vars in a `.env` file or via `netlify env:set`.

## Deferred / notes

- Per-lender `base_rate` in `lenders.js` is indicative (no live pricing feed).
- Document **OCR** in the AI Pilot is still simulated; wire a real extraction
  endpoint (e.g. another function calling a vision model) to make it live.
