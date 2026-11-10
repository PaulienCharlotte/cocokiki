import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAYABLE_ADVENTURES, scenarioAnswer } from '../data/adventures/catalog';
import { AdventureRuntime } from '../services/adventureRuntime';
import { loadAdventureState } from '../services/adventures';
import { RECIPES_BY_ID } from '../data/cooking/catalog';
import { createEmptyCookingProgress, startJourney, saveCookingProgress, loadCookingProgress } from '../services/cookingProgress';
import { commitLocalState, readLocalState, LOCAL_STATE_KEY } from '../services/localState';
import { loadCurrency } from '../services/currency';
import { createShoppingSession, adjustBasket, checkoutBasket, loadShoppingSession, saveShoppingSession } from '../services/shopping';
import { SHOP_PRODUCTS_BY_ID } from '../data/shopCatalog';
import { advancePreparation, updateCookingStep } from '../data/cooking/session';
import { emptyStepState, type CookingSession } from '../data/cooking/preparation';
import { emptyOven } from '../data/cooking/oven';

const config = PLAYABLE_ADVENTURES[0], recipe = RECIPES_BY_ID['blueberry-muffins'];
async function memory(work: (runtime: AdventureRuntime, values: Map<string, string>, fail: (blocked: boolean) => void) => Promise<void>) {
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage'), oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const values = new Map<string, string>(); let blocked = false, id = 0, tail: Promise<unknown> = Promise.resolve();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { if (blocked) throw Error('full'); values.set(key, value); } } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: { request: (_name: string, _options: unknown, action: () => unknown) => { const pending = tail.then(action); tail = pending.catch(() => undefined); return pending; } } } });
  const runtime = new AdventureRuntime(PLAYABLE_ADVENTURES, { random: () => 0, makeId: () => `run-${++id}`, now: () => new Date().toISOString() });
  try {
    const ordinary = startJourney(createEmptyCookingProgress(), recipe);
    assert.equal(saveCookingProgress(ordinary), true);
    commitLocalState({ 'other-game': '{"best":9}' }, [{ id: 'seed-test-wallet', amount: 10000 }]);
    await work(runtime, values, value => { blocked = value; });
  } finally {
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage); else Reflect.deleteProperty(globalThis, 'localStorage');
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator); else Reflect.deleteProperty(globalThis, 'navigator');
  }
}
function finished(input: CookingSession) {
  let session = structuredClone(input);
  for (const step of recipe.preparation!.steps) {
    const state = emptyStepState();
    if (step.mechanic === 'collect') state.selectedTools = step.tools.map(tool => tool.id);
    if (['repeat', 'drag', 'oven'].includes(step.mechanic)) state.count = step.target;
    if (step.mechanic === 'weigh' || step.mechanic === 'measure') state.quantity = step.target;
    if (step.mechanic === 'portion') { state.lined = Array.from({ length: step.target }, (_, i) => i); state.portions = state.lined.map(() => 1); state.choice = 'plain'; }
    session = advancePreparation(updateCookingStep(session, state), recipe);
  }
  session.oven = { ...emptyOven(), temperature: 200, actualTemperature: 200, chosenMinutes: 18, elapsedMinutes: 18, heatExposure: 3600, result: 'good', status: 'served', coolingElapsed: 4 };
  return session;
}
function buyMissing(runtime: AdventureRuntime, runId: string) {
  const run = runtime.run(runId), current = loadCookingProgress();
  let session = loadShoppingSession('recipe', recipe.id, run.id);
  for (const item of runtime.stock(run)) if (item.missing) session = adjustBasket(session, item.ingredientId, Math.ceil(item.missing / SHOP_PRODUCTS_BY_ID[item.ingredientId].unitAmount));
  if (!Object.keys(session.basket).length) return;
  saveShoppingSession(session);
  const result = checkoutBasket(current, session, loadCurrency());
  assert.equal(result.status, 'success');
  assert.equal(saveCookingProgress(result.progress, { id: `shopping:${session.id}`, amount: result.total }, { rewards: false }), true);
}
async function toBake(runtime: AdventureRuntime, runId: string) {
  await runtime.continueStory(runId);
  assert.equal(await runtime.answer(runId, scenarioAnswer(runtime.scenario(runtime.run(runId)))) , true);
  buyMissing(runtime, runId);
  assert.equal(await runtime.collect(runId), true);
  const attempt = await runtime.prepare(runId), storage = runtime.cooking(attempt), progress = storage.begin(storage.load(), recipe);
  assert.equal(await storage.save(progress, true), true);
  return { attempt, storage };
}
async function bake(runtime: AdventureRuntime, runId: string, storage: ReturnType<AdventureRuntime['cooking']>) {
  const progress = storage.load(), before = loadCookingProgress().inventory.consumables.flour;
  const result = storage.complete(progress, recipe, finished(progress.preparationSessions[recipe.id]));
  assert.equal(result.ok, true); assert.equal(await storage.save(result.progress), true);
  assert.equal(await storage.save(result.progress), true);
  assert.equal(loadCookingProgress().inventory.consumables.flour, before - 195);
  await runtime.acceptCooking(runId);
}

test('order scenarios are data-driven, correct, persisted and cannot complete on a wrong answer or reload', () => memory(async runtime => {
  assert.deepEqual(config.scenarios.map(scenarioAnswer), [5, 2, 6, 3]);
  const run = await runtime.start(config.definition.id);
  assert.equal(run.parameters.scenario, 'birthday');
  const fresh = new AdventureRuntime(PLAYABLE_ADVENTURES);
  assert.deepEqual(fresh.latest(config.definition.id), run);
  await runtime.continueStory(run.id);
  assert.equal(await runtime.answer(run.id, 99), false);
  assert.equal(runtime.run(run.id).currentStepId, 'calculate');
  assert.equal(fresh.engine.resume()!.currentStepId, 'calculate');
  assert.equal(await runtime.answer(run.id, 5), true);
  assert.equal(runtime.run(run.id).currentStepId, 'ingredients');
  await assert.rejects(runtime.deliver(run.id));
}));

test('adventure groceries preserve ordinary basket/journey, use actual stock and return to the same pending step', () => memory(async runtime => {
  const ordinary = loadCookingProgress(), basket = adjustBasket(createShoppingSession('recipe', recipe.id), 'flour', 2);
  saveShoppingSession(basket);
  const run = await runtime.start(config.definition.id);
  await runtime.continueStory(run.id); await runtime.answer(run.id, 5);
  assert.equal(await runtime.collect(run.id), false);
  buyMissing(runtime, run.id);
  assert.deepEqual(loadShoppingSession('recipe', recipe.id).basket, basket.basket);
  assert.equal(runtime.run(run.id).currentStepId, 'ingredients');
  assert.deepEqual(loadCookingProgress().journeys, ordinary.journeys);
  assert.deepEqual(loadCookingProgress().completions, ordinary.completions);
  assert.equal(await runtime.collect(run.id), true);
  assert.equal(runtime.run(run.id).currentStepId, 'bake');
}));

test('only a fresh bound cooking receipt advances the adventure; ordinary progress and inventory survive', () => memory(async runtime => {
  const ordinary = loadCookingProgress(), run = await runtime.start(config.definition.id);
  const { attempt, storage } = await toBake(runtime, run.id);
  await assert.rejects(runtime.acceptCooking(run.id), /invalid-completion/);
  const fresh = new AdventureRuntime(PLAYABLE_ADVENTURES), resumed = fresh.cooking(attempt);
  assert.equal(resumed.load().preparationSessions[recipe.id].attemptId, attempt.attemptId);
  await bake(runtime, run.id, storage);
  assert.equal(runtime.run(run.id).currentStepId, 'deliver');
  assert.deepEqual(loadCookingProgress().journeys, ordinary.journeys);
  assert.deepEqual(loadCookingProgress().preparationSessions, ordinary.preparationSessions);
  assert.deepEqual(loadCookingProgress().completions, ordinary.completions);
  assert.equal(readLocalState().documents['other-game'], '{"best":9}');
}));

test('delivery awards 30 once and 10 on replay with a different scenario, even on concurrent retries', () => memory(async runtime => {
  const first = await runtime.start(config.definition.id), firstBake = await toBake(runtime, first.id);
  await bake(runtime, first.id, firstBake.storage);
  const before = loadCurrency();
  await Promise.all([runtime.deliver(first.id), runtime.deliver(first.id)]);
  assert.equal(loadCurrency(), before + 30);
  assert.equal(runtime.run(first.id).rewardStatus, 'claimed');
  const second = await runtime.replay(first.id);
  assert.notEqual(second.parameters.scenario, first.parameters.scenario);
  const secondBake = await toBake(runtime, second.id);
  assert.notEqual(secondBake.attempt.attemptId, firstBake.attempt.attemptId);
  await assert.rejects(runtime.acceptCooking(second.id), /invalid-completion/);
  await bake(runtime, second.id, secondBake.storage);
  const nextBalance = loadCurrency();
  await runtime.deliver(second.id); await runtime.deliver(second.id);
  assert.equal(loadCurrency(), nextBalance + 10);
  assert.equal(loadAdventureState().runs.filter(run => run.status === 'completed').length, 2);
}));

test('delivery storage failure leaves both run and wallet untouched and can safely retry', () => memory(async (runtime, values, fail) => {
  const run = await runtime.start(config.definition.id), { storage } = await toBake(runtime, run.id);
  await bake(runtime, run.id, storage);
  const raw = values.get(LOCAL_STATE_KEY), coins = loadCurrency();
  fail(true); await assert.rejects(runtime.deliver(run.id), /storage-failed/);
  assert.equal(values.get(LOCAL_STATE_KEY), raw);
  assert.equal(runtime.run(run.id).status, 'active');
  fail(false); await runtime.deliver(run.id);
  assert.equal(loadCurrency(), coins + 30);
}));
