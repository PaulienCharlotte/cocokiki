import type { MathGameId } from './types';

export const MATH_GAMES: Array<{ id: MathGameId; title: string; subtitle: string; image: string; accent: string; objectives: string[] }> = [
  { id: 'multiply', title: 'Red Baby Lua!', subtitle: 'Red Lua met de tafels', image: 'multiply', accent: 'berry', objectives: ['Tafels 1, 2, 5 en 10', 'Tafels 3 en 4', 'Tafels 6 en 7', 'Tafels 8, 9, 11 en 12', 'Alle tafels tot en met 12'] },
  { id: 'divide', title: 'De Bessenplukkers', subtitle: 'Verdeel de oogst', image: 'divide', accent: 'ochre', objectives: ['Verdelen over 2 of 3 mandjes', 'Verdelen over 2 tot 5 mandjes', 'Grotere oogst, ook door 10', 'Delen met de tafels tot 10', 'Delen met de tafels tot 12'] },
  { id: 'add-subtract', title: 'Het Bosavontuur', subtitle: 'Redactiesommen met bessen en eikels', image: 'add-subtract', accent: 'water', objectives: ['Twee stappen in een verhaal', 'Oogsten, uitdelen en overhouden', 'Rekenen met breuken', 'Delen en percentages', 'Meerdere bewerkingen combineren'] },
  { id: 'missing', title: 'Koekjeschaos', subtitle: 'Maak de bestelling compleet', image: 'missing', accent: 'clay', objectives: ['Het ontbrekende getal bij plus', 'Het ontbrekende getal bij min', 'Het ontbrekende getal bij keer', 'Het ontbrekende getal bij delen', 'Alle bewerkingen door elkaar'] },
  { id: 'balance', title: 'De Honingfabriek', subtitle: 'Evenveel honing in beide potten', image: 'balance', accent: 'fern', objectives: ['Hoeveel honing ontbreekt?', 'Optelsommen vergelijken', 'Plus en min vergelijken', 'Keer en delen vergelijken', 'Gemengde honingpuzzels'] },
  { id: 'race', title: 'Winkelgekte', subtitle: 'Help zoveel mogelijk klanten', image: 'race', accent: 'lavender', objectives: ['Plus en min tot 20', 'Vermenigvuldigen', 'Eerlijk delen', 'Alle bewerkingen', 'Prijzen en wisselgeld'] },
];
export const MATH_GAMES_BY_ID = Object.fromEntries(MATH_GAMES.map(game => [game.id, game])) as Record<MathGameId, typeof MATH_GAMES[number]>;
export const mathIcon = (id: MathGameId) => `/games/school/math/icons/${id}.png`;
export const RACE_TARGETS = [8, 8, 7, 7, 6];
export const RACE_DAILY_COIN_CAP = 50;
export const QUESTION_TRANSITION_MS = 650;
