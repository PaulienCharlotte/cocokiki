import { ASSET_LIBRARY } from '../assetLibrary';
import type { PreparationConfig } from './preparation';
import type { MathChallengeConfig } from './types';

export const FRUIT_YOGURT_ASSETS = {
  yogurt: '/assets/library/cooking/fruit-yogurt/yogurt-bowl.webp',
  strawberry: '/assets/library/cooking/fruit-yogurt/strawberries.webp',
  banana: '/assets/library/cooking/fruit-yogurt/banana-slices.webp',
  finished: '/games/cooking/fruit-yogurt.webp',
} as const;
const a = FRUIT_YOGURT_ASSETS;
const kit = ASSET_LIBRARY.cooking.kit;

export const FRUIT_YOGURT_PREPARATION: PreparationConfig = {
  version: 1,
  consumption: 'on-completion',
  finishedAsset: a.finished,
  finishedAlt: 'Een kom yoghurt met aardbeien en plakjes banaan',
  steps: [
    { id: 'add-yogurt', title: 'Schenk de yoghurt', instruction: 'Schenk 150 ml yoghurt in de kom.', station: 'worktop', mechanic: 'drag', target: 1, asset: a.yogurt, dropTarget: { sourceLabel: 'Yoghurt', label: 'Kom', asset: kit.bowlEmpty }, hint: 'Sleep naar de kom. Tikken mag ook.' },
    { id: 'add-strawberries', title: 'Voeg de aardbeien toe', instruction: 'Voeg de aardbeien toe!', station: 'worktop', mechanic: 'drag', target: 1, asset: a.strawberry, dropTarget: { sourceLabel: 'Aardbeien', label: 'Yoghurtkom', asset: a.yogurt }, hint: 'De aardbeien zijn al gewassen en gesneden.' },
    { id: 'add-banana', title: 'Nu de banaan', instruction: 'Nu de banaan erbij!', station: 'worktop', mechanic: 'drag', target: 1, asset: a.banana, dropTarget: { sourceLabel: 'Banaan', label: 'Yoghurtkom', asset: a.yogurt }, hint: 'Een hele banaan, in plakjes gesneden.' },
    { id: 'mix-fruit', title: 'Roer de fruityoghurt', instruction: 'Roer alles lekker door elkaar!', station: 'worktop', mechanic: 'repeat', target: 5, asset: a.yogurt, tapTool: { asset: kit.spoon, label: 'Lepel' }, tapLabel: 'Tik op de lepel', hint: 'Nog even roeren, chef!' },
    { id: 'serve-yogurt', title: 'Serveer je fruityoghurt', instruction: 'Je fruityoghurt is klaar!', station: 'worktop', mechanic: 'drag', target: 1, asset: a.finished, dropTarget: { sourceLabel: 'Fruityoghurt', label: 'Serveerplek' }, hint: 'Zet je kom klaar om te eten. Tikken mag ook.' },
  ],
};

export const FRUIT_YOGURT_MATH: MathChallengeConfig[] = [
  {
    id: 'fruit-yogurt-quantity', recipeId: 'fruit-yogurt', type: 'quantity-selection',
    title: 'Hoeveel yoghurt?', instruction: 'Hoeveel yoghurt hebben we nodig? Kijk naar het recept: 150 ml.',
    learningObjective: 'Een hoeveelheid in milliliters herkennen', difficulty: 1,
    ingredientId: 'yogurt', baseServings: 1, targetServings: 1, baseQuantity: 100, correctQuantity: 150,
    minimum: 50, maximum: 300, step: 50, unit: 'ml', rewardCoins: 5, successFeedback: 'Precies! 150 ml yoghurt.',
  },
  {
    id: 'fruit-yogurt-weigh-strawberries', recipeId: 'fruit-yogurt', type: 'interactive-weighing',
    title: 'Weeg de aardbeien', instruction: 'Meet 75 gram aardbeien af.',
    learningObjective: 'Grammen afmeten met een weegschaal', difficulty: 1,
    ingredientId: 'strawberry', targetGrams: 75, increments: [5, 25], rewardCoins: 5, successFeedback: 'Goed gewogen! 75 gram aardbeien.',
  },
  {
    id: 'fruit-yogurt-double', recipeId: 'fruit-yogurt', type: 'recipe-scaling',
    title: 'Yoghurt voor twee', instruction: 'Voor één portie gebruiken we 150 ml yoghurt. Hoeveel hebben we nodig voor twee porties?',
    learningObjective: 'Een hoeveelheid verdubbelen', difficulty: 1,
    baseServings: 1, targetServings: 2, quantities: [{ ingredientId: 'yogurt', base: 150, target: 300, step: 50, unit: 'ml' }],
    rewardCoins: 5, successFeedback: 'Goed gerekend! 300 ml voor twee porties.',
  },
  {
    id: 'fruit-yogurt-order', recipeId: 'fruit-yogurt', type: 'sequence-ordering',
    title: 'Wat komt eerst?', instruction: 'Zet de stappen voor je fruityoghurt in de goede volgorde.',
    learningObjective: 'Een recept in de juiste volgorde uitvoeren', difficulty: 1,
    actions: [
      { id: 'yogurt', label: 'Schenk yoghurt in de kom', assetId: 'yogurt' },
      { id: 'strawberry', label: 'Voeg aardbeien toe', assetId: 'strawberry' },
      { id: 'banana', label: 'Voeg banaan toe', assetId: 'banana' },
      { id: 'mix', label: 'Roer alles door elkaar', assetId: 'spoon' },
    ],
    initialOrder: ['mix', 'banana', 'yogurt', 'strawberry'], rewardCoins: 5, successFeedback: 'Helemaal goed! Tijd voor je eigen kom fruityoghurt.',
  },
];
