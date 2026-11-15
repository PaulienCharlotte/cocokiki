import { bedrag, euro, heelGetal, maakSom, rond, type Sometype } from '../types';

/** Eerst wat het samen kost, dan wat je terugkrijgt van je briefje. */
const WINKEL = [
  { wie: 'Sem', wat: 'stripboeken', een: 'stripboek' },
  { wie: 'Lotte', wat: 'pakjes kaarten', een: 'pakje kaarten' },
  { wie: 'Ayoub', wat: 'broodjes', een: 'broodje' },
];

export const wisselgeld: Sometype = {
  id: 'wisselgeld',
  naam: 'Wisselgeldsom',
  aanpak: 'Reken eerst uit wat alles samen kost. Trek dat daarna af van het geld waarmee je betaalt.',
  valkuil: 'De prijs van één stuk van het briefje aftrekken en vergeten dat je er meer koopt.',
  niveaus: [1, 2, 3, 4],
  maak(level, index, random) {
    const w = WINKEL[index % WINKEL.length];
    const n = heelGetal(2, level <= 2 ? 4 : 6, random);
    const prijs = rond(level <= 1 ? heelGetal(1, 4, random) : heelGetal(4, 40, random) * 25 / 100);
    const totaal = rond(n * prijs);
    const briefje = [5, 10, 20, 50, 100].find(b => b > totaal) ?? 100;
    return maakSom({
      typeId: 'wisselgeld', id: `wisselgeld:${level}:${index}:${n}:${prijs}`,
      verhaal: `${w.wie} koopt ${n} ${w.wat} van ${euro(prijs)} per stuk. Hij betaalt met een briefje van € ${briefje}. Hoeveel geld krijgt hij terug?`,
      nodig: [String(n), bedrag(prijs), String(briefje)],
      zoek: 'het wisselgeld',
      aanpak: wisselgeld.aanpak,
      stappen: [
        { vraag: `Wat kosten ${n} ${w.wat} samen?`, som: `${n} × ${bedrag(prijs)}`, antwoord: totaal, eenheid: 'euro', soort: 'euro', tip: `Eén ${w.een} kost ${euro(prijs)}. Hij koopt er ${n}.` },
        { vraag: 'Hoeveel krijgt hij terug?', som: `${briefje} − {1}`, antwoord: rond(briefje - totaal), eenheid: 'euro', soort: 'euro', tip: 'Wat hij betaalt min wat het kost, is wat hij terugkrijgt.' },
      ],
      controle: `${euro(totaal)} + ${euro(briefje - totaal)} terug = € ${briefje}, zijn briefje.`,
    });
  },
};
