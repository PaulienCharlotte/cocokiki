import type { MathLevel } from './types';

export const CHECKOUT_FALL_MS = 750;

/** Hoeveel tijd de eerste klant krijgt. Daarna gaat de band steeds sneller. */
const START_SECONDS = [16, 14, 12, 11, 10];
/** Elke klant maakt de band een stukje sneller... */
const SPEEDUP = .93;
/** ...tot hier; sneller dan dit is niet meer te doen. */
export const CHECKOUT_MIN_SECONDS = 4;
/** Vanaf zoveel klanten loopt de band echt hard, en dat telt mee als moeite. */
export const CHECKOUT_FAST_AFTER = 8;

export function checkoutOrderSeconds(level: MathLevel, served = 0): number {
  const klanten = Number.isSafeInteger(served) && served > 0 ? served : 0;
  return Math.max(CHECKOUT_MIN_SECONDS, Math.round(START_SECONDS[level - 1] * SPEEDUP ** klanten));
}
export function checkoutTravel(now: number, deadline: number, duration: number): number {
  return Math.max(0, Math.min(1, 1 - (deadline - now) / duration));
}
