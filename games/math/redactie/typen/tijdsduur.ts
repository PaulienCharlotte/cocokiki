import { heelGetal, kiesUit, maakSom, type Sometype } from '../types';

/**
 * Hoe lang duurt het van de ene tijd tot de andere?
 *
 * Niet aftrekken, want een uur heeft geen honderd minuten. Je springt eerst
 * naar het hele uur, dan de hele uren door, en dan het laatste stukje.
 */
const klok = (uur: number, minuut: number) => `${uur}.${String(minuut).padStart(2, '0')}`;

const SOORTEN = [
  { zin: (a: string, b: string) => `De trein vertrekt om ${a} uur uit Utrecht. Om ${b} uur komt hij in Den Haag aan.`, vraag: 'Hoeveel minuten duurt de reis?', zoek: 'de reistijd in minuten' },
  { zin: (a: string, b: string) => `Greg staat 's morgens om ${a} uur op. Hij heeft een afspraak bij de tandarts om ${b} uur.`, vraag: 'Hoeveel minuten heeft hij nog?', zoek: 'de tijd tot de afspraak, in minuten' },
  { zin: (a: string, b: string) => `De film begint om ${a} uur en is om ${b} uur afgelopen.`, vraag: 'Hoeveel minuten duurt de film?', zoek: 'de duur van de film in minuten' },
];

export const tijdsduur: Sometype = {
  id: 'tijdsduur',
  naam: 'Tijdsom',
  aanpak: 'Spring eerst naar het hele uur, dan de hele uren door, en tel aan het eind het laatste stukje erbij. Nooit gewoon aftrekken: een uur heeft 60 minuten, geen 100.',
  valkuil: 'De tijden als gewone getallen aftrekken. 14.28 − 13.46 is geen 82.',
  niveaus: [2, 3, 4, 5],
  maak(level, index, random) {
    const soort = kiesUit(SOORTEN, random);
    const startUur = heelGetal(8, 19, random);
    const startMinuut = heelGetal(5, 55, random);
    const urenErtussen = level >= 4 ? heelGetal(1, 3, random) : 0;
    const eindMinuut = heelGetal(1, 59, random);
    const eindUur = startUur + urenErtussen + 1;
    const naarHeelUur = 60 - startMinuut;
    const totaal = naarHeelUur + urenErtussen * 60 + eindMinuut;
    const start = klok(startUur, startMinuut), eind = klok(eindUur, eindMinuut);
    const stappen = [
      { vraag: `Hoeveel minuten zijn het van ${start} tot ${klok(startUur + 1, 0)}?`, som: `60 − ${startMinuut}`, antwoord: naarHeelUur, eenheid: 'minuten', tip: 'Spring eerst naar het hele uur. Een uur heeft 60 minuten.' },
    ];
    if (urenErtussen) stappen.push({
      vraag: `Hoeveel minuten zijn het van ${klok(startUur + 1, 0)} tot ${klok(eindUur, 0)}?`,
      som: `${urenErtussen} × 60`, antwoord: urenErtussen * 60, eenheid: 'minuten', tip: `Dat zijn ${urenErtussen} hele uren van 60 minuten.`,
    });
    stappen.push({
      vraag: `Tel de sprongen op, plus de laatste ${eindMinuut} minuten tot ${eind}. Hoeveel is dat samen?`,
      som: [...stappen.map((_stap, i) => `{${i + 1}}`), String(eindMinuut)].join(' + '),
      antwoord: totaal, eenheid: 'minuten', tip: 'Alle sprongen samen zijn de hele tijd.',
    });
    return maakSom({
      typeId: 'tijdsduur', id: `tijdsduur:${level}:${index}:${start}:${eind}`,
      verhaal: `${soort.zin(start, eind)} ${soort.vraag}`,
      nodig: [start, eind],
      zoek: soort.zoek,
      aanpak: tijdsduur.aanpak,
      stappen,
      controle: `Van ${start} stap je ${naarHeelUur} minuten naar het hele uur${urenErtussen ? `, dan ${urenErtussen} uur verder` : ''}, en dan nog ${eindMinuut} minuten tot ${eind}.`,
    });
  },
};
