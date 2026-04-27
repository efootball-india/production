/**
 * Domain types for the eFootball Community Platform.
 *
 * These mirror the Postgres schema in `supabase/migrations/0001_initial_schema.sql`.
 * Once Supabase is wired up, run `npx supabase gen types typescript ...` to generate
 * row-level types automatically; these hand-written types stay as the *domain* layer
 * the app code uses (which sometimes diverges from raw row shapes — e.g. for
 * computed fields or relation expansions).
 */

// ============================================================
// Enums
// ============================================================

export type PlayerRole = 'player' | 'admin' | 'super_admin';

export type Platform =
  | 'ps5' | 'ps4'
  | 'xbox_series' | 'xbox_one'
  | 'pc_steam' | 'pc_epic'
  | 'mobile_ios' | 'mobile_android';

export type TournamentFormat =
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'groups_knockout'
  | 'swiss'
  | 'free_for_all';

export type TournamentStatus =
  | 'draft'
  | 'registration_open'
  | 'registration_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type ParticipantStatus =
  | 'registered'
  | 'checked_in'
  | 'withdrawn'
  | 'eliminated'
  | 'advanced'
  | 'winner';

export type StageType =
  | 'groups'
  | 'single_elimination'
  | 'double_elimination'
  | 'round_robin'
  | 'swiss';

export type MatchStatus =
  | 'pending'
  | 'scheduled'
  | 'awaiting_result'
  | 'awaiting_confirmation'
  | 'disputed'
  | 'completed'
  | 'walkover';

export type MatchBracketSide = 'winners' | 'losers' | 'final';

export type FeederRole = 'winner' | 'loser';

export type FeederSlot = 'home' | 'away';

export type NewsStatus = 'draft' | 'published';

export type DisputeStatus = 'open' | 'resolved' | 'dismissed';


// ============================================================
// Entities
// ============================================================

export interface Player {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  platform: Platform | null;
  region: string | null;
  timezone: string | null;
  gameId: string | null;
  discordHandle: string | null;
  role: PlayerRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Format-specific tournament settings. Stored as jsonb in Postgres.
 * Each format engine defines which keys it expects.
 */
export interface TournamentSettings {
  // Match rules
  matchLengthMinutes?: number;       // e.g. 6, 10, 15 min halves
  difficulty?: 'beginner' | 'regular' | 'professional' | 'world_class' | 'superstar' | 'legendary';
  weather?: 'clear' | 'rain' | 'snow' | 'random';

  // Squad rules
  legendsAllowed?: boolean;
  maxOverallRating?: number;
  squadRestriction?: string;         // free-text e.g. "Premier League only"

  // Knockout rules
  twoLeggedTies?: boolean;           // home + away aggregate
  extraTimeOnDraw?: boolean;
  penaltiesOnDraw?: boolean;

  // Group-stage rules (when format = groups_knockout)
  groupSize?: number;                // e.g. 4
  groupCount?: number;               // e.g. 12 for WC 2026
  qualifiersPerGroup?: number;       // top N advance
  bestThirdsAdvance?: number;        // additional best-third qualifiers (e.g. 8 for WC 2026)
  pointsForWin?: number;             // default 3
  pointsForDraw?: number;            // default 1
  pointsForLoss?: number;            // default 0
  tiebreakerOrder?: ('points' | 'gd' | 'gf' | 'h2h' | 'fairplay' | 'random')[];

  // Seeding
  seedingMethod?: 'manual' | 'random' | 'rating' | 'registration_order';

  // Reporting
  reportingDeadlineHours?: number;   // hours after match window opens
  evidenceRequired?: boolean;

  // Free-form
  notes?: string;

  // Allow extension without breaking older settings
  [key: string]: unknown;
}

export interface Tournament {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  format: TournamentFormat;
  status: TournamentStatus;
  maxParticipants: number | null;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  settings: TournamentSettings;
  winnerId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  playerId: string;
  seed: number | null;
  status: ParticipantStatus;
  finalPosition: number | null;
  registeredAt: string;
}

export interface Stage {
  id: string;
  tournamentId: string;
  stageNumber: number;
  stageType: StageType;
  status: TournamentStatus;
  settings: Record<string, unknown>;
  createdAt: string;
}

export interface Group {
  id: string;
  stageId: string;
  name: string;
  position: number;
}

export interface GroupMember {
  id: string;
  groupId: string;
  participantId: string;
  positionInGroup: number | null;
}

export interface Match {
  id: string;
  tournamentId: string;
  stageId: string | null;
  groupId: string | null;

  round: number;
  matchNumberInRound: number;
  bracketSide: MatchBracketSide | null;

  homeParticipantId: string | null;
  awayParticipantId: string | null;

  status: MatchStatus;
  scheduledAt: string | null;
  deadlineAt: string | null;

  homeScore: number | null;
  awayScore: number | null;
  wentToExtraTime: boolean;
  wentToPenalties: boolean;
  homePenScore: number | null;
  awayPenScore: number | null;
  winnerParticipantId: string | null;

  reportedBy: string | null;
  reportedAt: string | null;
  confirmedBy: string | null;
  confirmedAt: string | null;
  evidenceUrls: string[];
  notes: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface MatchFeeder {
  id: string;
  targetMatchId: string;
  targetSlot: FeederSlot;
  sourceMatchId: string;
  sourceRole: FeederRole;
}

/**
 * The eFootball-specific shape of a recorded match outcome.
 * Used as input to the format engine when a match completes.
 */
export interface MatchResult {
  homeScore: number;
  awayScore: number;
  wentToExtraTime: boolean;
  wentToPenalties: boolean;
  homePenScore?: number;
  awayPenScore?: number;
  // Computed: home/away/draw. Draws only valid in group stage and round-robin.
  outcome: 'home_win' | 'away_win' | 'draw';
}

export interface MatchDispute {
  id: string;
  matchId: string;
  raisedBy: string;
  reason: string;
  evidenceUrls: string[];
  status: DisputeStatus;
  resolutionNotes: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface NewsPost {
  id: string;
  slug: string;
  title: string;
  content: string;
  coverImageUrl: string | null;
  status: NewsStatus;
  publishedAt: string | null;
  tournamentId: string | null;
  authorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Season {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface PlayerRating {
  id: string;
  playerId: string;
  seasonId: string | null;
  rating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  lastMatchAt: string | null;
  updatedAt: string;
}
