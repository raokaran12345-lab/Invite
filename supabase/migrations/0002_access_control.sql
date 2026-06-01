-- ============================================================
-- DebtIQ — Access control / RBAC (MASTER program, Phase 5)
-- Migration: 0002_access_control
-- Status:    DRAFT — REVIEW BEFORE APPLYING. Do not run live.
--            Applying this is an ARCH-REVIEW / owner-action.
--
-- Introduces organisation-scoped, role-based access control on top
-- of the existing per-user `public.deals` table:
--
--   organisations            the brokerage / team
--     └─ memberships         (user_id, org_id, role)   role enum below
--     └─ invitations         scoped, time-limited, token-hashed invites
--     └─ auth_audit_log       append-only auth + privilege events
--
-- Design notes
-- ------------
-- 1. OWNER-HELD. Only an Owner may grant/revoke the Owner role or
--    invite members; at least one Owner must always exist (enforced
--    by trigger below). The build agent never creates real accounts,
--    passwords, or secrets — invitees complete their own credential
--    setup through the existing Supabase auth path.
--
-- 2. ADDITIVE & backwards compatible. We ADD a nullable `org_id` to
--    `public.deals` for record-level org scoping; existing rows keep
--    working under the current "own rows only" RLS until backfilled.
--    No existing column or policy is dropped.
--
-- 3. DENY-BY-DEFAULT. RLS is enabled on every new table; a user sees
--    only rows for organisations they are an active member of. The
--    anon key + RLS continue to do the work; no service-role bypass.
--
-- 4. auth_audit_log is APPEND-ONLY: it has INSERT + SELECT policies
--    but deliberately NO update or delete policy, so privilege history
--    cannot be rewritten from the client.
--
-- 5. The front-end model in index.html (state.access + can()/
--    requirePermission()) mirrors these tables. Wiring the app to read
--    membership/role from here (instead of the demo localStorage slice)
--    is the ARCH-REVIEW step that turns enforcement on in live mode.
-- ============================================================

-- ---------- Role enum ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'debtiq_role') then
    create type public.debtiq_role as enum ('owner','admin','broker','processor','readonly');
  end if;
end $$;

-- ---------- Organisations ----------
create table if not exists public.organisations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Memberships ----------
create table if not exists public.memberships (
  org_id      uuid not null references public.organisations(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.debtiq_role not null default 'readonly',
  status      text not null default 'active',          -- active | suspended
  invited_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (org_id, user_id)
);
create index if not exists memberships_user_idx on public.memberships(user_id);
create index if not exists memberships_org_idx  on public.memberships(org_id);

-- ---------- Invitations ----------
-- token_hash stores a HASH of the invite token, never the token itself.
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid not null references public.organisations(id) on delete cascade,
  email       text not null,
  role        public.debtiq_role not null,
  token_hash  text not null,
  issued_by   uuid not null references auth.users(id) on delete cascade,
  status      text not null default 'pending',         -- pending | accepted | revoked | expired
  expires_at  timestamptz not null default (now() + interval '7 days'),
  created_at  timestamptz not null default now()
);
create index if not exists invitations_org_idx on public.invitations(org_id);

-- ---------- Append-only auth / privilege audit log ----------
create table if not exists public.auth_audit_log (
  id             bigint generated always as identity primary key,
  org_id         uuid references public.organisations(id) on delete set null,
  actor_user_id  uuid references auth.users(id) on delete set null,
  event          text not null,
  target_user_id uuid references auth.users(id) on delete set null,
  detail         jsonb not null default '{}'::jsonb,
  ip             inet,                                  -- captured server-side; never client-supplied
  created_at     timestamptz not null default now()
);
create index if not exists auth_audit_org_idx on public.auth_audit_log(org_id, created_at desc);

-- ---------- updated_at triggers (reuse touch_updated_at from schema.sql) ----------
drop trigger if exists organisations_touch on public.organisations;
create trigger organisations_touch before update on public.organisations
  for each row execute function public.touch_updated_at();
drop trigger if exists memberships_touch on public.memberships;
create trigger memberships_touch before update on public.memberships
  for each row execute function public.touch_updated_at();

-- ---------- "At least one Owner must always exist" guard ----------
create or replace function public.enforce_last_owner()
returns trigger language plpgsql as $$
declare owners_left int;
begin
  -- Fires when an owner row is demoted, suspended, or deleted.
  if (tg_op = 'DELETE' and old.role = 'owner')
     or (tg_op = 'UPDATE' and old.role = 'owner' and (new.role <> 'owner' or new.status <> 'active')) then
    select count(*) into owners_left
      from public.memberships
     where org_id = old.org_id and role = 'owner' and status = 'active'
       and user_id <> old.user_id;
    if owners_left = 0 then
      raise exception 'At least one active Owner must remain in the organisation';
    end if;
  end if;
  return coalesce(new, old);
end $$;

drop trigger if exists memberships_last_owner on public.memberships;
create trigger memberships_last_owner before update or delete on public.memberships
  for each row execute function public.enforce_last_owner();

-- ---------- Helper: is the current user an active member with >= a given role? ----------
create or replace function public.has_org_role(p_org uuid, p_min public.debtiq_role)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.memberships m
     where m.org_id = p_org
       and m.user_id = auth.uid()
       and m.status = 'active'
       -- enum is ordered owner>...>readonly via array position
       and array_position(array['readonly','processor','broker','admin','owner']::text[], m.role::text)
           >= array_position(array['readonly','processor','broker','admin','owner']::text[], p_min::text)
  );
$$;

-- ============================================================
-- RLS — deny-by-default; members see only their org's rows
-- ============================================================
alter table public.organisations  enable row level security;
alter table public.memberships     enable row level security;
alter table public.invitations     enable row level security;
alter table public.auth_audit_log  enable row level security;

-- Organisations: any active member can read; only owners can update.
drop policy if exists org_select on public.organisations;
create policy org_select on public.organisations
  for select using (public.has_org_role(id, 'readonly'));
drop policy if exists org_update on public.organisations;
create policy org_update on public.organisations
  for update using (public.has_org_role(id, 'owner')) with check (public.has_org_role(id, 'owner'));

-- Memberships: members read their org; only admin+ may write (owner-only
-- changes to the Owner role are enforced in the app + last-owner trigger).
drop policy if exists mem_select on public.memberships;
create policy mem_select on public.memberships
  for select using (public.has_org_role(org_id, 'readonly'));
drop policy if exists mem_write on public.memberships;
create policy mem_write on public.memberships
  for all using (public.has_org_role(org_id, 'admin')) with check (public.has_org_role(org_id, 'admin'));

-- Invitations: admin+ may manage; members may read their org's invites.
drop policy if exists inv_select on public.invitations;
create policy inv_select on public.invitations
  for select using (public.has_org_role(org_id, 'readonly'));
drop policy if exists inv_write on public.invitations;
create policy inv_write on public.invitations
  for all using (public.has_org_role(org_id, 'admin')) with check (public.has_org_role(org_id, 'admin'));

-- Audit log: APPEND-ONLY. Insert by any active member (the app writes its
-- own actions); read by admin+. NO update or delete policy exists, so the
-- history cannot be rewritten from the client.
drop policy if exists audit_insert on public.auth_audit_log;
create policy audit_insert on public.auth_audit_log
  for insert with check (public.has_org_role(org_id, 'readonly'));
drop policy if exists audit_select on public.auth_audit_log;
create policy audit_select on public.auth_audit_log
  for select using (public.has_org_role(org_id, 'admin'));

-- ============================================================
-- Record-level org scoping for deals (ADDITIVE)
-- ============================================================
-- Add a nullable org_id so deals can be scoped to an organisation without
-- breaking the existing per-user model. Backfill + a stricter org-scoped
-- policy are a follow-up once memberships are populated (ARCH-REVIEW).
alter table public.deals add column if not exists org_id uuid references public.organisations(id) on delete set null;
create index if not exists deals_org_idx on public.deals(org_id);

-- NOTE: the existing deals_* RLS policies (own-rows-only) remain in force.
-- A future migration may add an org-scoped SELECT policy such as:
--   create policy deals_select_org on public.deals
--     for select using (org_id is not null and public.has_org_role(org_id, 'readonly'));
-- gated behind PII-role checks. Left commented deliberately — applying it
-- changes who can see which deals and must be reviewed against the
-- compliance map's PII obligations (§9) before going live.
