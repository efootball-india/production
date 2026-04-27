-- ============================================================
-- 0003 · MODERATOR ROLE + TIEBREAKER COLUMNS
-- Run AFTER 0002_player_rls.sql.
--
-- Adds:
--   1. 'moderator' to player_role enum.
--   2. matches.is_tiebreaker — flags golden-goal sudden-death matches
--      created when group standings can't be resolved by tiebreaker chain.
--   3. matches.decided_by — 'regulation' | 'extra_time' | 'penalties' |
--      'golden_goal' | 'walkover'. Optional metadata for UI badges.
-- ============================================================

-- Add 'moderator' to the player_role enum.
-- Place it between 'player' and 'admin' so role hierarchy reads naturally.
alter type player_role add value if not exists 'moderator' before 'admin';

-- Tiebreaker / decision metadata on matches.
alter table matches
  add column if not exists is_tiebreaker boolean not null default false,
  add column if not exists decided_by    text;

-- Sanity check on decided_by values when set.
alter table matches
  add constraint matches_decided_by_check
  check (
    decided_by is null or decided_by in (
      'regulation', 'extra_time', 'penalties', 'golden_goal', 'walkover'
    )
  );

-- Index for finding tiebreakers in admin UI.
create index if not exists matches_tiebreaker_idx
  on matches (tournament_id) where is_tiebreaker = true;
