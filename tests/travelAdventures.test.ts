import { ensureTravelJourney, currentTravelStep, recordTravelStep, travelStepIds, loadTravelJourney, TRAVEL_STEP_TOTAL, type PracticeTravelStep } from '../services/travelJourney';
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


test('reis onthoudt ontdekkingen, bewaart meerdere gebieden en hervat dezelfde poging', () => stored(() => {
  assert.ok(TRAVEL_ADVENTURES.length > 1);
  assert.ok(startTravelAdventure(adventure.id));
  const attempt = loadTravelAdventures().active!;
  const run = ensureTravelJourney(adventure, attempt.attemptId)!;
  assert.equal(currentTravelStep(adventure, run), 'facts');
  const first = travelStepIds(adventure, 'facts')[0];
  assert.equal(recordTravelStep(adventure, attempt.attemptId, 'find', travelStepIds(adventure, 'find')[0]), false);
  assert.equal(recordTravelStep(adventure, attempt.attemptId, 'facts', 'unknown'), false);
  assert.ok(recordTravelStep(adventure, attempt.attemptId, 'facts', first));
  assert.ok(startTravelAdventure(TRAVEL_ADVENTURES[1].id));
  assert.ok(startTravelAdventure(adventure.id));
  assert.equal(loadTravelAdventures().active!.attemptId, attempt.attemptId);
  assert.deepEqual(loadTravelJourney(adventure)!.facts, [first]);
  assert.equal(loadCurrency(), 0);
}));

test('nieuwe reis vraagt alle stappen voor de eindbeloning en betaalt elke stap eenmaal', () => stored(() => {
  assert.ok(startTravelAdventure(adventure.id));
  const attempt = loadTravelAdventures().active!;
  assert.ok(ensureTravelJourney(adventure, attempt.attemptId));
  assert.ok(submit());
  assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).status, 'not-ready');
  for (const phase of ['facts', 'memory', 'find', 'master'] as PracticeTravelStep[]) {
    for (const id of travelStepIds(adventure, phase)) assert.ok(recordTravelStep(adventure, attempt.attemptId, phase, id));
    for (const id of travelStepIds(adventure, phase)) assert.ok(recordTravelStep(adventure, attempt.attemptId, phase, id));
  }
  assert.equal(currentTravelStep(adventure, loadTravelJourney(adventure)!), 'test');
  assert.equal(loadCurrency(), TRAVEL_STEP_TOTAL);
  assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).reward, adventure.reward);
  assert.equal(loadCurrency(), adventure.reward + TRAVEL_STEP_TOTAL);
  assert.equal(claimTravelAdventure(adventure.id, 'gr', ids).reward, 0);
}));

test('mislukt bewaren rondt geen reisstap af en betaalt niet; opnieuw proberen betaalt eenmaal', () => stored(block => {
  assert.ok(startTravelAdventure(adventure.id));
  const attempt = loadTravelAdventures().active!;
  assert.ok(ensureTravelJourney(adventure, attempt.attemptId));
  const all = travelStepIds(adventure, 'facts');
  for (const id of all.slice(0, -1)) assert.ok(recordTravelStep(adventure, attempt.attemptId, 'facts', id));
  block(true);
  assert.equal(recordTravelStep(adventure, attempt.attemptId, 'facts', all.at(-1)!), false);
  assert.equal(loadTravelJourney(adventure)!.facts.length, all.length - 1);
  assert.equal(loadCurrency(), 0);
  block(false);
  assert.ok(recordTravelStep(adventure, attempt.attemptId, 'facts', all.at(-1)!));
  assert.ok(recordTravelStep(adventure, attempt.attemptId, 'facts', all.at(-1)!));
  assert.equal(loadCurrency(), 10);
}));
