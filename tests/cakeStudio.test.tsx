import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { TAART_BODEMS, VERSIERINGEN, VERSIERINGEN_BY_ID } from '../data/cake/catalog';
import { MAX_SCHAAL, MIN_SCHAAL, heeftOntwerp, leegOntwerp, migreerOntwerp, nieuweVersieringId, verplaatsInStapel } from '../services/cakeStudio';

test('alle taarten en versieringen bestaan echt als bestand', () => {
  assert.equal(TAART_BODEMS.length, 6);
  assert.equal(VERSIERINGEN.length, 54);
  for (const item of [...TAART_BODEMS, ...VERSIERINGEN]) {
    assert.ok(existsSync(`public${item.beeld}`), item.beeld);
  }
  assert.equal(new Set(VERSIERINGEN.map(item => item.id)).size, VERSIERINGEN.length);
  // Elke versiering kent zijn verhouding; anders vervormt hij bij het schalen.
  for (const item of VERSIERINGEN) assert.ok(item.verhouding > .1 && item.verhouding < 5, item.id);
});

test('elke soort uit de opdracht heeft versieringen', () => {
  for (const soort of ['slagroom', 'fruit', 'snoep', 'chocolade', 'versiering']) {
    assert.ok(VERSIERINGEN.some(item => item.soort === soort), soort);
  }
});

test('een leeg ontwerp is leeg en een ontwerp met iets erop niet', () => {
  const leeg = leegOntwerp();
  assert.equal(heeftOntwerp(leeg), false);
  assert.equal(heeftOntwerp({ ...leeg, versieringen: [{ id: 'a', versieringId: VERSIERINGEN[0].id, x: .5, y: .5, schaal: 1, draai: 0 }] }), true);
});

test('rommel uit de opslag wordt opgeruimd zonder het ontwerp weg te gooien', () => {
  const uit = migreerOntwerp({
    versie: 1, bodemId: 'bestaat-niet', tekening: 'javascript:kwaad', voorbeeld: 'data:image/webp;base64,AA',
    versieringen: [
      { id: 'a', versieringId: VERSIERINGEN[0].id, x: 5, y: -2, schaal: 99, draai: 45 },
      { id: 'a', versieringId: VERSIERINGEN[1].id, x: .5, y: .5, schaal: 1, draai: 0 },
      { id: 'b', versieringId: 'verdwenen', x: .5, y: .5, schaal: 1, draai: 0 },
      'rommel',
    ],
  });
  assert.equal(uit.bodemId, TAART_BODEMS[0].id, 'een onbekende bodem valt terug op de eerste');
  assert.equal(uit.tekening, null, 'alleen een data-URL wordt vertrouwd');
  assert.equal(uit.voorbeeld, 'data:image/webp;base64,AA');
  assert.equal(uit.versieringen.length, 1, 'dubbele ids en onbekende versieringen vallen af');
  assert.equal(uit.versieringen[0].x, 1);
  assert.equal(uit.versieringen[0].y, 0);
  assert.equal(uit.versieringen[0].schaal, MAX_SCHAAL);
});

test('de schaal blijft tussen een kwart en het dubbele', () => {
  const klein = migreerOntwerp({ versieringen: [{ id: 'a', versieringId: VERSIERINGEN[0].id, schaal: .01 }] });
  assert.equal(klein.versieringen[0].schaal, MIN_SCHAAL);
});

test('een versiering schuift één plek naar voren of naar achteren', () => {
  const lijst = ['a', 'b', 'c'].map(id => ({ id, versieringId: VERSIERINGEN[0].id, x: .5, y: .5, schaal: 1, draai: 0 }));
  assert.deepEqual(verplaatsInStapel(lijst, 'a', 'voor').map(item => item.id), ['b', 'a', 'c']);
  assert.deepEqual(verplaatsInStapel(lijst, 'c', 'achter').map(item => item.id), ['a', 'c', 'b']);
  assert.deepEqual(verplaatsInStapel(lijst, 'a', 'achter').map(item => item.id), ['a', 'b', 'c'], 'onderaan blijft onderaan');
  assert.deepEqual(verplaatsInStapel(lijst, 'weg', 'voor').map(item => item.id), ['a', 'b', 'c']);
});

test('elke geplaatste versiering krijgt een eigen id', () => {
  const ids = new Set(Array.from({ length: 50 }, () => nieuweVersieringId()));
  assert.equal(ids.size, 50);
});
