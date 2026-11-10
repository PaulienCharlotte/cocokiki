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
    // Tabbladen horen bij een locatie die ook echt avonturen heeft. Een
    // tabblad dat alleen "binnenkort" zegt, hoort er niet te staan.
    // Een regel die onder elke kaart hetzelfde zegt, zegt niets.
    assert.doesNotMatch(html, />Spelen</, `${location.id} zet geen "Spelen" onder elke kaart`);
    // De kaarten komen uit het gedeelde raster, niet uit een eigen vorm.
    // De bakkerij heeft een eigen speelvorm met badges; de rest gebruikt het raster.
    if (location.presentation !== 'game' && location.featuredActivities.length) assert.match(html, /class="ck-kaarten/, `${location.id} gebruikt het gedeelde kaartraster`);
    // Een knop die naar dezelfde plek gaat als een kaart eronder is dubbel.
    const kaartIds = new Set(location.featuredActivities);
    for (const knop of location.activities) {
      if ('activity' in knop.target) assert.ok(!kaartIds.has(knop.target.activity), `${location.id}: ${knop.target.activity} staat zowel als knop als als kaart`);
    }
    if (location.adventurePreviews?.length) assert.match(html, /Avonturen/, `${location.id} heeft avonturen om te tonen`);
    else {
      assert.doesNotMatch(html, /role="tablist"/, `${location.id} heeft geen avonturen, dus ook geen tabbladen`);
      assert.doesNotMatch(html, /Avonturen/, `${location.id} belooft geen avonturen die er niet zijn`);
    }
    assert.equal((html.match(/class="world-location__background"/g) ?? []).length, 1);
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
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search: '?recipe=banana-pancakes&from=coco' } } });
    const html = renderToStaticMarkup(<CookbookScreen />);
    assert.match(html, /role="dialog"/);
    Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { search: '?recipe=constructor' } } });
    assert.doesNotMatch(renderToStaticMarkup(<CookbookScreen />), /role="dialog"/);
  } finally {
    if (before) Object.defineProperty(globalThis, 'window', before); else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('de bakkerij begint bij de toonbank, met vijf avonturen die nog komen', () => {
  const location = WORLD_LOCATIONS.find(item => item.id === 'coco')!;
  // Geen losse activiteitenkaarten meer: wat je hier doet begint bij een
  // bestelling, en voedingsstoffen staat in de encyclopedie in de bovenbalk.
  assert.deepEqual(location.activities, []);
  const previews = location.adventurePreviews!;
  assert.equal(previews.length, 6);
  assert.equal(new Set(previews.map(item => item.id)).size, 6);
  // De toonbank is het eerste avontuur dat echt speelt; de rest staat nog op slot.
  assert.deepEqual(previews.filter(item => item.status !== 'locked').map(item => item.id), ['bestellingen']);
  for (const preview of previews) {
    assert.equal(preview.status, preview.id === 'bestellingen' ? 'available' : 'locked');
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
