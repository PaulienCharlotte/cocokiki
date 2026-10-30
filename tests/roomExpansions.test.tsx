import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ROOM_TEMPLATES, ROOM_MODULE_INTERIORS, ROOM_TEMPLATE_ASSETS, TREEHOUSE_ROOMS_BY_ID } from '../data/treehouse';
import { buyRoom, loadRoomExpansions, migrateRoomExpansions, nextRoomPrice, roomTemplatePrice, ownedRooms, ROOM_EXPANSIONS_KEY } from '../services/roomExpansions';
import { loadCurrency, saveCurrency } from '../services/currency';
import { LOCAL_STATE_KEY } from '../services/localState';
import { addRoomPurchasesOnce, createEmptyRoomInventory, layerRoomItem, migrateRoomInventory, moveRoomItem, placeRoomItem, roomItemDepth } from '../services/roomInventory';
import TreehouseInterior from '../pages/TreehouseInterior';
import RoomExpansionDialog from '../components/treehouse/RoomExpansionDialog';
import RoomNavigation from '../components/treehouse/RoomNavigation';
import { resolveRoute } from '../platform/routes';
import { buyRoomRoof, loadTreehouseRoofs, roofPrice, TREEHOUSE_ROOFS_KEY } from '../services/treehouseRoofs';
import { loadTreehouseLayout, saveTreehouseLayout, roomSaleAmount, sellTreehouseRoom, TREEHOUSE_LAYOUT_KEY } from '../services/treehouseLayout';
import { commitLocalState } from '../services/localState';
import { expandableTreehouseLayout, moveBuildRoom, STARTER_HOME_ROOMS, validBuildRooms, type BuildRoom } from '../data/treehouseUnits';
import BuildShop from '../components/treehouse/BuildShop';

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

test('every expansion interior matches its module and repeated room types share their interior', () => {
  for (const template of ROOM_TEMPLATES) {
    assert.equal(template.background, ROOM_MODULE_INTERIORS[ROOM_TEMPLATE_ASSETS[template.id]], template.id);
    assert.ok(existsSync(`public${template.background}`));
    assert.ok(!template.background.includes('/units/'));
  }
  assert.equal(TREEHOUSE_ROOMS_BY_ID.bathroom.background, ROOM_MODULE_INTERIORS.bathroom);
  assert.equal(TREEHOUSE_ROOMS_BY_ID.bedroom.background, ROOM_MODULE_INTERIORS.bedroom);
  assert.equal(ROOM_TEMPLATE_ASSETS['growing-deck'], 'terrace');
  assert.equal(ROOM_TEMPLATE_ASSETS.greenhouse, 'garden');
});

test('legacy closed balcony supports keep their saved coordinates and owned rooms', () => memory(() => {
  const rooms: BuildRoom[] = [...STARTER_HOME_ROOMS.map(room => ({ ...room })),
    { id: 'extra-1', asset: 'room', name: 'Kas', column: 2, floor: 1 },
    { id: 'extra-2', asset: 'room', name: 'Atelier', column: 2, floor: 2 },
  ];
  assert.equal(validBuildRooms(rooms), true);
  commitLocalState({
    [ROOM_EXPANSIONS_KEY]: JSON.stringify({ version: 1, rooms: [
      { id: 'extra-1', template: 'greenhouse', name: 'Kas', purchaseId: 'legacy-kas' },
      { id: 'extra-2', template: 'hobby-room', name: 'Atelier', purchaseId: 'legacy-atelier' },
    ] }),
    [TREEHOUSE_LAYOUT_KEY]: JSON.stringify({ version: 1, rooms }),
  });
  const loaded = loadTreehouseLayout();
  assert.equal(loaded.length, rooms.length);
  assert.equal(loaded.find(room => room.id === 'extra-1')?.asset, 'room');
  assert.equal(loaded.find(room => room.id === 'extra-2')?.floor, 2);
  assert.equal(ownedRooms().find(room => room.id === 'extra-1')?.background, ROOM_MODULE_INTERIORS.garden);
}));

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
  assert.equal(nextRoomPrice(saved, 'inside'), 450);
  assert.equal(nextRoomPrice(saved, 'balcony'), 300);
  assert.equal(ownedRooms().length, 10);
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

test('garden-room premium applies to new purchases without repricing old receipts', () => memory(() => {
  saveCurrency(1000);
  assert.equal(roomTemplatePrice(loadRoomExpansions(), 'garden-room'), 250);
  assert.equal(roomTemplatePrice(loadRoomExpansions(), 'growing-deck'), 100);
  assert.equal(buyRoom('garden-room', 'Tuinkamer', 'stale-garden', 100).status, 'price-changed');
  assert.equal(loadCurrency(), 1000);
  const bought = buyRoom('garden-room', 'Tuinkamer', 'new-garden', 250);
  assert.equal(bought.status, 'applied');
  assert.equal(loadCurrency(), 750);
  assert.equal(roomSaleAmount(bought.room!), 175);
  const state = loadRoomExpansions();
  commitLocalState({ [ROOM_EXPANSIONS_KEY]: JSON.stringify({ ...state, rooms: [...state.rooms, { id: 'extra-2', template: 'garden-room', name: 'Oude tuinkamer', purchaseId: 'legacy-garden' }] }) }, [{ id: 'room:buy:legacy-garden', amount: -100 }]);
  assert.equal(roomSaleAmount('extra-2'), 70);
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
  assert.equal(resolveRoute('/treehouse/extra-6').route.page, 'treehouse-room');
  assert.equal(resolveRoute('/treehouse/extra-12').route.page, 'home');
  const dialog = renderToStaticMarkup(<RoomExpansionDialog onClose={() => undefined} onNavigate={() => undefined} />);
  assert.ok(dialog.includes('150 CocoCoins') && dialog.includes('disabled'));
  assert.ok(!dialog.includes('Je saldo') && !dialog.includes('CocoCoins nodig'));
  for (const label of ['Hobbykamer', 'Extra slaapkamer', 'Kweekhoek', 'Kas']) assert.ok(dialog.includes(label));
  const source = readFileSync('components/treehouse/RoomInventoryDrawer.tsx', 'utf8');
  assert.ok(source.includes('event.currentTarget.focus') && source.includes('offsetX') && source.includes('lostpointercapture'));
  assert.ok(source.includes('roomItemDepth') && !source.includes('isSelected ? 110'));
}));

test('building shop shows illustrated modules, tabs and prices before the icon step', () => memory(() => {
  const html = renderToStaticMarkup(<BuildShop onClose={() => undefined} onBuilt={() => undefined} />);
  assert.match(html, /Breid je boomhut uit/);
  assert.match(html, /Tuinkamer/);
  assert.match(html, /Badkamer/);
  assert.match(html, /Roze kamer/);
  assert.match(html, /role="tab"/);
  assert.match(html, /150 CocoCoins/);
  assert.match(html, /garden-room.png/);
}));

test('new room modules retain their actual assets, name and icon on reload', () => memory(() => {
  saveCurrency(2000);
  for (const [template, expected] of [['blush-room', 'blush'], ['bathroom-unit', 'bathroom'], ['garden-room', 'garden']] as const) {
    const result = buyRoom(template, 'Mijn kamer', `new-${template}`, undefined, 'heart');
    assert.equal(result.status, 'applied');
    const rooms = loadTreehouseLayout();
    assert.equal(rooms.find(room => room.id === result.room)!.asset, expected);
    assert.equal(rooms.find(room => room.id === result.room)!.icon, 'heart');
    assert.equal(saveTreehouseLayout(rooms.map(room => room.id === result.room ? { ...room, icon: 'heart' } : room)), true);
    assert.equal(loadTreehouseLayout().find(room => room.id === result.room)!.icon, 'heart');
    const scene = expandableTreehouseLayout(true, loadTreehouseLayout());
    assert.ok(scene.units.some(unit => unit.id === result.room && unit.asset === expected));
    if (expected === 'garden') assert.ok(!scene.units.some(unit => unit.id === `roof-${result.room}`));
    for (const unit of scene.units) {
      assert.ok(unit.x >= 0 && unit.y >= 0, unit.id);
      assert.ok(unit.x + unit.width <= scene.width, unit.id);
      assert.ok(unit.y + unit.height <= scene.height, unit.id);
    }
  }
}));

test('paid roofs persist, move with rooms and can be equipped again without paying twice', () => memory(() => {
  saveCurrency(500);
  assert.equal(buyRoomRoof('bedroom', 'roofBlue', 'blue-roof', 80).status, 'applied');
  assert.equal(loadCurrency(), 420);
  assert.equal(loadTreehouseLayout().find(room => room.id === 'bedroom')!.roof, 'roofBlue');
  assert.equal(buyRoomRoof('bedroom', 'roofBlue', 'blue-roof', 80).status, 'duplicate');
  assert.equal(loadCurrency(), 420);
  assert.equal(buyRoomRoof('bedroom', 'roofFlowers', 'flowers-roof', 100).status, 'applied');
  assert.equal(roofPrice('bedroom', 'roofBlue'), 0);
  assert.equal(buyRoomRoof('bedroom', 'roofBlue', 'reuse-blue', 0).status, 'applied');
  assert.equal(loadCurrency(), 320);
  const next = moveBuildRoom(loadTreehouseLayout(), 'bedroom', 1, 1)!;
  assert.ok(next);
  assert.equal(saveTreehouseLayout(next), true);
  const roof = expandableTreehouseLayout(true, loadTreehouseLayout()).units.find(unit => unit.id === 'roof-bedroom')!;
  assert.equal(roof.asset, 'roofBlue');
  assert.equal(roof.roomId, 'bedroom');
}));

test('roof failures and stale quotes cannot change coins or ownership', () => memory((values, fail) => {
  saveCurrency(79);
  const poor = values.get(LOCAL_STATE_KEY);
  assert.equal(buyRoomRoof('bedroom', 'roofBlue', 'poor-roof', 80).status, 'insufficient');
  assert.equal(values.get(LOCAL_STATE_KEY), poor);
  saveCurrency(500);
  assert.equal(buyRoomRoof('bedroom', 'roofBlue', 'bad-quote', 1).status, 'price-changed');
  assert.equal(buyRoomRoof('terrace', 'roofBlue', 'terrace-roof', 80).status, 'invalid');
  const before = values.get(LOCAL_STATE_KEY);
  fail(true);
  assert.equal(buyRoomRoof('bedroom', 'roofBlue', 'retry-roof', 80).status, 'invalid');
  assert.equal(values.get(LOCAL_STATE_KEY), before);
  fail(false);
  assert.equal(loadTreehouseRoofs().purchases.length, 0);
  assert.equal(buyRoomRoof('bedroom', 'roofBlue', 'retry-roof', 80).status, 'applied');
  values.set(TREEHOUSE_ROOFS_KEY, '{bad');
  // The authoritative document remains intact; legacy corrupt data cannot replace it.
  assert.equal(loadTreehouseRoofs().purchases.length, 1);
  commitLocalState({ [TREEHOUSE_ROOFS_KEY]: '{bad' });
  const corrupt = values.get(LOCAL_STATE_KEY);
  assert.equal(buyRoomRoof('bedroom', 'roofFlowers', 'corrupt-roof', 100).status, 'invalid');
  assert.equal(values.get(LOCAL_STATE_KEY), corrupt);
}));

test('selling an expansion also settles its purchased roofs exactly once', () => memory(() => {
  saveCurrency(500);
  const room = buyRoom('blush-room', 'Roze kamer', 'pink-room').room!;
  assert.equal(buyRoomRoof(room, 'roofFlowers', 'pink-flowers', 100).status, 'applied');
  assert.equal(roomSaleAmount(room), 175);
  assert.equal(sellTreehouseRoom(room), true);
  assert.equal(loadCurrency(), 425);
  assert.equal(loadTreehouseRoofs().purchases.length, 0);
  assert.equal(sellTreehouseRoom(room), false);
  assert.equal(loadCurrency(), 425);
}));

test('all sixteen cells can persist and the full grid refuses further purchases', () => memory(() => {
  saveCurrency(20000);
  const extras = Array.from({ length: 11 }, (_, i) => ({ id: `extra-${i + 1}`, template: 'hobby-room', name: `Kamer ${i + 1}`, purchaseId: `full-${i + 1}` }));
  const solid = [...STARTER_HOME_ROOMS.filter(room => room.id !== 'terrace'), ...extras.map(room => ({ id: room.id, name: room.name, asset: 'room' as const, column: 0, floor: 0 }))];
  const rooms: BuildRoom[] = [...solid.map((room, i) => ({ ...room, column: i % 4, floor: Math.floor(i / 4) })), { ...STARTER_HOME_ROOMS.find(room => room.id === 'terrace')!, column: 3, floor: 3 }];
  assert.equal(validBuildRooms(rooms), true);
  commitLocalState({ [ROOM_EXPANSIONS_KEY]: JSON.stringify({ version: 1, rooms: extras }), [TREEHOUSE_LAYOUT_KEY]: JSON.stringify({ version: 1, rooms }) });
  assert.equal(loadTreehouseLayout().length, 16);
  assert.equal(nextRoomPrice(loadRoomExpansions(), 'inside'), null);
  assert.equal(buyRoom('blush-room', 'Te veel', 'too-many').status, 'full');
  assert.equal(loadCurrency(), 20000);
}));
