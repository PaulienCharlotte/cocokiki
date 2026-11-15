import { NURSERY_ITEMS, NURSERY_QUESTIONS, PROJECT_BUDGET, type NurseryItemId, type NurseryQuestionId } from '../data/projects/nursery';
import { MIN_PLACEMENT_SCALE, MAX_PLACEMENT_SCALE, SCALE_STEP } from './roomInventory';
import { commitLocalState, readDocument, readLocalState } from './localState';
export const NURSERY_KEY = 'cocokiki:project:luna-nursery:v1';
export type NurseryStage = 'brief' | 'height' | 'space' | 'shop' | 'total' | 'change' | 'rug' | 'decorate' | 'complete';
const STAGES: NurseryStage[] = ['brief', 'height', 'space', 'shop', 'total', 'change', 'rug', 'decorate', 'complete'];
export interface NurseryState { version: 1; revision: number; stage: NurseryStage; basket: NurseryItemId[]; helped: NurseryQuestionId[]; solved: NurseryQuestionId[]; positions: Partial<Record<NurseryItemId, { x: number; y: number; scale?: number }>> }
export const emptyNursery = (): NurseryState => ({ version: 1, revision: 0, stage: 'brief', basket: [], helped: [], solved: [], positions: {} });
export const nurseryTotal = (state: NurseryState) => NURSERY_ITEMS.filter(item => state.basket.includes(item.id)).reduce((sum, item) => sum + item.price, 0);
export function loadNursery(): NurseryState {
  try {
    const raw = JSON.parse(readDocument(NURSERY_KEY) ?? 'null');
    if (raw?.version !== 1 || !STAGES.includes(raw.stage)) return emptyNursery();
    const state = emptyNursery(); state.revision = Number.isSafeInteger(raw.revision) && raw.revision >= 0 ? raw.revision : 0; state.stage = raw.stage;
    state.basket = NURSERY_ITEMS.filter(item => raw.basket?.includes(item.id)).map(item => item.id);
    state.helped = NURSERY_QUESTIONS.filter(id => raw.helped?.includes(id)); state.solved = NURSERY_QUESTIONS.filter(id => raw.solved?.includes(id));
    for (const item of state.basket) { const p = raw.positions?.[item]; if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) state.positions[item] = { x: Math.max(5, Math.min(95, p.x)), y: Math.max(70, Math.min(92, p.y)), scale: nurseryScale(p.scale) }; }
    return state;
  } catch { return emptyNursery(); }
}
function save(previous: NurseryState, next: NurseryState, reward?: { id: string; amount: number }): boolean {
  if (loadNursery().revision !== previous.revision) return false;
  return commitLocalState({ [NURSERY_KEY]: JSON.stringify({ ...next, revision: previous.revision + 1 }) }, reward ? [reward] : []).status === 'applied';
}
export function beginNursery(): boolean { const s = loadNursery(); return s.stage === 'brief' && save(s, { ...s, stage: 'height' }); }
export function nurseryQuestion(state: NurseryState) {
  const total = nurseryTotal(state);
  const questions = {
    height: { prompt: 'Van vloer tot plafond is 260 cm. Hoeveel meter is dat?', answer: 2.6, unit: 'm', hint: '100 cm is 1 m. Deel 260 door 100: 2,6 m.' },
    space: { prompt: 'De muur is 320 cm. Het bed is 120 cm en de kast 80 cm breed. Hoeveel cm blijft over?', answer: 120, unit: 'cm', hint: 'Het bed en de kast zijn samen 120 + 80 = 200 cm. 320 − 200 = 120 cm.' },
    total: { prompt: 'Hoeveel kost jouw gekozen inrichting samen?', answer: total, unit: 'projectmunten', hint: `${NURSERY_ITEMS.filter(i => state.basket.includes(i.id)).map(i => i.price).join(' + ')} = ${total}.` },
    change: { prompt: `Je budget is 500. Je inrichting kost ${total}. Hoeveel houd je over?`, answer: PROJECT_BUDGET - total, unit: 'projectmunten', hint: `500 − ${total} = ${PROJECT_BUDGET - total}. Het restant blijft in dit project.` },
    rug: { prompt: 'Het babybedje is 120 cm breed. Hoeveel meter is dat?', answer: 1.2, unit: 'm', hint: '100 cm is 1 m. Deel 120 door 100: 1,2 m.' },
  };
  return NURSERY_QUESTIONS.includes(state.stage as NurseryQuestionId) ? questions[state.stage as NurseryQuestionId] : null;
}
export function revealNursery(revision: number): boolean {
  const s = loadNursery(), id = s.stage as NurseryQuestionId;
  if (s.revision !== revision || !nurseryQuestion(s)) return false;
  return s.helped.includes(id) || save(s, { ...s, helped: [...s.helped, id] });
}
export function answerNursery(revision: number, value: string): 'correct' | 'wrong' | 'stale' | 'save-failed' {
  const s = loadNursery(), q = nurseryQuestion(s), id = s.stage as NurseryQuestionId;
  if (s.revision !== revision || !q || s.solved.includes(id)) return 'stale';
  const text = value.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(text) || Math.abs(Number(text) - q.answer) > .000001) return 'wrong';
  const stages: Record<NurseryQuestionId, NurseryStage> = { height: 'space', space: 'shop', total: 'change', change: 'rug', rug: 'decorate' };
  const amount = s.helped.includes(id) ? 0 : 12;
  return save(s, { ...s, solved: [...s.solved, id], stage: stages[id] }, { id: `nursery:v1:question:${id}`, amount }) ? 'correct' : 'save-failed';
}
export function toggleNurseryItem(revision: number, id: NurseryItemId): boolean {
  const s = loadNursery(); if (s.revision !== revision || s.stage !== 'shop' || !NURSERY_ITEMS.some(i => i.id === id)) return false;
  const next = { ...s, basket: s.basket.includes(id) ? s.basket.filter(i => i !== id) : [...s.basket, id] };
  return nurseryTotal(next) <= PROJECT_BUDGET && save(s, next);
}
export function checkoutNursery(revision: number): boolean {
  const s = loadNursery();
  return s.revision === revision && s.stage === 'shop' && NURSERY_ITEMS.filter(i => i.required).every(i => s.basket.includes(i.id)) && nurseryTotal(s) <= PROJECT_BUDGET && save(s, { ...s, stage: 'total' });
}
export const nurseryScale = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? Math.max(MIN_PLACEMENT_SCALE, Math.min(MAX_PLACEMENT_SCALE, Math.round(value * 100) / 100)) : 1;
export function nurseryPoint(id: NurseryItemId, x: number, y: number, scale = 1) {
  const width = NURSERY_ITEMS.find(i => i.id === id)!.width * nurseryScale(scale);
  return { x: Math.max(width / 2 + 2, Math.min(98 - width / 2, x)), y: Math.max(70, Math.min(92, y)), scale: nurseryScale(scale) };
}
/** Bestaande plaatsingen blijven staan; nieuwe meubels staan direct klaar om te slepen. */
export function prepareNurseryRoom(): boolean {
  const s = loadNursery();
  if (s.stage !== 'decorate') return false;
  const missing = s.basket.filter(id => !s.positions[id]);
  if (!missing.length) return true;
  const starts: Record<NurseryItemId, number> = { crib: 28, dresser: 52, lamp: 73, shelf: 82, chair: 82 };
  const positions = { ...s.positions };
  for (const id of missing) positions[id] = nurseryPoint(id, starts[id], 84);
  return save(s, { ...s, positions });
}
export function positionNursery(revision: number, id: NurseryItemId, x: number, y: number): boolean {
  const s = loadNursery();
  if (s.revision !== revision || s.stage !== 'decorate' || !s.basket.includes(id) || !Number.isFinite(x) || !Number.isFinite(y)) return false;
  return save(s, { ...s, positions: { ...s.positions, [id]: nurseryPoint(id, x, y, s.positions[id]?.scale) } });
}
export function resizeNursery(revision: number, id: NurseryItemId, direction: number): boolean {
  const s = loadNursery(), p = s.positions[id];
  if (s.revision !== revision || s.stage !== 'decorate' || !s.basket.includes(id) || !p || ![-1, 1].includes(direction)) return false;
  const scale = nurseryScale((p.scale ?? 1) + direction * SCALE_STEP);
  return save(s, { ...s, positions: { ...s.positions, [id]: nurseryPoint(id, p.x, p.y, scale) } });
}
export function nurseryLayoutReady(s: NurseryState): boolean {
  if (!NURSERY_ITEMS.filter(i => i.required).every(i => s.basket.includes(i.id)) || s.basket.some(id => !s.positions[id] || s.positions[id]!.y < 70)) return false;
  if (s.positions.crib!.x >= 42 || s.positions.dresser!.x <= 50) return false;
  for (let i = 0; i < s.basket.length; i++) for (let j = i + 1; j < s.basket.length; j++) {
    const a = NURSERY_ITEMS.find(x => x.id === s.basket[i])!, b = NURSERY_ITEMS.find(x => x.id === s.basket[j])!;
    if (Math.abs(s.positions[a.id]!.x - s.positions[b.id]!.x) < (a.width * (s.positions[a.id]!.scale ?? 1) + b.width * (s.positions[b.id]!.scale ?? 1)) / 2 + 1) return false;
  }
  return true;
}
export function finishNursery(revision: number): boolean {
  const s = loadNursery();
  if (s.revision !== revision || s.stage !== 'decorate' || NURSERY_QUESTIONS.some(id => !s.solved.includes(id)) || !nurseryLayoutReady(s)) return false;
  return save(s, { ...s, stage: 'complete' }, { id: 'nursery:v1:finish', amount: s.solved.filter(id => !s.helped.includes(id)).length * 8 });
}
export function nurseryEarned(): number {
  try { return Object.entries(readLocalState().appliedTransactions).filter(([id]) => id.startsWith('nursery:v1:')).reduce((sum, [, amount]) => sum + amount, 0); } catch { return 0; }
}
