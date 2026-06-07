-- ============================================================
-- DebtIQ — Lending Group model (Part B)
-- Migration: 0001_lending_groups
-- Status:    DRAFT — REVIEW BEFORE APPLYING. Do not run live.
--
-- Introduces a three-level hierarchy on top of the existing
-- `public.deals` table:
--
--   lending_groups  (the coordinated submission)
--     └─ deals      (one or more credit applications per group)
--           ├─ facilities   (the credit products requested per deal)
--           └─ securities   (the properties supporting the deal)
--                 ↕
--           facility_securities  (many-to-many; cross-collateral is first-class)
--
-- Design notes
-- ------------
-- 1. Backwards compatible with the existing `deals.data jsonb` —
--    we ADD columns (group_id, purpose, entity_kind) rather than
--    splitting the deal blob apart. Existing rows continue to load
--    via `mkDeal(r.data)` unchanged; new model fields read from
--    the new columns, falling back to data.* when null.
--
-- 2. `facilities` and `securities` are real tables (not jsonb arrays)
--    so the front-end can ask the DB questions like "which facilities
--    are cross-collateralised across security X" without unrolling
--    every deal blob. The per-row `data jsonb` column carries the
--    long tail of UI-only state (UI toggles, provenance, etc.).
--
-- 3. RLS mirrors the existing `deals` table: every row carries
--    user_id and is scoped by `auth.uid() = user_id`. No service-
--    role bypass; the anon key + RLS continue to do the work.
--
-- 4. Cascade deletes: deleting a lending_group removes all its
--    deals; deleting a deal removes its facilities + securities;
--    deleting either side of the join clears the link.
--
-- 5. `updated_at` trigger is the same `public.touch_updated_at()`
--    already defined in schema.sql — we reuse it for every new table.
--
-- How to apply (manual)
-- ---------------------
--   Supabase SQL editor → paste this file → Run.
--   Or `supabase db push` if you're on the CLI.
--   No data migration required — existing deals continue to work
--   with group_id = NULL until the broker explicitly groups them.
-- ============================================================

-- ============================================================
-- 1. lending_groups — the coordinated submission
-- ============================================================
create table if not exists public.lending_groups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- Display + structural metadata
  name        text not null,                        -- e.g. "Mitchell Family — Q2 2026"
  kind        text not null default 'standard',     -- 'standard' | 'family' | 'business' | 'mixed'
  -- The broker's confirmation of DebtIQ's proposed split.
  -- 'proposed'  — DebtIQ has suggested a split; awaiting broker sign-off
  -- 'confirmed' — broker has accepted the current shape
  -- 'recut'     — broker has manually re-cut at least once
  proposal_status text not null default 'proposed',
  -- Free-form per-group state (totals cache, presentation prefs, etc.)
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists lending_groups_user_idx on public.lending_groups(user_id);

drop trigger if exists lending_groups_touch on public.lending_groups;
create trigger lending_groups_touch before update on public.lending_groups
  for each row execute function public.touch_updated_at();

alter table public.lending_groups enable row level security;

drop policy if exists "lending_groups_select_own" on public.lending_groups;
create policy "lending_groups_select_own" on public.lending_groups
  for select using (auth.uid() = user_id);

drop policy if exists "lending_groups_insert_own" on public.lending_groups;
create policy "lending_groups_insert_own" on public.lending_groups
  for insert with check (auth.uid() = user_id);

drop policy if exists "lending_groups_update_own" on public.lending_groups;
create policy "lending_groups_update_own" on public.lending_groups
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "lending_groups_delete_own" on public.lending_groups;
create policy "lending_groups_delete_own" on public.lending_groups
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 2. deals — extend the existing table with model fields
-- ============================================================
-- The existing PK is (user_id, id) where `id` is the broker-visible
-- D-NNN string. We keep that. Adding columns is additive and safe.
alter table public.deals
  add column if not exists group_id    uuid references public.lending_groups(id) on delete set null,
  add column if not exists purpose     text,
  add column if not exists entity_kind text;

create index if not exists deals_group_idx on public.deals(group_id);

-- ============================================================
-- 3. facilities — the credit products requested per deal
-- ============================================================
create table if not exists public.facilities (
  id           uuid primary key default gen_random_uuid(),
  -- Composite FK back into the existing deals PK
  deal_id      text not null,
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- Lender + product
  lender       text,                              -- e.g. 'CBA' (mirrors deals.data.lender)
  product      text not null default 'pi',        -- 'pi' | 'io' | 'split' | 'line_of_credit'
  amount       numeric not null default 0,        -- loan amount in deal currency
  rate         numeric not null default 0,        -- contract interest rate
  term_years   integer not null default 30,
  repayment    text not null default 'monthly',   -- 'weekly' | 'fortnightly' | 'monthly'
  io_years     integer,                            -- nullable; only set when product='io' or 'split'
  -- Free-form facility state (label, notes, UI toggles, _prov)
  data         jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- Compose-key FK so RLS-scoped queries stay valid
  constraint facilities_deal_fk
    foreign key (user_id, deal_id) references public.deals(user_id, id) on delete cascade
);

create index if not exists facilities_deal_idx on public.facilities(user_id, deal_id);
create index if not exists facilities_user_idx on public.facilities(user_id);

drop trigger if exists facilities_touch on public.facilities;
create trigger facilities_touch before update on public.facilities
  for each row execute function public.touch_updated_at();

alter table public.facilities enable row level security;

drop policy if exists "facilities_select_own" on public.facilities;
create policy "facilities_select_own" on public.facilities
  for select using (auth.uid() = user_id);

drop policy if exists "facilities_insert_own" on public.facilities;
create policy "facilities_insert_own" on public.facilities
  for insert with check (auth.uid() = user_id);

drop policy if exists "facilities_update_own" on public.facilities;
create policy "facilities_update_own" on public.facilities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "facilities_delete_own" on public.facilities;
create policy "facilities_delete_own" on public.facilities
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 4. securities — the properties supporting the deal
-- ============================================================
create table if not exists public.securities (
  id              uuid primary key default gen_random_uuid(),
  deal_id         text not null,
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- AU property address (typed columns — easier to query/sort than jsonb)
  address         text,
  suburb          text,
  state           text,                          -- 'NSW' | 'VIC' | …
  postcode        text,
  property_type   text,                          -- 'House' | 'Unit' | 'Land' | …
  purpose         text,                          -- 'Owner Occupied' | 'Investment'
  transaction     text,                          -- 'Purchase' | 'Refinance' | 'Owned (additional security)'
  value           numeric not null default 0,
  value_basis     text,                          -- 'Contract' | 'Certified valuation' | 'Estimate'
  existing_mortgage numeric not null default 0,
  rental_income   numeric not null default 0,
  rental_freq     text,                          -- 'weekly' | 'fortnightly' | 'monthly' | 'annual'
  owner_entity_id text,                          -- references in-deal entity by client id (e.g. 'e_1')
  -- Long tail (title details, zoning, _prov, UI toggles)
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint securities_deal_fk
    foreign key (user_id, deal_id) references public.deals(user_id, id) on delete cascade
);

create index if not exists securities_deal_idx on public.securities(user_id, deal_id);
create index if not exists securities_user_idx on public.securities(user_id);

drop trigger if exists securities_touch on public.securities;
create trigger securities_touch before update on public.securities
  for each row execute function public.touch_updated_at();

alter table public.securities enable row level security;

drop policy if exists "securities_select_own" on public.securities;
create policy "securities_select_own" on public.securities
  for select using (auth.uid() = user_id);

drop policy if exists "securities_insert_own" on public.securities;
create policy "securities_insert_own" on public.securities
  for insert with check (auth.uid() = user_id);

drop policy if exists "securities_update_own" on public.securities;
create policy "securities_update_own" on public.securities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "securities_delete_own" on public.securities;
create policy "securities_delete_own" on public.securities
  for delete using (auth.uid() = user_id);

-- ============================================================
-- 5. facility_securities — the many-to-many join
--    Cross-collateralisation is first-class: one facility may
--    appear here against many securities, and one security may
--    appear here against many facilities.
-- ============================================================
create table if not exists public.facility_securities (
  facility_id     uuid not null references public.facilities(id) on delete cascade,
  security_id     uuid not null references public.securities(id)  on delete cascade,
  user_id         uuid not null references auth.users(id)          on delete cascade,
  -- The broker's intent for THIS pairing
  priority        integer not null default 1,        -- 1 = primary, 2+ = additional security
  allocation_pct  numeric,                            -- nullable; only used when broker apportions
  -- Free-form (e.g. legal charge type)
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  primary key (facility_id, security_id)
);

create index if not exists facility_securities_facility_idx on public.facility_securities(facility_id);
create index if not exists facility_securities_security_idx on public.facility_securities(security_id);
create index if not exists facility_securities_user_idx     on public.facility_securities(user_id);

alter table public.facility_securities enable row level security;

drop policy if exists "facility_securities_select_own" on public.facility_securities;
create policy "facility_securities_select_own" on public.facility_securities
  for select using (auth.uid() = user_id);

drop policy if exists "facility_securities_insert_own" on public.facility_securities;
create policy "facility_securities_insert_own" on public.facility_securities
  for insert with check (auth.uid() = user_id);

drop policy if exists "facility_securities_update_own" on public.facility_securities;
create policy "facility_securities_update_own" on public.facility_securities
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "facility_securities_delete_own" on public.facility_securities;
create policy "facility_securities_delete_own" on public.facility_securities
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Done. Existing deals work unchanged; new groups/facilities/
-- securities populate as the broker uses the new UI.
-- ============================================================
