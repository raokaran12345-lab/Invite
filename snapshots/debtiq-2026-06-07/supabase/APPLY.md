# Applying the DebtIQ backend (Supabase)

This is the owner/ARCH-REVIEW runbook for turning the live backend on. The app is
**fail-safe**: with none of this applied it runs as today (demo or per-user live);
each step below adds capability without breaking what came before. Nothing here is
run by the build — applying to a database is an owner action.

> The app never holds a service-role key. Everything below runs under the **anon
> key + RLS**, exactly as the running app does.

## Order of operations

| # | File | What it does | Reversible? |
|---|------|--------------|-------------|
| 1 | `schema.sql` | `deals` table + own-rows RLS + `updated_at` trigger | drop table |
| 2 | `migrations/0001_lending_groups.sql` | Lending-group tables (currently localStorage-only in the app) | drop tables |
| 3 | `migrations/0002_access_control.sql` | Orgs / memberships / invitations / append-only audit + RLS, and a **nullable** `deals.org_id` | drop tables / column |
| 4 | `migrations/0003_deals_org_scope.sql` | **OPT-IN.** Lets org members read each other's deals (a PII decision) | `drop policy` |

Run 1–3 in the **Supabase SQL editor** (or `supabase db push`). Run **4 only after**
you have decided org members should share deal visibility.

## Step 1–3 — apply

1. SQL editor → paste & run `schema.sql`, then `0001`, then `0002`, in order.
2. Authentication → Providers → enable **Email**.
3. Confirm the env vars are set on your host (see `../BACKEND.md`): `ANTHROPIC_API_KEY`
   (server-only), `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

## Step — create your organisation + owner membership

`0002` ships the tables but (by design) the build creates no accounts. After you
have signed up through the app once (so your `auth.users` row exists), run this in
the SQL editor, replacing the email:

```sql
-- 1. Find your user id
select id, email from auth.users where email = 'you@yourfirm.com';

-- 2. Create the org (owned by you) and your active owner membership
with me as (select id from auth.users where email = 'you@yourfirm.com'),
     org as (
       insert into public.organisations (name, owner_user_id)
       select 'My Brokerage', id from me
       returning id
     )
insert into public.memberships (org_id, user_id, role, status)
select org.id, me.id, 'owner', 'active' from org, me;
```

That is all the app needs. **On your next sign-in** `wireLiveMembership()` reads this
row and **role enforcement turns on automatically** with your real role — the
Settings → Team panel switches from the demo model to live, and `can()` /
`requirePermission()` start enforcing. No code change, no redeploy.

### Add a teammate

Invite them from **Settings → Team** (or insert a `memberships` row for their
`auth.users` id with the role you want). They must have signed up once first.

## Step 4 — (optional) org-shared deal visibility

By default every user sees **only their own** deals, even within an org — this is
the safe default and remains true after steps 1–3. If you want a brokerage where
members can see each other's deals:

1. **Backfill** `org_id` on existing deals you want shared:
   ```sql
   update public.deals d
      set org_id = (select org_id from public.memberships m
                    where m.user_id = d.user_id and m.status='active' limit 1)
    where org_id is null;
   ```
   (New deals are tagged automatically once membership is wired — see
   `saveDeal()` in `index.html`.)
2. Apply `migrations/0003_deals_org_scope.sql`.
3. Review against your privacy obligations (compliance map §9) **first** — this
   changes who can read PII.

## Verify

```sql
-- RLS is on for every table
select tablename, rowsecurity from pg_tables
 where schemaname='public'
   and tablename in ('deals','organisations','memberships','invitations','auth_audit_log');

-- Your membership resolves
select * from public.memberships where user_id =
  (select id from auth.users where email='you@yourfirm.com');

-- has_org_role works for your org
select public.has_org_role(
  (select org_id from public.memberships
    where user_id=(select id from auth.users where email='you@yourfirm.com') limit 1),
  'owner');   -- expect: true
```

In the app, sign out and back in: the **Settings → Team** banner should no longer
say "turns on once applied", and your role should be shown as live.

## Rollback

Each step is independently reversible (`drop policy` / `drop table`). Dropping the
`0002` tables returns the app to per-user live mode; the app detects the missing
tables and falls back automatically (no error, no lockout).
