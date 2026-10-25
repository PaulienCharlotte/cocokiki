import assert from 'node:assert/strict';
import test from 'node:test';
import { boundedSchoolPoint, defaultSchoolLayout, loadSchoolLayout, migrateSchoolLayout, saveSchoolLayoutMode } from '../services/schoolLayout';
import { loadCurrency } from '../services/currency';

test('school layouts preserve defaults and reject corrupt icon coordinates', () => {
  const initial = defaultSchoolLayout();
  assert.deepEqual(migrateSchoolLayout(null), initial);
  const restored = migrateSchoolLayout({ version: 1, mobile: { topo: { x: -4, y: 10 }, clock: { x: 'wrong', y: .3 } } });
  assert.deepEqual(restored.mobile.topo, { x: 0, y: 1 });
  assert.deepEqual(restored.mobile.clock, initial.mobile.clock);
  assert.deepEqual(restored.desktop, initial.desktop);
});
test('school dragging keeps the whole icon inside its available space', () => {
  const left = boundedSchoolPoint(-100, -200, 360, 600, 160, 160);
  assert.deepEqual(left, { x: 84 / 360, y: 84 / 600 });
  const right = boundedSchoolPoint(1000, 1000, 360, 600, 160, 160);
  assert.deepEqual(right, { x: 276 / 360, y: 516 / 600 });
  assert.deepEqual(boundedSchoolPoint(0, 0, 0, 0, 160, 160), { x: .5, y: .5 });
});
test('school positions survive reload without changing coins or the other screen layout', () => {
  const previous = globalThis.localStorage;
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
  try {
    const initial = defaultSchoolLayout();
    assert.equal(saveSchoolLayoutMode('mobile', { ...initial.mobile, topo: { x: .3, y: .4 } }), true);
    assert.deepEqual(loadSchoolLayout().mobile.topo, { x: .3, y: .4 });
    assert.deepEqual(loadSchoolLayout().desktop, initial.desktop);
    assert.equal(saveSchoolLayoutMode('desktop', { ...initial.desktop, clock: { x: .6, y: .2 } }), true);
    assert.deepEqual(loadSchoolLayout().mobile.topo, { x: .3, y: .4 });
    assert.equal(loadCurrency(), 0);
    const getItem = globalThis.localStorage.getItem;
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem, setItem: () => { throw Error('full'); } } });
    assert.equal(saveSchoolLayoutMode('mobile', initial.mobile), false);
    assert.deepEqual(loadSchoolLayout().mobile.topo, { x: .3, y: .4 });
  } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous }); }
});
