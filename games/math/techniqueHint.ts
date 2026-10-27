import { evaluate } from './engine';
import type { MathQuestion } from './types';
import { storySteps } from './storySteps';

export function techniqueHint(question: MathQuestion): string {
  const left = question.left;
  if (question.id.startsWith('story:')) {
    const first = storySteps(left)[0];
    const symbol = { '+': '+', '-': '−', '*': '×', '/': '÷' }[first.operation];
    return `Begin met ${first.left} ${symbol} ${first.right}. ${question.hint}`;
  }
  if (question.kind !== 'puzzle' || !('op' in left)) return question.hint;
  const blankFirst = 'blank' in left.left;
  const known = evaluate(blankFirst ? left.right : left.left);
  const total = evaluate(question.right);
  if (left.op === '+') return `Reken terug: doe ${total} − ${known}. Je haalt wat al klaar is van het totaal af.`;
  if (left.op === '-') return blankFirst ? `Tel terug wat weggehaald is: doe ${total} + ${known}.` : `Zoek het verschil: doe ${known} − ${total}.`;
  if (left.op === '*') return `Gebruik de omgekeerde bewerking: doe ${total} ÷ ${known}.`;
  return blankFirst ? `Vermenigvuldig terug: doe ${total} × ${known}.` : `Hoeveel groepjes passen erin? Doe ${known} ÷ ${total}.`;
}
