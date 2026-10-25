import { NUTRIENTS_BY_ID, type NutrientMemoryConfig } from './nutrients';
export interface NutrientCard { id: string; nutrientId: string; kind: 'nutrient' | 'function'; text: string; iconAsset?: string }
export interface MemoryState { openIds: string[]; matchedIds: string[] }
export function shuffle<T>(items: T[], random = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.min(index, Math.max(0, Math.floor(random() * (index + 1))));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}
export function memoryConfigIssues(config: NutrientMemoryConfig): string[] {
  if (!config || typeof config !== 'object') return ['memory:configuration-missing'];
  const issues: string[] = [];
  if (typeof config.activityId !== 'string' || !config.activityId.trim()) issues.push('memory:activity-id-missing');
  if (![3, 4, 6].includes(config.pairCount ?? 4)) issues.push('memory:pair-count-must-be-3-4-or-6');
  if (!Array.isArray(config.nutrientIds)) return [...issues, 'memory:nutrient-ids-must-be-an-array'];
  if (new Set(config.nutrientIds).size !== config.nutrientIds.length) issues.push('memory:duplicate-nutrient');
  for (const id of config.nutrientIds) if (typeof id !== 'string' || !Object.hasOwn(NUTRIENTS_BY_ID, id)) issues.push(`memory:unknown-nutrient:${id}`);
  if (config.nutrientIds.length < (config.pairCount ?? 4)) issues.push('memory:not-enough-nutrients');
  return issues;
}
export function createNutrientDeck(config: NutrientMemoryConfig, random = Math.random): NutrientCard[] {
  if (memoryConfigIssues(config).length) return [];
  return shuffle(shuffle(config.nutrientIds, random).slice(0, config.pairCount ?? 4).flatMap(id => {
    const nutrient = NUTRIENTS_BY_ID[id];
    const functionText = nutrient.bodyFunction.startsWith(`${nutrient.name} `) ? nutrient.bodyFunction.slice(nutrient.name.length + 1) : nutrient.bodyFunction;
    return [
      { id: `${id}:nutrient`, nutrientId: id, kind: 'nutrient' as const, text: nutrient.name, iconAsset: nutrient.iconAsset },
      { id: `${id}:function`, nutrientId: id, kind: 'function' as const, text: functionText.charAt(0).toUpperCase() + functionText.slice(1) },
    ];
  }), random);
}
export function revealNutrientCard(state: MemoryState, deck: NutrientCard[], id: string): MemoryState {
  if (state.openIds.length >= 2 || state.openIds.includes(id) || state.matchedIds.includes(id) || !deck.some(card => card.id === id)) return state;
  const openIds = [...state.openIds, id];
  if (openIds.length === 1) return { ...state, openIds };
  const [first, second] = openIds.map(cardId => deck.find(card => card.id === cardId)!);
  return first.nutrientId === second.nutrientId && first.kind !== second.kind
    ? { openIds: [], matchedIds: [...state.matchedIds, ...openIds] } : { ...state, openIds };
}
export function memoryComplete(state: MemoryState, deck: NutrientCard[]): boolean {
  return deck.length > 0 && deck.every(card => state.matchedIds.includes(card.id));
}
export function hideMismatchedCards(state: MemoryState): MemoryState {
  return state.openIds.length === 2 ? { ...state, openIds: [] } : state;
}
