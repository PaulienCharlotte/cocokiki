import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ACTIVITY_LIBRARY, ACTIVITIES_BY_ID, SCHOOL_ACTIVITIES } from '../platform/activityRegistry';
import { WORLD_LOCATIONS } from '../platform/worldLocations';
import { resolveRoute } from '../platform/routes';
import { locationOrigin, withLocationOrigin } from '../services/locationNavigation';
import WorldLocationLayout from '../components/dreamworld/WorldLocationLayout';
import NutrientMemoryScreen, { STANDALONE_NUTRIENT_MEMORY } from '../pages/NutrientMemoryScreen';
import { createNutrientDeck, memoryConfigIssues } from '../data/cooking/nutrientMemory';
import CookbookScreen from '../pages/CookbookScreen';
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
  assert.equal(WORLD_LOCATIONS.length, 3);
  for (const location of WORLD_LOCATIONS) {
    assert.equal(location.adventures.length, 0);
    assert.ok(existsSync(`public${location.background}`));
    assert.ok(location.backgroundPosition.mobile && location.backgroundPosition.desktop);
    for (const entry of location.activities) if ('activity' in entry.target) assert.ok(ACTIVITIES_BY_ID[entry.target.activity]);
    for (const id of [...location.featuredActivities, ...location.practiceActivities]) assert.ok(ACTIVITIES_BY_ID[id], id);
    const html = renderToStaticMarkup(<WorldLocationLayout location={location} onNavigate={() => undefined} />);
    assert.ok(html.includes(location.name));
    assert.match(html, /role="tablist"/);
    assert.match(html, /Binnenkort/);
    assert.equal((html.match(/class="world-location__background"/g) ?? []).length, 1);
    assert.doesNotMatch(html, /avatars\/(?:milo|novi)|avontuur voltooid/i);
  }
});
test('return context preserves recipe arguments and accepts only fixed local origins', () => {
  assert.equal(withLocationOrigin('/treehouse/cookbook?recipe=blueberry-muffins', 'milo'), '/treehouse/cookbook?recipe=blueberry-muffins&from=milo');
  assert.equal(withLocationOrigin('/school/math/missing', 'milo'), '/school/math/missing?from=milo');
  assert.equal(locationOrigin('?from=milo'), 'milo');
  assert.equal(locationOrigin('?from=felix', '/school/math/multiply'), 'felix');
  assert.equal(withLocationOrigin('/school/clock', 'felix'), '/school/clock?from=felix');
  assert.equal(locationOrigin('?from=felix', '/islands/math'), null);
  assert.equal(locationOrigin('?from=novi', '/plantendokter'), 'novi');
  for (const invalid of ['https://evil.test', '//evil.test', '/treehouse', 'constructor', '__proto__', 'javascript:alert(1)']) assert.equal(locationOrigin(`?from=${encodeURIComponent(invalid)}`), null);
  assert.equal(withLocationOrigin('https://evil.test', 'milo'), '/');
  assert.equal(withLocationOrigin('//evil.test', 'novi'), '/');
  assert.equal(withLocationOrigin('/?from=milo', 'milo'), '/');
  assert.equal(withLocationOrigin('/treehouse?from=novi', 'novi'), '/treehouse');
  assert.equal(locationOrigin('?from=milo', '/islands/cooking'), null);
  assert.equal(locationOrigin('?from=novi', '/privacy'), null);
});
test('standalone nutrient memory reuses valid existing questions without saving or rewards', () => {
  assert.deepEqual(memoryConfigIssues(STANDALONE_NUTRIENT_MEMORY), []);
  assert.equal(createNutrientDeck(STANDALONE_NUTRIENT_MEMORY).length, 12);
  assert.equal(resolveRoute('/games/nutrient-memory').route.page, 'nutrient-memory');
  const html = renderToStaticMarkup(<NutrientMemoryScreen onBack={() => undefined} />);
  assert.match(html, /Voedingsstoffenmemory/);
  const source = readFileSync('pages/NutrientMemoryScreen.tsx', 'utf8');
  assert.match(source, /import NutrientMemory from/);
  assert.doesNotMatch(source, /saveCookingProgress|startJourney|awardCurrency|localStorage|analytics\(/);
});
test('recipe deep links open the existing overview without starting a journey', () => {
  const before = Object.getOwnPropertyDescriptor(globalThis, 'window');
  try {
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search: '?recipe=banana-pancakes&from=milo' } } });
    const html = renderToStaticMarkup(<CookbookScreen />);
    assert.match(html, /role="dialog"/);
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search: '?recipe=constructor' } } });
    assert.doesNotMatch(renderToStaticMarkup(<CookbookScreen />), /role="dialog"/);
  } finally {
    if (before) Object.defineProperty(globalThis, 'window', before); else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('bakery has four requested activities and six unimplemented selectable adventure previews', () => {
  const location = WORLD_LOCATIONS.find(item => item.id === 'milo')!;
  assert.deepEqual(location.activities.map(item => item.label), ['Recepten', 'Boodschappen', 'Bakrekenen', 'Voedingsstoffen']);
  assert.deepEqual(location.activities.filter(item => 'comingSoon' in item.target).map(item => item.id), ['groceries', 'math']);
  const previews = location.adventurePreviews!;
  assert.equal(previews.length, 6);
  assert.equal(new Set(previews.map(item => item.id)).size, 6);
  for (const preview of previews) {
    assert.equal(preview.status, 'locked');
    assert.equal(preview.progress, undefined);
    assert.ok(existsSync(`public${preview.image}`));
    const clipboard = renderToStaticMarkup(<AdventureClipboard adventure={preview} />);
    assert.ok(clipboard.includes(preview.title));
    assert.match(clipboard, /disabled=""/);
    assert.doesNotMatch(clipboard, /role="progressbar"|Start avontuur/);
  }
  const html = renderToStaticMarkup(<WorldLocationLayout location={location} onNavigate={() => undefined} />);
  assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
  assert.equal((html.match(/aria-pressed="false"/g) ?? []).length, 5);
  assert.doesNotMatch(html, /location-panel--|Havermoutmuffins/);
  const source = readFileSync('components/dreamworld/LocationAdventureWidgets.tsx', 'utf8');
  assert.doesNotMatch(source, /AdventureEngine|localStorage|commitLocalState|analytics\(|location\.id\s*===/);
});
