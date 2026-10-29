import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { answerShoppingQuestion, loadShoppingPractice, shoppingQuestion } from '../services/shoppingPractice';
import { adjustBasket, basketTotal, createShoppingSession, loadShoppingSession, saveShoppingSession, checkoutBasket } from '../services/shopping';
import { awardCurrencyOnce, loadCurrency } from '../services/currency';
import { createEmptyCookingProgress } from '../services/cookingProgress';
import AmountInput from '../components/cooking/AmountInput';
import DigitalScale from '../components/cooking/DigitalScale';
import BasketPractice from '../components/shop/BasketPractice';

function storage(run: (fail: (value: boolean) => void) => void) {
  const original = globalThis.localStorage;
  const data = new Map<string, string>();
  let failed = false;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { if (failed) throw new Error('Storage full'); data.set(key, value); } } });
  try { run(value => { failed = value; }); } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original }); }
}
function basket() {
  const session = adjustBasket(createShoppingSession('free', null, new Date(), 'autumn', 'practice-basket'), 'flour', 2);
  assert.ok(saveShoppingSession(session));
  return session;
}
test('basket questions alternate nutrition and arithmetic and keep stable answer positions', () => storage(() => {
  const session = basket();
  for (let i = 0; i < 60; i++) {
    const q = shoppingQuestion(session, i);
    assert.equal(q.options.length, 3);
    assert.equal(new Set(q.options.map(o => o.id)).size, 3);
    assert.equal(q.options.filter(o => o.id === q.correctId).length, 1);
    assert.deepEqual(q, shoppingQuestion(session, i));
    if (i % 2) assert.match(q.prompt, /gram/);
    else { assert.match(q.prompt, /Wat leerden/); assert.ok(!q.options.find(o => o.id === q.correctId)!.label.startsWith(q.prompt.split('over ')[1])); }
  }
}));
test('incorrect answers cannot change money, question progress or the saved basket', () => storage(() => {
  const session = basket();
  const question = shoppingQuestion(session, 0);
  const result = answerShoppingQuestion(session, question.id, question.options.find(o => o.id !== question.correctId)!.id);
  assert.equal(result.status, 'incorrect');
  assert.equal(loadCurrency(), 0);
  assert.equal(loadShoppingPractice(session).questionIndex, 0);
  assert.deepEqual(loadShoppingSession('free'), session);
}));
test('one answer earns two coins atomically and duplicate callbacks never earn twice', () => storage(() => {
  const session = basket();
  const question = shoppingQuestion(session, 0);
  const result = answerShoppingQuestion(session, question.id, question.correctId);
  assert.equal(result.status, 'correct');
  assert.equal(loadCurrency(), 2);
  assert.equal(loadShoppingPractice(session).questionIndex, 1);
  assert.equal(loadShoppingPractice(session).earned, 2);
  assert.equal(answerShoppingQuestion(session, question.id, question.correctId).status, 'stale');
  assert.equal(loadCurrency(), 2);
  assert.deepEqual(loadShoppingSession('free'), session);
}));
test('practice can fund the exact deficit and then checkout without rebuilding the basket', () => storage(() => {
  const session = basket();
  const total = basketTotal(session);
  awardCurrencyOnce('start', total - 3);
  let question = shoppingQuestion(session, 0);
  assert.equal(answerShoppingQuestion(session, question.id, question.correctId).reward, 2);
  question = shoppingQuestion(session, 1);
  assert.equal(answerShoppingQuestion(session, question.id, question.correctId).reward, 1);
  assert.equal(loadCurrency(), total);
  question = shoppingQuestion(session, 2);
  assert.equal(answerShoppingQuestion(session, question.id, question.correctId).status, 'funded');
  assert.equal(loadCurrency(), total);
  const saved = loadShoppingSession('free');
  assert.deepEqual(saved.basket, session.basket);
  assert.equal(checkoutBasket(createEmptyCookingProgress(), saved, loadCurrency()).status, 'success');
}));
test('storage failure cannot award coins or forget the current question and basket', () => storage(fail => {
  const session = basket();
  const question = shoppingQuestion(session, 0);
  fail(true);
  assert.equal(answerShoppingQuestion(session, question.id, question.correctId).status, 'failed');
  assert.equal(loadCurrency(), 0);
  assert.equal(loadShoppingPractice(session).questionIndex, 0);
  assert.deepEqual(loadShoppingSession('free').basket, session.basket);
  fail(false);
  assert.equal(answerShoppingQuestion(session, question.id, question.correctId).reward, 2);
}));
test('an empty, cheaper or replaced basket cannot be used to farm rewards', () => storage(() => {
  const session = basket();
  saveShoppingSession(adjustBasket(session, 'flour', -2));
  const q = shoppingQuestion(session, 0);
  assert.equal(answerShoppingQuestion(session, q.id, q.correctId).status, 'funded');
  saveShoppingSession(createShoppingSession('free', null));
  assert.equal(answerShoppingQuestion(session, q.id, q.correctId).status, 'stale');
  assert.equal(loadCurrency(), 0);
}));
test('weights expose direct numeric entry while preserving existing scale buttons', () => {
  const input = renderToStaticMarkup(<AmountInput value={200} onChange={() => undefined} label="Bloem" maximum={800} />);
  assert.match(input, /type="number"/);
  assert.match(input, /inputMode="numeric"/i);
  assert.match(input, /value="200"/);
  assert.match(input, /aria-label="Bloem"/);
  const scale = renderToStaticMarkup(<DigitalScale value={200} target={400} ingredientImage="/flour.webp" bowlImage="/bowl.webp" increments={[5, 25]} onChange={() => undefined} />);
  assert.match(scale, /aria-label="Gewicht in gram"/);
  assert.match(scale, /Weegschaal leegmaken/);
});
test('practice stays inline in the basket and offers food and quantity questions', () => storage(() => {
  const session = basket();
  const html = renderToStaticMarkup(<BasketPractice session={session} deficit={10} onBack={() => undefined} onBalance={() => undefined} />);
  assert.match(html, /Verdien voor je mandje/);
  assert.match(html, /coco-chef-tip/);
  assert.doesNotMatch(html, /role="dialog"|<a\b/);
}));
