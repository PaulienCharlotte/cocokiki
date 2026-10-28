import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DECOR_PRODUCTS_BY_ID } from '../data/decorCatalog';
import { PLANT_ICOON, PLANT_SPECIES, PLANT_SPECIES_BY_ID, plantStageImage } from '../data/plants/species';
import {
  adoptPurchaseOnce,
  cleanNickname,
  syncPlantFamily,
  createEmptyPlantFamily,
  MAX_NICKNAME_LENGTH,
  migratePlantFamily,
  plantCondition,
  plantThirst,
  soggyNow,
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

test('de verzorgkaart toont naam en verzorging, en verder niets', () => {
  const kaart = renderToStaticMarkup(<PlantFlashcard speciesId="monstera-basket" onClose={() => undefined} />);
  const species = PLANT_SPECIES_BY_ID['monstera-basket'];
  assert.match(kaart, /Monstera deliciosa/);
  assert.match(kaart, /Licht/);
  assert.match(kaart, /Water/);
  assert.match(kaart, new RegExp(`Om de ${species.waterDays} dagen`));
  // Het verhaal hoort in de encyclopedie, dus niet hier.
  assert.doesNotMatch(kaart, /Zuid-Mexico/);
  assert.ok(!kaart.includes(species.funFact));
  assert.ok(!kaart.includes(species.kikiTip));
  assert.ok(!kaart.includes(species.habitat));
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

test('elke soort heeft eigen symptomen, en het plaatje volgt het tekenwerk dat er is', () => {
  const monstera = PLANT_SPECIES_BY_ID['monstera-basket'];
  assert.equal(monstera.art?.dry, 3);
  assert.equal(plantStageImage(monstera, 'fresh'), null);
  assert.equal(plantStageImage(monstera, 'thirst1'), '/assets/library/plants/monstera-basket/dry-1.webp');
  assert.equal(plantStageImage(monstera, 'thirst3'), '/assets/library/plants/monstera-basket/dry-3.webp');
  // De monstera heeft nog geen plaatje voor natte aarde.
  assert.equal(plantStageImage(monstera, 'wet1'), null);

  // Met één plaatje per oorzaak blijft dat ene plaatje bij elk stadium staan.
  const varen = PLANT_SPECIES_BY_ID['hanging-fern'];
  assert.equal(plantStageImage(varen, 'thirst1'), '/assets/library/plants/hanging-fern/dry-1.webp');
  assert.equal(plantStageImage(varen, 'thirst3'), '/assets/library/plants/hanging-fern/dry-1.webp');
  assert.equal(plantStageImage(varen, 'wet2'), '/assets/library/plants/hanging-fern/wet-1.webp');
  // Een plant zonder tekenwerk houdt het winkelplaatje, maar de tekst klopt wel.
  const hogeCactus = PLANT_SPECIES_BY_ID['tall-cactus'];
  assert.equal(hogeCactus.art, undefined);
  assert.equal(plantStageImage(hogeCactus, 'thirst3'), null);
  assert.ok(stageLabel(hogeCactus, 'thirst3').length > 0);

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

test('de verzorgkaart laat de zon, de gieter en de aarde zien', () => {
  const kaart = renderToStaticMarkup(<PlantFlashcard speciesId="monstera-basket" onClose={() => undefined} />);
  for (const icoon of [PLANT_ICOON.zon, PLANT_ICOON.gieter, PLANT_ICOON.aarde]) {
    assert.ok(kaart.includes(icoon), `${icoon} ontbreekt op de kaart`);
    // Een pad dat nergens heen wijst levert een kapot plaatje op in het spel.
    assert.ok(existsSync(`public${icoon}`), `${icoon} staat niet in public`);
  }
});

test('de eerste hulp staat niet meer op de verzorgkaart', () => {
  const kaart = renderToStaticMarkup(<PlantFlashcard speciesId="small-cactus" onClose={() => undefined} />);
  assert.doesNotMatch(kaart, /Help, wat is er\?/);
  assert.doesNotMatch(kaart, /zachte, glimmende plek/);
  // Zonder eigen plant is er ook nog geen encyclopediepagina om naar te wijzen.
  assert.doesNotMatch(kaart, /Alles over deze plant/);
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

test('te vroeg blijven gieten maakt de aarde te nat', () => {
  const dag = 24 * 60 * 60 * 1000;
  const start = Date.parse('2026-10-01T12:00:00.000Z');
  const cactus = PLANT_SPECIES_BY_ID['small-cactus'];
  assert.equal(cactus.overwaterAfter, 1);

  let family = adoptPurchaseOnce(createEmptyPlantFamily(), 'koop:nat', { 'small-cactus': 1 }, new Date(start).toISOString(), () => 'c');
  assert.equal(plantCondition(family.plants[0], cactus, start).kind, 'fresh');

  // Eén keer gieten terwijl hij nog geen dorst heeft is bij een cactus al te veel.
  family = waterPlant(family, 'c', new Date(start + dag).toISOString());
  const nat = plantCondition(family.plants[0], cactus, start + dag);
  assert.equal(nat.kind, 'wet');
  assert.equal(nat.stage, 'wet1');

  // Nog eens gieten maakt het erger.
  family = waterPlant(family, 'c', new Date(start + 2 * dag).toISOString());
  assert.equal(plantCondition(family.plants[0], cactus, start + 2 * dag).stage, 'wet2');

  // Een varen vindt dezelfde behandeling juist prima.
  const varen = PLANT_SPECIES_BY_ID['hanging-fern'];
  assert.ok(varen.overwaterAfter > cactus.overwaterAfter);
  let varens = adoptPurchaseOnce(createEmptyPlantFamily(), 'koop:varen', { 'hanging-fern': 1 }, new Date(start).toISOString(), () => 'v');
  varens = waterPlant(varens, 'v', new Date(start + 3600000).toISOString());
  assert.equal(plantCondition(varens.plants[0], varen, start + 3600000).kind, 'fresh');
});

test('niets doen laat de aarde opdrogen en de plant gaat nooit dood', () => {
  const dag = 24 * 60 * 60 * 1000;
  const start = Date.parse('2026-10-01T12:00:00.000Z');
  const cactus = PLANT_SPECIES_BY_ID['small-cactus'];
  let family = adoptPurchaseOnce(createEmptyPlantFamily(), 'koop:droog', { 'small-cactus': 1 }, new Date(start).toISOString(), () => 'c');
  family = waterPlant(family, 'c', new Date(start + dag).toISOString());
  family = waterPlant(family, 'c', new Date(start + 2 * dag).toISOString());
  assert.equal(plantCondition(family.plants[0], cactus, start + 2 * dag).stage, 'wet2');

  // Na een maand niets doen is de aarde een punt opgedroogd, na twee maanden helemaal.
  assert.equal(soggyNow(family.plants[0], cactus, start + 32 * dag), 1);
  assert.equal(soggyNow(family.plants[0], cactus, start + 65 * dag), 0);
  // En daarna is hij gewoon weer dorstig, niet dood.
  assert.equal(plantCondition(family.plants[0], cactus, start + 95 * dag).kind, 'thirst');

  // Water geven als hij wél dorst heeft wist de nattigheid helemaal uit.
  const begoten = waterPlant(family, 'c', new Date(start + 95 * dag).toISOString());
  assert.equal(begoten.plants[0].soggy, undefined);
  assert.equal(plantCondition(begoten.plants[0], cactus, start + 95 * dag).kind, 'fresh');
  // En het overleeft een herstart.
  assert.deepEqual(migratePlantFamily(JSON.parse(JSON.stringify(family))), family);
});

test('Kiki legt bij natte aarde uit wat er met deze soort gebeurt', () => {
  const cactus = PLANT_SPECIES_BY_ID['small-cactus'];
  assert.equal(stageLabel(cactus, 'wet1'), 'De aarde is te nat');
  assert.match(stageKiki(cactus, 'wet1') ?? '', /wacht/i);
  // Bij het ergste stadium komt de tekst uit de EHBO-kaart van die plant.
  assert.match(stageKiki(cactus, 'wet2') ?? '', /zachte/i);
  assert.notEqual(stageKiki(PLANT_SPECIES_BY_ID['orchid'], 'wet2'), stageKiki(cactus, 'wet2'));
  // Natte aarde heeft nog geen tekenwerk; het winkelplaatje blijft staan.
  assert.equal(plantStageImage(PLANT_SPECIES_BY_ID['monstera-basket'], 'wet2'), null);
  for (const species of PLANT_SPECIES) assert.ok(species.overwaterAfter >= 1, `${species.id} mist overwaterAfter`);
});

test('elk aangekondigd plantenplaatje staat er ook echt', () => {
  for (const species of PLANT_SPECIES) {
    const art = species.art;
    if (!art) continue;
    const bestanden: string[] = [];
    for (const soort of ['dry', 'wet'] as const) {
      for (let stap = 1; stap <= (art[soort] ?? 0); stap += 1) bestanden.push(`${soort}-${stap}.webp`);
    }
    if (art.sun) bestanden.push('sun-1.webp');
    if (art.dark) bestanden.push('dark-1.webp');
    for (const bestand of bestanden) {
      const pad = `public/assets/library/plants/${species.id}/${bestand}`;
      assert.ok(existsSync(pad), `${species.id} mist ${bestand}`);
    }
  }
});

test('planten uit de voorraad komen alsnog in de familie terecht', () => {
  let teller = 0;
  const leeg = createEmptyPlantFamily();
  const nu = '2026-10-28T10:00:00.000Z';
  const maakId = () => `p${(teller += 1)}`;

  // Drie planten en een bank in de voorraad, maar niets geadopteerd.
  const bij = syncPlantFamily(leeg, { 'small-cactus': 2, orchid: 1, 'sofa-green': 3 }, nu, maakId);
  assert.equal(bij.plants.length, 3);
  assert.deepEqual(bij.plants.map(plant => plant.speciesId).sort(), ['orchid', 'small-cactus', 'small-cactus']);
  assert.ok(bij.plants.every(plant => plant.nickname.length > 0));

  // Nog een keer draaien verandert niets: de achterstand is ingehaald.
  assert.equal(syncPlantFamily(bij, { 'small-cactus': 2, orchid: 1 }, nu, maakId), bij);

  // Koop je er eentje bij, dan komt alleen die erbij.
  const extra = syncPlantFamily(bij, { 'small-cactus': 3, orchid: 1 }, nu, maakId);
  assert.equal(extra.plants.length, 4);

  // Een plant die je al een naam gaf blijft staan, ook als de voorraad krimpt.
  const gedoopt = renamePlant(extra, extra.plants[0].id, 'Stekel');
  const nagekomen = syncPlantFamily(gedoopt, {}, nu, maakId);
  assert.equal(nagekomen, gedoopt);
  assert.equal(nagekomen.plants[0].nickname, 'Stekel');
});
