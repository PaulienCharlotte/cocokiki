import type { CookingProgressState, RecipeConfig } from '../data/cooking/types';
import type { CookingSession } from '../data/cooking/preparation';
import { beginCookingAttempt, completeCookingAttempt } from './cookingSession';
import { loadCookingProgress, saveCookingProgress } from './cookingProgress';

/** The component knows cooking, not the owner or persistence of a cooking attempt. */
export interface CookingStorageAdapter {
  load(): CookingProgressState;
  begin(progress: CookingProgressState, recipe: RecipeConfig, replay?: boolean): CookingProgressState;
  complete(progress: CookingProgressState, recipe: RecipeConfig, session: CookingSession): ReturnType<typeof completeCookingAttempt>;
  save(progress: CookingProgressState, presentationOnly?: boolean): boolean | Promise<boolean>;
}

export const defaultCookingStorage: CookingStorageAdapter = {
  load: loadCookingProgress,
  begin: beginCookingAttempt,
  complete: completeCookingAttempt,
  save: (progress, presentationOnly) => saveCookingProgress(progress, undefined, presentationOnly ? { rewards: false } : undefined),
};
