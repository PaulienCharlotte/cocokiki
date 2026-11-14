import { GEZONDE_INGREDIENTEN } from './healthyRecipes';
import { NUTRIENTS_BY_ID } from './nutrients';
import type { IngredientDiscoveryConfig } from './types';

const vragen: Record<string, { vraag: string; goed: string; fout: [string, string] }> = {
  'wholewheat-pasta': { vraag: 'Waarom kiezen we volkoren pasta?', goed: 'Die bevat meer vezels dan witte pasta.', fout: ['Die levert vooral meer calcium dan witte pasta.', 'Die wordt van alleen de kiem van graan gemaakt.'] },
  'brown-rice': { vraag: 'Wat blijft er bij zilvervliesrijst om de korrel zitten?', goed: 'Het vliesje, met vezels erin.', fout: ['Het harde buitenste kaf dat je niet kunt eten.', 'De peul waarin de korrels groeien.'] },
  chickpeas: { vraag: 'Welke kikkererwten gebruiken we in dit recept?', goed: 'Gare kikkererwten, afgespoeld en uitgelekt.', fout: ['Droge kikkererwten, meteen uit de zak.', 'Kikkererwten met hun peulen er nog omheen.'] },
  tomato: { vraag: 'Welk deel van de tomatenplant eten we?', goed: 'De vrucht.', fout: ['De wortels.', 'De bladeren.'] },
  pepper: { vraag: 'Wat helpt vitamine C uit paprika je lichaam doen?', goed: 'IJzer uit plantaardig eten opnemen.', fout: ['Calcium uit eten opnemen.', 'Rode bloedcellen aanmaken met vitamine B12.'] },
  spinach: { vraag: 'Welk deel van de spinazieplant eten we?', goed: 'De bladeren.', fout: ['De bloemen.', 'De wortels.'] },
  apple: { vraag: 'Waarom laten we de gewassen appelschil zitten?', goed: 'Ook in de schil zitten vezels.', fout: ['De schil levert vooral eiwitten voor je spieren.', 'De schil levert vooral calcium voor je botten.'] },
  'olive-oil': { vraag: 'Waaruit wordt olijfolie geperst?', goed: 'Uit olijven.', fout: ['Uit melk.', 'Uit rijstkorrels.'] },
};
const verbanden: Record<string, { vraag: string; goed: string; fout: [string, string]; uitleg: string }> = {
  'wholewheat-pasta': { vraag: 'Je kiest volkoren pasta voor de vezels. Welk deel van je lichaam help je daarmee?', goed: 'Je darmen.', fout: ['Je bloed, bij het vervoeren van zuurstof.', 'Je botten, bij het opbouwen met calcium.'], uitleg: 'Vezels helpen je darmen goed te werken. IJzer helpt bij zuurstofvervoer; calcium helpt je botten.' },
  'brown-rice': { vraag: 'Witte rijst mist het vliesje. Welke taak van voeding past juist bij de vezels in dat vliesje?', goed: 'De darmwerking ondersteunen.', fout: ['Zuurstof vervoeren in rode bloedcellen.', 'Spierweefsel opbouwen met eiwitten.'], uitleg: 'Het vliesje levert vezels. Vezels ondersteunen de darmwerking.' },
  chickpeas: { vraag: 'Kikkererwten leveren eiwitten én vezels. Welke twee taken passen daarbij?', goed: 'Groei en herstel, en de darmwerking.', fout: ['Zuurstof vervoeren, en calcium opnemen.', 'Botten opbouwen, en vitamine D maken in je huid.'], uitleg: 'Eiwitten helpen bij groei en herstel. Vezels ondersteunen je darmen.' },
  tomato: { vraag: 'Tomaat levert vezels en vitamine C. Welke combinatie past daarbij?', goed: 'Darmwerking en ijzer uit planten opnemen.', fout: ['Zuurstof vervoeren en spieren opbouwen.', 'Calcium opnemen en botten opbouwen.'], uitleg: 'Vezels helpen de darmwerking. Vitamine C helpt je ijzer uit plantaardig eten op te nemen.' },
  pepper: { vraag: 'Waarom passen paprika en kikkererwten bij elkaar in een maaltijd?', goed: 'Vitamine C uit paprika helpt ijzer uit de kikkererwten op te nemen.', fout: ['Calcium uit paprika maakt de vezels uit kikkererwten verteerbaar.', 'Eiwitten uit paprika nemen de taak van vitamine D over.'], uitleg: 'Kikkererwten leveren ijzer. Vitamine C uit paprika helpt je lichaam dit plantaardige ijzer op te nemen.' },
  spinach: { vraag: 'IJzer uit spinazie helpt bij zuurstofvervoer. Wat neemt de zuurstof mee door je lichaam?', goed: 'Rode bloedcellen.', fout: ['Vezels die door je darmen gaan.', 'Calcium dat je botten opbouwt.'], uitleg: 'Je lichaam gebruikt ijzer voor een stof in rode bloedcellen. Daarmee nemen ze zuurstof mee.' },
  apple: { vraag: 'Een appel levert vezels én koolhydraten. Welke combinatie van taken klopt?', goed: 'Vezels helpen je darmen; koolhydraten leveren energie.', fout: ['Vezels leveren bouwstoffen voor spieren; koolhydraten helpen je darmen.', 'Vezels vervoeren zuurstof; koolhydraten bouwen je botten op.'], uitleg: 'Vezels en koolhydraten hebben verschillende taken: darmwerking en energie leveren.' },
  'olive-oil': { vraag: 'Olijfolie levert vetten. Wat doen vetten behalve energie leveren?', goed: 'Helpen bepaalde vitamines op te nemen.', fout: ['Als vezels de darmwerking ondersteunen.', 'Als rode bloedcellen zuurstof vervoeren.'], uitleg: 'Je lichaam gebruikt vetten ook om bepaalde vitamines uit eten op te nemen.' },
};
export const GEZONDE_ONTDEKKINGEN: IngredientDiscoveryConfig[] = GEZONDE_INGREDIENTEN.map(ingredient => {
  const vraag = vragen[ingredient.id];
  return { ingredientId: ingredient.id, title: `Ontdek ${ingredient.name.toLowerCase()}!`, collectionLabel: ingredient.name,
    educationalText: ingredient.origin!, heroFact: ingredient.facts[0], origin: { label: 'Van plant tot keuken', text: ingredient.origin! },
    nutrition: (ingredient.nutrientIds ?? []).map(id => ({ nutrient: NUTRIENTS_BY_ID[id].name, role: NUTRIENTS_BY_ID[id].bodyFunction })),
    foodKnowledge: { label: 'In de keuken', text: ingredient.facts[0] }, rewardCoins: 5, encyclopediaEntryId: ingredient.id, difficulty: 1,
    questions: [{ id: `${ingredient.id}-knowledge`, type: 'single-choice', prompt: vraag.vraag, options: [{ id: 'juist', label: vraag.goed }, { id: 'anders', label: vraag.fout[0] }, { id: 'nog-anders', label: vraag.fout[1] }], correctOptionId: 'juist', feedbackExplanation: ingredient.facts[0] + ' ' + ingredient.origin, learningGoal: ['wholewheat-pasta', 'brown-rice', 'pepper', 'apple'].includes(ingredient.id) ? 'nutrition' : 'source' },
      { id: `${ingredient.id}-apply`, type: 'single-choice', prompt: verbanden[ingredient.id].vraag,
        options: [{ id: 'verband', label: verbanden[ingredient.id].goed }, { id: 'ander-verband', label: verbanden[ingredient.id].fout[0] }, { id: 'nog-een-verband', label: verbanden[ingredient.id].fout[1] }],
        correctOptionId: 'verband', feedbackExplanation: verbanden[ingredient.id].uitleg, learningGoal: 'nutrition' }],
  };
});
