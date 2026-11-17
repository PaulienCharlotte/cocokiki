import { heelGetal, maakSom, type Sometype } from '../types';

/** Je weet hoe het afliep en zoekt hoe het begon: draai elke stap om, van achter naar voor. */
export const omgekeerd: Sometype = {
  id: 'omgekeerd',
  naam: 'Terugrekensom',
  aanpak: 'Begin bij het eind en reken terug.',
  valkuil: 'Gewoon meedoen met het verhaal. Kwam er iets bij, dan moet je bij het terugrekenen juist aftrekken.',
  niveaus: [3, 4, 5],
  maak(level, index, random) {
    const eerst = heelGetal(15, level <= 3 ? 60 : 150, random);
    const weg = heelGetal(4, Math.floor(eerst * 0.6), random);
    const bij = heelGetal(3, level <= 3 ? 25 : 60, random);
    const nu = eerst - weg + bij;
    const verhalen = [
      { zin: `Lisa geeft ${weg} knikkers weg. Daarna wint ze er ${bij}. Nu heeft ze ${nu} knikkers. Hoeveel knikkers had ze eerst?`, wat: 'knikkers', zoek: 'het aantal knikkers van het begin' },
      { zin: `Bij de eerste halte stappen ${weg} mensen uit de bus en ${bij} mensen in. Nu zitten er ${nu} mensen in de bus. Hoeveel zaten er eerst in?`, wat: 'mensen', zoek: 'het aantal mensen vóór de halte' },
      { zin: `Een boer verkoopt ${weg} eieren. Daarna leggen zijn kippen er ${bij} bij. Nu heeft hij ${nu} eieren. Hoeveel had hij eerst?`, wat: 'eieren', zoek: 'het aantal eieren van het begin' },
    ];
    const v = verhalen[index % verhalen.length];
    return maakSom({
      typeId: 'omgekeerd', id: `omgekeerd:${level}:${index}:${weg}:${bij}:${nu}`,
      verhaal: v.zin,
      nodig: [String(weg), String(bij), String(nu)],
      zoek: v.zoek,
      aanpak: omgekeerd.aanpak,
      stappen: [
        { vraag: `Er kwamen er ${bij} bij. Hoeveel waren het daarvóór?`, som: `${nu} − ${bij}`, antwoord: nu - bij, eenheid: v.wat, tip: 'Wat erbij kwam, haal je er bij het terugrekenen weer af.' },
        { vraag: `Er gingen er ${weg} af. Hoeveel waren het helemaal aan het begin?`, som: `{1} + ${weg}`, antwoord: eerst, eenheid: v.wat, tip: 'Wat eraf ging, tel je er weer bij.' },
      ],
      controle: `${eerst} − ${weg} + ${bij} = ${nu}, precies wat er nu is.`,
    });
  },
};
