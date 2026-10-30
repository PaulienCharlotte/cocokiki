import type { MathLevel } from './types';

export const CHECKOUT_FALL_MS = 750;
export const checkoutOrderSeconds = (level: MathLevel): number => [16, 14, 12, 11, 10][level - 1];
export function checkoutTravel(now: number, deadline: number, duration: number): number {
  return Math.max(0, Math.min(1, 1 - (deadline - now) / duration));
}
