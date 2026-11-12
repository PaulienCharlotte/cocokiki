import type { MathLevel } from '../types';
import { verschoven } from '../toeval';
import type { Redactiesom, Sometype } from './types';
import { paaltjes } from './typen/paaltjes';
import { ritten } from './typen/ritten';
import { procenten } from './typen/procenten';
import { tijdsduur } from './typen/tijdsduur';

/**
 * De catalogus van sommentypen.
 *
 * Elk type is een techniek die een kind leert herkennen. Een niveau is een
 * greep uit de typen die op dat niveau aan de beurt zijn; de getallen
 * verschillen elke keer, de aanpak niet.
 */
export const REDACTIE_TYPEN: Sometype[] = [ritten, paaltjes, tijdsduur, procenten];
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
  const typen = typenVoorNiveau(level);
  const deck: Redactiesom[] = [];
  const gezien = new Set<string>();
  for (let index = 0; deck.length < 10 && index < 60; index++) {
    const som = typen[index % typen.length].maak(level, index, verschoven(random, index));
    if (gezien.has(som.prompt)) continue;
    gezien.add(som.prompt);
    deck.push(som);
  }
  return deck;
}
