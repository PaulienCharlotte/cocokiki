import { NUTRIENTS } from '../data/cooking/nutrients';
import { RECIPES_BY_ID } from '../data/cooking/catalog';
import { commitLocalState, readDocument } from './localState';
import { loadCurrency } from './currency';
import { basketTotal, loadShoppingSession, type ShoppingSession } from './shopping';
import { LEARNING_COINS } from './learningReward';

export const SHOPPING_QUESTION_REWARD = LEARNING_COINS;
export interface ShoppingPracticeState { version: 1; sessionId: string; questionIndex: number; earned: number }
export interface ShoppingQuestion { id: string; prompt: string; options: Array<{ id: string; label: string }>; correctId: string; explanation: string }
const keyFor = (id: string) => `cocokiki:shopping-practice:v1:${id}`;

export function loadShoppingPractice(session: ShoppingSession): ShoppingPracticeState {
  const empty: ShoppingPracticeState = { version: 1, sessionId: session.id, questionIndex: 0, earned: 0 };
  try {
    const value = JSON.parse(readDocument(keyFor(session.id)) ?? 'null');
    if (value?.version === 1 && value.sessionId === session.id && Number.isSafeInteger(value.questionIndex) && value.questionIndex >= 0 && Number.isSafeInteger(value.earned) && value.earned >= 0) return value;
  } catch { /* Een onleesbare oefenstand verandert nooit het mandje of de portemonnee. */ }
  return empty;
}

export function shoppingQuestion(session: ShoppingSession, index: number): ShoppingQuestion {
  let question: Omit<ShoppingQuestion, 'id'>;
  if (index % 2 === 0) {
    const learned = session.recipeId ? RECIPES_BY_ID[session.recipeId]?.education?.nutrientMemory?.nutrientIds : undefined;
    const matching = NUTRIENTS.filter(n => learned?.includes(n.id));
    const nutrients = matching.length >= 3 ? matching : NUTRIENTS.filter(n => n.difficulty === 1);
    const n = Math.floor(index / 2) % nutrients.length;
    const target = nutrients[n];
    question = { prompt: `Wat leerden we over ${target.name.toLowerCase()}?`, options: [0, 1, 2].map(offset => {
      const nutrient = nutrients[(n + offset) % nutrients.length];
      const text = nutrient.bodyFunction.slice(nutrient.name.length).trimStart();
      return { id: nutrient.id, label: text.charAt(0).toUpperCase() + text.slice(1) };
    }), correctId: target.id, explanation: target.bodyFunction };
  } else {
    const round = Math.floor(index / 2);
    const amount = 100 + (round % 7) * 50;
    const kind = round % 3;
    const answer = kind === 0 ? amount * 2 : kind === 1 ? amount / 10 : amount + 75;
    const prompt = kind === 0 ? `Voor één portie heb je ${amount} gram nodig. Hoeveel gram voor twee porties?`
      : kind === 1 ? `Verdeel ${amount} gram bessen over 10 muffins. Hoeveel gram per muffin?`
      : `Je weegt ${amount} gram af en doet er 75 gram bij. Hoeveel gram is dat samen?`;
    const explanation = kind === 0 ? `${amount} × 2 = ${answer} gram.` : kind === 1 ? `${amount} ÷ 10 = ${answer} gram.` : `${amount} + 75 = ${answer} gram.`;
    const values = [answer, answer + 50, Math.max(0, answer - 10)];
    question = { prompt, options: values.map(n => ({ id: String(n), label: `${n} gram` })), correctId: String(answer), explanation };
  }
  // Dezelfde opgeslagen vraag houdt haar volgorde; het goede antwoord staat niet altijd vooraan.
  const offset = (index + [...session.id].reduce((sum, c) => sum + c.charCodeAt(0), 0)) % 3;
  return { ...question, id: `${session.id}:${index}`, options: [...question.options.slice(offset), ...question.options.slice(0, offset)] };
}

export function answerShoppingQuestion(session: ShoppingSession, questionId: string, answerId: string) {
  const balance = loadCurrency();
  const saved = loadShoppingSession(session.mode, session.recipeId);
  const state = loadShoppingPractice(session);
  const question = shoppingQuestion(session, state.questionIndex);
  if (saved.id !== session.id || question.id !== questionId) return { status: 'stale' as const, balance, reward: 0, state };
  const deficit = Math.max(0, basketTotal(saved) - balance);
  if (!deficit) return { status: 'funded' as const, balance, reward: 0, state };
  if (question.correctId !== answerId) return { status: 'incorrect' as const, balance, reward: 0, state };
  const reward = Math.min(SHOPPING_QUESTION_REWARD, deficit);
  const next = { ...state, questionIndex: state.questionIndex + 1, earned: state.earned + reward };
  const result = commitLocalState({ [keyFor(session.id)]: JSON.stringify(next) }, [{ id: `shopping-practice:${question.id}`, amount: reward }]);
  if (result.status !== 'applied' && result.status !== 'duplicate') return { status: 'failed' as const, balance: loadCurrency(), reward: 0, state };
  return { status: 'correct' as const, balance: result.balance, reward: result.status === 'applied' ? reward : 0, state: next };
}
