/** Punten en sterren blijven spelgebonden; munten volgen overal deze regel. */
export const LEARNING_COINS = 2;

/**
 * Munten voor wat je oplost.
 *
 * `bonus` is wat je per opgave extra verdient omdat het moeilijker was: een
 * hoger niveau, of een band die harder loopt. Makkelijke sommen blijven dus
 * gewoon lonen, maar minder dan de moeilijke.
 */
export function learningReward(solved = 1, answerRevealed = false, bonus = 0): number {
  const extra = Number.isSafeInteger(bonus) && bonus > 0 ? Math.min(bonus, 6) : 0;
  return !answerRevealed && Number.isSafeInteger(solved) && solved > 0 ? solved * (LEARNING_COINS + extra) : 0;
}
