import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { existsSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { assembledTreehouseLayout, buildSlots, expandableTreehouseLayout, INITIAL_BUILD_ROOMS, moveBuildRoom, prototypeUnitLayout, treehouseViewWidth, ROOM_UNIT_ASSET, ROOM_UNIT_FRAME, TREEHOUSE_UNIT_ASSETS, TREE_TRUNK_ASSETS, TREE_CANOPY_ASSETS, validBuildRooms } from '../data/treehouseUnits';
import { BUILD_PREVIEW_KEY, loadBuildPreview, saveBuildPreview } from '../services/treehouseBuildPreview';
import { commitLocalState } from '../services/localState';
import { loadCurrency } from '../services/currency';
import { resolveRoute } from '../platform/routes';
import TreehouseUnitTest from '../pages/TreehouseUnitTest';
import { loadTreehouseLayout, saveTreehouseLayout, roomSaleAmount, sellTreehouseRoom } from '../services/treehouseLayout';
import { buyRoom, loadRoomExpansions } from '../services/roomExpansions';
import { DECOR_PRODUCTS_BY_ID } from '../data/decorCatalog';
import { loadRoomInventory, ROOM_INVENTORY_KEY } from '../services/roomInventory';

test('mobile treehouse keeps rooms readable while desktop and preview still fit the whole scene', () => {
  const layout = expandableTreehouseLayout(true, INITIAL_BUILD_ROOMS);
  const mobile = treehouseViewWidth(375, 760, layout.width, layout.height, true);
  assert.ok(mobile > 375);
  assert.ok(mobile * ROOM_UNIT_FRAME.width / layout.width >= 185);
  assert.ok(mobile * layout.height / layout.width <= 760);
  assert.ok(treehouseViewWidth(1200, 760, layout.width, layout.height, true) <= 1200);
  assert.ok(treehouseViewWidth(375, 760, layout.width, layout.height, false) <= 375);
  assert.match(TREEHOUSE_UNIT_ASSETS.bathroom.src, /bathroom-empty.webp$/);
});

test('room prototype has an isolated route without replacing the actual treehouse', () => {
  assert.deepEqual(resolveRoute('/treehouse/unit-test'), { route: { page: 'treehouse-unit-test', path: '/treehouse/unit-test' }, redirect: false });
  assert.equal(resolveRoute('/treehouse').route.page, 'destination');
  assert.equal(resolveRoute('/treehouse/kitchen').route.page, 'treehouse-room');
  assert.ok(existsSync(`public${ROOM_UNIT_ASSET}`));
});

test('build slots use automatic tree support and move roofs above newly added rooms', () => {
  const slots = buildSlots(INITIAL_BUILD_ROOMS);
  assert.ok(slots.some(slot => slot.column === 0 && slot.floor === 2));
  assert.ok(slots.some(slot => slot.column === 2 && slot.floor === 0));
  assert.ok(!slots.some(slot => slot.column === 1 && slot.floor === 2));
  assert.ok(slots.some(slot => slot.column === 2 && slot.floor === 1));
  const rooms = [...INITIAL_BUILD_ROOMS, { id: 'new-room', asset: 'room' as const, name: 'Atelier', column: 0, floor: 2 }];
  const layout = expandableTreehouseLayout(true, rooms);
  assert.ok(layout.units.some(unit => unit.id === 'roof-new-room'));
  assert.ok(!layout.units.some(unit => unit.id === 'roof-bedroom'));
  assert.ok(!buildSlots(rooms).some(slot => slot.column >= 4 || slot.floor >= 4));
  for (const unit of layout.units) {
    assert.ok(unit.x >= 0 && unit.y >= 0);
    assert.ok(unit.x + unit.width <= layout.width);
    assert.ok(unit.y + unit.height <= layout.height);
  }
});

test('preview expansions persist separately without spending money or changing real rooms', () => {
  const original = globalThis.localStorage, memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
  try {
    const rooms = [...INITIAL_BUILD_ROOMS, { id: 'new-room', asset: 'bedroom' as const, name: 'Logeerkamer', column: 0, floor: 2 }];
    assert.equal(saveBuildPreview(rooms), true);
    assert.deepEqual(loadBuildPreview(), rooms);
    const swapped = moveBuildRoom(rooms, 'living-room', 1, 0)!;
    assert.ok(swapped);
    assert.equal(saveBuildPreview(swapped), true);
    assert.deepEqual(loadBuildPreview(), swapped);
    commitLocalState({ [BUILD_PREVIEW_KEY]: JSON.stringify(rooms.slice(4)) });
    assert.deepEqual(loadBuildPreview(), rooms);
    assert.equal(loadCurrency(), 0);
    const html = renderToStaticMarkup(<TreehouseUnitTest onNavigate={() => {}} />);
    assert.doesNotMatch(html, />Bekijken</);
    assert.doesNotMatch(html, /aria-label="Boomhutstand"/);
    assert.doesNotMatch(html, /Bouwinstellingen/);
    assert.equal((html.match(/aria-label="Kamer toevoegen"/g) ?? []).length, 1);
    assert.equal(saveBuildPreview(INITIAL_BUILD_ROOMS), true);
    assert.deepEqual(loadBuildPreview(), INITIAL_BUILD_ROOMS);
  } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original }); }
});

test('room movement swaps occupied slots, preserves identities and rejects unsupported layouts', () => {
  const swapped = moveBuildRoom(INITIAL_BUILD_ROOMS, 'bedroom', 1, 1)!;
  assert.ok(swapped);
  assert.equal(swapped.find(room => room.id === 'terrace')!.column, 0);
  assert.equal(swapped.find(room => room.id === 'bedroom')!.column, 1);
  assert.equal(moveBuildRoom(INITIAL_BUILD_ROOMS, 'living-room', 3, 0), null);
  assert.equal(moveBuildRoom(INITIAL_BUILD_ROOMS, 'bedroom', 1, 2), null);
  assert.equal(moveBuildRoom(INITIAL_BUILD_ROOMS, 'bedroom', -1, 0), null);
  assert.equal(moveBuildRoom(INITIAL_BUILD_ROOMS, 'bedroom', 4, 0), null);
  assert.equal(moveBuildRoom(INITIAL_BUILD_ROOMS, 'bedroom', 0.5, 1), null);
  assert.equal(moveBuildRoom(INITIAL_BUILD_ROOMS, 'missing', 0, 0), null);
  const moved = moveBuildRoom(INITIAL_BUILD_ROOMS, 'bedroom', 2, 0)!;
  assert.ok(moved);
  assert.equal(moved.length, INITIAL_BUILD_ROOMS.length);
  assert.equal(INITIAL_BUILD_ROOMS.find(room => room.id === 'bedroom')!.floor, 1);
});

test('platforms, free trees and ladders follow the room layout without occupying build slots', () => {
  const layout = expandableTreehouseLayout(true, INITIAL_BUILD_ROOMS);
  assert.equal(layout.units.filter(unit => unit.asset === 'platform').length, 4);
  assert.equal(layout.units.filter(unit => unit.asset === 'ladder').length, 2);
  assert.equal(layout.units.filter(unit => TREE_CANOPY_ASSETS.includes(unit.asset)).length, 2);
  assert.equal(layout.units.filter(unit => TREE_TRUNK_ASSETS.includes(unit.asset)).length, 2);
  assert.ok(!layout.units.some(unit => unit.id.startsWith('brace-')));
  assert.ok(layout.units.findIndex(unit => TREE_CANOPY_ASSETS.includes(unit.asset)) < layout.units.findIndex(unit => unit.id === 'kitchen'));
  assert.ok(layout.units.findIndex(unit => unit.asset === 'ladder') > layout.units.findIndex(unit => unit.id === 'kitchen'));
  const full = Array.from({ length: 16 }, (_, i) => ({ id: `full-${i}`, asset: 'room' as const, name: 'Kamer', column: i % 4, floor: Math.floor(i / 4) }));
  for (const joined of [true, false]) {
    const result = expandableTreehouseLayout(joined, full);
    assert.equal(result.units.filter(unit => unit.asset === 'platform').length, 16);
    assert.equal(result.units.filter(unit => unit.asset === 'ladder').length, 4);
    assert.equal(result.slots.length, 0);
    for (const unit of result.units) {
      assert.ok(unit.x >= 0 && unit.y >= 0, unit.id);
      assert.ok(unit.x + unit.width <= result.width, unit.id);
      assert.ok(unit.y + unit.height <= result.height, unit.id);
    }
  }
});

test('side extensions generate a free tree per occupied column, while terraces stay open', () => {
  const swapped = moveBuildRoom(INITIAL_BUILD_ROOMS, 'bedroom', 1, 1)!;
  const overhang = { id: 'overhang', asset: 'room' as const, name: 'Atelier', column: 2, floor: 1 };
  assert.ok(buildSlots(swapped).some(slot => slot.column === 2 && slot.floor === 1));
  const rooms = [...swapped, overhang];
  assert.equal(validBuildRooms(rooms), true);
  const layout = expandableTreehouseLayout(true, rooms);
  assert.ok(layout.units.some(unit => unit.id === 'trunk-2'));
  assert.ok(layout.units.some(unit => unit.id === 'canopy-2'));
  assert.equal(validBuildRooms([...rooms, { ...overhang, id: 'supported-by-tree', column: 3 }]), true);
  assert.equal(validBuildRooms([...INITIAL_BUILD_ROOMS, overhang]), true);
  assert.equal(validBuildRooms([...swapped, { ...overhang, column: 0, floor: 2 }]), false);
});

test('tree support does not duplicate on stacking and disappears with an empty column', () => {
  const moved = moveBuildRoom(INITIAL_BUILD_ROOMS, 'bedroom', 2, 0)!;
  assert.equal(expandableTreehouseLayout(true, moved).units.filter(unit => TREE_TRUNK_ASSETS.includes(unit.asset)).length, 3);
  const restored = moveBuildRoom(moved, 'bedroom', 0, 1)!;
  assert.equal(expandableTreehouseLayout(true, restored).units.filter(unit => TREE_TRUNK_ASSETS.includes(unit.asset)).length, 2);
});

test('each roof retains the identity of its movable room after rearranging', () => {
  for (const rooms of [INITIAL_BUILD_ROOMS, moveBuildRoom(INITIAL_BUILD_ROOMS, 'bedroom', 1, 1)!]) {
    const layout = expandableTreehouseLayout(true, rooms);
    for (const roof of layout.units.filter(unit => unit.asset === 'roof')) {
      assert.ok(roof.roomId);
      assert.equal(roof.id, `roof-${roof.roomId}`);
      assert.ok(rooms.some(room => room.id === roof.roomId));
      assert.ok(layout.units.some(unit => unit.id === roof.roomId && unit.asset !== 'terrace'));
    }
  }
});

test('a flat arrangement retains a ground access ladder even without upper floors', () => {
  const flat = INITIAL_BUILD_ROOMS.map((room, index) => ({ ...room, column: index, floor: 0 }));
  const layout = expandableTreehouseLayout(true, flat);
  const ladder = layout.units.find(unit => unit.id === 'ladder-ground')!;
  assert.ok(ladder);
  const platform = layout.units.find(unit => unit.id === 'platform-living-room')!;
  assert.ok(ladder.y < platform.y + platform.height);
  assert.ok(ladder.y + ladder.height > platform.y + platform.height);
});

test('separate upper groups each receive their own ladder', () => {
  const rooms = [0, 1, 2, 3].map(column => ({ id: `base-${column}`, name: 'Kamer', asset: 'room' as const, column, floor: 0 }));
  rooms.push({ id: 'upper-left', name: 'Boven', asset: 'room', column: 0, floor: 1 }, { id: 'upper-right', name: 'Boven', asset: 'room', column: 3, floor: 1 });
  assert.equal(expandableTreehouseLayout(true, rooms).units.filter(unit => unit.asset === 'ladder').length, 3);
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
  assert.equal((html.match(/is-movable/g) ?? []).length, 5);
  assert.match(html, /Slaapkamer met dak verplaatsen/);
  assert.doesNotMatch(html, /type="checkbox"/);
  assert.match(html, /aria-label="Zoom"/);
  assert.match(html, /Weergave herstellen/);
  assert.match(html, /Bouwinstellingen/);
  assert.match(html, /Inzoomen/);
  assert.match(html, /Uitzoomen/);
});

test('assembled treehouse uses every supplied asset and aligns terrace with bedroom floor', () => {
  for (const asset of Object.values(TREEHOUSE_UNIT_ASSETS)) assert.ok(existsSync(`public${asset.src}`));
  for (const joined of [false, true]) {
    const layout = assembledTreehouseLayout(joined);
    assert.equal(layout.units[0].asset, 'trunk');
    assert.equal(new Set(layout.units.map(unit => unit.asset)).size, 6);
    const bedroom = layout.units.find(unit => unit.id === 'bedroom')!;
    const terrace = layout.units.find(unit => unit.id === 'terrace')!;
    assert.equal(terrace.y + terrace.height, bedroom.y + bedroom.height);
    for (const unit of layout.units) {
      assert.ok(unit.x >= 0 && unit.y >= 0);
      assert.ok(unit.x + unit.width <= layout.width);
      assert.ok(unit.y + unit.height <= layout.height);
    }
  }
});

test('live treehouse starts with five free rooms and persists custom icons independently of the prototype', () => {
  const original = globalThis.localStorage, memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
  try {
    const rooms = loadTreehouseLayout();
    assert.deepEqual(rooms.map(room => room.id), ['living-room', 'kitchen', 'bathroom', 'bedroom', 'terrace']);
    assert.equal(validBuildRooms(rooms), true);
    assert.equal(loadCurrency(), 0);
    assert.equal(saveTreehouseLayout(rooms.map(room => room.id === 'bedroom' ? { ...room, icon: 'heart' } : room)), true);
    assert.equal(loadTreehouseLayout().find(room => room.id === 'bedroom')!.icon, 'heart');
    assert.equal(loadBuildPreview().length, 4);
    assert.equal(saveTreehouseLayout(rooms.slice(1)), false);
    assert.equal(sellTreehouseRoom('kitchen'), false);
    assert.equal(resolveRoute('/treehouse/bathroom').route.page, 'treehouse-room');
  } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original }); }
});

test('purchased rooms appear in the live layout, sell at the receipt value and cannot sell twice', () => {
  const original = globalThis.localStorage, memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
  try {
    commitLocalState({}, [{ id: 'test-start', amount: 1000 }]);
    const originalRooms = loadTreehouseLayout();
    assert.equal(saveTreehouseLayout(originalRooms), true);
    const bought = buyRoom('hobby-room', 'Atelier', 'live-room-purchase', 150);
    assert.equal(bought.status, 'applied');
    assert.equal(loadTreehouseLayout().length, 6);
    assert.equal(roomSaleAmount(bought.room!), 105);
    const productId = Object.keys(DECOR_PRODUCTS_BY_ID)[0];
    commitLocalState({ [ROOM_INVENTORY_KEY]: JSON.stringify({ version: 1, owned: { [productId]: 1 }, appliedTransactions: [], placements: [{ id: 'test-furniture', productId, room: bought.room, x: 50, y: 70, view: 0, scale: 1 }] }) });
    assert.equal(loadRoomInventory().placements.length, 1);
    assert.equal(sellTreehouseRoom(bought.room!), true);
    assert.equal(loadRoomInventory().placements.length, 0);
    assert.equal(loadRoomInventory().owned[productId], 1);
    assert.equal(loadCurrency(), 955);
    assert.equal(loadTreehouseLayout().length, 5);
    assert.equal(loadRoomExpansions().rooms.length, 0);
    assert.equal(sellTreehouseRoom(bought.room!), false);
    assert.equal(loadCurrency(), 955);
  } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original }); }
});
