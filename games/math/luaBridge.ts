import type { MathLevel, MathResult } from './types';
import type { SessionStats } from '../red-baby-lua/game/types';

export const LUA_LEVEL_TABLES: readonly (readonly number[])[] = [[1, 2, 5, 10], [3, 4], [6, 7], [8, 9, 11, 12], Array.from({ length: 12 }, (_, i) => i + 1)];
export function luaTableForLevel(level: MathLevel, random = Math.random): number {
  const tables = LUA_LEVEL_TABLES[level - 1];
  return tables[Math.min(tables.length - 1, Math.floor(random() * tables.length))];
}
export function luaMathResult(stats: SessionStats): MathResult {
  return { correct: stats.firstTry, total: 10, score: stats.firstTry, mistakes: Math.max(0, 10 - stats.firstTry), solved: stats.eventual };
}
