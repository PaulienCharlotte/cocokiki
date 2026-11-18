import { GARDEN_CROPS_BY_ID, gardenSeason, gardenTask, parseGardenNumber } from '../data/plants/garden';
import { commitLocalState, readDocument, readLocalState } from './localState';
import { COOKING_PROGRESS_KEY, loadCookingProgress } from './cookingProgress';
import { TUIN_PER_STAP } from './economie';

export const GARDEN_KEY = 'cocokiki:garden:v1';
export type GardenPart = 'action' | 'conversion';
export interface GardenPlot { id: string; cropId: string; step: number; lastCareDay: number; part?: GardenPart; helpedParts?: string[] }
export const currentGardenPart = (plot: GardenPlot): GardenPart => plot.part ?? (plot.step === 0 ? 'action' : 'conversion');
export const gardenPartKey = (plot: GardenPlot) => `${plot.step}:${currentGardenPart(plot)}`;
export interface GardenHarvest { id: string; cropId: string; destination?: 'coins' | 'kitchen' }
export interface GardenState { version: 1; revision: number; day: number; level: number; plots: Array<GardenPlot | null>; harvests: GardenHarvest[]; discovered: string[] }
export const emptyGarden = (): GardenState => ({ version: 1, revision: 0, day: 1, level: 1, plots: Array(6).fill(null), harvests: [], discovered: [] });
const integer = (value: unknown, fallback: number, max: number) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max ? value : fallback;
export function migrateGarden(value: unknown): GardenState {
  const empty = emptyGarden();
  if (!value || typeof value !== 'object' || (value as GardenState).version !== 1) return empty;
  const source = value as GardenState;
  const ids = new Set<string>();
  return { ...empty, revision: integer(source.revision, 0, Number.MAX_SAFE_INTEGER), day: Math.max(1, integer(source.day, 1, 1000000)), level: [1, 2, 3].includes(source.level) ? source.level : 1,
    plots: empty.plots.map((_, i) => { const plot = source.plots?.[i]; if (!plot || typeof plot.id !== 'string' || ids.has(plot.id) || !GARDEN_CROPS_BY_ID[plot.cropId]) return null; ids.add(plot.id); const step = integer(plot.step, 0, 4); return { id: plot.id, cropId: plot.cropId, step, lastCareDay: integer(plot.lastCareDay, 0, 1000000), part: plot.part === 'action' || plot.part === 'conversion' ? plot.part : step === 0 ? 'action' : 'conversion', helpedParts: Array.isArray(plot.helpedParts) ? [...new Set(plot.helpedParts.filter(key => typeof key === 'string' && /^[0-3]:(action|conversion)$/.test(key)))] : [] }; }),
    harvests: Array.isArray(source.harvests) ? source.harvests.filter(item => item && typeof item.id === 'string' && !ids.has(item.id) && GARDEN_CROPS_BY_ID[item.cropId] && (item.destination === undefined || item.destination === 'coins' || item.destination === 'kitchen')).filter(item => { if (ids.has(item.id)) return false; ids.add(item.id); return true; }).map(item => ({ id: item.id, cropId: item.cropId, ...(item.destination ? { destination: item.destination } : {}) })) : [],
    discovered: Array.isArray(source.discovered) ? [...new Set(source.discovered.filter(id => GARDEN_CROPS_BY_ID[id]))] : [],
  };
}
export function loadGarden(): GardenState {
  try { return migrateGarden(JSON.parse(readDocument(GARDEN_KEY) ?? 'null')); } catch { return emptyGarden(); }
}
function saveGarden(previous: GardenState, next: GardenState, extra: Record<string, string> = {}, operations: Array<{ id: string; amount: number }> = []): boolean {
  if (loadGarden().revision !== previous.revision) return false;
  const result = commitLocalState({ ...extra, [GARDEN_KEY]: JSON.stringify({ ...next, revision: previous.revision + 1 }) }, operations);
  return result.status === 'applied' || result.status === 'duplicate';
}
export function plantGardenPlot(index: number, cropId: string): boolean {
  const state = loadGarden(); const crop = GARDEN_CROPS_BY_ID[cropId];
  if (!Number.isInteger(index) || index < 0 || index >= 6 || state.plots[index] || !crop || !crop.start.includes(gardenSeason(state.day))) return false;
  const next = structuredClone(state); next.plots[index] = { id: crypto.randomUUID(), cropId, step: 0, lastCareDay: 0, part: 'action', helpedParts: [] };
  return saveGarden(state, next);
}
export function revealGardenAnswer(index: number, plotId: string, step: number, part: GardenPart): boolean {
  const state = loadGarden(); const plot = state.plots[index];
  if (!plot || plot.id !== plotId || plot.step !== step || step >= 4 || currentGardenPart(plot) !== part || (step > 0 && plot.lastCareDay >= state.day)) return false;
  const key = gardenPartKey(plot);
  if (plot.helpedParts?.includes(key)) return true;
  const next = structuredClone(state);
  next.plots[index]!.helpedParts = [...(plot.helpedParts ?? []), key];
  return saveGarden(state, next);
}
export function solveGardenPart(index: number, plotId: string, step: number, part: GardenPart, answer = '', positions: number[] = [], waterMl = 0): 'correct' | 'wrong' | 'stale' | 'save-failed' {
  const state = loadGarden(); const plot = state.plots[index];
  if (!plot || plot.id !== plotId || plot.step !== step || step >= 4 || currentGardenPart(plot) !== part || (step > 0 && plot.lastCareDay >= state.day)) return 'stale';
  const task = gardenTask(GARDEN_CROPS_BY_ID[plot.cropId], step, state.level);
  const number = parseGardenNumber(answer);
  if (part === 'conversion' ? number === null || Math.abs(number - task.answer) > 0.000001 : step === 0 ? positions.length !== 4 || ![0, 2, 4, 6].every(value => positions.includes(value)) : waterMl !== task.waterMl) return 'wrong';
  const next = structuredClone(state); const changed = next.plots[index]!;
  const lastPart = step === 0 ? part === 'conversion' : part === 'action';
  if (lastPart) { changed.step += 1; changed.part = 'conversion'; if (step > 0) changed.lastCareDay = state.day; }
  else changed.part = part === 'action' ? 'conversion' : 'action';
  // Eén beloning per stap, aan het eind: 4 munten als je beide delen zelf deed,
  // 2 als je bij één deel hulp had. Zo maakt de volgorde (eerst rekenen of eerst
  // meten) niet uit, en kun je niet twee keer belonen voor dezelfde stap.
  if (!lastPart) return saveGarden(state, next) ? 'correct' : 'save-failed';
  const geholpen = (['action', 'conversion'] as const).filter(deel => plot.helpedParts?.includes(`${step}:${deel}`)).length;
  const coins = Math.max(0, TUIN_PER_STAP - geholpen * (TUIN_PER_STAP / 2));
  return saveGarden(state, next, {}, coins ? [{ id: `garden-task:${plot.id}:${step}`, amount: coins }] : []) ? 'correct' : 'save-failed';
}
export const gardenNeedsCare = (state: GardenState): boolean => state.plots.some(plot => plot !== null && plot.step < 4 && (plot.step === 0 || plot.lastCareDay < state.day));
export function nextGardenDay(): boolean {
  const state = loadGarden(); if (state.day >= 1000000 || gardenNeedsCare(state)) return false;
  return saveGarden(state, { ...state, day: state.day + 1 });
}
export function setGardenLevel(level: number): boolean {
  if (![1, 2, 3].includes(level)) return false;
  const state = loadGarden(); return saveGarden(state, { ...state, level });
}
export function harvestGarden(index: number, plotId: string): boolean {
  const state = loadGarden(); const plot = state.plots[index];
  if (!plot || plot.id !== plotId || plot.step !== 4) return false;
  const next = structuredClone(state); next.plots[index] = null;
  next.harvests.push({ id: plot.id, cropId: plot.cropId });
  if (!next.discovered.includes(plot.cropId)) next.discovered.push(plot.cropId);
  return saveGarden(state, next);
}
export function useGardenHarvest(id: string, destination: 'coins' | 'kitchen'): boolean {
  const state = loadGarden(); const harvest = state.harvests.find(item => item.id === id);
  if (!harvest || harvest.destination) return false;
  try { if (Object.prototype.hasOwnProperty.call(readLocalState().appliedTransactions, `garden-harvest:${id}`)) return false; } catch { return false; }
  const crop = GARDEN_CROPS_BY_ID[harvest.cropId];
  const next = structuredClone(state); next.harvests.find(item => item.id === id)!.destination = destination;
  if (destination === 'coins') return saveGarden(state, next, {}, [{ id: `garden-harvest:${id}`, amount: crop.coins }]);
  if (!crop.kitchenId || !crop.kitchenAmount) return false;
  const progress = loadCookingProgress();
  progress.inventory.consumables[crop.kitchenId] = (progress.inventory.consumables[crop.kitchenId] ?? 0) + crop.kitchenAmount;
  progress.revision = (progress.revision ?? 0) + 1;
  return saveGarden(state, next, { [COOKING_PROGRESS_KEY]: JSON.stringify(progress) }, [{ id: `garden-harvest:${id}`, amount: 0 }]);
}
