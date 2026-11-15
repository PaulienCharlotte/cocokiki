import { heelGetal, maakSom, type Sometype } from '../types';

/** Samen zoveel, de een zoveel meer: eerst het verschil eraf, dan eerlijk delen. */
export const somVerschil: Sometype = {
  id: 'somVerschil',
  naam: 'Som-en-verschilsom',
  aanpak: 'Haal eerst het verschil van het totaal af: dan hebben ze evenveel. Deel dat door twee. Tel het verschil weer op voor de grootste.',
  valkuil: 'Het totaal meteen door twee delen. Dan krijgen ze evenveel, en dat is niet zo.',
  niveaus: [4, 5],
  maak(level, index, random) {
    const klein = heelGetal(6, level <= 4 ? 20 : 45, random);
    const verschil = heelGetal(2, level <= 4 ? 9 : 18, random);
    const samen = klein * 2 + verschil;
    if (index % 2 === 0) {
      return maakSom({
        typeId: 'somVerschil', id: `somVerschil:leeftijd:${level}:${index}:${samen}:${verschil}`,
        verhaal: `Tim en zijn broer zijn samen ${samen} jaar. Zijn broer is ${verschil} jaar ouder. Hoe oud is de broer?`,
        nodig: [String(samen), String(verschil)],
        zoek: 'de leeftijd van de broer',
        aanpak: somVerschil.aanpak,
        stappen: [
          { vraag: 'Haal het verschil eraf. Hoeveel jaar blijft er over?', som: `${samen} − ${verschil}`, antwoord: samen - verschil, eenheid: 'jaar', tip: 'Zonder het verschil zouden ze even oud zijn.' },
          { vraag: 'Hoe oud is Tim?', som: '{1} ÷ 2', antwoord: klein, eenheid: 'jaar', tip: 'Wat overblijft is voor allebei evenveel.' },
          { vraag: 'Hoe oud is zijn broer?', som: `{2} + ${verschil}`, antwoord: klein + verschil, eenheid: 'jaar', tip: `De broer is ${verschil} jaar ouder.` },
        ],
        controle: `${klein} + ${klein + verschil} = ${samen} jaar, en het verschil is ${verschil}.`,
      });
    }
    return maakSom({
      typeId: 'somVerschil', id: `somVerschil:sparen:${level}:${index}:${samen}:${verschil}`,
      verhaal: `Saar en Bo sparen samen € ${samen}. Saar heeft € ${verschil} meer dan Bo. Hoeveel euro heeft Bo?`,
      nodig: [String(samen), String(verschil)],
      zoek: 'het spaargeld van Bo',
      aanpak: somVerschil.aanpak,
      stappen: [
        { vraag: 'Haal het verschil eraf. Hoeveel blijft er over?', som: `${samen} − ${verschil}`, antwoord: samen - verschil, eenheid: 'euro', soort: 'euro', tip: 'Zonder het verschil hebben ze evenveel.' },
        { vraag: 'Hoeveel heeft Bo?', som: '{1} ÷ 2', antwoord: klein, eenheid: 'euro', soort: 'euro', tip: 'Wat overblijft verdelen ze eerlijk.' },
      ],
      controle: `Bo € ${klein}, Saar € ${klein + verschil}: samen € ${samen}.`,
    });
  },
};
