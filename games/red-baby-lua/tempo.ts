import type { TableChoice } from './game/types';
export const TEMPO_DURATION_MS = 60_000;
/** Keer, delen of door elkaar: het kind kiest zelf. */
export type TempoSoort = 'keer' | 'delen' | 'mix';
export const MAX_TAFEL = 20;
export interface TempoQuestion { a: number; b: number; answer: number; teken: '×' | '÷'; links: number; rechts: number }
export function tempoQuestion(table: TableChoice, random = Math.random, previous?: TempoQuestion, soort: TempoSoort = 'keer'): TempoQuestion {
  const values = table === 'mix' ? Array.from({ length: 12 }, (_, i) => i + 1) : Array.isArray(table) ? table.filter(value => Number.isInteger(value) && value >= 1 && value <= MAX_TAFEL) : [table];
  const tables = values.length ? values : [1, 2, 3, 4, 5, 10];
  const a = tables[Math.min(tables.length - 1, Math.floor(random() * tables.length))];
  let b = 1 + Math.min(9, Math.floor(random() * 10));
  if (previous?.a === a && previous.b === b) b = b % 10 + 1;
  const delen = soort === 'delen' || (soort === 'mix' && random() < 0.5);
  // Delen hoort bij dezelfde tafel: 7 × 6 = 42 wordt 42 ÷ 7 = 6.
  return delen ? { a, b, answer: b, teken: '÷', links: a * b, rechts: a } : { a, b, answer: a * b, teken: '×', links: b, rechts: a };
}
export function tempoAnswer(question: TempoQuestion, value: string, now: number, deadline: number): 'expired' | 'correct' | 'wrong' | 'empty' {
  if (now >= deadline) return 'expired';
  if (!/^\d+$/.test(value.trim())) return 'empty';
  return Number(value) === question.answer ? 'correct' : 'wrong';
}
