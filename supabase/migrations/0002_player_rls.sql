-- ============================================================
-- 0002 · RLS POLICIES FOR PLAYERS
-- Run AFTER 0001_initial_schema.sql.
-- Enables Row-Level Security and grants read/write to authenticated users.
-- ============================================================

-- Enable RLS on players
alter table players enable row level security;

-- Anyone (incl. anonymous) can read player profiles.
-- This is intentional: usernames, ratings, and basic profile info are public.
-- We never select email or sensitive fields client-side.
create policy "players are publicly readable"
  on players for select
  to anon, authenticated
  using (true);

-- A user can insert their own player row (during onboarding)
create policy "users can create their own player row"
  on players for insert
  to authenticated
  with check (auth.uid() = id);

-- A user can update their own player row
create policy "users can update their own player row"
  on players for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can update any player row (for moderation)
create policy "admins can update any player"
  on players for update
  to authenticated
  using (
    exists (
      select 1 from players p
      where p.id = auth.uid() and p.role in ('admin', 'super_admin')
    )
  );

-- Note: We do NOT allow players to delete themselves via RLS.
-- Account deletion goes through a server action with service_role key.
