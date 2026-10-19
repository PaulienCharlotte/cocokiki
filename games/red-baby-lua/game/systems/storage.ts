import { BestResult, Preferences } from '../types';
import { loadCurrency, saveCurrency } from '../../../../services/currency';

const PREFS_KEY = 'cocokiki:baby-lua:v1:preferences';
const BEST_KEY = 'cocokiki:baby-lua:v1:best';
export const DEFAULT_PREFERENCES: Preferences = { table: 2, mode: 'adventure', sound: true, tutorialSeen: false };

export function loadPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null');
    return saved && (saved.table === 'mix' || (saved.table >= 1 && saved.table <= 10))
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

export function saveCoins(value: number): void {
  saveCurrency(value);
}
