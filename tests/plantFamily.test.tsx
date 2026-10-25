import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DECOR_PRODUCTS_BY_ID } from '../data/decorCatalog';
import { PLANT_SPECIES, PLANT_SPECIES_BY_ID } from '../data/plants/species';
import {
  adoptPurchaseOnce,
  cleanNickname,
  createEmptyPlantFamily,
  MAX_NICKNAME_LENGTH,
  migratePlantFamily,
  renamePlant,
} from '../services/plantFamily';
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
