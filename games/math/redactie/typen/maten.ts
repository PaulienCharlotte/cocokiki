import { getal, heelGetal, kiesUit, maakSom, type Sometype } from '../types';

/** Twee maten in één verhaal: eerst gelijk maken, dan pas rekenen. */
export const maten: Sometype = {
  id: 'maten',
  naam: 'Matensom',
  aanpak: 'Maak de maten eerst gelijk.',
  valkuil: 'Meters en centimeters gewoon op elkaar delen. 5 m ÷ 25 cm is geen 0,2.',
  niveaus: [2, 3, 4, 5],
  maak(level, index, random) {
    const vorm = index % 3;
    if (vorm === 0) {
      const m = heelGetal(2, 9, random);
      const stuk = kiesUit([20, 25, 50], random);
      return maakSom({
        typeId: 'maten', id: `maten:lint:${level}:${index}:${m}:${stuk}`,
        verhaal: `Een rol lint is ${m} m lang. De juf knipt er stukken van ${stuk} cm van. Hoeveel stukken krijgt ze?`,
        nodig: [String(m), String(stuk)],
        zoek: 'het aantal stukken lint',
        aanpak: maten.aanpak,
        stappen: [
          { vraag: `Hoeveel centimeter is ${m} m?`, som: `${m} × 100`, antwoord: m * 100, eenheid: 'cm', tip: '1 meter is 100 centimeter.' },
          { vraag: `Hoeveel stukken van ${stuk} cm passen daarin?`, som: `{1} ÷ ${stuk}`, antwoord: m * 100 / stuk, eenheid: 'stukken', tip: `Deel de lengte in centimeters door ${stuk}.` },
        ],
        controle: `${m * 100 / stuk} stukken × ${stuk} cm = ${m * 100} cm = ${m} m.`,
      });
    }
    const liter = vorm === 1;
    const groot = kiesUit(liter ? [1, 1.5, 2, 2.5, 3] : [2, 3, 5, 10], random);
    const klein = liter ? 250 : kiesUit([250, 500], random);
    const totaal = groot * 1000;
    const aantal = totaal / klein;
    return maakSom({
      typeId: 'maten', id: `maten:${liter ? 'fles' : 'zak'}:${level}:${index}:${groot}:${klein}`,
      verhaal: liter
        ? `In een fles zit ${getal(groot)} liter limonade. Je schenkt glazen van ${klein} ml. Hoeveel glazen kun je vullen?`
        : `Een zak aardappelen weegt ${groot} kg. Papa kookt elke dag ${klein} gram. Hoeveel dagen doet hij met de zak?`,
      nodig: [getal(groot), String(klein)],
      zoek: liter ? 'het aantal glazen' : 'het aantal dagen',
      aanpak: maten.aanpak,
      stappen: [
        { vraag: liter ? `Hoeveel milliliter is ${getal(groot)} liter?` : `Hoeveel gram is ${groot} kg?`, som: `${getal(groot)} × 1000`, antwoord: totaal, eenheid: liter ? 'ml' : 'gram', tip: liter ? '1 liter is 1000 milliliter.' : '1 kilogram is 1000 gram.' },
        { vraag: liter ? `Hoeveel glazen van ${klein} ml zijn dat?` : `Hoeveel dagen van ${klein} gram zijn dat?`, som: `{1} ÷ ${klein}`, antwoord: aantal, eenheid: liter ? 'glazen' : 'dagen', tip: `Deel door ${klein}.` },
      ],
      controle: `${aantal} × ${klein} = ${totaal} ${liter ? 'ml' : 'gram'}, en dat is ${getal(groot)} ${liter ? 'liter' : 'kg'}.`,
    });
  },
};
