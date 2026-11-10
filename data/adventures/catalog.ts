import type { AdventureDefinition } from './types';

export interface ArithmeticScenario {
  id: string;
  introduction: string;
  question: string;
  operation: 'divide' | 'subtract';
  operands: number[];
  feedback: string;
  answerLabel?: string;
}
export interface PlayableAdventure {
  definition: AdventureDefinition;
  previewId: string;
  scenarioParameter: string;
  scenarios: ArithmeticScenario[];
  activities: Record<string, { type: 'arithmetic' } | { type: 'ingredients' | 'cooking'; recipeId: string }>;
  presentation: { completed: string; ingredients: string; cooking: string; deliveryLabel: string; answerLabel: string };
}
export function scenarioAnswer(scenario: ArithmeticScenario): number {
  return scenario.operands.slice(1).reduce((value, operand) => scenario.operation === 'divide' ? value / operand : value - operand, scenario.operands[0]);
}
export const PLAYABLE_ADVENTURES: PlayableAdventure[] = [{
  previewId: 'muffin-order', scenarioParameter: 'scenario',
  presentation: {
    completed: 'Bestelling afgeleverd! Je CocoCoins zijn toegevoegd. Zin in een nieuwe bestelling?',
    ingredients: 'Hebben we alles voor het recept? Controleer de voorraad en haal wat nog ontbreekt.',
    cooking: 'Tijd om te bakken! Weeg de ingrediënten, maak het beslag en gebruik de oven.',
    deliveryLabel: 'Bestelling afleveren', answerLabel: 'Aantal muffins',
  },
  definition: {
    id: 'milo-muffin-order', version: 1, locationId: 'milo', characterId: 'milo', title: 'De grote muffinbestelling',
    introduction: 'Help Milo! Er zijn tien blauwe-bessenmuffins besteld. Help je met rekenen, ingrediënten en bakken?',
    description: 'Maak tien muffins en lever de bestelling af.',
    parameters: { scenario: { values: ['birthday', 'picnic', 'customers', 'leftovers'], avoidPrevious: true } },
    unlock: { completedAdventureIds: [] },
    steps: [
      { id: 'order', type: 'story', text: 'We maken samen tien blauwe-bessenmuffins.' },
      { id: 'calculate', type: 'activity', activityId: 'order-arithmetic', adapterId: 'order-arithmetic' },
      { id: 'ingredients', type: 'activity', activityId: 'recipe-stock', adapterId: 'recipe-stock' },
      { id: 'bake', type: 'activity', activityId: 'recipe-cooking', adapterId: 'recipe-cooking' },
      { id: 'deliver', type: 'finish', text: 'Yes! Alle tien muffins zijn klaar. Dankzij jou kan Milo de bestelling afleveren!' },
    ],
    rewards: [
      { id: 'delivery', frequency: 'per-run', grant: { type: 'coins', amount: 10 } },
      { id: 'first-delivery', frequency: 'once', grant: { type: 'coins', amount: 20 } },
    ],
  },
  scenarios: [
    { id: 'birthday', introduction: 'Er zijn tien muffins besteld voor een verjaardag!', question: 'Verdeel tien muffins eerlijk over twee doosjes. Hoeveel gaan er in elk doosje?', operation: 'divide', operands: [10, 2], feedback: 'Verdeel de tien muffins in twee gelijke groepjes. Probeer nog eens.' },
    { id: 'picnic', introduction: 'Er zijn tien muffins besteld voor een picknick!', question: 'Verdeel tien muffins eerlijk over vijf mandjes. Hoeveel gaan er in elk mandje?', operation: 'divide', operands: [10, 5], feedback: 'Maak vijf gelijke groepjes van de tien muffins. Probeer nog eens.' },
    { id: 'customers', introduction: 'Twee klanten willen samen tien muffins!', question: 'Er zijn tien muffins. De eerste klant krijgt er vier. Hoeveel krijgt de tweede klant?', operation: 'subtract', operands: [10, 4], feedback: 'Begin bij tien en haal de vier muffins van de eerste klant eraf.' },
    { id: 'leftovers', introduction: 'Milo bakt tien muffins voor twee bestellingen!', question: 'Van tien muffins zijn er drie voor klant A en vier voor klant B. Hoeveel blijven er over?', operation: 'subtract', operands: [10, 3, 4], feedback: 'Haal eerst drie muffins van tien af, en daarna nog vier.' },
  ],
  activities: { calculate: { type: 'arithmetic' }, ingredients: { type: 'ingredients', recipeId: 'blueberry-muffins' }, bake: { type: 'cooking', recipeId: 'blueberry-muffins' } },
}];
