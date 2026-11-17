import { awardCurrencyOnce } from './currency';
import { readLocalState } from './localState';

/** Immediate answer receipts are deducted from the final round settlement. */
export function rewardAnswer(scope: string, round: string, answer: string | number, amount: number) {
  return awardCurrencyOnce(`answer:${scope}:${round}:${answer}`, amount);
}
export function answerCoins(scope: string, round: string): number {
  const prefix = `answer:${scope}:${round}:`;
  try { return Object.entries(readLocalState().appliedTransactions).filter(([id]) => id.startsWith(prefix)).reduce((sum, [, amount]) => sum + amount, 0); } catch { return 0; }
}
