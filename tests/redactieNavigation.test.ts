import assert from 'node:assert/strict';
import test from 'node:test';
import { afgerondeRedactieronde, noteerRedactieAntwoord, type RedactieAntwoorden } from '../games/math/redactie/navigatie';

test('doorbladeren of alleen de laatste redactiesom maken rondt de ronde niet af', () => {
  assert.equal(afgerondeRedactieronde({}, 10, 'round'), null);
  assert.equal(afgerondeRedactieronde({ 9: true }, 10, 'round'), null);
  assert.equal(afgerondeRedactieronde({ 0: true, 10: true }, 2, 'round'), null);
});

test('redactiesommen mogen door elkaar, met eenmalige beoordeling per som', () => {
  let antwoorden: RedactieAntwoorden = {};
  for (const index of [9, 0, 6, 3, 1, 7, 5, 2, 8, 4]) antwoorden = noteerRedactieAntwoord(antwoorden, index, index !== 3);
  assert.equal(noteerRedactieAntwoord(antwoorden, 3, true), antwoorden);
  assert.equal(noteerRedactieAntwoord(antwoorden, -1, true), antwoorden);
  assert.deepEqual(afgerondeRedactieronde(antwoorden, 10, 'round'), { correct: 9, total: 10, score: 9, mistakes: 1, solved: 9, roundId: 'round' });
});
