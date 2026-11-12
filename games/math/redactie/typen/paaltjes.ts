import { heelGetal, kiesUit, maakSom, type Sometype } from '../types';

/**
 * De paaltjessom: om de zoveel meter staat er iets, hoeveel zijn het er?
 *
 * Op een rechte lijn hoort er altijd één extra bij, want aan het begin staat
 * er ook een. Loopt de lijn rond, dan juist niet: de laatste staat naast de
 * eerste. Dat verschil is de hele som.
 */
const RECHT = [
  { wat: 'paaltjes', waar: 'Langs een pad van', zin: (l: number, d: number) => `Een pad is ${l} m lang. Om de ${d} m staat van het begin tot het eind een paaltje.`, vraag: 'Hoeveel paaltjes staan er in totaal?' },
  { wat: 'bomen', waar: 'Langs een laan van', zin: (l: number, d: number) => `Een laan is ${l} m lang. Van het begin tot het eind plant de boswachter om de ${d} m een boom.`, vraag: 'Hoeveel bomen heeft hij nodig?' },
  { wat: 'lampjes', waar: 'Langs een slinger van', zin: (l: number, d: number) => `Een slinger is ${l} m lang. Om de ${d} m hangt er van begin tot eind een lampje aan.`, vraag: 'Hoeveel lampjes hangen er?' },
];

export const paaltjes: Sometype = {
  id: 'paaltjes',
  naam: 'Paaltjessom',
  aanpak: 'Reken eerst uit hoeveel stukken er tussen passen. Tel er dan één bij, want aan het begin staat er ook een.',
  valkuil: 'De paal aan het begin vergeten. Zes stukken hebben zeven palen.',
  niveaus: [2, 3, 4, 5],
  maak(level, index, random) {
    const rond = level === 5 && index % 3 === 2;
    if (rond) {
      // Rondom telt de laatste niet mee: die staat naast de eerste.
      const zijde = kiesUit([40, 50, 60, 80], random);
      const stap = kiesUit([4, 5, 8, 10], random).valueOf();
      const omtrek = zijde * 4;
      const aantal = omtrek / stap;
      return maakSom({
        typeId: 'paaltjes', id: `paaltjes:rond:${level}:${index}:${zijde}:${stap}`,
        verhaal: `Om een vierkant gazon van ${zijde} bij ${zijde} m worden bomen geplant. De bomen staan steeds ${stap} m van elkaar, helemaal rondom.`,
        nodig: [String(zijde), String(stap)],
        zoek: 'het aantal bomen rondom het gazon',
        aanpak: 'Reken eerst de omtrek uit. Deel die door de afstand. Rondom hoort er géén boom extra bij.',
        stappen: [
          { vraag: 'Hoe lang is de rand van het gazon helemaal rond?', som: `${zijde} × 4`, antwoord: omtrek, eenheid: 'm', tip: 'Een vierkant heeft vier even lange kanten.' },
          { vraag: `Hoeveel stukken van ${stap} m passen daarin?`, som: `{1} ÷ ${stap}`, antwoord: aantal, eenheid: 'stukken', tip: `Deel de omtrek door ${stap}.` },
          { vraag: 'Hoeveel bomen zijn dat? Let op: de rand loopt rond.', som: '{2}', antwoord: aantal, eenheid: 'bomen', tip: 'De laatste boom staat naast de eerste, dus er komt er géén bij.' },
        ],
        controle: `${aantal} stukken × ${stap} m = ${omtrek} m, precies de hele rand rond.`,
      });
    }
    const vorm = kiesUit(RECHT, random);
    const stap = kiesUit(level <= 2 ? [5, 10] : [3, 4, 5, 25], random);
    const stukken = heelGetal(level <= 2 ? 4 : 6, level <= 2 ? 9 : 50, random);
    const lengte = stukken * stap;
    return maakSom({
      typeId: 'paaltjes', id: `paaltjes:${level}:${index}:${lengte}:${stap}`,
      verhaal: `${vorm.zin(lengte, stap)} ${vorm.vraag}`,
      nodig: [String(lengte), String(stap)],
      zoek: `het aantal ${vorm.wat}`,
      aanpak: paaltjes.aanpak,
      stappen: [
        { vraag: `Hoeveel stukken van ${stap} m passen in ${lengte} m?`, som: `${lengte} ÷ ${stap}`, antwoord: stukken, eenheid: 'stukken', tip: `Deel de lengte door ${stap}.` },
        { vraag: 'Aan het begin staat er ook een. Hoeveel zijn het er dan?', som: '{1} + 1', antwoord: stukken + 1, eenheid: vorm.wat, tip: 'Tussen 2 palen zit 1 stuk. Bij 6 stukken horen dus 7 palen.' },
      ],
      controle: `${stukken} stukken × ${stap} m = ${lengte} m, met aan beide uiteinden een ${vorm.wat.replace(/s$/, '')}.`,
    });
  },
};
