import { SessionStats } from '../types';
import { TableChoice } from '../types';

export const EMPTY_STATS: SessionStats = { firstTry: 0, eventual: 0, missed: 0, streak: 0, bestStreak: 0, score: 0 };

export function recordSuccess(stats: SessionStats, firstTry: boolean): SessionStats {
  const streak = firstTry ? stats.streak + 1 : 0;
  return {
    ...stats,
    firstTry: stats.firstTry + Number(firstTry),
    eventual: stats.eventual + 1,
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    score: stats.score + (firstTry ? 100 : 60),
  };
}

export function recordTimeout(stats: SessionStats): SessionStats {
  return { ...stats, missed: stats.missed + 1, streak: 0 };
}

export function starsFor(stats: SessionStats, rounds: number): number {
  if (!rounds) return 0;
  const ratio = stats.firstTry / rounds;
  return ratio >= .8 ? 3 : ratio >= .5 ? 2 : stats.eventual > 0 ? 1 : 0;
}

export function roundDuration(baseMs: number, stats: SessionStats): number {
  return Math.max(5000, baseMs - Math.floor(stats.bestStreak / 3) * 400 + Math.min(1200, stats.missed * 300));
}

export function currencyReward(table: TableChoice, firstTry: boolean): number {
  const difficulty = table === 'mix' ? 4 : [6, 7, 8, 9].includes(table) ? 3 : [3, 4].includes(table) ? 2 : 1;
  return firstTry ? difficulty : Math.max(1, Math.ceil(difficulty / 2));
}
