import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import RecipeCard from '../components/cooking/RecipeCard';
import RecipeOverviewDialog from '../components/cooking/RecipeOverviewDialog';
import IngredientDiscoveryFlow from '../components/cooking/IngredientDiscoveryFlow';
import MathChallengeFlow from '../components/cooking/MathChallengeFlow';
import { createCookingSession, goBackPreparation, migrateCookingSession, resumePreparation } from '../data/cooking/session';
import { EQUIPMENT, INGREDIENTS, RECIPES, RECIPES_BY_ID, getCompletedRecipes } from '../data/cooking/catalog';
import { getRecipeAccess } from '../data/cooking/availability';
import { INGREDIENT_DISCOVERIES, INGREDIENT_DISCOVERIES_BY_ID } from '../data/cooking/discovery';
import { BANANA_PANCAKE_MATH_CHALLENGES, MATH_COMPLETION_BONUS } from '../data/cooking/mathChallenges';
import { advanceCookingSession, BANANA_PANCAKE_STEPS, createBananaPancakeSession, migrateBananaPancakeSession } from '../data/cooking/bananaPancakeCooking';
import type { CookingProgressState, MathChallengeConfig, RecipeConfig } from '../data/cooking/types';
import {
  addConsumable,
  addEquipment,
  advanceJourney,
  answerDiscoveryQuestion,
  beginDiscoveryStage,
  collectCurrentIngredient,
  completeJourney,
  continueMathChallenges,
  completeNutrientMemory,
  createDiscoveryReplay,
  createMathReplay,
  consumeIngredient,
  createEmptyCookingProgress,
  discoverIngredient,
  migrateCookingProgress,
  nextRequiredStage,
  restartJourney,
  showDiscoveryQuestion,
  showIngredientCollection,
  skipKnownIngredient,
  startMathChallenges,
  startJourney,
  submitMathChallenge,
  validateMathChallengeAnswer,
} from '../services/cookingProgress';
import { awardCurrencyOnce, CURRENCY_KEY, CURRENCY_LEDGER_KEY, spendCurrencyOnce } from '../services/currency';
import { cocoCoinsToEuros, getProductPrice } from '../data/shopPricing';
import { adjustBasket, basketTotal, checkoutBasket, createShoppingSession, loadShoppingSession, recipeRequirementStatus, saveShoppingSession } from '../services/shopping';

function mathReadyProgress(recipe: RecipeConfig = RECIPES_BY_ID['banana-pancakes']): CookingProgressState {
  let state = startJourney(createEmptyCookingProgress(), recipe);
  state = advanceJourney(state, recipe.id, 'discovery');
  state = recipe.ingredients.reduce((next, item) => discoverIngredient(next, recipe.id, item.ingredientId), state);
  state = advanceJourney(state, recipe.id, 'nutrient-memory');
  return completeNutrientMemory(state, recipe.id, recipe.education!.nutrientMemory!.activityId);
}

function correctMathAnswer(challenge: MathChallengeConfig) {
  if (challenge.type === 'quantity-selection') return challenge.correctQuantity;
  if (challenge.type === 'recipe-scaling') return Object.fromEntries(challenge.quantities.map(item => [item.ingredientId, item.target]));
  if (challenge.type === 'interactive-weighing') return challenge.targetGrams;
  return challenge.actions.map(action => action.id);
}

function completeMath(progress: CookingProgressState) {
  let state = startMathChallenges(progress, 'banana-pancakes');
  let coins = 0;
  while (state.journeys['banana-pancakes']?.math.step !== 'complete') {
    const index = state.journeys['banana-pancakes']?.math.currentChallengeIndex ?? 0;
    const challenge = BANANA_PANCAKE_MATH_CHALLENGES[index];
    const answer = submitMathChallenge(state, 'banana-pancakes', correctMathAnswer(challenge));
    assert.equal(answer.correct, true);
    coins += answer.coinDelta;
    const continued = continueMathChallenges(answer.progress, 'banana-pancakes');
    state = continued.progress;
    coins += continued.coinDelta;
  }
  return { state, coins };
}

test('cooking catalog has unique ids and valid references', () => {
  assert.equal(new Set(RECIPES.map(item => item.id)).size, RECIPES.length);
  assert.equal(new Set(INGREDIENTS.map(item => item.id)).size, INGREDIENTS.length);
  assert.equal(new Set(EQUIPMENT.map(item => item.id)).size, EQUIPMENT.length);
  const ingredientIds = new Set(INGREDIENTS.map(item => item.id));
  const equipmentIds = new Set(EQUIPMENT.map(item => item.id));
  for (const recipe of RECIPES) {
    assert.equal(new Set(recipe.actions.map(action => action.id)).size, recipe.actions.length);
    assert.ok(recipe.ingredients.every(item => ingredientIds.has(item.ingredientId)));
    assert.ok(recipe.equipmentIds.every(id => equipmentIds.has(id)));
  }
});

test('banana pancakes preserve the exact MVP quantities and eleven actions', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  assert.deepEqual(recipe.ingredients.map(item => [item.ingredientId, item.amount, item.unit]), [
    ['banana', 1, 'piece'], ['eggs', 2, 'piece'], ['oats', 40, 'gram'],
  ]);
  assert.equal(recipe.servings, 2);
  assert.equal(recipe.preparationMinutes, 15);
  assert.equal(recipe.level, 1);
  assert.equal(recipe.actions.length, 11);
  assert.deepEqual(recipe.actions.map(action => action.order), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
});

test('banana pancake cooking uses ten ordered, station-aware steps', () => {
  assert.equal(BANANA_PANCAKE_STEPS.length, 10);
  assert.equal(new Set(BANANA_PANCAKE_STEPS.map(step => step.id)).size, 10);
  assert.deepEqual(BANANA_PANCAKE_STEPS.map(step => step.station), [
    'kitchen', 'worktop', 'worktop', 'worktop', 'worktop', 'worktop', 'worktop', 'cooktop', 'cooktop', 'worktop',
  ]);
});

test('banana pancake cooking session resumes safely and completes once', () => {
  const migrated = migrateBananaPancakeSession({ stepIndex: 7, oatGrams: 40, heat: 2, selectedTools: ['bowl', 'bowl', 'fork'] });
  assert.equal(migrated.stepIndex, 7);
  assert.equal(migrated.oatGrams, 40);
  assert.deepEqual(migrated.selectedTools, ['bowl', 'fork']);
  let session = createBananaPancakeSession('2026-01-01T00:00:00.000Z');
  for (let index = 0; index < BANANA_PANCAKE_STEPS.length; index += 1) session = advanceCookingSession(session);
  assert.equal(session.completed, true);
  assert.strictEqual(advanceCookingSession(session), session);
});

test('journey stages are sequential and known ingredients can be skipped explicitly', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  const started = startJourney(createEmptyCookingProgress(), recipe, '2026-01-01T00:00:00.000Z');
  assert.equal(nextRequiredStage(started, recipe.id), 'discovery');
  assert.equal(advanceJourney(started, recipe.id, 'shopping'), started);
  const discovery = advanceJourney(started, recipe.id, 'discovery');
  assert.equal(discovery.journeys[recipe.id]?.stage, 'discovery');
  assert.equal(nextRequiredStage(discovery, recipe.id), null);

  const found = recipe.ingredients.reduce((state, ingredient) => discoverIngredient(state, recipe.id, ingredient.ingredientId), discovery);
  assert.equal(nextRequiredStage(found, recipe.id), 'nutrient-memory');
  assert.equal(advanceJourney(found, recipe.id, 'challenges'), found);
  const memory = advanceJourney(found, recipe.id, 'nutrient-memory');
  assert.equal(completeNutrientMemory(memory, recipe.id, recipe.education!.nutrientMemory!.activityId).journeys[recipe.id]?.stage, 'challenges');

  const known = { ...createEmptyCookingProgress(), discoveredIngredientIds: recipe.ingredients.map(item => item.ingredientId) };
  const knownStart = startJourney(known, recipe);
  assert.equal(nextRequiredStage(knownStart, recipe.id), 'discovery');
  let reviewing = beginDiscoveryStage(knownStart, recipe.id);
  for (const ingredient of recipe.ingredients) reviewing = skipKnownIngredient(reviewing, recipe.id);
  assert.equal(reviewing.journeys[recipe.id]?.discovery.step, 'complete');
  assert.equal(nextRequiredStage(reviewing, recipe.id), 'nutrient-memory');
});

test('ingredient discovery content defines the three requested questions and rewards', () => {
  assert.deepEqual(new Set(INGREDIENT_DISCOVERIES.map(item => item.ingredientId)), new Set(['banana', 'eggs', 'oats', 'yogurt', 'strawberry', 'flour', 'sugar', 'milk', 'blueberry', 'sunflower-oil', 'baking-powder', 'salt', 'vanilla-extract']));
  assert.ok(INGREDIENT_DISCOVERIES.every(item => item.rewardCoins === 5));
  assert.equal(INGREDIENT_DISCOVERIES_BY_ID.banana.questions[0].correctOptionId, 'tropical');
  assert.equal(INGREDIENT_DISCOVERIES_BY_ID.eggs.questions[0].correctOptionId, 'chicken');
  assert.equal(INGREDIENT_DISCOVERIES_BY_ID.oats.questions[0].correctOptionId, 'oats');
});

test('incorrect discovery answers persist an attempt and allow a retry without rewards', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  let state = beginDiscoveryStage(startJourney(createEmptyCookingProgress(), recipe), recipe.id);
  state = showDiscoveryQuestion(state, recipe.id);
  const wrong = answerDiscoveryQuestion(state, recipe.id, 'north-pole');
  assert.equal(wrong.correct, false);
  assert.equal(wrong.coinDelta, 0);
  assert.equal(wrong.progress.journeys[recipe.id]?.discovery.step, 'question');
  assert.equal(wrong.progress.journeys[recipe.id]?.discovery.attemptsByIngredient.banana, 1);
  assert.deepEqual(wrong.progress.discoveredIngredientIds, []);

  const retry = answerDiscoveryQuestion(wrong.progress, recipe.id, 'tropical');
  assert.equal(retry.correct, true);
  assert.equal(retry.coinDelta, 5);
  assert.equal(retry.progress.journeys[recipe.id]?.discovery.attemptsByIngredient.banana, 2);
});

test('collection unlocks the encyclopedia and cannot duplicate a discovery reward', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  let state = beginDiscoveryStage(startJourney(createEmptyCookingProgress(), recipe), recipe.id);
  state = showDiscoveryQuestion(state, recipe.id);
  const correct = answerDiscoveryQuestion(state, recipe.id, 'tropical');
  const duplicate = answerDiscoveryQuestion(correct.progress, recipe.id, 'tropical');
  assert.equal(duplicate.coinDelta, 0);
  state = showIngredientCollection(correct.progress, recipe.id);
  state = collectCurrentIngredient(state, recipe.id);
  assert.ok(state.discoveredIngredientIds.includes('banana'));
  assert.ok(state.journeys[recipe.id]?.discoveredIngredientIds.includes('banana'));
  assert.equal(state.journeys[recipe.id]?.discovery.currentIngredientId, 'eggs');
});

test('all ingredient discoveries earn fifteen coins and advance to the math stage', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  let state = beginDiscoveryStage(startJourney(createEmptyCookingProgress(), recipe), recipe.id);
  for (const ingredientId of ['banana', 'eggs', 'oats']) {
    state = showDiscoveryQuestion(state, recipe.id);
    const config = INGREDIENT_DISCOVERIES_BY_ID[ingredientId];
    const result = answerDiscoveryQuestion(state, recipe.id, config.questions[0].correctOptionId);
    assert.equal(result.coinDelta, 5);
    state = collectCurrentIngredient(showIngredientCollection(result.progress, recipe.id), recipe.id);
  }
  assert.equal(state.journeys[recipe.id]?.discovery.step, 'complete');
  assert.equal(state.journeys[recipe.id]?.discovery.coinsEarned, 15);
  const next = completeNutrientMemory(advanceJourney(state, recipe.id, 'nutrient-memory'), recipe.id, recipe.education!.nutrientMemory!.activityId);
  assert.equal(next.journeys[recipe.id]?.stage, 'challenges');
  assert.ok(next.journeys[recipe.id]?.completedStages.includes('discovery'));
});

test('discovery resumes at the persisted ingredient and screen', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  let state = beginDiscoveryStage(startJourney(createEmptyCookingProgress(), recipe), recipe.id);
  state = showDiscoveryQuestion(state, recipe.id);
  state = answerDiscoveryQuestion(state, recipe.id, 'north-pole').progress;
  const resumed = migrateCookingProgress(JSON.parse(JSON.stringify(state)));
  assert.equal(resumed.journeys[recipe.id]?.discovery.currentIngredientId, 'banana');
  assert.equal(resumed.journeys[recipe.id]?.discovery.step, 'question');
  assert.equal(resumed.journeys[recipe.id]?.discovery.attemptsByIngredient.banana, 1);
});

test('completed discovery can be replayed without changing saved achievements or rewards', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  let saved = beginDiscoveryStage(startJourney(createEmptyCookingProgress(), recipe), recipe.id);
  for (const ingredientId of ['banana', 'eggs', 'oats']) {
    saved = showDiscoveryQuestion(saved, recipe.id);
    const result = answerDiscoveryQuestion(saved, recipe.id, INGREDIENT_DISCOVERIES_BY_ID[ingredientId].questions[0].correctOptionId);
    saved = collectCurrentIngredient(showIngredientCollection(result.progress, recipe.id), recipe.id);
  }
  saved = completeNutrientMemory(advanceJourney(saved, recipe.id, 'nutrient-memory'), recipe.id, recipe.education!.nutrientMemory!.activityId);

  const replay = createDiscoveryReplay(saved, recipe.id, '2026-01-03T00:00:00.000Z');
  assert.equal(saved.journeys[recipe.id]?.stage, 'challenges');
  assert.equal(replay.journeys[recipe.id]?.stage, 'discovery');
  assert.equal(replay.journeys[recipe.id]?.discovery.currentIngredientId, 'banana');
  assert.deepEqual(replay.discoveredIngredientIds, ['banana', 'eggs', 'oats']);
  assert.deepEqual(replay.journeys[recipe.id]?.discoveredIngredientIds, []);

  const question = showDiscoveryQuestion(replay, recipe.id);
  const answer = answerDiscoveryQuestion(question, recipe.id, 'tropical');
  assert.equal(answer.correct, true);
  assert.equal(answer.coinDelta, 0);
  assert.equal(answer.progress.journeys[recipe.id]?.discovery.coinsEarned, 0);
});

test('math challenge catalog defines four unique data-driven challenges and thirty coins', () => {
  assert.equal(BANANA_PANCAKE_MATH_CHALLENGES.length, 4);
  assert.equal(new Set(BANANA_PANCAKE_MATH_CHALLENGES.map(item => item.id)).size, 4);
  assert.deepEqual(BANANA_PANCAKE_MATH_CHALLENGES.map(item => item.type), [
    'quantity-selection', 'recipe-scaling', 'interactive-weighing', 'sequence-ordering',
  ]);
  assert.equal(BANANA_PANCAKE_MATH_CHALLENGES.reduce((sum, item) => sum + item.rewardCoins, MATH_COMPLETION_BONUS), 30);
});

test('math challenge validation accepts exact quantities, weight and sequence', () => {
  for (const challenge of BANANA_PANCAKE_MATH_CHALLENGES) {
    assert.equal(validateMathChallengeAnswer(challenge, correctMathAnswer(challenge), 1).correct, true);
  }
  assert.deepEqual(validateMathChallengeAnswer(BANANA_PANCAKE_MATH_CHALLENGES[0], 3, 1), { correct: false, hint: null });
  assert.match(validateMathChallengeAnswer(BANANA_PANCAKE_MATH_CHALLENGES[0], 3, 2).hint ?? '', /2 \+ 2/);
  assert.match(validateMathChallengeAnswer(BANANA_PANCAKE_MATH_CHALLENGES[2], 25, 1).hint ?? '', /15 gram/);
  assert.match(validateMathChallengeAnswer(BANANA_PANCAKE_MATH_CHALLENGES[3], ['mix', 'peel', 'add', 'mash'], 1).hint ?? '', /stap 1/);
});

test('math journey persists progress, awards at most thirty coins and unlocks shopping', () => {
  let state = startMathChallenges(mathReadyProgress(), 'banana-pancakes');
  const firstWrong = submitMathChallenge(state, 'banana-pancakes', 3);
  assert.equal(firstWrong.coinDelta, 0);
  state = firstWrong.progress;
  const secondWrong = submitMathChallenge(state, 'banana-pancakes', 3);
  assert.match(secondWrong.hint ?? '', /2 \+ 2/);
  state = secondWrong.progress;

  const firstCorrect = submitMathChallenge(state, 'banana-pancakes', 4);
  assert.equal(firstCorrect.coinDelta, 5);
  state = continueMathChallenges(firstCorrect.progress, 'banana-pancakes').progress;
  const resumed = migrateCookingProgress(JSON.parse(JSON.stringify(state)));
  assert.equal(resumed.journeys['banana-pancakes']?.math.currentChallengeIndex, 1);
  assert.equal(resumed.journeys['banana-pancakes']?.math.step, 'challenge');
  assert.equal(resumed.journeys['banana-pancakes']?.math.attemptsByChallenge['banana-pancakes-egg-quantity'], 3);

  const completed = completeMath(resumed);
  assert.equal(completed.coins, 25);
  assert.equal(completed.state.journeys['banana-pancakes']?.math.coinsEarned, 30);
  assert.equal(completed.state.journeys['banana-pancakes']?.math.step, 'complete');
  assert.equal(nextRequiredStage(completed.state, 'banana-pancakes'), 'shopping');
  assert.equal(advanceJourney(completed.state, 'banana-pancakes', 'shopping').journeys['banana-pancakes']?.stage, 'shopping');
});

test('math replay remains reward-free and does not alter saved completion', () => {
  const saved = completeMath(mathReadyProgress()).state;
  const replay = createMathReplay(saved, 'banana-pancakes');
  assert.equal(saved.journeys['banana-pancakes']?.math.coinsEarned, 30);
  assert.equal(replay.journeys['banana-pancakes']?.math.step, 'intro');
  const started = startMathChallenges(replay, 'banana-pancakes');
  const answer = submitMathChallenge(started, 'banana-pancakes', 4);
  assert.equal(answer.correct, true);
  assert.equal(answer.coinDelta, 0);
  assert.equal(answer.progress.journeys['banana-pancakes']?.math.coinsEarned, 0);
  assert.equal(saved.journeys['banana-pancakes']?.math.step, 'complete');
});

test('math UI starts automatically and exposes the active challenge', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  const ready = mathReadyProgress();
  const intro = renderToStaticMarkup(<MathChallengeFlow recipe={recipe} progress={ready} onProgressChange={() => undefined} onExit={() => undefined} />);
  assert.match(intro, /Opdrachten klaarzetten/);
  assert.doesNotMatch(intro, /Word een slimme chef!/);
  const active = startMathChallenges(ready, recipe.id);
  const challenge = renderToStaticMarkup(<MathChallengeFlow recipe={recipe} progress={active} onProgressChange={() => undefined} onExit={() => undefined} />);
  assert.match(challenge, /Voor 2 porties heb je 2 eieren nodig/);
  assert.match(challenge, /Controleer/);
});

test('CocoCoin transactions are applied at most once', () => {
  const memory = new Map<string, string>();
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  } });
  try {
    memory.set(CURRENCY_KEY, JSON.stringify(20));
    const first = awardCurrencyOnce('cooking-discovery:banana', 5);
    const second = awardCurrencyOnce('cooking-discovery:banana', 5);
    assert.deepEqual(first, { applied: true, balance: 25 });
    assert.deepEqual(second, { applied: false, balance: 25 });
    assert.equal(JSON.parse(memory.get(CURRENCY_KEY)!).balance, 25);
    assert.equal(JSON.parse(memory.get(CURRENCY_KEY)!).appliedTransactions['cooking-discovery:banana'], 5);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
  }
});

test('inventory consumes ingredients once and keeps equipment permanently', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  let state = startJourney(createEmptyCookingProgress(), recipe);
  state = addConsumable(state, 'eggs', 2);
  state = consumeIngredient(state, recipe.id, 'eggs', 2);
  assert.equal(state.inventory.consumables.eggs, 0);
  const duplicate = consumeIngredient(state, recipe.id, 'eggs', 2);
  assert.equal(duplicate, state);
  state = addEquipment(state, 'pan');
  assert.deepEqual(state.inventory.equipmentIds, ['pan']);
  assert.equal(addEquipment(state, 'pan'), state);
});

test('completion and its future coin reward are idempotent', () => {
  const rewardRecipe: RecipeConfig = { ...RECIPES_BY_ID['banana-pancakes'], rewardCoins: 10 };
  let state = completeMath(mathReadyProgress(rewardRecipe)).state;
  state = advanceJourney(state, rewardRecipe.id, 'shopping');
  state = addConsumable(state, 'banana', 1);
  state = addConsumable(state, 'eggs', 2);
  state = addConsumable(state, 'oats', 40);
  state = advanceJourney(state, rewardRecipe.id, 'cooking');
  const first = completeJourney(state, rewardRecipe, '2026-01-02T00:00:00.000Z');
  assert.equal(first.coinDelta, 10);
  assert.equal(first.progress.completions[rewardRecipe.id]?.rewardClaimed, true);
  const second = completeJourney(first.progress, rewardRecipe);
  assert.equal(second.coinDelta, 0);
  assert.equal(second.progress, first.progress);
});

test('a completed recipe can restart without losing its collection record or earning twice', () => {
  const recipe = { ...RECIPES_BY_ID['banana-pancakes'], rewardCoins: 12 };
  let state = startJourney(createEmptyCookingProgress(), recipe);
  state.journeys[recipe.id]!.stage = 'cooking';
  const first = completeJourney(state, recipe, '2026-01-01T00:00:00.000Z');
  const restarted = restartJourney(first.progress, recipe, '2026-01-02T00:00:00.000Z');
  assert.equal(restarted.journeys[recipe.id]?.status, 'active');
  assert.equal(restarted.journeys[recipe.id]?.stage, 'overview');
  assert.ok(restarted.completions[recipe.id]);
  restarted.journeys[recipe.id]!.stage = 'cooking';
  const second = completeJourney(restarted, recipe, '2026-01-03T00:00:00.000Z');
  assert.equal(second.coinDelta, 0);
  assert.equal(second.progress.journeys[recipe.id]?.status, 'completed');
  assert.equal(second.progress.completions[recipe.id]?.completedAt, '2026-01-01T00:00:00.000Z');
});

test('damaged or partial cooking storage migrates to a readable state', () => {
  assert.deepEqual(migrateCookingProgress('broken'), createEmptyCookingProgress());
  const migrated = migrateCookingProgress({ version: 0, inventory: { consumables: { banana: 2.8, eggs: -1 }, equipmentIds: ['pan', 'pan'] } });
  assert.equal(migrated.version, 1);
  assert.deepEqual(migrated.inventory.consumables, { banana: 2 });
  assert.deepEqual(migrated.inventory.equipmentIds, ['pan']);
});

test('serialized progress resumes and the made-recipes filter includes completed recipes only', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  const active = startJourney(createEmptyCookingProgress(), recipe, '2026-01-01T00:00:00.000Z');
  const resumed = migrateCookingProgress(JSON.parse(JSON.stringify(active)));
  assert.equal(resumed.journeys[recipe.id]?.stage, 'overview');
  assert.deepEqual(getCompletedRecipes(resumed), []);
  const completed = { ...resumed, completions: { [recipe.id]: { recipeId: recipe.id, completedAt: '2026-01-02T00:00:00.000Z', rewardClaimed: false } } };
  assert.deepEqual(getCompletedRecipes(completed).map(item => item.id), [recipe.id]);
});

test('recipe unlocks count distinct completed recipes and keep pending content unavailable', () => {
  const progress = createEmptyCookingProgress();
  const banana = RECIPES_BY_ID['banana-pancakes'];
  const yogurt = RECIPES_BY_ID['fruit-yogurt'];
  const muffins = RECIPES_BY_ID['oat-muffins'];
  assert.equal(getRecipeAccess(banana, progress).playable, true);
  assert.equal(getRecipeAccess(yogurt, progress).locked, true);
  assert.equal(startJourney(progress, yogurt), progress);
  progress.completions[banana.id] = { recipeId: banana.id, completedAt: '2026-10-24', rewardClaimed: false };
  assert.equal(getRecipeAccess(yogurt, progress).status, 'Nieuw');
  assert.equal(getRecipeAccess(yogurt, progress).playable, true);
  assert.equal(getRecipeAccess(muffins, progress).remaining, 1);
  progress.completions[banana.id] = { ...progress.completions[banana.id]!, completedAt: '2026-10-25' };
  assert.equal(getRecipeAccess(muffins, progress).remaining, 1);
  progress.completions[yogurt.id] = { recipeId: yogurt.id, completedAt: '2026-10-25', rewardClaimed: false };
  assert.equal(getRecipeAccess(muffins, progress).locked, false);
  assert.equal(getRecipeAccess(muffins, progress).status, 'Binnenkort');
  assert.equal(getRecipeAccess({ ...muffins, contentStatus: 'ready', actions: banana.actions }, progress).playable, false);
  const readyMuffins: RecipeConfig = { ...banana, id: muffins.id, requiredCompletedRecipes: 2 };
  assert.equal(getRecipeAccess(readyMuffins, progress).playable, true);
  assert.notEqual(startJourney(progress, readyMuffins), progress);
  assert.equal(startJourney(createEmptyCookingProgress(), readyMuffins).activeRecipeId, null);
  const active = startJourney(createEmptyCookingProgress(), banana);
  const futureThreshold = { ...banana, requiredCompletedRecipes: 5 };
  assert.equal(getRecipeAccess(futureThreshold, active).playable, true);
});

test('recipe cards and overview expose statuses and accessible content', () => {
  const playable = RECIPES_BY_ID['banana-pancakes'];
  const preview = RECIPES_BY_ID['fruit-yogurt'];
  const locked = RECIPES_BY_ID['oat-muffins'];
  const cards = renderToStaticMarkup(<>{[playable, preview, locked].map(recipe => <div key={recipe.id}><RecipeCard recipe={recipe} onOpen={() => undefined} /></div>)}</>);
  assert.match(cards, /Nieuw/);
  assert.match(cards, /Maak eerst 1 verschillend recept/);
  assert.match(cards, /Vergrendeld/);
  const dialog = renderToStaticMarkup(<RecipeOverviewDialog recipe={playable} onClose={() => undefined} onStart={() => undefined} />);
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /1 banaan/);
  assert.match(dialog, /2 eieren/);
  assert.match(dialog, /40 g havermout/);
  assert.match(dialog, /Start kookavontuur/);
});

test('discovery UI keeps one focused educational interaction visible', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  const state = beginDiscoveryStage(startJourney(createEmptyCookingProgress(), recipe), recipe.id);
  const learn = renderToStaticMarkup(<IngredientDiscoveryFlow recipe={recipe} progress={state} onProgressChange={() => undefined} onExit={() => undefined} />);
  assert.match(learn, /Banaan/);
  assert.match(learn, /Oorsprong/);
  assert.match(learn, /Kalium/);
  assert.match(learn, /spieren en zenuwen/);
  assert.match(learn, /Wist je dat/);
  assert.doesNotMatch(learn, /Waarom groeien bananen goed in tropische gebieden/);
  const questionState = showDiscoveryQuestion(state, recipe.id);
  const question = renderToStaticMarkup(<IngredientDiscoveryFlow recipe={recipe} progress={questionState} onProgressChange={() => undefined} onExit={() => undefined} />);
  assert.match(question, /Waarom groeien bananen goed in tropische gebieden/);
  assert.match(question, /Ze hebben warmte en voldoende water nodig/);
});

test('seasonal prices follow the configured catalog and remain stable per session', () => {
  assert.equal(cocoCoinsToEuros(10), 1);
  assert.equal(cocoCoinsToEuros(25), 2.5);
  assert.equal(getProductPrice('strawberry', 'spring'), 25);
  assert.equal(getProductPrice('strawberry', 'summer'), 20);
  assert.equal(getProductPrice('strawberry', 'autumn'), 30);
  assert.equal(getProductPrice('strawberry', 'winter'), 35);
  const summer = createShoppingSession('free', null, new Date('2026-07-01'), 'summer', 'summer-session');
  const winter = createShoppingSession('free', null, new Date('2026-12-01'), 'winter', 'winter-session');
  assert.equal(summer.priceSnapshot.prices.strawberry, 20);
  assert.equal(winter.priceSnapshot.prices.strawberry, 35);
  assert.equal(summer.priceSnapshot.prices.strawberry, 20);
});

test('recipe basket totals 12 coins and purchased quantities unlock cooking', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  let progress = completeMath(mathReadyProgress(recipe)).state;
  progress = advanceJourney(progress, recipe.id, 'shopping');
  assert.equal(nextRequiredStage(progress, recipe.id), null);
  let session = createShoppingSession('recipe', recipe.id, new Date('2026-06-01'), 'summer', 'recipe-shop');
  session = adjustBasket(session, 'banana', 1);
  session = adjustBasket(session, 'eggs', 2);
  session = adjustBasket(session, 'oats', 1);
  assert.equal(basketTotal(session), 12);
  assert.deepEqual(recipeRequirementStatus(progress, recipe.id, session).map(item => item.collected), [true, true, true]);
  const checkout = checkoutBasket(progress, session, 45, '2026-06-01T12:00:00.000Z');
  assert.equal(checkout.status, 'success');
  assert.deepEqual(checkout.progress.inventory.consumables, { banana: 1, eggs: 2, oats: 40 });
  assert.equal(checkout.progress.inventory.acquisitions.length, 3);
  assert.equal(nextRequiredStage(checkout.progress, recipe.id), 'cooking');
  assert.equal(advanceJourney(checkout.progress, recipe.id, 'cooking').journeys[recipe.id]?.stage, 'cooking');
  assert.equal(checkoutBasket(checkout.progress, session, 33).status, 'duplicate');
});

test('existing inventory counts toward a recipe and insufficient checkout changes nothing', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  let progress = createEmptyCookingProgress();
  progress = addConsumable(progress, 'banana', 1);
  const session = adjustBasket(createShoppingSession('recipe', recipe.id, new Date('2026-06-01'), 'summer', 'poor-shop'), 'strawberry', 1);
  assert.equal(recipeRequirementStatus(progress, recipe.id)[0].collected, true);
  const result = checkoutBasket(progress, session, 5);
  assert.equal(result.status, 'insufficient');
  assert.equal(result.progress, progress);
});

test('later shopping sessions combine inventory without reprocessing an earlier transaction', () => {
  const firstSession = adjustBasket(createShoppingSession('free', null, new Date('2026-06-01'), 'summer', 'first-oats'), 'oats', 1);
  const first = checkoutBasket(createEmptyCookingProgress(), firstSession, 10);
  const secondSession = adjustBasket(createShoppingSession('free', null, new Date('2026-06-02'), 'summer', 'second-oats'), 'oats', 1);
  const second = checkoutBasket(first.progress, secondSession, 9);
  assert.equal(second.progress.inventory.consumables.oats, 80);
  assert.equal(second.progress.inventory.acquisitions.length, 2);
  assert.equal(Object.keys(second.progress.shoppingTransactions).length, 2);
  assert.equal(checkoutBasket(second.progress, firstSession, 8).status, 'duplicate');
});

test('wallet spending is idempotent and never makes the balance negative', () => {
  const memory = new Map<string, string>([[CURRENCY_KEY, '12']]);
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  } });
  try {
    assert.deepEqual(spendCurrencyOnce('shopping:test', 12), { status: 'applied', balance: 0 });
    assert.deepEqual(spendCurrencyOnce('shopping:test', 12), { status: 'duplicate', balance: 0 });
    assert.deepEqual(spendCurrencyOnce('shopping:other', 1), { status: 'insufficient', balance: 0 });
  } finally {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
  }
});

test('free and recipe shopping sessions persist independently with their price snapshot', () => {
  const memory = new Map<string, string>();
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  } });
  try {
    const free = adjustBasket(createShoppingSession('free', null, new Date('2026-07-01'), 'summer', 'free-stable'), 'apple', 1);
    const recipe = adjustBasket(createShoppingSession('recipe', 'banana-pancakes', new Date('2026-12-01'), 'winter', 'recipe-stable'), 'banana', 1);
    assert.equal(saveShoppingSession(free), true);
    assert.equal(saveShoppingSession(recipe), true);
    assert.equal(loadShoppingSession('free').priceSnapshot.season, 'summer');
    assert.equal(loadShoppingSession('free').basket.apple, 1);
    assert.equal(loadShoppingSession('recipe', 'banana-pancakes').priceSnapshot.season, 'winter');
    assert.equal(loadShoppingSession('recipe', 'banana-pancakes').basket.banana, 1);
  } finally {
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original });
  }
});

test('terugbladeren verzet alleen waar je kijkt', () => {
  const recept = RECIPES.find(item => item.id === 'blueberry-muffins')!;
  const stappen = recept.preparation!.steps;
  const start = createCookingSession(recept, 'a', '2026-10-29T10:00:00.000Z');

  // Doe alsof de eerste drie stappen af zijn en je bij de vierde staat.
  const onderweg = { ...start, stepId: stappen[3].id, completedStepIds: stappen.slice(0, 3).map(stap => stap.id) };

  const terug = goBackPreparation(onderweg, recept);
  assert.equal(terug.viewStepId, stappen[2].id);
  // Waar je echt bent blijft staan, net als wat je al af hebt.
  assert.equal(terug.stepId, onderweg.stepId);
  assert.deepEqual(terug.completedStepIds, onderweg.completedStepIds);

  // Twee keer terug, en dan in één keer weer naar waar je was.
  const nogVerderTerug = goBackPreparation(terug, recept);
  assert.equal(nogVerderTerug.viewStepId, stappen[1].id);
  assert.equal(resumePreparation(nogVerderTerug).viewStepId, undefined);
  assert.equal(resumePreparation(nogVerderTerug).stepId, stappen[3].id);

  // Bij de eerste stap valt er niets terug te bladeren.
  assert.equal(goBackPreparation(start, recept), start);

  // En het terugkijken overleeft een rondje door de opslag, want dáár ging het
  // mis: de stap werd bij het inlezen teruggezet en het scherm liep vast.
  const bewaard = migrateCookingSession(JSON.parse(JSON.stringify(terug)), recept);
  assert.equal(bewaard.viewStepId, stappen[2].id);
  assert.equal(bewaard.stepId, stappen[3].id);
});
