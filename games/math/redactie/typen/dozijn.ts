import { bedrag, euro, heelGetal, maakSom, rond, type Sometype } from '../types';

/** Een dozijn is 12, een gros is 12 dozijn: 144. Dat getal staat nooit in het verhaal. */
const SPUL = [
  { wat: 'eieren', wie: 'De bakker koopt', doet: 'Hij gebruikt er', voor: 'voor taarten' },
  { wat: 'potloden', wie: 'De school bestelt', doet: 'De juf deelt er', voor: 'uit aan de klas' },
  { wat: 'knopen', wie: 'Oma koopt', doet: 'Ze naait er', voor: 'aan jassen' },
];

export const dozijn: Sometype = {
  id: 'dozijn',
  naam: 'Dozijnsom',
  aanpak: 'Een dozijn is 12.',
  valkuil: 'Met het aantal dozijnen rekenen alsof het stuks zijn.',
  niveaus: [1, 2, 3, 4, 5],
  maak(level, index, random) {
    if (level >= 3 && index % 3 === 2) {
      // Zoals op het werkblad: 'Een dozijn gummetjes kost € 2,60. Hoeveel kost 1 gros?'
      const prijs = rond(heelGetal(8, 40, random) * 10 / 100);
      return maakSom({
        typeId: 'dozijn', id: `dozijn:gros:${level}:${index}:${prijs}`,
        verhaal: `Een dozijn gummetjes kost ${euro(prijs)}. Hoeveel kost 1 gros gummetjes?`,
        nodig: [bedrag(prijs), '1'],
        zoek: 'de prijs van een gros',
        aanpak: dozijn.aanpak,
        stappen: [
          { vraag: 'Hoeveel dozijn zit er in een gros?', som: '144 ÷ 12', antwoord: 12, eenheid: 'dozijn', tip: 'Een gros is 144 stuks, een dozijn is 12.' },
          { vraag: 'Wat kost een gros dan?', som: `{1} × ${bedrag(prijs)}`, antwoord: rond(prijs * 12), eenheid: 'euro', soort: 'euro', tip: `Je betaalt ${euro(prijs)} voor elk dozijn.` },
        ],
        controle: `12 dozijn × ${euro(prijs)} = ${euro(prijs * 12)}, en 12 dozijn is 144 stuks.`,
      });
    }
    const spul = SPUL[index % SPUL.length];
    const gros = level >= 4 && index % 2 === 1;
    const per = gros ? 144 : 12;
    const n = heelGetal(2, gros ? 4 : level <= 2 ? 5 : 9, random);
    const stuks = n * per;
    const weg = heelGetal(Math.ceil(stuks / 5), Math.floor(stuks * 0.8), random);
    const woord = gros ? 'gros' : 'dozijn';
    return maakSom({
      typeId: 'dozijn', id: `dozijn:${level}:${index}:${n}:${woord}:${weg}`,
      verhaal: `${spul.wie} ${n} ${woord} ${spul.wat}. ${spul.doet} ${weg} ${spul.voor}. Hoeveel ${spul.wat} zijn er nog over?`,
      nodig: [String(n), String(weg)],
      zoek: `het aantal ${spul.wat} dat over is`,
      aanpak: dozijn.aanpak,
      stappen: [
        { vraag: `Hoeveel ${spul.wat} zijn ${n} ${woord}?`, som: `${n} × ${per}`, antwoord: stuks, eenheid: spul.wat, tip: gros ? 'Een gros is 12 dozijn: 144 stuks.' : 'Een dozijn is 12 stuks.' },
        { vraag: 'Hoeveel blijven er over?', som: `{1} − ${weg}`, antwoord: stuks - weg, eenheid: spul.wat, tip: 'Wat al gebruikt is gaat eraf.' },
      ],
      controle: `${stuks - weg} over + ${weg} gebruikt = ${stuks} ${spul.wat}, en dat is ${n} ${woord}.`,
    });
  },
};
