import type { CookingProgressState, RecipeConfig } from '../data/cooking/types';
import { canonicalQuantity } from '../data/cooking/quantities';
import { SHOP_PRODUCTS_BY_ID } from '../data/shopCatalog';

export function ingredientRequirements(recipe: RecipeConfig, progress: CookingProgressState, prepaidIds: string[] = []) {
  return recipe.ingredients.map(item => {
    const product = SHOP_PRODUCTS_BY_ID[item.ingredientId];
    const quantity = canonicalQuantity(item);
    const compatible = !!quantity && quantity.unit === product?.unit;
    const available = progress.inventory.consumables[item.ingredientId] ?? 0;
    const required = prepaidIds.includes(item.ingredientId) ? 0 : quantity?.amount ?? item.amount;
    return { ...item, name: product?.name ?? item.ingredientId, compatible, available, required, missing: compatible ? Math.max(0, required - available) : required, sufficient: compatible && available >= required };
  });
}

/** Validate the entire recipe before making any deduction. Legacy prepaid items are retained. */
export function consumeRecipeIngredients(progress: CookingProgressState, recipe: RecipeConfig) {
  const journey = progress.journeys[recipe.id];
  const effectiveRecipe = { ...recipe, ingredients: recipe.ingredients.map(item => {
    const optional = item.optionalPortion;
    return optional && progress.preparationSessions[recipe.id]?.steps[optional.stepId]?.choice !== optional.selectedChoice
      ? { ...item, amount: item.amount - optional.amount } : item;
  }) };
  const requirements = ingredientRequirements(effectiveRecipe, progress, journey?.consumedIngredientIds);
  if (!journey || requirements.some(item => !item.sufficient)) return { ok: false, progress, missing: requirements.filter(item => !item.sufficient) };
  const next = structuredClone(progress);
  for (const item of requirements) {
    next.inventory.consumables[item.ingredientId] = item.available - item.required;
    if (!next.journeys[recipe.id]!.consumedIngredientIds.includes(item.ingredientId)) next.journeys[recipe.id]!.consumedIngredientIds.push(item.ingredientId);
  }
  return { ok: true, progress: next, missing: [] };
}

export function missingIngredientMessage(recipe: RecipeConfig, progress: CookingProgressState, prepaidIds: string[] = []): string | null {
  const missing = ingredientRequirements(recipe, progress, prepaidIds).filter(item => !item.sufficient);
  if (!missing.length) return null;
  if (missing.some(item => !item.compatible)) return 'Dit recept is nog niet helemaal klaar. Je voorraad blijft bewaard.';
  return `Je hebt nog ${missing.map(item => `${item.missing}${item.unit === 'gram' ? ' g' : item.unit === 'milliliter' ? ' ml' : ''} ${item.name.toLowerCase()}`).join(', ')} nodig. Haal die eerst in de winkel. Je voorraad blijft bewaard.`;
}
