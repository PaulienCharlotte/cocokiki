import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CHARACTERS } from '../data/characters';
import { alleVragen } from '../data/quiz/vragen';
import { createEmptyQuiz, dagSleutel, quizStand, vraagVanDeDag } from '../services/quiz';
import VraagVanDeDag from '../components/quiz/VraagVanDeDag';

test('elke vraag heeft precies een goed antwoord tussen de keuzes', () => {
  const vragen = alleVragen();
  assert.ok(vragen.length > 60, `te weinig vragen: ${vragen.length}`);

  for (const vraag of vragen) {
    assert.ok(vraag.vraag.length > 10, `${vraag.id} stelt geen vraag`);
    assert.ok(vraag.opties.length >= 3, `${vraag.id} heeft te weinig keuzes`);
    // Hier gaat het om: twee planten die allebei veel zon willen zouden twee
    // goede antwoorden opleveren, en dan is de vraag onoplosbaar.
    const aantalGoed = vraag.opties.filter(optie => optie === vraag.antwoord).length;
    assert.equal(aantalGoed, 1, `${vraag.id} heeft ${aantalGoed} goede antwoorden`);
    assert.equal(new Set(vraag.opties).size, vraag.opties.length, `${vraag.id} herhaalt een keuze`);
  }
});

test('vragen zijn uniek en blijven hetzelfde bij elke aanroep', () => {
  const eerste = alleVragen();
  const tweede = alleVragen();
  assert.deepEqual(eerste, tweede, 'de vragen mogen niet per keer veranderen');
  const ids = eerste.map(vraag => vraag.id);
  assert.equal(new Set(ids).size, ids.length, 'dubbele vraag-id gevonden');
});

test('het goede antwoord staat niet altijd op dezelfde plek', () => {
  const plekken = new Set(alleVragen().map(vraag => vraag.opties.indexOf(vraag.antwoord)));
  assert.ok(plekken.size > 1, 'het antwoord staat steeds op dezelfde plek');
});

test('elke bron levert vragen op', () => {
  const vragen = alleVragen();
  const bronnen = new Set(vragen.map(vraag => vraag.bron));
  assert.deepEqual([...bronnen].sort(), ['eten', 'planten', 'voeding']);
  const perBron = Object.fromEntries([...bronnen].map(bron => [bron, vragen.filter(vraag => vraag.bron === bron).length]));
  console.log('  vragen per bron:', perBron, 'totaal', vragen.length);
});

test('de vraag van de dag is elke dag dezelfde en per dag een andere', () => {
  const vragen = alleVragen();
  const leeg = createEmptyQuiz();
  const vandaag = vraagVanDeDag(leeg, '2026-10-30', vragen);
  assert.deepEqual(vraagVanDeDag(leeg, '2026-10-30', vragen), vandaag, 'dezelfde dag moet dezelfde vraag geven');

  const week = ['2026-10-30', '2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03']
    .map(dag => vraagVanDeDag(leeg, dag, vragen)?.id);
  assert.ok(new Set(week).size > 1, 'elke dag dezelfde vraag is geen vraag van de dag');
});

test('wat je goed had komt pas terug als je alles gehad hebt', () => {
  const vragen = alleVragen();
  const bijnaKlaar = { ...createEmptyQuiz(), goed: vragen.slice(1).map(vraag => vraag.id) };
  // Er is er nog één over, dus die moet het zijn, welke dag het ook is.
  assert.equal(vraagVanDeDag(bijnaKlaar, '2026-10-30', vragen)?.id, vragen[0].id);
  assert.equal(vraagVanDeDag(bijnaKlaar, '2027-03-14', vragen)?.id, vragen[0].id);

  const alles = { ...createEmptyQuiz(), goed: vragen.map(vraag => vraag.id) };
  assert.ok(vraagVanDeDag(alles, '2026-10-30', vragen), 'is alles gehad, dan begint de herhaling');
  assert.deepEqual(quizStand(alles, vragen), { goed: vragen.length, totaal: vragen.length });
});

test('de kaart toont de vraag met zijn keuzes en de juiste gids', () => {
  const kaart = renderToStaticMarkup(<VraagVanDeDag />);
  assert.match(kaart, /vraag van de dag/i);
  const vandaag = vraagVanDeDag(createEmptyQuiz(), dagSleutel());
  assert.ok(vandaag, 'er is een vraag');
  for (const optie of vandaag.opties) assert.ok(kaart.includes(optie), `keuze ontbreekt: ${optie}`);
  // Het antwoord mag er niet al uitgelicht staan voor je gekozen hebt.
  assert.doesNotMatch(kaart, /is-goed/);
  // Kiki hoort bij de planten, Coco bij het eten; verwisselen mag niet.
  assert.match(kaart, vandaag.bron === 'planten' ? /Kiki/ : /Coco/);
  assert.match(kaart, vandaag.bron === 'planten' ? /avatars\/kiki\// : /avatars\/coco/);
});

test('elke bron heeft een gids die bij zijn gebied hoort', () => {
  for (const vraag of alleVragen()) {
    const verwacht = vraag.bron === 'planten' ? 'Kiki' : 'Coco';
    assert.ok(verwacht, `${vraag.id} heeft geen gids`);
  }
});

test('de vraagkaart gebruikt de gedeelde spraakwolk en meerkeuzelijst', () => {
  const kaart = renderToStaticMarkup(<VraagVanDeDag />);
  // Niet de vormgeving van déze kaart, maar de vorm die elke vraag in de app
  // krijgt. Rolt iemand hier een eigen wolk of eigen knoppen uit, dan valt dat
  // hier om: zie .claude/skills/cocokiki-ui/SKILL.md.
  assert.match(kaart, /class="ck-zegt/, 'de vraag hoort in de spraakwolk te staan');
  assert.match(kaart, /ck-zegt__wolk/);
  assert.match(kaart, /class="ck-keuzes/, 'de antwoorden horen in één keuzeblok');
  const knoppen = kaart.match(/class="ck-keuze"/g) ?? [];
  assert.equal(knoppen.length, 3, 'drie antwoorden, allemaal in dezelfde vorm');
});

test('elk personage blijft bij zijn eigen gebied', () => {
  assert.equal(CHARACTERS.kiki.gebied, 'planten');
  assert.equal(CHARACTERS.coco.gebied, 'koken');
  assert.equal(CHARACTERS.lua.gebied, 'rekenen');
  assert.equal(CHARACTERS.seb.gebied, 'topografie');
  // Eén lijst met plaatjes: twee personages mogen nooit hetzelfde gezicht hebben.
  const beelden = Object.values(CHARACTERS).map(personage => personage.beeld);
  assert.equal(new Set(beelden).size, beelden.length);
});
