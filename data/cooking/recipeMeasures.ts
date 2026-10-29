import type { InventoryUnit } from './types';

// Ingredient-specific reference estimates, not universal teaspoon-to-gram conversions.
// King Arthur weight chart: baking powder 4 g/tsp, table salt 6 g/tsp.
// Metric measuring spoons: 5 ml/tsp. Stock is rounded up once per recipe amount.
const measures: Record<string, { unit: InventoryUnit; perTeaspoon: number }> = {
  'baking-powder': { unit: 'gram', perTeaspoon: 4 },
  salt: { unit: 'gram', perTeaspoon: 6 },
  'vanilla-extract': { unit: 'milliliter', perTeaspoon: 5 },
};
export function recipeSpoonStock(ingredientId: string, quarterTeaspoons: number) {
  const measure = measures[ingredientId];
  if (!measure || !Number.isSafeInteger(quarterTeaspoons) || quarterTeaspoons <= 0) throw new Error('Unsupported recipe measure');
  return { amount: Math.ceil(measure.perTeaspoon * quarterTeaspoons / 4), unit: measure.unit };
}
