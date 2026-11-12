import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { FOOD_LESSONS } from '../data/cooking/foodLessons';
import { RECIPES_BY_ID } from '../data/cooking/catalog';
import { CAKE_ORDER_KEY, cakeMeetsOrder, deliverCakeOrder, loadCakeOrder, saveCakeOrder } from '../services/cakeOrder';
import { LOCAL_STATE_KEY } from '../services/localState';
import { completeFoodLesson, loadFoodKnowledge } from '../services/foodKnowledge';
const strawberry = { id: 'a', versieringId: 'aardbei', x: .5, y: .5, schaal: 1, draai: 0 };

test('voedingsjourneys verwijzen naar bestaande beelden, recepten en geldige antwoorden', () => {
  assert.equal(FOOD_LESSONS.length, 3);
  for (const lesson of FOOD_LESSONS) {
    assert.ok(existsSync(`public${lesson.image}`));
    assert.equal(RECIPES_BY_ID[lesson.recipeId]?.contentStatus, 'ready');
    for (const question of lesson.questions) assert.ok(question.answer >= 0 && question.answer < question.choices.length);
  }
});

test('taartaflevering beloont maar één keer en voedingskennis blijft naast bestaande documenten bewaard', () => {
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) } });
  Reflect.deleteProperty(globalThis, 'window');
  try {
    storage.set(LOCAL_STATE_KEY, JSON.stringify({ version: 2, balance: 12, appliedTransactions: {}, documents: { existing: 'keep' } }));
    assert.equal(cakeMeetsOrder('wit', [strawberry]), false);
    assert.equal(cakeMeetsOrder('roze', []), false);
    assert.equal(deliverCakeOrder('roze', [strawberry]), null);
    assert.equal(saveCakeOrder({ started: true, timed: true, elapsed: 299, delivered: false, reward: 0 }), true);
    assert.equal(deliverCakeOrder('wit', [strawberry]), null);
    assert.equal(deliverCakeOrder('roze', [strawberry])?.reward, 7);
    assert.equal(deliverCakeOrder('roze', [strawberry])?.reward, 7);
    assert.equal(JSON.parse(storage.get(LOCAL_STATE_KEY)!).balance, 19);
    assert.equal(completeFoodLesson('sugar'), true);
    assert.equal(completeFoodLesson('sugar'), true);
    assert.equal(completeFoodLesson('unknown'), false);
    assert.deepEqual(loadFoodKnowledge(), ['sugar']);
    assert.equal(JSON.parse(storage.get(LOCAL_STATE_KEY)!).documents.existing, 'keep');
    // Een nieuwe opslagfixture controleert de grens zonder beloning van eerder werk.
    storage.clear();
    saveCakeOrder({ started: true, timed: true, elapsed: 300, delivered: false, reward: 0 });
    assert.equal(deliverCakeOrder('roze', [strawberry])?.reward, 5);
    storage.clear();
    saveCakeOrder({ started: true, timed: false, elapsed: 10, delivered: false, reward: 0 });
    assert.equal(deliverCakeOrder('roze', [strawberry])?.reward, 5);
    storage.set(CAKE_ORDER_KEY, '{bad json');
    storage.delete(LOCAL_STATE_KEY);
    assert.equal(loadCakeOrder().started, false);
  } finally {
    if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage); else Reflect.deleteProperty(globalThis, 'localStorage');
    if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow); else Reflect.deleteProperty(globalThis, 'window');
  }
});
