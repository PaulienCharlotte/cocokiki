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
    'banana-pancakes': '/games/cooking/banana-pancakes.png',
    'fruit-yogurt': '/games/cooking/fruit-yogurt.png',
    'oat-muffins': '/games/cooking/oat-muffins.png',
  },
  ingredients: {
    banana: '/games/shop/products/banana.png?v=2',
    eggs: '/games/shop/products/eggs.png?v=2',
    oats: '/games/shop/products/oats.png?v=2',
    yogurt: '/games/shop/products/yogurt.png?v=2',
    strawberry: '/games/shop/products/strawberry.png?v=2',
  },
  equipment: {
    bowl: '/games/cooking/equipment/mixing-bowl.png',
    fork: '/games/cooking/equipment/fork.png',
    pan: '/games/cooking/equipment/frying-pan.png',
    spatula: '/games/cooking/equipment/spatula.png',
    spoon: '/games/cooking/equipment/spoon.png',
  },
};

export const INGREDIENTS: IngredientEntry[] = [
  {
    id: 'banana', name: 'Banaan', image: COOKING_ASSETS.ingredients.banana, contentStatus: 'ready',
    origin: 'Bananen groeien aan grote kruidenplanten in warme gebieden.',
    productionRegions: ['Midden-Amerika', 'Zuid-Amerika', 'Zuidoost-Azië'],
    season: 'Het hele jaar', nutrients: ['Vezels', 'Kalium', 'Vitamine B6'],
    facts: ['Een bananenplant is officieel geen boom, maar een groot kruid.'],
  },
  {
    id: 'eggs', name: 'Eieren', image: COOKING_ASSETS.ingredients.eggs, contentStatus: 'ready',
    origin: 'Eieren in de keuken komen meestal van kippen.', productionRegions: ['Wereldwijd'],
    season: 'Het hele jaar', nutrients: ['Eiwitten', 'Vitamine B12'],
    facts: ['Een ei helpt de ingrediënten van het beslag bij elkaar te houden.'],
  },
  {
    id: 'oats', name: 'Havermout', image: COOKING_ASSETS.ingredients.oats, contentStatus: 'ready',
    origin: 'Havermout wordt gemaakt van haverkorrels.', productionRegions: ['Europa', 'Noord-Amerika'],
    season: 'Na de graanoogst', nutrients: ['Vezels', 'IJzer'],
    facts: ['Fijne havermout kan in beslag een deel van bloem vervangen.'],
  },
  {
    id: 'yogurt', name: 'Yoghurt', image: COOKING_ASSETS.ingredients.yogurt, contentStatus: 'pending',
    origin: null, productionRegions: [], season: null, nutrients: [], facts: [],
  },
  {
    id: 'strawberry', name: 'Aardbei', image: COOKING_ASSETS.ingredients.strawberry, contentStatus: 'pending',
    origin: null, productionRegions: [], season: null, nutrients: [], facts: [],
  },
];

export const EQUIPMENT: EquipmentItem[] = [
  { id: 'bowl', name: 'Mengkom', image: COOKING_ASSETS.equipment.bowl, contentStatus: 'ready', permanent: true },
  { id: 'fork', name: 'Vork', image: COOKING_ASSETS.equipment.fork, contentStatus: 'ready', permanent: true },
  { id: 'pan', name: 'Koekenpan', image: COOKING_ASSETS.equipment.pan, contentStatus: 'ready', permanent: true },
  { id: 'spatula', name: 'Spatel', image: COOKING_ASSETS.equipment.spatula, contentStatus: 'ready', permanent: true },
  { id: 'spoon', name: 'Lepel', image: COOKING_ASSETS.equipment.spoon, contentStatus: 'pending', permanent: true },
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
  {
    id: 'banana-pancakes', name: 'Bananenpannenkoekjes', category: 'breakfast', availability: 'playable', requiredCompletedRecipes: 0, level: 1,
    shortDescription: 'Zachte pannenkoekjes van banaan, ei en havermout.', preparationMinutes: 15, servings: 2,
    image: COOKING_ASSETS.recipes['banana-pancakes'], contentStatus: 'ready', rewardCoins: null,
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
  },
  {
    id: 'fruit-yogurt', name: 'Yoghurt met fruit', category: 'snack', availability: 'preview', requiredCompletedRecipes: 1, level: 1,
    shortDescription: 'Een frisse kom yoghurt met banaan en aardbeien.', preparationMinutes: null, servings: null,
    image: COOKING_ASSETS.recipes['fruit-yogurt'], contentStatus: 'pending', rewardCoins: null,
    ingredients: [
      { ingredientId: 'yogurt', amount: 150, unit: 'gram', displayAmount: '150 g yoghurt' },
      { ingredientId: 'banana', amount: 1, unit: 'piece', displayAmount: '1 banaan' },
      { ingredientId: 'strawberry', amount: 5, unit: 'piece', displayAmount: '5 aardbeien' },
    ],
    equipmentIds: ['bowl', 'spoon'], challenges: [], shoppingRequirements: [], actions: [],
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
