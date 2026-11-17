import { heelGetal, kiesUit, maakSom, type Sometype } from '../types';

/** Snelheid is afstand per uur. Een uur heeft 60 minuten; daar zit de hele som. */
export const snelheid: Sometype = {
  id: 'snelheid',
  naam: 'Snelheidsom',
  aanpak: 'Km per uur: zo ver kom je in 60 minuten.',
  valkuil: 'Minuten en uren door elkaar halen: 20 minuten is geen 20 uur, maar een derde uur.',
  niveaus: [3, 4, 5],
  maak(level, index, random) {
    if (index % 2 === 0) {
      const v = kiesUit(level <= 3 ? [5, 10, 12, 15, 20] : [4, 5, 6, 10, 12, 15, 20, 30], random);
      const afstand = heelGetal(2, level <= 3 ? 5 : 9, random);
      const perKm = 60 / v;
      const wie = kiesUit(['Fenna', 'Bas', 'Yara'], random);
      return maakSom({
        typeId: 'snelheid', id: `snelheid:fiets:${level}:${index}:${v}:${afstand}`,
        verhaal: `${wie} fietst in precies een uur ${v} km. Het zwembad is ${afstand} km verderop. Hoeveel minuten fietst ${wie} naar het zwembad?`,
        nodig: [String(v), String(afstand)],
        zoek: 'de fietstijd in minuten',
        aanpak: snelheid.aanpak,
        stappen: [
          { vraag: 'Hoeveel minuten doe je over één kilometer?', som: `60 ÷ ${v}`, antwoord: perKm, eenheid: 'minuten', tip: `In 60 minuten fiets je ${v} km.` },
          { vraag: `En over ${afstand} km?`, som: `{1} × ${afstand}`, antwoord: perKm * afstand, eenheid: 'minuten', tip: 'Elke kilometer kost evenveel minuten.' },
        ],
        controle: `In ${perKm * afstand} minuten kom je ${afstand} km ver; in 60 minuten dan ${v} km.`,
      });
    }
    const min = kiesUit([15, 20, 30], random);
    const v = kiesUit([60, 72, 84, 96, 120], random);
    const keer = 60 / min;
    return maakSom({
      typeId: 'snelheid', id: `snelheid:auto:${level}:${index}:${v}:${min}`,
      verhaal: `Een auto rijdt ${v} km per uur. Hoeveel kilometer rijdt hij in ${min} minuten?`,
      nodig: [String(v), String(min)],
      zoek: 'de afstand in kilometer',
      aanpak: snelheid.aanpak,
      stappen: [
        { vraag: `Hoe vaak past ${min} minuten in een uur?`, som: `60 ÷ ${min}`, antwoord: keer, eenheid: 'keer', tip: 'Een uur heeft 60 minuten.' },
        { vraag: `Hoe ver rijdt hij dan in ${min} minuten?`, som: `${v} ÷ {1}`, antwoord: v / keer, eenheid: 'km', tip: `In een heel uur rijdt hij ${v} km. Verdeel dat in zoveel stukken.` },
      ],
      controle: `${v / keer} km × ${keer} = ${v} km in een heel uur.`,
    });
  },
};
