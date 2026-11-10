export type AdventureValue = string | number | boolean;
export type AdventureParameters = Record<string, AdventureValue>;
export interface AdventureReward {
  id: string;
  frequency: 'once' | 'per-run';
  grant: { type: 'coins'; amount: number } | { type: 'inventory'; productId: string; quantity: number };
}
export type AdventureStep =
  | { id: string; type: 'story'; text: string }
  | { id: string; type: 'activity'; activityId: string; adapterId: string }
  | { id: string; type: 'finish'; text: string };
export interface AdventureDefinition {
  id: string;
  version: number;
  locationId: string;
  characterId: string;
  title: string;
  introduction: string;
  description: string;
  steps: AdventureStep[];
  unlock: { completedAdventureIds: string[] };
  rewards: AdventureReward[];
  parameters: Record<string, { values: AdventureValue[]; avoidPrevious?: boolean }>;
}
export interface AdventureAttempt {
  runId: string;
  stepId: string;
  activityId: string;
  adapterId: string;
  attemptId: string;
  issuedAt: string;
  parameters: AdventureParameters;
}
export interface AdventureCompletion {
  runId: string;
  stepId: string;
  activityId: string;
  attemptId: string;
  sourceAttemptId: string;
  startedAt: string;
  completedAt: string;
}
/** Verify a newly started, persisted domain attempt bound to this exact context. Never trust UI/URL completion flags. */
export interface AdventureActivityAdapter {
  activityId: string;
  readCompletion(attempt: Readonly<AdventureAttempt>): AdventureCompletion | null;
  validateCompletion(attempt: Readonly<AdventureAttempt>, completion: Readonly<AdventureCompletion>): boolean;
}
export interface AdventureRun {
  id: string;
  adventureId: string;
  definitionVersion: number;
  parameters: AdventureParameters;
  currentStepId: string;
  completedStepIds: string[];
  completions: AdventureCompletion[];
  pendingAttempt: AdventureAttempt | null;
  status: 'active' | 'completed' | 'abandoned' | 'incompatible';
  rewardStatus: 'not-earned' | 'pending' | 'claimed';
  startedAt: string;
  updatedAt: string;
}
export interface AdventureState { version: 1; revision: number; runs: AdventureRun[] }
