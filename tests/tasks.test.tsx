import assert from 'node:assert/strict';
import test from 'node:test';
import { dailyQuestions, loadDailyPractice, answerDaily, DAILY_REWARD } from '../services/dailyPractice';
import { dagSleutel } from '../services/quiz';
import { loadCurrency } from '../services/currency';
import { roomReturn, shopDestination } from '../services/shopNavigation';
import { claimDecorTask, decorTaskState } from '../services/decorTask';
import { commitLocalState } from '../services/localState';
import { DECOR_PRODUCTS } from '../data/decorCatalog';
import { createEmptyRoomInventory, ROOM_INVENTORY_KEY } from '../services/roomInventory';

function stored(run: (block: (value: boolean) => void) => void) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage'); const map = new Map<string, string>(); let blocked = false;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { if (blocked) throw Error('vol'); map.set(k, v); } } });
  try { run(v => { blocked = v; }); } finally { if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else Reflect.deleteProperty(globalThis, 'localStorage'); }
}
test('winkel bewaart een geldige kamer door winkelwissels en weigert externe retouradressen', () => {
  const path = shopDestination('/shop', '/treehouse/bedroom', '');
  assert.equal(path, '/shop/furniture?returnTo=%2Ftreehouse%2Fbedroom');
  assert.equal(roomReturn(new URL(path, 'https://test.invalid').search), '/treehouse/bedroom');
  assert.match(shopDestination('/shop/plants', '/shop/furniture', '?returnTo=%2Ftreehouse%2Fbedroom'), /returnTo=/);
  for (const value of ['https://evil.invalid', '/treehouse/cookbook', '/treehouse/nope', '//evil.invalid']) assert.equal(roomReturn(`?returnTo=${encodeURIComponent(value)}`), null);
  assert.equal(shopDestination('/shop', '/islands/plants', ''), '/shop');
});
test('dagelijkse reeks is vast, gevarieerd en bestaat uit vijf unieke oefeningen', () => {
  const q = dailyQuestions('2026-11-14');
  assert.equal(q.length, 5); assert.equal(new Set(q.map(q => q.id)).size, 5);
  assert.deepEqual(q, dailyQuestions('2026-11-14'));
  assert.notDeepEqual(q, dailyQuestions('2026-11-15'));
  assert.ok(q.some(q => q.bron === 'planten') && q.some(q => q.bron !== 'planten'));
});
test('dagelijkse antwoorden en dubbele beloning slaan samen op, hulp en herladen betalen niet dubbel', () => stored(block => {
  const day = dagSleutel(), q = dailyQuestions(day);
  block(true); assert.equal(answerDaily(day, q[0].id, q[0].antwoord), false); block(false);
  assert.deepEqual(loadDailyPractice().answers, {}); assert.equal(loadCurrency(), 0);
  assert.ok(answerDaily(day, q[0].id, q[0].antwoord));
  assert.equal(loadCurrency(), DAILY_REWARD);
  assert.equal(answerDaily(day, q[0].id, q[0].antwoord), false);
  assert.ok(answerDaily(day, q[1].id, q[1].antwoord, true));
  assert.equal(loadCurrency(), DAILY_REWARD);
  assert.ok(loadDailyPractice().answers[q[1].id].helped);
  assert.equal(answerDaily('2000-01-01', q[2].id, q[2].antwoord), false);
  assert.equal(answerDaily(day, q[2].id, 'geen optie'), false);
  assert.ok(answerDaily(day, q[2].id, q[2].opties.find(a => a !== q[2].antwoord)!));
  assert.equal(loadCurrency(), DAILY_REWARD);
}));
test('inrichtopdracht controleert echte plaatsingen en beloont eenmaal', () => stored(() => {
  assert.equal(claimDecorTask(), false);
  const inventory = createEmptyRoomInventory();
  const products = [DECOR_PRODUCTS.find(p => p.category === 'seating')!, DECOR_PRODUCTS.find(p => p.category === 'tables')!, DECOR_PRODUCTS.find(p => p.store === 'plants')!];
  products.forEach((p, i) => { inventory.owned[p.id] = 1; inventory.placements.push({ id: `test-${i}`, productId: p.id, room: 'living-room', x: 40, y: 60, view: 0, scale: 1 }); });
  assert.equal(commitLocalState({ [ROOM_INVENTORY_KEY]: JSON.stringify(inventory) }).status, 'applied'); assert.ok(decorTaskState().ready);
  assert.ok(claimDecorTask()); assert.equal(loadCurrency(), 15); assert.equal(claimDecorTask(), false);
}));

test('opdrachtantwoorden gebruiken losse knoppen en Winkelgekte toont geen overbodige hulpmiddelen', async () => {
  const React = await import('react');
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { default: ChoiceList } = await import('../components/ui/ChoiceList');
  const { MathHeader } = await import('../games/math/MathControls');
  const { emptyMathProgress } = await import('../games/math/progress');
  const choices = renderToStaticMarkup(React.createElement(ChoiceList, { layout: 'buttons', choices: [{ id: 'a', label: 'Eerste' }, { id: 'b', label: 'Tweede' }], onChoose: () => {} }));
  assert.match(choices, /ck-answer-buttons/); assert.equal((choices.match(/<button/g) ?? []).length, 2);
  const header = renderToStaticMarkup(React.createElement(MathHeader, { game: 'race', level: 1, progress: emptyMathProgress(), onBack: () => {}, onLevel: () => {}, onSound: () => {} }));
  assert.doesNotMatch(header, /Maten omrekenen|Geluid aanzetten|Geluid uitzetten/);
});
