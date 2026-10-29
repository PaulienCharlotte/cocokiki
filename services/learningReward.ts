/** Punten en sterren blijven spelgebonden; munten volgen overal deze regel. */
export const LEARNING_COINS = 2;

export function learningReward(solved = 1, answerRevealed = false): number {
  return !answerRevealed && Number.isSafeInteger(solved) && solved > 0 ? solved * LEARNING_COINS : 0;
}
