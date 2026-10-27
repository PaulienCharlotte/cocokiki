import { ASSET_LIBRARY } from '../assetLibrary';

import type { CookingStepConfig, PreparationConfig } from './preparation';
export type { CookingStepConfig, CookingStation } from './preparation';

export interface BananaPancakeSession {
  version: 1;
  recipeId: 'banana-pancakes';
  stepIndex: number;
  actionCount: number;
  selectedTools: string[];
  oatGrams: number;
  heat: 0 | 1 | 2 | 3;
  covered: boolean | null;
  completed: boolean;
  ingredientsConsumed: boolean;
  updatedAt: string;
}

const a = ASSET_LIBRARY.cooking.bananaPancakes;
const k = ASSET_LIBRARY.cooking.kit;

export const BANANA_PANCAKE_STEPS: CookingStepConfig[] = [
  { id: 'tools', title: 'Leg alles klaar', instruction: 'Kies kom, vork, pan en spatel.', station: 'kitchen', mechanic: 'collect', target: 4, asset: k.bowlEmpty, hint: 'Tik op vier spullen.', tools: [{ id: 'bowl', label: 'Kom', asset: k.bowlEmpty }, { id: 'fork', label: 'Vork', asset: k.fork }, { id: 'pan', label: 'Pan', asset: k.panEmpty }, { id: 'spatula', label: 'Spatel', asset: k.spatula }] },
  { id: 'banana', title: 'Pak de banaan', instruction: 'Sleep de banaan naar de kom.', station: 'worktop', mechanic: 'drag', target: 1, asset: k.banana, hint: 'Sleep de banaan op de kom. Tikken mag ook.', dropTarget: { label: 'Kom', sourceLabel: 'Banaan', asset: k.bowlEmpty } },
  { id: 'mash', title: 'Prak de banaan', instruction: 'Prak tot de stukjes klein zijn.', station: 'worktop', mechanic: 'repeat', target: 5, asset: k.bowlMashedBanana, hint: 'Tik een paar keer met de vork.', tapLabel: 'Tik op de vork', tapTool: { asset: k.fork, label: 'Vork' } },
  { id: 'eggs', title: 'Breek de eieren', instruction: 'Tik elk ei tegen de rand van de kom.', station: 'worktop', mechanic: 'repeat', target: 2, asset: k.bowlEmpty, hint: 'Twee eieren, dus twee keer tikken.', tapLabel: 'Tik op het ei', tapTool: { asset: k.egg, label: 'Ei' }, vesselByCount: [k.bowlEmpty, k.bowlEggs], toolByCount: [k.egg, k.eggCracked, k.eggOpen] },
  { id: 'mix-eggs', title: 'Meng banaan en ei', instruction: 'Roer tot alles gemengd is.', station: 'worktop', mechanic: 'repeat', target: 5, asset: k.bowlMashedBanana, hint: 'Maak rustige rondjes.', tapLabel: 'Tik op de garde', tapTool: { asset: k.whisk, label: 'Garde' } },
  { id: 'oats', title: 'Weeg havermout', instruction: 'Maak precies 40 gram.', station: 'worktop', mechanic: 'weigh', target: 40, unit: 'gram', increments: [5, 10], maximum: 80, asset: '/games/shop/products/oats.webp?v=2', hint: 'Met +10 kom je snel bij 40.' },
  { id: 'batter', title: 'Maak het beslag', instruction: 'Klop het beslag glad.', station: 'worktop', mechanic: 'repeat', target: 5, asset: k.bowlBatter, hint: 'Blijf nog even kloppen.', tapLabel: 'Tik op de garde', tapTool: { asset: k.whisk, label: 'Garde' } },
  { id: 'heat', title: 'Verwarm de pan', instruction: 'Doe er boter in en kies de juiste stand.', station: 'cooktop', mechanic: 'heat', target: 2, addition: { asset: a.butter, label: 'Boter erin' }, levels: [{ value: 1, label: 'Laag' }, { value: 2, label: 'Middel' }, { value: 3, label: 'Hoog' }], buttonLabel: 'Verwarm de pan', asset: k.panEmpty, hint: 'Middel is precies goed: niet te heet.' },
  { id: 'cook', title: 'Bak de pannenkoek', instruction: 'Giet, wacht en draai om.', station: 'cooktop', mechanic: 'timed', target: 3, durationMs: 2500, pouredAsset: k.pancakeRaw, cookedAsset: k.panPancake, startLabel: 'Giet het beslag', finishLabel: 'Draai om', asset: k.panEmpty, hint: 'Wacht tot de rand stevig wordt.' },
  { id: 'serve', title: 'Leg op het bord', instruction: 'Sleep de pannenkoek naar het bord.', station: 'worktop', mechanic: 'drag', target: 1, asset: k.panPancake, hint: 'Het bord staat klaar. Tikken mag ook.', dropTarget: { label: 'Bord', sourceLabel: 'Pannenkoek' } },
];

export const COOKING_SESSION_KEY = 'cocokiki:cooking-session:banana-pancakes:v1';

export function createBananaPancakeSession(now = new Date().toISOString()): BananaPancakeSession {
  return { version: 1, recipeId: 'banana-pancakes', stepIndex: 0, actionCount: 0, selectedTools: [], oatGrams: 0, heat: 0, covered: null, completed: false, ingredientsConsumed: false, updatedAt: now };
}

export function migrateBananaPancakeSession(value: unknown): BananaPancakeSession {
  const empty = createBananaPancakeSession();
  if (!value || typeof value !== 'object') return empty;
  const source = value as Partial<BananaPancakeSession>;
  return {
    ...empty,
    stepIndex: Math.max(0, Math.min(BANANA_PANCAKE_STEPS.length - 1, Math.floor(source.stepIndex ?? 0))),
    actionCount: Math.max(0, Math.floor(source.actionCount ?? 0)),
    selectedTools: Array.isArray(source.selectedTools) ? [...new Set(source.selectedTools.filter((id): id is string => typeof id === 'string'))] : [],
    oatGrams: Math.max(0, Math.min(80, Math.floor(source.oatGrams ?? 0))),
    heat: source.heat === 1 || source.heat === 2 || source.heat === 3 ? source.heat : 0,
    covered: typeof source.covered === 'boolean' ? source.covered : null,
    completed: source.completed === true,
    ingredientsConsumed: source.ingredientsConsumed === true,
    updatedAt: typeof source.updatedAt === 'string' ? source.updatedAt : empty.updatedAt,
  };
}

export function loadBananaPancakeSession(): BananaPancakeSession {
  try { return migrateBananaPancakeSession(JSON.parse(localStorage.getItem(COOKING_SESSION_KEY) ?? 'null')); }
  catch { return createBananaPancakeSession(); }
}

export function saveBananaPancakeSession(session: BananaPancakeSession): void {
  localStorage.setItem(COOKING_SESSION_KEY, JSON.stringify(session));
}

export function advanceCookingSession(session: BananaPancakeSession, now = new Date().toISOString()): BananaPancakeSession {
  if (session.completed) return session;
  if (session.stepIndex >= BANANA_PANCAKE_STEPS.length - 1) return { ...session, completed: true, updatedAt: now };
  return { ...session, stepIndex: session.stepIndex + 1, actionCount: 0, updatedAt: now };
}

export const BANANA_PREPARATION: PreparationConfig = { version: 1, steps: BANANA_PANCAKE_STEPS, finishedAsset: a.finished, finishedAlt: 'Bananenpannenkoekjes op een bord', consumption: 'on-completion' };
