import { PLANT_SPECIES, type PlantSpecies } from '../plants/species';
import { INGREDIENTS } from '../cooking/catalog';
import { NUTRIENTS } from '../cooking/nutrients';
import type { IngredientEntry } from '../cooking/types';
import type { NutrientDefinition } from '../cooking/nutrients';

/**
 * De vragenmaker.
 *
 * De app staat vol gegevens die alleen gelezen worden: waar een plant vandaan
 * komt, hoeveel licht hij wil, in welk seizoen een vrucht rijp is. Elk van die
 * velden is eigenlijk een vraag met het antwoord erin. Hier worden ze dat ook.
 *
 * Er komt geen tekening aan te pas. Schrijf je er een plant of een ingrediënt
 * bij, dan staan de vragen erover er vanzelf bij.
 */
export type QuizBron = 'planten' | 'eten' | 'voeding';

export interface QuizVraag {
  /** Stabiel, zodat je kunt onthouden wat al gevraagd is. */
  id: string;
  bron: QuizBron;
  vraag: string;
  antwoord: string;
  /** Het goede antwoord zit hier altijd bij. */
  opties: string[];
  /** Waar het antwoord vandaan komt, voor na afloop. */
  toelichting?: string;
}

/**
 * Drie afleiders kiezen die écht fout zijn.
 *
 * Twee planten die allebei veel zon willen zouden twee goede antwoorden geven.
 * Daarom komt een afleider er alleen in als zijn eigen waarde verschilt.
 */
function keuzes(goed: string, anderen: string[], zaad: number): string[] {
  const fout = [...new Set(anderen.filter(waarde => waarde !== goed))];
  const gekozen: string[] = [];
  for (let stap = 0; stap < fout.length && gekozen.length < 2; stap += 1) {
    const kandidaat = fout[(zaad * 7 + stap * 13) % fout.length];
    if (!gekozen.includes(kandidaat)) gekozen.push(kandidaat);
  }
  const alles = [goed, ...gekozen];
  // Het goede antwoord staat niet altijd op dezelfde plek.
  return alles.map((_, index) => alles[(index + zaad) % alles.length]);
}

function plantVragen(soorten: PlantSpecies[]): QuizVraag[] {
  const namen = soorten.map(soort => soort.commonName);
  const uit: QuizVraag[] = [];
  soorten.forEach((soort, index) => {
    uit.push({
      id: `plant:${soort.id}:herkomst`, bron: 'planten',
      vraag: `Welke plant komt oorspronkelijk uit ${soort.origin.replace(/\.$/, '')}?`,
      antwoord: soort.commonName,
      opties: keuzes(soort.commonName, soorten.filter(ander => ander.origin !== soort.origin).map(ander => ander.commonName), index),
      toelichting: soort.habitat,
    });
    uit.push({
      id: `plant:${soort.id}:water`, bron: 'planten',
      vraag: `Hoe vaak geef je een ${soort.commonName.toLowerCase()} water?`,
      antwoord: `Om de ${soort.waterDays} dagen`,
      opties: keuzes(`Om de ${soort.waterDays} dagen`, soorten.map(ander => `Om de ${ander.waterDays} dagen`), index + 1),
      toelichting: soort.water,
    });
    uit.push({
      id: `plant:${soort.id}:licht`, bron: 'planten',
      vraag: `Waar zet je een ${soort.commonName.toLowerCase()} het liefst neer?`,
      antwoord: soort.light,
      opties: keuzes(soort.light, soorten.map(ander => ander.light), index + 2),
      toelichting: soort.kikiTip,
    });
    uit.push({
      id: `plant:${soort.id}:weetje`, bron: 'planten',
      vraag: `Bij welke plant hoort dit? ${soort.funFact}`,
      antwoord: soort.commonName,
      opties: keuzes(soort.commonName, namen, index + 3),
    });
  });
  return uit;
}

function etenVragen(items: IngredientEntry[]): QuizVraag[] {
  const uit: QuizVraag[] = [];
  items.forEach((item, index) => {
    if (item.season) {
      uit.push({
        id: `eten:${item.id}:seizoen`, bron: 'eten',
        vraag: `Wanneer is ${item.name.toLowerCase()} bij ons in het seizoen?`,
        antwoord: item.season,
        opties: keuzes(item.season, items.map(ander => ander.season).filter((waarde): waarde is string => Boolean(waarde)), index),
      });
    }
    if (item.productionRegions.length > 0) {
      const streek = item.productionRegions[0];
      uit.push({
        id: `eten:${item.id}:streek`, bron: 'eten',
        vraag: `Uit welke streek komt ${item.name.toLowerCase()} vooral?`,
        antwoord: streek,
        opties: keuzes(streek, items.flatMap(ander => ander.productionRegions), index + 1),
        toelichting: item.origin,
      });
    }
  });
  return uit;
}

function voedingVragen(stoffen: NutrientDefinition[]): QuizVraag[] {
  return stoffen.map((stof, index) => ({
    id: `voeding:${stof.id}:functie`, bron: 'voeding' as const,
    vraag: stof.bodyFunction.replace(stof.name, 'Welke voedingsstof').replace(/\.$/, '?'),
    antwoord: stof.name,
    opties: keuzes(stof.name, stoffen.map(ander => ander.name), index),
    toelichting: `Je vindt het in ${stof.foodExamples.join(', ').toLowerCase()}.`,
  }));
}

/** Alle vragen die uit de huidige gegevens te maken zijn. */
export function alleVragen(): QuizVraag[] {
  const vragen = [
    ...plantVragen(PLANT_SPECIES),
    ...etenVragen(INGREDIENTS.filter(item => item.contentStatus === 'ready')),
    ...voedingVragen(NUTRIENTS),
  ];
  // Een vraag met minder dan drie keuzes is geen vraag.
  return vragen.filter(vraag => vraag.opties.length >= 3);
}
