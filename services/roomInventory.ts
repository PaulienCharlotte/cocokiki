import { DECOR_PRODUCTS_BY_ID } from '../data/decorCatalog';
import { isExtraRoom, type TreehouseRoomId } from '../data/treehouse';
import { ownsRoom } from './roomExpansions';
import { commitLocalState, readDocument } from './localState';

export const ROOM_INVENTORY_KEY = 'cocokiki:room-inventory:v1';
export const ROOM_INVENTORY_CHANGE_EVENT = 'cocokiki:room-inventory-change';

export interface RoomInventoryState {
  version: 1;
  owned: Record<string, number>;
  appliedTransactions: string[];
  placements: RoomPlacement[];
}

export interface RoomPlacement {
  id: string;
  productId: string;
  room: TreehouseRoomId;
  x: number;
  y: number;
  /** Welk aanzicht van het meubel naar voren staat. */
  view: number;
  /** Vergroting ten opzichte van de standaardmaat. */
  scale: number;
  /** Extra dieptelaag; oude plaatsingen blijven automatisch op hun vloerdiepte. */
  layer?: number;
  /** Bij een plant: welke geadopteerde plant hier staat, zodat zijn naam meereist. */
  plantId?: string;
}

export const MIN_PLACEMENT_SCALE = .6;
export const MAX_PLACEMENT_SCALE = 1.8;
const SCALE_STEP = .15;

function clampScale(value: unknown): number {
  const scale = typeof value === 'number' && Number.isFinite(value) ? value : 1;
  return Math.min(MAX_PLACEMENT_SCALE, Math.max(MIN_PLACEMENT_SCALE, Math.round(scale * 100) / 100));
}

function clampView(value: unknown, views: number): number {
  const view = typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : 0;
  return ((view % views) + views) % views;
}

export function createEmptyRoomInventory(): RoomInventoryState {
  return { version: 1, owned: {}, appliedTransactions: [], placements: [] };
}

export function availableRoomQuantity(state: RoomInventoryState, productId: string): number {
  return Math.max(0, (state.owned[productId] ?? 0) - state.placements.filter(item => item.productId === productId).length);
}

export function placeRoomItem(state: RoomInventoryState, item: RoomPlacement, restoring = false): RoomInventoryState {
  const product = DECOR_PRODUCTS_BY_ID[item.productId];
  if (!product || !((restoring && isExtraRoom(item.room)) || ownsRoom(item.room)) || !item.id || state.placements.some(entry => entry.id === item.id) || availableRoomQuantity(state, item.productId) < 1 || !Number.isFinite(item.x) || !Number.isFinite(item.y)) return state;
  return { ...state, placements: [...state.placements, {
    ...item,
    x: Math.max(3, Math.min(97, item.x)),
    y: Math.max(12, Math.min(95, item.y)),
    view: clampView(item.view, product.views),
    scale: clampScale(item.scale),
    ...(item.layer !== undefined ? { layer: Number.isSafeInteger(item.layer) ? Math.max(-10000, Math.min(10000, item.layer!)) : 0 } : {}),
    ...(typeof item.plantId === 'string' && item.plantId ? { plantId: item.plantId } : {}),
  }] };
}

/** Draait het meubel een aanzicht verder; stap -1 draait de andere kant op. */
export function turnRoomItem(state: RoomInventoryState, id: string, step: number): RoomInventoryState {
  const placement = state.placements.find(item => item.id === id);
  const product = placement && DECOR_PRODUCTS_BY_ID[placement.productId];
  if (!placement || !product || product.views < 2) return state;
  return { ...state, placements: state.placements.map(item => item.id === id
    ? { ...item, view: clampView(item.view + step, product.views) }
    : item) };
}

/** Maakt het meubel een stap groter of kleiner, binnen vaste grenzen. */
export function resizeRoomItem(state: RoomInventoryState, id: string, step: number): RoomInventoryState {
  if (!state.placements.some(item => item.id === id)) return state;
  return { ...state, placements: state.placements.map(item => item.id === id
    ? { ...item, scale: clampScale(item.scale + step * SCALE_STEP) }
    : item) };
}

export function moveRoomItem(state: RoomInventoryState, id: string, x: number, y: number): RoomInventoryState {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !state.placements.some(item => item.id === id)) return state;
  return { ...state, placements: state.placements.map(item => item.id === id ? { ...item, x: Math.max(3, Math.min(97, x)), y: Math.max(12, Math.min(95, y)) } : item) };
}

export function returnRoomItem(state: RoomInventoryState, id: string): RoomInventoryState {
  if (!state.placements.some(item => item.id === id)) return state;
  return { ...state, placements: state.placements.filter(item => item.id !== id) };
}

export function roomItemDepth(item: RoomPlacement): number {
  return 1000000 + (item.layer ?? 0) * 100 + (DECOR_PRODUCTS_BY_ID[item.productId]?.category === 'rugs' ? 0 : Math.round(item.y));
}

export function layerRoomItem(state: RoomInventoryState, id: string, direction: -1 | 1): RoomInventoryState {
  const target = state.placements.find(item => item.id === id);
  if (!target) return state;
  const others = state.placements.filter(item => item.room === target.room && item.id !== id);
  const layers = [target.layer ?? 0, ...others.map(item => item.layer ?? 0)];
  const layer = direction === 1 ? Math.max(...layers) + 1 : Math.min(...layers) - 1;
  if (Math.abs(layer) <= 10000) return { ...state, placements: state.placements.map(item => item.id === id ? { ...item, layer } : item) };
  // Normalize a long editing session while preserving the visible order.
  const ordered = others.sort((a, b) => roomItemDepth(a) - roomItemDepth(b));
  if (direction === 1) ordered.push(target); else ordered.unshift(target);
  const ranks = new Map(ordered.map((item, index) => [item.id, index - Math.floor(ordered.length / 2)]));
  return { ...state, placements: state.placements.map(item => ranks.has(item.id) ? { ...item, layer: ranks.get(item.id)! } : item) };
}

export function migrateRoomInventory(value: unknown): RoomInventoryState {
  const empty = createEmptyRoomInventory();
  if (!value || typeof value !== 'object') return empty;
  const parsed = value as Partial<RoomInventoryState>;
  if (parsed.version !== 1 || !parsed.owned || typeof parsed.owned !== 'object') return empty;
  const owned = Object.fromEntries(Object.entries(parsed.owned).filter(([id, amount]) => DECOR_PRODUCTS_BY_ID[id] && Number.isInteger(amount) && amount > 0).map(([id, amount]) => [id, Math.min(99, amount)]));
  let state: RoomInventoryState = { ...empty, owned, appliedTransactions: Array.isArray(parsed.appliedTransactions) ? [...new Set(parsed.appliedTransactions.filter(id => typeof id === 'string'))] : [] };
  if (Array.isArray(parsed.placements)) for (const item of parsed.placements) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string') continue;
    state = placeRoomItem(state, item, true);
  }
  return state;
}

export function loadRoomInventory(): RoomInventoryState {
  try {
    return migrateRoomInventory(JSON.parse(readDocument(ROOM_INVENTORY_KEY) ?? 'null'));
  } catch {
    return createEmptyRoomInventory();
  }
}

export function saveRoomInventory(state: RoomInventoryState): boolean {
  try {
    if (commitLocalState({ [ROOM_INVENTORY_KEY]: JSON.stringify(state) }).status !== 'applied') return false;
    window.dispatchEvent(new CustomEvent(ROOM_INVENTORY_CHANGE_EVENT, { detail: state }));
    return true;
  } catch {
    return false;
  }
}

export function addRoomPurchasesOnce(
  state: RoomInventoryState,
  transactionId: string,
  basket: Record<string, number>,
): RoomInventoryState {
  if (!transactionId || state.appliedTransactions.includes(transactionId)) return state;
  const purchases = Object.entries(basket).filter(([id, amount]) =>
    Boolean(DECOR_PRODUCTS_BY_ID[id]) && Number.isInteger(amount) && amount > 0,
  );
  if (purchases.length === 0) return state;
  const next: RoomInventoryState = {
    ...state,
    owned: { ...state.owned },
    appliedTransactions: [...state.appliedTransactions, transactionId],
  };
  for (const [id, amount] of purchases) next.owned[id] = Math.min(99, (next.owned[id] ?? 0) + amount);
  return next;
}

