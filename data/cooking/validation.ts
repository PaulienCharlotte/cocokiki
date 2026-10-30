import inventory from '../../public/assets/library/inventory.json';
import { INGREDIENTS_BY_ID, EQUIPMENT_BY_ID } from './catalog';
import { INGREDIENT_DISCOVERIES_BY_ID } from './discovery';
import { SHOP_PRODUCTS_BY_ID } from '../shopCatalog';
import type { RecipeConfig } from './types';
import { canonicalQuantity } from './quantities';
import { memoryConfigIssues } from './nutrientMemory';

const knownAssets = new Set(inventory.assets.map(item => item.path));
export function hasCookingAsset(path: string): boolean { return typeof path === 'string' && knownAssets.has(path.split('?')[0]); }
export function getRecipeAssetPaths(recipe: RecipeConfig): string[] {
  const paths = [recipe.image, recipe.preparation?.finishedAsset ?? ''];
  for (const item of recipe.ingredients) paths.push(INGREDIENTS_BY_ID[item.ingredientId]?.image ?? '');
  for (const id of recipe.equipmentIds) paths.push(EQUIPMENT_BY_ID[id]?.image ?? '');
  for (const challenge of recipe.education?.math ?? []) {
    const ids = challenge.type === 'recipe-scaling' ? challenge.quantities.map(item => item.ingredientId)
      : challenge.type === 'sequence-ordering' ? challenge.actions.map(item => item.assetId)
      : [challenge.ingredientId, ...(challenge.type === 'interactive-weighing' ? ['bowl'] : [])];
    for (const id of ids) paths.push(INGREDIENTS_BY_ID[id]?.image ?? EQUIPMENT_BY_ID[id]?.image ?? '');
  }
  for (const step of recipe.preparation?.steps ?? []) {
    paths.push(step.asset);
    if (step.mechanic === 'collect') paths.push(...step.tools.map(item => item.asset));
    if (step.mechanic === 'drag' && step.dropTarget.asset) paths.push(step.dropTarget.asset);
    if (step.mechanic === 'repeat') paths.push(...(step.vesselByCount ?? []), ...(step.toolByCount ?? []), ...(step.tapTool ? [step.tapTool.asset] : []));
    if (step.mechanic === 'heat') paths.push(step.addition.asset);
    if (step.mechanic === 'timed') paths.push(step.pouredAsset, step.cookedAsset);
    if (step.mechanic === 'measure') paths.push(step.vesselAsset);
    if (step.mechanic === 'portion') paths.push(step.panAsset, step.linerAsset, step.toppingAsset, ...(step.linerFilledAsset ? [step.linerFilledAsset] : []));
    if (step.mechanic === 'oven') paths.push(step.panAsset, step.resultAsset, '/assets/library/treehouse/furnishings/oven.webp', '/assets/library/treehouse/furnishings/oven-open.webp');
  }
  return [...new Set(paths)];
}
export function getRecipeIssues(recipe: RecipeConfig): string[] {
  const issues: string[] = [];
  const preparation = recipe.preparation;
  if (recipe.education?.nutrientMemory?.enabled) issues.push(...memoryConfigIssues(recipe.education.nutrientMemory));
  const tips = recipe.cookingTips ?? [];
  if (new Set(tips.map(tip => tip.id)).size !== tips.length) issues.push('tips:duplicate-id');
  for (const tip of tips) {
    if (!tip.id || !tip.title || !tip.text || tip.character !== 'coco') issues.push(`tips:invalid:${tip.id}`);
    if (tip.displayMode && !['contextual', 'completion'].includes(tip.displayMode)) issues.push(`tips:display-mode:${tip.id}`);
    if (tip.triggerStepId && !preparation?.steps.some(step => step.id === tip.triggerStepId)) issues.push(`tips:unknown-step:${tip.triggerStepId}`);
    if (tip.displayMode !== 'completion' && !tip.triggerStepId) issues.push(`tips:trigger-missing:${tip.id}`);
  }
  if (recipe.contentStatus !== 'ready') issues.push('content-pending');
  if (!preparation || preparation.version < 1 || !preparation.steps.length || preparation.consumption !== 'on-completion') issues.push('preparation-missing');
  const steps = preparation?.steps ?? [];
  if (new Set(steps.map(step => step.id)).size !== steps.length) issues.push('duplicate-step');
  for (const step of steps) {
    if (!step.id || !step.title || !step.instruction || !Number.isFinite(step.target) || step.target <= 0) issues.push(`invalid-step:${step.id}`);
    if (!['collect', 'drag', 'repeat', 'weigh', 'heat', 'timed', 'optional', 'measure', 'portion', 'oven'].includes(step.mechanic)) issues.push(`unsupported:${step.id}`);
    if (step.mechanic === 'measure' && (!step.increments.length || step.increments.some(n => !Number.isSafeInteger(n) || n <= 0) || step.maximum < step.target || !step.unitLabel)) issues.push(`measure:${step.id}`);
    if (step.mechanic === 'portion' && (!Number.isSafeInteger(step.target) || step.target > 24 || !Number.isSafeInteger(step.columns) || step.columns < 1 || step.columns > 6)) issues.push(`portion:${step.id}`);
    if (step.mechanic === 'portion' && step.positions && (step.positions.length !== step.target || step.positions.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < 0 || p.x > 100 || p.y < 0 || p.y > 100))) issues.push(`portion-layout:${step.id}`);
    if (step.mechanic === 'oven' && (Object.values(step.oven).some(n => !Number.isFinite(n) || n <= 0) || step.oven.minimumMinutes > step.oven.maximumMinutes || step.oven.targetTemperature > 260)) issues.push(`oven:${step.id}`);
    if (step.mechanic === 'oven' && (!Number.isSafeInteger(step.portions) || step.portions < 1 || step.portions > 24 || step.oven.minimumTemperature > step.oven.targetTemperature || step.oven.maximumTemperature < step.oven.targetTemperature || step.oven.minimumSelectableMinutes > step.oven.minimumMinutes || step.oven.maximumSelectableMinutes < step.oven.maximumMinutes)) issues.push(`oven-range:${step.id}`);
    if (step.mechanic === 'collect' && (!step.tools.length || step.target !== step.tools.length || step.tools.some(tool => !recipe.equipmentIds.includes(tool.id)))) issues.push(`tools:${step.id}`);
    if (step.mechanic === 'weigh' && (!step.increments.length || step.maximum < step.target || step.increments.some(value => value <= 0))) issues.push(`weigh:${step.id}`);
    if (step.mechanic === 'heat' && !step.levels.some(level => level.value === step.target)) issues.push(`heat:${step.id}`);
    if (step.mechanic === 'timed' && (!Number.isFinite(step.durationMs) || step.durationMs < 0)) issues.push(`timer:${step.id}`);
    if (step.mechanic === 'optional' && !step.choices.length) issues.push(`choices:${step.id}`);
  }
  if (!recipe.ingredients.length || new Set(recipe.ingredients.map(item => item.ingredientId)).size !== recipe.ingredients.length) issues.push('ingredients-invalid');
  for (const item of recipe.ingredients) {
    const quantity = canonicalQuantity(item);
    const ingredient = INGREDIENTS_BY_ID[item.ingredientId];
    const discovery = INGREDIENT_DISCOVERIES_BY_ID[item.ingredientId];
    if (item.optionalPortion && (!Number.isSafeInteger(item.optionalPortion.amount) || item.optionalPortion.amount <= 0 || item.optionalPortion.amount >= item.amount || !steps.some(step => step.id === item.optionalPortion!.stepId && step.mechanic === 'portion'))) issues.push(`optional-quantity:${item.ingredientId}`);
    if (!quantity || quantity.amount <= 0 || quantity.unit !== SHOP_PRODUCTS_BY_ID[item.ingredientId]?.unit) issues.push(`unit:${item.ingredientId}`);
    if (ingredient?.contentStatus !== 'ready' || !discovery?.questions.length) issues.push(`discovery:${item.ingredientId}`);
    if (discovery?.questions.some(question => !question.options.some(option => option.id === question.correctOptionId))) issues.push(`question:${item.ingredientId}`);
  }
  if (recipe.equipmentIds.some(id => EQUIPMENT_BY_ID[id]?.contentStatus !== 'ready')) issues.push('equipment-pending');
  const math = recipe.education?.math ?? [];
  if (!math.length || new Set(math.map(item => item.id)).size !== math.length) issues.push('math-missing');
  for (const challenge of math) {
    if (!challenge.id || !challenge.instruction || !Number.isSafeInteger(challenge.rewardCoins) || challenge.rewardCoins < 0
      || !['quantity-selection', 'recipe-scaling', 'interactive-weighing', 'sequence-ordering'].includes(challenge.type)) issues.push(`math-invalid:${challenge.id}`);
    if (challenge.type === 'quantity-selection' && (!Number.isFinite(challenge.correctQuantity) || challenge.correctQuantity < challenge.minimum || challenge.correctQuantity > challenge.maximum || !Number.isFinite(challenge.step ?? 1) || (challenge.step ?? 1) <= 0)) issues.push(`math-range:${challenge.id}`);
    if (challenge.type === 'recipe-scaling' && (!challenge.quantities.length || challenge.quantities.some(item => !Number.isFinite(item.target) || item.target < 0 || !Number.isFinite(item.step) || item.step <= 0))) issues.push(`math-scaling:${challenge.id}`);
    if (challenge.type === 'interactive-weighing' && (!Number.isFinite(challenge.targetGrams) || challenge.targetGrams <= 0 || !challenge.increments.length || challenge.increments.some(value => !Number.isFinite(value) || value <= 0))) issues.push(`math-weight:${challenge.id}`);
    if (challenge.type === 'sequence-ordering' && (!challenge.actions.length || new Set(challenge.actions.map(item => item.id)).size !== challenge.actions.length || challenge.initialOrder.length !== challenge.actions.length || new Set(challenge.initialOrder).size !== challenge.actions.length || challenge.initialOrder.some(id => !challenge.actions.some(item => item.id === id)))) issues.push(`math-sequence:${challenge.id}`);
  }
  if (getRecipeAssetPaths(recipe).some(path => !hasCookingAsset(path))) issues.push('asset-missing');
  return issues;
}
