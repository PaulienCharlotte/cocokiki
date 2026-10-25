import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EQUIPMENT_BY_ID, INGREDIENTS_BY_ID, RECIPES_BY_ID } from '../data/cooking/catalog';
import { INGREDIENT_DISCOVERIES_BY_ID } from '../data/cooking/discovery';
import { getRecipeAccess } from '../data/cooking/availability';
import { getRecipeAssetPaths, getRecipeIssues } from '../data/cooking/validation';
import { advancePreparation, updateCookingStep } from '../data/cooking/session';
import { SHOP_PRODUCTS_BY_ID } from '../data/shopCatalog';
import type { CookingProgressState, MathChallengeConfig } from '../data/cooking/types';
import { beginCookingAttempt, completeCookingAttempt } from '../services/cookingSession';
import { ingredientRequirements } from '../services/recipeInventory';
import {
  advanceJourney, answerDiscoveryQuestion, beginDiscoveryStage, collectCurrentIngredient,
  continueMathChallenges, createEmptyCookingProgress, loadCookingProgress, migrateCookingProgress,
  saveCookingProgress, showDiscoveryQuestion, showIngredientCollection, startJourney,
  startMathChallenges, submitMathChallenge,
} from '../services/cookingProgress';
import { adjustBasket, checkoutBasket, createShoppingSession, recipeRequirementStatus } from '../services/shopping';
import { awardCurrencyOnce, CURRENCY_KEY, loadCurrency } from '../services/currency';
import CookingExperience from '../components/cooking/CookingExperience';
import MathChallengeFlow from '../components/cooking/MathChallengeFlow';

const recipe = RECIPES_BY_ID['fruit-yogurt'];
const banana = RECIPES_BY_ID['banana-pancakes'];
function unlocked() {
  const state = createEmptyCookingProgress();
  state.completions[banana.id] = { recipeId: banana.id, completedAt: '2026-10-25', rewardClaimed: false };
  state.discoveredIngredientIds = ['banana'];
  return state;
}
function ready() {
  const state = startJourney(unlocked(), recipe);
  state.journeys[recipe.id]!.stage = 'cooking';
  state.inventory.consumables = { yogurt: 500, strawberry: 250, banana: 2, oats: 40 };
  return beginCookingAttempt(state, recipe);
}
function finish(state: CookingProgressState) {
  let session = state.preparationSessions[recipe.id];
  for (const step of recipe.preparation!.steps) {
    session = advancePreparation(updateCookingStep(session, { count: step.target }), recipe);
  }
  return session;
}
function storage(run: () => void) {
  const previous = globalThis.localStorage;
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  } });
  try { run(); } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous }); }
}
function answerFor(challenge: MathChallengeConfig) {
  if (challenge.type === 'quantity-selection') return challenge.correctQuantity;
  if (challenge.type === 'interactive-weighing') return challenge.targetGrams;
  if (challenge.type === 'recipe-scaling') return Object.fromEntries(challenge.quantities.map(item => [item.ingredientId, item.target]));
  return challenge.actions.map(item => item.id);
}

test('fruit yogurt is ready, uses real assets, and unlocks after one distinct recipe', () => {
  assert.deepEqual(getRecipeIssues(recipe), []);
  assert.equal(getRecipeAccess(recipe, createEmptyCookingProgress()).locked, true);
  assert.equal(getRecipeAccess(recipe, unlocked()).playable, true);
  assert.deepEqual(recipe.ingredients.map(item => [item.ingredientId, item.amount, item.unit]), [
    ['yogurt', 150, 'milliliter'], ['strawberry', 75, 'gram'], ['banana', 1, 'piece'],
  ]);
  assert.equal(recipe.rewardCoins, 10);
  assert.deepEqual(recipe.preparation!.steps.map(step => step.mechanic), ['drag', 'drag', 'drag', 'repeat', 'drag']);
  assert.equal(new Set(recipe.preparation!.steps.map(step => step.id)).size, 5);
  for (const item of recipe.ingredients) assert.equal(INGREDIENTS_BY_ID[item.ingredientId].contentStatus, 'ready');
  for (const id of recipe.equipmentIds) assert.ok(EQUIPMENT_BY_ID[id]);
  for (const asset of getRecipeAssetPaths(recipe)) assert.ok(existsSync(`public${asset.split('?')[0]}`), asset);
  for (const name of ['banana-slices', 'strawberries', 'yogurt-bowl']) {
    const bytes = readFileSync(`public/assets/library/cooking/fruit-yogurt/${name}.png`);
    assert.ok(bytes.readUInt32BE(16) > 1000);
    assert.equal(bytes[25], 6, 'Supplied PNG keeps its RGBA transparency');
  }
  const missing = { ...recipe, preparation: { ...recipe.preparation!, finishedAsset: '/missing.png' } };
  assert.equal(getRecipeAccess(missing, unlocked()).playable, false);
});

test('fruit yogurt discoveries have valid answers and never reward the known banana again', () => {
  let state = beginDiscoveryStage(startJourney(unlocked(), recipe), recipe.id);
  let reward = 0;
  for (const item of recipe.ingredients) {
    const config = INGREDIENT_DISCOVERIES_BY_ID[item.ingredientId];
    for (const question of config.questions) {
      assert.ok(question.options.some(option => option.id === question.correctOptionId));
      state = showDiscoveryQuestion(state, recipe.id);
      const result = answerDiscoveryQuestion(state, recipe.id, question.correctOptionId);
      assert.equal(result.correct, true);
      if (item.ingredientId === 'banana') assert.equal(result.coinDelta, 0);
      reward += result.coinDelta;
      state = collectCurrentIngredient(showIngredientCollection(result.progress, recipe.id), recipe.id);
    }
  }
  assert.equal(reward, 10);
  assert.equal(state.journeys[recipe.id]!.discovery.step, 'complete');
  assert.deepEqual(new Set(state.discoveredIngredientIds), new Set(['banana', 'yogurt', 'strawberry']));
});

test('all fruit yogurt educational challenges work through existing challenge types', () => {
  let state = startJourney(unlocked(), recipe);
  state.journeys[recipe.id]!.stage = 'challenges';
  state = startMathChallenges(state, recipe.id);
  for (const challenge of recipe.education!.math) {
    const result = submitMathChallenge(state, recipe.id, answerFor(challenge));
    assert.equal(result.correct, true, challenge.id);
    state = continueMathChallenges(result.progress, recipe.id).progress;
  }
  assert.equal(state.journeys[recipe.id]!.math.step, 'complete');
  const initial = startJourney(unlocked(), recipe);
  initial.journeys[recipe.id]!.stage = 'challenges';
  const html = renderToStaticMarkup(<MathChallengeFlow recipe={recipe} progress={startMathChallenges(initial, recipe.id)} onProgressChange={() => undefined} onExit={() => undefined} />);
  assert.match(html, /ml/);
  assert.match(html, /Aantal yoghurt vermeerderen/);
});

test('yogurt mass stock migrates once without converting grams to milliliters', () => storage(() => {
  const old = unlocked();
  delete old.inventory.quantitySchemaVersion;
  old.inventory.consumables = { yogurt: 500, strawberry: 250, banana: 1 };
  old.inventory.acquisitions = [{ id: 'old', productId: 'yogurt', quantity: 500, unit: 'gram', packageLabel: '500 g', transactionId: 'old', acquiredAt: '2026-10-24' }];
  const migrated = migrateCookingProgress(old);
  assert.equal(migrated.inventory.consumables['yogurt-grams'], 500);
  assert.equal(migrated.inventory.consumables.yogurt, undefined);
  assert.equal(ingredientRequirements(recipe, migrated)[0].sufficient, false);
  assert.deepEqual(migrated.inventory.acquisitions, old.inventory.acquisitions);
  assert.equal(saveCookingProgress(migrated), true);
  assert.deepEqual(loadCookingProgress().inventory, migrated.inventory);
  assert.equal(SHOP_PRODUCTS_BY_ID['yogurt-grams'].unit, 'gram');
}));

test('fruit yogurt checkout uses compatible packages and commits stock and wallet together', () => storage(() => {
  awardCurrencyOnce('test-seed', 100);
  let session = createShoppingSession('recipe', recipe.id, new Date('2026-10-25'), 'autumn', 'fruit-test');
  for (const item of recipe.ingredients) session = adjustBasket(session, item.ingredientId, 1);
  const state = startJourney(unlocked(), recipe);
  assert.ok(recipeRequirementStatus(state, recipe.id, session).every(item => item.collected));
  const checkout = checkoutBasket(state, session, loadCurrency());
  assert.equal(checkout.status, 'success');
  assert.equal(checkout.total, 43);
  assert.deepEqual(checkout.progress.inventory.consumables, { yogurt: 500, strawberry: 250, banana: 1 });
  assert.equal(saveCookingProgress(checkout.progress, { id: session.id, amount: checkout.total }), true);
  assert.equal(loadCurrency(), 57);
  assert.equal(checkoutBasket(loadCookingProgress(), session, loadCurrency()).status, 'duplicate');
  assert.equal(SHOP_PRODUCTS_BY_ID.yogurt.unit, 'milliliter');
}));

test('fruit yogurt completion consumes once, resumes after reload and pays once across replay', () => storage(() => {
  const state = ready();
  assert.equal(saveCookingProgress(state), true);
  let session = state.preparationSessions[recipe.id];
  session = advancePreparation(updateCookingStep(session, { count: 1 }), recipe);
  state.preparationSessions[recipe.id] = session;
  assert.equal(saveCookingProgress(state), true);
  const restored = loadCookingProgress();
  assert.equal(restored.preparationSessions[recipe.id].stepId, 'add-strawberries');
  const result = completeCookingAttempt(restored, recipe, finish(restored));
  assert.equal(result.ok, true);
  assert.equal(saveCookingProgress(result.progress), true);
  assert.deepEqual(result.progress.inventory.consumables, { yogurt: 350, strawberry: 175, banana: 1, oats: 40 });
  assert.equal(loadCurrency(), 10);
  assert.equal(completeCookingAttempt(result.progress, recipe, finish(restored)).progress, result.progress);
  assert.equal(saveCookingProgress(loadCookingProgress()), true);
  assert.equal(loadCurrency(), 10);
  const replay = beginCookingAttempt(loadCookingProgress(), recipe, true);
  assert.notEqual(replay.preparationSessions[recipe.id].attemptId, session.attemptId);
  const repeated = completeCookingAttempt(replay, recipe, finish(replay));
  assert.equal(repeated.ok, true);
  assert.equal(saveCookingProgress(repeated.progress), true);
  assert.equal(loadCurrency(), 10);
  assert.deepEqual(loadCookingProgress().inventory.consumables, { yogurt: 200, strawberry: 100, banana: 0, oats: 40 });
  assert.ok(loadCookingProgress().completions[banana.id]);
  assert.ok(JSON.parse(localStorage.getItem(CURRENCY_KEY)!).appliedTransactions['cooking-complete:fruit-yogurt']);
}));

test('insufficient yogurt ingredients cannot partially consume or complete an unfinished step', () => {
  const state = ready();
  state.inventory.consumables.strawberry = 74;
  const snapshot = structuredClone(state);
  assert.equal(completeCookingAttempt(state, recipe, finish(state)).ok, false);
  assert.deepEqual(state, snapshot);
  assert.equal(completeCookingAttempt(state, recipe, state.preparationSessions[recipe.id]).ok, false);
  const html = renderToStaticMarkup(<CookingExperience recipe={recipe} progress={state} onProgressChange={() => undefined} onClose={() => undefined} />);
  assert.match(html, /Schenk 150 ml yoghurt/);
  assert.match(html, /Je hebt nog 1 g aardbei nodig/);
  assert.deepEqual(getRecipeIssues(banana), []);
  assert.equal(banana.preparation!.steps.length, 11);
});
