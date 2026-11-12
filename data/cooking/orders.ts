import type { CharacterId } from '../characters';
import type { RecipeCategory } from './types';

/**
 * De bestellingen aan de toonbank.
 *
 * Een kookavontuur begon vroeger bij een recept: je koos er een en werkte hem
 * af. Dat voelde als het kookboek, omdat het dat ook was. Een bestelling zet
 * er iemand voor: er is een reden om te bakken, er is iemand voor wie je het
 * doet, en aan het eind zegt die iemand er iets over.
 *
 * Alles wat een kind moet uitzoeken staat in de wens, niet in het recept:
 * welk recept past, en hoe vaak je moet bakken voor zoveel mensen.
 */

/** Waar de bestelling om vraagt. Hieruit volgt ook waarom iets niet past. */
export type BestellingEis =
  | { soort: 'zonder'; ingredientIds: string[]; woord: string }
  | { soort: 'categorie'; categorie: RecipeCategory }
  | { soort: 'snel'; minuten: number };

export interface Bestelling {
  id: string;
  /** Wie er aan de toonbank staat. Coco is de bakker, de rest komt langs. */
  klant: CharacterId;
  /** Waarom er gebakken wordt. Eén regel, op het kaartje aan de toonbank. */
  aanleiding: string;
  /** Wat de klant zelf zegt. Dit is de opdracht. */
  wens: string;
  /** Voor hoeveel mensen. Hieruit volgt hoe vaak je moet bakken. */
  eters: number;
  eis: BestellingEis;
  /**
   * Waarom een recept dat niet voldoet, niet voldoet — in de woorden van de
   * klant. Dit klopt altijd: een recept dat zakt op de eis is per definitie
   * het recept waar deze zin over gaat.
   */
  afwijzing: string;
  /** Wat de klant zegt als je het komt brengen. */
  dank: string;
  /** Extra munten als het recept én het aantal in één keer goed waren. */
  bonus: number;
}

export const BESTELLINGEN: Bestelling[] = [
  {
    id: 'kiki-kas',
    klant: 'kiki',
    aanleiding: 'Kiki heeft de hele ochtend in de kas gewerkt.',
    wens: 'Ik kom zo langs met drie mensen uit de kas. Maak je iets voor ons vieren? Alleen: ik kan geen zuivel hebben, dus kijk goed wat erin zit.',
    eters: 4,
    eis: { soort: 'zonder', ingredientIds: ['milk', 'yogurt'], woord: 'zuivel' },
    afwijzing: 'Daar zit zuivel in. Dat kan ik niet hebben.',
    dank: 'Precies goed, en genoeg voor ons alle vier. We gaan buiten zitten.',
    bonus: 5,
  },
  {
    id: 'seb-verjaardag',
    klant: 'seb',
    aanleiding: 'Het zusje van Seb is zaterdag jarig.',
    wens: 'Er komen veertien kinderen. Iets uit de oven, dat vinden ze het leukst. Zorg dat er voor iedereen een is.',
    eters: 14,
    eis: { soort: 'categorie', categorie: 'baking' },
    afwijzing: 'Dat komt niet uit de oven. Ze willen juist iets wat warm uit de oven komt.',
    dank: 'Veertien stuks, en ze kwamen uit de oven. Zaterdag wordt goed.',
    bonus: 5,
  },
  {
    id: 'lua-tussendoor',
    klant: 'lua',
    aanleiding: 'Baby Lua moet zo weer verder met de tafels.',
    wens: 'Ik heb maar tien minuten, en we zijn met zijn drieën. Iets wat snel klaar is, anders haal ik het niet.',
    eters: 3,
    eis: { soort: 'snel', minuten: 10 },
    afwijzing: 'Dat duurt me te lang. Ik moet over tien minuten weer verder.',
    dank: 'Op tijd, en voor ons drieën. Nu kan ik weer rekenen.',
    bonus: 5,
  },
];

export const BESTELLINGEN_BY_ID = Object.fromEntries(BESTELLINGEN.map(item => [item.id, item])) as Record<string, Bestelling>;

/** Wat de eis in gewone taal is, voor op het briefje naast de wens. */
export function eisInWoorden(bestelling: Bestelling): string {
  const eis = bestelling.eis;
  if (eis.soort === 'zonder') return `Zonder ${eis.woord}`;
  if (eis.soort === 'categorie') return CATEGORIE_IN_WOORDEN[eis.categorie];
  return `Binnen ${eis.minuten} minuten klaar`;
}

const CATEGORIE_IN_WOORDEN: Record<RecipeCategory, string> = { breakfast: 'Iets voor bij het ontbijt', snack: 'Iets voor tussendoor', baking: 'Iets uit de oven', cooking: 'Een warme maaltijd' };
