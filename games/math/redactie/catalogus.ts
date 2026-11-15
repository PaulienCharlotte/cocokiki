import type { MathLevel } from '../types';
import { verschoven } from '../toeval';
import type { Redactiesom, Sometype } from './types';
import { paaltjes } from './typen/paaltjes';
import { ritten } from './typen/ritten';
import { procenten } from './typen/procenten';
import { tijdsduur } from './typen/tijdsduur';
import { prijsPerStuk } from './typen/prijsPerStuk';
import { dozijn } from './typen/dozijn';
import { wisselgeld } from './typen/wisselgeld';
import { breukdeel } from './typen/breukdeel';
import { kalender } from './typen/kalender';
import { snelheid } from './typen/snelheid';
import { maten } from './typen/maten';
import { omtrekOppervlakte } from './typen/omtrekOppervlakte';
import { inhoud } from './typen/inhoud';
import { somVerschil } from './typen/somVerschil';
import { verdeelRest } from './typen/verdeelRest';
import { omgekeerd } from './typen/omgekeerd';
import { schaal } from './typen/schaal';
import { gemiddelde } from './typen/gemiddelde';
import { strikvraag } from './typen/strikvraag';

/**
 * De catalogus van sommentypen.
 *
 * Elk type is een techniek die een kind leert herkennen. Een niveau is een
 * greep uit de typen die op dat niveau aan de beurt zijn; de getallen
 * verschillen elke keer, de aanpak niet.
 */
export const REDACTIE_TYPEN: Sometype[] = [
  ritten, paaltjes, tijdsduur, procenten, prijsPerStuk, dozijn, wisselgeld, breukdeel, kalender, snelheid,
  maten, omtrekOppervlakte, inhoud, somVerschil, verdeelRest, omgekeerd, schaal, gemiddelde, strikvraag,
];
export const REDACTIE_TYPEN_BY_ID = Object.fromEntries(REDACTIE_TYPEN.map(type => [type.id, type])) as Record<string, Sometype>;

export function typenVoorNiveau(level: MathLevel): Sometype[] {
  const passend = REDACTIE_TYPEN.filter(type => type.niveaus.includes(level));
  return passend.length ? passend : REDACTIE_TYPEN;
}

/**
 * Hoeveel hulp er klaarstaat. Op niveau 1 en 2 zie je alle stappen met hun
 * vraag erboven; daarna verdwijnt eerst de vooruitblik en dan de vraagzin,
 * zodat je het zelf moet indelen.
 */
export type Steun = 'volledig' | 'beknopt' | 'kaal';
export const steunVoorNiveau = (level: MathLevel): Steun => (level <= 2 ? 'volledig' : level <= 4 ? 'beknopt' : 'kaal');

export function maakRedactiedeck(level: MathLevel, random = Math.random): Redactiesom[] {
  // Er zijn meer soorten dan sommen in een ronde: schud ze, zodat elke
  // ronde andere soorten aan de beurt komen.
  const typen = [...typenVoorNiveau(level)];
  for (let i = typen.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [typen[i], typen[j]] = [typen[j], typen[i]];
  }
  const deck: Redactiesom[] = [];
  const gezien = new Set<string>();
  for (let index = 0; deck.length < 10 && index < 60; index++) {
    const som = typen[index % typen.length].maak(level, index, verschoven(random, index));
    if (gezien.has(som.prompt)) continue;
    gezien.add(som.prompt);
    deck.push(som);
  }
  // De eerste som van elk soort vraagt vooraf om herkenning; de rest niet.
  const eerder = new Set<string>();
  for (const som of deck) {
    if (!eerder.has(som.typeId)) { som.vraagSoort = true; eerder.add(som.typeId); }
  }
  return deck;
}

/**
 * De vier soorten waaruit een kind kiest: de juiste en drie andere van
 * hetzelfde niveau. De volgorde hangt aan de som, zodat het goede antwoord
 * niet steeds op dezelfde plek staat.
 */
export function soortKeuzes(typeId: string, sleutel: string, level?: MathLevel): Sometype[] {
  const juist = REDACTIE_TYPEN_BY_ID[typeId];
  const anderen = (level ? typenVoorNiveau(level) : REDACTIE_TYPEN).filter(type => type.id !== typeId);
  let getal = 0;
  for (const letter of sleutel) getal = (getal * 31 + letter.charCodeAt(0)) % 9973;
  const gekozen: Sometype[] = [];
  const pool = [...anderen];
  while (gekozen.length < 3 && pool.length) {
    getal = (getal * 31 + 17) % 9973;
    gekozen.push(pool.splice(getal % pool.length, 1)[0]);
  }
  const keuzes = [...gekozen];
  keuzes.splice(getal % (keuzes.length + 1), 0, juist);
  return keuzes;
}
