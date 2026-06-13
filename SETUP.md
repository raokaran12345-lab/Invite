# DebtIQ — Go-live checklist

DebtIQ runs at three levels. Do them **in order** — each is independently useful,
and you only need Stage 0 to install the app on a phone. Detail lives in
`BACKEND.md`; the data-isolation / RBAC model is in `SECURITY.md`.

---

## Stage 0 — Deploy + install  (free · ~5 min · no Anthropic/Supabase)

Demo mode = the full app with sample data. AI shows placeholders, data isn't
saved — but it's enough to **install on your phone** and show people.

1. **Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git** →
   pick this repo. Build settings:
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
   - **Production branch:** `main`
2. It deploys to **`https://debtiq.pages.dev`** (and a preview URL per branch —
   the GitHub Action in `.github/workflows/cloudflare-deploy.yml` also prints a
   preview URL if you'd rather drive it from CI with the two Cloudflare secrets).
3. **Install on your phone** (HTTPS is automatic, which install/service-worker need):
   - **iPhone (Safari):** Share → **Add to Home Screen**.
   - **Android (Chrome):** tap the **Install DebtIQ** pill, or menu → **Install app**.

> No Supabase or Anthropic key is required for Stage 0.

---

## Stage 1 — Real accounts + saved data  (Supabase · free tier)

Turns on real sign-up/login (incl. Google/Microsoft SSO), per-broker saved deals,
and the row-level isolation that makes one broker's data invisible to another.

1. Create a project at **supabase.com**.
2. **SQL editor** → run `supabase/schema.sql`, then `supabase/migrations/0001_…`
   and `0002_…`. Run `0003_…` **only** if you want org members to *see each
   other's* deals (read the file's privacy note first).
3. **Cloudflare Pages → Settings → Environment variables** (public, build-time ok):
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_ANON_KEY` = your anon/public key
4. Redeploy. Sign-up/login now persists; each user sees only their own rows.

---

## Stage 2 — Live AI  (Anthropic API key)

Turns demo AI into real document extraction, commentary, and forensics.

1. **console.anthropic.com** → add billing → **Create API key** (`sk-ant-…`).
   *(This is the Anthropic **API/Console** — not a Claude.ai chat subscription,
   and you don't share a login. One key serves the whole app.)*
2. **Cloudflare Pages → Settings → Environment variables** →
   `ANTHROPIC_API_KEY` = `sk-ant-…` — **mark as a secret (server-only)**.
3. Redeploy. The `/api/*` proxy verifies the signed-in Supabase session, then
   calls Claude — the key is never sent to the browser, and anonymous visitors
   can't burn your credits. Default model is set in `functions/api/claude.js`.

---

## Stage 3 — App stores  (optional)

The installable PWA is already a real mobile app. For native **App Store / Play
Store** binaries, wrap it with **Capacitor** (needs Apple/Google developer
accounts). Ask and I'll scaffold it — it packages this exact app, no rewrite.

---

### Quick reference — environment variables

| Variable | Value | Where | Secret? |
|---|---|---|---|
| `SUPABASE_URL` | project URL | Cloudflare Pages | No |
| `SUPABASE_ANON_KEY` | anon/public key | Cloudflare Pages | No |
| `ANTHROPIC_API_KEY` | `sk-ant-…` | Cloudflare Pages | **Yes — server only** |

Secrets live only in the hosting environment — never in the repo or the browser.
