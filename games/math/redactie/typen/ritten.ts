import { getal, heelGetal, kiesUit, maakSom, type Sometype } from '../types';

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
  aanpak: 'Deel eerst. Blijft er een stukje over, dan is er nog een hele keer nodig — ook al is die niet vol. Komt het precies uit, dan niet.',
  valkuil: 'De rest laten liggen. Een halve rit bestaat niet, dus altijd naar boven.',
  niveaus: [1, 2, 3, 4, 5],
  maak(level, index, random) {
    const soort = kiesUit(SOORTEN, random);
    // Vanaf niveau 3 deel je gewoon en rond je daarna af. Dan moet de deling
    // wel netjes uitkomen op twee decimalen, anders typt een kind 20,8333.
    if (level >= 3) {
      const perKeer = kiesUit([4, 5, 8, 10, 12, 15, 20, 24, 25, 32], random);
      const breuken = [0.25, 0.5, 0.75, 0.2, 0.4, 0.6, 0.8].filter(deel => Number.isInteger(perKeer * deel));
      // Eén op de vier komt precies uit: dan hoeft er níéts bij.
      const breuk = index % 4 === 3 || breuken.length === 0 ? 0 : kiesUit(breuken, random);
      const heel = heelGetal(level === 3 ? 4 : 8, level === 3 ? 12 : 30, random);
      const totaal = heel * perKeer + perKeer * breuk;
      const keer = heel + (breuk > 0 ? 1 : 0);
      return maakSom({
        typeId: 'ritten', id: `ritten:${level}:${index}:${totaal}:${perKeer}`,
        verhaal: soort.zin(totaal, perKeer),
        nodig: [String(totaal), String(perKeer)],
        zoek: `het aantal ${soort.keer}`,
        aanpak: ritten.aanpak,
        controle: breuk > 0
          ? `${totaal} ÷ ${perKeer} = ${getal(heel + breuk)}. Dat stukje erbij kan niet half, dus het worden er ${keer}.`
          : `${totaal} ÷ ${perKeer} = ${heel}, precies. Er blijft niets over, dus er komt geen keer bij.`,
        stappen: [
          {
            vraag: `Deel eerst. Hoeveel is ${totaal} ÷ ${perKeer}?`, som: `${totaal} ÷ ${perKeer}`,
            antwoord: heel + breuk, eenheid: '',
            tip: `Reken de deling gewoon uit, ook als er een komma in komt.`,
          },
          {
            vraag: `Hoeveel ${soort.keer} zijn het dan in totaal?`, som: '{1}', antwoord: keer,
            eenheid: soort.keer, verborgen: true, afronden: 'boven',
            tip: `Een halve keer bestaat niet. Blijft er een stukje over, dan is er nog een hele keer nodig; komt het precies uit, dan niet.`,
          },
        ],
      });
    }
    // Op niveau 1 en 2 deel je nog niet met kommagetallen: daar zoek je
    // hoeveel hele keren erin passen en wat er overblijft.
    const perKeer = kiesUit([5, 6, 8, 10], random);
    const heel = heelGetal(3, 9, random);
    const rest = index % 4 === 3 ? 0 : heelGetal(1, perKeer - 1, random);
    const totaal = heel * perKeer + rest;
    const keer = heel + (rest > 0 ? 1 : 0);
    return maakSom({
      typeId: 'ritten', id: `ritten:${level}:${index}:${totaal}:${perKeer}`,
      verhaal: soort.zin(totaal, perKeer),
      nodig: [String(totaal), String(perKeer)],
      zoek: `het aantal ${soort.keer}`,
      aanpak: ritten.aanpak,
      controle: rest > 0
        ? `${heel} hele keren van ${perKeer} is ${heel * perKeer}, plus ${rest} over: samen ${totaal}.`
        : `${heel} keren van ${perKeer} is precies ${totaal}. Er blijft niets over, dus er komt geen keer bij.`,
      stappen: [
        {
          vraag: `Hoeveel hele keren van ${perKeer} passen er in ${totaal}?`, som: `${totaal} ÷ ${perKeer}`,
          antwoord: heel, eenheid: 'hele keren', afronden: 'beneden',
          tip: `Zoek het grootste getal dat je met ${perKeer} kunt vermenigvuldigen zonder boven ${totaal} te komen.`,
        },
        { vraag: `Hoeveel ${soort.ding} gaan er in die hele keren mee?`, som: `{1} × ${perKeer}`, antwoord: heel * perKeer, eenheid: soort.ding, tip: `Zoveel hele keren van ${perKeer}: dat is keersommen.` },
        { vraag: `Hoeveel ${soort.ding} blijven er dan over?`, som: `${totaal} − {2}`, antwoord: rest, eenheid: soort.ding, tip: `Haal van de ${totaal} af wat al mee is.` },
        {
          vraag: `Hoeveel ${soort.keer} zijn het dan in totaal?`, som: `{1} + ${rest > 0 ? 1 : 0}`,
          antwoord: keer, eenheid: soort.keer, verborgen: true,
          tip: `Blijft er nog iets over, dan is er nog één keer nodig. Komt het precies uit, dan niet.`,
        },
      ],
    });
  },
};
