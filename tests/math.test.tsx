import assert from 'node:assert/strict';
import { checkoutGroceries } from '../games/math/checkoutCatalog';
import { checkoutOrderSeconds, checkoutTravel } from '../games/math/checkoutTiming';
import { createCheckoutQuestion } from '../games/math/checkoutQuestions';
import CheckoutConveyor from '../games/math/CheckoutConveyor';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MATH_GAME_IDS, MATH_LEVELS, type Expression, type MathResult } from '../games/math/types';
import { answerChoices, balanceAngle, createQuestionDeck, distributionCorrect, evaluate, expressionText, generateQuestion, resultStatus, validAnswer } from '../games/math/engine';
import { emptyMathProgress, finishMathLevel, levelUnlocked, loadMathProgress, migrateMathProgress, MATH_PROGRESS_KEY, nextMathLevel } from '../games/math/progress';
import { MATH_GAMES, mathIcon, RACE_TARGETS } from '../games/math/config';
import { loadCurrency } from '../services/currency';
import { commitLocalState, readDocument } from '../services/localState';
import { resolveRoute } from '../platform/routes';
import MathHub from '../games/math/MathHub';
import { MathHeader } from '../games/math/MathControls';
import DistributionChallenge from '../games/math/DistributionChallenge';
import PuzzleChallenge from '../games/math/PuzzleChallenge';
import { CookieScene, HoneyJars, Quantity, WinterScene, quantityGroups } from '../games/math/AdventureScenes';
import { mathAssets, mathEnvironments, missingMathAssets } from '../games/math/assets';
import { raceCoinsAvailable } from '../games/math/progress';
import { RACE_DAILY_COIN_CAP } from '../games/math/config';
import { LUA_LEVEL_TABLES, luaMathResult, luaTableForLevel } from '../games/math/luaBridge';
import { createQuestion as createLuaQuestion } from '../games/red-baby-lua/game/systems/questions';
import RaceGame, { CheckoutOrder } from '../games/math/RaceGame';
import { checkoutProducts } from '../games/math/checkoutCatalog';
import ChallengesScreen from '../pages/ChallengesScreen';

function randomSeed(seed = 93) { return () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646; }
function storage(run: (memory: Map<string, string>) => void) {
  const original = globalThis.localStorage, memory = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: (key: string) => memory.get(key) ?? null, setItem: (key: string, value: string) => memory.set(key, value) } });
  try { run(memory); } finally { Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: original }); }
}
const perfect: MathResult = { correct: 10, total: 10, score: 10, mistakes: 0 };
const countBlank = (expression: Expression): number => 'blank' in expression ? 1 : 'value' in expression ? 0 : countBlank(expression.left) + countBlank(expression.right);

test('checkout keeps unit prices with one product and never depicts money or people as fruit', () => {
  for (const level of MATH_LEVELS) for (let i = 0; i < 50; i++) {
    const question = generateQuestion('race', level, i, randomSeed(i + 1));
    const html = renderToStaticMarkup(<CheckoutOrder question={question} />);
    const images = (html.match(/<img /g) ?? []).length;
    assert.equal(images, question.operation === '+' ? 2 : 1);
    if (question.operation === '*') {
      const product = question.checkout!.products[0];
      assert.ok(html.includes(`€${question.b} per ${product.unit[0]}`));
      assert.ok(html.includes(`${question.a} ${product.unit[question.a === 1 ? 0 : 1]}`));
    }
    if (question.operation === '/') assert.ok(html.includes('aria-label="Klanten"') && html.includes(`€${question.a} samen`));
    if (question.operation === '-') assert.ok(html.includes('betaald') && html.includes('prijs'));
  }
});

test('checkout prices follow the actual depicted teaching product and package', () => {
  for (const product of checkoutProducts) {
    assert.ok(existsSync(`public${new URL(product.image, 'http://localhost').pathname}`), product.image);
    assert.ok(Number.isSafeInteger(product.price) && product.price > 0);
    if (product.id === 'apple' || product.id === 'banana') assert.equal(product.price, 1);
    if (product.id.includes('sofa') || product.id === 'cream-two-seater') assert.ok(product.price >= 500);
    if (product.id === 'strawberry' || product.id === 'blueberry') assert.ok(product.name.includes('Bakje'));
  }
  for (const level of MATH_LEVELS) {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const question = generateQuestion('race', level, i, randomSeed(i + level));
      const details = question.checkout!;
      const [product, second] = details.products;
      seen.add(product.category);
      assert.ok(details.quantity > 0 && Number.isSafeInteger(details.quantity));
      if (question.operation === '+') { assert.equal(question.a, product.price); assert.equal(question.b, second.price); }
      if (question.operation === '-') { assert.equal(question.b, product.price); assert.ok(question.a >= product.price); }
      if (question.operation === '*') { assert.equal(question.b, product.price); assert.equal(question.a, details.quantity); }
      if (question.operation === '/') { assert.equal(question.a, product.price * details.quantity); assert.equal(question.a % question.b, 0); }
      assert.equal(validAnswer(question, question.answer), true);
      const html = renderToStaticMarkup(<CheckoutOrder question={question} />);
      assert.ok(html.includes(product.name.replaceAll('&', '&amp;')));
    }
    assert.ok(seen.has('food'));
    assert.equal(seen.has('furniture'), level >= 4);
  }
});

test('honey answers cannot be copied from either visible operand', () => {
  const leaves = (expression: Expression): number[] => 'value' in expression ? [expression.value] : 'op' in expression ? [...leaves(expression.left), ...leaves(expression.right)] : [];
  for (const level of MATH_LEVELS) for (const random of [randomSeed(level), () => 0, () => .99999]) {
    for (let i = 0; i < 200; i++) {
      const question = generateQuestion('balance', level, i, random);
      assert.ok(!leaves(question.left).includes(question.answer), question.id);
      assert.ok('op' in question.right);
      const known = leaves(question.right)[0];
      assert.ok(!leaves(question.left).includes(known), question.id);
      assert.equal(validAnswer(question, question.answer), true);
    }
  }
});

test('winter and cookie art uses small rewards instead of weighted count badges', () => {
  for (const success of [false, true]) {
    const winter = renderToStaticMarkup(<WinterScene question={generateQuestion('add-subtract', 5)} success={success} completed={2} />);
    const cookies = renderToStaticMarkup(<CookieScene question={generateQuestion('missing', 5)} success={success} />);
    assert.ok(!winter.includes('×') && !cookies.includes('×'));
    assert.ok(winter.includes('wintervoorraad') || winter.includes('Voorraad aangevuld'));
    assert.ok(!cookies.includes('koekjes nodig'));
  }
});

test('math routes and six supplied icons are integrated without replacing clock or Lua', () => {
  assert.equal(resolveRoute('/school/math').route.page, 'math');
  assert.equal(resolveRoute('/school/clock').route.page, 'clock');
  assert.equal(resolveRoute('/games/red-baby-lua').route.page, 'game');
  assert.equal(MATH_GAMES.length, 6);
  for (const game of MATH_GAMES) assert.ok(existsSync(`public${mathIcon(game.id)}`));
  const hub = renderToStaticMarkup(<MathHub progress={emptyMathProgress()} onPlay={() => undefined} />);
  for (const game of MATH_GAMES.filter(game => game.id !== 'multiply' && game.id !== 'divide')) { assert.ok(hub.includes(game.title.replace('&', '&amp;'))); assert.ok(hub.includes(mathIcon(game.id))); }
  assert.ok(!hub.includes('Red Baby Lua'));
  assert.equal((hub.match(/0\/5 niveaus/g) ?? []).length, 4);
  assert.match(renderToStaticMarkup(<ChallengesScreen onNavigate={() => undefined} />), /Rekenen openen/);
});

test('het rekenmenu gebruikt het gedeelde keuzeraster, niet eigen kaarten', () => {
  const hub = renderToStaticMarkup(<MathHub progress={emptyMathProgress()} onPlay={() => undefined} />);
  assert.ok(hub.includes('ck-kaarten'), 'het raster komt uit components/ui/CardGrid');
  assert.ok(!hub.includes('math-mode'), 'de oude eigen kaarten zijn weg');
});

test('all thirty math difficulties generate valid whole-number equations with one answer', () => {
  const random = randomSeed();
  for (const game of MATH_GAME_IDS) for (const level of MATH_LEVELS) for (let index = 0; index < 220; index++) {
    const q = generateQuestion(game, level, index, random);
    assert.ok(Number.isSafeInteger(q.answer) && q.answer >= 0, `${game}:${level}:${q.id}`);
    assert.equal(countBlank(q.left) + countBlank(q.right), 1);
    assert.equal(validAnswer(q, q.answer), true, q.id);
    assert.equal(new Set(q.options).size, 4);
    assert.equal(q.options.filter(option => validAnswer(q, option)).length, 1);
    assert.ok(q.options.every(option => Number.isSafeInteger(option) && option >= 0));
    assert.ok(Number.isFinite(evaluate(q.left, q.answer)));
    assert.equal(validAnswer(q, q.answer + .5), false);
    assert.equal(validAnswer(q, -1), false);
  }
});

test('multiplication follows the specified table groups and unique sessions', () => {
  const allowed = [[1, 2, 5, 10], [3, 4], [6, 7], [8, 9, 11, 12], Array.from({ length: 12 }, (_, i) => i + 1)];
  for (const level of MATH_LEVELS) {
    const deck = createQuestionDeck('multiply', level, 10, randomSeed(level));
    assert.equal(new Set(deck.map(q => q.id)).size, 10);
    assert.ok(deck.every(q => allowed[level - 1].includes(q.a) && q.b >= 1 && q.b <= (level >= 4 ? 12 : 10)));
  }
});

test('division remains integral, starts small and keeps every fruit individually manageable', () => {
  for (const level of MATH_LEVELS) {
    const deck = createQuestionDeck('divide', level, 10, randomSeed(level * 10));
    for (const [index, q] of deck.entries()) {
      assert.equal(q.a % q.b, 0);
      if (level === 1) assert.ok(q.a <= 10 && q.b === 2);
      if (level === 2) assert.ok(q.a <= 20 && q.b >= 2 && q.b <= 5);
      if (level === 3) assert.ok([2, 5, 10].includes(q.b));
      if (index % 2 === 0 || level <= 2) assert.ok(q.a <= 24);
      else assert.ok(q.a <= (level === 5 ? 144 : 100));
      assert.equal(distributionCorrect(Array(q.b).fill(q.answer), q.a), true);
    }
    assert.ok(deck.every(q => q.kind === 'distribution'));
    if (level === 1) {
      assert.equal(new Set(deck.slice(0, 5).map(q => q.a)).size, 5);
      assert.equal(new Set(deck.slice(5).map(q => q.a)).size, 5);
      assert.notEqual(deck[4].a, deck[5].a);
    }
  }
  assert.equal(distributionCorrect([3, 5, 4], 12), false);
  assert.equal(distributionCorrect([4, 4, 3], 12), false);
  assert.equal(distributionCorrect([], 0), false);
});

test('addition and subtraction respect bounds and level four crosses place boundaries', () => {
  const random = randomSeed();
  for (const level of MATH_LEVELS) for (let index = 0; index < 400; index++) {
    const q = generateQuestion('add-subtract', level, index, random);
    const max = [10, 20, 100, 1000, 1000][level - 1];
    assert.ok(q.total >= 0 && q.total <= max && q.a <= max);
    if (level === 1) assert.equal(q.operation, '+');
    if (level === 4) assert.notEqual(Math.floor(q.a / 10), Math.floor(q.total / 10));
  }
});

test('missing-number puzzles use each requested operation and uniquely invert it', () => {
  for (const level of MATH_LEVELS) {
    const deck = createQuestionDeck('missing', level, 10, randomSeed(level));
    if (level < 5) assert.ok(deck.every(q => q.operation === ['+', '-', '*', '/'][level - 1]));
    for (const q of deck) {
      const answers = Array.from({ length: 200 }, (_, value) => value).filter(value => validAnswer(q, value));
      assert.deepEqual(answers, [q.answer]);
      assert.ok(q.hint.length > 10);
    }
  }
  const q = generateQuestion('missing', 4, 0, randomSeed());
  assert.equal(validAnswer(q, 0), false);
});

test('honey equations require reasoning and multi-operation equations are evaluated correctly', () => {
  assert.ok(balanceAngle(9, 3) < 0);
  assert.ok(balanceAngle(3, 9) > 0);
  assert.equal(balanceAngle(6, 6), 0);
  assert.equal(balanceAngle(1000, 1), -12);
  for (const q of createQuestionDeck('balance', 5, 10, randomSeed())) {
    assert.equal(evaluate(q.left), evaluate(q.right, q.answer));
    assert.ok(expressionText(q.left).includes('×'));
    assert.ok(expressionText(q.right).includes('+'));
  }
  for (const level of MATH_LEVELS) for (const q of createQuestionDeck('balance', level, 10, randomSeed(level))) {
    assert.ok('op' in q.left && 'op' in q.right);
    assert.ok(q.answer > 0);
    assert.notEqual(evaluate(q.left), evaluate(q.right, 0));
    assert.equal(validAnswer(q, q.answer), true);
    assert.equal(q.options.filter(value => validAnswer(q, value)).length, 1);
    assert.match(renderToStaticMarkup(<HoneyJars question={q} placed={q.answer} />), /evenveel/);
  }
});

test('deck generation is varied, bounded and recovers even from a constant random source', () => {
  for (const game of MATH_GAME_IDS) for (const level of MATH_LEVELS) {
    const deck = createQuestionDeck(game, level, 10, () => 0);
    assert.equal(deck.length, 10);
    assert.equal(new Set(deck.map(q => q.id)).size, 10);
  }
  assert.notDeepEqual(createQuestionDeck('multiply', 2, 10, randomSeed(8)), createQuestionDeck('multiply', 2, 10, randomSeed(9)));
  assert.equal(new Set(answerChoices(0, [0, -1, 0], () => .5)).size, 4);
});

test('eight first attempts unlock a level and perfect scores have separate eligibility', () => {
  assert.equal(resultStatus('multiply', 1, { correct: 7, total: 10, score: 7, mistakes: 3 }).passed, false);
  assert.equal(resultStatus('multiply', 1, { correct: 8, total: 10, score: 8, mistakes: 2 }).passed, true);
  assert.equal(resultStatus('multiply', 1, perfect).perfect, true);
  assert.equal(resultStatus('multiply', 1, { ...perfect, total: 9 }).valid, false);
  assert.equal(resultStatus('multiply', 1, { ...perfect, score: NaN }).valid, false);
  for (const level of MATH_LEVELS) {
    assert.equal(resultStatus('race', level, { correct: 6, total: 6, score: RACE_TARGETS[level - 1], mistakes: 0 }).passed, true);
    assert.equal(resultStatus('race', level, { correct: 5, total: 5, score: RACE_TARGETS[level - 1] - 1, mistakes: 0 }).passed, false);
  }
});

test('math rewards solved answers, repeats and prevents duplicate settlement', () => storage(() => {
  const empty = loadMathProgress();
  assert.equal(levelUnlocked(empty, 'multiply', 1), true);
  assert.equal(levelUnlocked(empty, 'multiply', 2), false);
  assert.equal(finishMathLevel('multiply', 2, perfect).ok, false);
  assert.equal(loadCurrency(), 0);
  const first = finishMathLevel('multiply', 1, { correct: 8, total: 10, score: 8, mistakes: 2 });
  assert.equal(first.reward, 16);
  assert.equal(loadCurrency(), 16);
  assert.equal(levelUnlocked(loadMathProgress(), 'multiply', 2), true);
  assert.equal(nextMathLevel(loadMathProgress(), 'multiply'), 2);
  assert.equal(finishMathLevel('multiply', 1, perfect).reward, 20);
  assert.equal(finishMathLevel('multiply', 1, perfect).reward, 0);
  for (const level of [2, 3, 4, 5] as const) assert.equal(finishMathLevel('multiply', level, perfect).reward, 20);
  assert.equal(loadCurrency(), 116);
  assert.equal(finishMathLevel('multiply', 5, perfect).reward, 0);
  assert.equal(finishMathLevel('multiply', 1, { correct: 2, total: 10, score: 2, mistakes: 8 }).reward, 4);
  assert.equal(loadCurrency(), 120);
  assert.deepEqual(loadMathProgress().games.multiply.completed, [1, 2, 3, 4, 5]);
  assert.deepEqual(loadMathProgress().games.divide.completed, []);
  assert.equal(loadMathProgress().games.multiply.best[1]?.correct, 10);
}));

test('failed math writes cannot pay coins or unlock levels, then safely retry', () => storage(memory => {
  commitLocalState({}, [{ id: 'existing', amount: 20 }]);
  const actual = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: actual.getItem, setItem: () => { throw Error('full'); } } });
  assert.equal(finishMathLevel('balance', 1, perfect).ok, false);
  assert.equal(loadCurrency(), 20);
  assert.deepEqual(loadMathProgress().games.balance.completed, []);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: actual });
  assert.equal(finishMathLevel('balance', 1, perfect).reward, 20);
  assert.equal(loadCurrency(), 40);
  assert.equal(JSON.parse(readDocument(MATH_PROGRESS_KEY)!).games.balance.completed[0], 1);
  assert.ok(memory.size > 0);
}));

test('math migration filters corrupt progress and replay never removes completed work', () => {
  assert.deepEqual(migrateMathProgress(null), emptyMathProgress());
  const state = emptyMathProgress();
  state.games.multiply.completed = [1, 1, 6] as never;
  state.games.multiply.best[1] = perfect;
  state.games.multiply.best[2] = { ...perfect, correct: -1 };
  const migrated = migrateMathProgress(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(migrated.games.multiply.completed, [1]);
  assert.deepEqual(migrated.games.multiply.best[1], perfect);
  assert.equal(migrated.games.multiply.best[2], undefined);
});

test('interactive math views expose real controls for mouse, touch and keyboard', () => {
  const distribution = renderToStaticMarkup(<DistributionChallenge question={generateQuestion('divide', 1)} locked={false} onAnswer={() => undefined} />);
  assert.match(distribution, /aardbei 1/);
  assert.match(distribution, /Mandje 1/);
  assert.doesNotMatch(distribution, /Controleer/);
  const puzzle = renderToStaticMarkup(<PuzzleChallenge question={generateQuestion('missing', 3)} locked={false} onAnswer={() => undefined} />);
  assert.match(puzzle, /Koekjesbestelling/);
  assert.match(puzzle, /Aantal (koekjes|dozen)/);
  assert.match(puzzle, /Bak deze bestelling/);
  assert.doesNotMatch(puzzle, /Bakplaat|cookie-oven|cookie-chef/);
  assert.doesNotMatch(puzzle, /Plaats getal/);
  const header = renderToStaticMarkup(<MathHeader game="multiply" level={1} progress={emptyMathProgress()} onBack={() => undefined} onLevel={() => undefined} />);
  assert.match(header, /alt="CocoKiki"/);
  assert.match(header, /aria-label="Naar de wereld"/);
  const hubHeader = renderToStaticMarkup(<MathHeader game={null} level={1} progress={emptyMathProgress()} onBack={() => undefined} onLevel={() => undefined} />);
  assert.match(hubHeader, /alt="CocoKiki"/);
  assert.equal((header.match(/disabled=""/g) ?? []).length, 4);
  const race = renderToStaticMarkup(<RaceGame level={1} onFinish={() => undefined} />);
  assert.match(race, /Open de winkel/);
  assert.match(race, /60/);
  const drag = readFileSync('games/math/DragChoice.tsx', 'utf8');
  assert.match(drag, /setPointerCapture/);
  assert.match(drag, /onPointerCancel/);
  assert.match(drag, /onClick/);
});

test('race uses shared coins without a game-specific daily cap and preserves old progress', () => storage(() => {
  const day = new Date(2026, 9, 25, 12), tomorrow = new Date(2026, 9, 26, 12);
  const run = (score: number, raceId: string): MathResult => ({ score, correct: score, total: score, mistakes: 0, raceId });
  finishMathLevel('multiply', 1, perfect);
  const before = loadCurrency();
  assert.equal(finishMathLevel('race', 1, run(23, 'run-one'), day).reward, 46);
  assert.equal(finishMathLevel('race', 1, run(23, 'run-one'), day).reward, 0);
  assert.equal(finishMathLevel('race', 1, run(24, 'run-one'), day).ok, false);
  assert.equal(finishMathLevel('race', 2, run(100, 'run-two'), day).reward, 200);
  assert.equal(finishMathLevel('race', 3, run(150, 'run-three'), day).reward, 300);
  assert.equal(loadMathProgress().games.race.best[3]?.score, 150);
  assert.equal(loadCurrency(), before + 546);
  assert.equal(raceCoinsAvailable(day), 0);
  assert.equal(raceCoinsAvailable(tomorrow), RACE_DAILY_COIN_CAP);
  assert.equal(finishMathLevel('race', 1, run(23, 'run-one'), tomorrow).reward, 0);
  assert.equal(finishMathLevel('race', 1, run(12, 'run-four'), tomorrow).reward, 24);
  assert.deepEqual(loadMathProgress().games.multiply.completed, [1]);
  assert.equal(loadMathProgress().games.multiply.best[1]?.score, 10);
  assert.equal(finishMathLevel('race', 1, { ...run(2, 'invalid-bonus'), score: 3 }, tomorrow).ok, false);
  assert.equal(finishMathLevel('race', 1, { correct: 1, total: 1, score: 1, mistakes: 0 }, tomorrow).ok, false);
}));

test('race settlement retries atomically after storage failure, including zero scores', () => storage(() => {
  const actual = globalThis.localStorage, result: MathResult = { correct: 18, total: 20, score: 18, mistakes: 2, raceId: 'retry-race' };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: actual.getItem, setItem: () => { throw Error('full'); } } });
  assert.equal(finishMathLevel('race', 1, result).ok, false);
  assert.equal(loadCurrency(), 0);
  assert.deepEqual(loadMathProgress().games.race.completed, []);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: actual });
  assert.equal(finishMathLevel('race', 1, result).reward, 36);
  assert.equal(finishMathLevel('race', 1, result).reward, 0);
  assert.equal(finishMathLevel('race', 1, { correct: 0, total: 0, score: 0, mistakes: 0, raceId: 'zero-race' }).ok, true);
  assert.equal(loadCurrency(), 36);
}));

test('old race combo scores survive migration without retroactive payment or lost unlocks', () => {
  const old = emptyMathProgress(); old.games.race.completed = [1, 2];
  old.games.race.best[2] = { correct: 12, total: 12, score: 16, mistakes: 0 };
  assert.deepEqual(migrateMathProgress(old), old);
});

test('asset map resolves real local files and grouped quantities remain exact and bounded', () => {
  for (const path of [...Object.values(mathAssets), ...Object.values(mathEnvironments)]) assert.ok(existsSync(`public${path}`), path);
  for (let amount = 0; amount <= 1000; amount++) {
    const groups = quantityGroups(amount);
    assert.equal(groups.reduce((sum, value) => sum + value, 0), amount);
    assert.ok(groups.length <= 20);
  }
});

test('large berry harvests preserve higher table ranges without creating a wall of tiny input targets', () => {
  const q = generateQuestion('divide', 5, 1, () => .99);
  assert.equal(q.a, 144); assert.equal(q.groups, 12); assert.equal(q.answer, 12);
  const view = renderToStaticMarkup(<DistributionChallenge question={q} locked={false} onAnswer={() => undefined} />);
  assert.equal((view.match(/aria-label="blauwe bes \d+, in de oogst"/g) ?? []).length, 18);
  assert.match(view, /144 bessen in de oogst/);
  assert.match(view, /Mandje 12/);
});

test('all seven supplied illustrations replace the temporary math objects', () => {
  assert.deepEqual(missingMathAssets, []);
  for (const key of ['squirrel', 'acorn', 'treeHollow', 'bird', 'bee', 'honeyJar', 'cookie'] as const) {
    const afbeelding = readFileSync(`public${mathAssets[key]}`);
    assert.equal(afbeelding.subarray(8, 12).toString(), 'WEBP', key);
    assert.ok(afbeelding.subarray(0, 200).includes('ALPH'), `${key} must keep real alpha`);
  }
  const q = generateQuestion('add-subtract', 2, 0, () => .9);
  const winter = renderToStaticMarkup(<WinterScene question={q} success={false} completed={2} />);
  for (const key of ['treeHollow', 'squirrel', 'bird', 'acorn'] as const) assert.ok(winter.includes(mathAssets[key]));
  assert.doesNotMatch(winter, /<svg/);
  const cookies = renderToStaticMarkup(<Quantity amount={30} />);
  assert.ok(cookies.includes(mathAssets.cookie));
  const honey = renderToStaticMarkup(<HoneyJars question={generateQuestion('balance', 1)} />);
  assert.ok(honey.includes(mathAssets.honeyJar)); assert.ok(honey.includes(mathAssets.bee));
  assert.match(honey, /honey-meter__fill/);
});

test('automatic transitions and a truly continuous unlimited checkout have no next or check buttons', () => {
  const session = readFileSync('games/math/MathSession.tsx', 'utf8');
  const race = readFileSync('games/math/RaceGame.tsx', 'utf8');
  assert.match(session, /QUESTION_TRANSITION_MS/);
  assert.doesNotMatch(session, /Volgende opdracht|Bekijk resultaat/);
  assert.doesNotMatch(race, /createQuestionDeck|% deck.length|Pauzeren|Volgende som|Controleer/);
  assert.match(race, /statistics.current.score\+\+/);
});

test('Lua reuses its existing question engine for all five math levels without ambiguous factors', () => {
  for (const level of MATH_LEVELS) {
    const found = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const table = luaTableForLevel(level, () => i / 100); found.add(table);
      const q = createLuaQuestion(table, '', () => 0, 3, 'factor');
      assert.equal(new Set(q.choiceLabels).size, 3);
      const products = q.choiceLabels.map(label => label.split('×').map(Number).reduce((a, b) => a * b));
      assert.equal(products.filter(value => value === q.left * q.right).length, 1);
      assert.equal(products[q.answer], q.left * q.right);
    }
    assert.deepEqual([...found], [...LUA_LEVEL_TABLES[level - 1]]);
  }
  assert.deepEqual(luaMathResult({ firstTry: 8, eventual: 10, missed: 0, streak: 3, bestStreak: 5, score: 50 }), { correct: 8, total: 10, score: 8, mistakes: 2, solved: 10 });
});

test('conveyor questions use varied supermarket groceries and valid arithmetic at all levels', () => {
  assert.ok(checkoutGroceries.length > 30);
  assert.equal(new Set(checkoutGroceries.map(product => product.id)).size, checkoutGroceries.length);
  for (const product of checkoutGroceries) {
    assert.equal(product.category, 'food');
    assert.ok(Number.isSafeInteger(product.price) && product.price > 0);
    assert.ok(existsSync(`public${product.image.split('?')[0]}`));
  }
  for (const level of MATH_LEVELS) for (let index = 0; index < 100; index++) {
    const question = generateQuestion('race', level, index, Math.random, checkoutGroceries);
    assert.equal(validAnswer(question, question.answer), true);
    assert.ok(question.checkout?.products.every(product => checkoutGroceries.some(item => item.id === product.id)));
    assert.ok(question.checkout?.products.every(product => product.category === 'food'));
  }
});

test('checkout travel is bounded and each level gives a predictable customer deadline', () => {
  assert.equal(checkoutOrderSeconds(1), 16);
  assert.equal(checkoutOrderSeconds(5), 10);
  assert.equal(checkoutTravel(0, 16000, 16000), 0);
  assert.equal(checkoutTravel(8000, 16000, 16000), .5);
  assert.equal(checkoutTravel(16000, 16000, 16000), 1);
  assert.equal(checkoutTravel(20000, 16000, 16000), 1);
  assert.equal(checkoutTravel(-100, 16000, 16000), 0);
});

test('checkout levels alternate at least five task forms with consistent equations and choices', () => {
  for (const level of MATH_LEVELS) {
    const forms = new Set<string>();
    for (let index = 0; index < 200; index++) {
      const question = createCheckoutQuestion(level, index);
      forms.add(question.id.split(':')[1]);
      assert.equal(validAnswer(question, question.answer), true, question.id);
      assert.equal(evaluate(question.left, question.answer), evaluate(question.right, question.answer));
      assert.ok(Number.isSafeInteger(question.answer) && question.answer >= 0);
      assert.equal(question.options.length, 4);
      assert.equal(new Set(question.options).size, 4);
      assert.equal(question.options.filter(answer => validAnswer(question, answer)).length, 1);
      assert.ok(question.checkout?.products.every(product => product.category === 'food'));
      const html = renderToStaticMarkup(<CheckoutConveyor question={question} progress={.5} running={true} falling={false} />);
      assert.doesNotMatch(html, /€|<span/);
      if (level === 1) assert.ok(evaluate(question.left, question.answer) <= 20);
    }
    assert.ok(forms.size >= 5);
  }
  const missing = createCheckoutQuestion(1, 4, () => .5);
  assert.equal(missing.kind, 'puzzle');
  assert.match(missing.prompt, /Hoeveel moeten erbij/);
  assert.match(missing.hint, /Haal/);
  const combined = createCheckoutQuestion(5, 0, () => .5);
  assert.match(combined.prompt, /bezorgkosten/);
  assert.match(combined.hint, /eerst.*daarna/);
});
