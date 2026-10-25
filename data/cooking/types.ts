import type { CookingSession, PreparationConfig } from './preparation';
export type RecipeId = string;
export type RecipeCategory = 'breakfast' | 'snack' | 'baking';
export type RecipeAvailability = 'playable' | 'preview' | 'locked';
export type ContentStatus = 'ready' | 'pending';

export interface IngredientEntry {
  id: string;
  name: string;
  image: string;
  contentStatus: ContentStatus;
  origin: string | null;
  productionRegions: string[];
  season: string | null;
  nutrients: string[];
  facts: string[];
}

export interface RecipeIngredient {
  ingredientId: string;
  amount: number;
  unit: 'piece' | 'gram' | 'milliliter';
  displayAmount: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
  image: string;
  contentStatus: ContentStatus;
  permanent: true;
}

export interface EducationalChallenge {
  id: string;
  type: 'quantity' | 'measurement' | 'sequence';
  prompt: string;
  answer: string;
  options?: string[];
  learningGoal: string;
}

export type DiscoveryDifficulty = 1 | 2 | 3 | 4;
export type DiscoveryStep = 'learn' | 'question' | 'correct' | 'collection' | 'complete';
export type StarRating = 0 | 1 | 2 | 3;

export interface DiscoveryQuestion {
  id: string;
  type: 'single-choice';
  prompt: string;
  options: Array<{ id: string; label: string }>;
  correctOptionId: string;
  feedbackExplanation: string;
  learningGoal: 'origin' | 'source' | 'nutrition' | 'season' | 'comparison' | 'geography';
}

export interface IngredientDiscoveryConfig {
  ingredientId: string;
  title: string;
  collectionLabel: string;
  educationalText: string;
  heroFact: string;
  origin: { label: string; text: string };
  nutrition: Array<{ nutrient: string; role: string }>;
  foodKnowledge: { label: string; text: string };
  questions: DiscoveryQuestion[];
  rewardCoins: number;
  encyclopediaEntryId: string;
  difficulty: DiscoveryDifficulty;
}

export interface IngredientDiscoveryState {
  currentIngredientId: string | null;
  step: DiscoveryStep;
  questionIndex: number;
  attemptsByIngredient: Record<string, number>;
  correctIngredientIds: string[];
  rewardClaimedIngredientIds: string[];
  coinsEarned: number;
  stars: StarRating | null;
}

export type MathChallengeType = 'quantity-selection' | 'recipe-scaling' | 'interactive-weighing' | 'sequence-ordering';
export type MathChallengeStep = 'intro' | 'challenge' | 'feedback' | 'complete';

interface MathChallengeBase {
  id: string;
  recipeId: RecipeId;
  type: MathChallengeType;
  title: string;
  learningObjective: string;
  difficulty: DiscoveryDifficulty;
  instruction: string;
  rewardCoins: number;
  successFeedback: string;
}

export interface QuantitySelectionChallenge extends MathChallengeBase {
  type: 'quantity-selection';
  ingredientId: string;
  baseServings: number;
  targetServings: number;
  baseQuantity: number;
  correctQuantity: number;
  minimum: number;
  maximum: number;
}

export interface RecipeScalingChallenge extends MathChallengeBase {
  type: 'recipe-scaling';
  baseServings: number;
  targetServings: number;
  quantities: Array<{ ingredientId: string; base: number; target: number; step: number; unit: string }>;
}

export interface InteractiveWeighingChallenge extends MathChallengeBase {
  type: 'interactive-weighing';
  ingredientId: string;
  targetGrams: number;
  increments: number[];
}

export interface SequenceOrderingChallenge extends MathChallengeBase {
  type: 'sequence-ordering';
  actions: Array<{ id: string; label: string; assetId: string }>;
  initialOrder: string[];
}

export type MathChallengeConfig = QuantitySelectionChallenge | RecipeScalingChallenge | InteractiveWeighingChallenge | SequenceOrderingChallenge;

export interface MathChallengeState {
  currentChallengeIndex: number;
  step: MathChallengeStep;
  completedChallengeIds: string[];
  rewardClaimedChallengeIds: string[];
  attemptsByChallenge: Record<string, number>;
  coinsEarned: number;
  completionBonusClaimed: boolean;
}

export interface ShoppingRequirement {
  itemId: string;
  kind: 'ingredient' | 'equipment';
  quantity: number;
  required: boolean;
  price: null;
  purchasable: false;
  consumption: 'consumable' | 'persistent';
}

export interface CookingAction {
  id: string;
  order: number;
  label: string;
  interaction: 'tap' | 'sequence' | 'hold';
  requiredAsset?: string;
  safetyNote?: string;
}

export interface RecipeConfig {
  id: RecipeId;
  name: string;
  shortDescription: string;
  category: RecipeCategory;
  availability: RecipeAvailability;
  requiredCompletedRecipes: number;
  level: 1 | 2 | 3;
  preparationMinutes: number | null;
  servings: number | null;
  image: string;
  ingredients: RecipeIngredient[];
  equipmentIds: string[];
  challenges: EducationalChallenge[];
  shoppingRequirements: ShoppingRequirement[];
  actions: CookingAction[];
  rewardCoins: number | null;
  contentStatus: ContentStatus;
  preparation?: PreparationConfig;
  education?: { math: MathChallengeConfig[] };
}

export type JourneyStage = 'overview' | 'discovery' | 'challenges' | 'shopping' | 'cooking' | 'complete';
export type JourneyStatus = 'active' | 'completed';

export interface JourneyProgress {
  recipeId: RecipeId;
  status: JourneyStatus;
  stage: JourneyStage;
  completedStages: JourneyStage[];
  discoveredIngredientIds: string[];
  consumedIngredientIds: string[];
  rewardClaimed: boolean;
  discovery: IngredientDiscoveryState;
  math: MathChallengeState;
  startedAt: string;
  updatedAt: string;
}

export interface CompletionRecord {
  recipeId: RecipeId;
  completedAt: string;
  rewardClaimed: boolean;
  dishPhotoRef?: string;
}

export interface CookingInventory {
  consumables: Record<string, number>;
  equipmentIds: string[];
  acquisitions: InventoryAcquisition[];
}

export type InventoryUnit = 'piece' | 'gram' | 'milliliter';

export interface InventoryAcquisition {
  id: string;
  productId: string;
  quantity: number;
  unit: InventoryUnit;
  packageLabel: string;
  transactionId: string;
  acquiredAt: string;
}

export interface ShoppingTransactionItem {
  productId: string;
  packages: number;
  quantity: number;
  unit: InventoryUnit;
  packageLabel: string;
  unitPrice: number;
}

export interface ShoppingTransaction {
  id: string;
  mode: 'free' | 'recipe';
  recipeId: RecipeId | null;
  priceVersion: string;
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  total: number;
  items: ShoppingTransactionItem[];
  completedAt: string;
}

export interface CookingAssetRegistry {
  recipes: Record<RecipeId, string>;
  ingredients: Record<string, string>;
  equipment: Record<string, string>;
}

export interface CookingProgressState {
  version: 1;
  revision?: number;
  activeRecipeId: RecipeId | null;
  journeys: Partial<Record<RecipeId, JourneyProgress>>;
  discoveredIngredientIds: string[];
  inventory: CookingInventory;
  shoppingTransactions: Record<string, ShoppingTransaction>;
  completions: Partial<Record<RecipeId, CompletionRecord>>;
  preparationSessions: Record<RecipeId, CookingSession>;
}
