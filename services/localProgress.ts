export interface PracticeRecord {
  seen: number;
  correct: number;
  lastSeen: number;
}

export type Progress = Record<string, PracticeRecord>;
export const PROGRESS_KEY = 'topo-coco-practice-v1';
export const SCORE_KEY = 'topo-coco-local-reismunten';
export const PREFERENCES_KEY = 'topo-coco-selection-v1';

export function readLocal<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readProgress(): Progress {
  const saved = readLocal<unknown>(PROGRESS_KEY, {});
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
  return Object.fromEntries(Object.entries(saved).filter(([, value]) =>
    value && Number.isFinite(value.seen) && value.seen > 0 &&
    Number.isFinite(value.correct) && value.correct >= 0 && Number.isFinite(value.lastSeen)
  ));
}

export function recordAnswer(progress: Progress, id: string, correct: boolean): Progress {
  const previous = progress[id] ?? { seen: 0, correct: 0, lastSeen: 0 };
  return { ...progress, [id]: {
    seen: previous.seen + 1,
    correct: previous.correct + Number(correct),
    lastSeen: Date.now(),
  } };
}

export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Finish a first pass through the pool before revisiting older items.
export function nextBatch<T>(items: readonly T[], count: number, progress: Progress, key: (item: T) => string): T[] {
  return shuffle(items).sort((a, b) => {
    const left = progress[key(a)];
    const right = progress[key(b)];
    return Number(!!left) - Number(!!right) || (left?.lastSeen ?? 0) - (right?.lastSeen ?? 0);
  }).slice(0, count);
}
