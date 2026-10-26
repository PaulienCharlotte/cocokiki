import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PLANT_SPECIES_BY_ID } from '../data/plants/species';
import { plantFirstAid, PLANT_PROBLEM_LABEL } from '../data/plants/firstAid';
import {
  clueText,
  DIAGNOSE_CHOICES,
  PATIENT_KINDS,
  treatmentFor,
  TREATMENTS_BY_ID,
} from '../data/plants/clinic';
import {
  createEmptyClinic,
  finishConsult,
  hasStamp,
  migrateClinic,
  nextPatient,
  passportProgress,
  STAMPS_NEEDED,
} from '../services/plantClinic';
import PlantClinicScreen from '../pages/PlantClinicScreen';

test('er komen alleen patiënten waar ook echt een ziek plaatje van is', () => {
  assert.ok(PATIENT_KINDS.length >= 20, `te weinig patiënten: ${PATIENT_KINDS.length}`);
  for (const kind of PATIENT_KINDS) {
    const species = PLANT_SPECIES_BY_ID[kind.speciesId];
    assert.ok(species, `onbekende soort ${kind.speciesId}`);
    assert.ok(DIAGNOSE_CHOICES.includes(kind.cause), `${kind.speciesId} heeft een oorzaak die niet te kiezen is`);
    assert.match(kind.image, /\.webp$/);
    assert.ok(kind.image.includes(kind.speciesId));
    assert.ok(TREATMENTS_BY_ID[treatmentFor(species, kind.cause)], `geen behandeling voor ${kind.cause}`);
    // Het bladspoor moet over déze soort gaan, niet terugvallen op een vaag zinnetje.
    const blad = clueText(species, kind.cause, 'blad');
    assert.doesNotMatch(blad, /lastig te zeggen/, `${kind.speciesId} mist een EHBO-tekst voor ${kind.cause}`);
  }
  // Alle vier de oorzaken komen voor, anders leert een kind er maar twee.
  for (const cause of DIAGNOSE_CHOICES) {
    assert.ok(PATIENT_KINDS.some(kind => kind.cause === cause), `geen patiënt met ${cause}`);
  }
});

test('de aanwijzingen verschillen per soort en per oorzaak', () => {
  const varen = PLANT_SPECIES_BY_ID['hanging-fern'];
  const cactus = PLANT_SPECIES_BY_ID['small-cactus'];
  // Het blad vertelt het verhaal van díé soort.
  assert.notEqual(clueText(varen, 'te-weinig-water', 'blad'), clueText(cactus, 'te-weinig-water', 'blad'));
  // De aarde en de standplaats verraden de oorzaak, bij elke plant hetzelfde.
  assert.equal(clueText(varen, 'te-veel-water', 'aarde'), clueText(cactus, 'te-veel-water', 'aarde'));
  assert.match(clueText(varen, 'te-weinig-water', 'aarde'), /droog/i);
  assert.match(clueText(varen, 'te-veel-water', 'aarde'), /nat/i);
  assert.match(clueText(varen, 'te-veel-zon', 'plek'), /zon/i);
  assert.match(clueText(varen, 'te-weinig-licht', 'plek'), /raam/i);
  for (const spot of ['blad', 'aarde', 'plek'] as const) {
    for (const cause of DIAGNOSE_CHOICES) {
      assert.ok(clueText(cactus, cause, spot).trim().length > 0, `${cause}/${spot} mist tekst`);
    }
  }
});

test('een stempel kost drie goede diagnoses en telt maar één keer per consult', () => {
  let staat = createEmptyClinic();
  const patient = { ...PATIENT_KINDS[0], consultId: 'consult-1' };

  const eerste = finishConsult(staat, patient, 0, false);
  assert.equal(eerste.coins, 3);
  assert.equal(eerste.stampEarned, false);
  staat = eerste.state;

  // Hetzelfde consult nog eens afronden levert niets extra op.
  const dubbel = finishConsult(staat, patient, 0, false);
  assert.equal(dubbel.coins, 0);
  assert.equal(dubbel.state, staat);

  // Een misser of een hint levert minder op, maar nooit niets.
  staat = finishConsult(staat, { ...patient, consultId: 'consult-2' }, 0, true).state;
  const derde = finishConsult(staat, { ...patient, consultId: 'consult-3' }, 2, false);
  assert.equal(derde.coins, 1);
  assert.equal(derde.stampEarned, true);
  assert.equal(hasStamp(derde.state, patient.speciesId), true);
  assert.equal(derde.state.correct[patient.speciesId], STAMPS_NEEDED);
  assert.equal(derde.state.helped, 3);
});

test('soorten zonder stempel komen eerst aan de beurt', () => {
  const soorten = [...new Set(PATIENT_KINDS.map(kind => kind.speciesId))];
  let staat = createEmptyClinic();
  // Geef alle soorten op één na hun stempel.
  for (const id of soorten.slice(1)) staat = { ...staat, correct: { ...staat.correct, [id]: STAMPS_NEEDED } };
  for (const trek of [0, 0.3, 0.6, 0.99]) {
    const patient = nextPatient(staat, () => trek, () => 'x');
    assert.equal(patient?.speciesId, soorten[0]);
  }
  // Heeft iedereen een stempel, dan komt er gewoon weer iemand langs.
  const vol = { ...staat, correct: Object.fromEntries(soorten.map(id => [id, STAMPS_NEEDED])) };
  assert.ok(nextPatient(vol, () => 0.5, () => 'x'));
  assert.equal(passportProgress(vol).earned, passportProgress(vol).total);
});

test('het spreekuur overleeft een herstart en beschadigde opslag', () => {
  const staat = finishConsult(createEmptyClinic(), { ...PATIENT_KINDS[0], consultId: 'c' }, 0, false).state;
  assert.deepEqual(migrateClinic(JSON.parse(JSON.stringify(staat))), staat);
  assert.deepEqual(migrateClinic(null), createEmptyClinic());
  assert.deepEqual(migrateClinic({ version: 7 }), createEmptyClinic());
  const rommel = migrateClinic({ version: 1, correct: { 'bestaat-niet': 5, orchid: -2, succulent: 2 }, appliedConsults: ['a', 'a'], helped: 2 });
  assert.deepEqual(rommel.correct, { succulent: 2 });
  assert.deepEqual(rommel.appliedConsults, ['a']);
});

test('het spreekuur begint met onderzoeken, niet met gokken', () => {
  const scherm = renderToStaticMarkup(<PlantClinicScreen />);
  assert.match(scherm, /Plantendokter/);
  assert.match(scherm, /Stap 1 van 3/);
  assert.match(scherm, /Onderzoek de plant/);
  assert.match(scherm, /Kijk naar de bladeren/);
  assert.match(scherm, /Voel aan de aarde/);
  assert.match(scherm, /Vraag het aan Kiki/);
  // De diagnose en de behandeling komen pas later.
  assert.doesNotMatch(scherm, /Stap 2 van 3/);
  assert.doesNotMatch(scherm, new RegExp(PLANT_PROBLEM_LABEL['te-veel-zon']));
});

test('een plant die al rot is moet ompotten, een taaie plant mag gewoon opdrogen', () => {
  // Een cactus, vetplant, vrouwentong of orchidee is bij natte aarde al aan het rotten.
  for (const id of ['small-cactus', 'succulent', 'snake-plant', 'orchid']) {
    assert.equal(treatmentFor(PLANT_SPECIES_BY_ID[id], 'te-veel-water'), 'ompotten', id);
  }
  // Een monstera of varen droogt vanzelf weer op.
  for (const id of ['monstera-basket', 'hanging-fern', 'white-flower']) {
    assert.equal(treatmentFor(PLANT_SPECIES_BY_ID[id], 'te-veel-water'), 'laten-drogen', id);
  }
  // Bij de andere oorzaken maakt de soort niet uit.
  assert.equal(treatmentFor(PLANT_SPECIES_BY_ID['small-cactus'], 'te-weinig-water'), 'gieter');
  assert.equal(treatmentFor(PLANT_SPECIES_BY_ID['hanging-fern'], 'te-veel-zon'), 'schaduw');
});

test('de EHBO-kaart zegt hetzelfde als het spreekuur', () => {
  // Waar het spel ompotten verwacht, moet de kaart dat ook adviseren.
  for (const id of ['small-cactus', 'succulent', 'snake-plant', 'orchid']) {
    const natte = plantFirstAid(id).find(probleem => probleem.cause === 'te-veel-water');
    assert.ok(natte, `${id} mist te-veel-water op de kaart`);
    assert.match(natte!.fix, /pot hem om|ompotten|direct ompotten/i, id);
  }
});

test('alles staat op één kaart en Kiki komt pas bij een hint', () => {
  const scherm = renderToStaticMarkup(<PlantClinicScreen />);
  // Eén kaart, niet drie losse blokken.
  assert.equal(scherm.split('clinic__card').length - 1, 1);
  // De knoppen komen uit het ontwerpsysteem, niet uit eigen maaksel.
  assert.match(scherm, /ck-button ck-button--primary/);
  assert.match(scherm, /ck-button ck-button--quiet/);
  // Kiki staat niet in beeld tot er om hulp gevraagd wordt.
  assert.doesNotMatch(scherm, /kiki-tip/);
  assert.doesNotMatch(scherm, /Kiki zegt/);
  assert.match(scherm, /Kiki, help eens/);
  // Kiki brengt de patiënt binnen; Coco hoort bij de keuken, niet hier.
  assert.match(scherm, /avatars\/kiki/);
  assert.doesNotMatch(scherm, /avatars\/coco/);
  assert.match(scherm, /Raak de plant aan/);
  assert.match(scherm, /clinic__raak--blad/);
  assert.match(scherm, /clinic__raak--aarde/);
});
