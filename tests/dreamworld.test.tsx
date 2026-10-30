import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DREAM_ISLANDS, DREAMWORLD_IMAGE, ISLANDS_BY_ID, WORLD_SHOPS, WORLD_DESTINATIONS, islandForActivity } from '../platform/dreamworld';
import { resolveRoute } from '../platform/routes';
import { MATH_GAMES } from '../games/math/config';
import { clampWorldView, worldImageSize, worldMinimumScale } from '../services/worldViewport';
import IslandEnvironment from '../pages/IslandEnvironment';
import ShopScreen from '../pages/ShopScreen';
import ShopMenu from '../components/dreamworld/ShopMenu';
import WorldHub from '../pages/WorldHub';
import AppShell from '../components/platform/AppShell';
import { FLAG_MEMORY_PAIRS } from '../pages/FlagsMemory';
import LocationMemoryGame from '../components/LocationMemoryGame';
import FlagsMemory from '../pages/FlagsMemory';
import { FLAG_CONTINENTS, FLAG_COUNTRIES, continentFlagPairs, nextFlagRound } from '../data/flagCatalog';
import { COUNTRY_FLAGS } from '../data/flags';
import { islandIconLayoutKey, loadIslandIconPositions, saveIslandIconPosition } from '../services/islandIconLayout';
import type { Progress } from '../services/localProgress';
import { ISLAND_ICONS_IMAGE, ISLAND_ICON_POSITIONS } from '../components/dreamworld/IslandIcon';

test('Dreamworld has six unique islands, real assets and addressable activities', () => {
  assert.equal(DREAM_ISLANDS.length, 6);
  assert.equal(new Set(DREAM_ISLANDS.map(island => island.id)).size, 6);
  assert.ok(existsSync(`public${DREAMWORLD_IMAGE}`));
  for (let i = 0; i < DREAM_ISLANDS.length; i++) for (let j = i + 1; j < DREAM_ISLANDS.length; j++) {
    const a = DREAM_ISLANDS[i].spot, b = DREAM_ISLANDS[j].spot;
    const overlapX = Math.abs(a.x - b.x) < (a.width + b.width) / 2 - 1e-8;
    const overlapY = Math.abs(a.y - b.y) < (a.height + b.height) / 2 - 1e-8;
    assert.equal(overlapX && overlapY, false, `${DREAM_ISLANDS[i].id} overlaps ${DREAM_ISLANDS[j].id}`);
  }
  for (const island of DREAM_ISLANDS) {
    if (island.id === 'plants') assert.equal(resolveRoute(island.path).route.page, 'plant-clinic');
    else if (island.id === 'cooking') assert.equal(resolveRoute(island.path).route.path, '/treehouse/cookbook');
    else if (island.id === 'home') assert.equal(resolveRoute(island.path).route.path, '/treehouse');
    else assert.deepEqual(resolveRoute(island.path).route, { page: 'island', path: island.path, islandId: island.id });
    assert.ok(existsSync(`public${island.background}`), island.background);
    assert.ok(island.spot.x - island.spot.width / 2 >= 0);
    assert.ok(island.spot.x + island.spot.width / 2 <= 1);
    assert.ok(island.spot.y - island.spot.height / 2 >= 0);
    assert.ok(island.spot.y + island.spot.height / 2 <= 1);
    for (const item of island.activities) {
      assert.equal(resolveRoute(item.path.split('?')[0]).redirect, false, item.path);
      assert.ok(existsSync(`public${item.image}`), item.image);
      assert.equal(islandForActivity(item.path)?.id, island.id);
    }
  }
});

test('island icon positions persist separately and reject corrupt or invalid coordinates', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  try {
    assert.equal(saveIslandIconPosition('math', 'multiply', { x: 40, y: 70 }), true);
    assert.equal(saveIslandIconPosition('math', 'divide', { x: 60, y: 30 }), true);
    assert.equal(loadIslandIconPositions('math').multiply.x, 40);
    assert.deepEqual(loadIslandIconPositions('discovery'), {});
    assert.equal(saveIslandIconPosition('math', 'multiply', { x: -1, y: 50 }), false);
    assert.equal(saveIslandIconPosition('math', 'multiply', { x: NaN, y: 50 }), false);
    assert.equal(loadIslandIconPositions('math').multiply.x, 40);
    values.set(islandIconLayoutKey('math'), '{broken');
    assert.deepEqual(loadIslandIconPositions('math'), {});
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
test('every actual math module has one island entry and preserves its identity', () => {
  assert.deepEqual(ISLANDS_BY_ID.math.activities.map(item => item.id), MATH_GAMES.map(game => game.id));
  for (const game of MATH_GAMES) assert.deepEqual(resolveRoute(`/school/math/${game.id}`).route, { page: 'math', path: `/school/math/${game.id}`, mathGame: game.id });
  assert.equal(islandForActivity('/games/red-baby-lua')?.id, 'math');
});
test('compact flag memory shows twelve cards without visible number labels', () => {
  const html = renderToStaticMarkup(<LocationMemoryGame mode="memory" pairs={FLAG_MEMORY_PAIRS.slice(0, 6)} choicePool={FLAG_MEMORY_PAIRS} onAnswer={() => undefined} onContinue={() => undefined} onRepeat={() => undefined} onRetry={() => undefined} onExit={() => undefined} />);
  assert.equal((html.match(/class="memory-card/g) ?? []).length, 12);
  assert.doesNotMatch(html, /<span>\d+<\/span>/);
  assert.match(html, /aria-label="Kaart 12"/);
  assert.equal(resolveRoute('/islands/home').route.path, '/treehouse');
});
test('flag catalogue covers 197 countries once across six continents with valid flags', () => {
  assert.equal(FLAG_COUNTRIES.length, 197);
  assert.equal(new Set(FLAG_COUNTRIES.map(country => country.name)).size, 197);
  assert.equal(new Set(FLAG_COUNTRIES.map(country => country.code)).size, 197);
  assert.deepEqual(FLAG_CONTINENTS.map(continent => continentFlagPairs(continent.id).length), [45, 54, 49, 23, 12, 14]);
  for (const country of FLAG_COUNTRIES) {
    assert.match(country.code, /^[A-Z]{2}$/);
    assert.equal(Array.from(country.flag).length, 2);
    assert.equal(COUNTRY_FLAGS[country.name], country.flag);
  }
  assert.equal(COUNTRY_FLAGS.Nederland, '🇳🇱');
  assert.ok(continentFlagPairs('asia').some(pair => pair.left === 'Japan'));
  assert.ok(continentFlagPairs('south-america').some(pair => pair.left === 'Suriname'));
  const html = renderToStaticMarkup(<FlagsMemory onBack={() => undefined} />);
  for (const continent of FLAG_CONTINENTS) assert.ok(html.includes(continent.label));
  // Hetzelfde keuzeraster als het rekenmenu; zie .claude/skills/cocokiki-ui.
  assert.ok(html.includes('ck-kaarten'));
  assert.ok(!html.includes('flag-continents__grid'));
});
test('successive flag rounds cover every country in the chosen continent before older flags', () => {
  for (const continent of FLAG_CONTINENTS) {
    const pool = continentFlagPairs(continent.id);
    const progress: Progress = {};
    for (let round = 0; round < Math.ceil(pool.length / 6); round++) {
      const remaining = pool.filter(pair => !progress[pair.id]);
      const next = nextFlagRound(continent.id, progress);
      assert.equal(next.length, 6);
      assert.equal(new Set(next.map(pair => pair.id)).size, 6);
      assert.ok(next.every(pair => pool.some(item => item.id === pair.id)));
      assert.ok(next.slice(0, Math.min(6, remaining.length)).every(pair => !progress[pair.id]));
      for (const pair of next) progress[pair.id] = { seen: 1, correct: 1, lastSeen: round + 1 };
    }
    assert.equal(Object.keys(progress).length, pool.length);
  }
});
test('cooking island opens only the cookbook directly', () => {
  assert.deepEqual(resolveRoute('/islands/cooking'), { route: { page: 'treehouse-section', path: '/treehouse/cookbook', section: 'cookbook' }, redirect: true });
  assert.deepEqual(ISLANDS_BY_ID.cooking.activities.map(item => item.path), ['/treehouse/cookbook']);
});
test('plant island opens the doctor directly and discovery offers real flag memory', () => {
  assert.deepEqual(resolveRoute('/islands/plants'), { route: { page: 'plant-clinic', path: '/plantendokter' }, redirect: true });
  assert.deepEqual(ISLANDS_BY_ID.plants.activities.map(item => item.id), ['clinic']);
  assert.equal(resolveRoute('/games/flags-memory').route.page, 'flags-memory');
  assert.ok(ISLANDS_BY_ID.discovery.activities.some(item => item.path === '/games/flags-memory'));
  assert.ok(ISLANDS_BY_ID.discovery.activities.every(item => item.path !== '/travel'));
  assert.ok(FLAG_MEMORY_PAIRS.length > 50);
  assert.equal(new Set(FLAG_MEMORY_PAIRS.map(pair => pair.id)).size, FLAG_MEMORY_PAIRS.length);
  assert.ok(FLAG_MEMORY_PAIRS.every(pair => pair.kind === 'flag' && pair.left && pair.right));
  const island = renderToStaticMarkup(<IslandEnvironment island={ISLANDS_BY_ID.math} onNavigate={() => undefined} />);
  assert.doesNotMatch(island, /dream-island__title|<span>/);
  assert.match(island, /aria-label="Red Baby Lua! openen"/);
});
test('three global shops are addressable without cluttering island activities', () => {
  assert.deepEqual(WORLD_SHOPS.map(shop => shop.id), ['groceries', 'furniture', 'plants']);
  for (const shop of WORLD_SHOPS) {
    assert.equal(resolveRoute(shop.path).route.page, 'store');
    assert.equal(islandForActivity(shop.path), undefined);
    assert.ok(DREAM_ISLANDS.every(island => island.activities.every(item => item.path !== shop.path)));
  }
  assert.equal(islandForActivity('/treehouse/bedroom')?.id, 'home');
  assert.equal(islandForActivity('/encyclopedie?tab=voeding')?.id, 'cooking');
  assert.equal(islandForActivity('/games/topo')?.id, 'discovery');
});
test('world map has no visible name pills and shops stay available in the shared menu', () => {
  const world = renderToStaticMarkup(<WorldHub coins={20} onNavigate={() => undefined} />);
  assert.doesNotMatch(world, /dream-map__index/);
  assert.equal((world.match(/class="dream-island-icon"/g) ?? []).length, 0);
  assert.equal((world.match(/class="dream-hotspot"/g) ?? []).length, 6);
  assert.doesNotMatch(world, /dream-hotspot__label/);
  assert.ok(existsSync(`public${ISLAND_ICONS_IMAGE}`));
  assert.deepEqual(Object.keys(ISLAND_ICON_POSITIONS).sort(), DREAM_ISLANDS.map(island => island.id).sort());
  assert.equal(new Set(Object.values(ISLAND_ICON_POSITIONS).map(position => position.join(':'))).size, 6);
  assert.match(world, /aria-label="Winkels openen"/);
  assert.match(world, /aria-label="Kaart naar links"/);
  assert.match(world, /aria-label="Kaart naar rechts"/);
  const shell = renderToStaticMarkup(<AppShell coins={20} onHome={() => undefined} onNavigate={() => undefined}>Spel</AppShell>);
  assert.match(shell, /aria-label="Winkels openen"/);
  const menu = renderToStaticMarkup(<ShopMenu onClose={() => undefined} onNavigate={() => undefined} />);
  for (const shop of WORLD_SHOPS) assert.ok(menu.includes(shop.label));
});
test('map panning and zoom stay bounded at desktop and mobile dimensions', () => {
  for (const [width, height] of [[375, 900], [1440, 900]]) {
    const image = worldImageSize(width, height, 1672 / 940);
    const minimum = worldMinimumScale(width, height, image.width, image.height);
    assert.ok(minimum < 1);
    assert.ok(image.width * minimum <= width + .001);
    assert.ok(image.height * minimum <= height + .001);
    assert.deepEqual(clampWorldView({ scale: 0, x: 9999, y: -9999 }, width, height, image.width, image.height), { scale: minimum, x: 0, y: 0 });
  }
  const wide = worldImageSize(2400, 800, 16 / 9);
  assert.ok(wide.width >= 2400 && wide.height >= 800);
  assert.equal(wide.width / wide.height, 16 / 9);
  const phone = worldImageSize(360, 728, 16 / 9);
  assert.ok(phone.width > 360);
  assert.equal(phone.height, 728);
  assert.deepEqual(clampWorldView({ scale: .5, x: 400, y: -400 }, 1000, 500, 1000, 500), { scale: 1, x: 0, y: 0 });
  assert.deepEqual(clampWorldView({ scale: 9, x: 9999, y: -9999 }, 360, 700, 1240, 700), { scale: 2.5, x: 1370, y: -525 });
  const mobile = clampWorldView({ scale: 1, x: -999, y: 999 }, 360, 700, 1240, 700);
  assert.deepEqual(mobile, { scale: 1, x: -440, y: 0 });
});

test('painted island buttons use normalized positions and existing canonical routes', () => {
  assert.equal(WORLD_DESTINATIONS.length, 6);
  assert.equal(new Set(WORLD_DESTINATIONS.map(destination => destination.id)).size, 6);
  for (const destination of WORLD_DESTINATIONS) {
    assert.equal(destination.enabled, true);
    assert.equal(resolveRoute(destination.route).redirect, false);
    const { x, y, width, height } = destination.position;
    assert.ok(x > width / 2 && x < 1 - width / 2);
    assert.ok(y > height / 2 && y < 1 - height / 2);
  }
  const byId = Object.fromEntries(WORLD_DESTINATIONS.map(destination => [destination.id, destination]));
  assert.ok(byId.cooking.position.x < byId.home.position.x);
  assert.ok(byId.math.position.x > byId.home.position.x);
  assert.ok(byId.plants.position.y > byId.cooking.position.y);
  assert.ok(byId.discovery.position.y > byId.math.position.y);
  assert.equal(byId.language.route, '/islands/language');
});
test('direct supermarket links retain recipe requirements and reject unknown recipe IDs', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search: '?recipe=banana-pancakes' } } });
    const html = renderToStaticMarkup(<ShopScreen initialStore="groceries" onNavigate={() => undefined} />);
    assert.match(html, /Receptboodschappen/);
    assert.match(html, /Terug naar de keuken/);
    assert.match(html, /Jouw receptlijstje/);
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search: '?recipe=constructor' } } });
    assert.match(renderToStaticMarkup(<ShopScreen initialStore="groceries" />), /Vrij winkelen/);
  } finally {
    if (original) Object.defineProperty(globalThis, 'window', original); else Reflect.deleteProperty(globalThis, 'window');
  }
});
test('language stays honest about future functionality and no games disappear', () => {
  const html = renderToStaticMarkup(<IslandEnvironment island={ISLANDS_BY_ID.language} onNavigate={() => undefined} />);
  assert.match(html, /Binnenkort kun je hier op taalavontuur!/);
  assert.match(html, /Terug naar Dreamworld/);
  assert.doesNotMatch(html, /dream-location/);
  assert.equal(ISLANDS_BY_ID.discovery.modules.includes('world-times'), true);
  assert.equal(ISLANDS_BY_ID.discovery.future.includes('world-times'), false);
});
