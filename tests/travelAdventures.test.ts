import assert from 'node:assert/strict';
import test from 'node:test';
import { TRAVEL_ADVENTURES } from '../data/travel/adventures';
import { studyLocations } from '../data/learning';
import { awardCurrencyOnce, loadCurrency } from '../services/currency';
import { claimTravelAdventure, loadTravelAdventures, requestedTravelAdventure, startTravelAdventure } from '../services/travelAdventures';
import { saveTestDraft, type TestDraft } from '../services/topoTestDraft';
import { scoreTopoTest } from '../services/topoScoring';
import { completedTasks } from '../services/completedTasks';

function stored(run: (block: (value: boolean) => void) => void) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const values = new Map<string, string>(); let blocked = false;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { if (blocked) throw Error('full'); values.set(key, value); } } });
  Reflect.deleteProperty(globalThis, 'window');
  try { run(value => { blocked = value; }); } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else Reflect.deleteProperty(globalThis, 'localStorage');
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
  }
}
const adventure = TRAVEL_ADVENTURES[0];
const places = studyLocations(adventure.selection), ids = places.map(place => place.id);
function submit(overrides: Partial<TestDraft> = {}) {
  const active = loadTravelAdventures().active!;
  return saveTestDraft(ids, { answers: Object.fromEntries(places.map(place => [place.id, place.name])), submitted: true, retryIds: null, adventureAttemptId: active.attemptId, submittedAt: new Date().toISOString(), ...overrides });
}

test('Seb starts an existing nonempty card and resumes the same adventure attempt', () => stored(() => {
  assert.ok(places.length > 1);
  assert.equal(requestedTravelAdventure(`?avontuur=${adventure.id}`), undefined);
  assert.equal(startTravelAdventure('unknown'), false);
  assert.ok(startTravelAdventure(adventure.id));
  const active = loadTravelAdventures().active;
  assert.equal(requestedTravelAdventure(`?avontuur=${adventure.id}`)?.selection.areaId, 'gr');
  assert.ok(startTravelAdventure(adventure.id));
  assert.deepEqual(loadTravelAdventures().active, active);
}));

test('a saved full perfect test adds one adventure bonus on top of all practice coins and unlocks the journey', () => stored(() => {
  awardCurrencyOnce('practice-example', 12);
  assert.ok(startTravelAdventure(adventure.id)); assert.ok(submit());
  assert.deepEqual(claimTravelAdventure(adventure.id, 'gr', ids), { status: 'earned', reward: adventure.reward });
  assert.equal(loadCurrency(), 12 + adventure.reward);
  assert.equal(loadTravelAdventures().completed[adventure.id].grade, 10);
  assert.equal(completedTasks().find(item => item.id === adventure.id)?.title, adventure.title);
  assert.deepEqual(claimTravelAdventure(adventure.id, 'gr', ids), { status: 'already-earned', reward: 0 });
  assert.equal(loadCurrency(), 12 + adventure.reward);
}));

test('old scores, drafts, wrong regions, partial retries, duplicate places and imperfect answers never complete the adventure', () => stored(() => {
  assert.ok(startTravelAdventure(adventure.id));
  assert.ok(submit({ submitted: false })); assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).reward, 0);
  assert.ok(submit({ adventureAttemptId: 'previous-attempt' })); assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).reward, 0);
  assert.ok(submit({ submittedAt: new Date(Date.parse(loadTravelAdventures().active!.startedAt) - 1000).toISOString() })); assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).reward, 0);
  assert.ok(submit({ retryIds: ids.slice(0, 1) })); assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).reward, 0);
  assert.ok(submit());
  assert.equal(claimTravelAdventure(adventure.id, 'nh', ids).reward, 0);
  assert.equal(claimTravelAdventure(adventure.id, 'gr', ids.slice(1)).reward, 0);
  assert.equal(claimTravelAdventure(adventure.id, 'gr', [...ids.slice(1), ids[1]]).reward, 0);
  assert.ok(submit({ answers: Object.fromEntries(places.map((place, index) => [place.id, index ? place.name : 'wrong'])) }));
  assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).reward, 0);
  assert.equal(loadTravelAdventures().completed[adventure.id], undefined);
  assert.equal(loadCurrency(), 0);
}));

test('failed bonus storage preserves the test and permits exactly one retry', () => stored(block => {
  assert.ok(startTravelAdventure(adventure.id)); assert.ok(submit());
  block(true); assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).status, 'save-failed');
  assert.equal(loadCurrency(), 0); assert.equal(loadTravelAdventures().completed[adventure.id], undefined);
  block(false); assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).reward, adventure.reward);
  assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).reward, 0);
}));

test('shared scoring preserves the existing spelling and rounding rules', () => {
  const score = scoreTopoTest([{ id: 'a', name: 'Den Haag' }, { id: 'b', name: 'Groningen' }], { a: '  DEN   HAAG ', b: 'groningen' });
  assert.equal(score.grade, 10); assert.equal(score.correct, 2);
  assert.equal(scoreTopoTest([{ id: 'a', name: 'Den Haag' }], { a: 'wrong' }).grade, 1);
  const many = Array.from({ length: 200 }, (_, index) => ({ id: String(index), name: String(index) }));
  const rounded = scoreTopoTest(many, Object.fromEntries(many.slice(1).map(place => [place.id, place.name])));
  assert.equal(rounded.grade, 10); assert.notEqual(rounded.correct, rounded.total);
});
