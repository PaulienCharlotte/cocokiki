import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { REDACTIE_TYPEN_BY_ID, maakRedactiedeck, steunVoorNiveau } from '../games/math/redactie/catalogus';
import { evalueerSom, planOpties, somTekst } from '../games/math/redactie/types';
import { paaltjes } from '../games/math/redactie/typen/paaltjes';
import { ritten } from '../games/math/redactie/typen/ritten';
import RedactieChallenge from '../games/math/RedactieChallenge';
import { rekenUit, toonGetal } from '../games/math/Rekenmachine';
import { TRAPPEN, reken } from '../games/math/Maten';
import { maakMatendeck } from '../games/math/maten/vragen';
import { mathAssets } from '../games/math/assets';
import { techniqueHint } from '../games/math/techniqueHint';
import { generateQuestion } from '../games/math/engine';
import { roomSwipeDirection } from '../services/roomSwipe';
import TipCoach from '../components/TipCoach';
import MathHelp from '../games/math/MathHelp';
import { loadTestDraft, saveTestDraft, testDraftKey } from '../services/topoTestDraft';
import { guardedNavigation, hasNavigationGuard, registerNavigationGuard } from '../services/navigationGuard';
import { nextUnansweredTestId, shuffledTestIds } from '../services/testNumbering';
import { evaluate, validAnswer } from '../games/math/engine';
import { MATH_LEVELS } from '../games/math/types';
import { memoryBoardIds } from '../services/memoryBoards';
import { loadProfileAvatar, PROFILE_AVATAR_KEY } from '../services/profile';
import type { Expression } from '../games/math/types';

test('elke redactiesom draagt zijn eigen aanpak, stappen en getallen', () => {
  for (const level of MATH_LEVELS) for (const random of [() => 0, () => .999, Math.random]) {
    const deck = maakRedactiedeck(level, random);
    assert.equal(deck.length, 10);
    assert.equal(new Set(deck.map(question => question.prompt)).size, 10);
    const steun = steunVoorNiveau(level);
    for (const question of deck) {
      const type = REDACTIE_TYPEN_BY_ID[question.typeId];
      assert.ok(type, `onbekend type ${question.typeId}`);
      assert.ok(type.niveaus.includes(level));
      assert.ok(question.stappen.length >= 2);
      assert.equal(question.answer, question.stappen.at(-1)?.antwoord);
      assert.ok(question.stappen.every(stap => Number.isFinite(stap.antwoord) && stap.antwoord >= 0));
      assert.ok(question.stappen.every(stap => stap.tip && stap.vraag && stap.eenheid));
      assert.ok(question.zoek && question.controle);
      // Elk getal dat je moet aanstrepen staat ook echt in het verhaal.
      assert.ok(question.nodig.length >= 2);
      for (const getal of question.nodig) assert.ok(question.prompt.includes(getal), `${getal} ontbreekt in: ${question.prompt}`);
      const open = renderToStaticMarkup(<RedactieChallenge question={question} steun={steun} locked={false} onAnswer={() => undefined} onVerder={() => undefined} />);
      // Eerst aanstrepen: het werkblad komt pas daarna in beeld.
      assert.ok(open.includes('redactie-getal'));
      assert.ok(!open.includes('math-workbench'));
      // Elke stap is na te rekenen met de getallen die eraan voorafgaan.
      const tot: number[] = [];
      for (const stap of question.stappen) {
        assert.equal(evalueerSom(stap.som, tot, stap.afronden), stap.antwoord,
          `'${stap.som}' levert niet ${stap.antwoord} op`);
        tot.push(stap.antwoord);
      }
    }
  }
});

test('een latere stap verklapt nooit de uitkomst van een eerdere', () => {
  for (const level of MATH_LEVELS) {
    for (const question of maakRedactiedeck(level, Math.random)) {
      for (const [i, stap] of question.stappen.entries()) {
        const verwijzingen = [...stap.som.matchAll(/\{(\d+)\}/g)].map(treffer => Number(treffer[1]));
        // Een verwijzing wijst altijd naar een eerdere stap, nooit vooruit.
        assert.ok(verwijzingen.every(nummer => nummer >= 1 && nummer <= i), `stap ${i + 1} verwijst vooruit: ${stap.som}`);
        // Zolang je er nog niet bent staat er een vraagteken.
        if (verwijzingen.length && !stap.verborgen) {
          assert.ok(somTekst(question.stappen, i, 0, false).includes('?'));
          assert.ok(!somTekst(question.stappen, i, i, false).includes('?'));
        }
      }
      // Wie alleen stap 1 ziet, kan het eindantwoord nergens aflezen.
      const laatste = somTekst(question.stappen, question.stappen.length - 1, 0, false);
      assert.ok(!laatste.includes(String(question.answer)) || question.prompt.includes(String(question.answer)));
    }
  }
});

test('de vier aanpakken bevatten de juiste, en narekenen met eigen getallen werkt', () => {
  for (const level of MATH_LEVELS) {
    for (const question of maakRedactiedeck(level, Math.random)) {
      const opties = planOpties(question.stappen[0].som, question.id);
      assert.equal(opties.length, 4);
      assert.equal(new Set(opties).size, 4);
      assert.ok(opties.includes(question.stappen[0].som), `de juiste aanpak ontbreekt: ${question.stappen[0].som}`);
    }
  }
  // Rekent een kind door met een fout getal, dan telt de volgende stap als
  // goed zolang die bij zijn eigen som klopt.
  assert.equal(evalueerSom('{1} × 24', [12]), 288);
  assert.equal(evalueerSom('319 ÷ 24', [], 'beneden'), 13);
  assert.equal(evalueerSom('14 + 60 + 28', []), 102);
  assert.equal(evalueerSom('5 ÷ 0', []), null);
});

test('geen enkele stap vraagt om rekenregels', () => {
  for (const level of MATH_LEVELS) for (const random of [() => 0, () => .999, Math.random]) {
    for (const question of maakRedactiedeck(level, random)) {
      for (const stap of question.stappen) {
        const punt = /[×÷]/.test(stap.som), streep = /[+−]/.test(stap.som);
        assert.ok(!(punt && streep),
          `'${stap.som}' mengt keer of delen met plus of min; splits dat in twee stappen`);
      }
    }
  }
});

test('het matenspel stelt alleen vragen die bij het niveau passen', () => {
  for (const level of MATH_LEVELS) for (const random of [() => 0, () => .999, Math.random]) {
    const deck = maakMatendeck(level, random);
    assert.equal(deck.length, 10);
    const bekend = new Set((level <= 1 ? TRAPPEN.slice(0, 2) : level <= 3 ? TRAPPEN.slice(0, 3) : level === 4 ? TRAPPEN.slice(0, 4) : TRAPPEN).flatMap(t => t.maten));
    for (const vraag of deck) {
      if (vraag.soort === 'omrekenen') {
        assert.ok(bekend.has(vraag.van) && bekend.has(vraag.naar), `${vraag.van}→${vraag.naar} hoort niet bij niveau ${level}`);
        // Het antwoord mag geen eindeloos kommagetal zijn.
        assert.ok(String(vraag.answer).replace('-', '').replace('.', '').length <= 8, `${vraag.answer} is te lang`);
      } else {
        assert.ok(vraag.keuzes.length >= 3);
        assert.ok(vraag.keuzes[vraag.answer], 'het juiste antwoord ontbreekt in de keuzes');
        for (const keuze of vraag.keuzes) {
          const maat = keuze.split(' ').at(-1)!;
          assert.ok(bekend.has(maat), `${maat} hoort niet bij niveau ${level}`);
        }
      }
    }
  }
});

test('de matentrapjes rekenen beide kanten op, met de juiste stapgrootte', () => {
  assert.equal(reken(1, 3, 10), 1000);          // hm → dm
  assert.equal(reken(250, -2, 10), 2.5);        // cm → dm → m
  assert.equal(reken(1, 1, 100), 100);          // ha → dam²
  assert.equal(reken(2, 2, 1000), 2000000);     // m³ → cm³
  assert.equal(reken(5, 0, 10), 5);
  // Elke trap heeft een basismaat die ook echt in de rij staat.
  for (const trap of TRAPPEN) {
    assert.ok(trap.maten.includes(trap.basis), `${trap.naam} mist ${trap.basis}`);
    assert.equal(new Set(trap.maten).size, trap.maten.length);
    assert.ok([10, 100, 1000].includes(trap.factor));
  }
});

test('de rekenmachine rekent, en deelt niet door nul', () => {
  assert.equal(rekenUit(5, '×', 6), 30);
  assert.equal(rekenUit(120, '÷', 4), 30);
  assert.equal(rekenUit(7, '−', 9), -2);
  assert.equal(toonGetal(rekenUit(5, '÷', 0)), 'oeps');
  // Een derde wordt geen eindeloze sliert, en de komma is Nederlands.
  assert.equal(toonGetal(rekenUit(10, '÷', 3)), '3,3333');
  assert.equal(toonGetal(rekenUit(1, '+', 2)), '3');
});

test('de paaltjessom telt er één bij, maar rondom niet', () => {
  const recht = paaltjes.maak(3, 0, () => 0);
  const laatste = recht.stappen.at(-1)!, eerste = recht.stappen[0];
  assert.equal(laatste.antwoord, eerste.antwoord + 1);
  const rond = paaltjes.maak(5, 2, () => 0);
  assert.equal(rond.stappen.at(-1)!.antwoord, rond.stappen.at(-2)!.antwoord);
});

test('de ritjessom rondt alleen naar boven als er iets overblijft', () => {
  let metRest = 0, zonderRest = 0;
  for (let index = 0; index < 12; index++) {
    const kort = ritten.maak(4, index, Math.random);
    assert.equal(kort.stappen.length, 2, 'vanaf niveau 3 hoort de rest niet meer uitgeschreven te worden');
    const [vol, beslissing] = kort.stappen;
    assert.ok(beslissing.verborgen, 'de beslissing mag niet voorgezegd worden');
    const totaal = Number(kort.nodig[0]), perKeer = Number(kort.nodig[1]);
    const rest = totaal - vol.antwoord * perKeer;
    assert.ok(rest >= 0 && rest < perKeer);
    assert.equal(beslissing.antwoord, vol.antwoord + (rest > 0 ? 1 : 0));
    if (rest > 0) metRest++; else zonderRest++;

    const lang = ritten.maak(2, index, Math.random);
    assert.equal(lang.stappen.length, 4, 'op niveau 1 en 2 blijft de rest zichtbaar');
  }
  // Allebei de gevallen moeten voorkomen, anders leert een kind 'altijd +1'.
  assert.ok(metRest > 0 && zonderRest > 0, `${metRest} met rest, ${zonderRest} zonder`);
});

test('topo answers, submitted results and retry sets survive reload independently per test', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
  try {
    const draft = { answers: { a: 'Utrecht', b: 'Amsterdam' }, submitted: true, retryIds: ['b'] };
    assert.equal(saveTestDraft(['a', 'b'], draft), true);
    assert.deepEqual(loadTestDraft(['b', 'a']), draft);
    saveTestDraft(['a', 'b'], { ...draft, orderIds: ['b', 'a'] });
    assert.deepEqual(loadTestDraft(['a', 'b']).orderIds, ['b', 'a']);
    assert.equal(loadTestDraft(['a', 'b']).answers.a, 'Utrecht');
    saveTestDraft(['a', 'b'], { ...draft, submitted: false, deferredIds: ['a', 'a', 'unknown'] });
    assert.deepEqual(loadTestDraft(['a', 'b']).deferredIds, ['a']);
    assert.equal(loadTestDraft(['a', 'b']).retryIds, null);
    assert.deepEqual(loadTestDraft(['a', 'b']).answers, draft.answers);
    const fullArea = Array.from({ length: 27 }, (_, index) => `plek-${index}`);
    saveTestDraft(fullArea, { answers: { 'plek-1': 'Lelystad' }, submitted: false, retryIds: fullArea.slice(0, 11) });
    const resumed = loadTestDraft(fullArea);
    assert.equal(resumed.retryIds, null);
    assert.equal(resumed.answers['plek-1'], 'Lelystad');
    assert.deepEqual(loadTestDraft(['c']), { answers: {}, submitted: false, retryIds: null });
    memory.set(testDraftKey(['a']), JSON.stringify({ answers: { a: 12, c: 'Onbekend' }, retryIds: ['a', 'c'] }));
    assert.deepEqual(loadTestDraft(['a']), { answers: {}, submitted: false, retryIds: null });
    memory.set(testDraftKey(['a']), 'broken');
    assert.deepEqual(loadTestDraft(['a']), { answers: {}, submitted: false, retryIds: null });
  } finally { if (original) Object.defineProperty(globalThis, 'localStorage', original); else Reflect.deleteProperty(globalThis, 'localStorage'); }
});

test('test numbering preserves all locations and changes even when a shuffle draws the same order', () => {
  const ids = ['a', 'b', 'c', 'd'];
  for (const random of [() => 0, () => .999, Math.random]) {
    const order = shuffledTestIds(ids, random);
    assert.deepEqual([...order].sort(), ids);
    assert.notDeepEqual(order, ids);
  }
  assert.deepEqual(ids, ['a', 'b', 'c', 'd']);
  assert.deepEqual(shuffledTestIds([]), []);
  assert.deepEqual(shuffledTestIds(['a']), ['a']);
});

test('one-place test entry advances to an unanswered place without losing saved answers', () => {
  const ids = ['a', 'b', 'c'];
  const answers = { a: 'Utrecht', b: 'Amsterdam' };
  assert.equal(nextUnansweredTestId(ids, 'a', answers), 'c');
  assert.equal(nextUnansweredTestId(ids, 'c', { c: 'Rotterdam' }), 'a');
  assert.equal(nextUnansweredTestId(ids, 'a', { ...answers, c: 'Rotterdam' }), 'b');
  assert.equal(nextUnansweredTestId(['a'], 'a', {}), 'a');
  assert.equal(nextUnansweredTestId([], 'a', {}), null);
  assert.deepEqual(answers, { a: 'Utrecht', b: 'Amsterdam' });
});

test('deferred places return after other unanswered places, including the last remaining place', () => {
  const ids = ['a', 'b', 'c'];
  assert.equal(nextUnansweredTestId(ids, 'a', {}, ['b']), 'c');
  assert.equal(nextUnansweredTestId(ids, 'c', { a: 'A', c: 'C' }, ['b']), 'b');
  assert.equal(nextUnansweredTestId(ids, 'b', { a: 'A', c: 'C' }, ['b']), 'b');
  assert.equal(nextUnansweredTestId(ids, 'a', {}, ids), 'b');
});

test('navigation remains pending until the active test explicitly allows leaving', () => {
  let calls = 0;
  let pending: (() => void) | undefined;
  const unregister = registerNavigationGuard(proceed => { pending = proceed; });
  assert.equal(hasNavigationGuard(), true);
  guardedNavigation(() => calls++);
  assert.equal(calls, 0);
  pending?.();
  assert.equal(calls, 1);
  unregister();
  assert.equal(hasNavigationGuard(), false);
  guardedNavigation(() => calls++);
  assert.equal(calls, 2);
});

test('room swipes change rooms only for deliberate horizontal gestures at an edge', () => {
  assert.equal(roomSwipeDirection(-100, 10, false, true), 1);
  assert.equal(roomSwipeDirection(100, 10, true, false), -1);
  assert.equal(roomSwipeDirection(-100, 10, true, false), null);
  assert.equal(roomSwipeDirection(100, 10, false, true), null);
  assert.equal(roomSwipeDirection(-40, 0, true, true), null);
  assert.equal(roomSwipeDirection(-100, 90, true, true), null);
});

test('cookie hints give the inverse calculation and coaches use distinct avatars', () => {
  const closed = renderToStaticMarkup(<MathHelp open={false} onToggle={() => undefined}>Doe 42 − 16</MathHelp>);
  assert.match(closed, /Tip van Baby Lua/);
  assert.match(closed, /aria-expanded="false"/);
  assert.ok(!closed.includes('Doe 42'));
  const opened = renderToStaticMarkup(<MathHelp open onToggle={() => undefined}>Doe 42 − 16</MathHelp>);
  assert.match(opened, /Tip sluiten/);
  assert.match(opened, /Doe 42 − 16/);
  const question = generateQuestion('missing', 1);
  question.left = { op: '+', left: { blank: true }, right: { value: 16 } };
  question.right = { value: 42 };
  assert.match(techniqueHint(question), /42 − 16/);
  question.left = { op: '-', left: { blank: true }, right: { value: 16 } };
  assert.match(techniqueHint(question), /42 \+ 16/);
  const lua = renderToStaticMarkup(<TipCoach coach="lua">Reken terug</TipCoach>);
  const seb = renderToStaticMarkup(<TipCoach coach="seb">Kijk op de kaart</TipCoach>);
  assert.match(lua, /Baby Lua/); assert.match(lua, /luiaard.webp/);
  assert.match(seb, /Seb/); assert.match(seb, /avatars\/lua.webp/);
});

test('memory boards retain every pair, keep partners together and only advance after a full board', () => {
  for (const count of [3, 4, 6, 8]) for (const size of [2, 3, 4, 6]) {
    const ids = Array.from({ length: count }, (_, index) => `pair-${index}`);
    const visited: string[] = [];
    for (let matched = 0; matched < count; matched += size) {
      const board = memoryBoardIds(ids, matched, size);
      assert.ok(board.length <= size);
      visited.push(...board);
      for (let partial = 0; partial < board.length; partial++) assert.deepEqual(memoryBoardIds(ids, matched + partial, size), board);
    }
    assert.deepEqual(visited, ids);
    assert.deepEqual(memoryBoardIds(ids, Math.ceil(count / size) * size, size), []);
  }
});

test('old sloth avatar selections migrate to Lua without writing or resetting the profile', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { localStorage: { getItem: (key: string) => key === PROFILE_AVATAR_KEY ? 'luiaard' : null } } });
  try { assert.equal(loadProfileAvatar(), 'lua'); }
  finally { if (original) Object.defineProperty(globalThis, 'window', original); else Reflect.deleteProperty(globalThis, 'window'); }
});
