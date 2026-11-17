import type { MathLevel } from '../types';
import type { Stap } from './types';

/**
 * Het kind bedenkt zelf welke som het maakt.
 *
 * Een stap kwam eerst kant-en-klaar op het werkblad ("3 × 2,00 = ?"), en dan
 * blijft er alleen uitrekenen over. Hier kiest of bouwt het kind de som eerst
 * zelf, met minder steun naarmate het niveau hoger is:
 *
 * - niveau 1: kies uit twee sommen
 * - niveau 2: kies uit vier sommen
 * - niveau 3 en hoger: bouw de som zelf uit getallen en een rekenteken
 *
 * Na een goede keuze legt Lua in één zin uit waarom je die som neemt. Bij een
 * verkeerde keuze stelt ze een wedervraag in plaats van het antwoord te geven.
 */

export type Teken = '+' | '−' | '×' | '÷';
export const TEKENS: Teken[] = ['+', '−', '×', '÷'];
export interface Som { links: string; teken: Teken; rechts: string }
export type Steunvorm = 'kies-twee' | 'kies-vier' | 'bouw';

export const steunvormVoorNiveau = (niveau: MathLevel): Steunvorm => (niveau <= 1 ? 'kies-twee' : niveau === 2 ? 'kies-vier' : 'bouw');
/** Op niveau 4 en 5 bedenk je ook zelf wat de volgende stap is: de tussenvraag staat er niet bij. */
export const tussenvraagZichtbaar = (niveau: MathLevel) => niveau <= 3;

/** '3 × € 2,00' → { links: '3', teken: '×', rechts: '€ 2,00' }. Een som zonder rekenteken ('{2}') geeft null. */
export function leesSom(tekst: string): Som | null {
  const m = tekst.trim().match(/^(.+?)\s([+−×÷])\s(.+)$/);
  return m ? { links: m[1].trim(), teken: m[2] as Teken, rechts: m[3].trim() } : null;
}
export const schrijfSom = (som: Som) => `${som.links} ${som.teken} ${som.rechts}`;
const kaal = (tekst: string) => tekst.replace(/[€\s]/g, '').replace('.', ',');
/** Klopt de gebouwde som? Bij plus en keer mag de volgorde om. */
export function zelfdeSom(a: Som, b: Som): boolean {
  if (a.teken !== b.teken) return false;
  if (kaal(a.links) === kaal(b.links) && kaal(a.rechts) === kaal(b.rechts)) return true;
  return (a.teken === '+' || a.teken === '×') && kaal(a.links) === kaal(b.rechts) && kaal(a.rechts) === kaal(b.links);
}
/** Moet het kind hier zelf de som kiezen? Niet bij een stap zonder rekenteken, een keuzestap of een verborgen beslissing. */
export const somKiesbaar = (stap: Stap, tekst: string) => !stap.verborgen && !stap.keuzes && leesSom(tekst) !== null;

function hussel<T>(lijst: T[], sleutel: string): T[] {
  const uit = [...lijst];
  let getal = 0;
  for (const letter of sleutel) getal = (getal * 31 + letter.charCodeAt(0)) % 9973;
  for (let i = uit.length - 1; i > 0; i--) { getal = (getal * 31 + 17) % 9973; const j = getal % (i + 1); [uit[i], uit[j]] = [uit[j], uit[i]]; }
  return uit;
}
const tegenovergesteld: Record<Teken, Teken> = { '+': '−', '−': '+', '×': '÷', '÷': '×' };

/**
 * De sommen om uit te kiezen. De verkeerde zijn de vergissingen die kinderen
 * echt maken: de getallen omdraaien (5 ÷ 100 in plaats van 100 ÷ 5) of het
 * tegenovergestelde rekenteken nemen.
 */
export function somOpties(juist: Som, aantal: 2 | 4, sleutel: string): string[] {
  const omgedraaid = juist.teken === '−' || juist.teken === '÷' ? schrijfSom({ links: juist.rechts, teken: juist.teken, rechts: juist.links }) : null;
  const fout = [
    omgedraaid,
    schrijfSom({ ...juist, teken: tegenovergesteld[juist.teken] }),
    ...TEKENS.filter(t => t !== juist.teken && t !== tegenovergesteld[juist.teken]).map(teken => schrijfSom({ ...juist, teken })),
  ].filter((som, i, lijst): som is string => !!som && som !== schrijfSom(juist) && lijst.indexOf(som) === i);
  return hussel([schrijfSom(juist), ...fout.slice(0, aantal - 1)], sleutel);
}

/** De getallen om mee te bouwen: de twee goede, plus wat verder in de som staat, zodat je moet kiezen. */
export function bouwGetallen(juist: Som, extra: string[], sleutel: string): string[] {
  const alles = [juist.links, juist.rechts, ...extra].filter((g, i, lijst) => g && lijst.findIndex(x => kaal(x) === kaal(g)) === i);
  return hussel(alles.slice(0, 5), sleutel);
}

const machtVanTien = (tekst: string) => /^1(0{1,5}|00\.000|\.000)$/.test(kaal(tekst).replace(/\./g, ''));

/** Waarom je deze som neemt, in één zin. Een eigen zin op de stap gaat voor. */
export function waarom(stap: Stap, juist: Som): string {
  if (stap.waarom) return stap.waarom;
  // De maat-uitleg (cm naar m) past alleen als je echt een maat omrekent, niet bij "hoe vaak past het".
  const maatOmrekenen = /^(mm|cm|dm|m|km|g|gram|kg|mg|ml|cl|dl|l|liter|m²|m³|cm²|cm³)$/i.test(stap.eenheid.trim());
  if (juist.teken === '÷' && stap.eenheid.trim() === 'keer') return `Delen: hoe vaak past ${juist.rechts} in ${juist.links}?`;
  if (!maatOmrekenen) { /* val terug op de gewone uitleg hieronder */ }
  else if (juist.teken === '×' && machtVanTien(juist.rechts)) return `Keer ${juist.rechts}: kleinere maat, dus een groter getal.`;
  else if (juist.teken === '÷' && machtVanTien(juist.rechts)) return `Gedeeld door ${juist.rechts}: grotere maat, dus een kleiner getal.`;
  return {
    '×': 'Keer: hetzelfde een paar keer.',
    '÷': 'Delen: eerlijk verdelen, of kijken hoe vaak het past.',
    '+': 'Plus: er komt iets bij.',
    '−': 'Min: er gaat iets af.',
  }[juist.teken];
}

/** Een wedervraag bij een verkeerde som: Lua zet je aan het denken in plaats van het voor te zeggen. */
/** Een getal dat het kind koos maar dat niet in deze som hoort; dat getal wordt vaag. */
export function overbodigGetal(gekozen: Som | null, juist: Som): string | null {
  if (!gekozen) return null;
  const hoort = [kaal(juist.links), kaal(juist.rechts)];
  return [gekozen.links, gekozen.rechts].find(g => !hoort.includes(kaal(g))) ?? null;
}

/**
 * De fout bepaalt de hint: één gerichte vraag die precies dit denkprobleem raakt,
 * in plaats van een rij algemene tips. Geen sleutelwoordtrucjes.
 */
export function wedervraag(gekozen: Som | null, juist: Som): string {
  if (!gekozen) return 'Wat wil je weten?';
  if (overbodigGetal(gekozen, juist)) return 'Eén getal hoort hier niet bij.';
  const a = gekozen.teken, b = juist.teken;
  if (a === b) return b === '÷' ? 'Welk getal verdeel je? Dat komt vooraan.'
    : 'Begin met het grootste getal.';
  if (a === '+' && b === '×') return 'Hoeveel groepjes? En hoeveel in elk?';
  if (a === '×' && b === '+') return 'Gelijke groepjes, of komt er iets bij?';
  if ((a === '+' && b === '−') || (a === '−' && b === '+')) return 'Wordt het meer of minder?';
  if ((a === '×' && b === '÷') || (a === '÷' && b === '×')) return 'Verdeel je, of wordt het een paar keer zo veel?';
  if (b === '÷') return 'Wat wordt er verdeeld?';
  if (b === '×') return 'Wat is een paar keer hetzelfde?';
  return b === '−' ? 'Wat gaat eraf?' : 'Wat komt erbij?';
}
