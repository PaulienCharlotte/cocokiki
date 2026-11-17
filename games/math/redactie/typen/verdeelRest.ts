import { heelGetal, maakSom, type Sometype } from '../types';

/** Eerlijk delen gaat zelden precies op. Wat over is, is de vraag. */
const VERHALEN = [
  { wat: 'stickers', zin: (t: number, k: number) => `De juf heeft ${t} stickers. Ze verdeelt ze eerlijk over ${k} kinderen. Iedereen krijgt evenveel. Hoeveel stickers houdt ze over?` },
  { wat: 'knikkers', zin: (t: number, k: number) => `Opa heeft ${t} knikkers. Hij verdeelt ze eerlijk over ${k} kleinkinderen. Hoeveel knikkers blijven er over?` },
  { wat: 'aardbeien', zin: (t: number, k: number) => `In een bakje zitten ${t} aardbeien. Ze worden eerlijk verdeeld over ${k} bordjes. Hoeveel aardbeien blijven er over?` },
];

export const verdeelRest: Sometype = {
  id: 'verdeelRest',
  naam: 'Verdeelsom met rest',
  aanpak: 'Hoeveel krijgt ieder? Wat overblijft is de rest.',
  valkuil: 'Het antwoord van de deling geven. De vraag is niet wat ieder krijgt, maar wat er overblijft.',
  niveaus: [2, 3, 4],
  maak(level, index, random) {
    const v = VERHALEN[index % VERHALEN.length];
    const k = heelGetal(3, level <= 2 ? 6 : 9, random);
    const ieder = heelGetal(3, level <= 2 ? 8 : 15, random);
    const rest = heelGetal(1, k - 1, random);
    const t = k * ieder + rest;
    return maakSom({
      typeId: 'verdeelRest', id: `verdeelRest:${level}:${index}:${t}:${k}`,
      verhaal: v.zin(t, k),
      nodig: [String(t), String(k)],
      zoek: `het aantal ${v.wat} dat overblijft`,
      aanpak: verdeelRest.aanpak,
      stappen: [
        { vraag: `Hoeveel hele ${v.wat} krijgt ieder?`, som: `${t} ÷ ${k}`, antwoord: ieder, eenheid: v.wat, afronden: 'beneden', tip: `Hoe vaak past ${k} in ${t}? Alleen hele keren.` },
        { vraag: 'Hoeveel zijn er dan uitgedeeld?', som: `{1} × ${k}`, antwoord: ieder * k, eenheid: v.wat, tip: `Iedereen kreeg evenveel, en het zijn er ${k}.` },
        { vraag: 'Hoeveel blijven er over?', som: `${t} − {2}`, antwoord: rest, eenheid: v.wat, tip: 'Wat er was, min wat er is uitgedeeld.' },
      ],
      controle: `${k} × ${ieder} = ${ieder * k}, plus ${rest} over is ${t}.`,
    });
  },
};
