import type { RecipeConfig } from './types';
import { emptyStepState, type CookingSession, type CookingStepConfig, type CookingStepState } from './preparation';
import { emptyOven, restoreOven } from './oven';

export function createCookingSession(recipe: RecipeConfig, attemptId: string = crypto.randomUUID(), now = new Date().toISOString()): CookingSession {
  const oven = recipe.preparation!.steps.find(step => step.mechanic === 'oven');
  return { version: 2, recipeId: recipe.id, recipeVersion: recipe.preparation!.version, attemptId, stepId: recipe.preparation!.steps[0].id, completedStepIds: [], steps: {}, seenTipIds: [], dismissedTipIds: [], completed: false, updatedAt: now,
    ...(oven?.mechanic === 'oven' ? { oven: { ...emptyOven(), temperature: oven.oven.minimumTemperature, chosenMinutes: oven.oven.minimumMinutes } } : {}) };
}
const integer = (value: unknown, max = 100000) => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(max, Math.floor(value))) : 0;
export function migrateCookingSession(value: unknown, recipe: RecipeConfig): CookingSession {
  const empty = createCookingSession(recipe);
  if (!value || typeof value !== 'object') return empty;
  const source = value as Partial<CookingSession>;
  if (source.recipeId !== recipe.id || source.version !== 2) return empty;
  const steps = recipe.preparation!.steps;
  const ids = new Set(steps.map(step => step.id));
  const states: Record<string, CookingStepState> = {};
  for (const step of steps) {
    const state = source.steps?.[step.id];
    if (!state || typeof state !== 'object') continue;
    states[step.id] = { ...emptyStepState(), count: integer(state.count, step.target), quantity: integer(state.quantity), heat: integer(state.heat, 10),
      selectedTools: step.mechanic === 'collect' && Array.isArray(state.selectedTools) ? [...new Set(state.selectedTools.filter(id => step.tools.some(tool => tool.id === id)))] : [],
      phase: state.phase === 'wait' || state.phase === 'flip' ? state.phase : 'pour',
      readyAt: typeof state.readyAt === 'number' && Number.isFinite(state.readyAt) ? state.readyAt : null,
      choice: typeof state.choice === 'string' ? state.choice : null,
      ...(step.mechanic === 'portion' ? { portions: Array.from({ length: step.target }, (_, i) => integer(state.portions?.[i], 1)), lined: Array.isArray(state.lined) ? [...new Set(state.lined.filter(i => Number.isInteger(i) && i >= 0 && i < step.target))] : [] } : {}) };
  }
  const completedStepIds = Array.isArray(source.completedStepIds) ? [...new Set(source.completedStepIds.filter(id => ids.has(id)))] : [];
  // Terugkijken mag alleen naar een stap die je al gehad hebt.
  const viewStepId = typeof source.viewStepId === 'string' && completedStepIds.includes(source.viewStepId) ? source.viewStepId : undefined;
  return { ...empty, ...(viewStepId ? { viewStepId } : {}), attemptId: typeof source.attemptId === 'string' && source.attemptId ? source.attemptId : empty.attemptId,
    stepId: steps.find(step => !completedStepIds.includes(step.id))?.id ?? steps[steps.length - 1].id,
    completedStepIds, steps: states, ...(empty.oven ? { oven: restoreOven(source.oven ?? empty.oven) } : {}), completed: source.completed === true && steps.every(step => completedStepIds.includes(step.id)),
    seenTipIds: Array.isArray(source.seenTipIds) ? [...new Set(source.seenTipIds.filter(id => typeof id === 'string'))] : [],
    dismissedTipIds: Array.isArray(source.dismissedTipIds) ? [...new Set(source.dismissedTipIds.filter(id => typeof id === 'string'))] : [],
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : empty.updatedAt };
}

export function migrateLegacyCookingSession(value: unknown, recipe: RecipeConfig, startedAt: string, completed: boolean): CookingSession {
  const session = createCookingSession(recipe, `legacy:${recipe.id}:${startedAt}`);
  if (!value || typeof value !== 'object') return session;
  const old = value as Record<string, unknown>;
  const steps = recipe.preparation!.steps;
  const index = integer(old.stepIndex, steps.length - 1);
  session.stepId = steps[index].id;
  session.completedStepIds = steps.slice(0, index).map(step => step.id);
  for (const step of steps.slice(0, index)) {
    const state = emptyStepState();
    state.count = step.target;
    if (step.mechanic === 'collect') state.selectedTools = step.tools.map(tool => tool.id);
    if (step.mechanic === 'weigh') state.quantity = step.target;
    if (step.mechanic === 'heat') state.heat = step.target;
    if (step.mechanic === 'timed') { state.phase = 'flip'; state.readyAt = 0; }
    if (step.mechanic === 'optional') state.choice = step.choices[0].id;
    session.steps[step.id] = state;
  }
  session.steps[session.stepId] = { ...emptyStepState(), count: integer(old.actionCount), quantity: integer(old.oatGrams, 80), heat: integer(old.heat, 3), selectedTools: Array.isArray(old.selectedTools) ? old.selectedTools.filter((id): id is string => typeof id === 'string') : [] };
  if (completed && old.completed === true) { session.completed = true; session.completedStepIds = steps.map(step => step.id); }
  return session;
}

export function stepSatisfied(step: CookingStepConfig, state: CookingStepState, now = Date.now()): boolean {
  switch (step.mechanic) {
    case 'collect': return step.tools.every(tool => state.selectedTools.includes(tool.id));
    case 'repeat': return state.count >= step.target;
    case 'drag': return state.count >= 1;
    case 'weigh': return state.quantity === step.target;
    case 'measure': return state.quantity === step.target;
    case 'portion': return state.portions?.length === step.target && state.portions.every(value => value === 1) && state.lined?.length === step.target;
    case 'oven': return state.count >= 1;
    case 'heat': return state.count >= 1 && state.heat === step.target;
    case 'timed': return state.phase === 'flip' && state.readyAt !== null && now >= state.readyAt;
    case 'optional': return step.choices.some(choice => choice.id === state.choice);
    default: return false;
  }
}
export function updateCookingStep(session: CookingSession, patch: Partial<CookingStepState>): CookingSession {
  if (session.completed) return session;
  return { ...session, steps: { ...session.steps, [session.stepId]: { ...emptyStepState(), ...session.steps[session.stepId], ...patch } }, updatedAt: new Date().toISOString() };
}
export function advancePreparation(session: CookingSession, recipe: RecipeConfig, now = Date.now()): CookingSession {
  if (session.completed) return session;
  const index = recipe.preparation!.steps.findIndex(step => step.id === session.stepId);
  const step = recipe.preparation!.steps[index];
  if (!step || !stepSatisfied(step, session.steps[step.id] ?? emptyStepState(), now)) return session;
  const completedStepIds = [...new Set([...session.completedStepIds, step.id])];
  return { ...session, completedStepIds, stepId: recipe.preparation!.steps[index + 1]?.id ?? step.id, updatedAt: new Date(now).toISOString() };
}

/**
 * Een stap terugkijken.
 *
 * Een kind dat een tip wegklikte of niet meer weet hoeveel het ook alweer moest
 * wegen, moest het recept tot nu toe overnieuw doen. Terugbladeren verandert
 * niets aan wat al afgerond is: het verzet alleen waar je kijkt.
 */
export function goBackPreparation(session: CookingSession, recipe: RecipeConfig): CookingSession {
  if (session.completed) return session;
  const steps = recipe.preparation!.steps;
  const index = steps.findIndex(step => step.id === (session.viewStepId ?? session.stepId));
  const vorige = steps[index - 1];
  // Alleen terug naar wat je al gedaan hebt; verder terug valt niets te zien.
  if (!vorige || !session.completedStepIds.includes(vorige.id)) return session;
  return { ...session, viewStepId: vorige.id };
}

/** Terug naar waar je gebleven was: het terugkijken stopt, de voortgang blijft. */
export function resumePreparation(session: CookingSession): CookingSession {
  if (!session.viewStepId) return session;
  const { viewStepId, ...rest } = session;
  return rest;
}
