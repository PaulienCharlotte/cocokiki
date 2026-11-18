import { TASK_REWARDS } from './taskRewards';
import { NURSERY_QUESTIONS, type NurseryItemId, type NurseryQuestionId } from '../data/projects/nursery';
import { INRICHT_PROJECT_BY_ID, LUNA_PROJECT, type InrichtProject } from '../data/projects';
import { MIN_PLACEMENT_SCALE, MAX_PLACEMENT_SCALE, SCALE_STEP } from './roomInventory';
import { commitLocalState, readDocument, readLocalState } from './localState';
import { OPDRACHT_BONUS } from './economie';
/**
 * De motor achter elke inrichtopdracht (zie data/projects/index.ts). Het
 * scherm kiest welke opdracht actief is; zonder keuze is dat Luna's kamer.
 */
let P: InrichtProject = LUNA_PROJECT;
export function kiesProject(id: string) { P = INRICHT_PROJECT_BY_ID[id] ?? LUNA_PROJECT; }
export const actiefProject = () => P;
export const NURSERY_KEY = LUNA_PROJECT.key;
const ITEMS = () => P.items;
const BUDGET = () => P.budget;
/** Hoe hoog iets mag: bij vrij versieren ook aan de muur. */
const Y_MIN = () => (P.vrij ? 18 : 70);
export type NurseryStage = 'brief' | 'height' | 'space' | 'shop' | 'total' | 'change' | 'rug' | 'decorate' | 'complete';
const STAGES: NurseryStage[] = ['brief', 'height', 'space', 'shop', 'total', 'change', 'rug', 'decorate', 'complete'];
export interface NurseryState { version: 1; revision: number; stage: NurseryStage; basket: NurseryItemId[]; helped: NurseryQuestionId[]; solved: NurseryQuestionId[]; positions: Partial<Record<NurseryItemId, { x: number; y: number; scale?: number }>> }
export const emptyNursery = (): NurseryState => ({ version: 1, revision: 0, stage: 'brief', basket: [], helped: [], solved: [], positions: {} });
export const nurseryTotal = (state: NurseryState) => ITEMS().filter(item => state.basket.includes(item.id)).reduce((sum, item) => sum + item.price, 0);
export function loadNursery(projectId?: string): NurseryState {
  if (!projectId) return lees();
  const vorige = P; kiesProject(projectId);
  try { return lees(); } finally { P = vorige; }
}
function lees(): NurseryState {
  try {
    const raw = JSON.parse(readDocument(P.key) ?? 'null');
    if (raw?.version !== 1 || !STAGES.includes(raw.stage)) return emptyNursery();
    const state = emptyNursery(); state.revision = Number.isSafeInteger(raw.revision) && raw.revision >= 0 ? raw.revision : 0; state.stage = raw.stage;
    state.basket = ITEMS().filter(item => raw.basket?.includes(item.id)).map(item => item.id);
    state.helped = NURSERY_QUESTIONS.filter(id => raw.helped?.includes(id)); state.solved = NURSERY_QUESTIONS.filter(id => raw.solved?.includes(id));
    for (const item of state.basket) { const p = raw.positions?.[item]; if (Number.isFinite(p?.x) && Number.isFinite(p?.y)) state.positions[item] = { x: Math.max(5, Math.min(95, p.x)), y: Math.max(Y_MIN(), Math.min(92, p.y)), scale: nurseryScale(p.scale) }; }
    return state;
  } catch { return emptyNursery(); }
}
function save(previous: NurseryState, next: NurseryState, reward?: { id: string; amount: number }): boolean {
  if (loadNursery().revision !== previous.revision) return false;
  return commitLocalState({ [P.key]: JSON.stringify({ ...next, revision: previous.revision + 1 }) }, reward ? [reward] : []).status === 'applied';
}
export function beginNursery(): boolean { const s = loadNursery(); return s.stage === 'brief' && save(s, { ...s, stage: 'height' }); }
export function nurseryQuestion(state: NurseryState) {
  const total = nurseryTotal(state);
  const questions = {
    height: P.vragen.height,
    space: P.vragen.space,
    total: { prompt: 'Hoeveel kost jouw gekozen inrichting samen?', answer: total, unit: 'projectmunten', hint: `${ITEMS().filter(i => state.basket.includes(i.id)).map(i => i.price).join(' + ')} = ${total}.` },
    change: { prompt: `Je budget is ${BUDGET()}. Je inrichting kost ${total}. Hoeveel houd je over?`, answer: BUDGET() - total, unit: 'projectmunten', hint: `${BUDGET()} − ${total} = ${BUDGET() - total}. Het restant blijft in dit project.` },
    rug: P.vragen.rug,
  };
  return NURSERY_QUESTIONS.includes(state.stage as NurseryQuestionId) ? questions[state.stage as NurseryQuestionId] : null;
}
/**
 * De antwoordbellen bij een rekenstap: het goede antwoord en de fouten die
 * kinderen echt maken (een nul te veel of te weinig, vergeten af te trekken).
 * Vaste volgorde per vraag, zodat de bellen niet verspringen bij opnieuw laden.
 */
export function nurseryChoices(state: NurseryState): number[] {
  const q = nurseryQuestion(state); if (!q) return [];
  const total = nurseryTotal(state), id = state.stage as NurseryQuestionId;
  const valkuilen: Record<NurseryQuestionId, number[]> = {
    height: P.vragen.height.valkuilen, space: P.vragen.space.valkuilen, total: [total + 50, total - 45, BUDGET()],
    change: [total, BUDGET() - total + 100, BUDGET()], rug: P.vragen.rug.valkuilen,
  };
  const lijst = [...new Set([q.answer, ...valkuilen[id]].map(n => Math.round(n * 100) / 100))].filter(n => n >= 0).slice(0, 4);
  const draai = (id.length + total) % lijst.length;
  return [...lijst.slice(draai), ...lijst.slice(0, draai)];
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
  const amount = s.helped.includes(id) ? 0 : TASK_REWARDS.nurseryStep;
  return save(s, { ...s, solved: [...s.solved, id], stage: stages[id] }, { id: `${P.beloningPrefix}:question:${id}`, amount }) ? 'correct' : 'save-failed';
}
export function toggleNurseryItem(revision: number, id: NurseryItemId): boolean {
  const s = loadNursery(); if (s.revision !== revision || s.stage !== 'shop' || !ITEMS().some(i => i.id === id)) return false;
  const next = { ...s, basket: s.basket.includes(id) ? s.basket.filter(i => i !== id) : [...s.basket, id] };
  return nurseryTotal(next) <= BUDGET() && save(s, next);
}
export function checkoutNursery(revision: number): boolean {
  const s = loadNursery();
  return s.revision === revision && s.stage === 'shop' && ITEMS().filter(i => i.required).every(i => s.basket.includes(i.id)) && nurseryTotal(s) <= BUDGET() && save(s, { ...s, stage: 'total' });
}
export const nurseryScale = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? Math.max(MIN_PLACEMENT_SCALE, Math.min(MAX_PLACEMENT_SCALE, Math.round(value * 100) / 100)) : 1;
export function nurseryPoint(id: NurseryItemId, x: number, y: number, scale = 1) {
  const width = ITEMS().find(i => i.id === id)!.width * nurseryScale(scale);
  return { x: Math.max(width / 2 + 2, Math.min(98 - width / 2, x)), y: Math.max(Y_MIN(), Math.min(92, y)), scale: nurseryScale(scale) };
}
/** Bestaande plaatsingen blijven staan; nieuwe meubels staan direct klaar om te slepen. */
export function prepareNurseryRoom(): boolean {
  const s = loadNursery();
  if (s.stage !== 'decorate') return false;
  const missing = s.basket.filter(id => !s.positions[id]);
  if (!missing.length) return true;
  const positions = { ...s.positions };
  for (const id of missing) positions[id] = nurseryPoint(id, P.start[id] ?? 50, P.vrij && ITEMS().find(i => i.id === id)?.muur ? 40 : 84);
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
  if (!ITEMS().filter(i => i.required).every(i => s.basket.includes(i.id)) || s.basket.some(id => !s.positions[id] || s.positions[id]!.y < Y_MIN())) return false;
  if (P.vrij) return true;
  if (P.regels.some(r => { const x = s.positions[r.id]?.x; return x === undefined || (r.kant === 'links' ? x >= 42 : x <= 50); })) return false;
  for (let i = 0; i < s.basket.length; i++) for (let j = i + 1; j < s.basket.length; j++) {
    const a = ITEMS().find(x => x.id === s.basket[i])!, b = ITEMS().find(x => x.id === s.basket[j])!;
    if (Math.abs(s.positions[a.id]!.x - s.positions[b.id]!.x) < (a.width * (s.positions[a.id]!.scale ?? 1) + b.width * (s.positions[b.id]!.scale ?? 1)) / 2 + 1) return false;
  }
  return true;
}
export function finishNursery(revision: number): boolean {
  const s = loadNursery();
  if (s.revision !== revision || s.stage !== 'decorate' || NURSERY_QUESTIONS.some(id => !s.solved.includes(id)) || !nurseryLayoutReady(s)) return false;
  return save(s, { ...s, stage: 'complete' }, { id: `${P.beloningPrefix}:finish`, amount: Math.round((P.verkoop ?? OPDRACHT_BONUS.inrichten) * s.solved.filter(id => !s.helped.includes(id)).length / NURSERY_QUESTIONS.length) });
}
export function nurseryEarned(): number {
  try { return Object.entries(readLocalState().appliedTransactions).filter(([id]) => id.startsWith(`${P.beloningPrefix}:`)).reduce((sum, [, amount]) => sum + amount, 0); } catch { return 0; }
}
