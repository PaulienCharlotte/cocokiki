import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ROOM_TEMPLATES } from '../data/treehouse';
import { buyRoom, loadRoomExpansions, migrateRoomExpansions, nextRoomPrice, ownedRooms, ROOM_EXPANSIONS_KEY } from '../services/roomExpansions';
import { loadCurrency, saveCurrency } from '../services/currency';
import { LOCAL_STATE_KEY } from '../services/localState';
import { addRoomPurchasesOnce, createEmptyRoomInventory, layerRoomItem, migrateRoomInventory, moveRoomItem, placeRoomItem, roomItemDepth } from '../services/roomInventory';
import TreehouseInterior from '../pages/TreehouseInterior';
import RoomExpansionDialog from '../components/treehouse/RoomExpansionDialog';
import RoomNavigation from '../components/treehouse/RoomNavigation';
import { resolveRoute } from '../platform/routes';

function memory(run: (values: Map<string, string>, fail: (value: boolean) => void) => void) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>(); let blocked = false;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { if (blocked) throw Error('Storage full'); values.set(key, value); },
  } });
  try { run(values, value => { blocked = value; }); }
  finally { if (original) Object.defineProperty(globalThis, 'localStorage', original); else Reflect.deleteProperty(globalThis, 'localStorage'); }
}

test('room and balcony purchases have separate prices, stable instances and atomic duplicate protection', () => memory(() => {
  saveCurrency(2000);
  assert.equal(nextRoomPrice(loadRoomExpansions(), 'inside'), 150);
  assert.equal(nextRoomPrice(loadRoomExpansions(), 'balcony'), 100);
  const first = buyRoom('hobby-room', 'Mijn atelier', 'first-room');
  assert.equal(first.status, 'applied'); assert.equal(loadCurrency(), 1850);
  assert.deepEqual(buyRoom('hobby-room', 'Mijn atelier', 'first-room'), { status: 'duplicate', room: first.room });
  assert.equal(loadCurrency(), 1850);
  assert.equal(buyRoom('extra-bedroom', 'Ander', 'first-room').status, 'invalid');
  assert.equal(buyRoom('growing-deck', 'Kweekhoek', 'first-balcony').status, 'applied');
  assert.equal(nextRoomPrice(loadRoomExpansions(), 'inside'), 250);
  assert.equal(nextRoomPrice(loadRoomExpansions(), 'balcony'), 200);
  const beforeQuote = loadCurrency();
  assert.equal(buyRoom('hobby-room', 'Verouderde prijs', 'old-quote', 150).status, 'price-changed');
  assert.equal(loadCurrency(), beforeQuote);
  assert.equal(buyRoom('hobby-room', 'Tweede atelier', 'second-room').status, 'applied');
  assert.equal(buyRoom('greenhouse', 'Kas', 'second-balcony').status, 'applied');
  assert.equal(buyRoom('extra-bedroom', 'Logeerkamer', 'third-room').status, 'applied');
  assert.equal(loadCurrency(), 950);
  const saved = loadRoomExpansions();
  assert.equal(new Set(saved.rooms.map(room => room.id)).size, 5);
  assert.equal(buyRoom('hobby-room', 'Vol', 'fourth-room').status, 'full');
  assert.equal(buyRoom('growing-deck', 'Vol', 'third-balcony').status, 'full');
  assert.equal(ownedRooms().length, 9);
  assert.equal(ownedRooms().at(-1)?.label, 'Kas');
  assert.deepEqual(migrateRoomExpansions(JSON.parse(JSON.stringify(saved))), saved);
}));

test('insufficient funds and failed storage cannot charge coins or create rooms', () => memory((values, fail) => {
  saveCurrency(149);
  const before = values.get(LOCAL_STATE_KEY);
  assert.equal(buyRoom('hobby-room', 'Atelier', 'poor').status, 'insufficient');
  assert.equal(values.get(LOCAL_STATE_KEY), before);
  saveCurrency(150); const funded = values.get(LOCAL_STATE_KEY);
  fail(true);
  assert.equal(buyRoom('hobby-room', 'Atelier', 'retry').status, 'invalid');
  assert.equal(values.get(LOCAL_STATE_KEY), funded);
  fail(false);
  assert.equal(loadRoomExpansions().rooms.length, 0);
  assert.equal(buyRoom('hobby-room', 'Atelier', 'retry').status, 'applied');
  assert.equal(loadCurrency(), 0);
}));

test('legacy room items, plants, depth and new room ownership survive reload without duplication', () => memory(() => {
  saveCurrency(500);
  const purchase = buyRoom('hobby-room', 'Atelier', 'atelier');
  assert.ok(purchase.room);
  let state = addRoomPurchasesOnce(createEmptyRoomInventory(), 'items', { 'rose-pouf': 3 });
  const item = { id: 'item-1', productId: 'rose-pouf', room: 'bedroom' as const, x: 50, y: 70, view: 0, scale: 1, plantId: 'retained-plant' };
  state = placeRoomItem(state, item);
  state = placeRoomItem(state, { ...item, id: 'item-2', room: purchase.room! });
  state = placeRoomItem(state, { ...item, id: 'item-3', y: 80 });
  assert.equal(state.placements.length, 3);
  const front = layerRoomItem(state, item.id, 1);
  assert.ok(roomItemDepth(front.placements[0]) > roomItemDepth(front.placements[2]));
  const back = layerRoomItem(front, item.id, -1);
  assert.ok(roomItemDepth(back.placements[0]) < roomItemDepth(back.placements[2]));
  assert.deepEqual(back.placements[1], state.placements[1]);
  const moved = moveRoomItem(back, item.id, 50.5, 69.9);
  assert.equal(moved.placements[0].plantId, item.plantId);
  assert.equal(moved.placements[0].layer, back.placements[0].layer);
  assert.deepEqual(migrateRoomInventory(JSON.parse(JSON.stringify(moved))), moved);
  assert.equal(placeRoomItem(addRoomPurchasesOnce(createEmptyRoomInventory(), 'other', { 'rose-pouf': 1 }), { ...item, room: 'extra-5' }).placements.length, 0);
}));

test('corrupt room ownership fails closed and never destroys stored furniture placements', () => memory(values => {
  saveCurrency(500);
  values.set(ROOM_EXPANSIONS_KEY, '{broken');
  assert.equal(buyRoom('hobby-room', 'Atelier', 'bad-data').status, 'invalid');
  assert.equal(loadCurrency(), 500);
  const state = addRoomPurchasesOnce(createEmptyRoomInventory(), 'items', { 'rose-pouf': 1 });
  const saved = { ...state, placements: [{ id: 'preserve', productId: 'rose-pouf', room: 'extra-1', x: 50, y: 70, scale: 1, view: 0 }] };
  assert.equal(migrateRoomInventory(saved).placements[0].id, 'preserve');
  assert.equal(renderToStaticMarkup(<TreehouseInterior room="extra-1" onNavigate={() => undefined} />).includes('nog niet gebouwd'), true);
}));

test('depth normalization preserves positions, relative order and other rooms', () => {
  let state = addRoomPurchasesOnce(createEmptyRoomInventory(), 'many-layers', { 'rose-pouf': 3 });
  const item = { productId: 'rose-pouf', room: 'bedroom' as const, x: 40, y: 60, view: 0, scale: 1 };
  state = placeRoomItem(state, { ...item, id: 'first', layer: 9999 });
  state = placeRoomItem(state, { ...item, id: 'second', layer: 10000 });
  state = placeRoomItem(state, { ...item, id: 'elsewhere', room: 'terrace', layer: -7 });
  const next = layerRoomItem(state, 'first', 1);
  assert.ok(roomItemDepth(next.placements[0]) > roomItemDepth(next.placements[1]));
  assert.equal(next.placements[0].x, 40); assert.equal(next.placements[0].y, 60);
  assert.deepEqual(next.placements[2], state.placements[2]);
  assert.deepEqual(migrateRoomInventory(JSON.parse(JSON.stringify(next))), next);
});

test('expansion screens use supplied assets and expose navigation, purchase and inaccessible route protection', () => memory(() => {
  for (const template of ROOM_TEMPLATES) assert.ok(existsSync(`public${template.background}`));
  const nav = renderToStaticMarkup(<RoomNavigation onNavigate={() => undefined} />);
  assert.ok(nav.includes('Ruimte toevoegen'));
  assert.equal((nav.match(/<button/g) || []).length, 1);
  assert.ok(!nav.includes('<nav') && !nav.includes('Balkon uitbreiden'));
  assert.ok(!nav.includes('/treehouse/extra-'));
  assert.equal(resolveRoute('/treehouse/extra-1').route.page, 'treehouse-room');
  assert.equal(resolveRoute('/treehouse/extra-6').route.page, 'home');
  const dialog = renderToStaticMarkup(<RoomExpansionDialog onClose={() => undefined} onNavigate={() => undefined} />);
  assert.ok(dialog.includes('150 CocoCoins') && dialog.includes('disabled'));
  for (const label of ['Hobbykamer', 'Extra slaapkamer', 'Kweekhoek', 'Kas']) assert.ok(dialog.includes(label));
  const source = readFileSync('components/treehouse/RoomInventoryDrawer.tsx', 'utf8');
  assert.ok(source.includes('event.currentTarget.focus') && source.includes('offsetX') && source.includes('lostpointercapture'));
  assert.ok(source.includes('roomItemDepth') && !source.includes('isSelected ? 110'));
}));
