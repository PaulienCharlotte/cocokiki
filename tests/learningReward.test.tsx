import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { learningReward } from '../services/learningReward';
import { rewardClockRound } from '../games/clock/clockProgress';
import { finishMathLevel } from '../games/math/progress';
import { loadCurrency } from '../services/currency';

function stored(run: () => void) {
  const original = globalThis.localStorage, memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
  try { run(); } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original }); }
}

test('shared learning reward excludes revealed answers and invalid quantities', () => {
  assert.equal(learningReward(), 2);
  assert.equal(learningReward(6), 12);
  assert.equal(learningReward(1, true), 0);
  for (const value of [0, -1, NaN, Infinity, 1.5]) assert.equal(learningReward(value), 0);
});
test('clock practice excludes revealed clocks, pays repeats equally and rejects duplicate rounds', () => stored(() => {
  assert.equal(rewardClockRound('set-clock', 1, 'hint-round', 4), 8);
  assert.equal(rewardClockRound('set-clock', 1, 'hint-round', 5), 0);
  assert.equal(rewardClockRound('set-clock', 1, 'all-revealed', 0), 0);
  assert.equal(rewardClockRound('memory', 1, 'memory-a'), 12);
  assert.equal(rewardClockRound('memory', 1, 'memory-b'), 12);
  assert.equal(rewardClockRound('memory', 1, 'invalid', 7), 0);
  assert.equal(loadCurrency(), 32);
}));
test('math retries earn the same as first answers and fresh rounds can earn again', () => stored(() => {
  const result = { correct: 7, total: 10, score: 7, mistakes: 3, solved: 10, roundId: 'round-a' };
  assert.equal(finishMathLevel('missing', 1, result).reward, 20);
  assert.equal(finishMathLevel('missing', 1, result).reward, 0);
  assert.equal(finishMathLevel('missing', 1, { ...result, roundId: 'round-b' }).reward, 20);
  assert.equal(finishMathLevel('missing', 1, { ...result, solved: 11, roundId: 'invalid' }).ok, false);
  assert.equal(loadCurrency(), 40);
}));
test('topo keeps answer revelation sticky until the next place, not just while the hint is open', () => {
  const source = readFileSync('components/GameEngine.tsx', 'utf8');
  assert.match(source, /learningReward\(Number\(success\), answerRevealed.current\)/);
  assert.match(source, /answerRevealed.current = true; setReveal\(true\)/);
  assert.match(source, /hadError.current = false; answerRevealed.current = false/);
});
