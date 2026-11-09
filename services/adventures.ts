import { commitLocalState, readDocument, readLocalState, type LocalOperation } from './localState';
import type { AdventureActivityAdapter, AdventureCompletion, AdventureDefinition, AdventureRun, AdventureState, AdventureValue } from '../data/adventures/types';

export const ADVENTURE_STATE_KEY = 'cocokiki:adventures:v1';
const validId = (value: unknown): value is string => typeof value === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9:_-]{0,159}$/.test(value);
const validDate = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const scalar = (value: unknown): value is AdventureValue => typeof value === 'boolean' || typeof value === 'string' && value.length <= 500 || typeof value === 'number' && Number.isFinite(value);
const parametersValid = (value: unknown) => record(value) && Object.entries(value).every(([key, item]) => validId(key) && scalar(item));
const unique = (values: string[]) => new Set(values).size === values.length;
const receiptValid = (value: unknown): value is AdventureCompletion => record(value)
  && ['runId', 'stepId', 'activityId', 'attemptId', 'sourceAttemptId'].every(key => validId(value[key])) && validDate(value.startedAt) && validDate(value.completedAt);

export function validateAdventureDefinition(definition: AdventureDefinition): boolean {
  if (!definition || ![definition.id, definition.locationId, definition.characterId].every(validId)
    || !Number.isSafeInteger(definition.version) || definition.version < 1
    || ![definition.title, definition.introduction, definition.description].every(value => typeof value === 'string' && value.trim().length > 0)
    || !Array.isArray(definition.steps) || !definition.steps.length || !unique(definition.steps.map(step => step?.id))
    || !definition.steps.every((step, index) => step && validId(step.id) && (step.type === 'activity'
      ? validId(step.activityId) && validId(step.adapterId)
      : (step.type === 'story' || step.type === 'finish') && typeof step.text === 'string' && !!step.text.trim())
      && (step.type === 'finish') === (index === definition.steps.length - 1))
    || !record(definition.parameters) || !Object.entries(definition.parameters).every(([key, spec]) => validId(key) && record(spec)
      && Array.isArray(spec.values) && spec.values.length > 0 && spec.values.every(scalar) && (spec.avoidPrevious === undefined || typeof spec.avoidPrevious === 'boolean'))
    || !record(definition.unlock) || !Array.isArray(definition.unlock.completedAdventureIds)
    || !definition.unlock.completedAdventureIds.every(id => validId(id) && id !== definition.id)
    || !Array.isArray(definition.rewards) || !unique(definition.rewards.map(reward => reward?.id))) return false;
  return definition.rewards.every(reward => reward && validId(reward.id) && ['once', 'per-run'].includes(reward.frequency)
    && reward.grant && (reward.grant.type === 'coins' ? Number.isSafeInteger(reward.grant.amount) && reward.grant.amount > 0
      : reward.grant.type === 'inventory' && validId(reward.grant.productId) && Number.isSafeInteger(reward.grant.quantity) && reward.grant.quantity > 0));
}

function validRun(value: unknown): value is AdventureRun {
  if (!record(value) || !['id', 'adventureId', 'currentStepId'].every(key => validId(value[key]))
    || !Number.isSafeInteger(value.definitionVersion) || Number(value.definitionVersion) < 1 || !parametersValid(value.parameters)
    || !Array.isArray(value.completedStepIds) || !value.completedStepIds.every(validId) || !unique(value.completedStepIds)
    || !Array.isArray(value.completions) || !value.completions.every(receiptValid)
    || !['active', 'completed', 'abandoned', 'incompatible'].includes(String(value.status))
    || !['not-earned', 'pending', 'claimed'].includes(String(value.rewardStatus)) || !validDate(value.startedAt) || !validDate(value.updatedAt)) return false;
  if (value.status !== 'completed' && value.rewardStatus !== 'not-earned') return false;
  const attempt = value.pendingAttempt;
  return attempt === null || record(attempt) && ['runId', 'stepId', 'activityId', 'adapterId', 'attemptId'].every(key => validId(attempt[key]))
    && attempt.runId === value.id && attempt.stepId === value.currentStepId && validDate(attempt.issuedAt)
    && parametersValid(attempt.parameters) && JSON.stringify(attempt.parameters) === JSON.stringify(value.parameters);
}

/** Unknown/corrupt storage is blocked, not silently replaced or migrated away. */
export function loadAdventureState(): AdventureState {
  const raw = readDocument(ADVENTURE_STATE_KEY);
  if (raw === null) return { version: 1, revision: 0, runs: [] };
  const state = JSON.parse(raw);
  if (!state || state.version !== 1 || !Number.isSafeInteger(state.revision) || state.revision < 0 || !Array.isArray(state.runs)
    || !state.runs.every(validRun) || !unique(state.runs.map((run: AdventureRun) => run.id))
    || state.runs.filter((run: AdventureRun) => run.status === 'active').length > 1) throw Error('invalid-storage');
  return state;
}

function compatible(run: AdventureRun, definition?: AdventureDefinition): boolean {
  if (!definition || definition.version !== run.definitionVersion) return false;
  const keys = Object.keys(definition.parameters);
  if (keys.length !== Object.keys(run.parameters).length || !keys.every(key => definition.parameters[key].values.includes(run.parameters[key]))) return false;
  const index = definition.steps.findIndex(step => step.id === run.currentStepId);
  const step = definition.steps[index];
  if (run.pendingAttempt && (!step || step.type !== 'activity' || run.pendingAttempt.activityId !== step.activityId
    || run.pendingAttempt.adapterId !== step.adapterId)) return false;
  if (run.status === 'completed' && step?.type !== 'finish') return false;
  const prefix = definition.steps.slice(0, run.status === 'completed' ? definition.steps.length : index).map(step => step.id);
  if (index < 0 || JSON.stringify(prefix) !== JSON.stringify(run.completedStepIds)) return false;
  const expected = definition.steps.filter(step => step.type === 'activity' && prefix.includes(step.id));
  return expected.length === run.completions.length && expected.every(step => step.type === 'activity' && run.completions.some(completion =>
    completion.runId === run.id && completion.stepId === step.id && completion.activityId === step.activityId));
}

export class AdventureEngine {
  private definitions: Map<string, AdventureDefinition>;
  constructor(definitions: AdventureDefinition[], private adapters: Record<string, AdventureActivityAdapter> = {}, private options: {
    makeId?: () => string; now?: () => string; random?: () => number;
  } = {}) {
    if (!definitions.every(validateAdventureDefinition) || !unique(definitions.map(definition => definition.id))) throw Error('invalid-definition');
    this.definitions = new Map(structuredClone(definitions).map(definition => [definition.id, definition]));
  }
  private now() { const now = (this.options.now ?? (() => new Date().toISOString()))(); if (!validDate(now)) throw Error('invalid-clock'); return now; }
  private id() { const id = (this.options.makeId ?? (() => crypto.randomUUID()))(); if (!validId(id)) throw Error('invalid-id'); return id; }
  private save(state: AdventureState, operations: LocalOperation[] = []) {
    if (loadAdventureState().revision !== state.revision) throw Error('stale-state');
    state.revision++;
    const saved = commitLocalState({ [ADVENTURE_STATE_KEY]: JSON.stringify(state) }, operations);
    if (saved.status !== 'applied' && saved.status !== 'duplicate') throw Error('storage-failed');
  }
  private active(state: AdventureState, runId: string, stepId: string) {
    const run = state.runs.find(item => item.id === runId);
    if (!run || run.status !== 'active' || run.currentStepId !== stepId) throw Error('stale-step');
    const definition = this.definitions.get(run.adventureId);
    if (!compatible(run, definition)) throw Error('incompatible-definition');
    return { run, definition: definition!, step: definition!.steps.find(step => step.id === stepId)! };
  }
  resume(): AdventureRun | null {
    const state = loadAdventureState();
    const run = state.runs.find(item => item.status === 'active');
    if (!run) return null;
    if (!compatible(run, this.definitions.get(run.adventureId))) {
      run.status = 'incompatible'; run.updatedAt = this.now(); this.save(state); return null;
    }
    return structuredClone(run);
  }
  start(adventureId: string): AdventureRun {
    const state = loadAdventureState();
    if (state.runs.some(run => run.status === 'active')) throw Error('active-adventure');
    const definition = this.definitions.get(adventureId);
    if (!definition) throw Error('unknown-adventure');
    if (!definition.unlock.completedAdventureIds.every(id => state.runs.some(run => run.adventureId === id && run.status === 'completed'))) throw Error('locked');
    const parameters: AdventureRun['parameters'] = {};
    const previous = [...state.runs].reverse().find(run => run.adventureId === adventureId);
    for (const [key, spec] of Object.entries(definition.parameters)) {
      const random = (this.options.random ?? Math.random)();
      if (!Number.isFinite(random) || random < 0 || random >= 1) throw Error('invalid-random');
      const choices = spec.avoidPrevious && spec.values.some(value => value !== previous?.parameters[key]) ? spec.values.filter(value => value !== previous?.parameters[key]) : spec.values;
      Object.defineProperty(parameters, key, { value: choices[Math.floor(random * choices.length)], enumerable: true, writable: true, configurable: true });
    }
    const id = this.id(), now = this.now();
    if (state.runs.some(run => run.id === id)) throw Error('duplicate-id');
    const run: AdventureRun = { id, adventureId, definitionVersion: definition.version, parameters,
      currentStepId: definition.steps[0].id, completedStepIds: [], completions: [], pendingAttempt: null,
      status: 'active', rewardStatus: 'not-earned', startedAt: now, updatedAt: now };
    state.runs.push(run); this.save(state); return structuredClone(run);
  }
  replay(runId: string) {
    const run = loadAdventureState().runs.find(item => item.id === runId);
    if (!run || run.status !== 'completed') throw Error('not-completed');
    return this.start(run.adventureId);
  }
  private advance(run: AdventureRun, definition: AdventureDefinition) {
    run.completedStepIds.push(run.currentStepId);
    run.currentStepId = definition.steps[run.completedStepIds.length].id;
    run.pendingAttempt = null; run.updatedAt = this.now();
  }
  advanceStory(runId: string, stepId: string) {
    const state = loadAdventureState(), { run, definition, step } = this.active(state, runId, stepId);
    if (step.type !== 'story') throw Error('wrong-step-type');
    this.advance(run, definition); this.save(state); return structuredClone(run);
  }
  prepareActivity(runId: string, stepId: string) {
    const state = loadAdventureState(), { run, step } = this.active(state, runId, stepId);
    if (step.type !== 'activity') throw Error('wrong-step-type');
    if (run.pendingAttempt) return structuredClone(run.pendingAttempt);
    const attemptId = this.id();
    if (state.runs.some(item => item.pendingAttempt?.attemptId === attemptId || item.completions.some(receipt => receipt.attemptId === attemptId))) throw Error('duplicate-id');
    run.pendingAttempt = { runId, stepId, activityId: step.activityId, adapterId: step.adapterId, attemptId, issuedAt: this.now(), parameters: structuredClone(run.parameters) };
    this.save(state); return structuredClone(run.pendingAttempt);
  }
  completeActivity(runId: string, stepId: string) {
    const state = loadAdventureState(), { run, definition, step } = this.active(state, runId, stepId);
    if (step.type !== 'activity' || !run.pendingAttempt) throw Error('activity-not-started');
    const adapter = Object.hasOwn(this.adapters, step.adapterId) ? this.adapters[step.adapterId] : undefined;
    if (!adapter || adapter.activityId !== step.activityId) throw Error('missing-adapter');
    const context = structuredClone(run.pendingAttempt), completion = adapter.readCompletion(structuredClone(context));
    if (!receiptValid(completion) || completion.runId !== run.id || completion.stepId !== step.id || completion.activityId !== step.activityId
      || completion.attemptId !== context.attemptId || Date.parse(completion.startedAt) < Date.parse(context.issuedAt)
      || Date.parse(completion.completedAt) < Date.parse(completion.startedAt)
      || Date.parse(completion.completedAt) > Date.parse(this.now()) || !adapter.validateCompletion(structuredClone(context), structuredClone(completion))
      || state.runs.some(item => item.completions.some(receipt => receipt.activityId === completion.activityId && receipt.sourceAttemptId === completion.sourceAttemptId))) throw Error('invalid-completion');
    run.completions.push(structuredClone(completion)); this.advance(run, definition); this.save(state); return structuredClone(run);
  }
  finish(runId: string, stepId: string, options: { claimRewards?: boolean } = {}) {
    const previous = loadAdventureState().runs.find(run => run.id === runId);
    if (options.claimRewards && previous?.status === 'completed' && previous.rewardStatus === 'claimed') {
      if (previous.currentStepId !== stepId) throw Error('stale-step');
      if (!compatible(previous, this.definitions.get(previous.adventureId))) throw Error('incompatible-definition');
      return structuredClone(previous);
    }
    const state = loadAdventureState(), { run, definition, step } = this.active(state, runId, stepId);
    if (step.type !== 'finish' || run.completedStepIds.length !== definition.steps.length - 1) throw Error('not-ready');
    run.completedStepIds.push(step.id); run.status = 'completed'; run.pendingAttempt = null;
    run.rewardStatus = definition.rewards.length ? 'pending' : 'not-earned'; run.updatedAt = this.now();
    const operations: LocalOperation[] = [];
    if (options.claimRewards) {
      const ledger = readLocalState().appliedTransactions;
      for (const reward of definition.rewards) {
        if (reward.grant.type !== 'coins') throw Error('unsupported-reward');
        const id = reward.frequency === 'once' ? `adventure:first:${definition.id}:${reward.id}` : `adventure:run:${run.id}:${reward.id}`;
        if (!Object.hasOwn(ledger, id)) operations.push({ id, amount: reward.grant.amount });
      }
      run.rewardStatus = 'claimed';
    }
    this.save(state, operations); return structuredClone(run);
  }
  abandon(runId: string) {
    const state = loadAdventureState(), run = state.runs.find(item => item.id === runId);
    if (!run || run.status !== 'active') throw Error('not-active');
    run.status = 'abandoned'; run.updatedAt = this.now(); this.save(state);
  }
}
