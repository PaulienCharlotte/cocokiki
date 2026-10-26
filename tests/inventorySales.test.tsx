import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { resalePrice, sellInventoryItem } from '../services/inventorySales';
import { createEmptyRoomInventory, loadRoomInventory, ROOM_INVENTORY_KEY } from '../services/roomInventory';
import { commitLocalState } from '../services/localState';
import { loadCurrency } from '../services/currency';
import { COOKING_PROGRESS_KEY, createEmptyCookingProgress, loadCookingProgress, restartJourney, startJourney, nextRequiredStage, migrateCookingProgress } from '../services/cookingProgress';
import { RECIPES_BY_ID } from '../data/cooking/catalog';
import { DECOR_PRODUCTS_BY_ID } from '../data/decorCatalog';
import { SHOP_PRODUCTS_BY_ID } from '../data/shopCatalog';
import { rewardClockRound, loadClockProgress, clockLevelReward } from '../games/clock/clockProgress';
import WorldTopBar from '../components/platform/WorldTopBar';
import CookingTipCard from '../components/cooking/CookingTipCard';

function stored(run: () => void) {
  const previous = globalThis.localStorage;
  const map = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => map.set(key, value) } });
  try { run(); } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous }); }
}

test('decor sales pay seventy percent exactly once and preserve placed items', () => stored(() => {
  const state = createEmptyRoomInventory();
  state.owned['green-chair'] = 2;
  state.placements = [{ id: 'placed', productId: 'green-chair', room: 'living-room', x: 50, y: 70, view: 0, scale: 1 }];
  commitLocalState({ [ROOM_INVENTORY_KEY]: JSON.stringify(state) });
  assert.equal(sellInventoryItem('decor', 'green-chair', 'one'), true);
  assert.equal(loadCurrency(), resalePrice(DECOR_PRODUCTS_BY_ID['green-chair'].price));
  assert.equal(sellInventoryItem('decor', 'green-chair', 'one'), false);
  assert.equal(sellInventoryItem('decor', 'green-chair', 'two'), false);
  assert.equal(loadRoomInventory().placements.length, 1);
  assert.equal(loadRoomInventory().owned['green-chair'], 1);
  assert.equal(resalePrice(85), 59);
}));

test('grocery sales deduct a complete package, preserve partial stock and fail atomically', () => stored(() => {
  const state = createEmptyCookingProgress();
  state.inventory.consumables.strawberry = 325;
  commitLocalState({ [COOKING_PROGRESS_KEY]: JSON.stringify(state) });
  assert.equal(sellInventoryItem('groceries', 'strawberry', 'one'), true);
  assert.equal(loadCookingProgress().inventory.consumables.strawberry, 75);
  const balance = resalePrice(SHOP_PRODUCTS_BY_ID.strawberry.price);
  assert.equal(loadCurrency(), balance);
  assert.equal(sellInventoryItem('groceries', 'strawberry', 'one'), false);
  assert.equal(sellInventoryItem('groceries', 'strawberry', 'two'), false);
  assert.equal(sellInventoryItem('groceries', 'missing', 'three'), false);
  assert.equal(loadCurrency(), balance);
  const saved = globalThis.localStorage;
  const beforeFailure = loadCookingProgress();
  beforeFailure.inventory.consumables.banana = 1;
  commitLocalState({ [COOKING_PROGRESS_KEY]: JSON.stringify(beforeFailure) });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: saved.getItem, setItem: () => { throw Error('full'); } } });
  assert.equal(sellInventoryItem('groceries', 'banana', 'four'), false);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: saved });
  assert.equal(loadCookingProgress().inventory.consumables.banana, 1);
  assert.equal(loadCurrency(), balance);
}));

test('clock rounds reward first completion and practice without duplicate payouts', () => stored(() => {
  for (const game of ['memory', 'set-clock', 'race'] as const) {
    assert.equal(rewardClockRound(game, 2, `${game}-first`), clockLevelReward(2));
    assert.equal(rewardClockRound(game, 2, `${game}-first`), 0);
    assert.equal(rewardClockRound(game, 2, `${game}-practice`), 5);
    assert.ok(loadClockProgress().completed[game].includes(2));
  }
  assert.equal(loadCurrency(), 36);
}));

test('full recipe restart restores memory even after a legacy completed recipe', () => {
  const recipe = RECIPES_BY_ID['banana-pancakes'];
  const state = startJourney(createEmptyCookingProgress(), recipe);
  state.completions[recipe.id] = { recipeId: recipe.id, completedAt: '2026-10-25', rewardClaimed: true };
  state.journeys[recipe.id]!.nutrientMemory!.status = 'skipped';
  const next = migrateCookingProgress(restartJourney(state, recipe));
  next.journeys[recipe.id]!.stage = 'discovery';
  next.journeys[recipe.id]!.discoveredIngredientIds = recipe.ingredients.map(item => item.ingredientId);
  assert.equal(nextRequiredStage(next, recipe.id), 'nutrient-memory');
  assert.ok(next.completions[recipe.id]!.rewardClaimed);
});

test('Coco tip uses chef illustration and positive ingredient copy; menu has no dead actions', () => {
  const tip = RECIPES_BY_ID['fruit-yogurt'].cookingTips![0];
  assert.doesNotMatch(tip.title + tip.text, /suiker/);
  const html = renderToStaticMarkup(<CookingTipCard tip={tip} onDismiss={() => undefined} />);
  assert.match(html, /<dialog|coco-chef-tip.webp/);
  assert.match(html, /Verder koken/);
  assert.doesNotMatch(renderToStaticMarkup(<WorldTopBar coins={0} onHome={() => undefined} />), /aria-disabled="true"/);
});
