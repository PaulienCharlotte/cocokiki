import type { CookingProgressState, RecipeConfig } from './types';
import { getRecipeIssues } from './validation';

export function getRecipeAccess(recipe: RecipeConfig, progress?: CookingProgressState) {
  const journey = progress?.journeys[recipe.id];
  const completed = Boolean(progress?.completions[recipe.id]);
  const completedCount = Object.keys(progress?.completions ?? {}).length;
  const remaining = Math.max(0, recipe.requiredCompletedRecipes - completedCount);
  const active = journey?.status === 'active';
  const locked = remaining > 0 && !active && !completed;
  const issues = getRecipeIssues(recipe);
  const ready = issues.length === 0;
  const playable = !locked && ready;
  const status = active ? journey.stage === 'cooking' ? 'Klaar om te koken' : 'Ga verder' : completed ? 'Gemaakt' : locked ? 'Vergrendeld' : ready ? 'Nieuw' : 'Binnenkort';
  const requirement = `Maak eerst ${recipe.requiredCompletedRecipes} ${recipe.requiredCompletedRecipes === 1 ? 'verschillend recept' : 'verschillende recepten'}.`;
  return { active, completed, locked, playable, status, requirement, remaining, issues };
}
