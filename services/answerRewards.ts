import { commitLocalState, readDocument, readLocalState } from './localState';
import { DAG_LIMIET_PER_SPEL } from './economie';

/**
 * Per spel per dag bijhouden hoeveel munten je kreeg. Boven DAG_LIMIET_PER_SPEL
 * (ongeveer een half uur hetzelfde spel) krijg je de helft: afwisselen loont,
 * en eindeloos één spel herhalen niet. Morgen begint de teller opnieuw.
 */
export const MUNTEN_VANDAAG_KEY = 'cocokiki:munten-vandaag:v1';
/** `ingehouden`: per ronde wat de daglimiet niet uitbetaalde; de eindafrekening telt dat als al betaald. */
type Vandaag = { dag: string; perSpel: Record<string, number>; ingehouden?: Record<string, number> };
const vandaagSleutel = (nu = new Date()) => `${nu.getFullYear()}-${nu.getMonth() + 1}-${nu.getDate()}`;
function leesVandaag(nu = new Date()): Vandaag {
  try {
    const raw = JSON.parse(readDocument(MUNTEN_VANDAAG_KEY) ?? 'null');
    if (raw?.dag === vandaagSleutel(nu) && raw.perSpel && typeof raw.perSpel === 'object') return raw;
  } catch { /* een kapotte teller begint gewoon opnieuw */ }
  return { dag: vandaagSleutel(nu), perSpel: {} };
}
/** Wat dit antwoord oplevert, met de daglimiet per spel erbij. */
export function bedragMetDaglimiet(spel: string, bedrag: number, nu = new Date()): number {
  const al = leesVandaag(nu).perSpel[spel] ?? 0;
  return al >= DAG_LIMIET_PER_SPEL ? Math.max(1, Math.ceil(bedrag / 2)) : bedrag;
}

/** Immediate answer receipts are deducted from the final round settlement. */
export function rewardAnswer(scope: string, round: string, answer: string | number, amount: number, nu = new Date()) {
  const id = `answer:${scope}:${round}:${answer}`;
  const staat = readLocalState();
  // Al betaald: niets doen, ook de dagteller niet ophogen.
  if (!Number.isSafeInteger(amount) || amount <= 0 || Object.hasOwn(staat.appliedTransactions, id)) return { applied: false, balance: staat.balance };
  const vandaag = leesVandaag(nu);
  const bedrag = bedragMetDaglimiet(scope, amount, nu);
  const ronde = `${scope}:${round}`;
  const ingehouden = { ...(vandaag.ingehouden ?? {}), ...(amount > bedrag ? { [ronde]: (vandaag.ingehouden?.[ronde] ?? 0) + amount - bedrag } : {}) };
  const teller = { ...vandaag, perSpel: { ...vandaag.perSpel, [scope]: (vandaag.perSpel[scope] ?? 0) + bedrag }, ingehouden };
  const result = commitLocalState({ [MUNTEN_VANDAAG_KEY]: JSON.stringify(teller) }, [{ id, amount: bedrag }]);
  return { applied: result.status === 'applied', balance: result.balance };
}
export function answerCoins(scope: string, round: string, nu = new Date()): number {
  const prefix = `answer:${scope}:${round}:`;
  try {
    const betaald = Object.entries(readLocalState().appliedTransactions).filter(([id]) => id.startsWith(prefix)).reduce((sum, [, amount]) => sum + amount, 0);
    // Wat de daglimiet inhield telt als afgerekend, anders vult de eindafrekening het weer aan.
    return betaald + (leesVandaag(nu).ingehouden?.[`${scope}:${round}`] ?? 0);
  } catch { return 0; }
}
