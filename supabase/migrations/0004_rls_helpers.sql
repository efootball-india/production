-- ============================================================
-- 0004 · RLS HELPER FUNCTIONS
-- Run AFTER 0003_moderator_role_and_tiebreaker.sql.
--
-- Defines stable, security-definer functions used by RLS policies.
-- Centralizing role checks here means policies stay short and consistent,
-- and role logic changes in one place.
-- ============================================================

-- True if the current auth user has role 'admin' or 'super_admin'.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from players
    where id = auth.uid()
      and role in ('admin', 'super_admin')
  );
$$;

-- True if the current auth user is a moderator OR admin.
-- Used for any "elevated write" — score approval, manual overrides.
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from players
    where id = auth.uid()
      and role in ('moderator', 'admin', 'super_admin')
  );
$$;

-- True if the current auth user is one of the two participants in a match.
-- Used to allow players to submit results for their own matches only.
create or replace function public.is_match_participant(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from matches m
    join tournament_participants tp_home on tp_home.id = m.home_participant_id
    join tournament_participants tp_away on tp_away.id = m.away_participant_id
    where m.id = p_match_id
      and (tp_home.player_id = auth.uid() or tp_away.player_id = auth.uid())
  );
$$;

-- Make these callable by authenticated users (and anon, harmlessly — they'll
-- always return false for unauthenticated callers since auth.uid() is null).
grant execute on function public.is_admin()                       to anon, authenticated;
grant execute on function public.is_moderator()                   to anon, authenticated;
grant execute on function public.is_match_participant(uuid)       to anon, authenticated;
