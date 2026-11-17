import { studyLocations, memoryPairs, locationProgressKey } from '../data/learning';
import type { TravelAdventure } from '../data/travel/adventures';
import { commitLocalState, readDocument } from './localState';

export const TRAVEL_JOURNEY_KEY = 'cocokiki:travel-journey:v1';
export const TRAVEL_STEPS = ['facts', 'memory', 'find', 'master', 'test'] as const;
export type TravelStep = typeof TRAVEL_STEPS[number];
export type PracticeTravelStep = Exclude<TravelStep, 'test'>;
export const TRAVEL_STEP_LABELS: Record<TravelStep, string> = { facts: 'Ontdek de weetjes', memory: 'Vind de setjes', find: 'Wijs alles aan', master: 'Wijs aan en spel', test: 'Laat zien wat je weet' };
export const TRAVEL_STEP_REWARDS: Record<PracticeTravelStep, number> = { facts: 10, memory: 20, find: 25, master: 25 };
export const TRAVEL_STEP_TOTAL = 80;
export interface TravelJourneyRun { attemptId: string; facts: string[]; memory: string[]; find: string[]; master: string[] }
export function travelStepIds(adventure: TravelAdventure, step: PracticeTravelStep): string[] {
  if (step === 'memory') return memoryPairs(adventure.selection).map(pair => pair.id);
  const locations = studyLocations(adventure.selection);
  return [...new Set(locations.map(step === 'facts' ? place => place.id : locationProgressKey))];
}
function readRuns(): Record<string, TravelJourneyRun> {
  try { const raw = JSON.parse(readDocument(TRAVEL_JOURNEY_KEY) ?? 'null'); return raw?.version === 1 && raw.runs && typeof raw.runs === 'object' ? raw.runs : {}; } catch { return {}; }
}
export function loadTravelJourney(adventure: TravelAdventure): TravelJourneyRun | null {
  const raw = readRuns()[adventure.id];
  if (!raw || typeof raw.attemptId !== 'string') return null;
  const run: TravelJourneyRun = { attemptId: raw.attemptId, facts: [], memory: [], find: [], master: [] };
  for (const step of TRAVEL_STEPS.slice(0, 4) as PracticeTravelStep[]) {
    const valid = new Set(travelStepIds(adventure, step));
    run[step] = Array.isArray(raw[step]) ? [...new Set(raw[step].filter(id => typeof id === 'string' && valid.has(id)))] : [];
  }
  return run;
}
export function currentTravelStep(adventure: TravelAdventure, run: TravelJourneyRun): TravelStep {
  return (TRAVEL_STEPS.slice(0, 4) as PracticeTravelStep[]).find(step => travelStepIds(adventure, step).some(id => !run[step].includes(id))) ?? 'test';
}
export function ensureTravelJourney(adventure: TravelAdventure, attemptId: string): TravelJourneyRun | null {
  const current = loadTravelJourney(adventure);
  if (current?.attemptId === attemptId) return current;
  const run: TravelJourneyRun = { attemptId, facts: [], memory: [], find: [], master: [] };
  const saved = commitLocalState({ [TRAVEL_JOURNEY_KEY]: JSON.stringify({ version: 1, runs: { ...readRuns(), [adventure.id]: run } }) });
  return saved.status === 'applied' ? run : null;
}
/** Alleen een echt resultaat uit de huidige stap telt. Stap en beloning worden samen bewaard. */
export function recordTravelStep(adventure: TravelAdventure, attemptId: string, step: PracticeTravelStep, id: string): boolean {
  let active: { adventureId?: string; attemptId?: string } | undefined;
  try { active = JSON.parse(readDocument('cocokiki:travel-adventures:v1') ?? 'null')?.active; } catch { return false; }
  const run = loadTravelJourney(adventure);
  if (!run || run.attemptId !== attemptId || active?.attemptId !== attemptId || active.adventureId !== adventure.id) return false;
  if (!travelStepIds(adventure, step).includes(id)) return false;
  if (run[step].includes(id)) return true;
  if (currentTravelStep(adventure, run) !== step) return false;
  const next = { ...run, [step]: [...run[step], id] };
  const completed = travelStepIds(adventure, step).every(key => next[step].includes(key));
  const saved = commitLocalState({ [TRAVEL_JOURNEY_KEY]: JSON.stringify({ version: 1, runs: { ...readRuns(), [adventure.id]: next } }) }, completed ? [{ id: `travel-step:${adventure.id}:${step}:v1`, amount: TRAVEL_STEP_REWARDS[step] }] : []);
  return saved.status === 'applied' || saved.status === 'duplicate';
}
