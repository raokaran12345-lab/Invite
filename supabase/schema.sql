-- ============================================================
-- DebtIQ — Supabase schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- Each broker sees ONLY their own deals via row-level security.
-- ============================================================

create table if not exists public.deals (
  id          text not null,
  user_id     uuid not null references auth.users(id) on delete cascade,
  data        jsonb not null,                 -- full deal object from the app
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists deals_user_idx on public.deals(user_id);

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists deals_touch on public.deals;
create trigger deals_touch before update on public.deals
  for each row execute function public.touch_updated_at();

-- Row-level security: a user may only read/write their own rows.
alter table public.deals enable row level security;

drop policy if exists "deals_select_own" on public.deals;
create policy "deals_select_own" on public.deals
  for select using (auth.uid() = user_id);

drop policy if exists "deals_insert_own" on public.deals;
create policy "deals_insert_own" on public.deals
  for insert with check (auth.uid() = user_id);

drop policy if exists "deals_update_own" on public.deals;
create policy "deals_update_own" on public.deals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "deals_delete_own" on public.deals;
create policy "deals_delete_own" on public.deals
  for delete using (auth.uid() = user_id);
