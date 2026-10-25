export type CookingStation = 'kitchen' | 'worktop' | 'cooktop';
interface StepBase { id: string; title: string; instruction: string; station: CookingStation; asset: string; hint: string; target: number }
export type CookingStepConfig = StepBase & (
  | { mechanic: 'collect'; tools: Array<{ id: string; label: string; asset: string }> }
  | { mechanic: 'drag'; dropTarget: { label: string; sourceLabel: string; asset?: string } }
  | { mechanic: 'repeat'; tapLabel?: string; tapTool?: { asset: string; label: string }; vesselByCount?: string[]; toolByCount?: string[] }
  | { mechanic: 'weigh'; unit: 'gram' | 'milliliter'; increments: number[]; maximum: number }
  | { mechanic: 'heat'; addition: { asset: string; label: string }; levels: Array<{ value: number; label: string }>; buttonLabel: string }
  | { mechanic: 'timed'; durationMs: number; pouredAsset: string; cookedAsset: string; startLabel: string; finishLabel: string }
  | { mechanic: 'optional'; choices: Array<{ id: string; label: string }> }
);
export interface PreparationConfig { version: number; steps: CookingStepConfig[]; finishedAsset: string; finishedAlt: string; consumption: 'on-completion' }
export interface CookingStepState {
  count: number;
  selectedTools: string[];
  quantity: number;
  heat: number;
  phase: 'pour' | 'wait' | 'flip';
  readyAt: number | null;
  choice: string | null;
}
export interface CookingSession {
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
