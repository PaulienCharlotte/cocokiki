import { DECOR_PRODUCTS_BY_ID } from '../data/decorCatalog';

export const ROOM_INVENTORY_KEY = 'cocokiki:room-inventory:v1';
export const ROOM_INVENTORY_CHANGE_EVENT = 'cocokiki:room-inventory-change';

export interface RoomInventoryState {
  version: 1;
  owned: Record<string, number>;
  appliedTransactions: string[];
}

export function createEmptyRoomInventory(): RoomInventoryState {
  return { version: 1, owned: {}, appliedTransactions: [] };
}

export function loadRoomInventory(): RoomInventoryState {
  try {
    const parsed = JSON.parse(localStorage.getItem(ROOM_INVENTORY_KEY) ?? 'null') as Partial<RoomInventoryState> | null;
    if (!parsed || parsed.version !== 1 || !parsed.owned || typeof parsed.owned !== 'object') return createEmptyRoomInventory();
    const owned = Object.fromEntries(Object.entries(parsed.owned)
      .filter(([id, amount]) => DECOR_PRODUCTS_BY_ID[id] && Number.isInteger(amount) && amount > 0)
      .map(([id, amount]) => [id, Math.min(99, amount as number)]));
    const appliedTransactions = Array.isArray(parsed.appliedTransactions)
      ? [...new Set(parsed.appliedTransactions.filter(id => typeof id === 'string'))]
      : [];
    return { version: 1, owned, appliedTransactions };
  } catch {
    return createEmptyRoomInventory();
  }
}

export function saveRoomInventory(state: RoomInventoryState): boolean {
  try {
    localStorage.setItem(ROOM_INVENTORY_KEY, JSON.stringify(state));
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
    version: 1,
    owned: { ...state.owned },
    appliedTransactions: [...state.appliedTransactions, transactionId],
  };
  for (const [id, amount] of purchases) next.owned[id] = Math.min(99, (next.owned[id] ?? 0) + amount);
  return next;
}

