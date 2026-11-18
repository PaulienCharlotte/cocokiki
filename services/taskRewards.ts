import { OPDRACHT_BONUS, PER_ANTWOORD } from './economie';

/** Bedragen voor To Do-kaartjes en uitbetalingen; ze komen uit services/economie.ts. */
export const TASK_REWARDS = {
  bakery: OPDRACHT_BONUS.bakken,
  cake: OPDRACHT_BONUS.taart,
  cakeSpeed: 0,
  clinic: OPDRACHT_BONUS.plantGenezen,
  nurseryStep: PER_ANTWOORD,
  nurseryFinishStep: 0,
  nurseryMax: 5 * PER_ANTWOORD + OPDRACHT_BONUS.inrichten,
  daily: OPDRACHT_BONUS.vandaag / 5,
} as const;
