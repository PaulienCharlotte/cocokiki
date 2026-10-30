import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PLANT_SPECIES, PLANT_SPECIES_BY_ID } from '../data/plants/species';
import { plantFirstAid, PLANT_PROBLEM_LABEL, type PlantProblemCause } from '../data/plants/firstAid';
import { PLANTENWIJZER, WIJZER_BY_CAUSE } from '../data/plants/wijzer';
import {
  clueText,
  diagnoseKeuzes,
  maakGeval,
  GEREEDSCHAP_PLAATJE,
  OORZAAK_PLAATJE,
  naamKeuzes,
  DIAGNOSE_CHOICES,
  PATIENT_KINDS,
  type Geval,
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
    const blad = clueText(species, maakGeval(kind, () => 0), 'blad');
    assert.doesNotMatch(blad, /lastig te zeggen/, `${kind.speciesId} mist een EHBO-tekst voor ${kind.cause}`);
  }
  // Alle zes de oorzaken komen voor, anders leert een kind er maar een paar.
  for (const cause of DIAGNOSE_CHOICES) {
    assert.ok(PATIENT_KINDS.some(kind => kind.cause === cause), `geen patiënt met ${cause}`);
  }
});

/** Een geval maken zonder toeval, zodat een test altijd hetzelfde ziet. */
function geval(speciesId: string, cause: PlantProblemCause, trek = 0): Geval {
  const kind = PATIENT_KINDS.find(k => k.speciesId === speciesId && k.cause === cause);
  assert.ok(kind, `geen patiënt ${speciesId}/${cause}`);
  return maakGeval(kind, () => trek);
}

test('de aanwijzingen verschillen per soort en per oorzaak', () => {
  const varen = PLANT_SPECIES_BY_ID['hanging-fern'];
  const cactus = PLANT_SPECIES_BY_ID['small-cactus'];
  // Het blad vertelt het verhaal van díé soort.
  assert.notEqual(
    clueText(varen, geval('hanging-fern', 'te-weinig-water'), 'blad'),
    clueText(cactus, geval('small-cactus', 'te-weinig-water'), 'blad'),
  );
  assert.match(clueText(varen, geval('hanging-fern', 'te-weinig-water'), 'aarde'), /droog/i);
  assert.match(clueText(varen, geval('hanging-fern', 'te-veel-water'), 'aarde'), /nat/i);
  assert.match(clueText(varen, geval('hanging-fern', 'te-veel-zon'), 'plek'), /zon/i);
  for (const spot of ['blad', 'aarde', 'plek'] as const) {
    for (const kind of PATIENT_KINDS.filter(k => k.speciesId === 'small-cactus')) {
      assert.ok(clueText(cactus, maakGeval(kind, () => 0), spot).trim().length > 0, `${kind.cause}/${spot} mist tekst`);
    }
  }
});

test('de omstandigheden passen bij de oorzaak en verraden hem niet alleen', () => {
  for (const kind of PATIENT_KINDS) {
    for (const trek of [0, 0.5, 0.99]) {
      const g = maakGeval(kind, () => trek);
      assert.ok(g.dagenGeleden >= 1, `${kind.speciesId}/${kind.cause}: onzinnig aantal dagen`);
      // Dorst hoort bij droge aarde, natte voeten bij natte aarde. Anders klopt het verhaal niet.
      if (kind.cause === 'te-weinig-water') assert.equal(g.aarde, 'kurkdroog');
      if (kind.cause === 'te-veel-water') assert.equal(g.aarde, 'drijfnat');
      if (kind.cause === 'droge-lucht') { assert.equal(g.aarde, 'gewoon'); assert.equal(g.plek, 'verwarming'); }
      if (kind.cause === 'te-koud') assert.equal(g.seizoen, 'winter');
      if (kind.cause === 'te-veel-zon') assert.equal(g.plek, 'zuidraam');
    }
  }
});

test('dezelfde plek betekent niet dezelfde oorzaak', () => {
  // Dit is de hele verdieping: bij de verwarming kan het droge lucht zijn of
  // gewoon dorst, en alleen de aarde zegt welke van de twee.
  const varen = PLANT_SPECIES_BY_ID['hanging-fern'];
  const droogteBijVerwarming = { ...geval('hanging-fern', 'te-weinig-water'), plek: 'verwarming' as const };
  const drogeLucht = geval('hanging-fern', 'droge-lucht');
  assert.equal(drogeLucht.plek, 'verwarming');
  assert.equal(
    clueText(varen, droogteBijVerwarming, 'plek').replace(/winter|lente|zomer|herfst.*/, ''),
    clueText(varen, { ...drogeLucht, seizoen: droogteBijVerwarming.seizoen }, 'plek').replace(/winter|lente|zomer|herfst.*/, ''),
    'dezelfde plek hoort hetzelfde te klinken',
  );
  // De aarde is wat ze uit elkaar houdt.
  assert.notEqual(clueText(varen, droogteBijVerwarming, 'aarde'), clueText(varen, drogeLucht, 'aarde'));
});

test('elke patiënt krijgt vier antwoorden met het juiste ertussen', () => {
  for (const kind of PATIENT_KINDS) {
    const g = maakGeval(kind, () => 0);
    const keuzes = diagnoseKeuzes(g);
    assert.equal(keuzes.length, 4, `${kind.speciesId}/${kind.cause} geeft ${keuzes.length} antwoorden`);
    assert.equal(new Set(keuzes).size, 4, 'een antwoord staat er dubbel in');
    assert.ok(keuzes.includes(kind.cause), 'het juiste antwoord ontbreekt');
    // De bijna-goede antwoorden horen erbij; daar zit de les in.
    if (kind.cause === 'droge-lucht') assert.ok(keuzes.includes('te-weinig-water'), 'dorst hoort naast droge lucht te staan');
    if (kind.cause === 'te-koud') assert.ok(keuzes.includes('te-veel-water'), 'natte voeten horen naast kou te staan');
    // Dezelfde patiënt geeft dezelfde vier; anders wordt terugkomen makkelijker.
    assert.deepEqual(diagnoseKeuzes(g), keuzes);
  }
  // Niet elke patiënt krijgt hetzelfde rijtje, anders leer je het uit je hoofd.
  const rijtjes = new Set(PATIENT_KINDS.map(kind => diagnoseKeuzes(maakGeval(kind, () => 0)).join(',')));
  assert.ok(rijtjes.size > 1, 'alle patiënten krijgen hetzelfde rijtje antwoorden');
});

test('een stempel kost drie goede diagnoses en telt maar één keer per consult', () => {
  let staat = createEmptyClinic();
  const patient = { ...maakGeval(PATIENT_KINDS[0], () => 0), consultId: 'consult-1' };

  const eerste = finishConsult(staat, patient, 0, false);
  assert.equal(eerste.coins, 2);
  assert.equal(eerste.stampEarned, false);
  staat = eerste.state;

  // Hetzelfde consult nog eens afronden levert niets extra op.
  const dubbel = finishConsult(staat, patient, 0, false);
  assert.equal(dubbel.coins, 0);
  assert.equal(dubbel.state, staat);

  // Een denkstap of herkansing verandert de beloning niet.
  staat = finishConsult(staat, { ...patient, consultId: 'consult-2' }, 0, true).state;
  const derde = finishConsult(staat, { ...patient, consultId: 'consult-3' }, 2, false);
  assert.equal(derde.coins, 2);
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
  const staat = finishConsult(createEmptyClinic(), { ...maakGeval(PATIENT_KINDS[0], () => 0), consultId: 'c' }, 0, false).state;
  assert.deepEqual(migrateClinic(JSON.parse(JSON.stringify(staat))), staat);
  assert.deepEqual(migrateClinic(null), createEmptyClinic());
  assert.deepEqual(migrateClinic({ version: 7 }), createEmptyClinic());
  const rommel = migrateClinic({ version: 1, correct: { 'bestaat-niet': 5, orchid: -2, succulent: 2 }, appliedConsults: ['a', 'a'], helped: 2 });
  assert.deepEqual(rommel.correct, { succulent: 2 });
  assert.deepEqual(rommel.appliedConsults, ['a']);
});

test('het spreekuur begint met onderzoeken, niet met gokken', () => {
  const scherm = renderToStaticMarkup(<PlantClinicScreen />);
  assert.match(scherm, /Raak de plant aan/);
  assert.match(scherm, /Kijk naar de bladeren/);
  assert.match(scherm, /Voel aan de aarde/);
  assert.match(scherm, /Vraag het aan Kiki/);
  // De plantennaam staat bovenaan; een losse schermtitel leidt alleen af.
  assert.doesNotMatch(scherm, />Plantendokter</);
  // De diagnose en de behandeling komen pas later.
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
  // Kiki is de enige stem: precies één tekstballon op de kaart.
  assert.equal(scherm.split('clinic__bubbel').length - 1, 1);
  // Drie chips in plaats van drie tekstblokken.
  assert.equal(scherm.split('clinic__chip"').length - 1 + scherm.split('clinic__chip ').length - 1, 3);
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

test('de bonusvraag biedt drie namen met precies één goede', () => {
  for (const species of PLANT_SPECIES) {
    const keuzes = naamKeuzes(species.id);
    assert.equal(keuzes.length, 3, species.id);
    assert.equal(new Set(keuzes).size, 3, `${species.id} herhaalt een naam`);
    assert.equal(keuzes.filter(naam => naam === species.commonName).length, 1, species.id);
    for (const naam of keuzes) {
      assert.ok(PLANT_SPECIES.some(soort => soort.commonName === naam), `${naam} bestaat niet`);
    }
    // Dezelfde plant geeft altijd hetzelfde rijtje, anders raakt een kind in de war.
    assert.deepEqual(naamKeuzes(species.id), keuzes);
  }
  // Het goede antwoord staat niet altijd op dezelfde plek.
  const plekken = new Set(PLANT_SPECIES.map(soort => naamKeuzes(soort.id).indexOf(soort.commonName)));
  assert.ok(plekken.size > 1, 'het juiste antwoord staat altijd op dezelfde plek');
  assert.equal(naamKeuzes('bestaat-niet').length, 0);
});

test('de naam van de patiënt blijft geheim tot de plant gered is', () => {
  const scherm = renderToStaticMarkup(<PlantClinicScreen />);
  assert.match(scherm, /Wie is dit\?/);
  assert.match(scherm, /Een nieuwe pati(ë|&#x[0-9a-f]+;)nt/);
  // Geen enkele soortnaam mag al in beeld staan.
  for (const species of PLANT_SPECIES) {
    assert.ok(!scherm.includes(species.scientificName), `${species.scientificName} verklapt de plant`);
  }
});

test('het plantenboek dekt elke oorzaak en wijst nergens naar een leeg plaatje', () => {
  const oorzaken = PLANTENWIJZER.map(pagina => pagina.cause);
  assert.equal(new Set(oorzaken).size, oorzaken.length);
  for (const cause of Object.keys(PLANT_PROBLEM_LABEL) as PlantProblemCause[]) {
    assert.ok(WIJZER_BY_CAUSE[cause], `geen boekpagina voor ${cause}`);
  }
  for (const pagina of PLANTENWIJZER) {
    // Kiki's hint komt hier vandaan, dus hij moet echt iets uitleggen.
    assert.ok(pagina.vuistregel.length > 40, `${pagina.cause} heeft een te magere vuistregel`);
    for (const plaatje of [pagina.plaatje, pagina.gereedschap]) {
      if (plaatje) assert.ok(existsSync(`public${plaatje}`), `${plaatje} staat niet in public`);
    }
  }
});

test('elke oorzaak en elke behandeling heeft een eigen tekening', () => {
  for (const [id, plaatje] of Object.entries(GEREEDSCHAP_PLAATJE)) {
    assert.ok(existsSync(`public${plaatje}`), `${id} wijst naar ${plaatje}, maar dat bestaat niet`);
  }
  for (const cause of Object.keys(PLANT_PROBLEM_LABEL) as PlantProblemCause[]) {
    const plaatje = OORZAAK_PLAATJE[cause];
    assert.ok(plaatje, `geen tekening voor ${cause}`);
    assert.ok(existsSync(`public${plaatje}`), `${cause} wijst naar ${plaatje}, maar dat bestaat niet`);
  }
  // Twee knoppen met hetzelfde plaatje zijn niet uit elkaar te houden.
  const alle = [...Object.values(GEREEDSCHAP_PLAATJE), ...Object.values(OORZAAK_PLAATJE)];
  assert.equal(new Set(alle).size, alle.length);
});

test('elk geval is op te lossen: de drie aanwijzingen samen wijzen één oorzaak aan', () => {
  // Zonder dit is het spreekuur gokken. De aarde, de plek en het seizoen samen
  // mogen nooit bij twee oorzaken tegelijk passen, anders kan een kind het
  // goed beredeneren en toch fout hebben.
  const gezien = new Map<string, PlantProblemCause>();
  for (const kind of PATIENT_KINDS) {
    for (const trek of [0, 0.2, 0.4, 0.6, 0.8, 0.99]) {
      const g = maakGeval(kind, () => trek);
      const sleutel = `${g.aarde}|${g.plek}|${g.seizoen}`;
      const eerder = gezien.get(sleutel);
      assert.ok(
        eerder === undefined || eerder === g.cause,
        `${sleutel} past zowel bij ${eerder} als bij ${g.cause}`,
      );
      gezien.set(sleutel, g.cause);
    }
  }
});
