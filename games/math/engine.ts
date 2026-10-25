import { RACE_TARGETS } from './config';
import { checkoutProducts, type CheckoutDetails } from './checkoutCatalog';
import type { Expression, MathGameId, MathLevel, MathQuestion, MathResult, Operation } from './types';

type Random = () => number;
const number = (value: number): Expression => ({ value });
const blank: Expression = { blank: true };
const binary = (op: Operation, a: Expression, b: Expression): Expression => ({ op, left: a, right: b });
const pick = <T,>(items: readonly T[], random: Random): T => items[Math.min(items.length - 1, Math.floor(random() * items.length))];
const integer = (min: number, max: number, random: Random) => min + Math.min(max - min, Math.floor(random() * (max - min + 1)));
export function shuffled<T>(items: T[], random: Random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = integer(0, i, random); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function evaluate(expression: Expression, answer = 0): number {
  if ('value' in expression) return expression.value;
  if ('blank' in expression) return answer;
  const left = evaluate(expression.left, answer), right = evaluate(expression.right, answer);
  return expression.op === '+' ? left + right : expression.op === '-' ? left - right : expression.op === '*' ? left * right : right === 0 ? NaN : left / right;
}
export const operationSymbol = (op: Operation) => ({ '+': '+', '-': '−', '*': '×', '/': '÷' })[op];
export function expressionText(expression: Expression, answer?: number, nested = false): string {
  if ('value' in expression) return String(expression.value);
  if ('blank' in expression) return answer === undefined ? '?' : String(answer);
  const text = `${expressionText(expression.left, answer, true)} ${operationSymbol(expression.op)} ${expressionText(expression.right, answer, true)}`;
  return nested ? `(${text})` : text;
}
export function validAnswer(question: MathQuestion, answer: number): boolean {
  return Number.isSafeInteger(answer) && answer >= 0 && evaluate(question.left, answer) === evaluate(question.right, answer);
}
export function answerChoices(answer: number, suggestions: number[], random: Random = Math.random): number[] {
  const choices = new Set([answer]);
  for (const value of [...suggestions, answer + 1, answer - 1, answer + 2, answer + 10, answer + 3]) {
    if (Number.isSafeInteger(value) && value >= 0) choices.add(value);
    if (choices.size === 4) break;
  }
  return shuffled([...choices], random);
}

function arithmetic(level: MathLevel, random: Random): { op: Operation; a: number; b: number } {
  const max = [10, 20, 100, 1_000, 1_000][level - 1];
  const op: Operation = level === 1 || random() < .5 ? '+' : '-';
  if (level === 4) {
    const boundary = pick([10, 20, 30, 50, 100, 200, 500, 900], random);
    const distance = integer(1, 8, random), extra = integer(1, 9, random);
    return op === '+' ? { op, a: boundary - distance, b: distance + extra } : { op, a: boundary + distance, b: distance + extra };
  }
  const a = integer(0, max, random);
  return { op, a, b: integer(0, op === '+' ? max - a : a, random) };
}

export function generateQuestion(game: MathGameId, level: MathLevel, index = 0, random: Random = Math.random): MathQuestion {
  let checkout: CheckoutDetails | undefined;
  let op: Operation = '+', a = 0, b = 0;
  let kind: MathQuestion['kind'] = game === 'missing' ? 'puzzle' : game === 'balance' ? 'balance' : 'choice';
  const times = [[1, 2, 5, 10], [3, 4], [6, 7], [8, 9, 11, 12], Array.from({ length: 12 }, (_, i) => i + 1)];
  if (game === 'multiply') { op = '*'; a = pick(times[level - 1], random); b = integer(1, level >= 4 ? 12 : 10, random); }
  else if (game === 'divide') {
    kind = 'distribution';
    b = level === 1 ? 2 : level === 3 ? pick([2, 5, 10], random) : integer(level === 2 ? 2 : 1, level === 2 ? 5 : level === 5 ? 12 : 10, random);
    const smallHarvest = level <= 2 || index % 2 === 0;
    const quotientMax = level === 1 ? 5 : level === 2 ? Math.floor(20 / b) : smallHarvest ? Math.min(level === 5 ? 12 : 10, Math.floor(24 / b)) : level === 5 ? 12 : 10;
    a = b * integer(1, quotientMax, random); op = '/';
  } else if (game === 'missing') {
    op = level === 5 ? pick(['+', '-', '*', '/'] as const, random) : (['+', '-', '*', '/'] as const)[level - 1];
    if (op === '*') { a = integer(1, level === 5 ? 12 : 10, random); b = integer(1, 12, random); }
    else if (op === '/') { b = integer(1, 12, random); a = b * integer(1, 12, random); }
    else { a = integer(1, level === 5 ? 100 : 30, random); b = integer(1, op === '-' ? a : 30, random); }
  } else if (game === 'race' && [2, 3].includes(level)) {
    b = integer(1, 5, random); a = integer(1, 10, random); op = level === 2 ? '*' : '/';
    if (op === '/') a *= b;
  } else if ((game === 'race' && level >= 4) || (game === 'balance' && level === 4)) {
    op = game === 'balance' ? pick(['*', '/'] as const, random) : pick(['+', '-', '*', '/'] as const, random);
    if (op === '*' || op === '/') { a = integer(1, 12, random); b = integer(1, 12, random); if (op === '/') a *= b; }
    else { const maximum = level === 5 ? 1_000 : 100; a = integer(0, maximum, random); b = integer(0, op === '+' ? maximum - a : a, random); }
    if (op === '-' && b > a) [a, b] = [b, a];
  } else ({ op, a, b } = arithmetic(game === 'race' ? 2 : game === 'balance' ? Math.min(3, level) as MathLevel : level, random));

  let left = binary(op, number(a), number(b));
  let right = blank;
  let answer = evaluate(left);
  const total = answer;
  let prompt = game === 'multiply' ? 'Hoeveel is het samen?' : game === 'add-subtract' ? op === '+' ? `Je hebt ${a} appels en krijgt er ${b} bij. Hoeveel zijn het samen?` : `Je hebt ${a} appels en geeft er ${b} weg. Hoeveel blijven er over?` : 'Welk getal past hier?';
  let hint = op === '*' ? `${a} × ${b} betekent ${a} groepjes van ${b}.` : op === '/' ? `Verdeel ${a} eerlijk over ${b} groepjes.` : op === '-' ? `Begin bij ${a} en tel ${b} terug.` : `Begin bij ${a} en tel ${b} erbij.`;
  if (game === 'divide') prompt = `Verdeel ${a} ${index % 2 ? 'blauwe bessen' : 'aardbeien'} over ${b} mandjes.`;
  if (game === 'add-subtract') prompt = op === '+' ? `${a} eikels. De eekhoorn vindt er ${b} bij.` : `${a} eikels. De vogel neemt er ${b} mee.`;
  if (game === 'missing') {
    const missingLeft = random() < .5;
    answer = missingLeft ? a : b;
    left = binary(op, missingLeft ? blank : number(a), missingLeft ? number(b) : blank);
    right = number(total);
    hint = op === '+' ? `Gebruik de omgekeerde som: ${total} − ${missingLeft ? b : a}.` : op === '-' ? missingLeft ? `Tel terug bij elkaar: ${total} + ${b}.` : `Gebruik ${a} − ${total}.` : op === '*' ? `Deel ${total} door ${missingLeft ? b : a}.` : missingLeft ? `Vermenigvuldig ${total} met ${b}.` : `Deel ${a} door ${total}.`;
    prompt = 'Welk getal maakt de som kloppend?';
  }
  if (game === 'balance') {
    prompt = 'Maak beide honingpotten even vol.';
    if (level <= 2) {
      op = '+';
      const first = integer(2, level === 1 ? 5 : 15, random), second = integer(1, level === 1 ? 5 : 15, random);
      left = binary('+', number(first), number(second));
    }
    // Different decompositions require calculation rather than copying a visible term.
    if (level <= 2) {
      const base = integer(3, level === 1 ? 8 : 15, random);
      left = binary('+', number(base), number(base + 1));
    }
    if (level === 5) {
      left = binary('+', binary('*', number(integer(2, 12, random)), number(integer(2, 12, random))), number(integer(1, 12, random)));
    }
    const leaves = (expression: Expression): number[] => 'value' in expression ? [expression.value] : 'op' in expression ? [...leaves(expression.left), ...leaves(expression.right)] : [];
    const candidates = Array.from({ length: Math.max(0, evaluate(left) - 1) }, (_, i) => i + 1).filter(value => !leaves(left).includes(value) && !leaves(left).includes(evaluate(left) - value));
    if (!candidates.length) left = level === 5 ? binary('+', binary('*', number(3), number(4)), number(2)) : level === 4 ? binary('*', number(3), number(4)) : binary('+', number(3), number(4));
    const offset = candidates.length ? pick(candidates, random) : level >= 4 ? 1 : 2;
    right = binary('+', number(offset), blank);
    answer = evaluate(left) - offset;
    // A positive extra term prevents a visible-value copy question at every level.
    if (evaluate(left) <= 1) {
      left = level === 4 ? binary('/', number(12), number(3)) : binary('-', number(8), number(3));
      right = binary('+', number(1), blank); answer = evaluate(left) - 1;
    }
    hint = `Reken links eerst uit: ${expressionText(left)}. Rechts moet evenveel komen: trek ${'op' in right ? expressionText('blank' in right.left ? right.right : right.left) : '0'} daarvan af.`;
  }
  if (game === 'race') {
    const expensive = level === 5 ? index % 2 === 0 : level === 4 && index % 4 === 3;
    const pool = checkoutProducts.filter(product => expensive ? product.category === 'furniture' : product.category === 'food');
    const product = pick(pool, random);
    checkout = { products: [product], quantity: 1 };
    if (level === 5) op = pick(['+', '-'] as const, random);
    if (op === '+') {
      const second = pick(pool.filter(item => item.id !== product.id), random);
      checkout.products.push(second); a = product.price; b = second.price;
      prompt = 'Tel de twee prijzen op.';
      hint = `Tel €${a} en €${b} bij elkaar op.`;
    } else if (op === '-') {
      const step = expensive ? 100 : 10;
      a = (Math.floor(product.price / step) + 1) * step; b = product.price;
      prompt = `Betaald: €${a}. Hoeveel wisselgeld krijg je?`;
      hint = `Trek de prijs van €${b} af van €${a}.`;
    } else if (op === '*') {
      a = integer(1, expensive ? 3 : 10, random); b = product.price;
      checkout.quantity = a;
      prompt = `${a} ${product.unit[a === 1 ? 0 : 1]} van €${b} per ${product.unit[0]}. Samen?`;
      hint = `Tel ${a} keer €${b}, of gebruik ${a} × ${b}.`;
    } else {
      b = integer(2, 5, random); checkout.quantity = b * integer(1, 3, random);
      a = product.price * checkout.quantity;
      prompt = `${b} klanten delen de rekening van €${a}. Hoeveel betaalt ieder?`;
      hint = `Deel de rekening van €${a} door ${b}.`;
    }
    left = binary(op, number(a), number(b)); right = blank; answer = evaluate(left);
  }
  const id = `${expressionText(left)}=${expressionText(right)}`;
  return { id, kind, left, right, answer, options: answerChoices(answer, [a + b, answer + a, answer - b, answer + b], random), prompt, hint, operation: op, a, b, total: game === 'race' ? answer : total, groups: game === 'divide' ? b : undefined, fruit: index % 2 ? 'blueberry' : 'strawberry', checkout };
}

export function createQuestionDeck(game: MathGameId, level: MathLevel, count = 10, random: Random = Math.random): MathQuestion[] {
  // Level one has only five positive divisions into two groups; exhaust them before repeating.
  if (game === 'divide' && level === 1) {
    const deck: MathQuestion[] = [];
    while (deck.length < count) {
      let cycle = shuffled([1, 2, 3, 4, 5], random);
      if (deck.at(-1)?.answer === cycle[0]) [cycle[0], cycle[1]] = [cycle[1], cycle[0]];
      for (const quotient of cycle) {
        if (deck.length === count) break;
        const question = generateQuestion(game, level, deck.length, () => (quotient - .5) / 5);
        deck.push({ ...question, id: `${question.id}:challenge:${deck.length}` });
      }
    }
    return deck;
  }
  const questions: MathQuestion[] = [], seen = new Set<string>();
  let seed = 17;
  const fallback = () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;
  for (let attempt = 0; questions.length < count && attempt < count * 300; attempt++) {
    const question = generateQuestion(game, level, questions.length, attempt < count * 20 ? random : fallback);
    if (!seen.has(question.id) && validAnswer(question, question.answer)) { seen.add(question.id); questions.push(question); }
  }
  if (questions.length !== count) throw Error('Niet genoeg unieke rekenopdrachten.');
  return questions;
}
export function balanceAngle(left: number, right: number): number { return Math.max(-12, Math.min(12, (right - left) * 2)); }
export function distributionCorrect(counts: number[], total: number): boolean {
  return counts.length > 0 && counts.every(count => Number.isInteger(count) && count >= 0 && count === total / counts.length) && counts.reduce((a, b) => a + b, 0) === total;
}
export function resultStatus(game: MathGameId, level: MathLevel, result: MathResult) {
  const valid = [result.correct, result.total, result.score, result.mistakes].every(value => Number.isSafeInteger(value) && value >= 0) && result.correct <= result.total && (game === 'race'
    ? result.score >= result.correct && result.score <= result.correct + Math.floor(result.correct / 3)
    : result.total === 10 && result.score === result.correct && result.mistakes >= result.total - result.correct);
  const passed = valid && (game === 'race' ? result.score >= RACE_TARGETS[level - 1] && result.correct > 0 : result.total === 10 && result.correct >= 8);
  return { valid, passed, perfect: passed && result.mistakes === 0 && result.correct === result.total, stars: passed ? result.mistakes === 0 && result.correct === result.total ? 3 : 2 : result.correct > 0 ? 1 : 0 };
}
