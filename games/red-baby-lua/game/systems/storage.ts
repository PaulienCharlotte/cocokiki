import { BestResult, Preferences } from '../types';
import { loadCurrency } from '../../../../services/currency';

const PREFS_KEY = 'cocokiki:baby-lua:v1:preferences';
const BEST_KEY = 'cocokiki:baby-lua:v1:best';
export const DEFAULT_PREFERENCES: Preferences = { table: 2, mode: 'adventure', sound: true, tutorialSeen: false };

export function loadPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null');
    const tafels = saved && (saved.table === 'mix'
      || (Array.isArray(saved.table) && saved.table.length > 0 && saved.table.every((table: unknown) => Number.isInteger(table) && (table as number) >= 1 && (table as number) <= 12))
      || (saved.table >= 1 && saved.table <= 12));
    return tafels
      ? { ...DEFAULT_PREFERENCES, ...saved, mode: saved.mode ?? (saved.calm ? 'calm' : 'adventure') }
      : DEFAULT_PREFERENCES;
  } catch { return DEFAULT_PREFERENCES; }
}

export function savePreferences(value: Preferences): void {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify(value)); } catch { /* Storage is optional. */ }
}

export function loadBest(): BestResult {
  try { return { score: 0, stars: 0, ...JSON.parse(localStorage.getItem(BEST_KEY) ?? '{}') }; }
  catch { return { score: 0, stars: 0 }; }
}

export function saveBest(value: BestResult): void {
  try { localStorage.setItem(BEST_KEY, JSON.stringify(value)); } catch { /* Storage is optional. */ }
}

export function loadCoins(): number {
  return loadCurrency();
}
