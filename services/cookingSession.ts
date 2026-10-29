import type { CookingProgressState, RecipeConfig } from '../data/cooking/types';
import type { CookingSession } from '../data/cooking/preparation';
import { createCookingSession, stepSatisfied } from '../data/cooking/session';
import { emptyStepState } from '../data/cooking/preparation';
import { getRecipeIssues } from '../data/cooking/validation';
import { completeJourney } from './cookingProgress';
import { consumeRecipeIngredients, missingIngredientMessage } from './recipeInventory';
import { ovenResult } from '../data/cooking/oven';

export function beginCookingAttempt(progress: CookingProgressState, recipe: RecipeConfig, replay = false): CookingProgressState {
  if (getRecipeIssues(recipe).length || !progress.journeys[recipe.id]) return progress;
  const previous = progress.preparationSessions[recipe.id];
  if (!replay && previous) {
    // A removed optional final step must not make a plated dish require serving again.
    if (!previous.completed && recipe.preparation!.steps.every(step => previous.completedStepIds.includes(step.id))) {
      return completeCookingAttempt(progress, recipe, previous).progress;
    }
    return progress;
  }
  const next = structuredClone(progress);
  if (replay) {
    const journey = next.journeys[recipe.id]!;
    journey.stage = 'cooking';
    journey.status = 'active';
    journey.consumedIngredientIds = [];
  }
  next.activeRecipeId = recipe.id;
  next.preparationSessions[recipe.id] = createCookingSession(recipe);
  return next;
}

export function completeCookingAttempt(progress: CookingProgressState, recipe: RecipeConfig, session: CookingSession) {
  const saved = progress.preparationSessions[recipe.id];
  const ovenStep = recipe.preparation?.steps.find(step => step.mechanic === 'oven');
  if (saved?.completed && saved.attemptId === session.attemptId) return { ok: true, progress, message: null };
  if (!saved || saved.attemptId !== session.attemptId || progress.journeys[recipe.id]?.stage !== 'cooking'
    || (ovenStep?.mechanic === 'oven' && (session.oven?.status !== 'served' || session.oven.result !== 'good' || session.oven.trayPlaced || ovenResult(session.oven, ovenStep.oven) !== 'good'))
    || getRecipeIssues(recipe).length || !recipe.preparation!.steps.every(step => session.completedStepIds.includes(step.id) && stepSatisfied(step, session.steps[step.id] ?? emptyStepState()))) {
    return { ok: false, progress, message: 'Deze kookpoging is veranderd. Sluit de keuken en probeer opnieuw.' };
  }
  const consumed = consumeRecipeIngredients(progress, recipe);
  if (!consumed.ok) return { ok: false, progress, message: missingIngredientMessage(recipe, progress, progress.journeys[recipe.id]?.consumedIngredientIds) };
  const completed = completeJourney(consumed.progress, recipe).progress;
  completed.preparationSessions[recipe.id] = { ...session, completed: true, updatedAt: new Date().toISOString() };
  return { ok: true, progress: completed, message: null };
}
