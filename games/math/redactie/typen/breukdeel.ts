import { heelGetal, kiesUit, maakSom, type Sometype } from '../types';

/** 3/4 van iets: eerst één deel (delen door 4), dan zoveel delen als je nodig hebt. */
export const breukdeel: Sometype = {
  id: 'breukdeel',
  naam: 'Breuksom',
  aanpak: 'Deel door het getal onder de streep. Neem zoveel delen als erboven staat.',
  valkuil: 'Alleen delen door het onderste getal en dan stoppen. 3/4 is drie van die delen, niet één.',
  niveaus: [2, 3, 4, 5],
  maak(level, index, random) {
    const noemer = kiesUit(level <= 3 ? [3, 4, 5] : [3, 4, 5, 6, 8], random);
    const teller = heelGetal(2, noemer - 1, random);
    const deel = heelGetal(level <= 2 ? 2 : 4, level <= 2 ? 8 : 15, random);
    const heel = deel * noemer;
    const breuk = `${teller}/${noemer}`;
    if (level >= 4 && index % 3 === 2) {
      // Omgekeerd: je weet het stuk en zoekt het geheel.
      return maakSom({
        typeId: 'breukdeel', id: `breukdeel:terug:${level}:${index}:${breuk}:${deel}`,
        verhaal: index % 2
          ? `De koektrommel is voor ${breuk} gevuld. De koekjes wegen samen ${deel * teller} gram. Hoeveel gram koekjes zitten erin als de trommel vol is?`
          : `Jip heeft ${breuk} van zijn puzzel af. Dat zijn ${deel * teller} stukjes. Uit hoeveel stukjes bestaat de hele puzzel?`,
        nodig: [String(teller), String(noemer), String(deel * teller)],
        zoek: index % 2 ? 'het gewicht van een volle trommel' : 'het aantal stukjes van de hele puzzel',
        aanpak: 'Reken uit hoeveel één deel is. Neem dan alle delen.',
        stappen: [
          { vraag: `${deel * teller} is ${teller} delen. Hoeveel is één deel?`, som: `${deel * teller} ÷ ${teller}`, antwoord: deel, eenheid: index % 2 ? 'gram' : 'stukjes', tip: `Verdeel het over ${teller} delen.` },
          { vraag: `Het geheel is ${noemer} delen. Hoeveel is dat?`, som: `{1} × ${noemer}`, antwoord: heel, eenheid: index % 2 ? 'gram' : 'stukjes', tip: `Het getal onder de streep zegt hoeveel delen er in het geheel gaan.` },
        ],
        controle: `${breuk} van ${heel} is ${heel} ÷ ${noemer} × ${teller} = ${deel * teller}.`,
      });
    }
    const verhalen = [
      { zin: `Groep 7 heeft ${heel} kinderen. ${breuk} van de kinderen komt op de fiets naar school. Hoeveel kinderen komen op de fiets?`, wat: 'kinderen', zoek: 'het aantal fietsers' },
      { zin: `In een zak zitten ${heel} snoepjes. Noor eet ${breuk} van de snoepjes op. Hoeveel snoepjes eet ze?`, wat: 'snoepjes', zoek: 'het aantal opgegeten snoepjes' },
      { zin: `Een boek heeft ${heel} bladzijden. Daan heeft ${breuk} van het boek gelezen. Hoeveel bladzijden heeft hij gelezen?`, wat: 'bladzijden', zoek: 'het aantal gelezen bladzijden' },
    ];
    const v = verhalen[index % verhalen.length];
    return maakSom({
      typeId: 'breukdeel', id: `breukdeel:${level}:${index}:${breuk}:${heel}`,
      verhaal: v.zin,
      nodig: [String(heel), String(teller), String(noemer)],
      zoek: v.zoek,
      aanpak: breukdeel.aanpak,
      stappen: [
        { vraag: `Hoeveel is 1/${noemer} van ${heel}?`, som: `${heel} ÷ ${noemer}`, antwoord: deel, eenheid: v.wat, tip: `Verdeel ${heel} in ${noemer} gelijke delen.` },
        { vraag: `Je hebt er ${teller} van nodig. Hoeveel is dat?`, som: `{1} × ${teller}`, antwoord: deel * teller, eenheid: v.wat, tip: `${breuk} is ${teller} van die delen.` },
      ],
      controle: `${heel} ÷ ${noemer} = ${deel}, en ${teller} van die delen is ${deel * teller}.`,
    });
  },
};
