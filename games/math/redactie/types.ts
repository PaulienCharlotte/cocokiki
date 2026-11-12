import type { MathLevel, MathQuestion } from '../types';

/**
 * Een redactiesom is geen rekensom met een verhaaltje eromheen.
 *
 * Een paaltjessom vraagt om de +1, een ritjessom om naar boven afronden, een
 * tijdsom om de sprong naar het hele uur. Die techniek zit niet in de getallen
 * maar in het type som. Daarom draagt elk type hier zijn eigen aanpak,
 * valkuil en stappen met zich mee, in plaats van dat we de stappen uit een
 * rekenboom afleiden.
 */

/** Hoe een getal gelezen en vergeleken wordt. */
export type Soort = 'getal' | 'euro';

export interface Stap {
  /** Wat je in deze stap doet, in gewone woorden. */
  vraag: string;
  /**
   * De som zoals je hem opschrijft: '125 ÷ 25'. Verwijs met {1} naar de
   * uitkomst van stap 1; die blijft een vraagteken tot je er bent, anders
   * leest een kind het antwoord van de vorige stap gewoon af.
   */
  som: string;
  antwoord: number;
  eenheid: string;
  soort?: Soort;
  /** 'beneden' voor een deling waarbij alleen de hele keren tellen. */
  afronden?: 'beneden';
  /**
   * De som niet laten zien tijdens het rekenen, alleen de vraag. Voor een
   * stap waarin de beslissing zélf de oefening is: '12 + 1' verklapt dat er
   * een keer bij komt. Bij het nakijken staat de som er wél.
   */
  verborgen?: boolean;
  /** De tip als je bij déze stap vastloopt. */
  tip: string;
}

export interface Redactiesom extends MathQuestion {
  typeId: string;
  /** De getallen uit de tekst die je nodig hebt, precies zoals ze er staan. */
  nodig: string[];
  /** Wat je zoekt, in één zin: 'het aantal palen'. */
  zoek: string;
  stappen: Stap[];
  /** Hoe je achteraf controleert of het klopt. */
  controle: string;
}

export interface Sometype {
  id: string;
  /** De naam van de techniek, zoals een kind hem onthoudt. */
  naam: string;
  /** De aanpak in één of twee zinnen, in Lua's woorden. */
  aanpak: string;
  /** De fout die bijna iedereen hier maakt. */
  valkuil: string;
  niveaus: MathLevel[];
  maak(level: MathLevel, index: number, random: () => number): Redactiesom;
}

export const euro = (bedrag: number) => `€ ${bedrag.toFixed(2).replace('.', ',')}`;
export const kiesUit = <T,>(lijst: readonly T[], random: () => number): T => lijst[Math.floor(random() * lijst.length)];
export const heelGetal = (van: number, tot: number, random: () => number) => van + Math.floor(random() * (tot - van + 1));

/** De waarde die een kind intypt vergelijken met het juiste antwoord. */
export function klopt(stap: Stap, waarde: number): boolean {
  return Math.abs(waarde - stap.antwoord) < (stap.soort === 'euro' ? 0.005 : 1e-9);
}

/** Het geraamte dat elke som deelt; de typen vullen alleen hun eigen deel in. */
export function maakSom(deel: {
  typeId: string; id: string; verhaal: string; nodig: string[]; zoek: string;
  stappen: Stap[]; controle: string; aanpak: string;
}): Redactiesom {
  const laatste = deel.stappen[deel.stappen.length - 1];
  return {
    id: deel.id,
    kind: 'choice',
    left: { value: laatste.antwoord },
    right: { blank: true },
    answer: laatste.antwoord,
    options: [laatste.antwoord],
    prompt: deel.verhaal,
    hint: deel.aanpak,
    operation: '+',
    a: 0, b: 0, total: laatste.antwoord,
    typeId: deel.typeId,
    nodig: deel.nodig,
    zoek: deel.zoek,
    stappen: deel.stappen,
    controle: deel.controle,
  };
}

/**
 * De som van een stap opschrijven. Een verwijzing als {1} wordt pas een
 * getal zodra die stap klaar is; daarvoor blijft het een vraagteken, anders
 * leest een kind de uitkomst van de vorige stap gewoon af. Staat er een
 * eigen antwoord, dan rekenen we verder met dát getal.
 */
export function somTekst(
  stappen: Stap[], stapIndex: number, bezig: number, klaar: boolean, eigen: Array<number | null> = [],
): string {
  return stappen[stapIndex].som.replace(/\{(\d+)\}/g, (_hele, nummer) => {
    const plek = Number(nummer) - 1;
    const bron = stappen[plek];
    if (!bron || (!klaar && plek >= Math.min(bezig, stapIndex))) return '?';
    // Het getal dat het kind zelf invulde, zodat het verder rekent met zijn
    // eigen som. Pas bij het nakijken zie je of dat klopte.
    const waarde = eigen[plek] ?? bron.antwoord;
    return bron.soort === 'euro' ? euro(waarde) : String(waarde);
  });
}

/**
 * Een stap narekenen met de getallen die het kind zelf heeft ingevuld.
 *
 * Omdat een stap nooit keer of delen mengt met plus of min, is van links
 * naar rechts rekenen genoeg: er zijn geen rekenregels nodig. Zo kunnen we
 * ook zien of een kind ná een fout wél goed is doorgerekend.
 */
export function evalueerSom(som: string, eerdere: Array<number | null>, afronden?: 'beneden'): number | null {
  const ingevuld = som.replace(/\{(\d+)\}/g, (_hele, nummer) => {
    const waarde = eerdere[Number(nummer) - 1];
    return waarde === null || waarde === undefined ? 'leeg' : String(waarde);
  });
  const stukken = ingevuld.trim().split(/\s+/);
  let uitkomst = Number(stukken[0]);
  if (!Number.isFinite(uitkomst)) return null;
  for (let i = 1; i < stukken.length; i += 2) {
    const getal = Number(stukken[i + 1]);
    if (!Number.isFinite(getal)) return null;
    if (stukken[i] === '+') uitkomst += getal;
    else if (stukken[i] === '−') uitkomst -= getal;
    else if (stukken[i] === '×') uitkomst *= getal;
    else if (stukken[i] === '÷') { if (getal === 0) return null; uitkomst /= getal; }
    else return null;
  }
  if (!Number.isFinite(uitkomst)) return null;
  return afronden === 'beneden' ? Math.floor(uitkomst) : Math.round(uitkomst * 1e6) / 1e6;
}

/**
 * De vier aanpakken waaruit een kind kiest: dezelfde twee getallen, vier
 * bewerkingen. De volgorde hangt aan de som, zodat het juiste antwoord niet
 * bij elk type op dezelfde plek staat.
 */
export function planOpties(som: string, sleutel: string): string[] {
  const stukken = som.trim().split(/\s+/);
  if (stukken.length !== 3) return [som];
  const opties = ['÷', '×', '−', '+'].map(teken => `${stukken[0]} ${teken} ${stukken[2]}`);
  let getal = 0;
  for (const letter of sleutel) getal = (getal * 31 + letter.charCodeAt(0)) % 9973;
  for (let i = opties.length - 1; i > 0; i--) {
    getal = (getal * 31 + 17) % 9973;
    const j = getal % (i + 1);
    [opties[i], opties[j]] = [opties[j], opties[i]];
  }
  return opties;
}
