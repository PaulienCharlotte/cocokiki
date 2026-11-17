import type { Location } from '../types';
/** The existing test grading rule, shared by the test and its adventure receipt. */
export const normalizeTopoAnswer = (value: string) => value.trim().toLowerCase().replace(/['']/g, "'").replace(/\s+/g, ' ');
export function scoreTopoTest(locations: readonly Pick<Location, 'id' | 'name'>[], answers: Record<string, string>) {
  const details: Record<string, boolean> = {};
  let correct = 0;
  locations.forEach(location => { const ok = normalizeTopoAnswer(answers[location.id] ?? '') === normalizeTopoAnswer(location.name); details[location.id] = ok; if (ok) correct++; });
  const total = locations.length;
  return { correct, total, grade: total === 0 ? 10 : Math.round((1 + correct / total * 9) * 10) / 10, details };
}
