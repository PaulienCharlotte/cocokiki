// One atomic write keeps the existing wallet and related documents together.
export const LOCAL_STATE_KEY = 'cocokiki:currency:v1';
export const LOCAL_STATE_EVENT = 'cocokiki:local-state-change';
interface LocalState {
  version: 2;
  balance: number;
  appliedTransactions: Record<string, number>;
  documents: Record<string, string>;
}
export function readLocalState(): LocalState {
  const state: LocalState = { version: 2, balance: 0, appliedTransactions: {}, documents: {} };
  const raw = localStorage.getItem(LOCAL_STATE_KEY);
  const parsed = raw ? JSON.parse(raw) : null;
  if (parsed && parsed.version === 2 && Number.isFinite(parsed.balance) && parsed.balance >= 0 && parsed.documents && parsed.appliedTransactions) return parsed;
  if (typeof parsed === 'number' && Number.isFinite(parsed) && parsed >= 0) state.balance = Math.floor(parsed);
  else for (const key of ['topo-coco-local-reismunten', 'cocokiki:baby-lua:v1:coins']) {
    try { const amount = JSON.parse(localStorage.getItem(key) ?? '0'); if (typeof amount === 'number' && Number.isFinite(amount) && amount >= 0) state.balance += Math.floor(amount); } catch { /* Keep other legacy balances. */ }
  }
  try {
    const ledger = JSON.parse(localStorage.getItem('cocokiki:currency-ledger:v1') ?? 'null');
    if (ledger?.appliedTransactions) state.appliedTransactions = Object.fromEntries(Object.entries(ledger.appliedTransactions).filter(([, amount]) => typeof amount === 'number' && Number.isFinite(amount))) as Record<string, number>;
  } catch { /* Preserve the existing balance. */ }
  return state;
}
export function readDocument(key: string): string | null {
  return readLocalState().documents[key] ?? localStorage.getItem(key);
}
export interface LocalOperation { id: string; amount: number }
export function subscribeLocalState(listener: () => void, documentKey?: string): () => void {
  const local = (event: Event) => { if (!documentKey || (event as CustomEvent<string[]>).detail?.includes(documentKey)) listener(); };
  const external = (event: StorageEvent) => { if (event.key === LOCAL_STATE_KEY) listener(); };
  window.addEventListener(LOCAL_STATE_EVENT, local);
  window.addEventListener('storage', external);
  return () => { window.removeEventListener(LOCAL_STATE_EVENT, local); window.removeEventListener('storage', external); };
}
export function commitLocalState(documents: Record<string, string>, operations: LocalOperation[] = []) {
  try {
    const state = readLocalState();
    let applied = false;
    for (const operation of operations) {
      if (!operation.id || !Number.isSafeInteger(operation.amount)) return { status: 'invalid' as const, balance: state.balance };
      if (Object.prototype.hasOwnProperty.call(state.appliedTransactions, operation.id)) {
        if (state.appliedTransactions[operation.id] !== operation.amount) return { status: 'invalid' as const, balance: state.balance };
        continue;
      }
      if (state.balance + operation.amount < 0) return { status: 'insufficient' as const, balance: state.balance };
      state.balance += operation.amount;
      state.appliedTransactions[operation.id] = operation.amount;
      applied = true;
    }
    state.documents = { ...state.documents, ...documents };
    localStorage.setItem(LOCAL_STATE_KEY, JSON.stringify(state));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cocokiki:currency-change', { detail: state.balance }));
      window.dispatchEvent(new CustomEvent(LOCAL_STATE_EVENT, { detail: Object.keys(documents) }));
    }
    return { status: applied || operations.length === 0 ? 'applied' as const : 'duplicate' as const, balance: state.balance };
  } catch {
    let balance = 0;
    try { balance = readLocalState().balance; } catch { /* Storage itself may be unavailable. */ }
    return { status: 'invalid' as const, balance };
  }
}
