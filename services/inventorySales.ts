import { DECOR_PRODUCTS_BY_ID } from '../data/decorCatalog';
import { SHOP_PRODUCTS_BY_ID } from '../data/shopCatalog';
import { COOKING_PROGRESS_KEY, loadCookingProgress } from './cookingProgress';
import { commitLocalState, readLocalState } from './localState';
import { availableRoomQuantity, loadRoomInventory, ROOM_INVENTORY_KEY } from './roomInventory';

export const resalePrice = (price: number): number => Number.isFinite(price) && price > 0 ? Math.floor(price * 70 / 100) : 0;

/** Stock and wallet are written together. Only unplaced items/full grocery units can be sold. */
export function sellInventoryItem(kind: 'decor' | 'groceries', productId: string, transactionId: string): boolean {
  try {
    if (!transactionId) return false;
    const id = `sale:${transactionId}`;
    if (Object.prototype.hasOwnProperty.call(readLocalState().appliedTransactions, id)) return false;
    if (kind === 'decor') {
      const product = DECOR_PRODUCTS_BY_ID[productId];
      const inventory = loadRoomInventory();
      if (!product || availableRoomQuantity(inventory, productId) < 1) return false;
      inventory.owned[productId] -= 1;
      if (!inventory.owned[productId]) delete inventory.owned[productId];
      return commitLocalState({ [ROOM_INVENTORY_KEY]: JSON.stringify(inventory) }, [{ id, amount: resalePrice(product.price) }]).status === 'applied';
    }
    const product = SHOP_PRODUCTS_BY_ID[productId];
    const progress = loadCookingProgress();
    if (!product || productId === 'yogurt-grams' || (progress.inventory.consumables[productId] ?? 0) < product.unitAmount) return false;
    progress.inventory.consumables[productId] -= product.unitAmount;
    progress.revision = (progress.revision ?? 0) + 1;
    return commitLocalState({ [COOKING_PROGRESS_KEY]: JSON.stringify(progress) }, [{ id, amount: resalePrice(product.price) }]).status === 'applied';
  } catch { return false; }
}
