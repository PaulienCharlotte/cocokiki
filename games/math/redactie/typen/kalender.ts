import { heelGetal, maakSom, type Sometype } from '../types';

/** Eerst naar het eind van de maand, dan verder tellen in de volgende. */
const MAANDEN = [
  { naam: 'januari', dagen: 31, volgende: 'februari' },
  { naam: 'maart', dagen: 31, volgende: 'april' },
  { naam: 'april', dagen: 30, volgende: 'mei' },
  { naam: 'juni', dagen: 30, volgende: 'juli' },
  { naam: 'september', dagen: 30, volgende: 'oktober' },
  { naam: 'november', dagen: 30, volgende: 'december' },
];
const DOEL = ['begint het schoolkamp', 'is Mira jarig', 'komt opa logeren'];

export const kalender: Sometype = {
  id: 'kalender',
  naam: 'Kalendersom',
  aanpak: 'Tel eerst tot het eind van de maand.',
  valkuil: 'Vergeten hoeveel dagen de maand heeft. April heeft er 30, maart 31.',
  niveaus: [3, 4, 5],
  maak(level, index, random) {
    if (index % 2 === 1) {
      // Zoals op het werkblad: 'Over precies 2 weken ben ik jarig.'
      const m = MAANDEN[(index + Math.floor(random() * MAANDEN.length)) % MAANDEN.length];
      const weken = heelGetal(2, 3, random);
      const d = heelGetal(m.dagen - weken * 7 + 1, m.dagen - 2, random);
      const tot = d + weken * 7;
      return maakSom({
        typeId: 'kalender', id: `kalender:weken:${level}:${index}:${m.naam}:${d}:${weken}`,
        verhaal: `Op ${d} ${m.naam} zegt Joost: 'Over precies ${weken} weken ben ik jarig.' Op welke datum is Joost jarig?`,
        nodig: [String(d), String(weken)],
        zoek: 'de datum van de verjaardag',
        aanpak: kalender.aanpak,
        stappen: [
          { vraag: `Hoeveel dagen zijn ${weken} weken?`, som: `${weken} × 7`, antwoord: weken * 7, eenheid: 'dagen', tip: 'Een week heeft 7 dagen.' },
          { vraag: `Welke dag is het dan, als je vanaf ${d} doorgaat?`, som: `${d} + {1}`, antwoord: tot, eenheid: '', tip: 'Tel gewoon door, ook voorbij het eind van de maand.' },
          { vraag: `${m.naam[0].toUpperCase()}${m.naam.slice(1)} heeft maar ${m.dagen} dagen. Welke dag in ${m.volgende} is het?`, som: `{2} − ${m.dagen}`, antwoord: tot - m.dagen, eenheid: m.volgende, tip: `Haal de ${m.dagen} dagen van ${m.naam} eraf.` },
        ],
        controle: `Van ${d} ${m.naam} tot ${tot - m.dagen} ${m.volgende} is ${weken * 7} dagen: ${weken} weken.`,
      });
    }
    const maand = MAANDEN[(index + Math.floor(random() * MAANDEN.length)) % MAANDEN.length];
    const dag = heelGetal(8, 26, random);
    const rest = maand.dagen - dag;
    const verder = heelGetal(2, 25, random);
    const over = rest + verder;
    const doel = DOEL[index % DOEL.length];
    return maakSom({
      typeId: 'kalender', id: `kalender:${level}:${index}:${maand.naam}:${dag}:${over}`,
      verhaal: `Het is vandaag ${dag} ${maand.naam}. Over ${over} dagen ${doel}. Op welke dag in ${maand.volgende} is dat?`,
      nodig: [String(dag), String(over)],
      zoek: `de datum in ${maand.volgende}`,
      aanpak: kalender.aanpak,
      stappen: [
        { vraag: `Hoeveel dagen heeft ${maand.naam} nog na vandaag?`, som: `${maand.dagen} − ${dag}`, antwoord: rest, eenheid: 'dagen', tip: `${maand.naam[0].toUpperCase()}${maand.naam.slice(1)} heeft ${maand.dagen} dagen.` },
        { vraag: `Hoeveel dagen tel je dan nog door in ${maand.volgende}?`, som: `${over} − {1}`, antwoord: verder, eenheid: maand.volgende, tip: `De dagen die over zijn, tel je vanaf 1 ${maand.volgende}.` },
      ],
      controle: `${rest} dagen tot het eind van ${maand.naam}, plus ${verder} dagen in ${maand.volgende}, is samen ${over} dagen.`,
    });
  },
};
