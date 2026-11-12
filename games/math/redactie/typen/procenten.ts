import { euro, heelGetal, kiesUit, maakSom, type Sometype } from '../types';

/**
 * Procenten, maar dan als deel van honderd dat je kunt uitrekenen.
 *
 * 10% is een tiende: deel door 10. Daar zijn 25% (een kwart), 20% (een
 * vijfde) en 5% (de helft van 10%) van afgeleid. Eerst het deel uitrekenen,
 * daarna pas kijken wat de vraag er precies mee wil.
 */
const DELERS: Record<number, { deler: number; woord: string }> = {
  10: { deler: 10, woord: 'een tiende' },
  20: { deler: 5, woord: 'een vijfde' },
  25: { deler: 4, woord: 'een kwart' },
  50: { deler: 2, woord: 'de helft' },
};

export const procenten: Sometype = {
  id: 'procenten',
  naam: 'Procentsom',
  aanpak: 'Reken eerst het deel uit: 10% is een tiende, dus delen door 10. Kijk daarna pas of de vraag dat deel wil, of juist wat er overblijft.',
  valkuil: 'Stoppen bij het deel. De vraag is vaak hoeveel er ná de korting overblijft.',
  niveaus: [3, 4, 5],
  maak(level, index, random) {
    const percentage = level === 3 ? 10 : kiesUit([10, 20, 25, 50], random);
    const { deler, woord } = DELERS[percentage];
    const vorm = index % 3;
    if (vorm === 0) {
      const prijs = deler * heelGetal(6, 30, random) * 2;
      const korting = prijs / deler;
      return maakSom({
        typeId: 'procenten', id: `procenten:korting:${level}:${index}:${prijs}:${percentage}`,
        verhaal: `Een mountainbike kost ${euro(prijs)}. In de uitverkoop krijg je ${percentage}% korting. Hoeveel kost de fiets nu?`,
        nodig: [String(prijs), String(percentage)],
        zoek: 'de nieuwe prijs van de fiets',
        aanpak: procenten.aanpak,
        stappen: [
          { vraag: `Hoeveel is ${percentage}% van ${euro(prijs)}?`, som: `${prijs} ÷ ${deler}`, antwoord: korting, eenheid: 'euro', soort: 'euro', tip: `${percentage}% is ${woord}, dus deel door ${deler}.` },
          { vraag: 'Dat gaat eraf. Wat betaal je dan nog?', som: `${prijs} − {1}`, antwoord: prijs - korting, eenheid: 'euro', soort: 'euro', tip: 'Korting is wat je minder betaalt, dus trek het van de prijs af.' },
        ],
        controle: `${euro(prijs - korting)} + ${euro(korting)} korting = ${euro(prijs)}, de oude prijs.`,
      });
    }
    if (vorm === 1) {
      const totaal = deler * heelGetal(8, 40, random);
      const deel = totaal / deler;
      return maakSom({
        typeId: 'procenten', id: `procenten:ziek:${level}:${index}:${totaal}:${percentage}`,
        verhaal: `Een school telt ${totaal} leerlingen. Op een dag is ${percentage}% van de leerlingen ziek. Hoeveel kinderen zijn er die dag op school?`,
        nodig: [String(totaal), String(percentage)],
        zoek: 'het aantal kinderen dat er wél is',
        aanpak: procenten.aanpak,
        stappen: [
          { vraag: `Hoeveel kinderen zijn er ziek?`, som: `${totaal} ÷ ${deler}`, antwoord: deel, eenheid: 'kinderen', tip: `${percentage}% is ${woord}, dus deel door ${deler}.` },
          { vraag: 'De vraag is hoeveel er op school zijn. Hoeveel zijn dat er?', som: `${totaal} − {1}`, antwoord: totaal - deel, eenheid: 'kinderen', tip: 'De zieke kinderen zijn er niet, dus die gaan eraf.' },
        ],
        controle: `${totaal - deel} op school + ${deel} ziek = ${totaal} leerlingen.`,
      });
    }
    const totaal = deler * heelGetal(6, 30, random);
    const deel = totaal / deler;
    return maakSom({
      typeId: 'procenten', id: `procenten:post:${level}:${index}:${totaal}:${percentage}`,
      verhaal: `Een postbode moet ${totaal} brieven bestellen. Hij heeft er al ${percentage}% van besteld. Hoeveel moet hij er nog bestellen?`,
      nodig: [String(totaal), String(percentage)],
      zoek: 'het aantal brieven dat nog moet',
      aanpak: procenten.aanpak,
      stappen: [
        { vraag: `Hoeveel brieven heeft hij al gedaan?`, som: `${totaal} ÷ ${deler}`, antwoord: deel, eenheid: 'brieven', tip: `${percentage}% is ${woord}, dus deel door ${deler}.` },
        { vraag: 'Hoeveel blijven er dan nog over?', som: `${totaal} − {1}`, antwoord: totaal - deel, eenheid: 'brieven', tip: 'Wat al gedaan is gaat van het totaal af.' },
      ],
      controle: `${deel} gedaan + ${totaal - deel} te gaan = ${totaal} brieven.`,
    });
  },
};
