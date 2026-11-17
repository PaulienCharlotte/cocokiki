import { TRAVEL_ADVENTURES } from '../data/travel/adventures';
import { studyLocations } from '../data/learning';
import { commitLocalState, readDocument } from './localState';
import { loadTestDraft } from './topoTestDraft';
import { scoreTopoTest } from './topoScoring';
export const TRAVEL_ADVENTURES_KEY = 'cocokiki:travel-adventures:v1';
interface TravelAttempt { adventureId: string; attemptId: string; startedAt: string }
interface TravelCompletion { grade: 10; completedAt: string; attemptId: string; locationIds: string[] }
interface TravelState { version: 1; active: TravelAttempt | null; completed: Record<string, TravelCompletion> }
export function loadTravelAdventures(): TravelState {
  const empty: TravelState = { version: 1, active: null, completed: {} };
  try {
    const raw = JSON.parse(readDocument(TRAVEL_ADVENTURES_KEY) ?? 'null');
    if (raw?.version !== 1) return empty;
    for (const adventure of TRAVEL_ADVENTURES) {
      const completion = raw.completed?.[adventure.id];
      if (completion?.grade === 10 && typeof completion.attemptId === 'string' && Number.isFinite(Date.parse(completion.completedAt)) && Array.isArray(completion.locationIds) && completion.locationIds.length > 0 && completion.locationIds.every((id: unknown) => typeof id === 'string')) empty.completed[adventure.id] = completion;
    }
    const active = raw.active;
    if (TRAVEL_ADVENTURES.some(item => item.id === active?.adventureId) && typeof active.attemptId === 'string' && Number.isFinite(Date.parse(active.startedAt))) empty.active = active;
    return empty;
  } catch { return empty; }
}
export function startTravelAdventure(id: string): boolean {
  const adventure = TRAVEL_ADVENTURES.find(item => item.id === id);
  if (!adventure || !studyLocations(adventure.selection).length) return false;
  const state = loadTravelAdventures();
  if (state.completed[id]) return true;
  if (state.active?.adventureId === id) return true;
  return commitLocalState({ [TRAVEL_ADVENTURES_KEY]: JSON.stringify({ ...state, active: { adventureId: id, attemptId: crypto.randomUUID(), startedAt: new Date().toISOString() } }) }).status === 'applied';
}
export function requestedTravelAdventure(search: string) {
  const id = new URLSearchParams(search).get('avontuur');
  const state = loadTravelAdventures();
  return TRAVEL_ADVENTURES.find(item => item.id === id && (state.active?.adventureId === id || state.completed[item.id]));
}
/** Read the saved, submitted full test. A URL, rounded grade or partial retry is never proof. */
export function claimTravelAdventure(id: string, areaId: string, testedIds: string[]): { status: 'earned' | 'already-earned' | 'not-ready' | 'save-failed'; reward: number } {
  const adventure = TRAVEL_ADVENTURES.find(item => item.id === id);
  const state = loadTravelAdventures();
  if (!adventure || adventure.selection.areaId !== areaId) return { status: 'not-ready', reward: 0 };
  if (state.completed[id]) return { status: 'already-earned', reward: 0 };
  const active = state.active;
  if (!active || active.adventureId !== id) return { status: 'not-ready', reward: 0 };
  const locations = studyLocations(adventure.selection), expectedIds = locations.map(item => item.id);
  if (!expectedIds.length || testedIds.length !== expectedIds.length || new Set(testedIds).size !== expectedIds.length || expectedIds.some(key => !testedIds.includes(key))) return { status: 'not-ready', reward: 0 };
  const draft = loadTestDraft(expectedIds);
  if (!draft.submitted || draft.retryIds || draft.adventureAttemptId !== active.attemptId || !draft.submittedAt || Date.parse(draft.submittedAt) < Date.parse(active.startedAt)) return { status: 'not-ready', reward: 0 };
  const score = scoreTopoTest(locations, draft.answers);
  if (score.grade !== 10 || score.correct !== score.total) return { status: 'not-ready', reward: 0 };
  const completion: TravelCompletion = { grade: 10, completedAt: draft.submittedAt, attemptId: active.attemptId, locationIds: expectedIds };
  const next = { ...state, active: null, completed: { ...state.completed, [id]: completion } };
  const saved = commitLocalState({ [TRAVEL_ADVENTURES_KEY]: JSON.stringify(next) }, [{ id: `travel-adventure:${id}:perfect`, amount: adventure.reward }]);
  return saved.status === 'applied' ? { status: 'earned', reward: adventure.reward } : saved.status === 'duplicate' ? { status: 'already-earned', reward: 0 } : { status: 'save-failed', reward: 0 };
}
