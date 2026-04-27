/**
 * FormatEngine — the pluggable interface every tournament format implements.
 *
 * Engines are PURE. They consume current state, return a plan describing what
 * should change. The orchestrator (DB layer) is responsible for persisting
 * the plan inside a transaction. This keeps engines testable in isolation and
 * lets us replay tournaments deterministically.
 *
 * Adding a new format = implementing this interface and registering it in
 * `./index.ts`. No changes needed to the UI, score-reporting, or ranking system.
 */

import type {
  Group,
  GroupMember,
  Match,
  MatchFeeder,
  MatchResult,
  MatchStatus,
  ParticipantStatus,
  Stage,
  Tournament,
  TournamentFormat,
  TournamentParticipant,
  TournamentSettings,
} from '../types';


// ============================================================
// Engine input: full snapshot of tournament state
// ============================================================

export interface EngineContext {
  tournament: Tournament;
  participants: TournamentParticipant[];
  matches: Match[];
  feeders: MatchFeeder[];
  stages?: Stage[];
  groups?: Group[];
  groupMembers?: GroupMember[];
}


// ============================================================
// Engine output: plans (lists of changes for the orchestrator to persist)
// ============================================================

/**
 * Returned from `initialize()`. Describes the full set of objects to create
 * when a tournament is started.
 */
export interface InitializationPlan {
  // Stages to create (always at least one)
  stages: NewStage[];
  // For groups-stage tournaments
  groups?: NewGroup[];
  groupMemberships?: NewGroupMember[];
  // The full match graph
  matches: NewMatch[];
  feeders: NewMatchFeeder[];
  // Seed assignments per participant
  seedAssignments: { participantId: string; seed: number }[];
}

/**
 * Returned from `advanceFromMatch()`. Describes everything that should change
 * after a single match's result is recorded.
 */
export interface AdvancementPlan {
  // The match itself: status update, winner assignment
  matchUpdate: {
    matchId: string;
    status: MatchStatus;
    winnerParticipantId: string | null;   // null only valid for group-stage draws
  };

  // Downstream slot fills: "match X's home/away slot is now participant Y"
  participantAdvancements: {
    matchId: string;
    slot: 'home' | 'away';
    participantId: string;
  }[];

  // Status changes on downstream matches (e.g. 'pending' → 'scheduled' once both slots filled)
  matchStatusChanges: {
    matchId: string;
    status: MatchStatus;
  }[];

  // Participant lifecycle (eliminated, advanced, winner)
  participantStatusChanges: {
    participantId: string;
    status: ParticipantStatus;
    finalPosition?: number;
  }[];

  // Tournament/stage completion
  isTournamentComplete: boolean;
  tournamentWinnerParticipantId?: string;
  finalRankings?: { participantId: string; finalPosition: number }[];
}


// ============================================================
// Standings — live computed table (used in groups, round-robin, leaderboards)
// ============================================================

export interface Standing {
  participantId: string;
  rank: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  /** Tiebreaker values that determined this rank (for transparency in the UI). */
  tiebreakers?: Record<string, number>;
}


// ============================================================
// "New" shapes — payloads for inserting new rows. Mirrors entity types
// minus DB-managed fields (id, timestamps).
// ============================================================

export type NewStage = Omit<Stage, 'id' | 'createdAt'>;

export type NewGroup = Omit<Group, 'id'> & {
  /** Tag used by the engine to match this group with its memberships before IDs exist. */
  tempKey: string;
};

export type NewGroupMember = Omit<GroupMember, 'id' | 'groupId'> & {
  /** Resolved against `NewGroup.tempKey` by the orchestrator. */
  groupTempKey: string;
};

export type NewMatch = Omit<
  Match,
  'id' | 'createdAt' | 'updatedAt'
> & {
  /** Tag used to wire feeders before match IDs exist. */
  tempKey: string;
};

export type NewMatchFeeder = Omit<
  MatchFeeder,
  'id' | 'targetMatchId' | 'sourceMatchId'
> & {
  targetMatchTempKey: string;
  sourceMatchTempKey: string;
};


// ============================================================
// Validation
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}


// ============================================================
// The interface itself
// ============================================================

export interface FormatEngine {
  /** Format this engine handles. Must match the `TournamentFormat` enum. */
  readonly format: TournamentFormat;

  /** Human-readable name for display in admin UI. */
  readonly displayName: string;

  /** One-line description for tournament-creation UI. */
  readonly description: string;

  /**
   * Validate that this format can run with the given participants and settings.
   * Called before the admin can move a tournament from 'registration_closed' → 'in_progress'.
   */
  validate(
    participantCount: number,
    settings: TournamentSettings,
  ): ValidationResult;

  /**
   * Generate the initial bracket / groups / matches when a tournament starts.
   * Called once, on transition from 'registration_closed' → 'in_progress'.
   *
   * Pure: takes participants + settings, returns a plan of records to create.
   */
  initialize(
    participants: TournamentParticipant[],
    settings: TournamentSettings,
  ): InitializationPlan;

  /**
   * Compute downstream effects after a match result is recorded.
   * Called every time a match transitions to 'completed'.
   *
   * Pure: takes current state + result, returns a plan of records to update.
   */
  advanceFromMatch(
    context: EngineContext,
    completedMatchId: string,
    result: MatchResult,
  ): AdvancementPlan;

  /**
   * Compute current standings. Used:
   *   - continuously during group / round-robin / Swiss tournaments
   *   - at end-of-stage to determine who advances
   *   - on the public leaderboard view
   *
   * `scope` lets callers narrow to a single group or stage.
   */
  getStandings(
    context: EngineContext,
    scope?: { stageId?: string; groupId?: string },
  ): Standing[];
}
