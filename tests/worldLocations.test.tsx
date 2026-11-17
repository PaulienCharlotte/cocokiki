import { createEmptyCookingProgress, COOKING_PROGRESS_KEY } from '../services/cookingProgress';
import { neemBestellingAan } from '../services/bakeryOrders';
import FoodKnowledgeDialog from '../components/food/FoodKnowledge';
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ACTIVITY_LIBRARY, ACTIVITIES_BY_ID, SCHOOL_ACTIVITIES } from '../platform/activityRegistry';
import { discoveredPlaces } from '../services/travelKnowledge';
import { LOCATIONS } from '../constants';
import { locationProgressKey } from '../data/learning';
import { DISCOVERY_ROOMS } from '../platform/discoveryRooms';
import { INGREDIENTS } from '../data/cooking/catalog';
import { GARDEN_CROPS } from '../data/plants/garden';
import { FAVORITE_GAME_CATALOG } from '../services/favoriteGames';
import { WORLD_LOCATIONS } from '../platform/worldLocations';
import { resolveRoute } from '../platform/routes';
import { locationOrigin, withLocationOrigin } from '../services/locationNavigation';
import WorldLocationLayout from '../components/dreamworld/WorldLocationLayout';
import NutrientMemoryScreen, { STANDALONE_NUTRIENT_MEMORY } from '../pages/NutrientMemoryScreen';
import { createNutrientDeck, memoryConfigIssues } from '../data/cooking/nutrientMemory';
import CookbookScreen from '../pages/CookbookScreen';
import CookingKitchen from '../pages/CookingKitchen';
import { MATH_GAMES } from '../games/math/config';
import { AdventureClipboard } from '../components/dreamworld/LocationAdventureWidgets';

test('activity index has unique IDs and retains all school entry routes', () => {
  assert.equal(new Set(ACTIVITY_LIBRARY.map(activity => activity.id)).size, ACTIVITY_LIBRARY.length);
  for (const game of MATH_GAMES) assert.equal(ACTIVITIES_BY_ID[`math:${game.id}`].path, `/school/math/${game.id}`);
  for (const path of ['/games/topo', '/games/red-baby-lua', '/games/flags-memory', '/school/clock']) assert.ok(SCHOOL_ACTIVITIES.some(activity => activity.path === path));
  for (const activity of ACTIVITY_LIBRARY) {
    assert.equal(resolveRoute(activity.path.split('?')[0]).redirect, false, activity.path);
    if (activity.image && activity.status === 'available') assert.ok(existsSync(`public${activity.image.split('?')[0]}`), activity.image);
  }
});
test('resident locations use existing activities, not invented adventures or progress', () => {
  assert.equal(WORLD_LOCATIONS.length, 4);
  for (const location of WORLD_LOCATIONS) {
    assert.equal(location.adventures.length, 0);
    assert.ok(existsSync(`public${location.background}`));
    assert.ok(location.backgroundPosition.mobile && location.backgroundPosition.desktop);
    for (const entry of location.activities) if ('activity' in entry.target) assert.ok(ACTIVITIES_BY_ID[entry.target.activity]);
    for (const id of [...location.featuredActivities, ...location.practiceActivities]) assert.ok(ACTIVITIES_BY_ID[id], id);
    const html = renderToStaticMarkup(<WorldLocationLayout location={location} onNavigate={() => undefined} />);
    assert.ok(html.includes(DISCOVERY_ROOMS[location.id].title));
    // Tabbladen horen bij een locatie die ook echt avonturen heeft. Een
    // tabblad dat alleen "binnenkort" zegt, hoort er niet te staan.
    // Een regel die onder elke kaart hetzelfde zegt, zegt niets.
    assert.doesNotMatch(html, />Spelen</, `${location.id} zet geen "Spelen" onder elke kaart`);
    assert.doesNotMatch(html, /class="ck-kaarten|role="tablist"/);
    assert.equal(location.featuredActivities.length, 0);
    assert.equal((html.match(/discovery-room__background"/g) ?? []).length, 1);
    for (const object of DISCOVERY_ROOMS[location.id].objects) {
      assert.ok(html.includes(object.label));
      if (object.path) assert.equal(resolveRoute(object.path.split('?')[0]).redirect, false, object.path);
      if (object.action === 'ingredient') assert.ok(INGREDIENTS.some(item => item.id === object.contentId));
      if (object.action === 'crop') assert.ok(GARDEN_CROPS.some(item => item.id === object.contentId));
    }
    assert.doesNotMatch(html, /avatars\/(?:coco|kiki)|avontuur voltooid/i);
  }
});
test('return context preserves recipe arguments and accepts only fixed local origins', () => {
  assert.equal(withLocationOrigin('/treehouse/cookbook?recipe=blueberry-muffins', 'coco'), '/treehouse/cookbook?recipe=blueberry-muffins&from=coco');
  assert.equal(withLocationOrigin('/school/math/missing', 'coco'), '/school/math/missing?from=coco');
  assert.equal(locationOrigin('?from=coco'), 'coco');
  assert.equal(locationOrigin('?from=lua', '/school/math/multiply'), 'lua');
  assert.equal(withLocationOrigin('/school/clock', 'lua'), '/school/clock?from=lua');
  assert.equal(locationOrigin('?from=lua', '/islands/math'), null);
  assert.equal(locationOrigin('?from=kiki', '/plantendokter'), 'kiki');
  for (const invalid of ['https://evil.test', '//evil.test', '/treehouse', 'constructor', '__proto__', 'javascript:alert(1)']) assert.equal(locationOrigin(`?from=${encodeURIComponent(invalid)}`), null);
  assert.equal(withLocationOrigin('https://evil.test', 'coco'), '/');
  assert.equal(withLocationOrigin('//evil.test', 'kiki'), '/');
  assert.equal(withLocationOrigin('/?from=coco', 'coco'), '/');
  assert.equal(withLocationOrigin('/treehouse?from=kiki', 'kiki'), '/treehouse');
  assert.equal(locationOrigin('?from=coco', '/islands/cooking'), null);
  assert.equal(locationOrigin('?from=kiki', '/privacy'), null);
});
test('standalone nutrient memory reuses existing questions and the shared per-pair reward', () => {
  assert.deepEqual(memoryConfigIssues(STANDALONE_NUTRIENT_MEMORY), []);
  assert.equal(createNutrientDeck(STANDALONE_NUTRIENT_MEMORY).length, 12);
  assert.equal(resolveRoute('/games/nutrient-memory').route.page, 'nutrient-memory');
  const html = renderToStaticMarkup(<NutrientMemoryScreen onBack={() => undefined} />);
  assert.match(html, /Voedingsstoffenmemory/);
  const source = readFileSync('pages/NutrientMemoryScreen.tsx', 'utf8');
  assert.match(source, /import NutrientMemory from/);
  assert.match(readFileSync('components/cooking/NutrientMemory.tsx', 'utf8'), /rewardAnswer/);
  assert.doesNotMatch(source, /saveCookingProgress|startJourney|awardCurrency|localStorage|analytics\(/);
});
test('recipe deep links open the existing overview without starting a journey', () => {
  const before = Object.getOwnPropertyDescriptor(globalThis, 'window');
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search: '?recipe=banana-pancakes&from=coco' } } });
    const html = renderToStaticMarkup(<CookbookScreen />);
    assert.match(html, /role="dialog"/);
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search: '?recipe=constructor' } } });
    assert.doesNotMatch(renderToStaticMarkup(<CookbookScreen />), /role="dialog"/);
  } finally {
    if (before) Object.defineProperty(globalThis, 'window', before); else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('de kookstudio opent bestaande kennis en boeken via voorwerpen', () => {
  const location = WORLD_LOCATIONS.find(item => item.id === 'coco')!;
  const html = renderToStaticMarkup(<WorldLocationLayout location={location} onNavigate={() => undefined} />);
  assert.match(html, /Open het kookboek/);
  assert.match(html, /Ontdek havermout/);
  assert.match(html, /Bekijk kookopdrachten/);
  assert.match(html, /Ontdek de aardbei/);
  assert.doesNotMatch(html, /location-panel--|Start avontuur|Taart versieren/);
  assert.equal(ACTIVITIES_BY_ID['plant-clinic'].kind, 'collection');
});

test('de kookstudio heeft de oorspronkelijke ingerichte keuken en behoudt receptcontext', () => {
  assert.deepEqual(resolveRoute('/cooking/kitchen').route, { page: 'cooking-kitchen', path: '/cooking/kitchen' });
  assert.equal(withLocationOrigin('/cooking/kitchen?recipe=banana-pancakes', 'coco'), '/cooking/kitchen?recipe=banana-pancakes&from=coco');
  assert.equal(locationOrigin('?from=coco', '/cooking/kitchen'), 'coco');
  const html = renderToStaticMarkup(<CookingKitchen onNavigate={() => undefined} />);
  assert.match(html, /kitchen-furnished\.webp/);
  assert.match(html, /aria-label="Kookeiland openen"/);
  assert.match(html, /aria-label="Kookplaat openen"/);
  assert.match(html, /aria-label="Mijn boodschappen openen"/);
  assert.match(html, /aria-label="Mijn Kookboek openen"/);
  assert.doesNotMatch(html, /Kamerinrichting|Mijn rugzak openen/);
});


test('losse spellen blijven bereikbaar in het spelmenu en Lua krijgt projecten', () => {
  for (const game of MATH_GAMES) assert.ok(FAVORITE_GAME_CATALOG.some(item => item.id === `math:${game.id}`));
  for (const id of ['clock', 'topo', 'flags-memory']) assert.ok(FAVORITE_GAME_CATALOG.some(item => item.id === id));
  assert.ok(!FAVORITE_GAME_CATALOG.some(item => item.id === 'plant-clinic' || item.path === '/games/taartenatelier'));
  assert.equal(DISCOVERY_ROOMS.lua.objects[0].path, '/opdrachten/luna-babykamer');
  assert.equal(DISCOVERY_ROOMS.seb.objects.find(item => item.id === 'atlas')?.path, '/encyclopedie?tab=plekken');
  assert.equal(DISCOVERY_ROOMS.seb.objects.find(item => item.id === 'topo')?.path, '/games/topo');
});

test('spelkeuzes zijn rustig en favorieten zijn alleen expliciet aan te zetten', async () => {
  const { default: CardGrid } = await import('../components/ui/CardGrid');
  const props = { cards: [{ id: 'flags-memory', titel: 'Vlaggenmemory', beeld: '/games/flags-memory/navigation.webp' }], onChoose: () => undefined };
  const normal = renderToStaticMarkup(<CardGrid {...props} vorm="plek" />);
  assert.doesNotMatch(normal, /Bewaar in Mijn spellen|game-pin/);
  const favorites = renderToStaticMarkup(<CardGrid {...props} vorm="plek" favorieten />);
  assert.match(favorites, /Bewaar in Mijn spellen/);
  const { default: CocoCoin } = await import('../components/platform/CocoCoin');
  const coin = renderToStaticMarkup(<CocoCoin size={18} />);
  assert.match(coin, /\/assets\/library\/ui\/cococoin.webp/);
  assert.doesNotMatch(coin, /logo-compas-geel/);
});


test('reisboek gebruikt alleen correcte kaartantwoorden en dubbelt plekken niet', () => {
  const place = LOCATIONS[0];
  const key = locationProgressKey(place);
  assert.deepEqual(discoveredPlaces({}), []);
  assert.deepEqual(discoveredPlaces({ [key]: { seen: 1, correct: 0, lastSeen: 1 } }), []);
  const discovered = discoveredPlaces({ [key]: { seen: 3, correct: 2, lastSeen: 3 }, 'flag:Rusland': { seen: 1, correct: 1, lastSeen: 1 } });
  assert.equal(discovered.length, 1);
  assert.equal(locationProgressKey(discovered[0]), key);
});

test('opdrachten behouden hun terugweg door bestaande activiteiten heen', () => {
  assert.equal(locationOrigin('?from=tasks', '/plantendokter'), 'tasks');
  assert.equal(withLocationOrigin('/games/taartenatelier?order=seb-birthday', 'tasks'), '/games/taartenatelier?order=seb-birthday&from=tasks');
  assert.equal(withLocationOrigin('/shop/groceries?recipe=blueberry-muffins', 'tasks'), '/shop/groceries?recipe=blueberry-muffins&from=tasks');
  assert.equal(locationOrigin('?from=tasks', '/islands/cooking'), null);
});


test('een lopende bestelling neemt het kookboek niet over; de toonbank heeft een eigen ingang', () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const pending = neemBestellingAan(createEmptyCookingProgress(), 'kiki-kas');
  const values = new Map([[COOKING_PROGRESS_KEY, JSON.stringify(pending)]]);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => values.get(key) ?? null } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search: '?from=coco' } } });
  try {
    const before = values.get(COOKING_PROGRESS_KEY);
    const book = renderToStaticMarkup(<CookbookScreen />);
    assert.match(book, /Mijn Kookboek/);
    assert.match(book, /Receptcategorieën/);
    assert.doesNotMatch(book, /Welk recept past hierbij/);
    const orders = renderToStaticMarkup(<CookbookScreen mode="orders" />);
    assert.match(orders, /Welk recept past hierbij/);
    assert.doesNotMatch(orders, /Receptcategorieën/);
    assert.equal(values.get(COOKING_PROGRESS_KEY), before);
    assert.equal(resolveRoute('/cooking/orders').route.page, 'cooking-orders');
    assert.equal(withLocationOrigin('/cooking/orders', 'tasks'), '/cooking/orders?from=tasks');
    assert.equal(withLocationOrigin('/games/taartenatelier?order=seb-birthday', 'orders'), '/games/taartenatelier?order=seb-birthday&from=orders');
    assert.equal(withLocationOrigin('/cooking/orders', 'orders'), '/cooking/orders');
    assert.equal(locationOrigin('?from=orders', '/cooking/orders'), null);
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'localStorage', previousStorage); else Reflect.deleteProperty(globalThis, 'localStorage');
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow); else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('elk voedingsmiddel biedt toegang tot andere producten en de gedeelde voedingsstoffen', () => {
  const strawberry = INGREDIENTS.find(item => item.id === 'strawberry')!;
  const html = renderToStaticMarkup(<FoodKnowledgeDialog ingredient={strawberry} onClose={() => undefined} />);
  assert.match(html, /Andere producten/);
  assert.match(html, /Voedingsstoffen ontdekken/);
  assert.match(html, /Vitamine C/);
  assert.match(html, /Eiwitten/);
});
