import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createStoryDeck } from '../games/math/storyProblems';
import StoryChallenge from '../games/math/StoryChallenge';
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
      const solved = renderToStaticMarkup(<StoryChallenge question={question} locked onAnswer={() => undefined} />);
      assert.ok(solved.includes('story-explanation'));
      assert.ok(solved.includes(`${question.answer} ${question.unit}.`));
    }
    if (level === 3) assert.ok(deck.some(question => question.prompt.includes('kwart')));
    if (level === 4) assert.ok(deck.every(question => question.prompt.includes('%')));
  }
});

test('memory boards retain every pair, keep partners together and only advance after a full board', () => {
  for (const count of [3, 4, 6, 8]) for (const size of [2, 3]) {
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
