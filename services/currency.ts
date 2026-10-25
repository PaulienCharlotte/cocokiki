import { commitLocalState, LOCAL_STATE_KEY, readLocalState } from './localState';

export const CURRENCY_KEY = LOCAL_STATE_KEY;
export const CURRENCY_NAME = 'CocoCoins';
// Retained as a read-only migration source; the ledger now lives beside the balance.
export const CURRENCY_LEDGER_KEY = 'cocokiki:currency-ledger:v1';
export const CURRENCY_CHANGE_EVENT = 'cocokiki:currency-change';

export function loadCurrency(): number {
  try { return readLocalState().balance; } catch { return 0; }
}

/** Balance replacement for imports/admin only. Games use transaction deltas. */
export function saveCurrency(value: number): boolean {
  if (!Number.isFinite(value) || value < 0) return false;
  return commitLocalState({}, [{ id: `balance:${crypto.randomUUID()}`, amount: Math.floor(value) - loadCurrency() }]).status === 'applied';
}
export interface CurrencyAwardResult { applied: boolean; balance: number }
export interface CurrencySpendResult { status: 'applied' | 'duplicate' | 'insufficient' | 'invalid'; balance: number }

export function spendCurrencyOnce(transactionId: string, amount: number, documents: Record<string, string> = {}): CurrencySpendResult {
  if (!transactionId || !Number.isSafeInteger(amount) || amount <= 0) return { status: 'invalid', balance: loadCurrency() };
  try {
    const current = readLocalState();
    const previous = current.appliedTransactions[transactionId];
    if (previous !== undefined) return { status: previous === -amount ? 'duplicate' : 'invalid', balance: current.balance };
  } catch { return { status: 'invalid', balance: loadCurrency() }; }
  return commitLocalState(documents, [{ id: transactionId, amount: -amount }]);
}
export function awardCurrencyOnce(transactionId: string, amount: number): CurrencyAwardResult {
  if (!transactionId || !Number.isSafeInteger(amount) || amount <= 0) return { applied: false, balance: loadCurrency() };
  const result = commitLocalState({}, [{ id: transactionId, amount }]);
  return { applied: result.status === 'applied', balance: result.balance };
}
