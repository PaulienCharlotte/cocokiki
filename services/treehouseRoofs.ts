import { ROOF_PRODUCTS } from '../data/treehouseRoofs';
import { ROOM_TEMPLATE_ASSETS } from '../data/treehouse';
import type { RoofAsset } from '../data/treehouseUnits';
import { commitLocalState, readDocument, readLocalState } from './localState';
import { loadRoomExpansions, ownsRoom } from './roomExpansions';
import { isBaseRoom, isExtraRoom } from '../data/treehouse';
import { resalePrice } from './inventorySales';

export const TREEHOUSE_ROOFS_KEY = 'cocokiki:treehouse-roofs:v1';
interface RoofPurchase { roomId: string; asset: RoofAsset; purchaseId: string }
export interface RoofState { version: 1; purchases: RoofPurchase[]; equipped: Record<string, RoofAsset> }
const empty = (): RoofState => ({ version: 1, purchases: [], equipped: {} });
const validAsset = (asset: string): asset is RoofAsset => ROOF_PRODUCTS.some(product => product.asset === asset);
function readRoofs(): RoofState | null {
  try {
    const raw = readDocument(TREEHOUSE_ROOFS_KEY);
    if (raw === null) return empty();
    const state = JSON.parse(raw);
    if (state?.version !== 1 || !Array.isArray(state.purchases) || !state.equipped || typeof state.equipped !== 'object' || Array.isArray(state.equipped)) return null;
    if (state.purchases.some((item: RoofPurchase) => !item || !validAsset(item.asset) || !isBaseRoom(item.roomId) && !isExtraRoom(item.roomId) || typeof item.purchaseId !== 'string' || !item.purchaseId)) return null;
    if (new Set(state.purchases.map((item: RoofPurchase) => item.purchaseId)).size !== state.purchases.length) return null;
    if (Object.entries(state.equipped).some(([roomId, asset]) => !validAsset(asset as string) || asset !== 'roof' && !state.purchases.some((item: RoofPurchase) => item.roomId === roomId && item.asset === asset))) return null;
    return state;
  } catch { return null; }
}
export function loadTreehouseRoofs(): RoofState { return readRoofs() ?? empty(); }
export function validTreehouseRoofs(): boolean { return readRoofs() !== null; }
export function roofPrice(roomId: string, asset: RoofAsset): number {
  const state = loadTreehouseRoofs();
  return state.purchases.some(item => item.roomId === roomId && item.asset === asset) ? 0 : ROOF_PRODUCTS.find(item => item.asset === asset)!.price;
}
export function buyRoomRoof(roomId: string, asset: RoofAsset, purchaseId: string, quotedPrice: number) {
  const state = readRoofs(), product = ROOF_PRODUCTS.find(item => item.asset === asset);
  if (!state || !product || !/^[a-zA-Z0-9-]{1,100}$/.test(purchaseId) || !isBaseRoom(roomId) && !isExtraRoom(roomId) || !ownsRoom(roomId as Parameters<typeof ownsRoom>[0]) || roomId === 'terrace') return { status: 'invalid' as const };
  const room = loadRoomExpansions().rooms.find(item => item.id === roomId);
  if (room && ROOM_TEMPLATE_ASSETS[room.template] === 'garden') return { status: 'invalid' as const };
  const previous = state.purchases.find(item => item.purchaseId === purchaseId);
  if (previous) return { status: previous.roomId === roomId && previous.asset === asset ? 'duplicate' as const : 'invalid' as const };
  const cost = roofPrice(roomId, asset);
  if (cost !== quotedPrice) return { status: 'price-changed' as const };
  try { if (Object.hasOwn(readLocalState().appliedTransactions, `roof:buy:${purchaseId}`)) return { status: 'invalid' as const }; } catch { return { status: 'invalid' as const }; }
  const next: RoofState = { ...state, purchases: cost > 0 ? [...state.purchases, { roomId, asset, purchaseId }] : state.purchases, equipped: { ...state.equipped, [roomId]: asset } };
  return commitLocalState({ [TREEHOUSE_ROOFS_KEY]: JSON.stringify(next) }, [{ id: `roof:buy:${purchaseId}`, amount: -cost }]);
}
export function roofSaleAmount(roomId: string): number {
  try {
    const ledger = readLocalState().appliedTransactions;
    return loadTreehouseRoofs().purchases.filter(item => item.roomId === roomId).reduce((sum, item) => sum + resalePrice(-ledger[`roof:buy:${item.purchaseId}`]), 0);
  } catch { return 0; }
}
export function withoutRoomRoofs(roomId: string): RoofState {
  const state = loadTreehouseRoofs(), equipped = { ...state.equipped };
  delete equipped[roomId];
  return { ...state, equipped, purchases: state.purchases.filter(item => item.roomId !== roomId) };
}
