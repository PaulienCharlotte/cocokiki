import { GEZONDE_INGREDIENTEN } from './healthyRecipes';
import { NUTRIENTS_BY_ID } from './nutrients';
import type { IngredientDiscoveryConfig } from './types';

const vragen: Record<string, { vraag: string; goed: string; fout: [string, string] }> = {
  'wholewheat-pasta': { vraag: 'Waarom kiezen we volkoren pasta?', goed: 'Die bevat meer vezels dan witte pasta.', fout: ['Die bevat geen koolhydraten.', 'Die hoef je niet te koken.'] },
  'brown-rice': { vraag: 'Wat blijft er bij zilvervliesrijst om de korrel zitten?', goed: 'Het vliesje, met vezels erin.', fout: ['Een laagje suiker.', 'De hele rijstplant.'] },
  chickpeas: { vraag: 'Welke kikkererwten gebruiken we in dit recept?', goed: 'Gare kikkererwten, afgespoeld en uitgelekt.', fout: ['Droge kikkererwten, meteen uit de zak.', 'Kikkererwten met hun peulen er nog omheen.'] },
  tomato: { vraag: 'Welk deel van de tomatenplant eten we?', goed: 'De vrucht.', fout: ['De wortels.', 'De bladeren.'] },
  pepper: { vraag: 'Wat helpt vitamine C uit paprika je lichaam doen?', goed: 'IJzer uit plantaardig eten opnemen.', fout: ['Zonder slaap uitrusten.', 'Eiwitten in suiker veranderen.'] },
  spinach: { vraag: 'Welk deel van de spinazieplant eten we?', goed: 'De bladeren.', fout: ['De bloemen.', 'De wortels.'] },
  apple: { vraag: 'Waarom laten we de gewassen appelschil zitten?', goed: 'Ook in de schil zitten vezels.', fout: ['Dan hoef je de appel niet te wassen.', 'Dan verdwijnen de klokhuizen vanzelf.'] },
  'olive-oil': { vraag: 'Waaruit wordt olijfolie geperst?', goed: 'Uit olijven.', fout: ['Uit melk.', 'Uit rijstkorrels.'] },
};
export const GEZONDE_ONTDEKKINGEN: IngredientDiscoveryConfig[] = GEZONDE_INGREDIENTEN.map(ingredient => {
  const vraag = vragen[ingredient.id];
  return { ingredientId: ingredient.id, title: `Ontdek ${ingredient.name.toLowerCase()}!`, collectionLabel: ingredient.name,
    educationalText: ingredient.origin!, heroFact: ingredient.facts[0], origin: { label: 'Van plant tot keuken', text: ingredient.origin! },
    nutrition: (ingredient.nutrientIds ?? []).map(id => ({ nutrient: NUTRIENTS_BY_ID[id].name, role: NUTRIENTS_BY_ID[id].bodyFunction })),
    foodKnowledge: { label: 'In de keuken', text: ingredient.facts[0] }, rewardCoins: 5, encyclopediaEntryId: ingredient.id, difficulty: 1,
    questions: [{ id: `${ingredient.id}-knowledge`, type: 'single-choice', prompt: vraag.vraag, options: [{ id: 'juist', label: vraag.goed }, { id: 'anders', label: vraag.fout[0] }, { id: 'nog-anders', label: vraag.fout[1] }], correctOptionId: 'juist', feedbackExplanation: ingredient.facts[0] + ' ' + ingredient.origin, learningGoal: ['wholewheat-pasta', 'brown-rice', 'pepper', 'apple'].includes(ingredient.id) ? 'nutrition' : 'source' }],
  };
});
