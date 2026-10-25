import type { InventoryUnit } from './types';
export type QuantityUnit = InventoryUnit | 'kilogram' | 'liter';
export interface Quantity { amount: number; unit: QuantityUnit }
export function canonicalQuantity(quantity: Quantity): { amount: number; unit: InventoryUnit } | null {
  if (!Number.isFinite(quantity.amount) || quantity.amount < 0) return null;
  const factor = quantity.unit === 'kilogram' || quantity.unit === 'liter' ? 1000 : 1;
  const unit = quantity.unit === 'kilogram' ? 'gram' : quantity.unit === 'liter' ? 'milliliter' : quantity.unit;
  if (!['piece', 'gram', 'milliliter'].includes(unit)) return null;
  const amount = quantity.amount * factor;
  return Number.isSafeInteger(amount) ? { amount, unit: unit as InventoryUnit } : null;
}
export function convertQuantity(quantity: Quantity, target: QuantityUnit): number | null {
  const source = canonicalQuantity(quantity);
  const destination = canonicalQuantity({ amount: 1, unit: target });
  return source && destination && source.unit === destination.unit ? source.amount / destination.amount : null;
}
