export const CURRENCY_KEY = 'cocokiki:currency:v1';
export const CURRENCY_NAME = 'CocoCoins';

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
    localStorage.setItem(CURRENCY_KEY, JSON.stringify(Math.max(0, Math.floor(value))));
    return true;
  } catch {
    return false;
  }
}
