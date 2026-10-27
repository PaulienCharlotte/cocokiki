import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PLANT_SPECIES } from '../data/plants/species';
import { createEmptyPlantFamily, waterPlant, type PlantFamilyState } from '../services/plantFamily';
import { createEmptyClinic, STAMPS_NEEDED } from '../services/plantClinic';
import { knowledgeProgress, levelFor, plantKnowledge, KNOWLEDGE_LABEL } from '../services/plantKnowledge';
import EncyclopediaScreen from '../pages/EncyclopediaScreen';

function metPlant(speciesId: string): PlantFamilyState {
  return { ...createEmptyPlantFamily(), plants: [{ id: 'p1', speciesId, nickname: 'Test', adoptedAt: '2026-10-01T10:00:00.000Z' }] };
}

test('een plantenpagina gaat open door spelen, niet door studeren', () => {
  const leeg = createEmptyPlantFamily();
  const kliniek = createEmptyClinic();

  // Niets gedaan: geen pagina.
  assert.equal(levelFor('orchid', leeg, kliniek), 0);

  // In huis gehaald: de pagina bestaat.
  const inHuis = metPlant('orchid');
  assert.equal(levelFor('orchid', inHuis, kliniek), 1);

  // Water gegeven: de verzorging komt erbij.
  const verzorgd = waterPlant(inHuis, 'p1', '2026-10-02T10:00:00.000Z');
  assert.equal(levelFor('orchid', verzorgd, kliniek), 2);

  // Of één keer goed herkend in het spreekuur, ook zonder eigen plant.
  assert.equal(levelFor('orchid', leeg, { ...kliniek, correct: { orchid: 1 } }), 2);

  // De stempel maakt de pagina compleet.
  assert.equal(levelFor('orchid', leeg, { ...kliniek, correct: { orchid: STAMPS_NEEDED } }), 3);
  // Andere planten blijven dicht.
  assert.equal(levelFor('succulent', verzorgd, kliniek), 0);
});

test('de verst gevorderde planten staan bovenaan en de stand klopt', () => {
  const familie = metPlant('orchid');
  const kliniek = { ...createEmptyClinic(), correct: { succulent: STAMPS_NEEDED, 'small-cactus': 1 } };
  const lijst = plantKnowledge(familie, kliniek);
  assert.equal(lijst.length, PLANT_SPECIES.length);
  assert.equal(lijst[0].species.id, 'succulent');
  assert.equal(lijst[0].level, 3);
  assert.equal(lijst[1].species.id, 'small-cactus');
  assert.equal(lijst[1].level, 2);

  const stand = knowledgeProgress(lijst);
  assert.deepEqual(stand, { open: 3, compleet: 1, totaal: PLANT_SPECIES.length });
  assert.equal(KNOWLEDGE_LABEL[3], 'Compleet');
});

test('de encyclopedie toont planten pas als je ze ontdekt hebt', () => {
  const scherm = renderToStaticMarkup(<EncyclopediaScreen onNavigate={() => undefined} />);
  assert.match(scherm, /Mijn Planten/);
  assert.match(scherm, /Nog geen planten ontdekt/);
  // Zonder ontdekking staat er geen enkele soortnaam in.
  for (const species of PLANT_SPECIES) {
    assert.ok(!scherm.includes(species.origin), `${species.commonName} verklapt zijn herkomst`);
  }
});
