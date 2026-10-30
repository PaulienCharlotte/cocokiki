import { answerChoices, evaluate, expressionText } from './engine';
import { checkoutGroceries } from './checkoutCatalog';
import type { Expression, MathLevel, MathQuestion, Operation } from './types';

type Variant = 'total' | 'change' | 'restock' | 'sold' | 'missing-add' | 'groups' | 'discount' | 'share' | 'missing-multiply' | 'missing-subtract' | 'combined';
const variants: Record<MathLevel, readonly Variant[]> = {
  1: ['total', 'change', 'restock', 'sold', 'missing-add'],
  2: ['total', 'groups', 'change', 'discount', 'missing-add', 'sold'],
  3: ['share', 'groups', 'total', 'change', 'missing-multiply', 'discount'],
  4: ['combined', 'change', 'share', 'missing-subtract', 'groups', 'discount'],
  5: ['combined', 'missing-multiply', 'change', 'share', 'missing-subtract', 'discount', 'restock'],
};
const value = (n: number): Expression => ({ value: n });
const blank: Expression = { blank: true };
const sum = (op: Operation, left: Expression, right: Expression): Expression => ({ op, left, right });

export function createCheckoutQuestion(level: MathLevel, index = 0, random = Math.random): MathQuestion {
  const integer = (min: number, max: number) => min + Math.min(max - min, Math.floor(random() * (max - min + 1)));
  const variant = variants[level][index % variants[level].length];
  const limit = [20, 50, 100, 100, 1000][level - 1];
  let a = integer(2, Math.floor(limit / 2)), b = integer(1, Math.floor(limit / 2));
  let op: Operation = '+', left = sum('+', value(a), value(b)), right = blank;
  let answer = a + b;
  let prompt = `Twee producten kosten €${a} en €${b}. Hoeveel samen?`;
  let hint = `Tel ${a} en ${b} bij elkaar op.`;
  if (variant === 'change' || variant === 'discount' || variant === 'sold') {
    op = '-';
    a = variant === 'change' ? level === 1 ? 20 : level === 2 ? 50 : level === 5 ? 1000 : 100 : integer(4, limit);
    b = integer(1, a - 2);
    left = sum(op, value(a), value(b)); answer = a - b;
    prompt = variant === 'change' ? `Je betaalt €${a} voor €${b} boodschappen. Hoeveel krijg je terug?`
      : variant === 'discount' ? `De boodschappen kosten €${a}. Je krijgt €${b} korting. Wat betaal je?`
      : `Er zijn ${a} producten. Je verkoopt er ${b}. Hoeveel blijven er over?`;
    hint = `Trek ${b} af van ${a}.`;
  } else if (variant === 'restock') {
    prompt = `Er staan ${a} producten. Je zet er ${b} bij. Hoeveel zijn het nu?`;
  } else if (variant === 'groups' || variant === 'missing-multiply' || variant === 'share') {
    a = integer(2, level === 2 ? 5 : 12);
    b = integer(2, level === 5 ? 25 : level === 2 ? 9 : 12);
    op = variant === 'share' ? '/' : '*';
    if (variant === 'share') {
      const total = a * b;
      left = sum('/', value(total), value(a)); answer = b;
      prompt = `${a} klanten delen €${total}. Hoeveel betaalt ieder?`;
      hint = `Verdeel ${total} eerlijk over ${a} klanten.`;
      b = a; a = total;
    } else if (variant === 'missing-multiply') {
      left = sum('*', value(a), blank); right = value(a * b); answer = b;
      prompt = `Elke verpakking kost €${a}. Samen is het €${a * b}. Hoeveel verpakkingen zijn het?`;
      hint = `Deel ${a * b} door ${a}.`;
    } else {
      left = sum('*', value(a), value(b)); answer = a * b;
      prompt = `${a} verpakkingen van €${b}. Hoeveel betaal je samen?`;
      hint = `Reken ${a} keer ${b}.`;
    }
  } else if (variant === 'missing-add' || variant === 'missing-subtract') {
    a = integer(2, Math.floor(limit / 2)); b = integer(1, a - 1);
    op = variant === 'missing-add' ? '+' : '-';
    const total = op === '+' ? a + b : a - b;
    left = sum(op, value(a), blank); right = value(total); answer = b;
    prompt = op === '+' ? `Er zijn ${a} producten. Hoeveel moeten erbij om ${total} te krijgen?`
      : `Je hebt €${a}. Na het betalen is €${total} over. Hoeveel heb je uitgegeven?`;
    hint = op === '+' ? `Haal ${a} van ${total} af.` : `Haal ${total} van ${a} af.`;
  } else if (variant === 'combined') {
    op = '+';
    a = integer(2, level === 5 ? 9 : 5); b = integer(level === 5 ? 10 : 3, level === 5 ? 50 : 12);
    const extra = integer(1, level === 5 ? 50 : 9);
    left = sum('+', sum('*', value(a), value(b)), value(extra)); answer = a * b + extra;
    prompt = `${a} verpakkingen van €${b}, plus €${extra} bezorgkosten. Hoeveel samen?`;
    hint = `Reken eerst ${a} keer ${b}. Tel daarna ${extra} erbij op.`;
  }
  const first = integer(0, checkoutGroceries.length - 1);
  const second = (first + integer(1, checkoutGroceries.length - 1)) % checkoutGroceries.length;
  return {
    id: `checkout:${variant}:${expressionText(left)}=${expressionText(right)}`,
    kind: right === blank ? 'choice' : 'puzzle', left, right, answer,
    options: answerChoices(answer, [answer + 1, answer - 1, answer + 5, answer - 2], random),
    prompt, hint, operation: op, a, b, total: evaluate(left, answer),
    checkout: { products: variant === 'total' || variant === 'combined' ? [checkoutGroceries[first], checkoutGroceries[second]] : [checkoutGroceries[first]], quantity: 1 },
  };
}
