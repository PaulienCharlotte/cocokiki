export type CookingStation = 'kitchen' | 'worktop' | 'cooktop' | 'oven';
export type BowlContents = 'dry' | 'liquid' | 'batter' | 'berries';
interface StepBase { id: string; title: string; instruction: string; station: CookingStation; asset: string; hint?: string; target: number; contents?: BowlContents }
export type CookingStepConfig = StepBase & (
  | { mechanic: 'collect'; tools: Array<{ id: string; label: string; asset: string }> }
  | { mechanic: 'drag'; dropTarget: { label: string; sourceLabel: string; asset?: string } }
  | { mechanic: 'repeat'; tapLabel?: string; tapTool?: { asset: string; label: string }; vesselByCount?: string[]; toolByCount?: string[] }
  | { mechanic: 'weigh'; unit: 'gram' | 'milliliter'; increments: number[]; maximum: number }
  | { mechanic: 'heat'; addition: { asset: string; label: string }; levels: Array<{ value: number; label: string }>; buttonLabel: string }
  | { mechanic: 'timed'; durationMs: number; pouredAsset: string; cookedAsset: string; startLabel: string; finishLabel: string }
  | { mechanic: 'optional'; choices: Array<{ id: string; label: string }> }
  | { mechanic: 'measure'; vessel: 'jug' | 'spoon'; vesselAsset: string; unitLabel: string; increments: number[]; maximum: number; baseVolume?: number; capacity?: number }
  | { mechanic: 'portion'; panAsset: string; linerAsset: string; toppingAsset: string; columns: number; positions?: Array<{ x: number; y: number }> }
  | { mechanic: 'oven'; action: 'preheat' | 'bake' | 'cool'; oven: OvenConfig; panAsset: string; resultAsset: string; portions: number }
);
export interface OvenConfig { targetTemperature: number; minimumMinutes: number; maximumMinutes: number; temperatureTolerance: number; preheatDegreesPerSecond: number; gameSecondsPerMinute: number; coolingSeconds: number; minimumTemperature: number; maximumTemperature: number; temperatureStep: number; minimumSelectableMinutes: number; maximumSelectableMinutes: number }
export type OvenResult = 'underdone' | 'good' | 'dark';
export interface OvenState {
  temperature: number; actualTemperature: number; powered: boolean; preheated: boolean;
  doorOpen: boolean; trayPlaced: boolean; chosenMinutes: number; elapsedMinutes: number;
  status: 'idle' | 'preheating' | 'ready' | 'baking' | 'finished' | 'cooling' | 'served';
  result: OvenResult | null; coolingElapsed: number; heatExposure: number;
}
export interface PreparationConfig { version: number; steps: CookingStepConfig[]; finishedAsset: string; finishedAlt: string; consumption: 'on-completion' }
export interface CookingStepState {
  count: number;
  selectedTools: string[];
  quantity: number;
  heat: number;
  phase: 'pour' | 'wait' | 'flip';
  readyAt: number | null;
  choice: string | null;
  portions?: number[];
  lined?: number[];
}
export interface CookingSession {
  seenTipIds?: string[];
  dismissedTipIds?: string[];
  oven?: OvenState;
  version: 2;
  recipeId: string;
  recipeVersion: number;
  attemptId: string;
  stepId: string;
  completedStepIds: string[];
  steps: Record<string, CookingStepState>;
  completed: boolean;
  updatedAt: string;
}
export function emptyStepState(): CookingStepState {
  return { count: 0, selectedTools: [], quantity: 0, heat: 0, phase: 'pour', readyAt: null, choice: null };
}
