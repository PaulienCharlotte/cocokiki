import { heelGetal, kiesUit, maakSom, type Sometype } from '../types';

/**
 * Delen met een rest, en dan naar boven afronden.
 *
 * De deling zelf is het makkelijke deel. Het gaat erom wat je met de rest
 * doet: voor die laatste zes kratten moet de wagen nóg een keer rijden, ook
 * al is hij dan niet vol.
 */
const SOORTEN = [
  { zin: (t: number, p: number) => `Een vrachtwagenchauffeur moet ${t} kratten vervoeren. Per keer laadt hij ${p} kratten. Hoeveel keer moet hij rijden?`, ding: 'kratten', keer: 'keer rijden' },
  { zin: (t: number, p: number) => `Er gaan ${t} kinderen op schoolreis. In een bus passen ${p} kinderen. Hoeveel bussen zijn er nodig?`, ding: 'kinderen', keer: 'bussen' },
  { zin: (t: number, p: number) => `In een vat zit ${t} liter water. Jesper schept het leeg met een emmer van ${p} liter. Hoeveel keer moet hij scheppen?`, ding: 'liter', keer: 'keer scheppen' },
  { zin: (t: number, p: number) => `Een bakker heeft ${t} broodjes. In een doos passen er ${p}. Hoeveel dozen heeft hij nodig?`, ding: 'broodjes', keer: 'dozen' },
];

export const ritten: Sometype = {
  id: 'ritten',
  naam: 'Ritjessom',
  aanpak: 'Deel eerst en kijk wat er overblijft. Blijft er iets over, dan komt er nog één keer bij — ook al is die niet vol.',
  valkuil: 'De rest laten liggen. Een halve rit bestaat niet, dus altijd naar boven.',
  niveaus: [1, 2, 3, 4, 5],
  maak(level, index, random) {
    const soort = kiesUit(SOORTEN, random);
    const perKeer = level <= 2 ? kiesUit([5, 6, 8, 10], random) : kiesUit([12, 15, 24, 32, 45], random);
    const vol = heelGetal(level <= 2 ? 3 : 8, level <= 2 ? 9 : 25, random);
    // Niet elke deling heeft een rest. Komt het precies uit, dan is er géén
    // keer extra nodig — anders leert een kind 'altijd eentje erbij', en dat
    // is precies de fout die bij de paaltjessom wél het goede antwoord geeft.
    const rest = index % 4 === 3 ? 0 : heelGetal(1, perKeer - 1, random);
    const totaal = vol * perKeer + rest;
    const keer = vol + (rest > 0 ? 1 : 0);
    const beslissing = {
      vraag: `Hoeveel ${soort.keer} zijn het dan in totaal?`,
      som: `{1} + ${rest > 0 ? 1 : 0}`, antwoord: keer, eenheid: soort.keer, verborgen: true,
      tip: `Blijft er nog iets over, dan is er nog één keer nodig. Komt het precies uit, dan niet.`,
    } as const;
    const controle = rest > 0
      ? `${vol} volle keren van ${perKeer} is ${vol * perKeer}, plus ${rest} over: samen ${totaal}.`
      : `${vol} keren van ${perKeer} is precies ${totaal}. Er blijft niets over, dus er komt geen keer bij.`;
    const kop = {
      typeId: 'ritten', id: `ritten:${level}:${index}:${totaal}:${perKeer}`,
      verhaal: soort.zin(totaal, perKeer),
      nodig: [String(totaal), String(perKeer)],
      zoek: `het aantal ${soort.keer}`,
      aanpak: ritten.aanpak,
      controle,
    };
    const delen = {
      vraag: `Hoeveel volle keren van ${perKeer} gaan eruit?`, som: `${totaal} ÷ ${perKeer}`,
      antwoord: vol, eenheid: 'vol', afronden: 'beneden',
      tip: `Zoek het grootste getal dat je met ${perKeer} kunt vermenigvuldigen zonder boven ${totaal} te komen.`,
    } as const;
    // Op niveau 1 en 2 schrijven we de rest uit; daarna hoort een kind die
    // zelf uit de deling te halen en blijven er twee stappen over.
    if (level >= 3) return maakSom({ ...kop, stappen: [delen, beslissing] });
    return maakSom({
      ...kop,
      stappen: [
        delen,
        { vraag: `Hoeveel ${soort.ding} gaan er in die volle keren mee?`, som: `{1} × ${perKeer}`, antwoord: vol * perKeer, eenheid: soort.ding, tip: `Zoveel volle keren van ${perKeer}: dat is keersommen.` },
        { vraag: `Hoeveel ${soort.ding} blijven er dan over?`, som: `${totaal} − {2}`, antwoord: rest, eenheid: soort.ding, tip: `Haal van de ${totaal} af wat al mee is.` },
        beslissing,
      ],
    });
  },
};
