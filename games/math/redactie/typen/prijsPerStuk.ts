import { bedrag, euro, heelGetal, maakSom, rond, type Sometype } from '../types';

/** Eerst terug naar één stuk; daarna weet je elk ander aantal. */
const WAREN = [
  { wat: 'pakken sap', een: 'pak sap', wie: 'Mees koopt' },
  { wat: 'schriften', een: 'schrift', wie: 'Juf koopt' },
  { wat: 'ijsjes', een: 'ijsje', wie: 'Opa koopt' },
];

export const prijsPerStuk: Sometype = {
  id: 'prijsPerStuk',
  naam: 'Prijs per stuk',
  aanpak: 'Reken eerst uit wat één kost.',
  valkuil: 'De prijs uit het verhaal meteen keer het nieuwe aantal doen. Die prijs hoort bij meer dan één stuk.',
  niveaus: [2, 3, 4, 5],
  maak(level, index, random) {
    const waar = WAREN[index % WAREN.length];
    const stukprijs = rond((level <= 2 ? heelGetal(2, 6, random) * 50 : heelGetal(11, 60, random) * 5) / 100);
    const aantal = heelGetal(3, level <= 2 ? 5 : 8, random);
    let nieuw = heelGetal(2, level <= 2 ? 6 : 12, random);
    if (nieuw === aantal) nieuw += 1;
    const totaal = rond(stukprijs * aantal);
    const antwoord = rond(stukprijs * nieuw);
    return maakSom({
      typeId: 'prijsPerStuk', id: `prijsPerStuk:${level}:${index}:${aantal}:${totaal}:${nieuw}`,
      verhaal: `${waar.wie} ${aantal} ${waar.wat} voor samen ${euro(totaal)}. Hoeveel kosten ${nieuw} ${waar.wat}?`,
      nodig: [String(aantal), bedrag(totaal), String(nieuw)],
      zoek: `de prijs van ${nieuw} ${waar.wat}`,
      aanpak: prijsPerStuk.aanpak,
      stappen: [
        { vraag: `Wat kost één ${waar.een}?`, som: `${bedrag(totaal)} ÷ ${aantal}`, antwoord: stukprijs, eenheid: 'euro', soort: 'euro', tip: `Verdeel ${euro(totaal)} over ${aantal} stuks.` },
        { vraag: `En wat kosten er ${nieuw}?`, som: `{1} × ${nieuw}`, antwoord, eenheid: 'euro', soort: 'euro', tip: 'Je weet nu wat één kost. Doe dat zo vaak als je er koopt.' },
      ],
      controle: `${euro(stukprijs)} × ${aantal} = ${euro(totaal)}, precies de prijs uit het verhaal.`,
    });
  },
};
