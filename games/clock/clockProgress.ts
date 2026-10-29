import type { ClockGameId, ClockLevel, ClockProgress, ClockRaceMode } from './types';
import { commitLocalState, readDocument, readLocalState } from '../../services/localState';
import { learningReward } from '../../services/learningReward';

export const CLOCK_PROGRESS_KEY = 'cocokiki:clock-progress:v1';
export const CLOCK_RACE_MODE_KEY = 'cocokiki:clock-race-mode:v1';

export function createEmptyClockProgress(): ClockProgress {
  return { version: 1, completed: { memory: [], 'set-clock': [], race: [], 'world-times': [] } };
}

function validLevel(value: unknown): value is ClockLevel {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 5;
}

export function migrateClockProgress(value: unknown): ClockProgress {
  const empty = createEmptyClockProgress();
  if (!value || typeof value !== 'object') return empty;
  const completed = (value as Partial<ClockProgress>).completed;
  if (!completed || typeof completed !== 'object') return empty;
  return {
    version: 1,
    completed: {
      memory: [...new Set(Array.isArray(completed.memory) ? completed.memory.filter(validLevel) : [])].sort(),
      'set-clock': [...new Set(Array.isArray(completed['set-clock']) ? completed['set-clock'].filter(validLevel) : [])].sort(),
      race: [...new Set(Array.isArray(completed.race) ? completed.race.filter(validLevel) : [])].sort(),
      'world-times': [...new Set(Array.isArray(completed['world-times']) ? completed['world-times'].filter(validLevel) : [])].sort(),
    },
  };
}

export function loadClockProgress(): ClockProgress {
  try {
    return migrateClockProgress(JSON.parse(readDocument(CLOCK_PROGRESS_KEY) ?? 'null'));
  } catch {
    return createEmptyClockProgress();
  }
}

export function saveClockProgress(progress: ClockProgress): void {
  commitLocalState({ [CLOCK_PROGRESS_KEY]: JSON.stringify(progress) });
}

export function completeClockLevel(progress: ClockProgress, game: ClockGameId, level: ClockLevel): { progress: ClockProgress; firstCompletion: boolean } {
  if (progress.completed[game].includes(level)) return { progress, firstCompletion: false };
  return {
    firstCompletion: true,
    progress: {
      ...progress,
      completed: { ...progress.completed, [game]: [...progress.completed[game], level].sort() },
    },
  };
}

export function clockLevelReward(level: ClockLevel): number {
  return learningReward(5);
}

/** One round token prevents repeated effects from awarding the same practice twice. */
export function rewardClockRound(game: ClockGameId, level: ClockLevel, roundId: string, solved = game === 'memory' ? 6 : 5): number {
  if (!roundId || !validLevel(level)) return 0;
  if (!Number.isSafeInteger(solved) || solved < 0 || solved > (game === 'memory' ? 6 : 5)) return 0;
  try {
    const state = readLocalState();
    const id = `clock:round:${roundId}`;
    if (Object.prototype.hasOwnProperty.call(state.appliedTransactions, id)) return 0;
    const milestone = `clock:${game}:level:${level}`;
    const first = !Object.prototype.hasOwnProperty.call(state.appliedTransactions, milestone);
    const amount = learningReward(solved);
    const next = completeClockLevel(loadClockProgress(), game, level).progress;
    const operations = first ? [{ id: milestone, amount }, { id, amount: 0 }] : [{ id, amount }];
    return commitLocalState({ [CLOCK_PROGRESS_KEY]: JSON.stringify(next) }, operations).status === 'applied' ? amount : 0;
  } catch { return 0; }
}

export function loadClockRaceMode(): ClockRaceMode {
  try {
    const value = localStorage.getItem(CLOCK_RACE_MODE_KEY);
    return value === 'digital' || value === 'mixed' ? value : 'analog';
  } catch {
    return 'analog';
  }
}

export function saveClockRaceMode(mode: ClockRaceMode): void {
  try { localStorage.setItem(CLOCK_RACE_MODE_KEY, mode); } catch { /* Preference remains optional. */ }
}
