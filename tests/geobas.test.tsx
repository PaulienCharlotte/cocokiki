import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { LOCATIONS } from '../constants';
import { areaLocations, availableModes, availableTopics, learningGroups, studyLocations, validateSelection } from '../data/learning';
import { TOPOGRAPHY_DATASETS, WORKSHEET_LOCATIONS } from '../data/topography/datasets';
import { validateWorksheetGeometry, WorksheetFeature, WorksheetGeometry } from '../data/topography/geometry';
import audit from '../data/topography/france-spain-portugal-geography.json';
import LearningSelection from '../components/LearningSelection';
import { testDraftKey } from '../services/topoTestDraft';

const dataset = TOPOGRAPHY_DATASETS[0];
const selection = { areaId: dataset.id, topicId: 'all' as const, clusterId: 'all' };
const geo = JSON.parse(readFileSync('public/data/geojson/france-spain-portugal.geo.json', 'utf8')) as WorksheetGeometry;
const feature = (number: number) => geo.features.find(f => f.properties.sourceNumber === number)!;
const coordinatePairs = (value: any[]): number[][] => typeof value[0] === 'number' ? [value] : value.flatMap(coordinatePairs);

// Onafhankelijke geografische controle op ijkpunten, niet op de labelankers.
function inRing(point: number[], ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > point[1]) !== (b[1] > point[1]) && point[0] < (b[0] - a[0]) * (point[1] - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
function contains(f: WorksheetFeature, lng: number, lat: number) {
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  return polys.some(rings => inRing([lng, lat], rings[0]) && !rings.slice(1).some(ring => inRing([lng, lat], ring)));
}

test('GeoBas preserves all 36 original names, IDs and source numbers and integrates existing modes', () => {
  assert.equal(WORKSHEET_LOCATIONS.length, 36);
  assert.deepEqual(WORKSHEET_LOCATIONS.map(l => l.sourceNumber), Array.from({ length: 36 }, (_, i) => i + 1));
  assert.equal(new Set(WORKSHEET_LOCATIONS.map(l => l.id)).size, 36);
  assert.deepEqual(WORKSHEET_LOCATIONS.map(l => l.name), dataset.items.map(l => l.name));
  assert.deepEqual(areaLocations(dataset.id), WORKSHEET_LOCATIONS);
  assert.deepEqual(studyLocations(selection), WORKSHEET_LOCATIONS);
  assert.deepEqual(validateSelection(selection), selection);
  assert.deepEqual(availableTopics(dataset.id), ['cities', 'waters', 'regions', 'countries', 'all']);
  assert.deepEqual(availableModes(selection), ['find', 'spell', 'memory', 'master', 'test']);
  const grouped = learningGroups(selection).flatMap(group => studyLocations({ ...selection, clusterId: group.id }));
  assert.deepEqual(grouped.map(l => l.id).sort(), WORKSHEET_LOCATIONS.map(l => l.id).sort());
  assert.equal(LOCATIONS.filter(l => l.provinceId === 'benelux').length, 26);
  assert.equal(LOCATIONS.filter(l => l.provinceId === 'midden-nederland').length, 27);
  assert.notEqual(testDraftKey(WORKSHEET_LOCATIONS.map(l => l.id)), testDraftKey(LOCATIONS.filter(l => l.provinceId === 'benelux').map(l => l.id)));
});

test('all 36 map objects have validated geographic geometry, with 21 points and 15 real lines/areas', () => {
  assert.equal(validateWorksheetGeometry(geo, dataset), geo);
  assert.equal(geo.features.filter(f => f.geometry.type === 'Point').length, 21);
  for (const f of geo.features) {
    const location = WORKSHEET_LOCATIONS.find(l => l.id === f.properties.id)!;
    assert.deepEqual(f.properties.anchor, [location.lat, location.lng]);
    for (const [lng, lat] of coordinatePairs(f.geometry.coordinates)) {
      assert.ok(Number.isFinite(lng) && Number.isFinite(lat));
      assert.ok(lng >= -14 && lng <= 17 && lat >= 34 && lat <= 54);
    }
  }
  for (const number of [29, 30]) {
    assert.match(feature(number).geometry.type, /LineString/);
    assert.ok(coordinatePairs(feature(number).geometry.coordinates).length > 100);
  }
  for (const number of [20, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 33, 34]) assert.match(feature(number).geometry.type, /Polygon/);
  const missing = structuredClone(geo); missing.features.pop();
  assert.throws(() => validateWorksheetGeometry(missing, dataset));
  const wrong = structuredClone(geo); wrong.features[28].geometry.type = 'Point';
  assert.throws(() => validateWorksheetGeometry(wrong, dataset));
  const duplicate = structuredClone(geo); duplicate.features[0] = duplicate.features[1];
  assert.throws(() => validateWorksheetGeometry(duplicate, dataset));
});

test('cities stay at supplied real-world anchors, cross-checked against Natural Earth populated places', () => {
  assert.equal(audit.cityChecks.length, 21);
  for (const check of audit.cityChecks) {
    const item = dataset.items.find(item => item.id === check.id)!;
    const location = WORKSHEET_LOCATIONS.find(l => l.id === check.id)!;
    assert.deepEqual([location.lat, location.lng], [item.anchor!.lat, item.anchor!.lng]);
    assert.ok(check.distanceKm < 5, item.name);
  }
  assert.ok(WORKSHEET_LOCATIONS.find(l => l.name === 'Nice')!.lng < WORKSHEET_LOCATIONS.find(l => l.name === 'Monaco')!.lng);
  assert.ok(WORKSHEET_LOCATIONS.find(l => l.name === 'Porto')!.lat > WORKSHEET_LOCATIONS.find(l => l.name === 'Lissabon')!.lat);
});

test('country, island, sea and mountain shapes cover the correct places without ocean over land', () => {
  assert.ok(contains(feature(26), 2.3522, 48.8566)); // Parijs in Frankrijk
  assert.ok(contains(feature(24), -3.7038, 40.4168)); // Madrid in Spanje
  assert.ok(contains(feature(25), -8, 39.5));
  assert.ok(!contains(feature(24), -8, 39.5));
  assert.ok(contains(feature(20), 3.0176, 39.6953));
  assert.ok(!contains(feature(20), 2.17, 41.38)); // Geen Barcelona in Mallorca
  assert.ok(contains(feature(21), 9.0129, 42.0396));
  assert.ok(contains(feature(22), 1.5218, 42.5063));
  assert.ok(contains(feature(23), 7.4246, 43.7384));
  assert.ok(contains(feature(31), -7, 46));
  assert.ok(contains(feature(32), 5, 39.5));
  for (const city of WORKSHEET_LOCATIONS.filter(l => l.type === 'city')) {
    assert.ok(!contains(feature(31), city.lng, city.lat), city.name + ' in oceaan');
    assert.ok(!contains(feature(32), city.lng, city.lat), city.name + ' in zee');
  }
  assert.ok(contains(feature(33), .6, 42.7));
  assert.ok(contains(feature(34), 7.5, 45.6));
  const riverNear = (number: number, lng: number, lat: number) => coordinatePairs(feature(number).geometry.coordinates)
    .some(point => Math.hypot((point[0] - lng) * Math.cos(lat * Math.PI / 180), point[1] - lat) < .08);
  assert.ok(riverNear(29, 2.3522, 48.8566), 'Seine bij Parijs');
  assert.ok(riverNear(29, .5, 49.49), 'Seine tot het estuarium bij Tancarville');
  assert.ok(riverNear(30, 4.8357, 45.764), 'Rhône bij Lyon');
});

test('worksheet appears in existing area selector without displaying school numbers', () => {
  const html = renderToStaticMarkup(<LearningSelection selection={selection} onChange={() => {}} />);
  assert.ok(html.includes(dataset.title));
  assert.ok(html.includes(`value="${dataset.id}"`));
  assert.ok(!html.includes('fr-es-pt-01'));
});
