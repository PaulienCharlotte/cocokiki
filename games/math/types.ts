export const MATH_GAME_IDS = ['multiply', 'divide', 'add-subtract', 'missing', 'balance', 'race'] as const;
export type MathGameId = typeof MATH_GAME_IDS[number];
export type MathLevel = 1 | 2 | 3 | 4 | 5;
export const MATH_LEVELS: MathLevel[] = [1, 2, 3, 4, 5];
export type Operation = '+' | '-' | '*' | '/';
export type Expression = { value: number } | { blank: true } | { op: Operation; left: Expression; right: Expression };
export interface MathQuestion {
  id: string;
  kind: 'choice' | 'distribution' | 'puzzle' | 'balance';
  left: Expression;
  right: Expression;
  answer: number;
  options: number[];
  prompt: string;
  hint: string;
  operation: Operation;
  a: number;
  b: number;
  total: number;
  groups?: number;
  fruit?: 'strawberry' | 'blueberry';
  checkout?: import('./checkoutCatalog').CheckoutDetails;
}
export interface MathResult { correct: number; total: number; score: number; mistakes: number; raceId?: string }
export interface MathGameProgress { completed: MathLevel[]; best: Partial<Record<MathLevel, MathResult>> }
export interface MathProgress { version: 1; games: Record<MathGameId, MathGameProgress> }
