import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RECIPES_BY_ID } from '../data/cooking/catalog';
import { createCookingSession, advancePreparation, updateCookingStep } from '../data/cooking/session';
import { emptyStepState, type CookingSession } from '../data/cooking/preparation';
import { emptyOven } from '../data/cooking/oven';
import { defaultCookingStorage } from '../services/cookingStorage';
import { createIsolatedCookingStorage, ISOLATED_COOKING_KEY, ISOLATED_COOKING_LOCK } from '../services/isolatedCookingStorage';
import { createEmptyCookingProgress, startJourney, saveCookingProgress, loadCookingProgress, COOKING_PROGRESS_KEY } from '../services/cookingProgress';
import { commitLocalState, LOCAL_STATE_KEY, readDocument, readLocalState } from '../services/localState';
import CookingExperience from '../components/cooking/CookingExperience';

const recipe = RECIPES_BY_ID['blueberry-muffins'];
const context = { runId: 'technical-test-run', stepId: 'cooking', cookingAttemptId: 'technical-test-cook', recipeId: recipe.id };
const now = () => '2026-11-02T12:00:00.000Z';
function finished(input: CookingSession, sugar = false): CookingSession {
  let session = structuredClone(input);
  for (const step of recipe.preparation!.steps) {
    const value = emptyStepState();
    if (step.mechanic === 'collect') value.selectedTools = step.tools.map(tool => tool.id);
    if (['repeat', 'drag', 'oven'].includes(step.mechanic)) value.count = step.target;
    if (step.mechanic === 'weigh' || step.mechanic === 'measure') value.quantity = step.target;
    if (step.mechanic === 'portion') { value.lined = Array.from({ length: step.target }, (_, i) => i); value.portions = value.lined.map(() => 1); value.choice = sugar ? 'sugar' : 'plain'; }
    session = advancePreparation(updateCookingStep(session, value), recipe);
  }
  session.oven = { ...emptyOven(), temperature: 200, actualTemperature: 200, chosenMinutes: 18, elapsedMinutes: 18,
    heatExposure: 3600, result: 'good', status: 'served', coolingElapsed: 4 };
  return session;
}
async function memory(run: (values: Map<string, string>, fail: (value: boolean) => void, lockNames: string[]) => Promise<void>) {
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const oldNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const values = new Map<string, string>(), lockNames: string[] = []; let blocked = false;
  let tail: Promise<unknown> = Promise.resolve();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { if (blocked) throw Error('full'); values.set(key, value); },
  } });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: { request: (name: string, _options: unknown, work: () => unknown) => {
    lockNames.push(name); const pending = tail.then(work); tail = pending.catch(() => undefined); return pending;
  } } } });
  try { await run(values, value => { blocked = value; }, lockNames); }
  finally {
    if (oldStorage) Object.defineProperty(globalThis, 'localStorage', oldStorage); else Reflect.deleteProperty(globalThis, 'localStorage');
    if (oldNavigator) Object.defineProperty(globalThis, 'navigator', oldNavigator); else Reflect.deleteProperty(globalThis, 'navigator');
  }
}
function seed(stock = true) {
  let progress = startJourney(createEmptyCookingProgress(), recipe);
  progress.journeys[recipe.id]!.stage = 'cooking';
  progress = defaultCookingStorage.begin(progress, recipe);
  if (stock) for (const item of recipe.ingredients) progress.inventory.consumables[item.ingredientId] = item.amount * 3;
  assert.equal(saveCookingProgress(progress), true);
  commitLocalState({ 'other-game': '{"best":12}' }, [{ id: 'existing-coins', amount: 50 }]);
  return progress;
}
async function prepare(adapter = createIsolatedCookingStorage(recipe, context, { now })) {
  const progress = adapter.begin(adapter.load(), recipe);
  assert.equal(await adapter.save(progress, true), true);
  return { adapter, progress };
}
function complete(adapter: ReturnType<typeof createIsolatedCookingStorage>) {
  const progress = adapter.load();
  const result = adapter.complete(progress, recipe, finished(progress.preparationSessions[recipe.id]));
  assert.equal(result.ok, true);
  return result.progress;
}

test('default cooking adapter retains normal session, completion and recipe reward behavior', () => memory(async () => {
  const ordinary = seed();
  const session = ordinary.preparationSessions[recipe.id];
  const result = defaultCookingStorage.complete(defaultCookingStorage.load(), recipe, finished(session));
  assert.equal(result.ok, true);
  assert.equal(await defaultCookingStorage.save(result.progress), true);
  assert.equal(loadCookingProgress().journeys[recipe.id]!.status, 'completed');
  assert.equal(readLocalState().balance, 60);
  assert.equal(readDocument(ISOLATED_COOKING_KEY), null);
  const html = renderToStaticMarkup(<CookingExperience recipe={recipe} progress={result.progress} onProgressChange={() => undefined} onClose={() => undefined} />);
  assert.match(html, /Klaar, chef!/);
}));

test('isolated storage creates a distinct attempt and resumes without resetting the normal recipe', () => memory(async () => {
  seed(); const raw = readDocument(COOKING_PROGRESS_KEY);
  const { adapter, progress } = await prepare();
  const session = progress.preparationSessions[recipe.id];
  session.steps[session.stepId] = { ...emptyStepState(), count: 1 };
  assert.equal(await adapter.save(progress), true);
  const reloaded = createIsolatedCookingStorage(recipe, context, { now });
  assert.equal(reloaded.load().preparationSessions[recipe.id].attemptId, context.cookingAttemptId);
  assert.equal(reloaded.load().preparationSessions[recipe.id].steps[session.stepId].count, 1);
  assert.equal(readDocument(COOKING_PROGRESS_KEY), raw);
  const html = renderToStaticMarkup(<CookingExperience recipe={recipe} progress={loadCookingProgress()} storageAdapter={reloaded} onProgressChange={() => undefined} onClose={() => undefined} />);
  assert.doesNotMatch(html, /Klaar, chef!/);
  assert.match(html, /Maak de oven warm/);
}));

test('isolated completion atomically consumes actual ingredients once, without ordinary completion or coins', () => memory(async () => {
  const ordinary = seed(), before = loadCookingProgress();
  const { adapter } = await prepare();
  const completed = complete(adapter);
  assert.equal(await adapter.save(completed), true);
  const after = loadCookingProgress(), receipt = adapter.receipt()!;
  assert.deepEqual(after.journeys, before.journeys);
  assert.deepEqual(after.completions, before.completions);
  assert.deepEqual(after.preparationSessions, before.preparationSessions);
  assert.equal(after.activeRecipeId, before.activeRecipeId);
  assert.equal(after.inventory.consumables.flour, ordinary.inventory.consumables.flour - 195);
  assert.equal(after.inventory.consumables.sugar, ordinary.inventory.consumables.sugar - 150);
  assert.equal(receipt.consumed.find(item => item.ingredientId === 'sugar')!.amount, 150);
  assert.equal(receipt.cookingAttemptId, context.cookingAttemptId);
  assert.equal(receipt.runId, context.runId);
  assert.equal(receipt.stepId, context.stepId);
  assert.equal(receipt.recipeId, recipe.id);
  assert.equal(readLocalState().appliedTransactions[receipt.id], 0);
  assert.equal(readLocalState().balance, 50);
  assert.equal(readDocument('other-game'), '{"best":12}');
  const raw = readDocument(COOKING_PROGRESS_KEY);
  assert.equal(await adapter.save(completed), true);
  assert.equal(readDocument(COOKING_PROGRESS_KEY), raw);
  assert.deepEqual(adapter.receipt(), receipt);
  assert.equal(adapter.begin(adapter.load(), recipe, true).preparationSessions[recipe.id].completed, true);
}));

test('failed storage commits neither consumption nor completion, then retry succeeds once', () => memory(async (values, fail) => {
  seed(); const { adapter } = await prepare(), completed = complete(adapter);
  const raw = values.get(LOCAL_STATE_KEY), input = structuredClone(completed);
  fail(true); assert.equal(await adapter.save(completed), false);
  assert.equal(values.get(LOCAL_STATE_KEY), raw);
  assert.deepEqual(completed, input);
  assert.equal(adapter.receipt(), null);
  assert.equal(adapter.load().preparationSessions[recipe.id].completed, false);
  fail(false); assert.equal(await adapter.save(completed), true);
  assert.ok(adapter.receipt());
}));

test('fresh stock and domain validation reject failed, stale and wrong attempt completions', () => memory(async () => {
  seed(); const { adapter } = await prepare(), completed = complete(adapter);
  completed.preparationSessions[recipe.id].attemptId = 'other-attempt';
  assert.equal(await adapter.save(completed), false);
  const invalid = complete(adapter); invalid.preparationSessions[recipe.id].oven!.result = 'dark';
  assert.equal(await adapter.save(invalid), false);
  const valid = complete(adapter);
  const current = loadCookingProgress(); current.inventory.consumables.flour = 0;
  assert.equal(saveCookingProgress(current), true);
  assert.equal(await adapter.save(valid), false);
  assert.equal(adapter.receipt(), null);
  assert.equal(loadCookingProgress().inventory.consumables.flour, 0);
}));

test('two tab instances with the same context serialize completion and cannot consume twice', () => memory(async (_values, _fail, locks) => {
  seed(); const { adapter: first } = await prepare();
  const second = createIsolatedCookingStorage(recipe, context, { now });
  const a = complete(first), b = complete(second), before = loadCookingProgress().inventory.consumables.flour;
  assert.deepEqual(await Promise.all([first.save(a), second.save(b)]), [true, true]);
  assert.equal(loadCookingProgress().inventory.consumables.flour, before - 195);
  assert.deepEqual(first.receipt(), second.receipt());
  assert.ok(locks.every(name => name === ISOLATED_COOKING_LOCK));
}));

test('different tab attempts use fresh shared stock and stale normal recipe saves are rejected', () => memory(async () => {
  seed(); const { adapter: first } = await prepare();
  const second = createIsolatedCookingStorage(recipe, { ...context, runId: 'second-run', cookingAttemptId: 'second-cook' }, { now });
  await prepare(second);
  const staleNormal = loadCookingProgress(), a = complete(first), b = complete(second);
  assert.deepEqual(await Promise.all([first.save(a), second.save(b)]), [true, true]);
  assert.equal(loadCookingProgress().inventory.consumables.flour, 195);
  assert.equal(saveCookingProgress(staleNormal), false);
  const before = first.load(), newer = first.load();
  assert.equal(await first.save(newer), true); // Completed retries return the same receipt, without a new stock delta.
  assert.equal(before.preparationSessions[recipe.id].completed, true);
}));

test('stale in-progress snapshots, duplicate bindings and incompatible versions cannot overwrite an attempt', () => memory(async () => {
  seed(); const { adapter } = await prepare();
  const a = adapter.load(), b = adapter.load();
  a.preparationSessions[recipe.id].seenTipIds = ['saved-tip'];
  assert.equal(await adapter.save(a), true);
  assert.equal(await adapter.save(b), false);
  assert.deepEqual(adapter.load().preparationSessions[recipe.id].seenTipIds, ['saved-tip']);
  assert.throws(() => createIsolatedCookingStorage(recipe, { ...context, cookingAttemptId: 'new-id-same-binding' }).load(), /binding-exists/);
  const changed = structuredClone(recipe); changed.preparation!.version++;
  assert.throws(() => createIsolatedCookingStorage(changed, context).load(), /incompatible/);
}));

test('unsupported locks and corrupt or unknown isolated data fail closed and preserve existing bytes', () => memory(async values => {
  seed(); const { adapter } = await prepare(), state = adapter.load();
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
  const raw = values.get(LOCAL_STATE_KEY);
  assert.equal(await adapter.save(state), false);
  assert.equal(values.get(LOCAL_STATE_KEY), raw);
  commitLocalState({ [ISOLATED_COOKING_KEY]: '{"version":99}' });
  const corrupt = values.get(LOCAL_STATE_KEY);
  assert.throws(() => adapter.load(), /invalid-isolated/);
  assert.equal(await adapter.save(state), false);
  assert.equal(values.get(LOCAL_STATE_KEY), corrupt);
}));

test('normal progress changes preserve isolated sessions and completed recipes do not auto-complete a new attempt', () => memory(async () => {
  seed(); const { adapter } = await prepare();
  const normal = loadCookingProgress();
  const result = defaultCookingStorage.complete(normal, recipe, finished(normal.preparationSessions[recipe.id]));
  assert.equal(await defaultCookingStorage.save(result.progress), true);
  assert.equal(adapter.receipt(), null);
  assert.equal(adapter.load().preparationSessions[recipe.id].completed, false);
  const rawBefore = loadCookingProgress();
  assert.equal(await adapter.save(complete(adapter)), true);
  const after = loadCookingProgress();
  assert.deepEqual(after.preparationSessions, rawBefore.preparationSessions);
  assert.deepEqual(after.completions, rawBefore.completions);
  assert.equal(readLocalState().balance, 60);
}));

test('not enough ingredients and initial storage failures do not create a completed attempt', () => memory(async (_values, fail) => {
  seed(false);
  const adapter = createIsolatedCookingStorage(recipe, context, { now });
  const first = adapter.begin(adapter.load(), recipe);
  fail(true); assert.equal(await adapter.save(first), false);
  assert.equal(readDocument(ISOLATED_COOKING_KEY), null);
  fail(false); assert.equal(await adapter.save(first), true);
  const progress = adapter.load();
  const result = adapter.complete(progress, recipe, finished(progress.preparationSessions[recipe.id]));
  assert.equal(result.ok, false);
  assert.equal(adapter.receipt(), null);
  assert.equal(adapter.load().preparationSessions[recipe.id].completed, false);
}));

test('consumption follows the completed attempt optional topping choice, not the ordinary recipe choice', () => memory(async () => {
  seed(); const { adapter } = await prepare();
  const progress = adapter.load(), before = loadCookingProgress().inventory.consumables.sugar;
  const result = adapter.complete(progress, recipe, finished(progress.preparationSessions[recipe.id], true));
  assert.equal(result.ok, true);
  assert.equal(await adapter.save(result.progress), true);
  assert.equal(loadCookingProgress().inventory.consumables.sugar, before - 163);
  assert.equal(adapter.receipt()!.consumed.find(item => item.ingredientId === 'sugar')!.amount, 163);
}));
