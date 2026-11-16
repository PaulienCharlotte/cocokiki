import test from 'node:test';
import assert from 'node:assert/strict';
import { maakRedactiedeck } from '../games/math/redactie/catalogus';
import { somTekst, type Redactiesom } from '../games/math/redactie/types';
import { bouwGetallen, leesSom, somKiesbaar, somOpties, steunvormVoorNiveau, tussenvraagZichtbaar, waarom, wedervraag, zelfdeSom } from '../games/math/redactie/somKeuze';
import { MATH_LEVELS } from '../games/math/types';

test('bij elke redactiesom kun je elke stap zelf goed kiezen en bouwen', () => {
  for (const level of MATH_LEVELS) for (let ronde = 0; ronde < 4; ronde++) {
    for (const som of maakRedactiedeck(level) as Redactiesom[]) {
      som.stappen.forEach((stap, i) => {
        const tekst = somTekst(som.stappen, i, i, false, som.stappen.map(s => s.antwoord));
        if (!somKiesbaar(stap, tekst)) return;
        const juist = leesSom(tekst)!;
        for (const aantal of [2, 4] as const) {
          const opties = somOpties(juist, aantal, `${som.id}:${i}`);
          assert.ok(opties.length >= 2 && opties.length <= aantal, `${som.id} stap ${i + 1}: ${opties.length} opties`);
          assert.equal(opties.filter(o => zelfdeSom(leesSom(o)!, juist)).length, 1, `${som.id} stap ${i + 1}: precies één goede som`);
          assert.equal(new Set(opties).size, opties.length, `${som.id} stap ${i + 1}: geen dubbele opties`);
        }
        const getallen = bouwGetallen(juist, som.nodig, som.id);
        assert.ok(getallen.includes(juist.links) && getallen.includes(juist.rechts), `${som.id} stap ${i + 1}: de goede getallen liggen klaar om te bouwen`);
        assert.ok(waarom(stap, juist).length > 10);
      });
    }
  }
});

test('de steun neemt af per niveau: kiezen uit twee, uit vier, zelf bouwen, zelf de stap bedenken', () => {
  assert.equal(steunvormVoorNiveau(1), 'kies-twee');
  assert.equal(steunvormVoorNiveau(2), 'kies-vier');
  assert.equal(steunvormVoorNiveau(3), 'bouw');
  assert.equal(tussenvraagZichtbaar(3), true);
  assert.equal(tussenvraagZichtbaar(4), false);
});

test('een omgedraaide som telt bij plus en keer, niet bij min en delen', () => {
  assert.ok(zelfdeSom(leesSom('3 × 7')!, leesSom('7 × 3')!));
  assert.ok(!zelfdeSom(leesSom('100 ÷ 5')!, leesSom('5 ÷ 100')!));
  assert.ok(zelfdeSom(leesSom('3 × € 2,00')!, leesSom('€2,00 × 3')!));
  // De verkeerde keuze krijgt een wedervraag, geen antwoord.
  assert.match(wedervraag(leesSom('5 ÷ 100'), leesSom('100 ÷ 5')!), /verdelen/);
  assert.doesNotMatch(wedervraag(leesSom('100 × 5'), leesSom('100 ÷ 5')!), /20/);
  // Omrekenen krijgt een eigen uitleg.
  assert.match(waarom({ vraag: '', som: '', antwoord: 0, eenheid: '', tip: '' }, leesSom('8 × 10')!), /kleinere maat/);
});

test('een tussenvraag zegt nooit de som voor', () => {
  for (const level of MATH_LEVELS) for (let ronde = 0; ronde < 4; ronde++) {
    for (const som of maakRedactiedeck(level) as Redactiesom[]) {
      som.stappen.forEach((stap, i) => {
        const tekst = somTekst(som.stappen, i, i, false, som.stappen.map(s => s.antwoord));
        if (!somKiesbaar(stap, tekst)) return;
        assert.doesNotMatch(stap.vraag, /[×÷]/, `${som.id} stap ${i + 1}: "${stap.vraag}" verklapt het rekenteken`);
        assert.ok(!stap.vraag.includes(tekst), `${som.id} stap ${i + 1}: "${stap.vraag}" bevat de som`);
      });
    }
  }
});
