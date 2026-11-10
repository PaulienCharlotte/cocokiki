import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BESTELLINGEN, BESTELLINGEN_BY_ID, eisInWoorden } from '../data/cooking/orders';
import { RECIPES, RECIPES_BY_ID } from '../data/cooking/catalog';
import { CHARACTERS } from '../data/characters';
import {
  bestellingVoorRecept, keerBakken, keerOpties, keuzeRecepten, kiesAantalVoorBestelling, kiesReceptVoorBestelling,
  legBestellingTerug, leverBestellingAf, lopendeBestelling, neemBestellingAan, openBestellingen, pastBijBestelling,
} from '../services/bakeryOrders';
import { createEmptyCookingProgress, migrateCookingProgress } from '../services/cookingProgress';

const leeg = () => createEmptyCookingProgress();

test('elke bestelling heeft precies één passend recept om uit te kiezen', () => {
  for (const bestelling of BESTELLINGEN) {
    const passend = RECIPES.filter(recipe => recipe.contentStatus === 'ready' && pastBijBestelling(bestelling, recipe));
    assert.equal(passend.length, 1, `${bestelling.id} hoort bij precies één recept, nu ${passend.map(item => item.id).join(', ')}`);
  }
});

test('de afwijzing hoort alleen bij recepten die echt zakken op de wens', () => {
  // De tekst zegt waarom het niet past. Dat klopt alleen als elk recept dat
  // zakt ook werkelijk dat ene ding heeft waar de klant over begint.
  for (const bestelling of BESTELLINGEN) {
    for (const recipe of RECIPES.filter(item => item.contentStatus === 'ready')) {
      if (pastBijBestelling(bestelling, recipe)) continue;
      if (bestelling.eis.soort === 'zonder') {
        const gezocht = bestelling.eis.ingredientIds;
        assert.ok(recipe.ingredients.some(item => gezocht.includes(item.ingredientId)), `${recipe.id} zakt op "zonder ${gezocht.join('/')}", dus moet het erin zitten`);
      }
      if (bestelling.eis.soort === 'categorie') assert.notEqual(recipe.category, bestelling.eis.categorie);
      if (bestelling.eis.soort === 'snel') assert.ok(recipe.preparationMinutes === null || recipe.preparationMinutes > bestelling.eis.minuten);
    }
  }
});

test('het aantal keer bakken volgt uit de eters en de porties', () => {
  const muffins = RECIPES_BY_ID['blueberry-muffins'];
  const seb = BESTELLINGEN_BY_ID['seb-verjaardag'];
  assert.equal(muffins.servings, 10);
  assert.equal(seb.eters, 14);
  assert.equal(keerBakken(seb, muffins), 2);

  const pannenkoekjes = RECIPES_BY_ID['banana-pancakes'];
  const kiki = BESTELLINGEN_BY_ID['kiki-kas'];
  assert.equal(keerBakken(kiki, pannenkoekjes), 2, '4 eters, 2 porties per keer');

  const yoghurt = RECIPES_BY_ID['fruit-yogurt'];
  assert.equal(keerBakken(BESTELLINGEN_BY_ID['lua-tussendoor'], yoghurt), 3, '3 eters, 1 portie per keer');
});

test('de antwoorden bij het aantal bevatten het goede en nooit nul of minder', () => {
  for (const bestelling of BESTELLINGEN) {
    const recipe = RECIPES.find(item => item.contentStatus === 'ready' && pastBijBestelling(bestelling, item))!;
    const opties = keerOpties(bestelling, recipe);
    assert.ok(opties.includes(keerBakken(bestelling, recipe)));
    assert.ok(opties.length >= 2 && opties.length <= 4);
    assert.ok(opties.every(keer => keer >= 1), 'geen nul keer bakken als antwoord');
    assert.deepEqual(opties, [...opties].sort((a, b) => a - b));
  }
});

test('een verkeerd recept kost geen beurt maar wordt wel geteld', () => {
  const kiki = BESTELLINGEN_BY_ID['kiki-kas'];
  let progress = neemBestellingAan(leeg(), kiki.id);
  assert.equal(lopendeBestelling(progress)?.bestelling.id, kiki.id);

  progress = kiesReceptVoorBestelling(progress, 'blueberry-muffins');
  assert.equal(progress.orders![kiki.id].recipeId, null, 'de muffins hebben melk, dus die blijven liggen');
  assert.equal(progress.orders![kiki.id].misgrepen, 1);

  progress = kiesReceptVoorBestelling(progress, 'banana-pancakes');
  assert.equal(progress.orders![kiki.id].recipeId, 'banana-pancakes');
  assert.equal(bestellingVoorRecept(progress, 'banana-pancakes')?.bestelling.id, kiki.id);
  assert.equal(bestellingVoorRecept(progress, 'blueberry-muffins'), null);
});

test('pas het goede aantal keer bakken brengt je verder', () => {
  let progress = kiesReceptVoorBestelling(neemBestellingAan(leeg(), 'kiki-kas'), 'banana-pancakes');
  progress = kiesAantalVoorBestelling(progress, 1);
  assert.equal(progress.orders!['kiki-kas'].keerGekozen, null);
  assert.equal(progress.orders!['kiki-kas'].aantalInEenKeer, false);
  progress = kiesAantalVoorBestelling(progress, 2);
  assert.equal(progress.orders!['kiki-kas'].keerGekozen, 2);
});

test('afleveren betaalt de bonus alleen als recept en aantal in één keer goed waren', () => {
  let strak = kiesAantalVoorBestelling(kiesReceptVoorBestelling(neemBestellingAan(leeg(), 'kiki-kas'), 'banana-pancakes'), 2);
  const netjes = leverBestellingAf(strak);
  assert.equal(netjes.coinDelta, BESTELLINGEN_BY_ID['kiki-kas'].bonus);
  assert.equal(netjes.progress.orders!['kiki-kas'].status, 'geleverd');
  assert.equal(netjes.progress.activeOrderId, null);
  // Lua's wens kan pas als de fruityoghurt open is, en dat gaat via een
  // afgerond recept, niet via een afgeleverde bestelling.
  assert.deepEqual(openBestellingen(netjes.progress).map(item => item.id), ['seb-verjaardag']);

  let zoekend = neemBestellingAan(leeg(), 'kiki-kas');
  zoekend = kiesReceptVoorBestelling(zoekend, 'blueberry-muffins');
  zoekend = kiesAantalVoorBestelling(kiesReceptVoorBestelling(zoekend, 'banana-pancakes'), 2);
  assert.equal(leverBestellingAf(zoekend).coinDelta, 0, 'wel afgeleverd, geen bonus');
});

test('een bestelling waar nog geen recept voor is, staat nog niet aan de toonbank', () => {
  // De fruityoghurt gaat pas open na één gemaakt recept. Zolang dat niet zo is
  // zou Lua's wens onoplosbaar zijn, dus die wacht.
  const begin = openBestellingen(leeg());
  assert.deepEqual(begin.map(item => item.id), ['kiki-kas', 'seb-verjaardag']);
  for (const bestelling of begin) {
    assert.ok(keuzeRecepten(leeg()).some(recipe => pastBijBestelling(bestelling, recipe)), `${bestelling.id} is nu te maken`);
  }
});

test('een bestelling kan terug op de toonbank', () => {
  const teruggelegd = legBestellingTerug(neemBestellingAan(leeg(), 'seb-verjaardag'));
  assert.equal(teruggelegd.activeOrderId, null);
  assert.equal(teruggelegd.orders!['seb-verjaardag'], undefined);
  assert.ok(openBestellingen(teruggelegd).some(item => item.id === 'seb-verjaardag'), 'hij staat er weer');
});

test('een afgeleverde bestelling komt niet terug aan de toonbank', () => {
  const geleverd = leverBestellingAf(kiesAantalVoorBestelling(kiesReceptVoorBestelling(neemBestellingAan(leeg(), 'kiki-kas'), 'banana-pancakes'), 2)).progress;
  assert.equal(neemBestellingAan(geleverd, 'kiki-kas'), geleverd, 'opnieuw aannemen verandert niets');
});

test('oude opslag zonder bestellingen blijft gewoon werken', () => {
  const oud = { version: 1, activeRecipeId: null, journeys: {}, discoveredIngredientIds: ['banana'], inventory: { consumables: { banana: 2 }, equipmentIds: [], acquisitions: [] }, shoppingTransactions: {}, completions: {}, preparationSessions: {} };
  const migrated = migrateCookingProgress(oud);
  assert.deepEqual(migrated.orders, {});
  assert.equal(migrated.activeOrderId, null);
  assert.equal(migrated.inventory.consumables.banana, 2, 'de voorraad blijft staan');
});

test('een lopende bestelling naar een onbekend recept of spel wordt opgeruimd', () => {
  const rommel = migrateCookingProgress({
    version: 1, activeRecipeId: null, activeOrderId: 'bestaat-niet', journeys: {}, discoveredIngredientIds: [],
    inventory: { consumables: {}, equipmentIds: [], acquisitions: [] }, shoppingTransactions: {}, completions: {}, preparationSessions: {},
    orders: { 'bestaat-niet': { bestellingId: 'bestaat-niet', recipeId: null, status: 'bezig', misgrepen: 0, aantalInEenKeer: true, keerGekozen: null, aangenomenOp: '' }, 'kiki-kas': { bestellingId: 'kiki-kas', recipeId: 'verdwenen-recept', status: 'bezig', misgrepen: 2, aantalInEenKeer: false, keerGekozen: null, aangenomenOp: '2026-01-01T00:00:00.000Z' } },
  });
  assert.equal(rommel.orders!['bestaat-niet'], undefined);
  assert.equal(rommel.orders!['kiki-kas'].recipeId, null, 'een recept dat niet meer bestaat wordt vergeten, de bestelling niet');
  assert.equal(rommel.orders!['kiki-kas'].misgrepen, 2);
  assert.equal(rommel.activeOrderId, null, 'de lopende bestelling bestaat niet meer');
});

test('alleen Coco bakt; de klanten komen uit de andere gebieden langs', () => {
  for (const bestelling of BESTELLINGEN) {
    assert.notEqual(bestelling.klant, 'coco', `${bestelling.id}: Coco staat achter de toonbank, niet ervoor`);
    assert.ok(CHARACTERS[bestelling.klant], `${bestelling.id} gebruikt een personage uit de lijst`);
  }
});

test('de wens is in gewone taal samen te vatten', () => {
  assert.equal(eisInWoorden(BESTELLINGEN_BY_ID['kiki-kas']), 'Zonder zuivel');
  assert.equal(eisInWoorden(BESTELLINGEN_BY_ID['seb-verjaardag']), 'Iets uit de oven');
  assert.equal(eisInWoorden(BESTELLINGEN_BY_ID['lua-tussendoor']), 'Binnen 10 minuten klaar');
});

test('de keuze aan de toonbank blijft een keuze die een kind overziet', () => {
  const recepten = keuzeRecepten(leeg());
  assert.ok(recepten.length >= 2 && recepten.length <= 4, `twee tot vier recepten om uit te kiezen, nu ${recepten.length}`);
  assert.ok(recepten.every(recipe => recipe.contentStatus === 'ready'));
});

test('de bestelschermen gebruiken de gedeelde vormtaal', () => {
  const flow = readFileSync('components/cooking/OrderFlow.tsx', 'utf8');
  const delivery = readFileSync('components/cooking/OrderDelivery.tsx', 'utf8');
  for (const [naam, bron] of [['OrderFlow', flow], ['OrderDelivery', delivery]] as const) {
    assert.match(bron, /SpeechBubble/, `${naam} laat een personage praten`);
    assert.doesNotMatch(bron, /#[0-9a-fA-F]{6}/, `${naam} gebruikt geen eigen kleuren`);
  }
  assert.match(flow, /ChoiceList/, 'kiezen gaat met de gedeelde keuzelijst');
  assert.match(flow, /IconButton/, 'terug is het ronde pijltje');
  const css = readFileSync('components/cooking/orders.css', 'utf8');
  // Eén uitzondering, en die staat ook in de vormtaal: de doorzichtige waas
  // over de keuken heeft geen token. Alle andere kleuren horen wel uit tokens.
  const kleuren = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map(treffer => treffer[0]);
  assert.deepEqual(kleuren, ['#3a24124d'], 'alleen de bestaande waas mag een eigen kleur zijn');
  assert.equal(css.includes('var(--color-surface)'), true, 'de kaart komt uit de tokens');
  assert.equal((css.match(/\{/g) ?? []).length, (css.match(/\}/g) ?? []).length, 'accolades in balans');
});
