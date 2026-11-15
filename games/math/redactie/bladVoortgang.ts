import type { RedactieAntwoorden } from './navigatie';

/**
 * Wat er per huiswerkblad al gemaakt is, zodat een kind kan stoppen en later
 * verder gaan. Alleen het oordeel per som wordt bewaard (goed of niet); een
 * half gemaakte som begint opnieuw.
 */
const SLEUTEL = 'cocokiki:redactie-bladen';

export type BladVoortgang = Record<number, RedactieAntwoorden>;

export function laadBladen(): BladVoortgang {
  try {
    const ruw = JSON.parse(window.localStorage.getItem(SLEUTEL) ?? '{}');
    return ruw && typeof ruw === 'object' ? ruw as BladVoortgang : {};
  } catch { return {}; }
}

export function bewaarBlad(nr: number, antwoorden: RedactieAntwoorden) {
  try {
    window.localStorage.setItem(SLEUTEL, JSON.stringify({ ...laadBladen(), [nr]: antwoorden }));
  } catch { /* zonder opslag werkt het blad gewoon, je raakt alleen de stand kwijt */ }
}

export function wisBlad(nr: number) {
  try {
    const alles = laadBladen();
    delete alles[nr];
    window.localStorage.setItem(SLEUTEL, JSON.stringify(alles));
  } catch { /* zie hierboven */ }
}
