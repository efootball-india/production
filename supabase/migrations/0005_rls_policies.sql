-- ============================================================
-- 0005 · RLS POLICIES — TOURNAMENTS, PARTICIPANTS, STAGES, GROUPS, MATCHES
-- Run AFTER 0004_rls_helpers.sql.
--
-- Reading model: most things are publicly readable. eFTBL is a community
-- platform — tournaments, brackets, standings, and player rosters are all
-- public information. Privacy-sensitive fields (email, etc) are not in
-- these tables; they live in auth.users.
--
-- Writing model:
--   - Admin: anything (create tournaments, run draws, override scores)
--   - Moderator: approve/override match results; cannot create tournaments
--   - Player: register self; submit results for own matches; withdraw self
-- ============================================================


-- ============================================================
-- Update existing players policies to include moderators where appropriate
-- ============================================================

drop policy if exists "admins can update any player" on players;

-- Moderators and admins can update any player row (for moderation).
create policy "mods and admins can update any player"
  on players for update
  to authenticated
  using (public.is_moderator());


-- ============================================================
-- TOURNAMENTS
-- ============================================================

alter table tournaments enable row level security;

create policy "tournaments are publicly readable"
  on tournaments for select
  to anon, authenticated
  using (true);

create policy "admins can insert tournaments"
  on tournaments for insert
  to authenticated
  with check (public.is_admin());

create policy "admins can update tournaments"
  on tournaments for update
  to authenticated
  using (public.is_admin());

create policy "admins can delete tournaments"
  on tournaments for delete
  to authenticated
  using (public.is_admin());


-- ============================================================
-- TOURNAMENT PARTICIPANTS
-- ============================================================

alter table tournament_participants enable row level security;

create policy "participants are publicly readable"
  on tournament_participants for select
  to anon, authenticated
  using (true);

-- Players can register themselves. App layer enforces capacity + window.
create policy "users can register themselves"
  on tournament_participants for insert
  to authenticated
  with check (player_id = auth.uid());

-- Players can self-withdraw if their status is still 'registered'.
-- After they've been seeded into a group/bracket, only mods can change status.
create policy "users can withdraw themselves"
  on tournament_participants for update
  to authenticated
  using (player_id = auth.uid() and status = 'registered')
  with check (player_id = auth.uid());

create policy "mods and admins can update any participant"
  on tournament_participants for update
  to authenticated
  using (public.is_moderator());

create policy "admins can delete participants"
  on tournament_participants for delete
  to authenticated
  using (public.is_admin());


-- ============================================================
-- STAGES
-- ============================================================

alter table stages enable row level security;

create policy "stages are publicly readable"
  on stages for select
  to anon, authenticated
  using (true);

create policy "admins can write stages"
  on stages for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
-- GROUPS + GROUP MEMBERS
-- ============================================================

alter table groups enable row level security;

create policy "groups are publicly readable"
  on groups for select
  to anon, authenticated
  using (true);

create policy "admins can write groups"
  on groups for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

alter table group_members enable row level security;

create policy "group_members are publicly readable"
  on group_members for select
  to anon, authenticated
  using (true);

create policy "admins can write group_members"
  on group_members for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
-- MATCHES
-- ============================================================

alter table matches enable row level security;

create policy "matches are publicly readable"
  on matches for select
  to anon, authenticated
  using (true);

create policy "admins can insert matches"
  on matches for insert
  to authenticated
  with check (public.is_admin());

-- Match writes use a tiered policy:
--   - Players can update matches they're a participant in.
--     (App layer enforces which columns: scores, ET/penalty flags only.)
--   - Mods/admins can update any match.
create policy "participants can update own matches"
  on matches for update
  to authenticated
  using (public.is_match_participant(id));

create policy "mods and admins can update any match"
  on matches for update
  to authenticated
  using (public.is_moderator());

create policy "admins can delete matches"
  on matches for delete
  to authenticated
  using (public.is_admin());


-- ============================================================
-- MATCH FEEDERS
-- ============================================================

alter table match_feeders enable row level security;

create policy "match_feeders are publicly readable"
  on match_feeders for select
  to anon, authenticated
  using (true);

create policy "admins can write match_feeders"
  on match_feeders for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());


-- ============================================================
-- DEFER: match_disputes, news_posts, seasons, player_ratings,
-- rating_history — not used in v1. RLS not enabled on those yet;
-- they're inaccessible without service role until we get there.
-- ============================================================
