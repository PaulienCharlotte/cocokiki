import type { ClockGameId, ClockLevel, ClockProgress, ClockRaceMode } from './types';

export const CLOCK_PROGRESS_KEY = 'cocokiki:clock-progress:v1';
export const CLOCK_RACE_MODE_KEY = 'cocokiki:clock-race-mode:v1';

export function createEmptyClockProgress(): ClockProgress {
  return { version: 1, completed: { memory: [], 'set-clock': [], race: [] } };
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
    },
  };
}

export function loadClockProgress(): ClockProgress {
  try {
    return migrateClockProgress(JSON.parse(localStorage.getItem(CLOCK_PROGRESS_KEY) ?? 'null'));
  } catch {
    return createEmptyClockProgress();
  }
}

export function saveClockProgress(progress: ClockProgress): void {
  try { localStorage.setItem(CLOCK_PROGRESS_KEY, JSON.stringify(progress)); } catch { /* Progress remains optional. */ }
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
  return 3 + level * 2;
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
