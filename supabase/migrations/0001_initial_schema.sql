-- ============================================================
-- eFootball Community Platform — Initial Schema
-- Migration: 0001_initial_schema
--
-- Design principles:
--   1. Match data is bracket-agnostic. Prerequisites are edges in
--      `match_feeders` rather than coordinates in a fixed bracket grid.
--   2. Two-stage tournaments (e.g. groups → KO) use the `stages` table.
--      Single-stage tournaments have exactly one stage row.
--   3. Tournament-format-specific configuration goes in a `settings` jsonb
--      column rather than per-format columns. The format engine layer
--      interprets it.
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

create type player_role as enum ('player', 'admin', 'super_admin');

create type platform as enum (
  'ps5', 'ps4',
  'xbox_series', 'xbox_one',
  'pc_steam', 'pc_epic',
  'mobile_ios', 'mobile_android'
);

create type tournament_format as enum (
  'single_elimination',
  'double_elimination',
  'round_robin',
  'groups_knockout',     -- FIFA WC style
  'swiss',
  'free_for_all'
);

create type tournament_status as enum (
  'draft',
  'registration_open',
  'registration_closed',
  'in_progress',
  'completed',
  'cancelled'
);

create type participant_status as enum (
  'registered',
  'checked_in',
  'withdrawn',
  'eliminated',
  'advanced',
  'winner'
);

create type stage_type as enum (
  'groups',
  'single_elimination',
  'double_elimination',
  'round_robin',
  'swiss'
);

create type match_status as enum (
  'pending',                 -- waiting on prerequisite matches to determine participants
  'scheduled',               -- both participants known, scheduled
  'awaiting_result',         -- match window open, no result yet
  'awaiting_confirmation',   -- one side reported, other hasn't confirmed
  'disputed',                -- conflicting reports
  'completed',               -- result final
  'walkover'                 -- one side didn't show up
);

create type match_bracket_side as enum ('winners', 'losers', 'final');

create type feeder_role as enum ('winner', 'loser');

create type feeder_slot as enum ('home', 'away');

create type news_status as enum ('draft', 'published');

create type dispute_status as enum ('open', 'resolved', 'dismissed');


-- ============================================================
-- PLAYERS — extends Supabase auth.users
-- ============================================================

create table players (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique not null check (length(username) between 3 and 24),
  display_name    text not null,
  avatar_url      text,
  bio             text,
  platform        platform,
  region          text,                -- ISO country code or region label
  timezone        text,                -- IANA timezone (e.g. 'Asia/Kolkata')
  game_id         text,                -- in-game friend code
  discord_handle  text,
  role            player_role not null default 'player',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index players_username_idx on players (lower(username));
create index players_role_idx on players (role) where role <> 'player';


-- ============================================================
-- TOURNAMENTS
-- ============================================================

create table tournaments (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text unique not null,
  name                     text not null,
  description              text,
  banner_url               text,
  format                   tournament_format not null,
  status                   tournament_status not null default 'draft',
  max_participants         integer,

  -- Lifecycle dates
  registration_opens_at    timestamptz,
  registration_closes_at   timestamptz,
  starts_at                timestamptz,
  ends_at                  timestamptz,

  -- Format-specific settings (match length, difficulty, squad rules,
  -- two-leg config, ET/penalties rules, group size, KO seeding policy, etc.)
  settings                 jsonb not null default '{}'::jsonb,

  -- Outcome
  winner_id                uuid references players(id) on delete set null,

  -- Audit
  created_by               uuid not null references players(id),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create index tournaments_status_idx on tournaments (status);
create index tournaments_starts_at_idx on tournaments (starts_at desc);
create index tournaments_format_idx on tournaments (format);


-- ============================================================
-- TOURNAMENT PARTICIPANTS
-- ============================================================

create table tournament_participants (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references tournaments(id) on delete cascade,
  player_id       uuid not null references players(id) on delete cascade,
  seed            integer,
  status          participant_status not null default 'registered',
  final_position  integer,
  registered_at   timestamptz not null default now(),
  unique (tournament_id, player_id)
);

create index tp_tournament_idx on tournament_participants (tournament_id);
create index tp_player_idx on tournament_participants (player_id);


-- ============================================================
-- STAGES — for multi-stage tournaments (e.g. groups → KO)
-- Single-stage tournaments still get exactly one stage row, for uniformity.
-- ============================================================

create table stages (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references tournaments(id) on delete cascade,
  stage_number    integer not null,
  stage_type      stage_type not null,
  status          tournament_status not null default 'draft',
  settings        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (tournament_id, stage_number)
);

create index stages_tournament_idx on stages (tournament_id);


-- ============================================================
-- GROUPS — only for stages of type 'groups'
-- ============================================================

create table groups (
  id          uuid primary key default gen_random_uuid(),
  stage_id    uuid not null references stages(id) on delete cascade,
  name        text not null,           -- e.g. "Group A"
  position    integer not null,        -- 1..N for ordering
  unique (stage_id, position)
);

create table group_members (
  id                 uuid primary key default gen_random_uuid(),
  group_id           uuid not null references groups(id) on delete cascade,
  participant_id     uuid not null references tournament_participants(id) on delete cascade,
  position_in_group  integer,          -- final standing within group, populated after group stage
  unique (group_id, participant_id)
);

create index group_members_group_idx on group_members (group_id);


-- ============================================================
-- MATCHES — bracket-agnostic node table
-- ============================================================

create table matches (
  id                       uuid primary key default gen_random_uuid(),
  tournament_id            uuid not null references tournaments(id) on delete cascade,
  stage_id                 uuid references stages(id) on delete cascade,
  group_id                 uuid references groups(id) on delete cascade,

  -- Round / positioning
  round                    integer not null,              -- group: matchday; KO: round depth
  match_number_in_round    integer not null,
  bracket_side             match_bracket_side,            -- 'winners' / 'losers' for double elim

  -- Participants (nullable until determined by prerequisite matches)
  home_participant_id      uuid references tournament_participants(id) on delete set null,
  away_participant_id      uuid references tournament_participants(id) on delete set null,

  -- Match state
  status                   match_status not null default 'pending',
  scheduled_at             timestamptz,
  deadline_at              timestamptz,

  -- Score (eFootball: home goals / away goals, optional ET, optional penalties)
  home_score               integer,
  away_score               integer,
  went_to_extra_time       boolean not null default false,
  went_to_penalties        boolean not null default false,
  home_pen_score           integer,
  away_pen_score           integer,
  winner_participant_id    uuid references tournament_participants(id) on delete set null,

  -- Reporting / verification
  reported_by              uuid references players(id) on delete set null,
  reported_at              timestamptz,
  confirmed_by             uuid references players(id) on delete set null,
  confirmed_at             timestamptz,
  evidence_urls            text[] not null default array[]::text[],
  notes                    text,

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- Sanity constraints
  check (home_score is null or home_score >= 0),
  check (away_score is null or away_score >= 0),
  check (home_pen_score is null or home_pen_score >= 0),
  check (away_pen_score is null or away_pen_score >= 0),
  -- Penalties only valid if the match went to extra time first
  check (
    (went_to_penalties = false) or (went_to_extra_time = true)
  )
);

create index matches_tournament_idx on matches (tournament_id);
create index matches_stage_idx on matches (stage_id);
create index matches_group_idx on matches (group_id);
create index matches_status_idx on matches (status);
create index matches_round_idx on matches (tournament_id, round, match_number_in_round);
create index matches_home_idx on matches (home_participant_id) where home_participant_id is not null;
create index matches_away_idx on matches (away_participant_id) where away_participant_id is not null;


-- ============================================================
-- MATCH FEEDERS — bracket prerequisites
-- "Winner (or loser) of source_match_id becomes the home/away slot of target_match_id"
-- This is the *only* coupling between matches; with it, the schema models any bracket.
-- ============================================================

create table match_feeders (
  id                uuid primary key default gen_random_uuid(),
  target_match_id   uuid not null references matches(id) on delete cascade,
  target_slot       feeder_slot not null,
  source_match_id   uuid not null references matches(id) on delete cascade,
  source_role       feeder_role not null,
  unique (target_match_id, target_slot)
);

create index match_feeders_source_idx on match_feeders (source_match_id);


-- ============================================================
-- MATCH DISPUTES
-- ============================================================

create table match_disputes (
  id                 uuid primary key default gen_random_uuid(),
  match_id           uuid not null references matches(id) on delete cascade,
  raised_by          uuid not null references players(id) on delete cascade,
  reason             text not null,
  evidence_urls      text[] not null default array[]::text[],
  status             dispute_status not null default 'open',
  resolution_notes   text,
  resolved_by        uuid references players(id) on delete set null,
  resolved_at        timestamptz,
  created_at         timestamptz not null default now()
);

create index disputes_match_idx on match_disputes (match_id);
create index disputes_status_idx on match_disputes (status);


-- ============================================================
-- NEWS
-- ============================================================

create table news_posts (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique not null,
  title             text not null,
  content           text not null,                 -- markdown
  cover_image_url   text,
  status            news_status not null default 'draft',
  published_at      timestamptz,
  tournament_id     uuid references tournaments(id) on delete set null,  -- optional link
  author_id         uuid not null references players(id) on delete restrict,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index news_status_published_idx on news_posts (status, published_at desc);


-- ============================================================
-- RATINGS — placeholder (Phase 4)
-- Schema is ready; computation logic comes once consistency rules are defined.
-- ============================================================

create table seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  is_active   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- One row per (player, season). Season null = all-time.
create table player_ratings (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null references players(id) on delete cascade,
  season_id       uuid references seasons(id) on delete cascade,
  rating          numeric not null default 1500,
  matches_played  integer not null default 0,
  wins            integer not null default 0,
  losses          integer not null default 0,
  draws           integer not null default 0,
  goals_for       integer not null default 0,
  goals_against   integer not null default 0,
  last_match_at   timestamptz,
  updated_at      timestamptz not null default now(),
  unique (player_id, season_id)
);

create index ratings_season_rating_idx on player_ratings (season_id, rating desc);

create table rating_history (
  id              uuid primary key default gen_random_uuid(),
  player_id       uuid not null references players(id) on delete cascade,
  match_id        uuid references matches(id) on delete set null,
  season_id       uuid references seasons(id) on delete cascade,
  rating_before   numeric not null,
  rating_after    numeric not null,
  reason          text not null,                  -- 'match' | 'decay' | 'adjustment' | 'season_reset'
  created_at      timestamptz not null default now()
);

create index rating_history_player_idx on rating_history (player_id, created_at desc);


-- ============================================================
-- TRIGGERS — keep updated_at fresh
-- ============================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger players_updated_at      before update on players      for each row execute function set_updated_at();
create trigger tournaments_updated_at  before update on tournaments  for each row execute function set_updated_at();
create trigger matches_updated_at      before update on matches      for each row execute function set_updated_at();
create trigger news_updated_at         before update on news_posts   for each row execute function set_updated_at();
