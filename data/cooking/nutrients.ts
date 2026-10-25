export interface NutrientDefinition {
  id: string;
  name: string;
  shortDescription: string;
  bodyFunction: string;
  foodExamples: string[];
  iconAsset?: string;
  difficulty: 1 | 2 | 3;
}
export interface NutrientMemoryConfig { enabled: boolean; activityId: string; nutrientIds: string[]; pairCount?: 3 | 4 | 6 }
export const NUTRIENTS: NutrientDefinition[] = [
  { id: 'iron', name: 'IJzer', shortDescription: 'Een mineraal dat je lichaam nodig heeft.', bodyFunction: 'IJzer helpt je bloed om zuurstof door je lichaam te vervoeren.', foodExamples: ['Havermout', 'Bonen', 'Vlees'], difficulty: 1 },
  { id: 'calcium', name: 'Calcium', shortDescription: 'Een mineraal voor botten en tanden.', bodyFunction: 'Calcium helpt je botten en tanden sterk te houden.', foodExamples: ['Yoghurt', 'Melk', 'Kaas'], difficulty: 1 },
  { id: 'protein', name: 'Eiwitten', shortDescription: 'Bouwstoffen voor je lichaam.', bodyFunction: 'Eiwitten helpen je lichaam groeien en weefsels herstellen.', foodExamples: ['Eieren', 'Yoghurt', 'Bonen'], difficulty: 1 },
  { id: 'fiber', name: 'Vezels', shortDescription: 'Voedingsvezels vind je in plantaardige voeding.', bodyFunction: 'Vezels helpen je darmen goed te werken.', foodExamples: ['Fruit', 'Havermout', 'Groente'], difficulty: 1 },
  { id: 'vitamin-c', name: 'Vitamine C', shortDescription: 'Een vitamine in onder andere fruit en groente.', bodyFunction: 'Vitamine C helpt je lichaam ijzer uit plantaardige voeding op te nemen.', foodExamples: ['Aardbeien', 'Paprika', 'Sinaasappel'], difficulty: 2 },
  { id: 'carbohydrates', name: 'Koolhydraten', shortDescription: 'Brandstof uit je voeding.', bodyFunction: 'Koolhydraten leveren energie aan je lichaam.', foodExamples: ['Banaan', 'Havermout', 'Brood'], difficulty: 1 },
  { id: 'vitamin-d', name: 'Vitamine D', shortDescription: 'Je lichaam maakt ook vitamine D met zonlicht.', bodyFunction: 'Vitamine D helpt je lichaam calcium op te nemen.', foodExamples: ['Vette vis', 'Eieren'], difficulty: 2 },
  { id: 'fats', name: 'Vetten', shortDescription: 'Een voedingsstof die je lichaam nodig heeft.', bodyFunction: 'Vetten leveren energie en helpen je lichaam bepaalde vitamines op te nemen.', foodExamples: ['Noten', 'Olijfolie', 'Avocado'], difficulty: 2 },
];
export const NUTRIENTS_BY_ID = Object.fromEntries(NUTRIENTS.map(item => [item.id, item])) as Record<string, NutrientDefinition>;
