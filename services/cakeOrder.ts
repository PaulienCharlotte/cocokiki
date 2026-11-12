import type { GeplaatsteVersiering } from '../data/cake/types';
import { commitLocalState, readDocument } from './localState';

export const CAKE_ORDER_KEY = 'cocokiki:cake-order:seb-birthday:v1';
export interface CakeOrderState { started: boolean; timed: boolean; elapsed: number; delivered: boolean; reward: number }
export function loadCakeOrder(): CakeOrderState {
  const empty: CakeOrderState = { started: false, timed: false, elapsed: 0, delivered: false, reward: 0 };
  try {
    const value = JSON.parse(readDocument(CAKE_ORDER_KEY) ?? 'null');
    if (!value || typeof value !== 'object') return empty;
    return { started: value.started === true, timed: value.timed === true, elapsed: Number.isFinite(value.elapsed) ? Math.max(0, value.elapsed) : 0, delivered: value.delivered === true, reward: value.reward === 7 ? 7 : value.reward === 5 ? 5 : 0 };
  } catch { return empty; }
}
export function cakeMeetsOrder(bodemId: string, decorations: GeplaatsteVersiering[]): boolean {
  return bodemId.includes('roze') && decorations.some(item => item.versieringId === 'aardbei');
}
export function saveCakeOrder(state: CakeOrderState): boolean {
  return commitLocalState({ [CAKE_ORDER_KEY]: JSON.stringify(state) }).status === 'applied';
}
/** Dezelfde opdracht kan maar één keer muntjes geven, ook na opnieuw openen. */
export function deliverCakeOrder(bodemId: string, decorations: GeplaatsteVersiering[]): CakeOrderState | null {
  const current = loadCakeOrder();
  if (current.delivered) return current;
  if (!current.started || !cakeMeetsOrder(bodemId, decorations)) return null;
  const reward = current.timed && current.elapsed < 300 ? 7 : 5;
  const next = { ...current, delivered: true, reward };
  const result = commitLocalState({ [CAKE_ORDER_KEY]: JSON.stringify(next) }, [{ id: 'cake-order:seb-birthday:v1', amount: reward }]);
  return result.status === 'applied' || result.status === 'duplicate' ? next : null;
}
