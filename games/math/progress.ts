import { commitLocalState, readDocument, readLocalState, subscribeLocalState } from '../../services/localState';
import { resultStatus } from './engine';
import { RACE_DAILY_COIN_CAP } from './config';
import { MATH_GAME_IDS, MATH_LEVELS, type MathGameId, type MathLevel, type MathProgress, type MathResult } from './types';
import { learningReward } from '../../services/learningReward';

export const MATH_PROGRESS_KEY = 'cocokiki:math-progress:v1';
export const RACE_EARNINGS_KEY = 'cocokiki:math-race-earnings:v1';
interface RaceEarnings { version: 1; days: Record<string, number>; runs: Record<string, { reward: number; signature: string }> }
function loadRaceEarnings(): RaceEarnings {
  const raw = readDocument(RACE_EARNINGS_KEY);
  if (!raw) return { version: 1, days: {}, runs: {} };
  const parsed = JSON.parse(raw);
  if (parsed?.version !== 1 || !parsed.days || !parsed.runs || typeof parsed.days !== 'object' || typeof parsed.runs !== 'object' || Array.isArray(parsed.days) || Array.isArray(parsed.runs)) throw Error('Ongeldige winkelbeloningen');
  if (Object.values(parsed.days).some(amount => !Number.isSafeInteger(amount) || Number(amount) < 0)) throw Error('Ongeldige dagtotalen');
  return parsed;
}
export function raceDayKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function raceCoinsAvailable(now = new Date()): number {
  try { return Math.max(0, RACE_DAILY_COIN_CAP - (loadRaceEarnings().days[raceDayKey(now)] ?? 0)); } catch { return 0; }
}
export function emptyMathProgress(): MathProgress {
  return { version: 1, games: Object.fromEntries(MATH_GAME_IDS.map(id => [id, { completed: [], best: {} }])) as MathProgress['games'] };
}
export function migrateMathProgress(value: unknown): MathProgress {
  const next = emptyMathProgress();
  if (!value || typeof value !== 'object' || (value as MathProgress).version !== 1) return next;
  for (const game of MATH_GAME_IDS) {
    const saved = (value as MathProgress).games?.[game];
    if (!saved || typeof saved !== 'object') continue;
    next.games[game].completed = MATH_LEVELS.filter(level => Array.isArray(saved.completed) && saved.completed.includes(level));
    for (const level of MATH_LEVELS) {
      const result = saved.best?.[level];
      if (result && resultStatus(game, level, result).valid) next.games[game].best[level] = result;
    }
  }
  return next;
}
export function loadMathProgress(): MathProgress {
  try { return migrateMathProgress(JSON.parse(readDocument(MATH_PROGRESS_KEY) ?? 'null')); } catch { return emptyMathProgress(); }
}
export const subscribeMathProgress = (listener: () => void) => subscribeLocalState(listener, MATH_PROGRESS_KEY);
export function levelUnlocked(progress: MathProgress, game: MathGameId, level: MathLevel): boolean {
  return level === 1 || progress.games[game].completed.includes(level) || progress.games[game].completed.includes((level - 1) as MathLevel);
}
export function nextMathLevel(progress: MathProgress, game: MathGameId): MathLevel {
  return MATH_LEVELS.find(level => !progress.games[game].completed.includes(level)) ?? 5;
}
export function finishMathLevel(game: MathGameId, level: MathLevel, result: MathResult, now = new Date()): { ok: boolean; reward: number; progress: MathProgress } {
  const progress = loadMathProgress();
  const status = resultStatus(game, level, result);
  if (!MATH_GAME_IDS.includes(game) || !MATH_LEVELS.includes(level) || !status.valid || !levelUnlocked(progress, game, level)) return { ok: false, reward: 0, progress };
  const next = structuredClone(progress), record = next.games[game];
  const previous = record.best[level];
  if (!previous || result.score > previous.score || (result.score === previous.score && result.correct >= previous.correct && result.mistakes <= previous.mistakes)) record.best[level] = result;
  if (status.passed && !record.completed.includes(level)) record.completed.push(level);
  record.completed.sort();
  if (game === 'race') {
    if (!result.raceId || !/^[a-zA-Z0-9-]{1,100}$/.test(result.raceId) || result.score !== result.correct) return { ok: false, reward: 0, progress };
    try {
      const earnings = loadRaceEarnings(), signature = JSON.stringify([level, result.correct, result.total, result.score, result.mistakes]);
      const previousRun = Object.prototype.hasOwnProperty.call(earnings.runs, result.raceId) ? earnings.runs[result.raceId] : undefined;
      if (previousRun) return { ok: previousRun.signature === signature, reward: 0, progress };
      const day = raceDayKey(now), earned = earnings.days[day] ?? 0;
      if (!Number.isSafeInteger(earned) || earned < 0) return { ok: false, reward: 0, progress };
      const reward = learningReward(result.correct);
      earnings.days[day] = earned + reward;
      earnings.runs[result.raceId] = { reward, signature };
      const saved = commitLocalState({ [MATH_PROGRESS_KEY]: JSON.stringify(next), [RACE_EARNINGS_KEY]: JSON.stringify(earnings) }, [{ id: `math:checkout:${result.raceId}`, amount: reward }]);
      return { ok: saved.status === 'applied' || saved.status === 'duplicate', reward: saved.status === 'applied' ? reward : 0, progress: saved.status === 'invalid' ? progress : next };
    } catch { return { ok: false, reward: 0, progress }; }
  }
  const solved = result.solved ?? result.correct;
  if (!Number.isSafeInteger(solved) || solved < result.correct || solved > result.total) return { ok: false, reward: 0, progress };
  const roundId = result.roundId ?? `legacy:${game}:${level}:${JSON.stringify(result)}`;
  if (!roundId || roundId.length > 500) return { ok: false, reward: 0, progress };
  const operations = [{ id: `math:round:${game}:${roundId}`, amount: learningReward(solved) }];
  // Read the receipt before committing so replays can report only newly earned coins.
  const before = loadRewardLedger();
  const reward = operations.filter(operation => !Object.prototype.hasOwnProperty.call(before, operation.id)).reduce((sum, operation) => sum + operation.amount, 0);
  const saved = commitLocalState({ [MATH_PROGRESS_KEY]: JSON.stringify(next) }, operations);
  return { ok: saved.status === 'applied' || saved.status === 'duplicate', reward: saved.status === 'applied' ? reward : 0, progress: saved.status === 'invalid' ? progress : next };
}

function loadRewardLedger() { try { return readLocalState().appliedTransactions; } catch { return {}; } }
