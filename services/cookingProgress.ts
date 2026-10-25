import { INGREDIENTS_BY_ID, RECIPES_BY_ID } from '../data/cooking/catalog';
import { getRecipeAccess } from '../data/cooking/availability';
import { INGREDIENT_DISCOVERIES_BY_ID } from '../data/cooking/discovery';
import { MATH_COMPLETION_BONUS } from '../data/cooking/mathChallenges';
import { commitLocalState, readDocument, readLocalState } from './localState';
import { ingredientRequirements } from './recipeInventory';
import { createCookingSession, migrateCookingSession, migrateLegacyCookingSession } from '../data/cooking/session';
import { COOKING_SESSION_KEY } from '../data/cooking/bananaPancakeCooking';
import type {
  CookingProgressState,
  IngredientDiscoveryState,
  InventoryUnit,
  JourneyProgress,
  JourneyStage,
  MathChallengeConfig,
  MathChallengeState,
  RecipeConfig,
  RecipeId,
  ShoppingTransaction,
} from '../data/cooking/types';

export const COOKING_PROGRESS_KEY = 'cocokiki:cooking:v1';
export const COOKING_PROGRESS_VERSION = 1 as const;
export const JOURNEY_STAGES: JourneyStage[] = ['overview', 'discovery', 'challenges', 'shopping', 'cooking', 'complete'];

export function createEmptyDiscoveryState(): IngredientDiscoveryState {
  return {
    currentIngredientId: null,
    step: 'learn',
    questionIndex: 0,
    attemptsByIngredient: {},
    correctIngredientIds: [],
    rewardClaimedIngredientIds: [],
    coinsEarned: 0,
    stars: null,
  };
}

export function createEmptyMathState(): MathChallengeState {
  return {
    currentChallengeIndex: 0,
    step: 'intro',
    completedChallengeIds: [],
    rewardClaimedChallengeIds: [],
    attemptsByChallenge: {},
    coinsEarned: 0,
    completionBonusClaimed: false,
  };
}

export function createEmptyCookingProgress(): CookingProgressState {
  return {
    version: COOKING_PROGRESS_VERSION,
    activeRecipeId: null,
    journeys: {},
    discoveredIngredientIds: [],
    inventory: { consumables: {}, equipmentIds: [], acquisitions: [] },
    shoppingTransactions: {},
    completions: {},
    preparationSessions: {},
  };
}

function uniqueStrings(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === 'string'))] : [];
}

function isRecipeId(value: unknown): value is RecipeId {
  return typeof value === 'string' && value in RECIPES_BY_ID;
}

function isStage(value: unknown): value is JourneyStage {
  return typeof value === 'string' && JOURNEY_STAGES.includes(value as JourneyStage);
}

function migrateDiscoveryState(value: unknown): IngredientDiscoveryState {
  const empty = createEmptyDiscoveryState();
  if (!value || typeof value !== 'object') return empty;
  const source = value as Partial<IngredientDiscoveryState>;
  const steps = ['learn', 'question', 'correct', 'collection', 'complete'];
  const attempts = source.attemptsByIngredient && typeof source.attemptsByIngredient === 'object'
    ? Object.fromEntries(Object.entries(source.attemptsByIngredient).filter(([, count]) => typeof count === 'number' && count >= 0).map(([id, count]) => [id, Math.floor(count as number)]))
    : {};
  return {
    currentIngredientId: typeof source.currentIngredientId === 'string' ? source.currentIngredientId : null,
    step: typeof source.step === 'string' && steps.includes(source.step) ? source.step as IngredientDiscoveryState['step'] : 'learn',
    questionIndex: typeof source.questionIndex === 'number' && source.questionIndex >= 0 ? Math.floor(source.questionIndex) : 0,
    attemptsByIngredient: attempts,
    correctIngredientIds: uniqueStrings(source.correctIngredientIds),
    rewardClaimedIngredientIds: uniqueStrings(source.rewardClaimedIngredientIds),
    coinsEarned: typeof source.coinsEarned === 'number' && source.coinsEarned >= 0 ? Math.floor(source.coinsEarned) : 0,
    stars: source.stars === 0 || source.stars === 1 || source.stars === 2 || source.stars === 3 ? source.stars : null,
  };
}

function migrateMathState(value: unknown): MathChallengeState {
  const empty = createEmptyMathState();
  if (!value || typeof value !== 'object') return empty;
  const source = value as Partial<MathChallengeState>;
  const steps = ['intro', 'challenge', 'feedback', 'complete'];
  return {
    currentChallengeIndex: typeof source.currentChallengeIndex === 'number' && source.currentChallengeIndex >= 0 ? Math.floor(source.currentChallengeIndex) : 0,
    step: typeof source.step === 'string' && steps.includes(source.step) ? source.step as MathChallengeState['step'] : 'intro',
    completedChallengeIds: uniqueStrings(source.completedChallengeIds),
    rewardClaimedChallengeIds: uniqueStrings(source.rewardClaimedChallengeIds),
    attemptsByChallenge: source.attemptsByChallenge && typeof source.attemptsByChallenge === 'object'
      ? Object.fromEntries(Object.entries(source.attemptsByChallenge).filter(([, count]) => typeof count === 'number' && count >= 0).map(([id, count]) => [id, Math.floor(count as number)]))
      : {},
    coinsEarned: typeof source.coinsEarned === 'number' && source.coinsEarned >= 0 ? Math.floor(source.coinsEarned) : 0,
    completionBonusClaimed: source.completionBonusClaimed === true,
  };
}

export function migrateCookingProgress(value: unknown): CookingProgressState {
  if (!value || typeof value !== 'object') return createEmptyCookingProgress();
  const source = value as Partial<CookingProgressState>;
  const result = createEmptyCookingProgress();
  result.revision = Number.isSafeInteger(source.revision) && source.revision! >= 0 ? source.revision : 0;
  result.activeRecipeId = isRecipeId(source.activeRecipeId) ? source.activeRecipeId : null;
  result.discoveredIngredientIds = uniqueStrings(source.discoveredIngredientIds);

  if (source.inventory && typeof source.inventory === 'object') {
    const consumables = source.inventory.consumables && typeof source.inventory.consumables === 'object'
      ? Object.fromEntries(Object.entries(source.inventory.consumables).filter(([, amount]) => typeof amount === 'number' && Number.isFinite(amount) && amount >= 0).map(([id, amount]) => [id, Math.floor(amount as number)]))
      : {};
    const acquisitions = Array.isArray(source.inventory.acquisitions)
      ? source.inventory.acquisitions.filter(item => item && typeof item === 'object').flatMap(item => {
          const record = item as unknown as Record<string, unknown>;
          if (typeof record.id !== 'string' || typeof record.productId !== 'string' || typeof record.transactionId !== 'string'
            || typeof record.quantity !== 'number' || record.quantity <= 0
            || (record.unit !== 'piece' && record.unit !== 'gram' && record.unit !== 'milliliter')) return [];
          return [{
            id: record.id,
            productId: record.productId,
            quantity: Math.floor(record.quantity),
            unit: record.unit as InventoryUnit,
            packageLabel: typeof record.packageLabel === 'string' ? record.packageLabel : '',
            transactionId: record.transactionId,
            acquiredAt: typeof record.acquiredAt === 'string' ? record.acquiredAt : new Date(0).toISOString(),
          }];
        })
      : [];
    result.inventory = { consumables, equipmentIds: uniqueStrings(source.inventory.equipmentIds), acquisitions };
  }

  if (source.shoppingTransactions && typeof source.shoppingTransactions === 'object') {
    for (const [id, candidate] of Object.entries(source.shoppingTransactions)) {
      if (!candidate || typeof candidate !== 'object') continue;
      const transaction = candidate as ShoppingTransaction;
      if (transaction.id !== id || !Array.isArray(transaction.items) || typeof transaction.total !== 'number') continue;
      result.shoppingTransactions[id] = transaction;
    }
  }

  if (source.journeys && typeof source.journeys === 'object') {
    for (const [id, candidate] of Object.entries(source.journeys)) {
      if (!isRecipeId(id) || !candidate || typeof candidate !== 'object') continue;
      const journey = candidate as JourneyProgress;
      if (!isStage(journey.stage)) continue;
      result.journeys[id] = {
        recipeId: id,
        status: journey.status === 'completed' ? 'completed' : 'active',
        stage: journey.stage,
        completedStages: uniqueStrings(journey.completedStages).filter(isStage),
        discoveredIngredientIds: uniqueStrings(journey.discoveredIngredientIds),
        consumedIngredientIds: uniqueStrings(journey.consumedIngredientIds),
        rewardClaimed: journey.rewardClaimed === true,
        discovery: migrateDiscoveryState(journey.discovery),
        math: migrateMathState(journey.math),
        startedAt: typeof journey.startedAt === 'string' ? journey.startedAt : new Date(0).toISOString(),
        updatedAt: typeof journey.updatedAt === 'string' ? journey.updatedAt : new Date(0).toISOString(),
      };
    }
  }

  if (source.completions && typeof source.completions === 'object') {
    for (const [id, candidate] of Object.entries(source.completions)) {
      if (!isRecipeId(id) || !candidate || typeof candidate !== 'object') continue;
      const record = candidate as unknown as Record<string, unknown>;
      if (typeof record.completedAt !== 'string') continue;
      result.completions[id] = {
        recipeId: id,
        completedAt: record.completedAt,
        rewardClaimed: record.rewardClaimed === true,
        ...(typeof record.dishPhotoRef === 'string' ? { dishPhotoRef: record.dishPhotoRef } : {}),
      };
    }
  }
  if (source.preparationSessions && typeof source.preparationSessions === 'object') {
    for (const [id, session] of Object.entries(source.preparationSessions)) {
      const recipe = RECIPES_BY_ID[id];
      if (recipe?.preparation?.steps.length) result.preparationSessions[id] = migrateCookingSession(session, recipe);
    }
  }
  return result;
}

export function loadCookingProgress(): CookingProgressState {
  try {
    const stored = readDocument(COOKING_PROGRESS_KEY);
    const migrated = migrateCookingProgress(stored ? JSON.parse(stored) : null);
    const legacyRecipe = RECIPES_BY_ID['banana-pancakes'];
    const legacyJourney = migrated.journeys[legacyRecipe.id];
    if (legacyJourney && !migrated.preparationSessions[legacyRecipe.id] && (legacyJourney.stage === 'cooking' || legacyJourney.status === 'completed')) {
      try {
        const legacy = JSON.parse(localStorage.getItem(COOKING_SESSION_KEY) ?? 'null');
        if (legacy) migrated.preparationSessions[legacyRecipe.id] = migrateLegacyCookingSession(legacy, legacyRecipe, legacyJourney.startedAt, legacyJourney.status === 'completed');
      } catch { /* A damaged legacy session must not discard valid inventory and progress. */ }
    }
    return migrated;
  } catch {
    return createEmptyCookingProgress();
  }
}

export function saveCookingProgress(progress: CookingProgressState, spend?: { id: string; amount: number }): boolean {
  let revision: number;
  let ledger: Record<string, number>;
  try {
    const saved = JSON.parse(readDocument(COOKING_PROGRESS_KEY) ?? 'null');
    revision = saved?.revision ?? 0;
    if (revision !== (progress.revision ?? 0)) return false;
    ledger = readLocalState().appliedTransactions;
  } catch { return false; }
  const operations: Array<{ id: string; amount: number }> = [];
  for (const [recipeId, journey] of Object.entries(progress.journeys)) {
    if (!journey) continue;
    for (const id of journey.discovery.rewardClaimedIngredientIds) {
      const config = INGREDIENT_DISCOVERIES_BY_ID[id];
      if (config) operations.push({ id: `cooking-discovery:${id}`, amount: config.rewardCoins });
    }
    const math = RECIPES_BY_ID[recipeId]?.education?.math ?? [];
    for (const id of journey.math.rewardClaimedChallengeIds) {
      const challenge = math.find(item => item.id === id);
      if (challenge) operations.push({ id: `cooking-math:${recipeId}:${id}`, amount: challenge.rewardCoins });
    }
    if (journey.math.completionBonusClaimed) operations.push({ id: `cooking-math:${recipeId}:complete`, amount: MATH_COMPLETION_BONUS });
    const completion = progress.completions[recipeId];
    const reward = RECIPES_BY_ID[recipeId]?.rewardCoins;
    if (completion?.rewardClaimed && reward) operations.push({ id: `cooking-complete:${recipeId}`, amount: reward });
  }
  for (let index = operations.length - 1; index >= 0; index--) {
    if (ledger[operations[index].id] !== undefined) operations.splice(index, 1);
  }
  if (spend) {
    if (ledger[spend.id] !== undefined) return false;
    operations.push({ id: spend.id, amount: -spend.amount });
  }
  const result = commitLocalState({ [COOKING_PROGRESS_KEY]: JSON.stringify({ ...progress, revision: revision + 1 }) }, operations);
  const saved = result.status === 'applied' || result.status === 'duplicate';
  // Carry the storage revision back to the caller's committed snapshot.
  if (saved) progress.revision = revision + 1;
  return saved;
}

function clone(progress: CookingProgressState): CookingProgressState {
  return structuredClone(progress);
}

export function startJourney(progress: CookingProgressState, recipe: RecipeConfig, now = new Date().toISOString()): CookingProgressState {
  if (!getRecipeAccess(recipe, progress).playable) return progress;
  if (progress.journeys[recipe.id]) return progress.activeRecipeId === recipe.id ? progress : { ...progress, activeRecipeId: recipe.id };
  const next = clone(progress);
  next.activeRecipeId = recipe.id;
  next.journeys[recipe.id] = {
    recipeId: recipe.id, status: 'active', stage: 'overview', completedStages: [],
    discoveredIngredientIds: [], consumedIngredientIds: [], rewardClaimed: false,
    discovery: createEmptyDiscoveryState(),
    math: createEmptyMathState(),
    startedAt: now, updatedAt: now,
  };
  return next;
}

export function restartJourney(progress: CookingProgressState, recipe: RecipeConfig, now = new Date().toISOString()): CookingProgressState {
  const previous = progress.journeys[recipe.id];
  if (!getRecipeAccess(recipe, progress).playable || !previous) return progress;
  const next = clone(progress);
  if (recipe.preparation) next.preparationSessions[recipe.id] = createCookingSession(recipe);
  next.activeRecipeId = recipe.id;
  next.journeys[recipe.id] = {
    recipeId: recipe.id,
    status: 'active',
    stage: 'overview',
    completedStages: [],
    discoveredIngredientIds: [],
    consumedIngredientIds: [],
    rewardClaimed: previous.rewardClaimed,
    discovery: {
      ...createEmptyDiscoveryState(),
      rewardClaimedIngredientIds: [...previous.discovery.rewardClaimedIngredientIds],
    },
    math: {
      ...createEmptyMathState(),
      rewardClaimedChallengeIds: [...previous.math.rewardClaimedChallengeIds],
      completionBonusClaimed: previous.math.completionBonusClaimed,
    },
    startedAt: now,
    updatedAt: now,
  };
  return next;
}

export function discoverIngredient(progress: CookingProgressState, recipeId: RecipeId, ingredientId: string, now = new Date().toISOString()): CookingProgressState {
  const journey = progress.journeys[recipeId];
  if (!journey || !RECIPES_BY_ID[recipeId].ingredients.some(item => item.ingredientId === ingredientId)) return progress;
  if (journey.discoveredIngredientIds.includes(ingredientId)) return progress;
  const next = clone(progress);
  next.journeys[recipeId]!.discoveredIngredientIds.push(ingredientId);
  next.journeys[recipeId]!.updatedAt = now;
  if (!next.discoveredIngredientIds.includes(ingredientId)) next.discoveredIngredientIds.push(ingredientId);
  return next;
}

export function nextRequiredStage(progress: CookingProgressState, recipeId: RecipeId): JourneyStage | null {
  const journey = progress.journeys[recipeId];
  if (!journey || journey.stage === 'complete') return null;
  const required = RECIPES_BY_ID[recipeId].ingredients.map(item => item.ingredientId);
  if (journey.stage === 'overview') {
    return 'discovery';
  }
  if (journey.stage === 'discovery') {
    const allFound = required.every(id => journey.discoveredIngredientIds.includes(id) || progress.discoveredIngredientIds.includes(id));
    return allFound ? 'challenges' : null;
  }
  if (journey.stage === 'challenges') return journey.math.step === 'complete' ? 'shopping' : null;
  if (journey.stage === 'shopping') return recipeRequirementsSatisfied(progress, recipeId) ? 'cooking' : null;
  return JOURNEY_STAGES[JOURNEY_STAGES.indexOf(journey.stage) + 1] ?? null;
}

export function recipeRequirementsSatisfied(progress: CookingProgressState, recipeId: RecipeId): boolean {
  const recipe = RECIPES_BY_ID[recipeId];
  return !!recipe && ingredientRequirements(recipe, progress).every(item => item.sufficient);
}

function nextUndiscoveredForRecipe(progress: CookingProgressState, recipeId: RecipeId): string | null {
  const journey = progress.journeys[recipeId];
  if (!journey) return null;
  return RECIPES_BY_ID[recipeId].ingredients.find(item => !journey.discoveredIngredientIds.includes(item.ingredientId))?.ingredientId ?? null;
}

export function beginDiscoveryStage(progress: CookingProgressState, recipeId: RecipeId, now = new Date().toISOString()): CookingProgressState {
  const journey = progress.journeys[recipeId];
  if (!journey) return progress;
  let next = progress;
  if (journey.stage === 'overview') next = advanceJourney(progress, recipeId, 'discovery', now);
  const active = next.journeys[recipeId];
  if (!active || active.stage !== 'discovery') return next;
  if (active.discovery.currentIngredientId || active.discovery.step === 'complete') return next;
  const ingredientId = nextUndiscoveredForRecipe(next, recipeId);
  const result = clone(next);
  result.journeys[recipeId]!.discovery.currentIngredientId = ingredientId;
  result.journeys[recipeId]!.discovery.step = ingredientId ? 'learn' : 'complete';
  result.journeys[recipeId]!.updatedAt = now;
  return result;
}

export function createDiscoveryReplay(progress: CookingProgressState, recipeId: RecipeId, now = new Date().toISOString()): CookingProgressState {
  const journey = progress.journeys[recipeId];
  if (!journey || journey.discovery.step !== 'complete') return progress;
  const replay = clone(progress);
  const replayJourney = replay.journeys[recipeId]!;
  replayJourney.stage = 'discovery';
  replayJourney.discoveredIngredientIds = [];
  replayJourney.discovery = createEmptyDiscoveryState();
  replayJourney.updatedAt = now;
  return beginDiscoveryStage(replay, recipeId, now);
}

export type MathChallengeAnswer = number | Record<string, number> | string[];

export interface MathValidationResult {
  correct: boolean;
  hint: string | null;
}

export function validateMathChallengeAnswer(config: MathChallengeConfig, answer: MathChallengeAnswer, attempt: number): MathValidationResult {
  if (config.type === 'quantity-selection') {
    const correct = typeof answer === 'number' && answer === config.correctQuantity;
    return { correct, hint: !correct && attempt >= 2 ? config.targetServings === config.baseServings * 2 ? `Verdubbel ${config.baseQuantity}: ${config.baseQuantity} + ${config.baseQuantity}.` : `Voor ${config.targetServings} porties heb je ${config.correctQuantity} nodig.` : null };
  }
  if (config.type === 'recipe-scaling') {
    const values = !Array.isArray(answer) && typeof answer === 'object' ? answer : {};
    const incorrect = config.quantities.find(item => values[item.ingredientId] !== item.target);
    return { correct: !incorrect, hint: incorrect && attempt >= 2 ? `Kijk nog eens naar ${INGREDIENTS_BY_ID[incorrect.ingredientId]?.name.toLowerCase() ?? incorrect.ingredientId}.` : null };
  }
  if (config.type === 'interactive-weighing') {
    const weight = typeof answer === 'number' ? answer : 0;
    const difference = config.targetGrams - weight;
    return {
      correct: difference === 0,
      hint: difference > 0 ? `Je hebt nog ${difference} gram nodig.` : `Haal ${Math.abs(difference)} gram weg.`,
    };
  }
  const order = Array.isArray(answer) ? answer : [];
  const expected = config.actions.map(action => action.id);
  const firstIncorrect = expected.findIndex((id, index) => order[index] !== id);
  return { correct: firstIncorrect === -1 && order.length === expected.length, hint: firstIncorrect >= 0 ? `Kijk nog eens naar stap ${firstIncorrect + 1}.` : null };
}

export function startMathChallenges(progress: CookingProgressState, recipeId: RecipeId, now = new Date().toISOString()): CookingProgressState {
  const journey = progress.journeys[recipeId];
  if (!journey || journey.stage !== 'challenges' || journey.math.step !== 'intro') return progress;
  const next = clone(progress);
  next.journeys[recipeId]!.math.step = 'challenge';
  next.journeys[recipeId]!.updatedAt = now;
  return next;
}

export interface MathSubmissionResult extends MathValidationResult {
  progress: CookingProgressState;
  coinDelta: number;
}

export function submitMathChallenge(progress: CookingProgressState, recipeId: RecipeId, answer: MathChallengeAnswer, now = new Date().toISOString()): MathSubmissionResult {
  const journey = progress.journeys[recipeId];
  const challenges = RECIPES_BY_ID[recipeId]?.education?.math ?? [];
  const challenge = challenges?.[journey?.math.currentChallengeIndex ?? -1];
  if (!journey || journey.stage !== 'challenges' || journey.math.step !== 'challenge' || !challenge) {
    return { progress, correct: false, hint: null, coinDelta: 0 };
  }
  const next = clone(progress);
  const math = next.journeys[recipeId]!.math;
  const attempt = (math.attemptsByChallenge[challenge.id] ?? 0) + 1;
  math.attemptsByChallenge[challenge.id] = attempt;
  next.journeys[recipeId]!.updatedAt = now;
  const validation = validateMathChallengeAnswer(challenge, answer, attempt);
  if (!validation.correct) return { progress: next, ...validation, coinDelta: 0 };

  if (!math.completedChallengeIds.includes(challenge.id)) math.completedChallengeIds.push(challenge.id);
  math.step = 'feedback';
  const canReward = !math.rewardClaimedChallengeIds.includes(challenge.id);
  if (canReward) {
    math.rewardClaimedChallengeIds.push(challenge.id);
    math.coinsEarned += challenge.rewardCoins;
  }
  return { progress: next, ...validation, coinDelta: canReward ? challenge.rewardCoins : 0 };
}

export function continueMathChallenges(progress: CookingProgressState, recipeId: RecipeId, now = new Date().toISOString()): { progress: CookingProgressState; coinDelta: number } {
  const journey = progress.journeys[recipeId];
  const challenges = RECIPES_BY_ID[recipeId]?.education?.math ?? [];
  if (!journey || journey.stage !== 'challenges' || journey.math.step !== 'feedback' || !challenges.length) return { progress, coinDelta: 0 };
  const next = clone(progress);
  const math = next.journeys[recipeId]!.math;
  if (math.currentChallengeIndex < challenges.length - 1) {
    math.currentChallengeIndex += 1;
    math.step = 'challenge';
    next.journeys[recipeId]!.updatedAt = now;
    return { progress: next, coinDelta: 0 };
  }
  math.step = 'complete';
  const canReward = !math.completionBonusClaimed;
  if (canReward) {
    math.completionBonusClaimed = true;
    math.coinsEarned += MATH_COMPLETION_BONUS;
  }
  next.journeys[recipeId]!.updatedAt = now;
  return { progress: next, coinDelta: canReward ? MATH_COMPLETION_BONUS : 0 };
}

export function createMathReplay(progress: CookingProgressState, recipeId: RecipeId, now = new Date().toISOString()): CookingProgressState {
  const journey = progress.journeys[recipeId];
  if (!journey || journey.math.step !== 'complete') return progress;
  const replay = clone(progress);
  const replayJourney = replay.journeys[recipeId]!;
  const claimed = [...replayJourney.math.rewardClaimedChallengeIds];
  const bonusClaimed = replayJourney.math.completionBonusClaimed;
  replayJourney.stage = 'challenges';
  replayJourney.math = {
    ...createEmptyMathState(),
    rewardClaimedChallengeIds: claimed,
    completionBonusClaimed: bonusClaimed,
  };
  replayJourney.updatedAt = now;
  return replay;
}

export function showDiscoveryQuestion(progress: CookingProgressState, recipeId: RecipeId, now = new Date().toISOString()): CookingProgressState {
  const journey = progress.journeys[recipeId];
  if (!journey || journey.stage !== 'discovery' || journey.discovery.step !== 'learn' || !journey.discovery.currentIngredientId) return progress;
  const next = clone(progress);
  next.journeys[recipeId]!.discovery.step = 'question';
  next.journeys[recipeId]!.updatedAt = now;
  return next;
}

export interface DiscoveryAnswerResult {
  progress: CookingProgressState;
  correct: boolean;
  coinDelta: number;
}

export function answerDiscoveryQuestion(progress: CookingProgressState, recipeId: RecipeId, optionId: string, now = new Date().toISOString()): DiscoveryAnswerResult {
  const journey = progress.journeys[recipeId];
  const ingredientId = journey?.discovery.currentIngredientId;
  const config = ingredientId ? INGREDIENT_DISCOVERIES_BY_ID[ingredientId] : undefined;
  const question = config?.questions[journey?.discovery.questionIndex ?? 0];
  if (!journey || journey.stage !== 'discovery' || journey.discovery.step !== 'question' || !ingredientId || !config || !question) {
    return { progress, correct: false, coinDelta: 0 };
  }

  const next = clone(progress);
  const discovery = next.journeys[recipeId]!.discovery;
  discovery.attemptsByIngredient[ingredientId] = (discovery.attemptsByIngredient[ingredientId] ?? 0) + 1;
  next.journeys[recipeId]!.updatedAt = now;
  if (optionId !== question.correctOptionId) return { progress: next, correct: false, coinDelta: 0 };

  const finalQuestion = discovery.questionIndex === config.questions.length - 1;
  if (finalQuestion && !discovery.correctIngredientIds.includes(ingredientId)) discovery.correctIngredientIds.push(ingredientId);
  discovery.step = 'correct';
  const firstDiscovery = !progress.discoveredIngredientIds.includes(ingredientId);
  const canReward = finalQuestion && firstDiscovery && !discovery.rewardClaimedIngredientIds.includes(ingredientId);
  if (canReward) {
    discovery.rewardClaimedIngredientIds.push(ingredientId);
    discovery.coinsEarned += config.rewardCoins;
  }
  return { progress: next, correct: true, coinDelta: canReward ? config.rewardCoins : 0 };
}

export function showIngredientCollection(progress: CookingProgressState, recipeId: RecipeId, now = new Date().toISOString()): CookingProgressState {
  const journey = progress.journeys[recipeId];
  if (!journey || journey.discovery.step !== 'correct') return progress;
  const next = clone(progress);
  next.journeys[recipeId]!.discovery.step = 'collection';
  next.journeys[recipeId]!.updatedAt = now;
  return next;
}

function finishIngredient(progress: CookingProgressState, recipeId: RecipeId, ingredientId: string, unlockGlobally: boolean, now: string): CookingProgressState {
  const next = clone(progress);
  const journey = next.journeys[recipeId]!;
  if (!journey.discoveredIngredientIds.includes(ingredientId)) journey.discoveredIngredientIds.push(ingredientId);
  if (unlockGlobally && !next.discoveredIngredientIds.includes(ingredientId)) next.discoveredIngredientIds.push(ingredientId);
  const following = nextUndiscoveredForRecipe(next, recipeId);
  journey.discovery.currentIngredientId = following;
  journey.discovery.questionIndex = 0;
  journey.discovery.step = following ? 'learn' : 'complete';
  journey.updatedAt = now;
  return next;
}

export function collectCurrentIngredient(progress: CookingProgressState, recipeId: RecipeId, now = new Date().toISOString()): CookingProgressState {
  const journey = progress.journeys[recipeId];
  const ingredientId = journey?.discovery.currentIngredientId;
  if (!journey || journey.discovery.step !== 'collection' || !ingredientId) return progress;
  const config = INGREDIENT_DISCOVERIES_BY_ID[ingredientId];
  if (config && journey.discovery.questionIndex + 1 < config.questions.length) {
    const next = clone(progress);
    next.journeys[recipeId]!.discovery.questionIndex += 1;
    next.journeys[recipeId]!.discovery.step = 'question';
    return next;
  }
  if (!journey.discovery.correctIngredientIds.includes(ingredientId)) return progress;
  return finishIngredient(progress, recipeId, ingredientId, true, now);
}

export function skipKnownIngredient(progress: CookingProgressState, recipeId: RecipeId, now = new Date().toISOString()): CookingProgressState {
  const journey = progress.journeys[recipeId];
  const ingredientId = journey?.discovery.currentIngredientId;
  if (!journey || !ingredientId || !progress.discoveredIngredientIds.includes(ingredientId)) return progress;
  return finishIngredient(progress, recipeId, ingredientId, false, now);
}

export function advanceJourney(progress: CookingProgressState, recipeId: RecipeId, target: JourneyStage, now = new Date().toISOString()): CookingProgressState {
  const journey = progress.journeys[recipeId];
  if (!journey || journey.status === 'completed' || nextRequiredStage(progress, recipeId) !== target) return progress;
  const next = clone(progress);
  const current = next.journeys[recipeId]!;
  if (!current.completedStages.includes(current.stage)) current.completedStages.push(current.stage);
  current.stage = target;
  current.updatedAt = now;
  return next;
}

export function addConsumable(progress: CookingProgressState, itemId: string, amount: number): CookingProgressState {
  if (!Number.isFinite(amount) || amount <= 0) return progress;
  const next = clone(progress);
  next.inventory.consumables[itemId] = (next.inventory.consumables[itemId] ?? 0) + Math.floor(amount);
  return next;
}

export function consumeIngredient(progress: CookingProgressState, recipeId: RecipeId, itemId: string, amount: number): CookingProgressState {
  const journey = progress.journeys[recipeId];
  const available = progress.inventory.consumables[itemId] ?? 0;
  if (!journey || journey.consumedIngredientIds.includes(itemId) || amount <= 0 || available < amount) return progress;
  const next = clone(progress);
  next.inventory.consumables[itemId] = available - amount;
  next.journeys[recipeId]!.consumedIngredientIds.push(itemId);
  return next;
}

export function addEquipment(progress: CookingProgressState, itemId: string): CookingProgressState {
  if (progress.inventory.equipmentIds.includes(itemId)) return progress;
  const next = clone(progress);
  next.inventory.equipmentIds.push(itemId);
  return next;
}

export function completeJourney(progress: CookingProgressState, recipe: RecipeConfig, now = new Date().toISOString()): { progress: CookingProgressState; coinDelta: number } {
  const journey = progress.journeys[recipe.id];
  if (!journey || journey.stage !== 'cooking') return { progress, coinDelta: 0 };
  const next = clone(progress);
  const nextJourney = next.journeys[recipe.id]!;
  nextJourney.stage = 'complete';
  nextJourney.status = 'completed';
  nextJourney.updatedAt = now;
  if (!nextJourney.completedStages.includes('cooking')) nextJourney.completedStages.push('cooking');
  if (progress.completions[recipe.id]) {
    nextJourney.rewardClaimed = true;
    if (next.activeRecipeId === recipe.id) next.activeRecipeId = null;
    return { progress: next, coinDelta: 0 };
  }
  const coinDelta = recipe.rewardCoins ?? 0;
  nextJourney.rewardClaimed = recipe.rewardCoins !== null;
  next.completions[recipe.id] = { recipeId: recipe.id, completedAt: now, rewardClaimed: recipe.rewardCoins !== null };
  if (next.activeRecipeId === recipe.id) next.activeRecipeId = null;
  return { progress: next, coinDelta };
}
