import { getal, heelGetal, kiesUit, maakSom, type Sometype } from '../types';

/** 1 cm op de kaart is zoveel cm in het echt. Eerst in cm, dan pas naar km. */
const SCHALEN = [25_000, 50_000, 100_000, 200_000, 1_000_000, 4_000_000];
const ROUTES = ['van Amsterdam naar Utrecht', 'van de camping naar het strand', 'van het dorp naar het meer'];

export const schaal: Sometype = {
  id: 'schaal',
  naam: 'Schaalsom',
  aanpak: 'Kaart-cm keer de schaal. 100.000 cm is 1 km.',
  valkuil: 'Vergeten om te rekenen. 300.000 cm is geen 300.000 km, maar 3 km.',
  niveaus: [4, 5],
  maak(level, index, random) {
    const s = kiesUit(level <= 4 ? SCHALEN.slice(0, 4) : SCHALEN, random);
    const cm = heelGetal(2, 15, random);
    const echt = cm * s;
    const km = echt / 100_000;
    const schaalTekst = s.toLocaleString('nl-NL');
    const route = ROUTES[index % ROUTES.length];
    return maakSom({
      typeId: 'schaal', id: `schaal:${level}:${index}:${cm}:${s}`,
      verhaal: `Op de kaart is de weg ${route} ${cm} cm. De schaal van de kaart is 1 : ${schaalTekst}. Hoeveel km is die weg in het echt?`,
      nodig: [String(cm), schaalTekst],
      zoek: 'de echte afstand in km',
      aanpak: schaal.aanpak,
      stappen: [
        { vraag: 'Hoeveel centimeter is dat in het echt?', som: `${cm} × ${s}`, antwoord: echt, eenheid: 'cm', tip: `Elke centimeter op de kaart is ${schaalTekst} cm in het echt.` },
        { vraag: 'Hoeveel kilometer is dat?', som: '{1} ÷ 100000', antwoord: km, eenheid: 'km', tip: '1 km is 1000 m, en 1 m is 100 cm: samen 100.000 cm.' },
      ],
      controle: `${cm} cm × ${schaalTekst} = ${echt.toLocaleString('nl-NL')} cm = ${getal(km)} km.`,
    });
  },
};
