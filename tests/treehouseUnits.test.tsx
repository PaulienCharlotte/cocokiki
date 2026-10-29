import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { existsSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { prototypeUnitLayout, ROOM_UNIT_ASSET, ROOM_UNIT_FRAME } from '../data/treehouseUnits';
import { resolveRoute } from '../platform/routes';
import TreehouseUnitTest from '../pages/TreehouseUnitTest';

test('room prototype has an isolated route without replacing the actual treehouse', () => {
  assert.deepEqual(resolveRoute('/treehouse/unit-test'), { route: { page: 'treehouse-unit-test', path: '/treehouse/unit-test' }, redirect: false });
  assert.equal(resolveRoute('/treehouse').route.page, 'destination');
  assert.equal(resolveRoute('/treehouse/kitchen').route.page, 'treehouse-room');
  assert.ok(existsSync(`public${ROOM_UNIT_ASSET}`));
});
test('four identical room units align on a two by two grid with optional shared beams', () => {
  const separate = prototypeUnitLayout(false), joined = prototypeUnitLayout(true);
  assert.equal(separate.units.length, 4);
  assert.equal(separate.width, ROOM_UNIT_FRAME.width * 2);
  assert.equal(separate.height, ROOM_UNIT_FRAME.height * 2);
  assert.equal(joined.width, separate.width - 72);
  assert.equal(joined.height, separate.height - 90);
  for (const layout of [separate, joined]) for (const unit of layout.units) {
    assert.ok(unit.x >= 0 && unit.y >= 0);
    assert.ok(unit.x + ROOM_UNIT_FRAME.width <= layout.width);
    assert.ok(unit.y + ROOM_UNIT_FRAME.height <= layout.height);
  }
  const html = renderToStaticMarkup(<TreehouseUnitTest />);
  assert.equal((html.match(/alt="Lege kamer /g) ?? []).length, 4);
  assert.match(html, /type="checkbox"/);
  assert.match(html, /aria-label="Zoom"/);
  assert.match(html, /Weergave herstellen/);
});
