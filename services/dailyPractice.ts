import { alleVragen, type QuizVraag } from '../data/quiz/vragen';
import { dagSleutel } from './quiz';
import { commitLocalState, readDocument } from './localState';
export const DAILY_KEY = 'cocokiki:daily-practice:v1';
export const DAILY_REWARD = 10;
export interface DailyPractice { day: string; answers: Record<string, { choice: string; helped: boolean; reward?: number }> }
export function dailyQuestions(day = dagSleutel()): QuizVraag[] {
  const all = alleVragen();
  let seed = [...day].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
  const pool = [...all];
  for (let i = pool.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = seed % (i + 1); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  // Wissel planten en eten af, zonder dezelfde vraag twee keer te gebruiken.
  const plants = pool.filter(q => q.bron === 'planten');
  const food = pool.filter(q => q.bron !== 'planten');
  return [food[0], plants[0], food[1], plants[1], food[2]].filter((q): q is QuizVraag => Boolean(q));
}
export function loadDailyPractice(day = dagSleutel()): DailyPractice {
  const empty = { day, answers: {} };
  try {
    const raw = JSON.parse(readDocument(DAILY_KEY) ?? 'null');
    if (raw?.day !== day || !raw.answers || typeof raw.answers !== 'object') return empty;
    const ids = dailyQuestions(day);
    return { day, answers: Object.fromEntries(Object.entries(raw.answers).filter(([id, a]) => { const q = ids.find(q => q.id === id); const answer = a as { choice?: string; helped?: boolean }; return q && q.opties.includes(answer?.choice ?? '') && typeof answer.helped === 'boolean'; })) } as DailyPractice;
  } catch { return empty; }
}
export function answerDaily(day: string, id: string, choice: string, helped = false): boolean {
  if (day !== dagSleutel()) return false;
  const state = loadDailyPractice(day), q = dailyQuestions(day).find(q => q.id === id);
  if (!q || state.answers[id] || !q.opties.includes(choice)) return false;
  const reward = !helped && choice === q.antwoord ? DAILY_REWARD : 0;
  const next = { ...state, answers: { ...state.answers, [id]: { choice, helped, reward } } };
  return commitLocalState({ [DAILY_KEY]: JSON.stringify(next) }, [{ id: `daily:${day}:${id}`, amount: reward }]).status === 'applied';
}

/** Oudere antwoorden kregen 2 munten; toon geen nieuwe beloning voor al betaald werk. */
export function dailyEarned(state: DailyPractice): number {
  return dailyQuestions(state.day).reduce((sum, q) => {
    const answer = state.answers[q.id];
    if (!answer || answer.helped || answer.choice !== q.antwoord) return sum;
    return sum + (answer.reward === DAILY_REWARD ? DAILY_REWARD : 2);
  }, 0);
}
