import { alleVragen, type QuizVraag } from '../data/quiz/vragen';
import { commitLocalState, readDocument } from './localState';
import { awardCurrencyOnce } from './currency';

export const QUIZ_KEY = 'cocokiki:quiz:v1';
export const QUIZ_BELONING = 1;

export interface QuizState {
  version: 1;
  /** Welke vragen al goed beantwoord zijn. */
  goed: string[];
}

export function createEmptyQuiz(): QuizState {
  return { version: 1, goed: [] };
}

export function migrateQuiz(waarde: unknown): QuizState {
  const leeg = createEmptyQuiz();
  if (!waarde || typeof waarde !== 'object') return leeg;
  const bron = waarde as Partial<QuizState>;
  if (bron.version !== 1) return leeg;
  return { ...leeg, goed: Array.isArray(bron.goed) ? [...new Set(bron.goed.filter((id): id is string => typeof id === 'string'))] : [] };
}

export function loadQuiz(): QuizState {
  try { return migrateQuiz(JSON.parse(readDocument(QUIZ_KEY) ?? 'null')); } catch { return createEmptyQuiz(); }
}

/** De dag als sleutel, zodat iedereen op dezelfde dag dezelfde vraag krijgt. */
export function dagSleutel(nu = new Date()): string {
  return `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`;
}

function getal(tekst: string): number {
  let som = 0;
  for (let i = 0; i < tekst.length; i += 1) som = (som * 31 + tekst.charCodeAt(i)) % 100000;
  return som;
}

/**
 * De vraag van vandaag.
 *
 * Vragen die je al goed had komen pas terug als je alles gehad hebt. Zo blijft
 * het nieuw zolang er nieuw is, en wordt het daarna herhaling in plaats van
 * niets.
 */
export function vraagVanDeDag(state: QuizState = loadQuiz(), dag = dagSleutel(), vragen: QuizVraag[] = alleVragen()): QuizVraag | null {
  if (vragen.length === 0) return null;
  const nieuw = vragen.filter(vraag => !state.goed.includes(vraag.id));
  const stapel = nieuw.length > 0 ? nieuw : vragen;
  return stapel[getal(dag) % stapel.length];
}

/** Een goed antwoord onthouden, en de eerste keer een CocoCoin geven. */
export function beantwoordGoed(vraagId: string, state: QuizState = loadQuiz()): QuizState {
  if (state.goed.includes(vraagId)) return state;
  const volgende: QuizState = { ...state, goed: [...state.goed, vraagId] };
  if (commitLocalState({ [QUIZ_KEY]: JSON.stringify(volgende) }).status !== 'applied') return state;
  awardCurrencyOnce(`quiz:${vraagId}`, QUIZ_BELONING);
  return volgende;
}

/** Hoeveel je er al goed had, van hoeveel er zijn. */
export function quizStand(state: QuizState = loadQuiz(), vragen: QuizVraag[] = alleVragen()): { goed: number; totaal: number } {
  const ids = new Set(vragen.map(vraag => vraag.id));
  return { goed: state.goed.filter(id => ids.has(id)).length, totaal: vragen.length };
}
