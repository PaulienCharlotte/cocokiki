import { PLANT_SPECIES_BY_ID } from '../data/plants/species';
import { commitLocalState, readDocument } from './localState';

export const PLANT_FAMILY_KEY = 'cocokiki:plant-family:v1';
export const PLANT_FAMILY_CHANGE_EVENT = 'cocokiki:plant-family-change';

export const MAX_NICKNAME_LENGTH = 24;

/** Eén geadopteerde plant; de bijnaam staat los van de soortnaam. */
export interface AdoptedPlant {
  id: string;
  speciesId: string;
  nickname: string;
  adoptedAt: string;
}

export interface PlantFamilyState {
  version: 1;
  plants: AdoptedPlant[];
  /** Aankopen die al verwerkt zijn, zodat dubbelklikken niets extra oplevert. */
  appliedTransactions: string[];
}

export function createEmptyPlantFamily(): PlantFamilyState {
  return { version: 1, plants: [], appliedTransactions: [] };
}

/** Knipt een bijnaam bij en valt terug op de soortnaam als er niets overblijft. */
export function cleanNickname(value: unknown, speciesId: string): string {
  const fallback = PLANT_SPECIES_BY_ID[speciesId]?.commonName ?? 'Plant';
  if (typeof value !== 'string') return fallback;
  const trimmed = value.replace(/\s+/g, ' ').trim().slice(0, MAX_NICKNAME_LENGTH);
  return trimmed || fallback;
}

export function migratePlantFamily(value: unknown): PlantFamilyState {
  const empty = createEmptyPlantFamily();
  if (!value || typeof value !== 'object') return empty;
  const parsed = value as Partial<PlantFamilyState>;
  if (parsed.version !== 1) return empty;
  const plants = Array.isArray(parsed.plants) ? parsed.plants.filter((plant): plant is AdoptedPlant =>
    Boolean(plant) && typeof plant === 'object'
    && typeof plant.id === 'string' && plant.id.length > 0
    && typeof plant.speciesId === 'string' && Boolean(PLANT_SPECIES_BY_ID[plant.speciesId])
    && typeof plant.adoptedAt === 'string',
  ).map(plant => ({ ...plant, nickname: cleanNickname(plant.nickname, plant.speciesId) })) : [];
  // Dubbele id's zouden hernoemen onvoorspelbaar maken.
  const seen = new Set<string>();
  return {
    ...empty,
    plants: plants.filter(plant => !seen.has(plant.id) && seen.add(plant.id)),
    appliedTransactions: Array.isArray(parsed.appliedTransactions)
      ? [...new Set(parsed.appliedTransactions.filter((id): id is string => typeof id === 'string'))]
      : [],
  };
}

export function loadPlantFamily(): PlantFamilyState {
  try {
    return migratePlantFamily(JSON.parse(readDocument(PLANT_FAMILY_KEY) ?? 'null'));
  } catch {
    return createEmptyPlantFamily();
  }
}

export function savePlantFamily(state: PlantFamilyState): boolean {
  try {
    if (commitLocalState({ [PLANT_FAMILY_KEY]: JSON.stringify(state) }).status !== 'applied') return false;
    window.dispatchEvent(new CustomEvent(PLANT_FAMILY_CHANGE_EVENT, { detail: state }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Zet de planten uit één aankoop in de familie. Dezelfde aankoop twee keer
 * aanbieden verandert niets, zodat een dubbele klik geen dubbele planten geeft.
 */
export function adoptPurchaseOnce(
  state: PlantFamilyState,
  transactionId: string,
  basket: Record<string, number>,
  now = new Date().toISOString(),
  makeId: () => string = () => crypto.randomUUID(),
): PlantFamilyState {
  if (!transactionId || state.appliedTransactions.includes(transactionId)) return state;
  const nieuwe: AdoptedPlant[] = [];
  for (const [speciesId, amount] of Object.entries(basket)) {
    if (!PLANT_SPECIES_BY_ID[speciesId] || !Number.isInteger(amount) || amount <= 0) continue;
    for (let index = 0; index < Math.min(9, amount); index += 1) {
      nieuwe.push({ id: makeId(), speciesId, nickname: cleanNickname(null, speciesId), adoptedAt: now });
    }
  }
  if (nieuwe.length === 0) return state;
  return {
    ...state,
    plants: [...state.plants, ...nieuwe],
    appliedTransactions: [...state.appliedTransactions, transactionId],
  };
}

export function renamePlant(state: PlantFamilyState, id: string, nickname: string): PlantFamilyState {
  const plant = state.plants.find(item => item.id === id);
  if (!plant) return state;
  const schoon = cleanNickname(nickname, plant.speciesId);
  if (schoon === plant.nickname) return state;
  return { ...state, plants: state.plants.map(item => item.id === id ? { ...item, nickname: schoon } : item) };
}
