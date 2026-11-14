import { DECOR_PRODUCTS_BY_ID } from '../data/decorCatalog';
import { loadRoomInventory } from './roomInventory';
import { commitLocalState, readLocalState } from './localState';
export const DECOR_TASK_ID = 'task:living-corner:v1';
export function decorTaskState() {
  const placements = loadRoomInventory().placements.filter(p => p.room === 'living-room');
  const categories = placements.map(p => DECOR_PRODUCTS_BY_ID[p.productId]?.category);
  const steps = [categories.includes('seating'), categories.includes('tables'), placements.some(p => DECOR_PRODUCTS_BY_ID[p.productId]?.store === 'plants')];
  let claimed = false;
  try { claimed = Object.hasOwn(readLocalState().appliedTransactions, DECOR_TASK_ID); } catch { /* Geen opslag. */ }
  return { steps, claimed, ready: steps.every(Boolean) };
}
export function claimDecorTask(): boolean {
  const state = decorTaskState();
  return state.ready && !state.claimed && commitLocalState({}, [{ id: DECOR_TASK_ID, amount: 15 }]).status === 'applied';
}
