import assert from 'node:assert/strict';
import test from 'node:test';
import { answerCoins, rewardAnswer } from '../services/answerRewards';
import { loadCurrency, saveCurrency } from '../services/currency';
import { commitLocalState, REWARD_EVENT } from '../services/localState';
import { finishMathLevel } from '../games/math/progress';
import { rewardClockRound } from '../games/clock/clockProgress';

function stored(run: (block: () => void) => void) {
  const storage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const values = new Map<string, string>(); let blocked = false;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { if (blocked) throw Error('full'); values.set(key, value); } } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  try { run(() => { blocked = true; }); } finally {
    if (storage) Object.defineProperty(globalThis, 'localStorage', storage); else Reflect.deleteProperty(globalThis, 'localStorage');
    if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor); else Reflect.deleteProperty(globalThis, 'window');
  }
}

test('saved positive rewards celebrate once; spending, imports, duplicates and failed writes do not', () => stored(block => {
  const amounts: number[] = [];
  window.addEventListener(REWARD_EVENT, event => amounts.push((event as CustomEvent).detail.amount));
  assert.equal(rewardAnswer('math:divide', 'run', 0, 2).applied, true);
  assert.deepEqual(amounts, [2]);
  rewardAnswer('math:divide', 'run', 0, 2);
  commitLocalState({}, [{ id: 'spend', amount: -1 }]);
  saveCurrency(100);
  commitLocalState({ preference: 'yes' });
  assert.deepEqual(amounts, [2]);
  block(); rewardAnswer('math:divide', 'run', 1, 2);
  assert.deepEqual(amounts, [2]); assert.equal(loadCurrency(), 100);
}));

test('math and clock answers grow the wallet immediately and round settlement never pays them twice', () => stored(() => {
  rewardAnswer('math:divide', 'math-run', 0, 2);
  rewardAnswer('math:divide', 'math-run', 1, 2);
  assert.equal(loadCurrency(), 4);
  const result = { correct: 10, solved: 10, total: 10, score: 10, mistakes: 0, roundId: 'math-run' };
  assert.equal(finishMathLevel('divide', 1, result).reward, 20);
  assert.equal(loadCurrency(), 20);
  assert.equal(finishMathLevel('divide', 1, result).reward, 0);
  for (let i = 0; i < 5; i++) rewardAnswer('clock:set-clock', 'clock-run', i, 2);
  assert.equal(loadCurrency(), 30);
  assert.equal(answerCoins('clock:set-clock', 'clock-run'), 10);
  assert.equal(rewardClockRound('set-clock', 1, 'clock-run'), 10);
  assert.equal(loadCurrency(), 30);
  assert.equal(rewardClockRound('set-clock', 1, 'clock-run'), 0);
}));

test('checkout immediately pays each customer and settles only the remaining difficulty bonus', () => stored(() => {
  for (let i = 0; i < 23; i++) rewardAnswer('math:race', 'checkout-run', i, 2);
  const result = { correct: 23, total: 24, score: 23, mistakes: 1, raceId: 'checkout-run' };
  assert.equal(loadCurrency(), 46);
  assert.equal(finishMathLevel('race', 1, result).reward, 69);
  assert.equal(loadCurrency(), 69);
  assert.equal(finishMathLevel('race', 1, result).reward, 0);
  assert.equal(loadCurrency(), 69);
}));

test('plant treatment saves the consult and remaining payment atomically after the diagnosis reward', async () => {
  const { claimConsult, createEmptyClinic, loadClinic, nextPatient } = await import('../services/plantClinic');
  stored(() => {
    const patient = nextPatient(createEmptyClinic(), () => 0, () => 'clinic-run')!;
    rewardAnswer('clinic', patient.consultId, 'diagnosis', 5);
    assert.equal(loadCurrency(), 5);
    assert.equal(claimConsult(patient, 0, false)?.coins, 30);
    assert.equal(loadCurrency(), 30);
    assert.equal(loadClinic().helped, 1);
    assert.equal(claimConsult(patient, 0, false)?.coins, 0);
    assert.equal(loadCurrency(), 30);
  });
  stored(block => {
    const patient = nextPatient(createEmptyClinic(), () => 0, () => 'blocked-clinic')!;
    block();
    assert.equal(claimConsult(patient, 0, false), null);
    assert.equal(loadClinic().helped, 0);
    assert.equal(loadCurrency(), 0);
  });
});
