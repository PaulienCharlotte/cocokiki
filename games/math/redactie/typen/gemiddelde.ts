import { heelGetal, kiesUit, maakSom, type Sometype } from '../types';

/** Alles bij elkaar, dan eerlijk verdelen over het aantal keer. */
export const gemiddelde: Sometype = {
  id: 'gemiddelde',
  naam: 'Gemiddeldesom',
  aanpak: 'Tel eerst alles bij elkaar op. Deel dat door het aantal keer. Dan weet je wat het per keer gemiddeld was.',
  valkuil: 'Delen door het verkeerde getal. Tel goed hoeveel keer het is: drie dagen is delen door 3.',
  niveaus: [3, 4, 5],
  maak(level, index, random) {
    const aantal = level <= 3 ? 3 : kiesUit([3, 4], random);
    const gem = heelGetal(level <= 3 ? 12 : 20, level <= 3 ? 30 : 80, random);
    const waarden = Array.from({ length: aantal - 1 }, () => gem + heelGetal(-5, 5, random));
    waarden.push(gem * aantal - waarden.reduce((a, b) => a + b, 0));
    const lijst = `${waarden.slice(0, -1).join(', ')} en ${waarden.at(-1)}`;
    const dagen = aantal === 3 ? 'drie' : 'vier';
    const verhalen = [
      { zin: `Bram loopt ${dagen} dagen hard: ${lijst} minuten. Hoeveel minuten loopt hij gemiddeld per dag?`, eenheid: 'minuten', zoek: 'de gemiddelde looptijd per dag' },
      { zin: `Een kraam verkoopt ${dagen} dagen lang ${lijst} ijsjes. Hoeveel ijsjes zijn dat gemiddeld per dag?`, eenheid: 'ijsjes', zoek: 'het gemiddelde aantal ijsjes per dag' },
      { zin: `Ilse leest ${dagen} avonden: ${lijst} bladzijden. Hoeveel bladzijden leest ze gemiddeld per avond?`, eenheid: 'bladzijden', zoek: 'het gemiddelde aantal bladzijden' },
    ];
    const v = verhalen[index % verhalen.length];
    const stappen = [
      { vraag: 'Hoeveel zijn de eerste twee samen?', som: `${waarden[0]} + ${waarden[1]}`, antwoord: waarden[0] + waarden[1], eenheid: v.eenheid, tip: 'Eerst alles bij elkaar optellen.' },
    ];
    let som = waarden[0] + waarden[1];
    for (let i = 2; i < aantal; i++) {
      som += waarden[i];
      stappen.push({ vraag: `En samen met ${waarden[i]}?`, som: `{${i - 1}} + ${waarden[i]}`, antwoord: som, eenheid: v.eenheid, tip: 'Blijf optellen tot je alles hebt.' });
    }
    stappen.push({ vraag: `Hoeveel is het gemiddeld per keer?`, som: `{${aantal - 1}} ÷ ${aantal}`, antwoord: gem, eenheid: v.eenheid, tip: `Het waren ${dagen} keer, dus deel door ${aantal}.` });
    return maakSom({
      typeId: 'gemiddelde', id: `gemiddelde:${level}:${index}:${waarden.join('-')}`,
      verhaal: v.zin,
      nodig: waarden.map(String),
      zoek: v.zoek,
      aanpak: gemiddelde.aanpak,
      stappen,
      controle: `${aantal} × ${gem} = ${gem * aantal}, precies alles bij elkaar.`,
    });
  },
};
