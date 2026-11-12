import { evaluate } from './engine';
import type { MathQuestion } from './types';

export function techniqueHint(question: MathQuestion): string {
  const left = question.left;
  // Bij een redactiesom is de tip de aanpak van het type, niet een losse som:
  // de stap waar je op vastloopt wijst zichzelf aan in het werkblad.
  if ('typeId' in question) return question.hint;
  if (question.kind !== 'puzzle' || !('op' in left)) return question.hint;
  const blankFirst = 'blank' in left.left;
  const known = evaluate(blankFirst ? left.right : left.left);
  const total = evaluate(question.right);
  if (left.op === '+') return `Reken terug: doe ${total} − ${known}. Je haalt wat al klaar is van het totaal af.`;
  if (left.op === '-') return blankFirst ? `Tel terug wat weggehaald is: doe ${total} + ${known}.` : `Zoek het verschil: doe ${known} − ${total}.`;
  if (left.op === '*') return `Gebruik de omgekeerde bewerking: doe ${total} ÷ ${known}.`;
  return blankFirst ? `Vermenigvuldig terug: doe ${total} × ${known}.` : `Hoeveel groepjes passen erin? Doe ${known} ÷ ${total}.`;
}
