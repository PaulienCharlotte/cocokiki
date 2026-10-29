import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createStoryDeck } from '../games/math/storyProblems';
import StoryChallenge from '../games/math/StoryChallenge';
import { storySteps } from '../games/math/storySteps';
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

test('story problems require several steps, whole answers and a matching narrative', () => {
  const steps = (value: Expression): number => 'op' in value ? 1 + steps(value.left) + steps(value.right) : 0;
  for (const level of MATH_LEVELS) for (const random of [() => 0, () => .999, Math.random]) {
    const deck = createStoryDeck(level, random);
    assert.equal(deck.length, 10);
    assert.equal(new Set(deck.map(question => question.id)).size, 10);
    assert.equal(new Set(deck.map(question => question.prompt)).size, 10);
    for (const question of deck) {
      assert.ok(steps(question.left) >= 2);
      assert.ok(Number.isSafeInteger(question.answer) && question.answer > 0);
      assert.equal(evaluate(question.left), question.answer);
      assert.equal(question.options.filter(value => validAnswer(question, value)).length, 1);
      assert.equal(question.options.length, 4);
      assert.ok(question.prompt.includes('Hoeveel'));
      const hidden = renderToStaticMarkup(<StoryChallenge question={question} locked={false} onAnswer={() => undefined} />);
      assert.ok(!hidden.includes('story-explanation'));
      assert.ok(hidden.includes('type="number"'));
      assert.ok(!hidden.includes('answer-choices'));
      assert.ok(!hidden.includes(mathAssets.strawberry));
      assert.ok(!hidden.includes(mathAssets.squirrel));
      const plan = storySteps(question.left);
      assert.ok(plan.length >= 2 && plan.length <= steps(question.left));
      assert.equal(plan.at(-1)?.answer, question.answer);
      assert.ok(plan.every(step => Number.isSafeInteger(step.answer)));
      const solved = renderToStaticMarkup(<StoryChallenge question={question} locked onAnswer={() => undefined} />);
      assert.ok(solved.includes('story-explanation'));
      assert.ok(solved.includes(`${question.answer} ${question.unit}.`));
    }
    if (level === 3) assert.ok(deck.some(question => question.prompt.includes('kwart')));
    if (level === 4) assert.ok(deck.every(question => question.prompt.includes('%')));
  }
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
  assert.match(closed, /Vraag Baby Lua om een tip/);
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
