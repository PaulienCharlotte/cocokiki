import test from 'node:test';
import assert from 'node:assert/strict';
import { completedTasks } from '../services/completedTasks';
import { LOCAL_STATE_KEY } from '../services/localState';
import { CAKE_ORDER_KEY } from '../services/cakeOrder';
import { emptyNursery, NURSERY_KEY } from '../services/nurseryProject';
import { COOKING_PROGRESS_KEY, createEmptyCookingProgress } from '../services/cookingProgress';
import { neemBestellingAan, openBestellingen } from '../services/bakeryOrders';

test('opdrachtenarchief leest bestaande afrondingen en verandert geen saldo', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const cooking = neemBestellingAan(createEmptyCookingProgress(), 'kiki-kas');
  cooking.orders['kiki-kas'].status = 'geleverd';
  const state = JSON.stringify({ version: 2, balance: 91, appliedTransactions: {}, documents: {
    [COOKING_PROGRESS_KEY]: JSON.stringify(cooking),
    [CAKE_ORDER_KEY]: JSON.stringify({ delivered: true, reward: 5 }),
    [NURSERY_KEY]: JSON.stringify({ ...emptyNursery(), stage: 'complete' }),
  } });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => key === LOCAL_STATE_KEY ? state : null,
    setItem: () => { throw Error('Archief mag niet schrijven'); },
  } });
  try {
    assert.deepEqual(completedTasks().map(task => task.id), ['kiki-kas', 'cake', 'nursery']);
    assert.deepEqual(completedTasks().map(task => task.id), ['kiki-kas', 'cake', 'nursery']);
    assert.ok(!openBestellingen(cooking).some(order => order.id === 'kiki-kas'));
    assert.equal(neemBestellingAan(cooking, 'kiki-kas'), cooking);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
