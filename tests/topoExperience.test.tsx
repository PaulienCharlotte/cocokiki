import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LOCATIONS } from '../constants';
import { WORKSHEET_LOCATIONS } from '../data/topography/datasets';
import { GEOBAS_FACTS, locationFact } from '../data/topography/facts';
import { LOCATION_FACTS } from '../data/locationFacts';
import { guardedNavigation, hasNavigationGuard, registerNavigationGuard } from '../services/navigationGuard';
import TopoExitDialog from '../components/topography/TopoExitDialog';

test('all GeoBas places and countries expose a specific discovery fact without changing existing facts', () => {
  assert.equal(WORKSHEET_LOCATIONS.length, 36);
  for (const location of WORKSHEET_LOCATIONS) {
    const fact = locationFact(location).fact;
    assert.ok(fact.length > 30, location.name);
    assert.ok(LOCATION_FACTS[location.name] || GEOBAS_FACTS[location.name], 'Specifiek weetje voor ' + location.name);
    if (LOCATION_FACTS[location.name]) assert.equal(locationFact(location), LOCATION_FACTS[location.name]);
  }
  assert.match(locationFact(WORKSHEET_LOCATIONS.find(l => l.name === 'Lissabon')!).fact, /Taag/);
  assert.match(locationFact(WORKSHEET_LOCATIONS.find(l => l.name === 'Seine')!).fact, /Parijs/);
});

test('any selectable location still has useful discovery information when a custom fact is missing', () => {
  for (const location of LOCATIONS) assert.ok(locationFact(location).fact.trim(), location.id);
  assert.match(locationFact({ id: 'unknown', name: 'Nieuwe plaats', provinceId: 'zh', type: 'city', lat: 52, lng: 4 }).fact, /provincie Zuid-Holland/);
});

test('topo exit confirmation takes priority over a child test and restores other guards on cleanup', () => {
  let pending: (() => void) | undefined;
  let destination = '';
  let childCalls = 0;
  const removeTopo = registerNavigationGuard(proceed => { pending = proceed; }, 1);
  const removeTest = registerNavigationGuard(() => { childCalls++; });
  guardedNavigation(() => { destination = 'home'; });
  assert.equal(destination, '');
  assert.equal(childCalls, 0);
  pending = undefined; // Verder met topo: de bestemming niet uitvoeren.
  assert.equal(destination, '');
  guardedNavigation(() => { destination = 'island'; });
  pending?.();
  assert.equal(destination, 'island');
  removeTest();
  assert.equal(hasNavigationGuard(), true);
  removeTopo();
  assert.equal(hasNavigationGuard(), false);
  guardedNavigation(() => { destination = 'shop'; });
  assert.equal(destination, 'shop');
});

test('exit dialog offers an explicit safe stay action and a separate leave action', () => {
  const html = renderToStaticMarkup(<TopoExitDialog open onStay={() => {}} onLeave={() => {}} />);
  assert.match(html, /Weet je zeker dat je de topo wilt verlaten\?/);
  assert.match(html, /Verder met topo/);
  assert.match(html, /Topo verlaten/);
  assert.match(html, /role="dialog"/);
});
