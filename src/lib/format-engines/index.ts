/**
 * Format engine registry.
 *
 * As we implement each format, register it here. The rest of the app looks up
 * engines by `TournamentFormat` and never imports concrete implementations directly.
 */

import type { TournamentFormat } from '../types';
import type { FormatEngine } from './types';

// Engines are added here as we build them.
// Phase 2: import { singleEliminationEngine } from './single-elimination';
// Phase 3: import { groupsKnockoutEngine } from './groups-knockout';
// Phase 6: import { doubleEliminationEngine } from './double-elimination';
// Phase 6: import { swissEngine } from './swiss';

const engines: Partial<Record<TournamentFormat, FormatEngine>> = {
  // single_elimination: singleEliminationEngine,
  // groups_knockout: groupsKnockoutEngine,
  // double_elimination: doubleEliminationEngine,
  // swiss: swissEngine,
  // round_robin: roundRobinEngine,
  // free_for_all: freeForAllEngine,
};

export function getFormatEngine(format: TournamentFormat): FormatEngine {
  const engine = engines[format];
  if (!engine) {
    throw new Error(
      `No engine registered for tournament format "${format}". ` +
      `Implement and register it in src/lib/format-engines/index.ts.`,
    );
  }
  return engine;
}

export function getRegisteredFormats(): TournamentFormat[] {
  return Object.keys(engines) as TournamentFormat[];
}

export function isFormatSupported(format: TournamentFormat): boolean {
  return format in engines;
}

// Re-exports for convenience
export type {
  FormatEngine,
  EngineContext,
  InitializationPlan,
  AdvancementPlan,
  Standing,
  ValidationResult,
} from './types';
