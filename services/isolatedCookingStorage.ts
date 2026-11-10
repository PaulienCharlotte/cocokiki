import type { CookingProgressState, RecipeConfig } from '../data/cooking/types';
import type { CookingSession } from '../data/cooking/preparation';
import { createCookingSession, migrateCookingSession } from '../data/cooking/session';
import { getRecipeIssues } from '../data/cooking/validation';
import { createEmptyDiscoveryState, createEmptyMathState, loadCookingProgress, COOKING_PROGRESS_KEY } from './cookingProgress';
import { completeCookingAttempt } from './cookingSession';
import { commitLocalState, readDocument, readLocalState } from './localState';
import type { CookingStorageAdapter } from './cookingStorage';

export const ISOLATED_COOKING_KEY = 'cocokiki:isolated-cooking:v1';
export const ISOLATED_COOKING_LOCK = 'cocokiki:isolated-cooking-write';
export interface CookingAttemptContext { runId: string; stepId: string; cookingAttemptId: string; recipeId: string }
export interface CookingCompletionReceipt extends CookingAttemptContext {
  id: string;
  recipeVersion: number;
  startedAt: string;
  completedAt: string;
  consumed: Array<{ ingredientId: string; amount: number }>;
}
interface StoredAttempt extends CookingAttemptContext {
  recipeVersion: number;
  revision: number;
  startedAt: string;
  session: CookingSession;
  receipt: CookingCompletionReceipt | null;
}
interface AttemptStore { version: 1; revision: number; attempts: StoredAttempt[] }
const idValid = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,159}$/.test(value);
const dateValid = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const matches = (a: CookingAttemptContext, b: CookingAttemptContext) => a.runId === b.runId && a.stepId === b.stepId && a.cookingAttemptId === b.cookingAttemptId && a.recipeId === b.recipeId;
const operationId = (id: string) => `cooking-consume:${id}`;

function loadStore(): AttemptStore {
  const raw = readDocument(ISOLATED_COOKING_KEY);
  if (raw === null) return { version: 1, revision: 0, attempts: [] };
  const value = JSON.parse(raw) as AttemptStore;
  if (value?.version !== 1 || !Number.isSafeInteger(value.revision) || value.revision < 0 || !Array.isArray(value.attempts)
    || !value.attempts.every(item => item && [item.runId, item.stepId, item.cookingAttemptId, item.recipeId].every(idValid)
      && Number.isSafeInteger(item.revision) && item.revision >= 0 && Number.isSafeInteger(item.recipeVersion) && item.recipeVersion > 0
      && dateValid(item.startedAt) && item.session?.version === 2 && item.session.attemptId === item.cookingAttemptId
      && item.session.recipeId === item.recipeId && item.session.recipeVersion === item.recipeVersion
      && typeof item.session.completed === 'boolean' && Array.isArray(item.session.completedStepIds) && item.session.steps && typeof item.session.steps === 'object'
      && (item.receipt === null ? !item.session.completed : matches(item.receipt, item) && item.session.completed
        && item.receipt.id === operationId(item.cookingAttemptId) && item.receipt.recipeVersion === item.recipeVersion
        && item.receipt.startedAt === item.startedAt && dateValid(item.receipt.completedAt)
        && Array.isArray(item.receipt.consumed) && item.receipt.consumed.every(entry => idValid(entry.ingredientId) && Number.isSafeInteger(entry.amount) && entry.amount >= 0)))
    || new Set(value.attempts.map(item => item.cookingAttemptId)).size !== value.attempts.length
    || new Set(value.attempts.map(item => JSON.stringify([item.runId, item.stepId, item.recipeId]))).size !== value.attempts.length) throw Error('invalid-isolated-cooking');
  return value;
}

function cookingData() {
  // Unlike the legacy tolerant reader, never turn corrupt stock into an empty stock write.
  const raw = readDocument(COOKING_PROGRESS_KEY);
  const parsed = raw === null ? null : JSON.parse(raw);
  if (parsed !== null && (parsed.version !== 1 || !parsed.inventory || !parsed.journeys || !parsed.preparationSessions)) throw Error('invalid-cooking-stock');
  return { progress: loadCookingProgress(), raw: parsed };
}

/** Web Locks serializes participating tabs. Unsupported browsers fail closed on writes. */
export async function withIsolatedCookingLock<T>(work: () => T): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.locks?.request) throw Error('cooking-lock-unavailable');
  return navigator.locks.request(ISOLATED_COOKING_LOCK, { mode: 'exclusive' }, work);
}

export function createIsolatedCookingStorage(recipe: RecipeConfig, context: CookingAttemptContext, options: {
  now?: () => string;
  withLock?: <T>(work: () => T) => Promise<T>;
} = {}): CookingStorageAdapter & { receipt(): CookingCompletionReceipt | null } {
  recipe = structuredClone(recipe); context = structuredClone(context);
  if (![context.runId, context.stepId, context.cookingAttemptId, context.recipeId].every(idValid)
    || context.recipeId !== recipe.id || !recipe.preparation || getRecipeIssues(recipe).length) throw Error('invalid-cooking-context');
  const now = () => { const value = (options.now ?? (() => new Date().toISOString()))(); if (!dateValid(value)) throw Error('invalid-clock'); return value; };
  const readAttempt = (store: AttemptStore) => {
    const item = store.attempts.find(entry => entry.cookingAttemptId === context.cookingAttemptId);
    if (item && (!matches(item, context) || item.recipeVersion !== recipe.preparation!.version)) throw Error('incompatible-cooking-attempt');
    if (!item && store.attempts.some(entry => entry.runId === context.runId && entry.stepId === context.stepId && entry.recipeId === context.recipeId)) throw Error('cooking-binding-exists');
    return item;
  };
  const view = (progress: CookingProgressState, session: CookingSession, revision: number, startedAt: string): CookingProgressState => ({
    ...progress, revision, activeRecipeId: recipe.id,
    journeys: { ...progress.journeys, [recipe.id]: { recipeId: recipe.id, status: 'active', stage: 'cooking', completedStages: [],
      discoveredIngredientIds: [], consumedIngredientIds: [], rewardClaimed: false, discovery: createEmptyDiscoveryState(), math: createEmptyMathState(), startedAt, updatedAt: session.updatedAt } },
    preparationSessions: { ...progress.preparationSessions, [recipe.id]: session },
  });
  const adapter: CookingStorageAdapter & { receipt(): CookingCompletionReceipt | null } = {
    load() {
      const stored = readAttempt(loadStore()), data = cookingData();
      const session = stored ? migrateCookingSession(stored.session, recipe) : createCookingSession(recipe, context.cookingAttemptId, now());
      return view(data.progress, session, stored?.revision ?? 0, stored?.startedAt ?? session.updatedAt);
    },
    begin(progress, requestedRecipe) {
      if (requestedRecipe.id !== recipe.id) throw Error('wrong-recipe');
      // Replay needs a new owner context; never reset an already consumed attempt.
      return readAttempt(loadStore()) ? progress : structuredClone(progress);
    },
    complete(progress, requestedRecipe, session) {
      if (requestedRecipe.id !== recipe.id || session.attemptId !== context.cookingAttemptId || progress.preparationSessions[recipe.id]?.attemptId !== context.cookingAttemptId) return { ok: false, progress, message: 'Deze kookpoging hoort bij een andere opdracht.' };
      const input = { ...progress, preparationSessions: { ...progress.preparationSessions, [recipe.id]: { ...session, completed: false } } };
      return completeCookingAttempt(input, recipe, session);
    },
    async save(progress) {
      try {
        return await (options.withLock ?? withIsolatedCookingLock)(() => {
          const store = loadStore(), previous = readAttempt(store), candidate = progress.preparationSessions[recipe.id];
          if (!candidate || candidate.attemptId !== context.cookingAttemptId || candidate.recipeId !== recipe.id || candidate.recipeVersion !== recipe.preparation!.version) return false;
          if (previous?.receipt) {
            // An old completion may be retried, but never reapply its stock delta.
            if (!candidate.completed || readLocalState().appliedTransactions[previous.receipt.id] !== 0) return false;
            progress.preparationSessions[recipe.id] = structuredClone(previous.session); progress.revision = previous.revision;
            progress.inventory = structuredClone(cookingData().progress.inventory);
            return true;
          }
          if ((progress.revision ?? 0) !== (previous?.revision ?? 0)) return false;
          if (Object.hasOwn(readLocalState().appliedTransactions, operationId(context.cookingAttemptId))) return false;
          const data = cookingData(), timestamp = now();
          const normalized = migrateCookingSession(candidate, recipe);
          if (candidate.completed && !normalized.completed) return false;
          const item: StoredAttempt = { ...context, recipeVersion: recipe.preparation!.version, revision: (previous?.revision ?? 0) + 1,
            startedAt: previous?.startedAt ?? timestamp, session: normalized, receipt: null };
          const documents: Record<string, string> = {};
          const operations: Array<{ id: string; amount: number }> = [];
          let inventory = data.progress.inventory;
          if (candidate.completed) {
            if (!previous || Date.parse(timestamp) < Date.parse(previous.startedAt)) return false;
            const currentView = view(data.progress, { ...normalized, completed: false }, previous.revision, previous.startedAt);
            // Revalidate and consume against fresh shared stock, never against a caller's snapshot.
            const result = completeCookingAttempt(currentView, recipe, { ...normalized, completed: false });
            if (!result.ok) return false;
            item.session = { ...result.progress.preparationSessions[recipe.id], updatedAt: timestamp };
            item.receipt = { ...context, id: operationId(context.cookingAttemptId), recipeVersion: item.recipeVersion,
              startedAt: previous.startedAt, completedAt: timestamp, consumed: recipe.ingredients.map(ingredient => ({ ingredientId: ingredient.ingredientId,
                amount: (data.progress.inventory.consumables[ingredient.ingredientId] ?? 0) - (result.progress.inventory.consumables[ingredient.ingredientId] ?? 0) })) };
            documents[COOKING_PROGRESS_KEY] = JSON.stringify({ ...(data.raw ?? data.progress), inventory: result.progress.inventory, revision: (data.progress.revision ?? 0) + 1 });
            operations.push({ id: item.receipt.id, amount: 0 });
            inventory = result.progress.inventory;
          }
          const next = { ...store, revision: store.revision + 1, attempts: previous ? store.attempts.map(entry => entry.cookingAttemptId === item.cookingAttemptId ? item : entry) : [...store.attempts, item] };
          documents[ISOLATED_COOKING_KEY] = JSON.stringify(next);
          if (commitLocalState(documents, operations).status !== 'applied') return false;
          progress.inventory = structuredClone(inventory);
          progress.preparationSessions[recipe.id] = structuredClone(item.session); progress.revision = item.revision;
          return true;
        });
      } catch { return false; }
    },
    receipt() {
      const item = readAttempt(loadStore());
      if (!item?.receipt) return null;
      if (readLocalState().appliedTransactions[item.receipt.id] !== 0) throw Error('missing-cooking-consumption');
      return structuredClone(item.receipt);
    },
  };
  return adapter;
}
