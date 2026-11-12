import type { MathGameId } from './types';

/*
 * De naam van een spel zegt wat je oefent, niet hoe het avontuur heet.
 * "Het Bosavontuur" klinkt leuk, maar een kind dat redactiesommen zoekt kan
 * het niet vinden. Het spelnaampje staat in de regel eronder.
 */

export const MATH_GAMES: Array<{ id: MathGameId; title: string; subtitle: string; image: string; accent: string; objectives: string[]; tekening?: false }> = [
  { id: 'multiply', title: 'Keersommen', subtitle: 'Red Baby Lua met de tafels', image: 'multiply', accent: 'berry', objectives: ['Tafels 1, 2, 5 en 10', 'Tafels 3 en 4', 'Tafels 6 en 7', 'Tafels 8, 9, 11 en 12', 'Alle tafels tot en met 12'] },
  { id: 'divide', title: 'Delen', subtitle: 'Verdeel de oogst over de mandjes', image: 'divide', accent: 'ochre', objectives: ['Verdelen over 2 of 3 mandjes', 'Verdelen over 2 tot 5 mandjes', 'Grotere oogst, ook door 10', 'Delen met de tafels tot 10', 'Delen met de tafels tot 12'] },
  { id: 'add-subtract', title: 'Redactiesommen', subtitle: 'Verhaalsommen stap voor stap', image: 'add-subtract', accent: 'water', objectives: ['Delen met een rest: ritjessommen', 'Paaltjes tellen en tijd lezen', 'Procenten erbij', 'Langere tijdsprongen en kortingen', 'Alle soorten door elkaar, zonder vooruitblik'] },
  { id: 'missing', title: 'Het ontbrekende getal', subtitle: 'Maak de bestelling compleet', image: 'missing', accent: 'clay', objectives: ['Het ontbrekende getal bij plus', 'Het ontbrekende getal bij min', 'Het ontbrekende getal bij keer', 'Het ontbrekende getal bij delen', 'Alle bewerkingen door elkaar'] },
  { id: 'balance', title: 'Vergelijken', subtitle: 'Evenveel honing in beide potten', image: 'balance', accent: 'fern', objectives: ['Hoeveel honing ontbreekt?', 'Optelsommen vergelijken', 'Plus en min vergelijken', 'Keer en delen vergelijken', 'Gemengde honingpuzzels'] },
  { id: 'maten', title: 'Maten', subtitle: 'Omrekenen, vergelijken en schatten', image: 'maten', accent: 'fern', tekening: false, objectives: ['Lengte en inhoud, één stap', 'Ook gewicht, en twee stappen', 'Maten vergelijken', 'Oppervlakte erbij', 'Alles, ook volume en kommagetallen'] },
  { id: 'race', title: 'Alle sommen op tijd', subtitle: 'Help zoveel mogelijk klanten in de winkel', image: 'race', accent: 'lavender', objectives: ['Plus en min tot 20', 'Vermenigvuldigen', 'Eerlijk delen', 'Alle bewerkingen', 'Prijzen en wisselgeld'] },
];
/**
 * De spellen met een eigen tekening. Alleen die staan op de wereldkaart en
 * in de activiteitenlijst; een spel zonder tekening zou daar een kapot
 * plaatje geven. In het rekenmenu doet het wel mee, met een icoon.
 */
export const GETEKENDE_MATH_GAMES = MATH_GAMES.filter(game => game.tekening !== false);
export const MATH_GAMES_BY_ID = Object.fromEntries(MATH_GAMES.map(game => [game.id, game])) as Record<MathGameId, typeof MATH_GAMES[number]>;
export const mathIcon = (id: MathGameId) => `/games/school/math/icons/${id}.webp`;
export const RACE_TARGETS = [8, 8, 7, 7, 6];
export const RACE_DAILY_COIN_CAP = 50;
export const QUESTION_TRANSITION_MS = 650;
