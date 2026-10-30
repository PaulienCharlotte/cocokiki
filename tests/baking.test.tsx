import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RECIPES_BY_ID, INGREDIENTS_BY_ID } from '../data/cooking/catalog';
import { MUFFIN_OVEN as config } from '../data/cooking/blueberryMuffins';
import { recipeSpoonStock } from '../data/cooking/recipeMeasures';
import { emptyOven, ovenCanStart, ovenResult, restoreOven, tickOven } from '../data/cooking/oven';
import { advancePreparation, createCookingSession, migrateCookingSession, stepSatisfied, updateCookingStep } from '../data/cooking/session';
import { emptyStepState, type OvenState } from '../data/cooking/preparation';
import { getRecipeIssues, getRecipeAssetPaths } from '../data/cooking/validation';
import { createEmptyCookingProgress, startJourney, saveCookingProgress, loadCookingProgress } from '../services/cookingProgress';
import { beginCookingAttempt, completeCookingAttempt } from '../services/cookingSession';
import { ingredientRequirements } from '../services/recipeInventory';
import { createShoppingSession, adjustBasket, checkoutBasket, loadShoppingSession, saveShoppingSession } from '../services/shopping';
import { SHOP_PRODUCTS_BY_ID } from '../data/shopCatalog';
import { loadCurrency } from '../services/currency';
import { MeasureInteraction, OvenInteraction, PortionInteraction } from '../components/cooking/BakingInteractions';
import { canonicalQuantity } from '../data/cooking/quantities';

const recipe = RECIPES_BY_ID['blueberry-muffins'];
const no = () => undefined;
function ready() {
  let state = startJourney(createEmptyCookingProgress(), recipe);
  state.journeys[recipe.id]!.stage = 'cooking';
  recipe.ingredients.forEach(item => { state.inventory.consumables[item.ingredientId] = item.amount; });
  return beginCookingAttempt(state, recipe);
}
function finished(sugar = false) {
  const state = ready();
  let session = state.preparationSessions[recipe.id];
  for (const step of recipe.preparation!.steps) {
    const value = emptyStepState();
    if (step.mechanic === 'collect') value.selectedTools = step.tools.map(t => t.id);
    if (['repeat', 'drag', 'oven'].includes(step.mechanic)) value.count = step.target;
    if (step.mechanic === 'weigh' || step.mechanic === 'measure') value.quantity = step.target;
    if (step.mechanic === 'portion') { value.lined = Array.from({ length: step.target }, (_, i) => i); value.portions = value.lined.map(() => 1); value.choice = sugar ? 'sugar' : 'plain'; }
    session = advancePreparation(updateCookingStep(session, value), recipe);
  }
  session.oven = { ...emptyOven(), temperature: 200, actualTemperature: 200, chosenMinutes: 18, elapsedMinutes: 18, heatExposure: 3600, result: 'good', status: 'served', coolingElapsed: config.coolingSeconds };
  state.preparationSessions[recipe.id] = session;
  return state;
}
function storage(run: () => void) {
  const old = globalThis.localStorage;
  const map = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => map.set(key, value) } });
  try { run(); } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: old }); }
}
function warm(): OvenState {
  let oven = { ...emptyOven(), temperature: 200, powered: true, status: 'preheating' as const, chosenMinutes: 18 } as OvenState;
  for (let i = 0; i < 10; i++) oven = tickOven(oven, config, 1);
  return oven;
}

test('muffin registration, education and real asset paths are complete', () => {
  assert.deepEqual(getRecipeIssues(recipe), []);
  assert.equal(recipe.servings, 10);
  assert.equal(recipe.level, 2);
  assert.equal(recipe.rewardCoins, 10);
  assert.equal(recipe.education?.math.length, 3);
  assert.equal(recipe.cookingTips?.length, 5);
  // Eentje valt tijdens het bakken, want dan staat een kind te wachten.
  assert.ok(recipe.cookingTips?.some(tip => tip.id === 'muffin-geschiedenis' && tip.triggerStepId === 'fill'));
  assert.ok(recipe.cookingTips?.every(tip => tip.character === 'coco'), 'in de keuken praat Coco');
  assert.equal(recipe.education?.nutrientMemory?.pairCount, 6);
  assert.ok(recipe.ingredients.every(i => INGREDIENTS_BY_ID[i.ingredientId].contentStatus === 'ready'));
  for (const path of getRecipeAssetPaths(recipe)) assert.ok(readFileSync(`public${path.split('?')[0]}`).length > 0, path);
});
test('all recipe amounts use matching integer stock units; spoon estimates round once', () => {
  for (const item of recipe.ingredients) { const q = canonicalQuantity(item)!; assert.ok(Number.isSafeInteger(q.amount)); assert.equal(q.unit, SHOP_PRODUCTS_BY_ID[item.ingredientId].unit); }
  assert.deepEqual(recipeSpoonStock('baking-powder', 8), { amount: 8, unit: 'gram' });
  assert.deepEqual(recipeSpoonStock('salt', 1), { amount: 2, unit: 'gram' });
  assert.deepEqual(recipeSpoonStock('vanilla-extract', 6), { amount: 8, unit: 'milliliter' });
  assert.throws(() => recipeSpoonStock('eggs', 4));
  assert.equal(recipe.ingredients.find(i => i.ingredientId === 'flour')!.amount, 195);
  assert.equal(recipe.ingredients.find(i => i.ingredientId === 'blueberry')!.amount, 200);
  assert.match(recipe.ingredients.find(i => i.ingredientId === 'milk')!.displayAmount, /circa/);
});
test('new shop products and existing packages cover the full recipe without repeat checkout', () => {
  const progress = createEmptyCookingProgress();
  let shopping = createShoppingSession('recipe', recipe.id, new Date(), 'autumn', 'muffin-checkout');
  for (const item of recipe.ingredients) shopping = adjustBasket(shopping, item.ingredientId, Math.ceil(item.amount / SHOP_PRODUCTS_BY_ID[item.ingredientId].unitAmount));
  const bought = checkoutBasket(progress, shopping, 1000);
  assert.equal(bought.status, 'success');
  assert.ok(ingredientRequirements(recipe, bought.progress).every(i => i.sufficient));
  assert.equal(checkoutBasket(bought.progress, shopping, 1000).status, 'duplicate');
  assert.equal(bought.progress.inventory.consumables.blueberry, 250);
});
test('an existing shopping basket gains new product prices without changing agreed old prices', () => storage(() => {
  const old = createShoppingSession('free', null, new Date(), 'autumn', 'existing-basket');
  for (const id of ['sunflower-oil', 'baking-powder', 'salt', 'vanilla-extract']) delete old.priceSnapshot.prices[id];
  old.priceSnapshot.prices.tomato = 17;
  old.basket.tomato = 2;
  assert.equal(saveShoppingSession(old), true);
  const restored = loadShoppingSession('free');
  assert.equal(restored.id, old.id);
  assert.equal(restored.priceSnapshot.prices.tomato, 17);
  assert.deepEqual(restored.basket, { tomato: 2 });
  assert.ok(restored.priceSnapshot.prices['vanilla-extract'] > 0);
}));
test('preheating continues independently of the current recipe step', () => {
  const oven = warm();
  assert.equal(oven.actualTemperature, 200);
  assert.equal(oven.preheated, true);
  assert.equal(oven.status, 'ready');
  assert.equal(oven.elapsedMinutes, 0);
});
test('changing temperature keeps degrees separate from the legacy heat level', () => {
  const oven = tickOven({ ...warm(), temperature: 220, preheated: false }, config, 1);
  assert.equal(oven.actualTemperature, 220);
  const session = createCookingSession(recipe);
  session.oven = oven;
  const restored = migrateCookingSession(JSON.parse(JSON.stringify(session)), recipe);
  assert.equal(restored.oven?.temperature, 220);
  assert.equal(restored.oven?.actualTemperature, 220);
});
test('baking needs a warm oven, closed door, tray and selected duration', () => {
  const base = { ...warm(), trayPlaced: true };
  assert.ok(ovenCanStart(base, config));
  for (const patch of [{ doorOpen: true }, { trayPlaced: false }, { chosenMinutes: 0 }, { powered: false }, { preheated: false }]) assert.equal(ovenCanStart({ ...base, ...patch }, config), false);
  const paused = tickOven({ ...base, status: 'baking', doorOpen: true }, config, 1);
  assert.equal(paused.elapsedMinutes, 0);
});
test('accelerated baking rises to a successful result and stops at chosen time', () => {
  let oven: OvenState = { ...warm(), trayPlaced: true, status: 'baking' };
  for (let i = 0; i < 30; i++) oven = tickOven(oven, config, 1);
  assert.equal(oven.status, 'finished');
  assert.equal(oven.result, 'good');
  assert.equal(oven.elapsedMinutes, 18);
});
test('cold, hot, short and long bakes have predictable feedback with tolerance', () => {
  const sample = (temperature: number, minutes: number) => ovenResult({ ...warm(), elapsedMinutes: minutes, heatExposure: temperature * minutes }, config);
  assert.equal(sample(160, 18), 'underdone');
  assert.equal(sample(240, 18), 'dark');
  assert.equal(sample(200, 8), 'underdone');
  assert.equal(sample(200, 30), 'dark');
  assert.equal(sample(205, 18), 'good');
});
test('an underbaked batch can finish with extra time without resetting its exposure', () => {
  let oven: OvenState = { ...warm(), trayPlaced: true, elapsedMinutes: 12, heatExposure: 2400, chosenMinutes: 15, status: 'baking' };
  for (let i = 0; i < 5; i++) oven = tickOven(oven, config, 1);
  assert.equal(oven.result, 'good');
});
test('reload retains elapsed baking but never adds offline wall-clock time', () => {
  const state = ready();
  const session = state.preparationSessions[recipe.id];
  session.oven = { ...warm(), trayPlaced: true, elapsedMinutes: 5, heatExposure: 1000, status: 'baking' };
  session.updatedAt = '2000-01-01T00:00:00Z';
  const restored = migrateCookingSession(JSON.parse(JSON.stringify(session)), recipe);
  assert.equal(restored.oven?.elapsedMinutes, 5);
  assert.equal(restored.oven?.trayPlaced, true);
  assert.equal(restored.oven?.status, 'baking');
  assert.equal(tickOven(restored.oven!, config, 0).elapsedMinutes, 5);
  assert.equal(restoreOven({ temperature: Infinity }).temperature, 0);
});
test('portion state survives reload and requires ten lined and filled cups', () => {
  const step = recipe.preparation!.steps.find(s => s.mechanic === 'portion')!;
  let session = createCookingSession(recipe);
  session.stepId = step.id;
  session = updateCookingStep(session, { lined: [0, 1, 2], portions: [1, 0, 0], choice: 'sugar' });
  const restored = migrateCookingSession(session, recipe);
  assert.deepEqual(restored.steps[step.id].lined, [0, 1, 2]);
  assert.equal(restored.steps[step.id].portions?.[0], 1);
  assert.equal(stepSatisfied(step, restored.steps[step.id]), false);
  assert.ok(stepSatisfied(step, { ...emptyStepState(), lined: Array.from({ length: 10 }, (_, i) => i), portions: Array(10).fill(1) }));
});
test('completion consumes once, rewards once and keeps optional topping when omitted', () => storage(() => {
  const state = finished();
  assert.equal(saveCookingProgress(state), true);
  const result = completeCookingAttempt(loadCookingProgress(), recipe, state.preparationSessions[recipe.id]);
  assert.equal(result.ok, true);
  assert.equal(result.progress.inventory.consumables.sugar, 13);
  assert.equal(result.progress.inventory.consumables.flour, 0);
  assert.equal(saveCookingProgress(result.progress), true);
  assert.equal(loadCurrency(), 10);
  const restored = loadCookingProgress();
  const twice = completeCookingAttempt(restored, recipe, restored.preparationSessions[recipe.id]);
  assert.strictEqual(twice.progress, restored);
  assert.equal(saveCookingProgress(twice.progress), true);
  assert.equal(loadCurrency(), 10);
}));
test('optional topping is actually consumed when selected; missing stock is atomic', () => {
  const state = finished(true);
  const result = completeCookingAttempt(state, recipe, state.preparationSessions[recipe.id]);
  assert.equal(result.ok, true);
  assert.equal(result.progress.inventory.consumables.sugar, 0);
  const missing = finished();
  missing.inventory.consumables.flour = 0;
  const before = structuredClone(missing.inventory);
  assert.equal(completeCookingAttempt(missing, recipe, missing.preparationSessions[recipe.id]).ok, false);
  assert.deepEqual(missing.inventory, before);
});
test('completion rejects an unserved or unsuccessful oven and incomplete portioning', () => {
  for (const patch of [{ result: 'dark' as const }, { status: 'baking' as const }, { trayPlaced: true }]) {
    const state = finished();
    Object.assign(state.preparationSessions[recipe.id].oven!, patch);
    assert.equal(completeCookingAttempt(state, recipe, state.preparationSessions[recipe.id]).ok, false);
  }
  const state = finished();
  state.preparationSessions[recipe.id].steps.fill.portions = [1];
  assert.equal(completeCookingAttempt(state, recipe, state.preparationSessions[recipe.id]).ok, false);
});
test('a replay starts a fresh oven, needs new stock and cannot repay the recipe reward', () => storage(() => {
  const state = finished();
  const first = completeCookingAttempt(state, recipe, state.preparationSessions[recipe.id]).progress;
  assert.equal(saveCookingProgress(first), true);
  let replay = beginCookingAttempt(loadCookingProgress(), recipe, true);
  assert.notEqual(replay.preparationSessions[recipe.id].attemptId, state.preparationSessions[recipe.id].attemptId);
  assert.equal(replay.preparationSessions[recipe.id].oven?.elapsedMinutes, 0);
  assert.equal(replay.preparationSessions[recipe.id].oven?.powered, false);
  assert.ok(ingredientRequirements(recipe, replay).some(i => !i.sufficient));
  const second = finished(true).preparationSessions[recipe.id];
  second.attemptId = replay.preparationSessions[recipe.id].attemptId;
  replay.preparationSessions[recipe.id] = second;
  assert.equal(completeCookingAttempt(replay, recipe, second).ok, false);
  recipe.ingredients.forEach(i => { replay.inventory.consumables[i.ingredientId] = i.amount; });
  const result = completeCookingAttempt(replay, recipe, second);
  assert.equal(result.ok, true);
  assert.equal(saveCookingProgress(result.progress), true);
  assert.equal(loadCurrency(), 10);
}));
test('new interactions expose keyboard alternatives and labelled native controls', () => {
  for (const step of recipe.preparation!.steps) {
    const state = emptyStepState();
    const html = step.mechanic === 'oven' ? renderToStaticMarkup(<OvenInteraction step={step} oven={emptyOven()} onOvenChange={no} onComplete={no} />)
      : step.mechanic === 'measure' ? renderToStaticMarkup(<MeasureInteraction step={step} state={state} onChange={no} onComplete={no} />)
      : step.mechanic === 'portion' ? renderToStaticMarkup(<PortionInteraction step={step} state={state} onChange={no} onComplete={no} />) : '';
    if (html) assert.match(html, /type="button"/);
  }
});
