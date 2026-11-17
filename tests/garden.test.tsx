import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import GardenScreen, { GardenTaskPanel } from '../pages/GardenScreen';
import { GARDEN_CROPS, GARDEN_CROPS_BY_ID, gardenNeighbours, gardenPairAdvice, gardenSeason, gardenTask, parseGardenNumber } from '../data/plants/garden';
import { GARDEN_KEY, emptyGarden, harvestGarden, loadGarden, migrateGarden, nextGardenDay, plantGardenPlot, setGardenLevel, solveGardenPart, revealGardenAnswer, currentGardenPart, useGardenHarvest } from '../services/garden';
import { loadCurrency } from '../services/currency';
import { loadCookingProgress } from '../services/cookingProgress';
import { commitLocalState } from '../services/localState';

function stored(run: (block: (value: boolean) => void) => void) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const map = new Map<string, string>(); let blocked = false;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { if (blocked) throw Error('vol'); map.set(key, value); } } });
  try { run(value => { blocked = value; }); } finally { if (previous) Object.defineProperty(globalThis, 'localStorage', previous); else Reflect.deleteProperty(globalThis, 'localStorage'); }
}
function finish(index: number, assisted = false) {
  for (let step = loadGarden().plots[index]!.step; step < 4; step++) {
    let state = loadGarden(); const plot = state.plots[index]!;
    if (step > 0 && plot.lastCareDay >= state.day) { assert.ok(nextGardenDay()); state = loadGarden(); }
    const task = gardenTask(GARDEN_CROPS_BY_ID[plot.cropId], step, state.level);
    for (const part of (step === 0 ? ['action', 'conversion'] : ['conversion', 'action']) as Array<'action' | 'conversion'>) {
      if (currentGardenPart(loadGarden().plots[index]!) !== part) continue;
      if (assisted) assert.ok(revealGardenAnswer(index, plot.id, step, part));
      assert.equal(solveGardenPart(index, plot.id, step, part, String(task.answer).replace('.', ','), [0, 2, 4, 6], task.waterMl), 'correct');
    }
  }
}
test('moestuin heeft zes gewassen, beelden en vaste aangrenzende vakken', () => {
  assert.equal(GARDEN_CROPS.length, 6);
  assert.equal(new Set(GARDEN_CROPS.map(crop => crop.id)).size, 6);
  for (const crop of GARDEN_CROPS) { assert.ok(existsSync(`public${crop.image}`)); assert.ok(crop.spacing > 0 && crop.coins > 0); }
  for (const name of ['navigation', 'terrain-natural', 'bed-earth', 'seedling-natural']) {
    const path = `public/assets/library/plants/garden/${name}.webp`;
    assert.ok(existsSync(path), name);
    if (name !== 'terrain-natural') assert.ok(readFileSync(path).subarray(0, 200).includes('ALPH'), `${name}: transparantie ontbreekt`);
  }
  assert.deepEqual(gardenNeighbours(0), [1, 3]);
  assert.deepEqual(gardenNeighbours(2), [1, 5]);
  assert.match(gardenPairAdvice(GARDEN_CROPS_BY_ID.tomato, GARDEN_CROPS_BY_ID.carrot), /schaduw/);
});
test('metrische opdrachten rekenen cm naar mm en dm, drie tussenruimtes en cl naar liter juist om', () => {
  const crop = GARDEN_CROPS_BY_ID.carrot;
  assert.equal(gardenTask(crop, 0, 1).answer, 50);
  assert.equal(gardenTask(crop, 0, 2).answer, .5);
  assert.equal(gardenTask(crop, 0, 3).answer, 1.5);
  assert.equal(gardenTask(crop, 1, 1).answer, 100);
  assert.equal(gardenTask(crop, 1, 2).answer, .1);
  assert.equal(gardenTask(crop, 2, 2).answer, .4);
  assert.equal(gardenTask(crop, 3, 2).answer, .7);
  assert.equal(gardenTask(crop, 3, 3).answer, 2.8);
  assert.equal(parseGardenNumber(' 0,1 '), .1);
  assert.equal(parseGardenNumber('0.1'), .1);
  for (const value of ['', '1,2,3', '1e2', '-1', 'Infinity', '0.1 liter']) assert.equal(parseGardenNumber(value), null);
});
test('plaatsen en omrekenen zijn aparte opdrachten met eenmalige beloningen', () => stored(() => {
  assert.ok(plantGardenPlot(0, 'carrot'));
  assert.equal(plantGardenPlot(0, 'tomato'), false);
  const plot = loadGarden().plots[0]!;
  assert.equal(solveGardenPart(0, plot.id, 0, 'action', '', [0, 1, 2, 3]), 'wrong');
  assert.equal(solveGardenPart(0, plot.id, 0, 'conversion', '50'), 'stale');
  assert.equal(solveGardenPart(0, plot.id, 0, 'action', '', [0, 2, 4, 6]), 'correct');
  assert.equal(loadCurrency(), 2);
  assert.equal(loadGarden().plots[0]!.step, 0);
  assert.equal(solveGardenPart(0, plot.id, 0, 'action', '', [0, 2, 4, 6]), 'stale');
  assert.equal(solveGardenPart(0, plot.id, 0, 'conversion', '5'), 'wrong');
  assert.equal(solveGardenPart(0, plot.id, 0, 'conversion', '50'), 'correct');
  assert.equal(loadCurrency(), 4);
  assert.equal(solveGardenPart(0, plot.id, 1, 'conversion', '100'), 'correct');
  assert.equal(solveGardenPart(0, plot.id, 1, 'action', '', [], 200), 'wrong');
  assert.equal(solveGardenPart(0, plot.id, 1, 'action', '', [], 100), 'correct');
  assert.equal(solveGardenPart(0, plot.id, 2, 'conversion', '400'), 'stale');
  assert.ok(nextGardenDay());
  assert.equal(solveGardenPart(0, plot.id, 2, 'conversion', '400'), 'correct');
}));
test('elk gewas doorloopt planten, verzorgen, oogsten en eenmalig verkopen', () => stored(() => {
  let earned = 0;
  GARDEN_CROPS.forEach((crop, index) => {
    while (!crop.start.includes(gardenSeason(loadGarden().day))) assert.ok(nextGardenDay());
    assert.ok(plantGardenPlot(index, crop.id));
    const plot = loadGarden().plots[index]!;
    assert.equal(harvestGarden(index, plot.id), false);
    finish(index);
    assert.equal(loadGarden().plots[index]!.step, 4);
    assert.ok(harvestGarden(index, plot.id));
    assert.equal(harvestGarden(index, plot.id), false);
    assert.ok(loadGarden().discovered.includes(crop.id));
    assert.ok(useGardenHarvest(plot.id, 'coins'));
    assert.equal(useGardenHarvest(plot.id, 'coins'), false);
    assert.equal(useGardenHarvest(plot.id, 'kitchen'), false);
    earned += 16 + crop.coins; assert.equal(loadCurrency(), earned);
  });
}));
test('oogst gaat atomair naar Coco of munten, niet allebei, ook bij volle opslag', () => stored(block => {
  assert.ok(plantGardenPlot(0, 'strawberry')); finish(0);
  const plot = loadGarden().plots[0]!;
  assert.ok(harvestGarden(0, plot.id));
  const before = loadCookingProgress().inventory.consumables.strawberry ?? 0;
  block(true);
  assert.equal(useGardenHarvest(plot.id, 'kitchen'), false);
  block(false);
  assert.equal(loadCookingProgress().inventory.consumables.strawberry ?? 0, before);
  assert.equal(loadGarden().harvests[0].destination, undefined);
  assert.ok(useGardenHarvest(plot.id, 'kitchen'));
  assert.equal(loadCookingProgress().inventory.consumables.strawberry, before + 250);
  assert.equal(useGardenHarvest(plot.id, 'kitchen'), false);
  assert.equal(useGardenHarvest(plot.id, 'coins'), false);
  assert.equal(loadCurrency(), 16);
}));
test('spelseizoenen beperken nieuwe aanplant, maar afwezigheid beschadigt geen bestaande planten', () => stored(() => {
  assert.ok(plantGardenPlot(0, 'tomato'));
  const plot = loadGarden().plots[0]!;
  for (let i = 0; i < 21; i++) assert.equal(nextGardenDay(), false);
  assert.equal(loadGarden().day, 1);
  assert.deepEqual(loadGarden().plots[0], plot);
  assert.equal(loadGarden().plots[0]!.step, 0);
  assert.equal(plantGardenPlot(-1, 'carrot'), false);
  assert.equal(setGardenLevel(99), false);
  assert.ok(setGardenLevel(3));
  assert.equal(loadGarden().level, 3);
}));
test('hulp blijft na herladen bewaard en geeft geen opdrachtmunten, de plant groeit wel', () => stored(block => {
  assert.ok(plantGardenPlot(0, 'carrot'));
  const plot = loadGarden().plots[0]!;
  block(true);
  assert.equal(revealGardenAnswer(0, plot.id, 0, 'action'), false);
  block(false);
  assert.deepEqual(loadGarden().plots[0]!.helpedParts, []);
  assert.ok(revealGardenAnswer(0, plot.id, 0, 'action'));
  assert.ok(loadGarden().plots[0]!.helpedParts!.includes('0:action'));
  assert.ok(setGardenLevel(2));
  assert.ok(setGardenLevel(1));
  assert.equal(solveGardenPart(0, plot.id, 0, 'action', '', [0, 2, 4, 6]), 'correct');
  assert.equal(loadCurrency(), 0);
  assert.equal(revealGardenAnswer(0, plot.id, 0, 'action'), false);
  assert.equal(solveGardenPart(0, plot.id, 0, 'action', '', [0, 2, 4, 6]), 'stale');
  assert.equal(solveGardenPart(0, plot.id, 0, 'conversion', '50'), 'correct');
  assert.equal(loadCurrency(), 2);
  finish(0, true);
  assert.ok(plantGardenPlot(1, 'radish'));
  finish(1, true);
  assert.equal(loadGarden().plots[1]!.step, 4);
  assert.equal(loadGarden().plots[1]!.helpedParts!.length, 8);
  assert.equal(loadCurrency(), 2);
}));
test('de opdracht toont maar één handeling of één omrekening; hulp toont het antwoord', () => {
  const crop = GARDEN_CROPS_BY_ID.carrot;
  const plot = { id: 'p', cropId: crop.id, step: 0, lastCareDay: 0 };
  const base = { crop, level: 1, onHelp: () => true, onSubmit: () => 'correct' };
  const action = renderToStaticMarkup(<GardenTaskPanel {...base} plot={plot} />);
  assert.match(action, /Plant vier zaadjes/);
  assert.equal((action.match(/aria-pressed=/g) ?? []).length, 13);
  assert.match(action, /aria-label="30 cm"/);
  assert.doesNotMatch(action, /id="garden-answer"/);
  assert.doesNotMatch(action, /Over dit gewas|Mijn plantenburen/);
  const conversion = renderToStaticMarkup(<GardenTaskPanel {...base} plot={{ ...plot, part: 'conversion' }} />);
  assert.match(conversion, /Hoeveel mm is 5 cm/);
  assert.doesNotMatch(conversion, /garden-ruler|garden-jug/);
  const helped = renderToStaticMarkup(<GardenTaskPanel {...base} plot={{ ...plot, part: 'conversion', helpedParts: ['0:conversion'] }} />);
  assert.match(helped, /Het antwoord is 50 mm/);
  assert.match(helped, /geen CocoCoins/);
  assert.doesNotMatch(helped, /id="garden-answer"/);
});
test('extra meetkeuzes tellen alleen bij de juiste afstand, niet bij vier willekeurige plekken', () => stored(() => {
  assert.ok(plantGardenPlot(0, 'carrot'));
  const plot = loadGarden().plots[0]!;
  assert.equal(solveGardenPart(0, plot.id, 0, 'action', '', [0, 1, 2, 3]), 'wrong');
  assert.equal(solveGardenPart(0, plot.id, 0, 'action', '', [0, 4, 8, 12]), 'wrong');
  assert.equal(loadCurrency(), 0);
  assert.equal(solveGardenPart(0, plot.id, 0, 'action', '', [0, 2, 4, 6]), 'correct');
}));
test('beschadigde moestuindata wordt begrensd en het scherm toont zes bereikbare vakken', () => stored(() => {
  assert.deepEqual(migrateGarden(null), emptyGarden());
  const restored = migrateGarden({ ...emptyGarden(), day: -1, level: 99, plots: [{ id: 'p', cropId: 'carrot', step: 999 }, { id: 'p', cropId: 'carrot', step: 4 }], harvests: [{ id: 'p', cropId: 'carrot' }] });
  assert.equal(restored.day, 1); assert.equal(restored.level, 1);
  assert.equal(restored.plots[0]!.step, 0); assert.equal(restored.plots[1], null); assert.equal(restored.harvests.length, 0);
  commitLocalState({ [GARDEN_KEY]: JSON.stringify(restored) });
  const html = renderToStaticMarkup(<GardenScreen onNavigate={() => {}} />);
  assert.match(html, /Mijn moestuin/);
  assert.match(html, /Vak 6:/);
  // Geen grijze uitgeschakelde knop: moet er eerst verzorgd worden, dan zegt Kiki dat.
  assert.match(html, /Volgende tuindag|Verzorg eerst je geplante vakken/);
  assert.match(html, /data-wereld="tuin"/);
  assert.doesNotMatch(html, /<table/);
}));
