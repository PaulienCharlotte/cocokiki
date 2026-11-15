import { heelGetal, maakSom, type Sometype } from '../types';

/** Lengte × breedte × hoogte in cm³; 1000 cm³ is 1 liter. */
export const inhoud: Sometype = {
  id: 'inhoud',
  naam: 'Inhoudsom',
  aanpak: 'Reken eerst de bodem uit (lengte keer breedte), dan keer de hoogte. 1000 cm³ is 1 liter.',
  valkuil: 'Stoppen bij cm³. De vraag is vaak hoeveel liter het is.',
  niveaus: [4, 5],
  maak(level, index, random) {
    let l = heelGetal(4, 10, random) * 10, b = heelGetal(2, 5, random) * 10, h = heelGetal(2, 5, random) * 10;
    if ([1, 10, 100].includes(l * b * h / 1000)) h += 10;
    const bodem = l * b, cm3 = bodem * h, liter = cm3 / 1000;
    const wat = ['Een aquarium', 'Een bak voor de zandtafel', 'Een plantenbak'][index % 3];
    return maakSom({
      typeId: 'inhoud', id: `inhoud:${level}:${index}:${l}:${b}:${h}`,
      verhaal: `${wat} is ${l} cm lang, ${b} cm breed en ${h} cm hoog. Hoeveel liter past erin?`,
      nodig: [String(l), String(b), String(h)],
      zoek: 'de inhoud in liters',
      aanpak: inhoud.aanpak,
      stappen: [
        { vraag: 'Hoe groot is de bodem?', som: `${l} × ${b}`, antwoord: bodem, eenheid: 'cm²', tip: 'De bodem is lengte keer breedte.' },
        { vraag: 'Hoeveel cm³ past er in de hele bak?', som: `{1} × ${h}`, antwoord: cm3, eenheid: 'cm³', tip: 'Stapel de bodem zo hoog als de bak.' },
        { vraag: 'Hoeveel liter is dat?', som: '{2} ÷ 1000', antwoord: liter, eenheid: 'liter', tip: '1 liter is 1000 cm³.' },
      ],
      controle: `${l} × ${b} × ${h} = ${cm3} cm³, en dat is ${liter} liter.`,
    });
  },
};
