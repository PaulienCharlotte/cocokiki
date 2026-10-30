import { Question, QuestionType, TableChoice } from '../types';

const TYPES: QuestionType[] = ['classic', 'division', 'missing', 'check', 'bigger', 'factor'];

function pick<T>(items: T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

function shuffled<T>(items: T[], random: () => number): T[] {
  return [...items].sort(() => random() - .5);
}

function tableFor(choice: TableChoice, random: () => number): number {
  // Koos je meerdere tafels, dan komt elke vraag uit een van die tafels.
  const gekozen = Array.isArray(choice) ? choice.filter(table => Number.isInteger(table) && table >= 1 && table <= 12) : [];
  if (gekozen.length) return pick(gekozen, random);
  return choice === 'mix' || Array.isArray(choice) ? 1 + Math.floor(random() * 10) : choice;
}

function numericChoices(answer: number, random: () => number): number[] {
  const candidates = new Set([answer]);
  const offsets = shuffled([-10, -5, -2, -1, 1, 2, 5, 10], random);
  for (const offset of offsets) {
    const value = Math.max(0, answer + offset);
    if (value !== answer) candidates.add(value);
    if (candidates.size === 3) break;
  }
  return shuffled([...candidates], random);
}

function comparisonFactors(left: number, right: number, random: () => number): [number, number] {
  const product = left * right;
  const candidates: Array<[number, number]> = [];
  for (let first = 1; first <= 10; first++) {
    for (let second = 1; second <= 10; second++) {
      if (first * second !== product) candidates.push([first, second]);
    }
  }
  const nearby = candidates.filter(([first, second]) => Math.abs(first * second - product) <= 16);
  return pick(nearby.length ? nearby : candidates, random);
}

export function nextQuestionType(round: number, difficulty: number): QuestionType {
  const unlocked = difficulty <= 1 ? TYPES.slice(0, 3) : difficulty === 2 ? TYPES.slice(0, 5) : TYPES;
  return unlocked[(round - 1) % unlocked.length];
}

export function nextDifficulty(current: number, streak: number, struggled: boolean): number {
  if (struggled) return Math.max(1, current - 1);
  if (streak > 0 && streak % 3 === 0) return Math.min(3, current + 1);
  return current;
}

export function createQuestion(
  tableChoice: TableChoice,
  previousId = '',
  random: () => number = Math.random,
  difficulty = 1,
  requestedType: QuestionType = 'classic',
): Question {
  let left = tableFor(tableChoice, random);
  let right = 1 + Math.floor(random() * 10);
  let id = `${requestedType}:${left}:${right}`;
  if (id === previousId) right = (right % 10) + 1;
  id = `${requestedType}:${left}:${right}`;
  const product = left * right;
  const base = { id, left, right, type: requestedType, difficulty, tables: [left] };

  if (requestedType === 'division') {
    return { ...base, answer: right, choices: numericChoices(right, random), choiceLabels: [], prompt: `${product} ÷ ${left} = ?`, explanation: `${product} ÷ ${left} = ${right}, want ${left} × ${right} = ${product}` };
  }

  if (requestedType === 'missing') {
    const hideLeft = random() < .5;
    const answer = hideLeft ? left : right;
    const prompt = hideLeft ? `? × ${right} = ${product}` : `${left} × ? = ${product}`;
    return { ...base, answer, choices: numericChoices(answer, random), choiceLabels: [], prompt, explanation: `${left} × ${right} = ${product}` };
  }

  if (requestedType === 'check') {
    const shown = random() < .5 ? product : product + pick([-2, -1, 1, 2, 5], random);
    const answer = Number(shown === product);
    return { ...base, answer, choices: [1, 0], choiceLabels: ['Ja', 'Nee'], prompt: `Klopt dit: ${left} × ${right} = ${shown}?`, explanation: `${left} × ${right} = ${product}` };
  }

  if (requestedType === 'bigger') {
    const [otherLeft, otherRight] = comparisonFactors(left, right, random);
    const labels = [`${left} × ${right}`, `${otherLeft} × ${otherRight}`];
    const answer = product > otherLeft * otherRight ? 0 : 1;
    return { ...base, answer, choices: [0, 1], choiceLabels: labels, prompt: 'Welke som is groter?', explanation: `${labels[answer]} is het grootst` };
  }

  if (requestedType === 'factor') {
    const correct = `${left} × ${right}`;
    const labels = shuffled([correct, `${left + 1} × ${right}`, `${left} × ${right + 1}`], random);
    const answer = labels.indexOf(correct);
    return { ...base, answer, choices: [0, 1, 2], choiceLabels: labels, prompt: `Welke som is ${product}?`, explanation: `${correct} = ${product}` };
  }

  const choices = numericChoices(product, random);
  return { ...base, answer: product, choices, choiceLabels: [], prompt: `${left} × ${right} = ?`, explanation: `${left} × ${right} = ${product}` };
}

export function questionIsValid(question: Question): boolean {
  const comparisonProducts = question.type === 'bigger'
    ? question.choiceLabels.map(label => label.split('×').map(Number).reduce((total, factor) => total * factor, 1))
    : [];
  return question.choices.includes(question.answer)
    && new Set(question.choices).size === question.choices.length
    && question.choiceLabels.length !== 1
    && (question.choiceLabels.length === 0 || question.choiceLabels.length === question.choices.length)
    && (question.type !== 'bigger' || (comparisonProducts.length === 2 && comparisonProducts[0] !== comparisonProducts[1]))
    && question.prompt.length > 0;
}
