import { RECIPES_BY_ID } from '../data/cooking/catalog';
import type { CookingProgressState, RecipeId, ShoppingTransactionItem } from '../data/cooking/types';
import { SHOP_PRODUCTS, SHOP_PRODUCTS_BY_ID } from '../data/shopCatalog';
import { getProductPrice, getShopSeason, SHOP_PRICE_VERSION, type ShopSeason } from '../data/shopPricing';
import { canonicalQuantity } from '../data/cooking/quantities';

export const SHOPPING_SESSION_KEY = 'cocokiki:shopping:v1';

function storageKey(mode: ShoppingSession['mode'], recipeId: RecipeId | null): string {
  return `${SHOPPING_SESSION_KEY}:${mode}:${recipeId ?? 'free'}`;
}

export interface ShoppingPriceSnapshot {
  version: string;
  season: ShopSeason;
  prices: Record<string, number>;
}

export interface ShoppingSession {
  version: 1;
  id: string;
  mode: 'free' | 'recipe';
  recipeId: RecipeId | null;
  basket: Record<string, number>;
  priceSnapshot: ShoppingPriceSnapshot;
  createdAt: string;
}

function sessionId(now: Date): string {
  return `${now.getTime()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createPriceSnapshot(season: ShopSeason): ShoppingPriceSnapshot {
  return {
    version: SHOP_PRICE_VERSION,
    season,
    prices: Object.fromEntries(SHOP_PRODUCTS.map(product => [product.id, getProductPrice(product.id, season)])),
  };
}

export function createShoppingSession(
  mode: ShoppingSession['mode'],
  recipeId: RecipeId | null = null,
  now = new Date(),
  season = getShopSeason(now),
  id = sessionId(now),
): ShoppingSession {
  return { version: 1, id, mode, recipeId, basket: {}, priceSnapshot: createPriceSnapshot(season), createdAt: now.toISOString() };
}

function isSession(value: unknown): value is ShoppingSession {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<ShoppingSession>;
  return item.version === 1 && typeof item.id === 'string'
    && (item.mode === 'free' || item.mode === 'recipe')
    && !!item.priceSnapshot && typeof item.priceSnapshot === 'object'
    && typeof item.priceSnapshot.version === 'string'
    && typeof item.priceSnapshot.prices === 'object'
    && !!item.basket && typeof item.basket === 'object';
}

export function loadShoppingSession(mode: ShoppingSession['mode'], recipeId: RecipeId | null = null): ShoppingSession {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(mode, recipeId)) ?? 'null');
    if (isSession(parsed) && parsed.mode === mode && parsed.recipeId === recipeId) {
      // Keep agreed basket prices; add prices only for newly introduced products.
      const added = SHOP_PRODUCTS.filter(product => !Object.prototype.hasOwnProperty.call(parsed.priceSnapshot.prices, product.id));
      if (!added.length) return parsed;
      const next = { ...parsed, priceSnapshot: { ...parsed.priceSnapshot, prices: { ...parsed.priceSnapshot.prices,
        ...Object.fromEntries(added.map(product => [product.id, getProductPrice(product.id, parsed.priceSnapshot.season)])) } } };
      saveShoppingSession(next);
      return next;
    }
  } catch {
    // A damaged session is replaced below.
  }
  const created = createShoppingSession(mode, recipeId);
  saveShoppingSession(created);
  return created;
}

export function saveShoppingSession(session: ShoppingSession): boolean {
  try {
    localStorage.setItem(storageKey(session.mode, session.recipeId), JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function adjustBasket(session: ShoppingSession, productId: string, delta: number): ShoppingSession {
  if (!SHOP_PRODUCTS_BY_ID[productId] || !Number.isInteger(delta) || delta === 0) return session;
  const next = structuredClone(session);
  const amount = Math.max(0, Math.min(99, (next.basket[productId] ?? 0) + delta));
  if (amount === 0) delete next.basket[productId];
  else next.basket[productId] = amount;
  return next;
}

export function basketCount(session: ShoppingSession): number {
  return Object.values(session.basket).reduce((sum, amount) => sum + amount, 0);
}

export function basketTotal(session: ShoppingSession): number {
  return Object.entries(session.basket).reduce((sum, [id, amount]) => sum + (session.priceSnapshot.prices[id] ?? 0) * amount, 0);
}

export function recipeRequirementStatus(progress: CookingProgressState, recipeId: RecipeId, session?: ShoppingSession) {
  return RECIPES_BY_ID[recipeId].ingredients.map(requirement => {
    const product = SHOP_PRODUCTS_BY_ID[requirement.ingredientId];
    const quantity = canonicalQuantity(requirement);
    const compatible = quantity?.unit === product?.unit;
    const inventory = progress.inventory.consumables[requirement.ingredientId] ?? 0;
    const basket = session ? (session.basket[requirement.ingredientId] ?? 0) * (product?.unitAmount ?? 0) : 0;
    return { ...requirement, inventory, basket, collected: compatible && inventory + basket >= quantity.amount };
  });
}

export type CheckoutStatus = 'success' | 'duplicate' | 'empty' | 'invalid' | 'insufficient';

export interface CheckoutResult {
  status: CheckoutStatus;
  total: number;
  progress: CookingProgressState;
  items: ShoppingTransactionItem[];
}

export function checkoutBasket(
  progress: CookingProgressState,
  session: ShoppingSession,
  walletBalance: number,
  now = new Date().toISOString(),
): CheckoutResult {
  const total = basketTotal(session);
  const existing = progress.shoppingTransactions[session.id];
  if (existing) return { status: 'duplicate', total: existing.total, progress, items: existing.items };
  if (basketCount(session) === 0) return { status: 'empty', total: 0, progress, items: [] };
  if (total <= 0) return { status: 'invalid', total, progress, items: [] };
  if (walletBalance < total) return { status: 'insufficient', total, progress, items: [] };

  const items = Object.entries(session.basket).flatMap(([productId, packages]) => {
    const product = SHOP_PRODUCTS_BY_ID[productId];
    const unitPrice = session.priceSnapshot.prices[productId];
    if (!product || !Number.isInteger(packages) || packages <= 0 || !Number.isInteger(unitPrice) || unitPrice <= 0) return [];
    return [{ productId, packages, quantity: packages * product.unitAmount, unit: product.unit, packageLabel: product.packageLabel, unitPrice }];
  });
  if (items.length !== Object.keys(session.basket).length) return { status: 'invalid', total, progress, items: [] };

  const next = structuredClone(progress);
  for (const item of items) {
    next.inventory.consumables[item.productId] = (next.inventory.consumables[item.productId] ?? 0) + item.quantity;
    next.inventory.acquisitions.push({
      id: `${session.id}:${item.productId}`,
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit,
      packageLabel: item.packageLabel,
      transactionId: session.id,
      acquiredAt: now,
    });
  }
  next.shoppingTransactions[session.id] = {
    id: session.id,
    mode: session.mode,
    recipeId: session.recipeId,
    priceVersion: session.priceSnapshot.version,
    season: session.priceSnapshot.season,
    total,
    items,
    completedAt: now,
  };
  return { status: 'success', total, progress: next, items };
}
