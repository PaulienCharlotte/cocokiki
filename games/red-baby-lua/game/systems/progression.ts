import { SessionStats } from '../types';
import { TableChoice } from '../types';
import { learningReward } from '../../../../services/learningReward';

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
  if (stats.bestStreak >= 10) return Math.round(baseMs * .64);
  if (stats.bestStreak >= 5) return Math.round(baseMs * .8);
  return baseMs;
}

export function currencyReward(table: TableChoice, firstTry: boolean): number {
  return learningReward();
}
