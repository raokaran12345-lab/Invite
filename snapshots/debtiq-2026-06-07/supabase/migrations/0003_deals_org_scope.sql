-- ============================================================
-- DebtIQ — Optional org-scoped visibility for deals
-- Migration: 0003_deals_org_scope
-- Status:    OPT-IN — DO NOT APPLY until you have decided that members
--            of an organisation SHOULD see each other's deals. This is a
--            PII / privacy decision (compliance map §9), not a default.
--
-- Prerequisite: 0002_access_control applied AND deals backfilled with a
-- non-null org_id (see APPLY.md). Without org_id set, this policy is a
-- no-op for existing rows.
--
-- Effect: in ADDITION to the existing own-rows policy, an active member of
-- an organisation (>= readonly) may SELECT that org's deals. Writes remain
-- restricted to the owning user. Applying this CHANGES who can see which
-- deals — review against your privacy obligations before running.
--
-- To roll back: `drop policy deals_select_org on public.deals;`
-- ============================================================

-- Read access broadens to org members (own-rows policy still also applies —
-- Postgres RLS SELECT policies are OR'd together).
drop policy if exists deals_select_org on public.deals;
create policy deals_select_org on public.deals
  for select using (
    org_id is not null and public.has_org_role(org_id, 'readonly')
  );

-- Writes stay owner-only: a user may only insert/update/delete their own rows,
-- even within the org. (The base deals_insert_own / deals_update_own /
-- deals_delete_own policies from schema.sql remain in force unchanged.)

-- OPTIONAL stricter variant — restrict org-wide read to roles that may see PII
-- (e.g. broker+). If you prefer this, drop the policy above and use:
--   create policy deals_select_org on public.deals
--     for select using (org_id is not null and public.has_org_role(org_id, 'broker'));
