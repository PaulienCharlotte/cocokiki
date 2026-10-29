import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RECIPES_BY_ID } from '../data/cooking/catalog';
import { getRecipeAccess } from '../data/cooking/availability';
import { INGREDIENT_DISCOVERIES_BY_ID } from '../data/cooking/discovery';
import { discoveryOptions } from '../data/cooking/discoveryOptions';
import { NUTRIENTS, NUTRIENTS_BY_ID, type NutrientMemoryConfig } from '../data/cooking/nutrients';
import { createNutrientDeck, hideMismatchedCards, memoryComplete, memoryConfigIssues, revealNutrientCard, type MemoryState } from '../data/cooking/nutrientMemory';
import { dismissCookingTip, eligibleCookingTip, presentCookingTip } from '../data/cooking/tips';
import { createCookingSession, migrateCookingSession } from '../data/cooking/session';
import { getRecipeIssues } from '../data/cooking/validation';
import { advanceJourney, completeNutrientMemory, createEmptyCookingProgress, createMemoryReplay, loadCookingProgress, migrateCookingProgress, nextRequiredStage, restartJourney, saveCookingProgress, startJourney } from '../services/cookingProgress';
import { awardCurrencyOnce, loadCurrency } from '../services/currency';
import type { CookingProgressState } from '../data/cooking/types';
import InteractiveKitchen from '../components/treehouse/InteractiveKitchen';
import CookingTipCard from '../components/cooking/CookingTipCard';
import NutrientMemory from '../components/cooking/NutrientMemory';
import { HomeRecipeContent } from '../components/cooking/HomeRecipe';
import KitchenScale from '../components/cooking/KitchenScale';

const banana = RECIPES_BY_ID['banana-pancakes'];
const yogurt = RECIPES_BY_ID['fruit-yogurt'];
function memoryStorage(run: () => void) {
  const original = globalThis.localStorage;
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => memory.set(key, value),
  } });
  try { run(); } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original }); }
}
function discoveryDone(): CookingProgressState {
  const state = startJourney(createEmptyCookingProgress(), banana);
  state.journeys[banana.id]!.stage = 'discovery';
  state.journeys[banana.id]!.discoveredIngredientIds = banana.ingredients.map(item => item.ingredientId);
  return state;
}

test('answer identities remain valid while A/B/C positions vary and survive reload', () => {
  for (const recipe of [banana, yogurt]) {
    const positions = recipe.ingredients.map((item, index) => {
      const question = INGREDIENT_DISCOVERIES_BY_ID[item.ingredientId].questions[0];
      const options = discoveryOptions(question, 'saved-journey-start', index);
      assert.deepEqual(options, discoveryOptions(question, 'saved-journey-start', index));
      assert.deepEqual(new Set(options.map(option => option.id)), new Set(question.options.map(option => option.id)));
      return options.findIndex(option => option.id === question.correctOptionId);
    });
    assert.equal(new Set(positions).size, 3);
  }
});

test('all ready cooking journeys stay visible independently of the active pointer', () => memoryStorage(() => {
  let state = startJourney(createEmptyCookingProgress(), banana);
  state.completions[banana.id] = { recipeId: banana.id, completedAt: '2026-10-25', rewardClaimed: false };
  state.journeys[banana.id]!.stage = 'cooking';
  state = startJourney(state, yogurt);
  state.journeys[yogurt.id]!.stage = 'cooking';
  state.preparationSessions[banana.id] = createCookingSession(banana);
  state.preparationSessions[yogurt.id] = createCookingSession(yogurt);
  assert.equal(saveCookingProgress(state), true);
  state = loadCookingProgress();
  const html = renderToStaticMarkup(<InteractiveKitchen progress={state} sceneRef={React.createRef()} />);
  assert.match(html, /Verder met bananenpannenkoekjes/);
  assert.match(html, /Verder met fruityoghurt met aardbei en banaan/);
  assert.equal(getRecipeAccess(banana, state).status, 'Klaar om te koken');
  const first = structuredClone(state.preparationSessions[banana.id]);
  const resumed = startJourney(state, banana);
  assert.deepEqual(resumed.preparationSessions[banana.id], first);
  assert.equal(resumed.journeys[yogurt.id]!.stage, 'cooking');
}));

test('central nutrient data contains functions, several examples and no recipe-local definitions', () => {
  assert.equal(NUTRIENTS.length, 8);
  assert.equal(new Set(NUTRIENTS.map(item => item.id)).size, 8);
  assert.ok(NUTRIENTS.every(item => item.foodExamples.length > 1 && item.bodyFunction && item.shortDescription));
  assert.ok(yogurt.education!.nutrientMemory!.nutrientIds.includes('calcium'));
});

test('nutrient decks support 3, 4 and 6 pairs with randomized, valid card identities', () => {
  for (const pairCount of [3, 4, 6] as const) {
    const config: NutrientMemoryConfig = { enabled: true, activityId: 'test-memory', nutrientIds: NUTRIENTS.map(item => item.id), pairCount };
    const deck = createNutrientDeck(config, () => 0);
    assert.equal(deck.length, pairCount * 2);
    assert.equal(new Set(deck.map(card => card.id)).size, pairCount * 2);
    for (const id of new Set(deck.map(card => card.nutrientId))) assert.deepEqual(new Set(deck.filter(card => card.nutrientId === id).map(card => card.kind)), new Set(['nutrient', 'function']));
    assert.notDeepEqual(deck.map(card => card.id), createNutrientDeck(config, () => .9).map(card => card.id));
  }
  const invalid = { ...banana.education!.nutrientMemory!, nutrientIds: ['iron'] };
  assert.equal(createNutrientDeck({ enabled: true, activityId: 'default', nutrientIds: NUTRIENTS.map(item => item.id) }).length, 8);
  assert.ok(memoryConfigIssues(invalid).includes('memory:not-enough-nutrients'));
  assert.deepEqual(createNutrientDeck(invalid), []);
  assert.ok(memoryConfigIssues({ ...invalid, nutrientIds: ['missing'] }).some(issue => issue.includes('unknown-nutrient')));
});

test('memory matches nutrient to function, rejects mismatches, locks two open cards and detects completion', () => {
  const deck = createNutrientDeck(banana.education!.nutrientMemory!, () => .6);
  let state: MemoryState = { openIds: [], matchedIds: [] };
  const first = deck[0];
  const wrong = deck.find(card => card.nutrientId !== first.nutrientId)!;
  state = revealNutrientCard(revealNutrientCard(state, deck, first.id), deck, wrong.id);
  assert.equal(state.openIds.length, 2);
  assert.equal(state.matchedIds.length, 0);
  assert.equal(revealNutrientCard(state, deck, deck[2].id), state);
  state = hideMismatchedCards(state);
  assert.equal(memoryComplete(state, deck), false);
  for (const nutrientId of new Set(deck.map(card => card.nutrientId))) for (const card of deck.filter(item => item.nutrientId === nutrientId)) state = revealNutrientCard(state, deck, card.id);
  assert.equal(memoryComplete(state, deck), true);
  assert.equal(revealNutrientCard(state, deck, first.id), state);
  const html = renderToStaticMarkup(<NutrientMemory config={banana.education!.nutrientMemory!} onComplete={() => undefined} />);
  assert.equal((html.match(/type="button"/g) ?? []).length, 8);
  assert.doesNotMatch(html, /tabindex="-1"/);
});

test('first-time memory gates math; completion saves without coins or stock changes', () => memoryStorage(() => {
  awardCurrencyOnce('seed', 50);
  const state = discoveryDone();
  state.inventory.consumables.eggs = 9;
  assert.equal(nextRequiredStage(state, banana.id), 'nutrient-memory');
  assert.equal(advanceJourney(state, banana.id, 'challenges'), state);
  const memory = advanceJourney(state, banana.id, 'nutrient-memory');
  assert.equal(saveCookingProgress(memory), true);
  const reloaded = loadCookingProgress();
  assert.equal(reloaded.journeys[banana.id]!.stage, 'nutrient-memory');
  assert.equal(reloaded.journeys[banana.id]!.nutrientMemory!.status, 'pending');
  const completed = completeNutrientMemory(reloaded, banana.id, banana.education!.nutrientMemory!.activityId);
  assert.equal(completed.journeys[banana.id]!.stage, 'challenges');
  assert.equal(saveCookingProgress(completed, undefined, { rewards: false }), true);
  assert.equal(completeNutrientMemory(completed, banana.id, 'wrong'), completed);
  assert.deepEqual(completed.inventory, state.inventory);
  assert.equal(loadCurrency(), 50);
  const replay = createMemoryReplay(completed, banana.id);
  assert.notEqual(replay, completed);
  assert.equal(loadCookingProgress().journeys[banana.id]!.stage, 'challenges');
  const restarted = restartJourney(completed, banana);
  restarted.journeys[banana.id]!.stage = 'discovery';
  restarted.journeys[banana.id]!.discoveredIngredientIds = banana.ingredients.map(item => item.ingredientId);
  assert.equal(nextRequiredStage(restarted, banana.id), 'nutrient-memory');
}));

test('older journeys beyond discovery keep their stage and preparation session', () => {
  for (const stage of ['challenges', 'shopping', 'cooking', 'complete'] as const) {
    const old = discoveryDone();
    old.journeys[banana.id]!.stage = stage;
    delete old.journeys[banana.id]!.nutrientMemory;
    old.preparationSessions[banana.id] = createCookingSession(banana);
    const migrated = migrateCookingProgress(JSON.parse(JSON.stringify(old)));
    assert.equal(migrated.journeys[banana.id]!.stage, stage);
    assert.equal(migrated.journeys[banana.id]!.nutrientMemory!.status, 'skipped');
    assert.equal(migrated.preparationSessions[banana.id].attemptId, old.preparationSessions[banana.id].attemptId);
  }
});

test('tips trigger once per attempt, dismiss safely, survive reload and reset on replay', () => memoryStorage(() => {
  const tip = banana.cookingTips![0];
  let session = createCookingSession(banana);
  assert.equal(eligibleCookingTip([tip], session), undefined);
  session.completedStepIds = ['cook'];
  session.stepId = 'serve';
  assert.equal(eligibleCookingTip([tip], session)?.id, tip.id);
  const waiting = { ...session, steps: { serve: { count: 0, selectedTools: [], quantity: 0, heat: 0, phase: 'wait' as const, readyAt: Date.now(), choice: null } } };
  assert.equal(eligibleCookingTip([tip], waiting), undefined);
  session = dismissCookingTip(presentCookingTip(session, tip), tip);
  const restored = migrateCookingSession(JSON.parse(JSON.stringify(session)), banana);
  assert.equal(eligibleCookingTip([tip], restored), undefined);
  assert.ok(restored.dismissedTipIds!.includes(tip.id));
  const state = discoveryDone();
  state.preparationSessions[banana.id] = restored;
  state.journeys[banana.id]!.discovery.rewardClaimedIngredientIds = ['banana'];
  const before = structuredClone(state.inventory);
  assert.equal(saveCookingProgress(state, undefined, { rewards: false }), true);
  assert.equal(loadCurrency(), 0);
  assert.deepEqual(loadCookingProgress().inventory, before);
  assert.equal(eligibleCookingTip([tip], { ...createCookingSession(banana), completedStepIds: ['cook'] })?.id, tip.id);
  assert.match(renderToStaticMarkup(<CookingTipCard tip={tip} onDismiss={() => undefined} />), /Tip sluiten/);
  const completionTip = { ...tip, displayMode: 'completion' as const };
  assert.equal(eligibleCookingTip([completionTip], createCookingSession(banana)), undefined);
  assert.ok(eligibleCookingTip([completionTip], { ...createCookingSession(banana), completed: true }));
}));

test('invalid optional tip and nutrient configuration has actionable validation errors', () => {
  assert.ok(getRecipeIssues({ ...banana, cookingTips: [{ ...banana.cookingTips![0], triggerStepId: 'missing' }] }).includes('tips:unknown-step:missing'));
  assert.ok(getRecipeIssues({ ...banana, cookingTips: [banana.cookingTips![0], banana.cookingTips![0]] }).includes('tips:duplicate-id'));
  assert.deepEqual(getRecipeIssues(banana), []);
  assert.deepEqual(getRecipeIssues(yogurt), []);
  NUTRIENTS_BY_ID.iron.iconAsset = '/missing-optional-icon.webp';
  try { assert.deepEqual(getRecipeIssues(banana), []); }
  finally { delete NUTRIENTS_BY_ID.iron.iconAsset; }
  assert.ok(getRecipeIssues({ ...banana, education: { ...banana.education!, nutrientMemory: { ...banana.education!.nutrientMemory!, pairCount: 2 as 3 } } }).some(issue => issue.includes('pair-count')));
});

test('home recipes include real instructions, amounts, safety and deterministic printable files', () => {
  for (const recipe of [banana, yogurt]) {
    const html = renderToStaticMarkup(<HomeRecipeContent recipe={recipe} />);
    assert.match(html, /Bereiding/);
    assert.match(html, /Veilig koken/);
    for (const ingredient of recipe.ingredients) assert.ok(html.includes(ingredient.displayAmount));
    assert.ok(existsSync(`public/recipes/${recipe.id}.html`));
    const exported = readFileSync(`public/recipes/${recipe.id}.html`, 'utf8');
    assert.ok(exported.includes(html));
    assert.match(exported, /@media print/);
  }
});

test('weighing shows the amount without a clipped ingredient illustration', () => {
  const html = renderToStaticMarkup(<KitchenScale value={75} full={75} ingredientImage="/games/shop/products/strawberry.webp" />);
  assert.doesNotMatch(html, /cooking-scale__contents|strawberry.webp/);
  assert.match(html, /cooking-scale__front/);
  assert.doesNotMatch(html, /transform:/);
});
