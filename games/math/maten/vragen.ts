import { TRAPPEN, reken, toonMaat } from '../Maten';
import { verschoven } from '../toeval';
import type { MathLevel, MathQuestion } from '../types';

/**
 * De vragen van het matenspel.
 *
 * Drie soorten, want omrekenen alleen is een trucje. Je moet maten ook uit
 * elkaar kunnen houden als ze door elkaar staan, en weten hoe groot een maat
 * ongeveer is — anders reken je 2500 kg aan appels uit zonder te merken dat
 * het niet kan.
 */
export type Maatsoort = 'omrekenen' | 'vergelijken' | 'schatten';

export interface Maatvraag extends MathQuestion {
  soort: Maatsoort;
  /** Bij omrekenen: '30 cm = ? dm'. */
  aantal: number;
  van: string;
  naar: string;
  /** Bij vergelijken en schatten: de keuzes, en welke de juiste is. */
  keuzes: string[];
  uitleg: string;
}

const kies = <T,>(lijst: readonly T[], random: () => number): T => lijst[Math.floor(random() * lijst.length)];
const NET = [1, 2, 3, 4, 5, 6, 8, 12, 15, 20, 25, 50, 75, 100];
const HALF = [1.5, 2.5, 7.5, 12.5];

/** Welke trappen op welk niveau meedoen; oppervlakte en volume pas later. */
function trappenVoor(level: MathLevel) {
  if (level <= 1) return [TRAPPEN[0], TRAPPEN[1]];
  if (level <= 3) return [TRAPPEN[0], TRAPPEN[1], TRAPPEN[2]];
  if (level === 4) return [TRAPPEN[0], TRAPPEN[1], TRAPPEN[2], TRAPPEN[3]];
  return TRAPPEN;
}

const kop = (soort: Maatsoort, level: MathLevel, index: number) => `maat:${soort}:${level}:${index}`;

function maak(deel: {
  id: string; soort: Maatsoort; prompt: string; hint: string; uitleg: string;
  antwoord: number; keuzes: string[]; aantal?: number; van?: string; naar?: string;
}): Maatvraag {
  return {
    id: deel.id, kind: 'choice', left: { value: deel.antwoord }, right: { blank: true },
    answer: deel.antwoord, options: [deel.antwoord], prompt: deel.prompt, hint: deel.hint,
    operation: '+', a: 0, b: 0, total: deel.antwoord,
    soort: deel.soort, aantal: deel.aantal ?? 0, van: deel.van ?? '', naar: deel.naar ?? '',
    keuzes: deel.keuzes, uitleg: deel.uitleg,
  };
}

/** 30 cm = ? dm — met getallen die netjes uitkomen, ook als je deelt. */
export function omrekenvraag(level: MathLevel, index: number, random: () => number): Maatvraag {
  const trap = kies(trappenVoor(level), random);
  const maxStappen = level <= 1 ? 1 : level <= 3 ? 2 : 3;
  const stappen = Math.min(maxStappen, trap.maten.length - 1);
  const sprong = 1 + Math.floor(random() * stappen);
  const naarRechts = level <= 2 ? true : random() < .5;
  const vanIndex = naarRechts
    ? Math.floor(random() * (trap.maten.length - sprong))
    : sprong + Math.floor(random() * (trap.maten.length - sprong));
  const naarIndex = naarRechts ? vanIndex + sprong : vanIndex - sprong;
  const net = kies(level >= 4 ? [...NET, ...HALF] : NET, random);
  // Naar links wordt gedeeld; dan kiezen we de uitkomst en rekenen terug,
  // zodat er nooit een eindeloze kommagetal uitrolt.
  const aantal = naarRechts ? net : reken(net, sprong, trap.factor);
  const antwoord = reken(aantal, naarIndex - vanIndex, trap.factor);
  const van = trap.maten[vanIndex], naar = trap.maten[naarIndex];
  return maak({
    id: `${kop('omrekenen', level, index)}:${aantal}${van}${naar}`, soort: 'omrekenen',
    prompt: `Hoeveel ${naar} is ${toonMaat(aantal)} ${van}?`,
    hint: `${van} en ${naar} liggen ${sprong} ${sprong === 1 ? 'stap' : 'stappen'} uit elkaar, en elke stap is × ${trap.factor}.`,
    uitleg: `${toonMaat(aantal)} ${van} = ${toonMaat(antwoord)} ${naar}.`,
    antwoord, keuzes: [], aantal, van, naar,
  });
}

const WOORDEN: Record<string, { meest: string; minst: string }> = {
  Lengte: { meest: 'het langst', minst: 'het kortst' },
  Inhoud: { meest: 'het meest', minst: 'het minst' },
  Gewicht: { meest: 'het zwaarst', minst: 'het lichtst' },
  Oppervlakte: { meest: 'het grootst', minst: 'het kleinst' },
  Volume: { meest: 'het grootst', minst: 'het kleinst' },
};

/** Welke is het zwaarst? Vier maten door elkaar, zoals op een werkblad. */
export function vergelijkvraag(level: MathLevel, index: number, random: () => number): Maatvraag {
  const trap = kies(trappenVoor(level), random);
  const basis = trap.maten.indexOf(trap.basis);
  const plekken = [...trap.maten.keys()].sort(() => random() - .5).slice(0, 4);
  const keuzes = plekken.map(plek => ({ maat: trap.maten[plek], aantal: kies(NET, random), plek }));
  const waarden = keuzes.map(keuze => reken(keuze.aantal, basis - keuze.plek, trap.factor));
  const grootste = Math.max(...waarden), kleinste = Math.min(...waarden);
  // Zonder één duidelijke winnaar is er niets te kiezen.
  if (waarden.filter(waarde => waarde === grootste).length > 1 || waarden.filter(waarde => waarde === kleinste).length > 1) {
    return vergelijkvraag(level, index + 101, random);
  }
  const meest = random() < .5;
  const doel = meest ? grootste : kleinste;
  const juist = waarden.indexOf(doel);
  const woord = WOORDEN[trap.naam] ?? WOORDEN.Lengte;
  return maak({
    id: `${kop('vergelijken', level, index)}:${keuzes.map(k => k.aantal + k.maat).join('-')}`, soort: 'vergelijken',
    prompt: `Welke is ${meest ? woord.meest : woord.minst}?`,
    hint: `Reken ze eerst allemaal om naar ${trap.basis}. Dan kun je ze vergelijken.`,
    uitleg: `In ${trap.basis}: ${keuzes.map((keuze, i) => `${keuze.aantal} ${keuze.maat} = ${toonMaat(waarden[i])}`).join(', ')}.`,
    antwoord: juist, keuzes: keuzes.map(keuze => `${keuze.aantal} ${keuze.maat}`),
  });
}

/** Hoe groot is een maat eigenlijk? Zonder dat gevoel merk je fouten niet. */
export const SCHATTINGEN: Array<{ zin: string; juist: string; fout: string[] }> = [
  { zin: 'Een pak melk bevat ongeveer 1 …', juist: 'l', fout: ['ml', 'dl', 'kl'] },
  { zin: 'Een deur is ongeveer 2 … hoog.', juist: 'm', fout: ['cm', 'dm', 'km'] },
  { zin: 'Een appel weegt ongeveer 150 …', juist: 'g', fout: ['kg', 'mg', 'ton'] },
  { zin: 'Een lepel hoestdrank is ongeveer 5 …', juist: 'ml', fout: ['l', 'dl', 'cl'] },
  { zin: 'Van Amsterdam naar Parijs is ongeveer 500 …', juist: 'km', fout: ['m', 'hm', 'dm'] },
  { zin: 'Een volwassene weegt ongeveer 75 …', juist: 'kg', fout: ['g', 'hg', 'ton'] },
  { zin: 'Een potlood is ongeveer 17 … lang.', juist: 'cm', fout: ['mm', 'dm', 'm'] },
  { zin: 'Een voetbalveld is ongeveer 7000 … groot.', juist: 'm²', fout: ['cm²', 'km²', 'dm²'] },
  { zin: 'Een blikje drinken bevat ongeveer 33 …', juist: 'cl', fout: ['l', 'ml', 'dl'] },
  { zin: 'Een vrachtwagen weegt ongeveer 10 …', juist: 'ton', fout: ['kg', 'hg', 'g'] },
];

export function schatvraag(level: MathLevel, index: number, random: () => number): Maatvraag {
  // Alleen maten die op dit niveau al aan bod zijn: een voetbalveld in m²
  // hoort niet bij een kind dat net cm en dm oefent.
  const bekend = new Set(trappenVoor(level).flatMap(trap => trap.maten));
  const passend = SCHATTINGEN.filter(feit => [feit.juist, ...feit.fout].every(maat => bekend.has(maat)));
  const lijst = passend.length ? passend : SCHATTINGEN;
  const feit = lijst[(index + Math.floor(random() * lijst.length)) % lijst.length];
  const keuzes = [feit.juist, ...feit.fout].sort(() => random() - .5);
  return maak({
    id: `${kop('schatten', level, index)}:${feit.juist}`, soort: 'schatten',
    prompt: feit.zin,
    hint: 'Denk aan iets wat je kent. Past deze maat daarbij?',
    uitleg: `${feit.zin.replace('…', feit.juist)}`,
    antwoord: keuzes.indexOf(feit.juist), keuzes,
  });
}

/** Tien vragen: omrekenen is de hoofdmoot, de rest houdt het wakker. */
export function maakMatendeck(level: MathLevel, random = Math.random): Maatvraag[] {
  const soorten: Maatsoort[] = level <= 1
    ? ['omrekenen', 'omrekenen', 'schatten']
    : level === 2 ? ['omrekenen', 'omrekenen', 'schatten', 'omrekenen']
    : ['omrekenen', 'vergelijken', 'omrekenen', 'schatten'];
  const deck: Maatvraag[] = [];
  const gezien = new Set<string>();
  for (let index = 0; deck.length < 10 && index < 80; index++) {
    const soort = soorten[index % soorten.length];
    const beurt = verschoven(random, index);
    const vraag = soort === 'omrekenen' ? omrekenvraag(level, index, beurt)
      : soort === 'vergelijken' ? vergelijkvraag(level, index, beurt)
      : schatvraag(level, index, beurt);
    if (gezien.has(vraag.prompt)) continue;
    gezien.add(vraag.prompt);
    deck.push(vraag);
  }
  return deck;
}
