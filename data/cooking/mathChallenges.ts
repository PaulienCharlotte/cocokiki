import type { MathChallengeConfig, RecipeId } from './types';
import { FRUIT_YOGURT_MATH } from './fruitYogurt';

export const BANANA_PANCAKE_MATH_CHALLENGES: MathChallengeConfig[] = [
  {
    id: 'banana-pancakes-egg-quantity', recipeId: 'banana-pancakes', type: 'quantity-selection',
    title: 'Hoeveel heb je nodig?', learningObjective: 'Eenvoudig vermenigvuldigen en hoeveelheden herkennen', difficulty: 1,
    instruction: 'Voor 2 porties heb je 2 eieren nodig. Hoeveel voor 4 porties?',
    ingredientId: 'eggs', baseServings: 2, targetServings: 4, baseQuantity: 2, correctQuantity: 4,
    minimum: 0, maximum: 8, rewardCoins: 5, successFeedback: 'Precies! 4 eieren.',
  },
  {
    id: 'banana-pancakes-double-recipe', recipeId: 'banana-pancakes', type: 'recipe-scaling',
    title: 'Verdubbel het recept', learningObjective: 'Verhoudingen en evenredige hoeveelheden begrijpen', difficulty: 1,
    instruction: 'Maak genoeg voor 4 porties.', baseServings: 2, targetServings: 4,
    quantities: [
      { ingredientId: 'banana', base: 1, target: 2, step: 1, unit: 'stuks' },
      { ingredientId: 'eggs', base: 2, target: 4, step: 1, unit: 'stuks' },
      { ingredientId: 'oats', base: 40, target: 80, step: 10, unit: 'g' },
    ],
    rewardCoins: 5, successFeedback: 'Goed gerekend! Je recept is verdubbeld.',
  },
  {
    id: 'banana-pancakes-weigh-oats', recipeId: 'banana-pancakes', type: 'interactive-weighing',
    title: 'Weeg de havermout', learningObjective: 'Grammen en meeteenheden begrijpen', difficulty: 1,
    instruction: 'Meet 40 gram havermout af.', ingredientId: 'oats', targetGrams: 40, increments: [5, 10],
    rewardCoins: 5, successFeedback: 'Perfect! 40 gram.',
  },
  {
    id: 'banana-pancakes-first-step', recipeId: 'banana-pancakes', type: 'sequence-ordering',
    title: 'Wat doe je eerst?', learningObjective: 'Handelingen logisch ordenen en vooruit plannen', difficulty: 1,
    instruction: 'Zet de vier stappen in de goede volgorde.',
    actions: [
      { id: 'peel', label: 'Pel de banaan', assetId: 'banana' },
      { id: 'mash', label: 'Prak de banaan', assetId: 'banana' },
      { id: 'add', label: 'Voeg eieren en havermout toe', assetId: 'eggs' },
      { id: 'mix', label: 'Meng de ingrediënten', assetId: 'bowl' },
    ],
    initialOrder: ['mix', 'peel', 'add', 'mash'], rewardCoins: 5,
    successFeedback: 'Top! Je bent klaar om te koken.',
  },
];

export const MATH_CHALLENGES_BY_RECIPE: Record<RecipeId, MathChallengeConfig[]> = {
  'banana-pancakes': BANANA_PANCAKE_MATH_CHALLENGES,
  'fruit-yogurt': FRUIT_YOGURT_MATH,
  'oat-muffins': [],
};

export const MATH_COMPLETION_BONUS = 10;
