import test from 'node:test';
import assert from 'node:assert/strict';
import { AdventureEngine, ADVENTURE_STATE_KEY, loadAdventureState, validateAdventureDefinition } from '../services/adventures';
import { commitLocalState, LOCAL_STATE_KEY, readDocument, readLocalState } from '../services/localState';
import type { AdventureActivityAdapter, AdventureAttempt, AdventureCompletion, AdventureDefinition } from '../data/adventures/types';

const definition = (): AdventureDefinition => ({
  id: 'test-adventure', version: 1, locationId: 'test-location', characterId: 'test-character',
  title: 'Test', introduction: 'Intro', description: 'Description',
  steps: [{ id: 'intro', type: 'story', text: 'Begin' },
    { id: 'practice', type: 'activity', activityId: 'test-game', adapterId: 'test-adapter' },
    { id: 'finish', type: 'finish', text: 'Klaar' }],
  unlock: { completedAdventureIds: [] }, parameters: { count: { values: [10, 20] }, difficulty: { values: [1, 2] } },
  rewards: [{ id: 'coins', frequency: 'per-run', grant: { type: 'coins', amount: 5 } },
    { id: 'object', frequency: 'once', grant: { type: 'inventory', productId: 'test-object', quantity: 1 } }],
});
function memory(run: (values: Map<string, string>, fail: () => void) => void) {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const values = new Map<string, string>(); let blocked = false;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { if (blocked) throw Error('full'); values.set(key, value); },
  } });
  try { run(values, () => { blocked = true; }); }
  finally { if (original) Object.defineProperty(globalThis, 'localStorage', original); else Reflect.deleteProperty(globalThis, 'localStorage'); }
}
function setup(definitions = [definition()]) {
  let number = 0, random = 0;
  let receipt: AdventureCompletion | null = null, valid = true;
  const adapters: Record<string, AdventureActivityAdapter> = { 'test-adapter': {
    activityId: 'test-game', readCompletion: () => receipt, validateCompletion: () => valid,
  } };
  const options = { makeId: () => `test-${++number}`, now: () => '2026-11-02T12:00:00.000Z', random: () => random };
  return {
    engine: new AdventureEngine(definitions, adapters, options),
    reload: () => new AdventureEngine(definitions, adapters, options),
    random: (value: number) => { random = value; },
    invalidate: () => { valid = false; },
    receipt: (attempt: AdventureAttempt, overrides: Partial<AdventureCompletion> = {}) => {
      receipt = { runId: attempt.runId, stepId: attempt.stepId, activityId: attempt.activityId,
        attemptId: attempt.attemptId, sourceAttemptId: `source-${attempt.attemptId}`, startedAt: options.now(), completedAt: options.now(), ...overrides };
    },
  };
}
function toActivity(engine: AdventureEngine) {
  const run = engine.start('test-adventure');
  engine.advanceStory(run.id, 'intro');
  return engine.prepareActivity(run.id, 'practice');
}

test('adventure starts with saved parameters and resumes after a fresh engine instance', () => memory(() => {
  const fixture = setup(), run = fixture.engine.start('test-adventure');
  assert.deepEqual(run.parameters, { count: 10, difficulty: 1 });
  fixture.random(.99);
  assert.deepEqual(fixture.reload().resume(), run);
  run.parameters.count = 999;
  assert.equal(fixture.engine.resume()!.parameters.count, 10);
  assert.throws(() => fixture.engine.start('test-adventure'), /active-adventure/);
  assert.throws(() => fixture.engine.finish(run.id, 'finish'), /stale-step/);
  fixture.engine.advanceStory(run.id, 'intro');
  assert.throws(() => fixture.engine.advanceStory(run.id, 'intro'), /stale-step/);
  assert.deepEqual(fixture.reload().resume()!.completedStepIds, ['intro']);
}));

test('reload/navigation never completes an activity and preparation is idempotent', () => memory(() => {
  const fixture = setup(), context = toActivity(fixture.engine);
  assert.deepEqual(fixture.reload().prepareActivity(context.runId, 'practice'), context);
  assert.equal(fixture.reload().resume()!.currentStepId, 'practice');
  assert.throws(() => fixture.engine.completeActivity(context.runId, 'practice'), /invalid-completion/);
  assert.throws(() => fixture.engine.advanceStory(context.runId, 'practice'), /wrong-step-type/);
  assert.equal(fixture.engine.resume()!.completions.length, 0);
}));

test('activity rejects mismatched, historical, future and adapter-invalid completions', () => memory(() => {
  const fixture = setup(), context = toActivity(fixture.engine);
  const invalid: Partial<AdventureCompletion>[] = [
    { runId: 'other-run' }, { stepId: 'other-step' }, { activityId: 'other-game' }, { attemptId: 'old-attempt' },
    { startedAt: '2020-01-01T00:00:00Z' }, { completedAt: '2020-01-01T00:00:00Z' }, { completedAt: '2030-01-01T00:00:00Z' }, { sourceAttemptId: '' },
  ];
  for (const overrides of invalid) {
    fixture.receipt(context, overrides);
    assert.throws(() => fixture.engine.completeActivity(context.runId, 'practice'), /invalid-completion/);
  }
  fixture.receipt(context); fixture.invalidate();
  assert.throws(() => fixture.engine.completeActivity(context.runId, 'practice'), /invalid-completion/);
}));

test('completion is explicit, rewards stay pending and replay generates a new immutable parameter selection', () => memory(() => {
  const fixture = setup(), context = toActivity(fixture.engine);
  fixture.receipt(context);
  fixture.engine.completeActivity(context.runId, 'practice');
  assert.equal(fixture.reload().resume()!.status, 'active');
  const finished = fixture.engine.finish(context.runId, 'finish');
  assert.equal(finished.status, 'completed');
  assert.equal(finished.rewardStatus, 'pending');
  assert.deepEqual(finished.completedStepIds, ['intro', 'practice', 'finish']);
  assert.equal(readLocalState().balance, 0);
  assert.deepEqual(readLocalState().appliedTransactions, {});
  assert.equal(fixture.engine.resume(), null);
  assert.throws(() => fixture.engine.finish(context.runId, 'finish'), /stale-step/);
  fixture.random(.99);
  const replay = fixture.engine.replay(context.runId);
  assert.notEqual(replay.id, context.runId);
  assert.deepEqual(replay.parameters, { count: 20, difficulty: 2 });
  fixture.engine.advanceStory(replay.id, 'intro');
  const next = fixture.engine.prepareActivity(replay.id, 'practice');
  fixture.receipt(next, { sourceAttemptId: `source-${context.attemptId}` });
  assert.throws(() => fixture.engine.completeActivity(replay.id, 'practice'), /invalid-completion/);
}));

test('version changes and removed definitions archive active runs without deleting their data', () => memory(() => {
  const fixture = setup(), run = fixture.engine.start('test-adventure');
  const changed = definition(); changed.version = 2;
  assert.equal(new AdventureEngine([changed]).resume(), null);
  assert.equal(loadAdventureState().runs[0].status, 'incompatible');
  assert.deepEqual(loadAdventureState().runs[0].parameters, run.parameters);
  const second = fixture.engine.start('test-adventure');
  assert.equal(new AdventureEngine([]).resume(), null);
  assert.equal(loadAdventureState().runs.find(item => item.id === second.id)!.status, 'incompatible');
}));

test('unknown schemas, malformed storage and incompatible step changes are never silently reset', () => memory(values => {
  for (const raw of ['{broken', JSON.stringify({ version: 99, revision: 0, runs: [] })]) {
    values.set(ADVENTURE_STATE_KEY, raw);
    assert.throws(() => setup().engine.start('test-adventure'));
    assert.equal(values.get(ADVENTURE_STATE_KEY), raw);
  }
  values.delete(ADVENTURE_STATE_KEY);
  const fixture = setup(); toActivity(fixture.engine);
  const changed = definition(); changed.steps[1] = { id: 'new-step', type: 'activity', activityId: 'test-game', adapterId: 'test-adapter' };
  assert.equal(new AdventureEngine([changed]).resume(), null);
  assert.equal(loadAdventureState().runs[0].status, 'incompatible');
}));

test('existing coins, inventory and game documents survive adventure writes and failed saves', () => memory((values, fail) => {
  const documents = { cooking: '{"kept":true}', inventory: '{"owned":7}', math: '{"level":5}' };
  commitLocalState(documents, [{ id: 'existing-reward', amount: 42 }]);
  values.set('legacy-progress', 'unchanged');
  const fixture = setup(), run = fixture.engine.start('test-adventure');
  assert.equal(readLocalState().balance, 42);
  assert.equal(readLocalState().appliedTransactions['existing-reward'], 42);
  for (const [key, raw] of Object.entries(documents)) assert.equal(readDocument(key), raw);
  assert.equal(values.get('legacy-progress'), 'unchanged');
  const snapshot = values.get(LOCAL_STATE_KEY);
  fail(); assert.throws(() => fixture.engine.advanceStory(run.id, 'intro'), /storage-failed/);
  assert.equal(values.get(LOCAL_STATE_KEY), snapshot);
}));

test('definition validation, prerequisites, missing adapters and abandonment fail closed', () => memory(() => {
  const invalid = definition(); invalid.steps.push({ id: 'after', type: 'story', text: 'No' });
  assert.equal(validateAdventureDefinition(invalid), false);
  assert.throws(() => new AdventureEngine([definition(), definition()]), /invalid-definition/);
  const locked = definition(); locked.id = 'locked'; locked.unlock.completedAdventureIds = ['test-adventure'];
  const fixture = setup([definition(), locked]);
  assert.throws(() => fixture.engine.start('locked'), /locked/);
  const context = toActivity(fixture.engine);
  assert.throws(() => new AdventureEngine([definition()]).completeActivity(context.runId, 'practice'), /missing-adapter/);
  fixture.engine.abandon(context.runId);
  assert.equal(fixture.engine.resume(), null);
  assert.equal(loadAdventureState().runs[0].status, 'abandoned');
  assert.throws(() => fixture.engine.replay(context.runId), /not-completed/);
}));

test('a changed revision during adapter validation cannot resurrect or overwrite a newer run state', () => memory(() => {
  const fixture = setup(), context = toActivity(fixture.engine);
  const engine = new AdventureEngine([definition()], { 'test-adapter': {
    activityId: 'test-game', readCompletion: () => ({ runId: context.runId, stepId: context.stepId,
      activityId: context.activityId, attemptId: context.attemptId, sourceAttemptId: 'fresh-source',
      startedAt: context.issuedAt, completedAt: context.issuedAt }),
    validateCompletion: () => { fixture.engine.abandon(context.runId); return true; },
  } });
  assert.throws(() => engine.completeActivity(context.runId, context.stepId), /stale-state/);
  assert.equal(loadAdventureState().runs[0].status, 'abandoned');
  assert.equal(loadAdventureState().runs[0].completions.length, 0);
}));
