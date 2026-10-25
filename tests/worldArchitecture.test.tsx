import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import AppShell from '../components/platform/AppShell';
import PlatformHeader from '../components/platform/PlatformHeader';
import DestinationScreen from '../pages/DestinationScreen';
import ChallengesScreen from '../pages/ChallengesScreen';
import WorldHub from '../pages/WorldHub';
import TreehouseRoom from '../pages/TreehouseRoom';
import TreehouseInterior from '../pages/TreehouseInterior';
import TreehouseSection from '../pages/TreehouseSection';
import ShopScreen from '../pages/ShopScreen';
import DecorShop from '../components/shop/DecorShop';
import CookbookScreen from '../pages/CookbookScreen';
import { buildKitchenInventory } from '../components/treehouse/InteractiveKitchen';
import { SHOP_CATEGORIES, SHOP_PRODUCTS } from '../data/shopCatalog';
import { WORLD_ISLANDS } from '../data/worldHub';
import { ASSET_LIBRARY } from '../data/assetLibrary';
import { TREEHOUSE_ROOMS } from '../data/treehouse';
import { DESTINATIONS, DESTINATIONS_BY_ID } from '../platform/destinationRegistry';
import { resolveRoute } from '../platform/routes';
import { PROFILE_AVATARS, PROFILE_AVATAR_KEY } from '../services/profile';
import { createEmptyCookingProgress } from '../services/cookingProgress';
import { DECOR_CATEGORIES, DECOR_PRODUCTS, DECOR_PRODUCTS_BY_ID, DECOR_STORES, decorViewImage } from '../data/decorCatalog';
import { addRoomPurchasesOnce, availableRoomQuantity, createEmptyRoomInventory, MAX_PLACEMENT_SCALE, migrateRoomInventory, MIN_PLACEMENT_SCALE, moveRoomItem, placeRoomItem, resizeRoomItem, returnRoomItem, turnRoomItem } from '../services/roomInventory';

test('destination registry exposes the remaining world destinations', () => {
  assert.deepEqual(DESTINATIONS.map(destination => destination.id), ['treehouse', 'travel', 'shop']);
  assert.deepEqual(DESTINATIONS.map(destination => destination.path), ['/treehouse', '/travel', '/shop']);
  assert.equal(new Set(DESTINATIONS.map(destination => destination.path)).size, 3);
});

test('world and challenge routes resolve without changing existing game URLs', () => {
  for (const destination of DESTINATIONS) {
    assert.deepEqual(resolveRoute(destination.path).route, { page: 'destination', path: destination.path, destinationId: destination.id });
  }
  assert.deepEqual(resolveRoute('/challenges').route, { page: 'challenges', path: '/challenges' });
  assert.deepEqual(resolveRoute('/school/clock').route, { page: 'clock', path: '/school/clock' });
  assert.deepEqual(resolveRoute('/cooking'), { route: { page: 'treehouse-section', path: '/treehouse/cookbook', section: 'cookbook' }, redirect: true });
  assert.deepEqual(resolveRoute('/games/topo').route, { page: 'game', path: '/games/topo', gameId: 'topo' });
  assert.deepEqual(resolveRoute('/games/red-baby-lua').route, { page: 'game', path: '/games/red-baby-lua', gameId: 'red-baby-lua' });
});

test('app shell reuses the world menu without a separate challenges action', () => {
  const html = renderToStaticMarkup(<AppShell coins={69} onHome={() => undefined}>
    <p>Wereld</p>
  </AppShell>);
  assert.match(html, /aria-label="Naar de wereld"/);
  assert.match(html, /aria-label="Profielmenu openen"/);
  assert.doesNotMatch(html, /Uitdagingen/);
  assert.match(html, /aria-label="69 CocoCoins"/);
  assert.match(html, />Wereld</);
});

test('game header reuses the homepage menu with coins and profile controls', () => {
  const html = renderToStaticMarkup(<PlatformHeader coins={42} onHome={() => undefined} />);
  assert.match(html, /class="platform-world-header"/);
  assert.match(html, /aria-label="Naar de wereld"/);
  assert.match(html, /aria-label="42 CocoCoins"/);
  assert.match(html, /aria-label="Profielmenu openen"/);
  assert.doesNotMatch(html, /app-header platform-header/);
});

test('world hub renders three accessible canvas hotspots and compact tools', () => {
  assert.deepEqual(WORLD_ISLANDS.map(island => island.path), ['/treehouse', '/challenges', '/shop']);
  const html = renderToStaticMarkup(<WorldHub coins={69} onNavigate={() => undefined} />);
  assert.equal((html.match(/world-island world-island--/g) ?? []).length, 3);
  assert.doesNotMatch(html, /world-bridge/);
  assert.match(html, /aria-label="Mijn Boomhut openen"/);
  assert.match(html, /aria-label="School openen"/);
  assert.doesNotMatch(html, /aria-label="Koken openen"/);
  assert.match(html, /aria-label="Winkels openen"/);
  assert.doesNotMatch(html, /aria-label="Uitdagingen openen"/);
  assert.match(html, /aria-label="69 CocoCoins"/);
  assert.match(html, /aria-label="Profielmenu openen"/);
  assert.match(html, /games\/world-hub\/v2\/world-background-desktop\.jpg/);
  assert.match(html, /games\/world-hub\/v2\/world-background-mobile\.jpg/);
  assert.match(html, /games\/world-hub\/v2\/treehouse-island\.webp/);
  assert.match(html, /games\/world-hub\/v2\/school-island\.webp/);
  assert.match(html, /games\/world-hub\/v2\/shop-island\.webp/);
  assert.doesNotMatch(html, /games\/world-hub\/v2\/cooking-island\.webp/);
  assert.match(html, /images\/cocokiki-logo\.png/);
  assert.match(html, /images\/avatars\/coco\.webp/);
  assert.doesNotMatch(html, /games\/world-hub\/(coins|settings)-control\.png/);
});

test('profile avatar catalog contains stable, unique local options', () => {
  assert.equal(PROFILE_AVATAR_KEY, 'cocokiki:profile-avatar:v1');
  assert.deepEqual(PROFILE_AVATARS.map(avatar => avatar.id), ['coco', 'kiki', 'lua', 'samen', 'luiaard', 'avonturier']);
  assert.equal(new Set(PROFILE_AVATARS.map(avatar => avatar.image)).size, PROFILE_AVATARS.length);
  assert.ok(PROFILE_AVATARS.every(avatar => avatar.image.startsWith('/images/avatars/')));
});

test('travel and challenges remain gateways to existing games', () => {
  const travel = renderToStaticMarkup(<DestinationScreen destination={DESTINATIONS_BY_ID.travel} onNavigate={() => undefined} />);
  const challenges = renderToStaticMarkup(<ChallengesScreen onNavigate={() => undefined} />);
  assert.match(travel, /class="travel-entry__cta"[^>]*aria-label="Open Topo"/);
  assert.match(travel, /games\/destinations\/topo-entry\.png/);
  assert.doesNotMatch(travel, /Aardrijkskunde/);
  assert.match(travel, /games\/destinations\/travel-room\.png/);
  assert.match(challenges, /aria-label="Topo openen"/);
  assert.match(challenges, /aria-label="Tafels oefenen openen"/);
  assert.match(challenges, /aria-label="Klokkijken openen"/);
  assert.match(challenges, /games\/school\/school-interior\.jpg/);
  assert.match(challenges, /games\/school\/topo-cta\.png/);
  assert.match(challenges, /games\/school\/tables-cta\.png/);
  assert.match(challenges, /games\/school\/clock\/clock-school-navigation-v2\.png/);
});

test('destination rooms use their dedicated illustrated backgrounds', () => {
  const cookbook = renderToStaticMarkup(<CookbookScreen />);
  const shop = renderToStaticMarkup(<ShopScreen />);
  assert.match(cookbook, /assets\/library\/treehouse\/rooms\/kitchen-furnished\.png/);
  assert.match(cookbook, /Mijn Kookboek/);
  assert.match(cookbook, /Receptcategorieën/);
  assert.match(cookbook, /Bananenpannenkoekjes/);
  assert.match(cookbook, /Gemaakt/);
  assert.match(shop, /games\/shop\/shop-street\.png/);
  assert.match(shop, /aria-label="Supermarkt openen"/);
  assert.match(shop, /aria-label="Meubelwinkel openen"/);
  assert.match(shop, /aria-label="Plantenwinkel openen"/);
});

test('furniture and plant shops expose filters, scrollable products and local assets', () => {
  assert.deepEqual(Object.keys(DECOR_STORES), ['furniture', 'plants']);
  assert.equal(DECOR_CATEGORIES.furniture[0].id, 'all');
  assert.equal(DECOR_CATEGORIES.plants[0].id, 'all');
  assert.ok(DECOR_PRODUCTS.filter(product => product.store === 'furniture').length >= 15);
  assert.ok(DECOR_PRODUCTS.filter(product => product.store === 'plants').length >= 10);
  assert.equal(new Set(DECOR_PRODUCTS.map(product => product.id)).size, DECOR_PRODUCTS.length);
  assert.equal(new Set(DECOR_PRODUCTS.map(product => product.image)).size, DECOR_PRODUCTS.length);
  assert.ok(DECOR_PRODUCTS.every(product => product.price > 0));
  assert.ok(DECOR_PRODUCTS.every(product => product.image.startsWith('/assets/library/shop/decor/products/')));
  const furniture = renderToStaticMarkup(<DecorShop store="furniture" onBack={() => undefined} />);
  const plants = renderToStaticMarkup(<DecorShop store="plants" onBack={() => undefined} />);
  assert.match(furniture, /Meubelwinkel/);
  assert.match(furniture, /Meubels en planten|Meubel/);
  assert.match(furniture, /assets\/library\/shop\/decor\/products\/single-bed-v4\.png/);
  assert.match(plants, /Plantenwinkel/);
  assert.match(plants, /Grote planten/);
});

test('decor products have individual local PNG assets with transparency', () => {
  for (const product of DECOR_PRODUCTS) {
    const filename = `public${product.image.split('?')[0]}`;
    const png = readFileSync(filename);
    assert.equal(png.subarray(1, 4).toString(), 'PNG', product.id);
    assert.equal(png[25], 6, `${product.id} needs RGBA transparency`);
  }
});

test('room inventory applies decor purchases only once', () => {
  const initial = createEmptyRoomInventory();
  const bought = addRoomPurchasesOnce(initial, 'decor:test', { 'soft-sofa': 1, monstera: 2, unknown: 4 });
  assert.equal(bought.owned['soft-sofa'], 1);
  assert.equal(bought.owned.monstera, undefined);
  assert.equal(addRoomPurchasesOnce(bought, 'decor:test', { 'soft-sofa': 1 }), bought);
});

test('room decoration conserves purchases across rooms, moving and returning', () => {
  const bought = addRoomPurchasesOnce(createEmptyRoomInventory(), 'placement:test', { 'soft-sofa': 1 });
  const item = { id: 'sofa:1', productId: 'soft-sofa', room: 'living-room' as const, x: 50, y: 70, view: 0, scale: 1 };
  const placed = placeRoomItem(bought, item);
  assert.equal(availableRoomQuantity(placed, item.productId), 0);
  assert.equal(placeRoomItem(placed, { ...item, id: 'sofa:2', room: 'bedroom' }), placed);
  const moved = moveRoomItem(placed, item.id, 60, 80);
  assert.deepEqual(moved.placements[0], { ...item, x: 60, y: 80 });
  assert.equal(moved.owned['soft-sofa'], 1);
  assert.deepEqual(migrateRoomInventory(JSON.parse(JSON.stringify(moved))), moved);
  const returned = returnRoomItem(moved, item.id);
  assert.equal(availableRoomQuantity(returned, item.productId), 1);
  assert.equal(returnRoomItem(returned, item.id), returned);
  assert.equal(placeRoomItem(returned, { ...item, room: 'bedroom' }).placements[0].room, 'bedroom');
});

test('turnable furniture keeps its view and size within bounds and survives a reload', () => {
  const sofa = DECOR_PRODUCTS_BY_ID['cream-corner-sofa'];
  assert.equal(sofa.views, 8);
  assert.equal(decorViewImage(sofa, 0), '/assets/library/shop/decor/products/cream-corner-sofa/view-1.png');
  assert.equal(decorViewImage(sofa, 8), decorViewImage(sofa, 0));
  assert.equal(decorViewImage(sofa, -1), decorViewImage(sofa, 7));
  assert.equal(decorViewImage(DECOR_PRODUCTS_BY_ID['soft-sofa'], 3), DECOR_PRODUCTS_BY_ID['soft-sofa'].image);

  const owned = addRoomPurchasesOnce(createEmptyRoomInventory(), 'turn:test', { 'cream-corner-sofa': 1 });
  const placed = placeRoomItem(owned, { id: 'turn:1', productId: 'cream-corner-sofa', room: 'living-room', x: 50, y: 70, view: 0, scale: 1 });
  assert.equal(turnRoomItem(placed, 'turn:1', -1).placements[0].view, 7);
  assert.equal(turnRoomItem(placed, 'turn:1', 1).placements[0].view, 1);

  let big = placed;
  for (let step = 0; step < 20; step += 1) big = resizeRoomItem(big, 'turn:1', 1);
  assert.equal(big.placements[0].scale, MAX_PLACEMENT_SCALE);
  let small = placed;
  for (let step = 0; step < 20; step += 1) small = resizeRoomItem(small, 'turn:1', -1);
  assert.equal(small.placements[0].scale, MIN_PLACEMENT_SCALE);

  const turned = resizeRoomItem(turnRoomItem(placed, 'turn:1', 3), 'turn:1', 2);
  assert.deepEqual(migrateRoomInventory(JSON.parse(JSON.stringify(turned))), turned);

  // Meubels zonder extra aanzichten blijven staan waar ze staan.
  const plain = placeRoomItem(addRoomPurchasesOnce(createEmptyRoomInventory(), 'plain:test', { 'soft-sofa': 1 }), { id: 'plain:1', productId: 'soft-sofa', room: 'bedroom', x: 40, y: 60, view: 0, scale: 1 });
  assert.equal(turnRoomItem(plain, 'plain:1', 1), plain);
});

test('room inventory migrates existing purchases and rejects invalid or excess placements', () => {
  const legacy = { version: 1, owned: { 'soft-sofa': 1, unknown: 4 }, appliedTransactions: ['old'] };
  const migrated = migrateRoomInventory(legacy);
  assert.deepEqual(migrated.placements, []);
  assert.equal(availableRoomQuantity(migrated, 'soft-sofa'), 1);
  assert.deepEqual(migrated.appliedTransactions, ['old']);
  const item = { id: 'one', productId: 'soft-sofa', room: 'kitchen', x: 50, y: 70 };
  const recovered = migrateRoomInventory({ ...legacy, placements: [null, { ...item, room: 'missing' }, { ...item, x: NaN }, item, item, { ...item, id: 'extra' }] });
  assert.equal(recovered.placements.length, 1);
  assert.equal(availableRoomQuantity(recovered, 'soft-sofa'), 0);
  assert.equal(addRoomPurchasesOnce(recovered, 'old', { 'soft-sofa': 1 }), recovered);
});

test('shop catalog has configurable package prices and enables purchases', () => {
  assert.equal(SHOP_CATEGORIES[0].id, 'all');
  assert.equal(SHOP_PRODUCTS.length, 40);
  assert.ok(SHOP_PRODUCTS.every(product => Number.isInteger(product.price) && product.price > 0 && product.purchasable));
  assert.ok(SHOP_PRODUCTS.every(product => product.image === `/games/shop/products/${product.id}.png?v=2`));
  assert.ok(new Set(SHOP_PRODUCTS.map(product => product.id)).size === SHOP_PRODUCTS.length);
  assert.equal(new Set(SHOP_PRODUCTS.map(product => product.image)).size, SHOP_PRODUCTS.length);
});

test('treehouse routes expose separate encyclopedia and cookbook spaces', () => {
  assert.deepEqual(TREEHOUSE_ROOMS.map(room => room.id), ['bedroom', 'terrace', 'living-room', 'kitchen']);
  for (const room of TREEHOUSE_ROOMS) {
    assert.deepEqual(resolveRoute(room.path).route, { page: 'treehouse-room', path: room.path, room: room.id });
  }
  assert.deepEqual(resolveRoute('/treehouse/encyclopedia').route, { page: 'treehouse-section', path: '/treehouse/encyclopedia', section: 'encyclopedia' });
  assert.deepEqual(resolveRoute('/treehouse/cookbook').route, { page: 'treehouse-section', path: '/treehouse/cookbook', section: 'cookbook' });
  const room = renderToStaticMarkup(<TreehouseRoom onNavigate={() => undefined} />);
  assert.match(room, /aria-label="Woonkamer openen"/);
  assert.match(room, /aria-label="Keuken openen"/);
  assert.match(room, /aria-label="Slaapkamer openen"/);
  assert.match(room, /aria-label="Terras openen"/);
  assert.match(room, /assets\/library\/treehouse\/overview\/treehouse-overview\.png/);
  const livingRoom = renderToStaticMarkup(<TreehouseInterior room="living-room" onNavigate={() => undefined} />);
  assert.match(livingRoom, /aria-label="Mijn Encyclopedie openen"/);
  assert.doesNotMatch(livingRoom, /aria-label="Mijn Kookboek openen"/);
  assert.match(livingRoom, /aria-label="Mijn kameritems openen"/);
  const kitchen = renderToStaticMarkup(<TreehouseInterior room="kitchen" onNavigate={() => undefined} />);
  assert.match(kitchen, /aria-label="Mijn Kookboek openen"/);
  assert.doesNotMatch(kitchen, /Mijn keuken/);
  assert.doesNotMatch(kitchen, /Naar Kookstudio/);
  assert.doesNotMatch(kitchen, /treehouse-kitchen-furnishing treehouse-kitchen-furnishing--/);
  assert.match(kitchen, /aria-label="Kookeiland openen"/);
  assert.match(kitchen, /aria-label="Kookplaat openen"/);
  assert.match(kitchen, /aria-label="Mijn boodschappen openen"/);
  assert.match(kitchen, /data-kitchen-station="worktop"/);
  assert.match(kitchen, /data-kitchen-station="cooktop"/);
  assert.match(kitchen, /aria-label="Kijk naar links"/);
  assert.match(kitchen, /aria-label="Kijk naar rechts"/);
  assert.match(kitchen, /aria-label="Mijn kameritems openen"/);
  assert.match(renderToStaticMarkup(<TreehouseSection section="encyclopedia" onNavigate={() => undefined} />), /Mijn Encyclopedie/);
  assert.match(renderToStaticMarkup(<TreehouseSection section="cookbook" onNavigate={() => undefined} />), /Mijn Kookboek/);
  const nestedShell = renderToStaticMarkup(<AppShell coins={0} onHome={() => undefined} onBack={() => undefined} backLabel="Terug naar de boomhut">Inhoud</AppShell>);
  assert.match(nestedShell, /aria-label="Terug naar de boomhut"/);
});

test('asset library exposes stable treehouse rooms and all extracted icons', () => {
  assert.equal(Object.keys(ASSET_LIBRARY.treehouse.rooms).length, 4);
  assert.deepEqual(Object.keys(ASSET_LIBRARY.treehouse.furnishings), [
    'fridge', 'fridgeOpen', 'oven', 'ovenOpen', 'pantry', 'pantryOpen', 'island', 'cart',
  ]);
  assert.ok(Object.values(ASSET_LIBRARY.treehouse.furnishings).every(path => path.startsWith('/assets/library/treehouse/furnishings/')));
  assert.deepEqual(Object.keys(ASSET_LIBRARY.treehouse.stations), ['worktop', 'cooktop']);
  assert.ok(Object.values(ASSET_LIBRARY.treehouse.stations).every(path => path.startsWith('/assets/library/treehouse/stations/')));
  assert.deepEqual(Object.keys(ASSET_LIBRARY.treehouse.icons), [
    'bedroom', 'garden', 'livingRoom', 'kitchen', 'home', 'add', 'arrowLeft', 'arrowRight',
  ]);
  assert.ok(Object.values(ASSET_LIBRARY.treehouse.icons).every(path => path.startsWith('/assets/library/treehouse/icons/')));
  assert.equal(ASSET_LIBRARY.shop.street, '/games/shop/shop-street.png');
  assert.equal(ASSET_LIBRARY.shop.decorSheet, '/assets/library/shop/decor/furniture-plants-sheet.png');
});

test('interactive kitchen separates groceries and keeps standard equipment available', () => {
  const progress = createEmptyCookingProgress();
  progress.inventory.consumables = { banana: 2, eggs: 3, oats: 40 };
  assert.deepEqual(buildKitchenInventory(progress, 'groceries').map(item => item.id), ['banana', 'eggs', 'oats']);
  assert.deepEqual(buildKitchenInventory(progress, 'equipment').map(item => item.id), ['bowl', 'fork', 'pan', 'spatula']);
  assert.deepEqual(buildKitchenInventory(createEmptyCookingProgress(), 'groceries'), []);
});
