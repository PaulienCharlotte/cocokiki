export const CURRENCY_KEY = 'cocokiki:currency:v1';
export const CURRENCY_NAME = 'CocoCoins';
export const CURRENCY_LEDGER_KEY = 'cocokiki:currency-ledger:v1';
export const CURRENCY_CHANGE_EVENT = 'cocokiki:currency-change';

const LEGACY_KEYS = ['topo-coco-local-reismunten', 'cocokiki:baby-lua:v1:coins'];

function validAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function loadCurrency(): number {
  try {
    const current = JSON.parse(localStorage.getItem(CURRENCY_KEY) ?? 'null');
    if (validAmount(current)) return Math.floor(current);

    const migrated = LEGACY_KEYS.reduce((total, key) => {
      const value = JSON.parse(localStorage.getItem(key) ?? '0');
      return total + (validAmount(value) ? Math.floor(value) : 0);
    }, 0);
    localStorage.setItem(CURRENCY_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return 0;
  }
}

export function saveCurrency(value: number): boolean {
  try {
    const amount = Math.max(0, Math.floor(value));
    localStorage.setItem(CURRENCY_KEY, JSON.stringify(amount));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CURRENCY_CHANGE_EVENT, { detail: amount }));
    return true;
  } catch {
    return false;
  }
}

interface CurrencyLedger {
  version: 1;
  appliedTransactions: Record<string, number>;
}

function loadLedger(): CurrencyLedger {
  try {
    const parsed = JSON.parse(localStorage.getItem(CURRENCY_LEDGER_KEY) ?? 'null');
    if (!parsed || typeof parsed !== 'object' || !parsed.appliedTransactions || typeof parsed.appliedTransactions !== 'object') {
      return { version: 1, appliedTransactions: {} };
    }
    return { version: 1, appliedTransactions: parsed.appliedTransactions };
  } catch {
    return { version: 1, appliedTransactions: {} };
  }
}

export interface CurrencyAwardResult {
  applied: boolean;
  balance: number;
}

export interface CurrencySpendResult {
  status: 'applied' | 'duplicate' | 'insufficient' | 'invalid';
  balance: number;
}

export function spendCurrencyOnce(transactionId: string, amount: number): CurrencySpendResult {
  const cost = Math.floor(amount);
  const balance = loadCurrency();
  if (!transactionId || !Number.isFinite(amount) || cost <= 0) return { status: 'invalid', balance };
  const ledger = loadLedger();
  if (Object.prototype.hasOwnProperty.call(ledger.appliedTransactions, transactionId)) {
    return { status: 'duplicate', balance };
  }
  if (balance < cost) return { status: 'insufficient', balance };

  const nextBalance = balance - cost;
  ledger.appliedTransactions[transactionId] = -cost;
  try {
    localStorage.setItem(CURRENCY_LEDGER_KEY, JSON.stringify(ledger));
    if (!saveCurrency(nextBalance)) {
      delete ledger.appliedTransactions[transactionId];
      localStorage.setItem(CURRENCY_LEDGER_KEY, JSON.stringify(ledger));
      return { status: 'invalid', balance };
    }
    return { status: 'applied', balance: nextBalance };
  } catch {
    return { status: 'invalid', balance };
  }
}

export function awardCurrencyOnce(transactionId: string, amount: number): CurrencyAwardResult {
  const reward = Math.max(0, Math.floor(amount));
  const balance = loadCurrency();
  if (!transactionId || reward === 0) return { applied: false, balance };
  const ledger = loadLedger();
  if (Object.prototype.hasOwnProperty.call(ledger.appliedTransactions, transactionId)) return { applied: false, balance };
  const nextBalance = balance + reward;
  ledger.appliedTransactions[transactionId] = reward;
  try {
    localStorage.setItem(CURRENCY_LEDGER_KEY, JSON.stringify(ledger));
    if (!saveCurrency(nextBalance)) {
      delete ledger.appliedTransactions[transactionId];
      localStorage.setItem(CURRENCY_LEDGER_KEY, JSON.stringify(ledger));
      return { applied: false, balance };
    }
    return { applied: true, balance: nextBalance };
  } catch {
    return { applied: false, balance };
  }
}
