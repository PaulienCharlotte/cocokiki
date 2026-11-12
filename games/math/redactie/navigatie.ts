import type { MathResult } from '../types';

export type RedactieAntwoorden = Record<number, boolean>;
/** Bladeren levert niets op; alleen de eerste ingeleverde poging telt. */
export function noteerRedactieAntwoord(antwoorden: RedactieAntwoorden, index: number, goed: boolean): RedactieAntwoorden {
  if (!Number.isInteger(index) || index < 0 || Object.hasOwn(antwoorden, index)) return antwoorden;
  return { ...antwoorden, [index]: goed };
}
export function afgerondeRedactieronde(antwoorden: RedactieAntwoorden, aantal: number, roundId: string): MathResult | null {
  if (aantal < 1 || !Array.from({ length: aantal }, (_, i) => Object.hasOwn(antwoorden, i)).every(Boolean)) return null;
  const correct = Array.from({ length: aantal }, (_, i) => antwoorden[i]).filter(Boolean).length;
  return { correct, total: aantal, score: correct, mistakes: aantal - correct, solved: correct, roundId };
}
