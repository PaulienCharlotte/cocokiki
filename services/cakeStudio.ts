import { commitLocalState, readDocument } from './localState';
import { TAART_BODEMS, VERSIERINGEN } from '../data/cake/catalog';
import type { GeplaatsteVersiering, TaartOntwerp } from '../data/cake/types';

/**
 * Het bewaren van een taartontwerp.
 *
 * Eén taart tegelijk, in hetzelfde opslagdocument als de rest van de app.
 * Geen nieuwe sleutel ernaast, geen tweede voortgang: alleen dit ontwerp.
 */
export const TAART_ONTWERP_KEY = 'cocokiki:taart:v1';

const BODEMS = new Set(TAART_BODEMS.map(bodem => bodem.id));
const VERSIERING_IDS = new Set(VERSIERINGEN.map(item => item.id));

export const MIN_SCHAAL = 0.25;
export const MAX_SCHAAL = 2;

export function leegOntwerp(bodemId = TAART_BODEMS[0].id): TaartOntwerp {
  return { versie: 1, bodemId, tekening: null, versieringen: [], voorbeeld: null, bewerktOp: new Date(0).toISOString() };
}

const getal = (waarde: unknown, van: number, tot: number, terugval: number) =>
  typeof waarde === 'number' && Number.isFinite(waarde) ? Math.min(tot, Math.max(van, waarde)) : terugval;

/** Een afbeelding uit de opslag vertrouwen we alleen als het een data-URL is. */
const afbeelding = (waarde: unknown) =>
  typeof waarde === 'string' && waarde.startsWith('data:image/') && waarde.length < 4_000_000 ? waarde : null;

export function migreerOntwerp(bron: unknown): TaartOntwerp {
  const leeg = leegOntwerp();
  if (!bron || typeof bron !== 'object') return leeg;
  const ruw = bron as Partial<TaartOntwerp>;
  const versieringen = Array.isArray(ruw.versieringen) ? ruw.versieringen : [];
  const gezien = new Set<string>();
  return {
    versie: 1,
    bodemId: typeof ruw.bodemId === 'string' && BODEMS.has(ruw.bodemId) ? ruw.bodemId : leeg.bodemId,
    tekening: afbeelding(ruw.tekening),
    voorbeeld: afbeelding(ruw.voorbeeld),
    versieringen: versieringen.flatMap(item => {
      if (!item || typeof item !== 'object') return [];
      const stuk = item as Partial<GeplaatsteVersiering>;
      if (typeof stuk.id !== 'string' || gezien.has(stuk.id)) return [];
      if (typeof stuk.versieringId !== 'string' || !VERSIERING_IDS.has(stuk.versieringId)) return [];
      gezien.add(stuk.id);
      return [{
        id: stuk.id,
        versieringId: stuk.versieringId,
        x: getal(stuk.x, 0, 1, .5),
        y: getal(stuk.y, 0, 1, .5),
        schaal: getal(stuk.schaal, MIN_SCHAAL, MAX_SCHAAL, 1),
        draai: getal(stuk.draai, -360, 360, 0),
      }];
    }),
    bewerktOp: typeof ruw.bewerktOp === 'string' ? ruw.bewerktOp : leeg.bewerktOp,
  };
}

export function laadOntwerp(key = TAART_ONTWERP_KEY): TaartOntwerp {
  try {
    const opgeslagen = readDocument(key);
    return migreerOntwerp(opgeslagen ? JSON.parse(opgeslagen) : null);
  } catch {
    return leegOntwerp();
  }
}

export function bewaarOntwerp(ontwerp: TaartOntwerp, nu = new Date().toISOString(), key = TAART_ONTWERP_KEY): boolean {
  const schoon: TaartOntwerp = { ...migreerOntwerp(ontwerp), bewerktOp: nu };
  const uitkomst = commitLocalState({ [key]: JSON.stringify(schoon) });
  return uitkomst.status === 'applied' || uitkomst.status === 'duplicate';
}

/** Of er al iets gemaakt is; bepaalt of de kaart "verder" of "beginnen" zegt. */
export function heeftOntwerp(ontwerp: TaartOntwerp): boolean {
  return Boolean(ontwerp.tekening) || ontwerp.versieringen.length > 0;
}

let teller = 0;
export function nieuweVersieringId(): string {
  teller += 1;
  return `v${Date.now().toString(36)}${teller.toString(36)}`;
}

/** Een versiering naar voren of naar achteren in de stapel. */
export function verplaatsInStapel(lijst: GeplaatsteVersiering[], id: string, richting: 'voor' | 'achter'): GeplaatsteVersiering[] {
  const plek = lijst.findIndex(item => item.id === id);
  if (plek < 0) return lijst;
  const doel = richting === 'voor' ? plek + 1 : plek - 1;
  if (doel < 0 || doel >= lijst.length) return lijst;
  const kopie = [...lijst];
  [kopie[plek], kopie[doel]] = [kopie[doel], kopie[plek]];
  return kopie;
}

/**
 * De taartengalerij: taarten die een kind bewaard heeft voor in de
 * encyclopedie. Alleen het plaatje en de datum, niet het hele ontwerp; het
 * werkblad houdt maar één taart tegelijk vast.
 */
export const TAART_GALERIJ_KEY = 'cocokiki:taart-galerij:v1';
export const MAX_GALERIJ = 12;

export interface BewaardeTaart {
  id: string;
  naam: string;
  beeld: string;
  bewaardOp: string;
}

export function migreerGalerij(bron: unknown): BewaardeTaart[] {
  if (!Array.isArray(bron)) return [];
  const gezien = new Set<string>();
  const uit: BewaardeTaart[] = [];
  for (const item of bron) {
    if (!item || typeof item !== 'object') continue;
    const taart = item as Partial<BewaardeTaart>;
    const beeld = afbeelding(taart.beeld);
    if (!beeld || typeof taart.id !== 'string' || gezien.has(taart.id)) continue;
    gezien.add(taart.id);
    uit.push({
      id: taart.id,
      naam: typeof taart.naam === 'string' && taart.naam.trim() ? taart.naam.slice(0, 60) : 'Mijn taart',
      beeld,
      bewaardOp: typeof taart.bewaardOp === 'string' ? taart.bewaardOp : new Date(0).toISOString(),
    });
  }
  return uit.slice(0, MAX_GALERIJ);
}

export function laadGalerij(): BewaardeTaart[] {
  try {
    const opgeslagen = readDocument(TAART_GALERIJ_KEY);
    return migreerGalerij(opgeslagen ? JSON.parse(opgeslagen) : null);
  } catch {
    return [];
  }
}

function schrijfGalerij(lijst: BewaardeTaart[]): boolean {
  const uitkomst = commitLocalState({ [TAART_GALERIJ_KEY]: JSON.stringify(lijst.slice(0, MAX_GALERIJ)) });
  return uitkomst.status === 'applied' || uitkomst.status === 'duplicate';
}

/** De nieuwste taart staat vooraan; boven MAX_GALERIJ valt de oudste eraf. */
export function bewaarInGalerij(beeld: string, naam: string, nu = new Date().toISOString()): boolean {
  if (!beeld.startsWith('data:image/')) return false;
  const nieuw: BewaardeTaart = { id: `t${Date.now().toString(36)}`, naam: naam.slice(0, 60) || 'Mijn taart', beeld, bewaardOp: nu };
  return schrijfGalerij([nieuw, ...laadGalerij()]);
}

export function verwijderUitGalerij(id: string): boolean {
  return schrijfGalerij(laadGalerij().filter(item => item.id !== id));
}
