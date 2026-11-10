import { AdventureEngine, loadAdventureState } from './adventures';
import { commitLocalState, readDocument } from './localState';
import { createIsolatedCookingStorage, withIsolatedCookingLock } from './isolatedCookingStorage';
import { RECIPES_BY_ID } from '../data/cooking/catalog';
import { loadCookingProgress } from './cookingProgress';
import { ingredientRequirements } from './recipeInventory';
import { scenarioAnswer, type PlayableAdventure } from '../data/adventures/catalog';
import type { AdventureAttempt, AdventureCompletion, AdventureActivityAdapter, AdventureRun } from '../data/adventures/types';

export const ADVENTURE_ACTIVITY_KEY = 'cocokiki:adventure-activity-proofs:v1';
interface Proof { completion: AdventureCompletion; answer?: number }
function proofs(): Proof[] {
  const raw = readDocument(ADVENTURE_ACTIVITY_KEY);
  if (raw === null) return [];
  const parsed = JSON.parse(raw);
  if (parsed?.version !== 1 || !Array.isArray(parsed.proofs) || !parsed.proofs.every((proof: Proof) => proof?.completion && typeof proof.completion.attemptId === 'string')) throw Error('invalid-activity-proofs');
  return parsed.proofs;
}

/** Coordinates existing engine/adapters. All story and recipe selection lives in configuration. */
export class AdventureRuntime {
  readonly engine: AdventureEngine;
  constructor(readonly catalog: PlayableAdventure[], private options: {
    now?: () => string; random?: () => number; makeId?: () => string;
    withLock?: <T>(work: () => T) => Promise<T>;
  } = {}) {
    for (const config of catalog) {
      if (!config.scenarios.length || new Set(config.scenarios.map(item => item.id)).size !== config.scenarios.length
        || config.scenarios.some(item => !['divide', 'subtract'].includes(item.operation) || item.operands.length < 2 || !item.operands.every(Number.isSafeInteger) || !Number.isSafeInteger(scenarioAnswer(item)))
        || config.definition.parameters[config.scenarioParameter]?.values.some(value => !config.scenarios.some(item => item.id === value))) throw Error('invalid-scenarios');
    }
    const adapters: Record<string, AdventureActivityAdapter> = {};
    for (const config of catalog) for (const step of config.definition.steps) if (step.type === 'activity') {
      adapters[step.adapterId] = { activityId: step.activityId,
        readCompletion: attempt => this.readCompletion(attempt),
        validateCompletion: (attempt, completion) => JSON.stringify(this.readCompletion(attempt)) === JSON.stringify(completion),
      };
    }
    this.engine = new AdventureEngine(catalog.map(item => item.definition), adapters, options);
  }
  private now() { return (this.options.now ?? (() => new Date().toISOString()))(); }
  private locked<T>(work: () => T) { return (this.options.withLock ?? withIsolatedCookingLock)(work); }
  config(adventureId: string) {
    const config = this.catalog.find(item => item.definition.id === adventureId);
    if (!config) throw Error('unknown-adventure'); return config;
  }
  run(runId: string): AdventureRun {
    const run = loadAdventureState().runs.find(item => item.id === runId);
    if (!run) throw Error('unknown-run'); return run;
  }
  latest(adventureId: string) {
    const config = this.config(adventureId);
    return [...loadAdventureState().runs].reverse().find(item => item.adventureId === adventureId && item.definitionVersion === config.definition.version
      && config.definition.steps.some(step => step.id === item.currentStepId)
      && config.scenarios.some(scenario => scenario.id === item.parameters[config.scenarioParameter])
      && ['active', 'completed'].includes(item.status)) ?? null;
  }
  binding(run: AdventureRun) {
    const binding = this.config(run.adventureId).activities[run.currentStepId];
    if (!binding) throw Error('wrong-activity'); return binding;
  }
  scenario(run: AdventureRun) {
    const config = this.config(run.adventureId), scenario = config.scenarios.find(item => item.id === run.parameters[config.scenarioParameter]);
    if (!scenario) throw Error('unknown-scenario'); return scenario;
  }
  stock(run: AdventureRun) {
    const binding = this.binding(run);
    if (binding.type === 'arithmetic') throw Error('wrong-activity');
    return ingredientRequirements(RECIPES_BY_ID[binding.recipeId], loadCookingProgress());
  }
  cooking(attempt: AdventureAttempt) {
    const run = this.run(attempt.runId), binding = this.config(run.adventureId).activities[attempt.stepId];
    if (!binding || binding.type !== 'cooking') throw Error('wrong-activity');
    return createIsolatedCookingStorage(RECIPES_BY_ID[binding.recipeId], { runId: run.id, stepId: attempt.stepId, cookingAttemptId: attempt.attemptId, recipeId: binding.recipeId }, { now: this.options.now, withLock: this.options.withLock });
  }
  private readCompletion(attempt: AdventureAttempt): AdventureCompletion | null {
    const run = this.run(attempt.runId), binding = this.config(run.adventureId).activities[attempt.stepId];
    if (!binding) return null;
    if (binding.type === 'cooking') {
      const receipt = this.cooking(attempt).receipt();
      return receipt ? { runId: receipt.runId, stepId: receipt.stepId, activityId: attempt.activityId, attemptId: attempt.attemptId,
        sourceAttemptId: receipt.cookingAttemptId, startedAt: receipt.startedAt, completedAt: receipt.completedAt } : null;
    }
    const proof = proofs().find(item => item.completion.attemptId === attempt.attemptId);
    if (!proof || proof.completion.runId !== run.id || proof.completion.stepId !== attempt.stepId || proof.completion.activityId !== attempt.activityId) return null;
    if (binding.type === 'arithmetic' && proof.answer !== scenarioAnswer(this.scenario(run))) return null;
    if (binding.type === 'ingredients' && ingredientRequirements(RECIPES_BY_ID[binding.recipeId], loadCookingProgress()).some(item => !item.sufficient || !item.compatible)) return null;
    return proof.completion;
  }
  private record(attempt: AdventureAttempt, answer?: number) {
    const current = proofs();
    const proof: Proof = { completion: { runId: attempt.runId, stepId: attempt.stepId, activityId: attempt.activityId,
      attemptId: attempt.attemptId, sourceAttemptId: attempt.attemptId, startedAt: attempt.issuedAt, completedAt: this.now() }, ...(answer !== undefined ? { answer } : {}) };
    const next = [...current.filter(item => item.completion.attemptId !== attempt.attemptId), proof];
    if (commitLocalState({ [ADVENTURE_ACTIVITY_KEY]: JSON.stringify({ version: 1, proofs: next }) }).status !== 'applied') throw Error('storage-failed');
  }
  start(adventureId: string) { return this.locked(() => this.engine.start(adventureId)); }
  resume() { return this.locked(() => this.engine.resume()); }
  continueStory(runId: string) { return this.locked(() => { const run = this.run(runId); return this.engine.advanceStory(runId, run.currentStepId); }); }
  prepare(runId: string) { return this.locked(() => { const run = this.run(runId); return this.engine.prepareActivity(runId, run.currentStepId); }); }
  answer(runId: string, answer: number) {
    return this.locked(() => {
      const run = this.run(runId);
      if (this.binding(run).type !== 'arithmetic') throw Error('wrong-activity');
      const attempt = this.engine.prepareActivity(runId, run.currentStepId);
      if (!Number.isSafeInteger(answer) || answer !== scenarioAnswer(this.scenario(run))) return false;
      this.record(attempt, answer); this.engine.completeActivity(runId, run.currentStepId); return true;
    });
  }
  collect(runId: string) {
    return this.locked(() => {
      const run = this.run(runId);
      if (this.binding(run).type !== 'ingredients') throw Error('wrong-activity');
      const attempt = this.engine.prepareActivity(runId, run.currentStepId);
      if (this.stock(run).some(item => !item.compatible || !item.sufficient)) return false;
      this.record(attempt); this.engine.completeActivity(runId, run.currentStepId); return true;
    });
  }
  acceptCooking(runId: string) { return this.locked(() => { const run = this.run(runId); if (this.binding(run).type !== 'cooking') throw Error('wrong-activity'); return this.engine.completeActivity(runId, run.currentStepId); }); }
  deliver(runId: string) { return this.locked(() => { const run = this.run(runId); return this.engine.finish(runId, run.currentStepId, { claimRewards: true }); }); }
  replay(runId: string) { return this.locked(() => this.engine.replay(runId)); }
}
