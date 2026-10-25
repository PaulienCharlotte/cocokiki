import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DECOR_PRODUCTS_BY_ID } from '../data/decorCatalog';
import { PLANT_SPECIES, PLANT_SPECIES_BY_ID, plantStageImage } from '../data/plants/species';
import {
  adoptPurchaseOnce,
  cleanNickname,
  createEmptyPlantFamily,
  MAX_NICKNAME_LENGTH,
  migratePlantFamily,
  plantThirst,
  renamePlant,
  stageKiki,
  stageLabel,
  waterPlant,
} from '../services/plantFamily';
import { PLANT_PROBLEM_LABEL, PLANTS_WITHOUT_FIRST_AID, plantFirstAid } from '../data/plants/firstAid';
import PlantFlashcard from '../components/plants/PlantFlashcard';

test('elke plantensoort hoort bij een plant uit de winkel en heeft complete lesstof', () => {
  assert.ok(PLANT_SPECIES.length >= 13);
  for (const species of PLANT_SPECIES) {
    const product = DECOR_PRODUCTS_BY_ID[species.id];
    assert.ok(product, `onbekend product: ${species.id}`);
    assert.equal(product.store, 'plants');
    for (const veld of ['commonName', 'scientificName', 'origin', 'habitat', 'light', 'water', 'funFact', 'kikiTip'] as const) {
      assert.ok(species[veld].trim().length > 0, `${species.id} mist ${veld}`);
    }
    assert.ok(['species', 'genus', 'family'].includes(species.nameCertainty));
  }
  // Iedere plant in de winkel heeft een infokaart.
  const winkelPlanten = Object.values(DECOR_PRODUCTS_BY_ID).filter(product => product.store === 'plants');
  for (const plant of winkelPlanten) assert.ok(PLANT_SPECIES_BY_ID[plant.id], `geen lesstof voor ${plant.id}`);
});

test('een aankoop levert planten op, maar twee keer dezelfde aankoop niet', () => {
  let nummer = 0;
  const id = () => `plant-${nummer += 1}`;
  const leeg = createEmptyPlantFamily();
  const eerste = adoptPurchaseOnce(leeg, 'koop:1', { 'monstera-basket': 2, orchid: 1 }, '2026-10-25T10:00:00.000Z', id);
  assert.equal(eerste.plants.length, 3);
  assert.equal(new Set(eerste.plants.map(plant => plant.id)).size, 3);
  // Dubbel klikken mag geen extra planten geven.
  assert.equal(adoptPurchaseOnce(eerste, 'koop:1', { 'monstera-basket': 2, orchid: 1 }, undefined, id), eerste);
  // Onbekende of onzinnige regels tellen niet mee.
  assert.equal(adoptPurchaseOnce(eerste, 'koop:2', { 'soft-sofa': 1, orchid: 0 }, undefined, id), eerste);
  assert.equal(eerste.plants.filter(plant => plant.speciesId === 'monstera-basket').length, 2);
});

test('een bijnaam blijft los van de soortnaam en wordt netjes bijgeknipt', () => {
  assert.equal(cleanNickname('  Henk  ', 'monstera-basket'), 'Henk');
  assert.equal(cleanNickname('', 'monstera-basket'), 'Monstera');
  assert.equal(cleanNickname(null, 'orchid'), 'Vlinderorchidee');
  assert.equal(cleanNickname('x'.repeat(80), 'orchid').length, MAX_NICKNAME_LENGTH);

  const family = adoptPurchaseOnce(createEmptyPlantFamily(), 'koop:3', { 'monstera-basket': 1 }, undefined, () => 'vast');
  const hernoemd = renamePlant(family, 'vast', 'Groentje');
  assert.equal(hernoemd.plants[0].nickname, 'Groentje');
  assert.equal(hernoemd.plants[0].speciesId, 'monstera-basket');
  assert.equal(renamePlant(hernoemd, 'bestaat-niet', 'Piet'), hernoemd);
  // De soort blijft onaangeroerd in de catalogus.
  assert.equal(PLANT_SPECIES_BY_ID['monstera-basket'].commonName, 'Monstera');
});

test('bewaarde planten overleven een herstart en beschadigde opslag', () => {
  const family = adoptPurchaseOnce(createEmptyPlantFamily(), 'koop:4', { orchid: 1 }, '2026-10-25T10:00:00.000Z', () => 'een');
  assert.deepEqual(migratePlantFamily(JSON.parse(JSON.stringify(family))), family);
  assert.deepEqual(migratePlantFamily(null), createEmptyPlantFamily());
  assert.deepEqual(migratePlantFamily({ version: 9, plants: [] }), createEmptyPlantFamily());
  const rommel = { version: 1, plants: [{ id: 'a', speciesId: 'bestaat-niet', nickname: 'X', adoptedAt: 'x' }, { id: 'b', speciesId: 'orchid', adoptedAt: '2026-01-01' }], appliedTransactions: ['oud'] };
  const hersteld = migratePlantFamily(rommel);
  assert.equal(hersteld.plants.length, 1);
  assert.equal(hersteld.plants[0].nickname, 'Vlinderorchidee');
});

test('de leerkaart toont naam, soortnaam, verzorging en een tip van Kiki', () => {
  const kaart = renderToStaticMarkup(<PlantFlashcard speciesId="monstera-basket" onClose={() => undefined} />);
  assert.match(kaart, /Monstera deliciosa/);
  assert.match(kaart, /Zuid-Mexico/);
  assert.match(kaart, /Licht/);
  assert.match(kaart, /Water/);
  assert.match(kaart, /Kiki zegt/);
  assert.match(kaart, /images\/avatars\/kiki\/kiki-tip\.png/);
  assert.equal(renderToStaticMarkup(<PlantFlashcard speciesId="bestaat-niet" onClose={() => undefined} />), '');
});

test('dorst loopt op volgens de waterbehoefte van de soort', () => {
  const dag = 24 * 60 * 60 * 1000;
  const start = Date.parse('2026-10-01T12:00:00.000Z');
  const plant = { id: 'p', speciesId: 'monstera-basket', nickname: 'Henk', adoptedAt: new Date(start).toISOString() };
  const monstera = PLANT_SPECIES_BY_ID['monstera-basket'];
  assert.equal(monstera.waterDays, 7);

  assert.equal(plantThirst(plant, monstera.waterDays, start).stage, 'fresh');
  assert.equal(plantThirst(plant, monstera.waterDays, start + 6 * dag).stage, 'fresh');
  assert.equal(plantThirst(plant, monstera.waterDays, start + 8 * dag).stage, 'thirst1');
  assert.equal(plantThirst(plant, monstera.waterDays, start + 15 * dag).stage, 'thirst2');
  assert.equal(plantThirst(plant, monstera.waterDays, start + 30 * dag).stage, 'thirst3');

  // Een cactus mag veel langer wachten dan een varen.
  assert.ok(PLANT_SPECIES_BY_ID['tall-cactus'].waterDays > PLANT_SPECIES_BY_ID['hanging-fern'].waterDays * 5);
  assert.equal(plantThirst(plant, PLANT_SPECIES_BY_ID['tall-cactus'].waterDays, start + 15 * dag).stage, 'fresh');
});

test('water geven brengt elke plant helemaal terug; hij gaat nooit dood', () => {
  const dag = 24 * 60 * 60 * 1000;
  const start = Date.parse('2026-10-01T12:00:00.000Z');
  const veelLater = start + 400 * dag;
  const family = adoptPurchaseOnce(createEmptyPlantFamily(), 'koop:9', { 'monstera-basket': 1 }, new Date(start).toISOString(), () => 'p1');
  const soort = PLANT_SPECIES_BY_ID['monstera-basket'];

  // Ook na ruim een jaar is het ergste stadium thirst3, niet dood.
  const verwaarloosd = plantThirst(family.plants[0], soort.waterDays, veelLater);
  assert.equal(verwaarloosd.stage, 'thirst3');
  assert.ok(verwaarloosd.ratio > 50);

  const begoten = waterPlant(family, 'p1', new Date(veelLater).toISOString());
  assert.equal(plantThirst(begoten.plants[0], soort.waterDays, veelLater).stage, 'fresh');
  // Water geven verandert niets aan de naam of de soort.
  assert.equal(begoten.plants[0].nickname, 'Monstera');
  assert.equal(begoten.plants[0].speciesId, 'monstera-basket');
  // Water geven aan iets dat niet bestaat verandert niets.
  assert.equal(waterPlant(begoten, 'bestaat-niet'), begoten);
  // De waterbeurt blijft bewaard na een herstart.
  assert.deepEqual(migratePlantFamily(JSON.parse(JSON.stringify(begoten))), begoten);
});

test('elke soort heeft eigen symptomen; alleen de monstera heeft er al plaatjes bij', () => {
  const monstera = PLANT_SPECIES_BY_ID['monstera-basket'];
  assert.equal(monstera.stageArt, true);
  assert.equal(plantStageImage(monstera, 'fresh'), null);
  assert.equal(plantStageImage(monstera, 'thirst1'), '/assets/library/plants/monstera-basket/thirst-1.png');
  assert.equal(plantStageImage(monstera, 'thirst3'), '/assets/library/plants/monstera-basket/thirst-3.png');
  // Zonder tekenwerk blijft het winkelplaatje staan, maar de tekst klopt wel.
  const varen = PLANT_SPECIES_BY_ID['hanging-fern'];
  assert.equal(plantStageImage(varen, 'thirst3'), null);
  assert.ok(stageLabel(varen, 'thirst3').length > 0);

  // De symptomen verschillen echt per soort: dat is de les.
  assert.notEqual(stageLabel(varen, 'thirst1'), stageLabel(monstera, 'thirst1'));
  assert.match(stageLabel(PLANT_SPECIES_BY_ID['orange-tree'], 'thirst2'), /vallen af/i);
  assert.match(stageKiki(PLANT_SPECIES_BY_ID['orchid'], 'thirst1') ?? '', /wortels/i);

  for (const species of PLANT_SPECIES) {
    assert.ok(species.waterDays >= 1, `${species.id} mist waterDays`);
    assert.equal(stageLabel(species, 'fresh'), 'Lekker fris');
    assert.equal(stageKiki(species, 'fresh'), null);
    for (const stage of ['thirst1', 'thirst2', 'thirst3'] as const) {
      assert.ok(species.symptoms[stage].label.trim().length > 0, `${species.id} mist label ${stage}`);
      assert.ok(species.symptoms[stage].kiki.trim().length > 0, `${species.id} mist kiki ${stage}`);
    }
    // Drie keer hetzelfde opschrijven zou niets toevoegen.
    const labels = new Set(['thirst1', 'thirst2', 'thirst3'].map(stage => species.symptoms[stage as 'thirst1'].label));
    assert.equal(labels.size, 3, `${species.id} herhaalt een symptoom`);
  }
});

test('elke plant heeft een EHBO-kaart die verder gaat dan water', () => {
  assert.deepEqual(PLANTS_WITHOUT_FIRST_AID, []);
  for (const species of PLANT_SPECIES) {
    const problems = plantFirstAid(species.id);
    assert.ok(problems.length >= 3, `${species.id} heeft te weinig klachten`);
    // Geen dubbele oorzaken, en elke klacht zegt wat je ziet en wat je doet.
    assert.equal(new Set(problems.map(problem => problem.cause)).size, problems.length, `${species.id} herhaalt een oorzaak`);
    for (const problem of problems) {
      assert.ok(PLANT_PROBLEM_LABEL[problem.cause], `${species.id} kent oorzaak ${problem.cause} niet`);
      assert.ok(problem.signs.trim().length > 0 && problem.fix.trim().length > 0, `${species.id} mist tekst bij ${problem.cause}`);
    }
    // Het gaat niet alleen over water: er staat altijd ook licht, lucht of kou bij.
    assert.ok(problems.some(problem => !problem.cause.includes('water')), `${species.id} gaat alleen over water`);
  }

  // Bij een cactus is verzuipen het eerste dat je moet weten, niet dorst.
  assert.equal(plantFirstAid('small-cactus')[0].cause, 'te-veel-water');
  assert.equal(plantFirstAid('snake-plant')[0].cause, 'te-veel-water');
  // Bij een varen is het juist de droge lucht.
  assert.equal(plantFirstAid('hanging-fern')[0].cause, 'droge-lucht');
});

test('de leerkaart heeft een tabblad met eerste hulp', () => {
  const kaart = renderToStaticMarkup(<PlantFlashcard speciesId="small-cactus" onClose={() => undefined} />);
  assert.match(kaart, /Help, wat is er\?/);
  assert.match(kaart, /Over deze plant/);
  // Het tabblad Over staat open; de EHBO-tekst komt pas na een klik.
  assert.match(kaart, /Wist je dat/);
  assert.doesNotMatch(kaart, /zachte, glimmende plek/);
});

test('de naam in de winkel en de naam op de kaart gaan over dezelfde plant', () => {
  for (const species of PLANT_SPECIES) {
    const winkel = DECOR_PRODUCTS_BY_ID[species.id].name.toLowerCase();
    const kaart = species.commonName.toLowerCase();
    // De een mag uitgebreider zijn ("Monstera in mand", "Vlinderorchidee"),
    // maar een kind moet er dezelfde plant in herkennen.
    assert.ok(winkel.includes(kaart) || kaart.includes(winkel), `${species.id}: winkel zegt "${winkel}", kaart zegt "${kaart}"`);
  }
});
