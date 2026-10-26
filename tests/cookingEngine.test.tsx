import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RECIPES_BY_ID } from '../data/cooking/catalog';
import type { RecipeConfig, CookingProgressState } from '../data/cooking/types';
import { canonicalQuantity, convertQuantity } from '../data/cooking/quantities';
import { advancePreparation, createCookingSession, migrateCookingSession, updateCookingStep } from '../data/cooking/session';
import { emptyStepState } from '../data/cooking/preparation';
import { getRecipeAssetPaths, getRecipeIssues } from '../data/cooking/validation';
import { COOKING_SESSION_KEY } from '../data/cooking/bananaPancakeCooking';
import { COOKING_PROGRESS_KEY, createEmptyCookingProgress, loadCookingProgress, saveCookingProgress, startJourney, restartJourney } from '../services/cookingProgress';
import { beginCookingAttempt, completeCookingAttempt } from '../services/cookingSession';
import { ingredientRequirements } from '../services/recipeInventory';
import { awardCurrencyOnce, CURRENCY_KEY, CURRENCY_LEDGER_KEY, loadCurrency, spendCurrencyOnce } from '../services/currency';
import { readDocument } from '../services/localState';
import { createEmptyRoomInventory, addRoomPurchasesOnce, loadRoomInventory, ROOM_INVENTORY_KEY } from '../services/roomInventory';
import CookingExperience from '../components/cooking/CookingExperience';

const recipe = RECIPES_BY_ID['banana-pancakes'];
function memoryStorage(run: (memory: Map<string, string>, fail: (value: boolean) => void) => void) {
  const original = globalThis.localStorage;
  const memory = new Map<string, string>();
  let failed = false;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { if (failed) throw new Error('Storage full'); memory.set(key, value); },
  } });
  try { run(memory, value => { failed = value; }); }
  finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original }); }
}
function ready(config = recipe): CookingProgressState {
  const state = startJourney(createEmptyCookingProgress(), config);
  state.journeys[config.id]!.stage = 'cooking';
  for (const ingredient of config.ingredients) state.inventory.consumables[ingredient.ingredientId] = ingredient.amount;
  return beginCookingAttempt(state, config);
}
function finishSteps(state: CookingProgressState, config = recipe) {
  let session = state.preparationSessions[config.id];
  for (const step of config.preparation!.steps) {
    const value = emptyStepState();
    if (step.mechanic === 'collect') value.selectedTools = step.tools.map(tool => tool.id);
    if (step.mechanic === 'repeat' || step.mechanic === 'drag' || step.mechanic === 'heat') value.count = step.target;
    if (step.mechanic === 'weigh') value.quantity = step.target;
    if (step.mechanic === 'heat') value.heat = step.target;
    if (step.mechanic === 'timed') { value.phase = 'flip'; value.readyAt = 0; }
    if (step.mechanic === 'optional') value.choice = step.choices[0].id;
    session = advancePreparation(updateCookingStep(session, value), config);
  }
  return session;
}

test('quantities normalize mass and volume, never pieces into grams', () => {
  assert.deepEqual(canonicalQuantity({ amount: .075, unit: 'kilogram' }), { amount: 75, unit: 'gram' });
  assert.equal(convertQuantity({ amount: .5, unit: 'liter' }, 'milliliter'), 500);
  assert.equal(convertQuantity({ amount: 5, unit: 'piece' }, 'gram'), null);
  assert.equal(convertQuantity({ amount: 100, unit: 'gram' }, 'milliliter'), null);
  assert.equal(canonicalQuantity({ amount: NaN, unit: 'gram' }), null);
  assert.equal(canonicalQuantity({ amount: -.5, unit: 'piece' }), null);
});
test('duplicate purchases cannot restore stale ownership documents', () => memoryStorage(() => {
  awardCurrencyOnce('seed', 100);
  assert.equal(spendCurrencyOnce('purchase', 10, { test: 'first' }).status, 'applied');
  assert.equal(spendCurrencyOnce('purchase', 10, { test: 'stale' }).status, 'duplicate');
  assert.equal(readDocument('test'), 'first');
  assert.equal(loadCurrency(), 90);
}));
test('a damaged legacy preparation does not discard valid stock', () => memoryStorage(memory => {
  const state = ready();
  state.preparationSessions = {};
  memory.set(COOKING_PROGRESS_KEY, JSON.stringify(state));
  memory.set(COOKING_SESSION_KEY, '{invalid');
  assert.deepEqual(loadCookingProgress().inventory, state.inventory);
  assert.equal(loadCookingProgress().activeRecipeId, recipe.id);
}));
test('changing a reward does not block saves or pay an existing completion twice', () => memoryStorage(() => {
  const state = ready();
  const completed = completeCookingAttempt(state, recipe, finishSteps(state)).progress;
  assert.equal(saveCookingProgress(completed), true);
  const balance = loadCurrency();
  const previous = recipe.rewardCoins;
  try {
    recipe.rewardCoins = 25;
    assert.equal(saveCookingProgress(loadCookingProgress()), true);
    assert.equal(loadCurrency(), balance);
  } finally { recipe.rewardCoins = previous; }
}));
test('recipe stock rejects mismatched units and counts package quantities', () => {
  const state = createEmptyCookingProgress();
  state.inventory.consumables.strawberry = 250;
  const invalid = { ...recipe, ingredients: [{ ingredientId: 'strawberry', amount: 5, unit: 'piece' as const, displayAmount: '5 aardbeien' }] };
  assert.equal(ingredientRequirements(invalid, state)[0].sufficient, false);
  const valid = { ...invalid, ingredients: [{ ...invalid.ingredients[0], amount: 75, unit: 'gram' as const }] };
  assert.equal(ingredientRequirements(valid, state)[0].sufficient, true);
});
test('completion consumes all ingredients once; insufficient stock consumes none', () => {
  const state = ready();
  const finished = finishSteps(state);
  const missing = structuredClone(state);
  missing.inventory.consumables.eggs = 1;
  const failure = completeCookingAttempt(missing, recipe, finished);
  assert.equal(failure.ok, false);
  assert.equal(failure.progress, missing);
  assert.deepEqual(missing.inventory.consumables, { banana: 1, eggs: 1, oats: 40 });
  const result = completeCookingAttempt(state, recipe, finished);
  assert.equal(result.ok, true);
  assert.deepEqual(result.progress.inventory.consumables, { banana: 0, eggs: 0, oats: 0 });
  assert.equal(completeCookingAttempt(result.progress, recipe, finished).progress, result.progress);
  assert.deepEqual(state.inventory.consumables, { banana: 1, eggs: 2, oats: 40 });
});
test('actions must meet completion conditions; timed cooking survives reload', () => {
  const state = ready();
  const initial = state.preparationSessions[recipe.id];
  assert.equal(advancePreparation(initial, recipe), initial);
  const forged = { ...initial, completedStepIds: recipe.preparation!.steps.map(step => step.id) };
  assert.equal(completeCookingAttempt(state, recipe, forged).ok, false);
  const session = finishSteps(state);
  session.completedStepIds = recipe.preparation!.steps.slice(0, 8).map(step => step.id);
  session.stepId = 'cook';
  session.steps.cook = { ...emptyStepState(), phase: 'wait', readyAt: 5000 };
  const restored = migrateCookingSession(JSON.parse(JSON.stringify(session)), recipe);
  assert.equal(restored.stepId, 'cook');
  assert.equal(advancePreparation(updateCookingStep(restored, { phase: 'flip' }), recipe, 4000).stepId, 'cook');
  assert.equal(advancePreparation(updateCookingStep(restored, { phase: 'flip' }), recipe, 5000).stepId, 'serve');
});
test('wallet, completion and inventory commit atomically; retries and reload do not duplicate rewards', () => memoryStorage((memory, fail) => {
  memory.set(CURRENCY_KEY, '20');
  const state = ready();
  assert.equal(saveCookingProgress(state), true);
  const completed = completeCookingAttempt(loadCookingProgress(), recipe, finishSteps(state)).progress;
  const before = memory.get(CURRENCY_KEY);
  fail(true);
  assert.equal(saveCookingProgress(completed), false);
  assert.equal(memory.get(CURRENCY_KEY), before);
  assert.equal(loadCurrency(), 20);
  fail(false);
  assert.equal(saveCookingProgress(completed), true);
  assert.equal(loadCurrency(), 30);
  const reloaded = loadCookingProgress();
  assert.equal(reloaded.preparationSessions[recipe.id].completed, true);
  assert.equal(saveCookingProgress(reloaded), true);
  assert.equal(loadCurrency(), 30);
  assert.equal(reloaded.inventory.consumables.eggs, 0);
}));
test('legacy balances, ledger and prepaid cooking sessions migrate without double consumption', () => memoryStorage(memory => {
  const old = ready();
  delete old.preparationSessions[recipe.id];
  old.inventory.consumables = {};
  old.journeys[recipe.id]!.consumedIngredientIds = recipe.ingredients.map(item => item.ingredientId);
  memory.set(CURRENCY_KEY, '77');
  memory.set(CURRENCY_LEDGER_KEY, JSON.stringify({ version: 1, appliedTransactions: { previous: 12 } }));
  memory.set(COOKING_PROGRESS_KEY, JSON.stringify(old));
  memory.set(COOKING_SESSION_KEY, JSON.stringify({ version: 1, stepIndex: 9, ingredientsConsumed: true }));
  const restored = loadCookingProgress();
  assert.equal(restored.preparationSessions[recipe.id].stepId, 'serve');
  const finished = finishSteps({ ...restored, preparationSessions: { [recipe.id]: createCookingSession(recipe) } });
  finished.attemptId = restored.preparationSessions[recipe.id].attemptId;
  assert.equal(completeCookingAttempt(restored, recipe, finished).ok, true);
  assert.equal(saveCookingProgress(restored), true);
  assert.equal(loadCurrency(), 77);
  assert.equal(awardCurrencyOnce('previous', 12).applied, false);
  assert.ok(memory.get(COOKING_SESSION_KEY));
}));
test('replay gets a fresh attempt, preserves achievements, and never rewards a recipe twice', () => memoryStorage(() => {
  const state = ready();
  const completed = completeCookingAttempt(state, recipe, finishSteps(state)).progress;
  assert.equal(saveCookingProgress(completed), true);
  const replay = beginCookingAttempt(loadCookingProgress(), recipe, true);
  assert.notEqual(replay.preparationSessions[recipe.id].attemptId, state.preparationSessions[recipe.id].attemptId);
  assert.ok(replay.completions[recipe.id]);
  assert.equal(completeCookingAttempt(replay, recipe, finishSteps(replay)).ok, false);
  for (const item of recipe.ingredients) replay.inventory.consumables[item.ingredientId] = item.amount;
  const result = completeCookingAttempt(replay, recipe, finishSteps(replay));
  assert.equal(result.ok, true);
  assert.equal(saveCookingProgress(result.progress), true);
  assert.equal(loadCurrency(), 10);
}));
test('two data-defined recipes use the same engine and keep sessions independent', () => {
  const second: RecipeConfig = { ...recipe, cookingTips: [], id: 'test-only-second-recipe', name: 'Testrecept', preparation: { ...recipe.preparation!, steps: [{ id: 'transfer', title: 'Verplaats', instruction: 'Naar de kom', station: 'worktop', mechanic: 'drag', asset: recipe.image, hint: 'Sleep', target: 1, dropTarget: { sourceLabel: 'Ingrediënt', label: 'Kom' } }] } };
  RECIPES_BY_ID[second.id] = second;
  try {
    let state = ready();
    const firstSession = structuredClone(state.preparationSessions[recipe.id]);
    state = startJourney(state, second);
    state.journeys[second.id]!.stage = 'cooking';
    state = beginCookingAttempt(state, second);
    const result = completeCookingAttempt(state, second, finishSteps(state, second));
    assert.equal(result.ok, true);
    assert.deepEqual(result.progress.preparationSessions[recipe.id], firstSession);
    assert.equal(startJourney(result.progress, recipe).activeRecipeId, recipe.id);
    const restart = restartJourney(result.progress, recipe);
    assert.deepEqual(restart.preparationSessions[second.id], result.progress.preparationSessions[second.id]);
    assert.match(renderToStaticMarkup(<CookingExperience recipe={second} progress={state} onProgressChange={() => undefined} onClose={() => undefined} />), /Verplaats/);
  } finally { delete RECIPES_BY_ID[second.id]; }
});
test('readiness requires real gameplay, education and existing visual assets', () => {
  assert.deepEqual(getRecipeIssues(recipe), []);
  for (const path of getRecipeAssetPaths(recipe)) assert.ok(existsSync(`public${path.split('?')[0]}`), path);
  assert.ok(getRecipeIssues({ ...recipe, preparation: undefined }).includes('preparation-missing'));
  assert.ok(getRecipeIssues({ ...recipe, education: { math: [] } }).includes('math-missing'));
  assert.ok(getRecipeIssues({ ...recipe, image: '/missing-image.webp' }).includes('asset-missing'));
  assert.ok(getRecipeIssues(RECIPES_BY_ID['oat-muffins']).length > 0);
});
test('decoration checkout is atomic and cannot spend coins without ownership', () => memoryStorage((memory, fail) => {
  memory.set(CURRENCY_KEY, '100');
  const inventory = addRoomPurchasesOnce(createEmptyRoomInventory(), 'decor:one', { 'rose-pouf': 1 });
  const documents = { [ROOM_INVENTORY_KEY]: JSON.stringify(inventory) };
  fail(true);
  assert.equal(spendCurrencyOnce('decor:one', 30, documents).status, 'invalid');
  assert.equal(loadCurrency(), 100);
  assert.equal(loadRoomInventory().owned['rose-pouf'], undefined);
  fail(false);
  assert.equal(spendCurrencyOnce('decor:one', 30, documents).status, 'applied');
  assert.equal(loadCurrency(), 70);
  assert.equal(loadRoomInventory().owned['rose-pouf'], 1);
  assert.ok(readDocument(ROOM_INVENTORY_KEY));
}));
test('stale cooking snapshots cannot overwrite newer saved inventory', () => memoryStorage(() => {
  const state = ready();
  assert.equal(saveCookingProgress(state), true);
  const stale = loadCookingProgress();
  const fresh = loadCookingProgress();
  fresh.inventory.consumables.eggs = 20;
  assert.equal(saveCookingProgress(fresh), true);
  assert.equal(saveCookingProgress(stale), false);
  assert.equal(loadCookingProgress().inventory.consumables.eggs, 20);
}));
