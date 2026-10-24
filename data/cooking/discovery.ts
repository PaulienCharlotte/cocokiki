import { COOKING_ASSETS } from './catalog';
import type { IngredientDiscoveryConfig } from './types';

export const INGREDIENT_DISCOVERIES: IngredientDiscoveryConfig[] = [
  {
    ingredientId: 'banana',
    title: 'Ontdek de banaan!',
    collectionLabel: 'Banaan',
    educationalText: 'Bananen komen oorspronkelijk uit Zuidoost-Azië en groeien goed in warme, tropische landen.',
    heroFact: 'Een bananenplant is een groot kruid, geen boom.',
    origin: { label: 'Oorsprong', text: 'Bananen komen oorspronkelijk uit tropisch Azië en groeien nu in veel warme gebieden.' },
    nutrition: [
      { nutrient: 'Kalium', role: 'Helpt spieren en zenuwen normaal werken.' },
      { nutrient: 'Vitamine B6', role: 'Helpt het lichaam energie uit voeding vrijmaken.' },
      { nutrient: 'Vezels', role: 'Ondersteunen een normale spijsvertering.' },
    ],
    foodKnowledge: { label: 'Wist je dat?', text: 'Bananen groeien in grote trossen en worden meestal groen geplukt voor het vervoer.' },
    rewardCoins: 5,
    encyclopediaEntryId: 'banana',
    difficulty: 1,
    questions: [{
      id: 'banana-growing-region', type: 'single-choice',
      prompt: 'Waarom groeien bananen goed in tropische gebieden?',
      options: [
        { id: 'tropical', label: 'Ze hebben warmte en voldoende water nodig.' },
        { id: 'cold', label: 'Ze groeien het best tijdens koude, droge winters.' },
        { id: 'dry', label: 'Ze hebben bijna geen water nodig.' },
      ],
      correctOptionId: 'tropical',
      feedbackExplanation: 'Bananenplanten houden van warmte en voldoende water.',
      learningGoal: 'geography',
    }],
  },
  {
    ingredientId: 'eggs',
    title: 'Ontdek het ei!',
    collectionLabel: 'Ei',
    educationalText: 'De eieren die we meestal eten komen van kippen en bevatten eiwitten en vitamines.',
    heroFact: 'Een ei helpt het pannenkoekenbeslag bij elkaar te houden.',
    origin: { label: 'Van kip tot keuken', text: 'De meeste eieren in Nederlandse keukens komen van kippen. Op de doos staat hoe de kippen zijn gehouden.' },
    nutrition: [
      { nutrient: 'Eiwitten', role: 'Zijn bouwstoffen voor spieren en andere delen van het lichaam.' },
      { nutrient: 'Vitamine B12', role: 'Helpt bij de aanmaak van rode bloedcellen.' },
    ],
    foodKnowledge: { label: 'Keukenkennis', text: 'Bewaar eieren koel en was je handen nadat je rauw ei hebt aangeraakt.' },
    rewardCoins: 5,
    encyclopediaEntryId: 'eggs',
    difficulty: 1,
    questions: [{
      id: 'egg-animal', type: 'single-choice',
      prompt: 'Waarom gebruiken we ei in dit pannenkoekenbeslag?',
      options: [
        { id: 'chicken', label: 'Het helpt de ingrediënten bij elkaar te houden.' },
        { id: 'sweet', label: 'Het maakt het beslag vanzelf zoet.' },
        { id: 'cold', label: 'Het zorgt dat de pan koud blijft.' },
      ],
      correctOptionId: 'chicken',
      feedbackExplanation: 'Eiwitten in het ei helpen het beslag tijdens het bakken stevig te worden.',
      learningGoal: 'source',
    }],
  },
  {
    ingredientId: 'oats',
    title: 'Ontdek havermout!',
    collectionLabel: 'Havermout',
    educationalText: 'Havermout wordt gemaakt van vezelrijke haver die op akkers groeit.',
    heroFact: 'Havermout ontstaat door haverkorrels te pellen, verhitten en pletten.',
    origin: { label: 'Op de akker', text: 'Haver is een graan dat op akkers groeit. Na de oogst worden de korrels verwerkt tot vlokken.' },
    nutrition: [
      { nutrient: 'Vezels', role: 'Ondersteunen een normale spijsvertering.' },
      { nutrient: 'IJzer', role: 'Helpt zuurstof door het lichaam vervoeren.' },
      { nutrient: 'Koolhydraten', role: 'Leveren energie voor bewegen en leren.' },
    ],
    foodKnowledge: { label: 'Minder verspillen', text: 'Bewaar havermout droog en goed afgesloten; zo blijft het lang bruikbaar.' },
    rewardCoins: 5,
    encyclopediaEntryId: 'oats',
    difficulty: 1,
    questions: [{
      id: 'oats-source', type: 'single-choice',
      prompt: 'Wat is haver voordat er havermout van wordt gemaakt?',
      options: [
        { id: 'oats', label: 'Een graan dat op een akker groeit.' },
        { id: 'potatoes', label: 'Een knol die onder de grond groeit.' },
        { id: 'rice', label: 'Een zaad dat alleen in water groeit.' },
      ],
      correctOptionId: 'oats',
      feedbackExplanation: 'Havermout wordt gemaakt door haverkorrels te verwerken.',
      learningGoal: 'source',
    }],
  },
];

export const INGREDIENT_DISCOVERIES_BY_ID = Object.fromEntries(
  INGREDIENT_DISCOVERIES.map(discovery => [discovery.ingredientId, discovery]),
) as Record<string, IngredientDiscoveryConfig>;

export const DISCOVERY_ASSETS = {
  banana: COOKING_ASSETS.ingredients.banana,
  eggs: COOKING_ASSETS.ingredients.eggs,
  oats: COOKING_ASSETS.ingredients.oats,
} as const;
