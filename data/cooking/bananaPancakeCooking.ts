import { ASSET_LIBRARY } from '../assetLibrary';

export type CookingStation = 'kitchen' | 'worktop' | 'cooktop';
export type CookingMechanic = 'collect' | 'drag' | 'repeat' | 'weigh' | 'heat' | 'timed' | 'optional';

export interface CookingStepConfig {
  id: string;
  title: string;
  instruction: string;
  station: CookingStation;
  mechanic: CookingMechanic;
  target: number;
  asset: string;
  hint: string;
}

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

export const BANANA_PANCAKE_STEPS: CookingStepConfig[] = [
  { id: 'tools', title: 'Leg alles klaar', instruction: 'Kies kom, vork, pan en spatel.', station: 'kitchen', mechanic: 'collect', target: 4, asset: a.bowl, hint: 'Tik op vier spullen.' },
  { id: 'banana', title: 'Pak de banaan', instruction: 'Sleep de banaan naar de kom.', station: 'worktop', mechanic: 'drag', target: 1, asset: a.banana, hint: 'Sleep de banaan op de kom.' },
  { id: 'mash', title: 'Prak de banaan', instruction: 'Prak tot de stukjes klein zijn.', station: 'worktop', mechanic: 'repeat', target: 5, asset: a.mashedBanana, hint: 'Tik een paar keer op de vork.' },
  { id: 'eggs', title: 'Breek de eieren', instruction: 'Tik elk ei tegen de rand.', station: 'worktop', mechanic: 'repeat', target: 2, asset: a.eggs, hint: 'Nog een ei.' },
  { id: 'mix-eggs', title: 'Meng banaan en ei', instruction: 'Roer tot alles gemengd is.', station: 'worktop', mechanic: 'repeat', target: 5, asset: a.mashedBanana, hint: 'Maak rustige rondjes.' },
  { id: 'oats', title: 'Weeg havermout', instruction: 'Maak precies 40 gram.', station: 'worktop', mechanic: 'weigh', target: 40, asset: '/games/shop/products/oats.png?v=2', hint: 'Met +10 kom je snel bij 40.' },
  { id: 'batter', title: 'Maak het beslag', instruction: 'Klop het beslag glad.', station: 'worktop', mechanic: 'repeat', target: 5, asset: a.batter, hint: 'Blijf nog even kloppen.' },
  { id: 'heat', title: 'Verwarm de pan', instruction: 'Voeg boter toe en kies middelhoog.', station: 'cooktop', mechanic: 'heat', target: 2, asset: a.pan, hint: 'Stand 2 is goed.' },
  { id: 'cook', title: 'Bak de pannenkoek', instruction: 'Giet, wacht en draai om.', station: 'cooktop', mechanic: 'timed', target: 3, asset: a.pancakeRaw, hint: 'Wacht tot de rand stevig wordt.' },
  { id: 'serve', title: 'Leg op het bord', instruction: 'Sleep de pannenkoek naar het bord.', station: 'worktop', mechanic: 'drag', target: 1, asset: a.pancakeGolden, hint: 'Het bord staat klaar.' },
  { id: 'cover', title: 'Extra luchtig?', instruction: 'Dek kort af of serveer meteen.', station: 'worktop', mechanic: 'optional', target: 1, asset: a.finished, hint: 'Beide keuzes zijn goed.' },
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
