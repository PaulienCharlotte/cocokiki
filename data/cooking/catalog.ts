import { BANANA_PREPARATION } from './bananaPancakeCooking';
import { BANANA_PANCAKE_MATH_CHALLENGES } from './mathChallenges';
import { FRUIT_YOGURT_MATH, FRUIT_YOGURT_PREPARATION } from './fruitYogurt';
import { BLUEBERRY_MUFFINS } from './blueberryMuffins';
import { BAKING_ASSETS, MUFFIN_INGREDIENTS } from './muffinIngredients';
import type {
  CookingProgressState,
  CookingAssetRegistry,
  EquipmentItem,
  IngredientEntry,
  RecipeConfig,
  RecipeId,
} from './types';

export const COOKING_ASSETS: CookingAssetRegistry = {
  recipes: {
    'banana-pancakes': '/games/cooking/banana-pancakes.webp',
    'fruit-yogurt': '/games/cooking/fruit-yogurt.webp',
    'oat-muffins': '/games/cooking/oat-muffins.webp',
  },
  ingredients: {
    banana: '/games/shop/products/banana.webp?v=2',
    eggs: '/games/shop/products/eggs.webp?v=2',
    oats: '/games/shop/products/oats.webp?v=2',
    yogurt: '/games/shop/products/yogurt.webp?v=2',
    strawberry: '/games/shop/products/strawberry.webp?v=2',
  },
  equipment: {
    bowl: '/games/cooking/equipment/mixing-bowl.webp',
    fork: '/games/cooking/equipment/fork.webp',
    pan: '/games/cooking/equipment/frying-pan.webp',
    spatula: '/games/cooking/equipment/spatula.webp',
    spoon: '/assets/library/cooking/kit/spoon.webp',
  },
};

export const INGREDIENTS: IngredientEntry[] = [
  ...MUFFIN_INGREDIENTS,
  {
    id: 'banana', name: 'Banaan', image: COOKING_ASSETS.ingredients.banana, contentStatus: 'ready', nutrientIds: ['carbohydrates', 'fiber'],
    origin: 'Bananen groeien aan grote kruidenplanten in warme gebieden.',
    productionRegions: ['Midden-Amerika', 'Zuid-Amerika', 'Zuidoost-Azië'],
    season: 'Het hele jaar', nutrients: ['Koolhydraten', 'Vezels', 'Kalium', 'Vitamine B6'],
    facts: ['Een bananenplant is officieel geen boom, maar een groot kruid.'],
  },
  {
    id: 'eggs', name: 'Eieren', image: COOKING_ASSETS.ingredients.eggs, contentStatus: 'ready', nutrientIds: ['protein', 'vitamin-d', 'fats'],
    origin: 'Eieren in de keuken komen meestal van kippen.', productionRegions: ['Wereldwijd'],
    season: 'Het hele jaar', nutrients: ['Eiwitten', 'Vitamine B12'],
    facts: ['Een ei helpt de ingrediënten van het beslag bij elkaar te houden.'],
  },
  {
    id: 'oats', name: 'Havermout', image: COOKING_ASSETS.ingredients.oats, contentStatus: 'ready', nutrientIds: ['iron', 'fiber', 'carbohydrates'],
    origin: 'Havermout wordt gemaakt van haverkorrels.', productionRegions: ['Europa', 'Noord-Amerika'],
    season: 'Na de graanoogst', nutrients: ['Vezels', 'IJzer'],
    facts: ['Fijne havermout kan in beslag een deel van bloem vervangen.'],
  },
  {
    id: 'yogurt', name: 'Yoghurt', image: COOKING_ASSETS.ingredients.yogurt, contentStatus: 'ready', nutrientIds: ['calcium', 'protein'],
    origin: 'Speciale bacteriën veranderen melk in yoghurt.', productionRegions: ['Nederland', 'Europa'],
    season: 'Het hele jaar', nutrients: ['Eiwitten', 'Calcium'], facts: ['Calcium helpt botten en tanden gezond te houden.'],
  },
  {
    id: 'strawberry', name: 'Aardbei', image: COOKING_ASSETS.ingredients.strawberry, contentStatus: 'ready', nutrientIds: ['vitamin-c', 'fiber'],
    origin: 'Aardbeien groeien aan lage planten, ook in Nederland.', productionRegions: ['Nederland', 'Europa'],
    season: 'Vooral lente en zomer', nutrients: ['Vitamine C', 'Vezels'], facts: ['Vitamine C helpt je afweersysteem normaal werken.'],
  },
];

export const EQUIPMENT: EquipmentItem[] = [
  ...Object.entries({ whisk: ['Garde', '/assets/library/cooking/kit/whisk.webp'], scale: ['Weegschaal', '/assets/library/cooking/kit/scale.webp'], 'measuring-jug': ['Maatbeker', BAKING_ASSETS.jug], 'muffin-pan': ['Muffinbakvorm', BAKING_ASSETS.pan] }).map(([id, [name, image]]) => ({ id, name, image, contentStatus: 'ready' as const, permanent: true as const })),
  { id: 'bowl', name: 'Mengkom', image: COOKING_ASSETS.equipment.bowl, contentStatus: 'ready', permanent: true },
  { id: 'fork', name: 'Vork', image: COOKING_ASSETS.equipment.fork, contentStatus: 'ready', permanent: true },
  { id: 'pan', name: 'Koekenpan', image: COOKING_ASSETS.equipment.pan, contentStatus: 'ready', permanent: true },
  { id: 'spatula', name: 'Spatel', image: COOKING_ASSETS.equipment.spatula, contentStatus: 'ready', permanent: true },
  { id: 'spoon', name: 'Lepel', image: COOKING_ASSETS.equipment.spoon, contentStatus: 'ready', permanent: true },
];

const bananaPancakeActions = [
  'Pel de banaan',
  'Doe de banaan in de mengkom',
  'Prak de banaan fijn met een vork',
  'Breek de eieren boven de mengkom',
  'Voeg de havermout toe',
  'Meng alles tot een glad beslag',
  'Laat een volwassene de koekenpan verwarmen',
  'Schep kleine rondjes beslag in de pan',
  'Bak tot de bovenkant bijna droog is',
  'Draai de pannenkoekjes om met de spatel',
  'Bak de andere kant goudbruin en serveer',
].map((label, index) => ({
  id: `banana-pancakes-step-${index + 1}`,
  order: index + 1,
  label,
  interaction: (index === 5 ? 'hold' : index === 8 ? 'sequence' : 'tap') as 'tap' | 'sequence' | 'hold',
  safetyNote: index === 6 ? 'Vraag altijd hulp van een volwassene bij een hete pan.' : undefined,
}));

export const RECIPES: RecipeConfig[] = [
  BLUEBERRY_MUFFINS,
  {
    id: 'banana-pancakes', name: 'Bananenpannenkoekjes', category: 'breakfast', availability: 'playable', requiredCompletedRecipes: 0, level: 1,
    shortDescription: 'Zachte pannenkoekjes van banaan, ei en havermout.', preparationMinutes: 15, servings: 2,
    image: COOKING_ASSETS.recipes['banana-pancakes'], contentStatus: 'ready', rewardCoins: 10,
    ingredients: [
      { ingredientId: 'banana', amount: 1, unit: 'piece', displayAmount: '1 banaan' },
      { ingredientId: 'eggs', amount: 2, unit: 'piece', displayAmount: '2 eieren' },
      { ingredientId: 'oats', amount: 40, unit: 'gram', displayAmount: '40 g havermout' },
    ],
    equipmentIds: ['bowl', 'fork', 'pan', 'spatula'],
    challenges: [
      { id: 'banana-double', type: 'quantity', prompt: 'Hoeveel heb je nodig voor vier porties?', answer: '2 bananen, 4 eieren en 80 g havermout', learningGoal: 'Hoeveelheden verdubbelen' },
      { id: 'banana-weigh', type: 'measurement', prompt: 'Welke hoeveelheid havermout hoort in het beslag?', answer: '40 g', options: ['20 g', '40 g', '80 g'], learningGoal: 'Grammen herkennen' },
      { id: 'banana-order', type: 'sequence', prompt: 'Wat doe je eerst?', answer: 'De banaan prakken', options: ['De banaan prakken', 'De havermout toevoegen', 'Het beslag bakken'], learningGoal: 'Een receptvolgorde begrijpen' },
    ],
    shoppingRequirements: [
      { itemId: 'banana', kind: 'ingredient', quantity: 1, required: true, price: null, purchasable: false, consumption: 'consumable' },
      { itemId: 'eggs', kind: 'ingredient', quantity: 2, required: true, price: null, purchasable: false, consumption: 'consumable' },
      { itemId: 'oats', kind: 'ingredient', quantity: 40, required: true, price: null, purchasable: false, consumption: 'consumable' },
      ...['bowl', 'fork', 'pan', 'spatula'].map(itemId => ({ itemId, kind: 'equipment' as const, quantity: 1, required: true, price: null, purchasable: false as const, consumption: 'persistent' as const })),
    ],
    actions: bananaPancakeActions,
    preparation: BANANA_PREPARATION,
    education: { math: BANANA_PANCAKE_MATH_CHALLENGES, nutrientMemory: { enabled: true, activityId: 'banana-nutrients-v1', nutrientIds: ['iron', 'protein', 'fiber', 'carbohydrates'], pairCount: 4 } },
    cookingTips: [{ id: 'soft-pancakes', character: 'coco', triggerStepId: 'cook', displayMode: 'contextual', title: 'Extra zachte pannenkoeken!', text: 'Stapel je warme pannenkoeken op een bord en leg er een tweede bord overheen. Zo blijven ze lekker warm en drogen ze minder snel uit!' }],
    homeRecipe: {
      introduction: 'Zachte bananenpannenkoekjes voor twee porties.',
      optionalIngredients: ['Een klein beetje bakvet, alleen als de pan dat nodig heeft'],
      steps: ['Zet een kom, vork, koekenpan en spatel klaar. Was je handen.', 'Pel de banaan. Doe hem in de kom en prak hem fijn met een vork.', 'Breek de twee eieren boven de kom. Verwijder eventuele stukjes schaal en was je handen na contact met rauw ei.', 'Voeg 40 g havermout toe en meng alles tot een gelijkmatig beslag.', 'Laat een volwassene een pan op middelhoog vuur verwarmen. Gebruik een goede antiaanbakpan; zo nodig kan een klein beetje bakvet worden gebruikt.', 'Schep kleine rondjes beslag in de pan. Bak rustig tot de onderkant goudbruin is en de rand stevig wordt.', 'Draai de pannenkoekjes voorzichtig om. Bak de andere kant goudbruin, tot de pannenkoekjes ook vanbinnen stevig en gaar zijn.', 'Leg de pannenkoekjes op een bord en serveer warm.'],
      safety: 'Vraag hulp van een volwassene bij de hete pan. Proef geen rauw beslag met ei.', servingTip: 'Dek de stapel kort af met een tweede bord om de pannenkoekjes warm en zacht te houden.', allergens: ['Ei', 'Haver: controleer de verpakking op gluten'],
    },
  },
  {
    id: 'fruit-yogurt', name: 'Fruityoghurt met aardbei en banaan', category: 'snack', availability: 'playable', requiredCompletedRecipes: 1, level: 1,
    shortDescription: 'Een frisse kom yoghurt met banaan en aardbeien.', preparationMinutes: 5, servings: 1,
    image: COOKING_ASSETS.recipes['fruit-yogurt'], contentStatus: 'ready', rewardCoins: 10,
    ingredients: [
      { ingredientId: 'yogurt', amount: 150, unit: 'milliliter', displayAmount: '150 ml yoghurt' },
      { ingredientId: 'strawberry', amount: 75, unit: 'gram', displayAmount: '75 g aardbeien' },
      { ingredientId: 'banana', amount: 1, unit: 'piece', displayAmount: '1 banaan' },
    ],
    equipmentIds: ['bowl', 'spoon'], challenges: [], shoppingRequirements: [], actions: [],
    preparation: FRUIT_YOGURT_PREPARATION,
    education: { math: FRUIT_YOGURT_MATH, nutrientMemory: { enabled: true, activityId: 'yogurt-nutrients-v1', nutrientIds: ['calcium', 'protein', 'vitamin-c', 'fiber'], pairCount: 4 } },
    cookingTips: [{ id: 'sweet-banana', character: 'coco', triggerStepId: 'mix-fruit', displayMode: 'contextual', title: 'Lekker met puur fruit!', text: 'Banaan en aardbeien geven je yoghurt hun eigen smaak. Kies naturel yoghurt en ontdek hoe lekker deze eenvoudige ingrediënten samen zijn!' }],
    homeRecipe: {
      introduction: 'Een frisse kom fruityoghurt voor één portie.',
      extraEquipment: ['Mes', 'Snijplank'],
      steps: ['Zet een mengkom, lepel en maatbeker klaar. Was je handen.', 'Meet 150 ml naturel yoghurt af en schenk die in de kom.', 'Was de aardbeien, haal de kroontjes eraf en weeg 75 g af. Vraag hulp bij het in stukjes snijden.', 'Pel één hele banaan en snijd die voorzichtig in plakjes.', 'Voeg de aardbeien en banaan toe aan de yoghurt. Roer rustig met de lepel.', 'Schep in een kom en eet meteen, of zet afgedekt in de koelkast.'],
      safety: 'Vraag hulp bij het snijden. Houd yoghurt koel en gebruik schoon keukengerei.', servingTip: 'Een rijpe banaan maakt het gerecht vanzelf zoet. Extra suiker is niet nodig.', allergens: ['Melk'],
    },
  },
  {
    id: 'oat-muffins', name: 'Havermoutmuffins', category: 'baking', availability: 'locked', requiredCompletedRecipes: 2, level: 2,
    shortDescription: 'Een nieuw bakavontuur dat later wordt vrijgespeeld.', preparationMinutes: null, servings: null,
    image: COOKING_ASSETS.recipes['oat-muffins'], contentStatus: 'pending', rewardCoins: null,
    ingredients: [], equipmentIds: [], challenges: [], shoppingRequirements: [], actions: [],
  },
];

export const RECIPES_BY_ID = Object.fromEntries(RECIPES.map(recipe => [recipe.id, recipe])) as Record<RecipeId, RecipeConfig>;
export const INGREDIENTS_BY_ID = Object.fromEntries(INGREDIENTS.map(item => [item.id, item])) as Record<string, IngredientEntry>;
export const EQUIPMENT_BY_ID = Object.fromEntries(EQUIPMENT.map(item => [item.id, item])) as Record<string, EquipmentItem>;

export function getCompletedRecipes(progress: CookingProgressState): RecipeConfig[] {
  return RECIPES.filter(recipe => Boolean(progress.completions[recipe.id]));
}

export const RECIPE_CATEGORIES: Array<{ id: 'all' | RecipeConfig['category']; label: string }> = [
  { id: 'all', label: 'Alles' },
  { id: 'breakfast', label: 'Ontbijt' },
  { id: 'snack', label: 'Tussendoor' },
  { id: 'baking', label: 'Bakken' },
];
