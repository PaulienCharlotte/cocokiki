import { PLANT_SPECIES_BY_ID, type PlantSpecies, type PlantStage, type ThirstStage, type WetStage } from '../data/plants/species';
import { plantFirstAid } from '../data/plants/firstAid';
import { commitLocalState, readDocument } from './localState';
import { loadRoomInventory } from './roomInventory';

export const PLANT_FAMILY_KEY = 'cocokiki:plant-family:v1';
export const PLANT_FAMILY_CHANGE_EVENT = 'cocokiki:plant-family-change';

export const MAX_NICKNAME_LENGTH = 24;

/** Eén geadopteerde plant; de bijnaam staat los van de soortnaam. */
export interface AdoptedPlant {
  id: string;
  speciesId: string;
  nickname: string;
  adoptedAt: string;
  /** Wanneer er voor het laatst water is gegeven; leeg betekent sinds de adoptie. */
  lastWateredAt?: string;
  /** Hoe vaak er te vroeg gegoten is; de aarde droogt daarna vanzelf weer op. */
  soggy?: number;
  /** Wanneer dat voor het laatst gebeurde, zodat de aarde kan opdrogen. */
  soggyAt?: string;
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
  ).map(plant => ({
    ...plant,
    nickname: cleanNickname(plant.nickname, plant.speciesId),
    ...(typeof plant.lastWateredAt === 'string' ? { lastWateredAt: plant.lastWateredAt } : {}),
    ...(typeof plant.soggy === 'number' && plant.soggy > 0 ? { soggy: plant.soggy } : {}),
    ...(typeof plant.soggyAt === 'string' ? { soggyAt: plant.soggyAt } : {}),
  })) : [];
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

/**
 * Zorgt dat elke plant uit de voorraad ook in de plantenfamilie staat.
 *
 * Mijn Planten bleef leeg voor planten die gekocht waren voordat de familie
 * bestond. Die staan wel in de voorraad en soms al in een kamer, maar zijn
 * nooit geadopteerd, dus een kind kreeg te zien dat het nog geen planten had
 * terwijl ze gewoon op de vensterbank stonden.
 *
 * Hier verdwijnt nooit een plant: een kind heeft ze een naam gegeven, en de
 * voorraad kan alleen maar groeien omdat er niets te verkopen valt.
 */
export function syncPlantFamily(
  state: PlantFamilyState,
  owned: Record<string, number>,
  now = new Date().toISOString(),
  makeId: () => string = () => crypto.randomUUID(),
): PlantFamilyState {
  const nieuwe: AdoptedPlant[] = [];
  for (const [speciesId, aantal] of Object.entries(owned)) {
    if (!PLANT_SPECIES_BY_ID[speciesId] || !Number.isInteger(aantal) || aantal <= 0) continue;
    const alGeadopteerd = state.plants.filter(plant => plant.speciesId === speciesId).length;
    for (let index = alGeadopteerd; index < Math.min(9, aantal); index += 1) {
      nieuwe.push({ id: makeId(), speciesId, nickname: cleanNickname(null, speciesId), adoptedAt: now });
    }
  }
  if (nieuwe.length === 0) return state;
  return { ...state, plants: [...state.plants, ...nieuwe] };
}

/** Haalt de achterstand in, en bewaart hem meteen als er iets bij kwam. */
export function reconcilePlantFamily(): PlantFamilyState {
  const huidig = loadPlantFamily();
  const bijgewerkt = syncPlantFamily(huidig, loadRoomInventory().owned);
  if (bijgewerkt === huidig) return huidig;
  return savePlantFamily(bijgewerkt) ? bijgewerkt : huidig;
}

export function renamePlant(state: PlantFamilyState, id: string, nickname: string): PlantFamilyState {
  const plant = state.plants.find(item => item.id === id);
  if (!plant) return state;
  const schoon = cleanNickname(nickname, plant.speciesId);
  if (schoon === plant.nickname) return state;
  return { ...state, plants: state.plants.map(item => item.id === id ? { ...item, nickname: schoon } : item) };
}

/**
 * De toestand van een plant.
 *
 * Te weinig water maakt hem dorstig, te veel water maakt de aarde drassig.
 * Allebei zijn ze lelijk en allebei gaan ze weer over: een plant gaat nooit
 * dood. Een kind mag de fout dus maken en hem daarna herstellen.
 */
const DAG = 24 * 60 * 60 * 1000;

/** Vanaf welk veelvoud van de waterbeurt een dorststadium begint. */
const STAGE_FROM: Array<[ThirstStage, number]> = [
  ['thirst3', 3.5],
  ['thirst2', 2],
  ['thirst1', 1],
];

export interface PlantThirst {
  stage: PlantStage;
  /** 0 is net water gehad, 1 is precies toe aan een beurt, hoger is te lang geleden. */
  ratio: number;
  daysSinceWater: number;
}

export function plantThirst(plant: AdoptedPlant, waterDays: number, now = Date.now()): PlantThirst {
  const since = plant.lastWateredAt ?? plant.adoptedAt;
  const moment = Date.parse(since);
  const dagen = Number.isFinite(moment) ? Math.max(0, (now - moment) / DAG) : 0;
  const interval = Math.max(1, waterDays);
  const ratio = dagen / interval;
  const stage = STAGE_FROM.find(([, vanaf]) => ratio >= vanaf)?.[0] ?? 'fresh';
  return { stage, ratio, daysSinceWater: dagen };
}

/**
 * Hoe nat de aarde nu nog is. Elke keer te vroeg gieten telt op, en de aarde
 * droogt daarna vanzelf weer op in het tempo van die soort. Niets doen is dus
 * altijd de oplossing.
 */
export function soggyNow(plant: AdoptedPlant, species: PlantSpecies, now = Date.now()): number {
  const punten = plant.soggy ?? 0;
  if (punten <= 0) return 0;
  const sinds = Date.parse(plant.soggyAt ?? plant.adoptedAt);
  if (!Number.isFinite(sinds)) return punten;
  const perioden = Math.floor(Math.max(0, now - sinds) / DAG / Math.max(1, species.waterDays));
  return Math.max(0, punten - perioden);
}

export interface PlantCondition {
  /** Wat er aan de hand is: niets, dorst, of te natte aarde. */
  kind: 'fresh' | 'thirst' | 'wet';
  stage: PlantStage;
  ratio: number;
  soggy: number;
  /** Hoe erg het is, zodat we de plant kunnen kiezen die de meeste aandacht wil. */
  urgency: number;
}

export function plantCondition(plant: AdoptedPlant, species: PlantSpecies, now = Date.now()): PlantCondition {
  const nat = soggyNow(plant, species, now);
  const grens = Math.max(1, species.overwaterAfter);
  const { ratio } = plantThirst(plant, species.waterDays, now);
  // Te nat weegt zwaarder dan dorst: de wortels kunnen dan niets opnemen.
  if (nat >= grens) {
    const stage: WetStage = nat >= grens * 2 ? 'wet2' : 'wet1';
    return { kind: 'wet', stage, ratio, soggy: nat, urgency: 10 + nat / grens };
  }
  const stage = STAGE_FROM.find(([, vanaf]) => ratio >= vanaf)?.[0];
  if (!stage) return { kind: 'fresh', stage: 'fresh', ratio, soggy: nat, urgency: 0 };
  return { kind: 'thirst', stage, ratio, soggy: nat, urgency: ratio };
}

/**
 * Water geven. Was de plant toe aan een beurt, dan is alles weer goed. Was hij
 * dat nog niet, dan blijft het water in de aarde staan en telt dat op.
 */
export function waterPlant(state: PlantFamilyState, id: string, now = new Date().toISOString()): PlantFamilyState {
  const plant = state.plants.find(item => item.id === id);
  if (!plant) return state;
  const species = PLANT_SPECIES_BY_ID[plant.speciesId];
  const moment = Date.parse(now);
  const nu = Number.isFinite(moment) ? moment : Date.now();
  const hadDorst = species ? plantThirst(plant, species.waterDays, nu).ratio >= 1 : true;
  const nat = species && !hadDorst ? soggyNow(plant, species, nu) + 1 : 0;
  const bijgewerkt: AdoptedPlant = { ...plant, lastWateredAt: now };
  if (nat > 0) {
    bijgewerkt.soggy = nat;
    bijgewerkt.soggyAt = now;
  } else {
    delete bijgewerkt.soggy;
    delete bijgewerkt.soggyAt;
  }
  return { ...state, plants: state.plants.map(item => item.id === id ? bijgewerkt : item) };
}

const WET_LABEL: Record<WetStage, string> = {
  wet1: 'De aarde is te nat',
  wet2: 'Veel te nat',
};

/**
 * Wat er op de kaart staat. Bij dorst is dat het symptoom van die soort, want
 * een varen laat iets heel anders zien dan een cactus.
 */
export function stageLabel(species: PlantSpecies, stage: PlantStage): string {
  if (stage === 'fresh') return 'Lekker fris';
  if (stage === 'wet1' || stage === 'wet2') return WET_LABEL[stage];
  return species.symptoms[stage].label;
}

/** Wat Kiki over dit symptoom zegt. Bij natte aarde komt dat uit de EHBO-kaart. */
export function stageKiki(species: PlantSpecies, stage: PlantStage): string | null {
  if (stage === 'fresh') return null;
  if (stage === 'wet1') return 'De aarde is nog nat van de vorige keer. Wacht even met gieten.';
  if (stage === 'wet2') {
    const teNat = plantFirstAid(species.id).find(problem => problem.cause === 'te-veel-water');
    return teNat ? `${teNat.signs} ${teNat.fix}` : 'Geef een tijd geen water meer.';
  }
  return species.symptoms[stage].kiki;
}
