import { heelGetal, maakSom, type Sometype } from '../types';

/** Er staat een getal in dat je niet nodig hebt. Wie alles optelt, trapt erin. */
export const strikvraag: Sometype = {
  id: 'strikvraag',
  naam: 'Strikvraag',
  aanpak: 'Niet elk getal in het verhaal heb je nodig. Lees eerst wat je zoekt, en streep alleen de getallen aan die daarbij horen.',
  valkuil: 'Elk getal gebruiken omdat het er staat. Het verhaal zet je soms expres op het verkeerde been.',
  niveaus: [2, 3, 4, 5],
  maak(level, index, random) {
    if (index % 2 === 0) {
      const plaatsen = heelGetal(40, 60, random);
      const kids = heelGetal(20, plaatsen - 8, random);
      const juffen = heelGetal(2, 6, random);
      let uur = heelGetal(2, 9, random);
      if (uur === juffen) uur += 1;
      return maakSom({
        typeId: 'strikvraag', id: `strikvraag:bus:${level}:${index}:${plaatsen}:${kids}:${juffen}`,
        verhaal: `Een bus heeft ${plaatsen} zitplaatsen. Er gaan ${kids} kinderen en ${juffen} juffen mee op schoolreis. De rit duurt ${uur} uur. Hoeveel plaatsen blijven er leeg?`,
        nodig: [String(plaatsen), String(kids), String(juffen)],
        zoek: 'het aantal lege plaatsen',
        aanpak: strikvraag.aanpak,
        stappen: [
          { vraag: 'Hoeveel mensen gaan er mee?', som: `${kids} + ${juffen}`, antwoord: kids + juffen, eenheid: 'mensen', tip: 'Kinderen én juffen zitten in de bus. Hoe lang de rit duurt doet er niet toe.' },
          { vraag: 'Hoeveel plaatsen blijven er leeg?', som: `${plaatsen} − {1}`, antwoord: plaatsen - kids - juffen, eenheid: 'plaatsen', tip: 'Alle plaatsen min wie er zit.' },
        ],
        controle: `${kids + juffen} bezet + ${plaatsen - kids - juffen} leeg = ${plaatsen} plaatsen. De ${uur} uur had je niet nodig.`,
      });
    }
    const leeftijd = heelGetal(8, 12, random);
    const eerst = heelGetal(15, 40, random);
    const wint = heelGetal(5, 20, random);
    let verliest = heelGetal(3, 14, random);
    if (verliest === leeftijd) verliest += 1;
    return maakSom({
      typeId: 'strikvraag', id: `strikvraag:knikker:${level}:${index}:${leeftijd}:${eerst}:${wint}:${verliest}`,
      verhaal: `Mila is ${leeftijd} jaar. Ze heeft ${eerst} knikkers. Op het schoolplein wint ze er ${wint} en verliest ze er ${verliest}. Hoeveel knikkers heeft ze nu?`,
      nodig: [String(eerst), String(wint), String(verliest)],
      zoek: 'het aantal knikkers van Mila',
      aanpak: strikvraag.aanpak,
      stappen: [
        { vraag: 'Hoeveel heeft ze na het winnen?', som: `${eerst} + ${wint}`, antwoord: eerst + wint, eenheid: 'knikkers', tip: 'Hoe oud Mila is, maakt voor haar knikkers niets uit.' },
        { vraag: 'En na het verliezen?', som: `{1} − ${verliest}`, antwoord: eerst + wint - verliest, eenheid: 'knikkers', tip: 'Wat ze verliest gaat eraf.' },
      ],
      controle: `${eerst} + ${wint} − ${verliest} = ${eerst + wint - verliest}. Haar leeftijd had je niet nodig.`,
    });
  },
};
