import { heelGetal, maakSom, type Sometype } from '../types';

/** Om de rand heen is omtrek; de vloer zelf is oppervlakte. Eerst kiezen welke. */
export const omtrekOppervlakte: Sometype = {
  id: 'omtrekOppervlakte',
  naam: 'Omtrek of oppervlakte',
  aanpak: 'Kijk eerst of het om de rand gaat (omtrek: alle kanten optellen) of om de vloer (oppervlakte: lengte keer breedte).',
  valkuil: 'Omtrek en oppervlakte verwisselen. Een hek gaat om de rand, tegels liggen op de vloer.',
  niveaus: [3, 4, 5],
  maak(level, index, random) {
    const l = heelGetal(4, level <= 3 ? 12 : 25, random);
    let b = heelGetal(3, l - 1, random);
    if (b === l) b -= 1;
    if (index % 2 === 0) {
      return maakSom({
        typeId: 'omtrekOppervlakte', id: `omtrek:${level}:${index}:${l}:${b}`,
        verhaal: `Een tuin is ${l} m lang en ${b} m breed. Er komt een hek helemaal omheen. Hoeveel meter hek is er nodig?`,
        nodig: [String(l), String(b)],
        zoek: 'de lengte van het hek',
        aanpak: omtrekOppervlakte.aanpak,
        stappen: [
          { vraag: 'Hoe lang zijn één lange en één korte kant samen?', som: `${l} + ${b}`, antwoord: l + b, eenheid: 'm', tip: 'Een hek gaat om de rand: dat is de omtrek.' },
          { vraag: 'Hoe lang is het hek helemaal rond?', som: '{1} × 2', antwoord: (l + b) * 2, eenheid: 'm', tip: 'Een rechthoek heeft twee lange en twee korte kanten.' },
        ],
        controle: `${l} + ${b} + ${l} + ${b} = ${(l + b) * 2} m, alle vier de kanten.`,
      });
    }
    const prijs = heelGetal(level <= 3 ? 5 : 12, level <= 3 ? 12 : 35, random);
    const opp = l * b;
    return maakSom({
      typeId: 'omtrekOppervlakte', id: `oppervlakte:${level}:${index}:${l}:${b}:${prijs}`,
      verhaal: `Een kamer is ${l} m lang en ${b} m breed. Nieuwe vloerbedekking kost € ${prijs} per m². Wat kost de vloer voor de hele kamer?`,
      nodig: [String(l), String(b), String(prijs)],
      zoek: 'de prijs van de hele vloer',
      aanpak: omtrekOppervlakte.aanpak,
      stappen: [
        { vraag: 'Hoeveel m² is de vloer?', som: `${l} × ${b}`, antwoord: opp, eenheid: 'm²', tip: 'De vloer is oppervlakte: lengte keer breedte.' },
        { vraag: `Elke m² kost € ${prijs}. Wat kost alles?`, som: `{1} × ${prijs}`, antwoord: opp * prijs, eenheid: 'euro', soort: 'euro', tip: 'Betaal voor elke vierkante meter.' },
      ],
      controle: `${l} × ${b} = ${opp} m², en ${opp} × € ${prijs} = € ${opp * prijs}.`,
    });
  },
};
