import type { RecipeConfig } from './types';
import { canonicalQuantity } from './quantities';
import { SHOP_PRODUCTS_BY_ID } from '../shopCatalog';
import { SHOP_PRICES } from '../shopPricing';

/** Ook een lege voorraad en het duurste seizoen moeten winst toelaten. */
export function cookedDishValue(recipe: RecipeConfig): number {
  const groceries = recipe.ingredients.reduce((sum, ingredient) => {
    const product = SHOP_PRODUCTS_BY_ID[ingredient.ingredientId];
    const quantity = canonicalQuantity(ingredient);
    if (!product || !quantity || quantity.unit !== product.unit) return sum;
    const prices = SHOP_PRICES[product.id];
    const price = Math.max(product.price, ...Object.values(prices?.seasonal ?? {}));
    return sum + Math.ceil(quantity.amount / product.unitAmount) * price;
  }, 0);
  return groceries + Math.max(20, Math.ceil(groceries / 4));
}
