import type { CookingStepConfig, OvenConfig } from './preparation';
import type { MathChallengeConfig, RecipeConfig } from './types';
import { BAKING_ASSETS as a } from './muffinIngredients';
import { recipeSpoonStock } from './recipeMeasures';

const kit = '/assets/library/cooking/kit/';
export const MUFFIN_OVEN: OvenConfig = { targetTemperature: 200, minimumMinutes: 15, maximumMinutes: 20, temperatureTolerance: 15, preheatDegreesPerSecond: 24, gameSecondsPerMinute: .6, coolingSeconds: 4, minimumTemperature: 100, maximumTemperature: 260, temperatureStep: 5, minimumSelectableMinutes: 5, maximumSelectableMinutes: 30 };
const base = { station: 'worktop' as const, target: 1 };
const oven = (id: string, action: 'preheat' | 'bake' | 'cool', title: string, instruction: string): CookingStepConfig => ({ ...base, station: 'oven', id, title, instruction, mechanic: 'oven', action, oven: MUFFIN_OVEN, asset: '/assets/library/treehouse/furnishings/oven.webp', panAsset: a.pan, resultAsset: a.muffin, portions: 10 });
const weigh = (id: string, title: string, target: number, asset: string, contents: 'dry' | 'berries'): CookingStepConfig => ({ ...base, id, title, target, instruction: `Weeg ${target} gram af.`, mechanic: 'weigh', unit: 'gram', increments: [5, 25, 50], maximum: target + 100, asset, contents });
const spoon = (id: string, title: string, target: number, asset: string): CookingStepConfig => ({ ...base, id, title, target, instruction: `${title}. Elk maatje is een kwart theelepel.`, mechanic: 'measure', vessel: 'spoon', vesselAsset: kit + 'spoon.webp', unitLabel: 'kwart tl', increments: [1, 2, 4], maximum: target + 4, asset });

export const MUFFIN_MATH: MathChallengeConfig[] = [
  { id: 'muffin-weigh', recipeId: 'blueberry-muffins', type: 'interactive-weighing', title: 'Weeg de bessen', instruction: 'Weeg 200 gram blauwe bessen.', learningObjective: 'Gewichten optellen', difficulty: 2, ingredientId: 'blueberry', targetGrams: 200, increments: [5, 25, 50], rewardCoins: 5, successFeedback: 'Precies 200 gram!' },
  { id: 'muffin-share', recipeId: 'blueberry-muffins', type: 'quantity-selection', title: 'Bessen verdelen', instruction: '200 gram bessen voor 10 muffins. Hoeveel gram is dat gemiddeld per muffin?', learningObjective: 'Delen en verhoudingen', difficulty: 2, ingredientId: 'blueberry', baseServings: 10, targetServings: 1, baseQuantity: 200, correctQuantity: 20, minimum: 0, maximum: 100, step: 5, unit: 'g', rewardCoins: 5, successFeedback: '200 gedeeld door 10 is 20 gram.' },
  { id: 'muffin-double', recipeId: 'blueberry-muffins', type: 'recipe-scaling', title: 'Een dubbele portie', instruction: 'Van 10 naar 20 muffins: verdubbel de bloem en bessen.', learningObjective: 'Een recept verdubbelen', difficulty: 2, baseServings: 10, targetServings: 20, quantities: [{ ingredientId: 'flour', base: 195, target: 390, step: 5, unit: 'g' }, { ingredientId: 'blueberry', base: 200, target: 400, step: 25, unit: 'g' }], rewardCoins: 5, successFeedback: 'Goed! 390 gram bloem en 400 gram bessen.' },
];

export const BLUEBERRY_MUFFINS: RecipeConfig = {
  id: 'blueberry-muffins', name: 'Blauwe-bessenmuffins', category: 'baking', availability: 'playable', requiredCompletedRecipes: 0, level: 2,
  shortDescription: 'Maak beslag, vul tien vormpjes en bedien zelf de oven.', preparationMinutes: 30, servings: 10, image: a.muffin, contentStatus: 'ready', rewardCoins: 10,
  ingredients: [
    { ingredientId: 'flour', amount: 195, unit: 'gram', displayAmount: '195 g bloem' },
    { ingredientId: 'sugar', amount: 163, unit: 'gram', displayAmount: '150 g suiker + eventueel 1 eetlepel bovenop', optionalPortion: { amount: 13, stepId: 'fill', selectedChoice: 'sugar' } },
    { ingredientId: 'baking-powder', ...recipeSpoonStock('baking-powder', 8), displayAmount: '2 theelepels bakpoeder' },
    { ingredientId: 'salt', ...recipeSpoonStock('salt', 1), displayAmount: '¼ theelepel fijn zout' },
    { ingredientId: 'sunflower-oil', amount: 80, unit: 'milliliter', displayAmount: '80 ml zonnebloemolie' },
    { ingredientId: 'eggs', amount: 1, unit: 'piece', displayAmount: '1 groot ei' },
    { ingredientId: 'milk', amount: 107, unit: 'milliliter', displayAmount: 'Melk tot de cupmaat: circa 80 ml; in het spel 107 ml' },
    { ingredientId: 'vanilla-extract', ...recipeSpoonStock('vanilla-extract', 6), displayAmount: '1½ theelepel vanille-extract' },
    { ingredientId: 'blueberry', amount: 200, unit: 'gram', displayAmount: '200 g blauwe bessen' },
  ],
  equipmentIds: ['bowl', 'whisk', 'spoon', 'scale', 'measuring-jug', 'muffin-pan'], challenges: [], shoppingRequirements: [], actions: [],
  preparation: { version: 1, consumption: 'on-completion', finishedAsset: a.muffin, finishedAlt: 'Zelfgebakken blauwe-bessenmuffin', steps: [
    oven('preheat', 'preheat', 'Maak de oven warm', 'Stel de oven in op 200 °C. Hij warmt op terwijl jij beslag maakt.'),
    { ...base, id: 'tools', title: 'Leg je spullen klaar', instruction: 'Pak de kom, garde, lepel, weegschaal, maatbeker en bakvorm.', mechanic: 'collect', target: 6, asset: kit + 'bowl-empty.webp', tools: [{ id: 'bowl', label: 'Mengkom', asset: kit + 'bowl-empty.webp' }, { id: 'whisk', label: 'Garde', asset: kit + 'whisk.webp' }, { id: 'spoon', label: 'Lepel', asset: kit + 'spoon.webp' }, { id: 'scale', label: 'Weegschaal', asset: kit + 'scale.webp' }, { id: 'measuring-jug', label: 'Maatbeker', asset: a.jug }, { id: 'muffin-pan', label: 'Bakvorm', asset: a.pan }] },
    weigh('flour', 'Weeg de bloem', 195, kit + 'flour.webp', 'dry'),
    weigh('sugar', 'Voeg de suiker toe', 150, kit + 'sugar.webp', 'dry'),
    spoon('powder', 'Voeg 2 theelepels bakpoeder toe', 8, a['baking-powder']),
    spoon('salt', 'Voeg ¼ theelepel zout toe', 1, a.salt),
    { ...base, id: 'mix-dry', title: 'Meng de droge ingrediënten', instruction: 'Roer met de garde.', mechanic: 'repeat', target: 3, asset: kit + 'bowl-empty.webp', contents: 'dry', tapTool: { asset: kit + 'whisk.webp', label: 'Garde' } },
    { ...base, id: 'oil', title: 'Meet de olie', instruction: 'Meet 80 ml olie af in de maatbeker.', mechanic: 'measure', target: 80, vessel: 'jug', vesselAsset: a.jug, unitLabel: 'ml', increments: [5, 20], maximum: 120, capacity: 237, liquid: 'oil', asset: kit + 'oil.webp' },
    // Twee tikken in plaats van één: eerst breken in een apart bakje, dan pas
    // bij de olie. Zo zie je wat er gebeurt, en vis je een stukje schaal er nog
    // uit voordat het in je beslag verdwijnt.
    { ...base, id: 'egg', title: 'Breek één ei', instruction: 'Breek het ei eerst in een apart bakje. Zie je een stukje schaal, dan vis je het er zo uit. Giet het daarna bij de olie en was je handen.', mechanic: 'repeat', target: 2, asset: kit + 'bowl-empty.webp',
      vesselByCount: [kit + 'bowl-empty.webp', kit + 'bowl-eggs.webp'], toolByCount: [kit + 'egg.webp', kit + 'egg-cracked.webp'],
      tapTool: { asset: kit + 'egg.webp', label: 'Ei' }, tapLabel: 'Tik op het ei' },
    { ...base, id: 'milk', title: 'Vul aan met melk', instruction: 'Vul na olie en ei tot de cupmaat. Dit is een spelmaat; thuis kan de hoeveelheid melk verschillen.', mechanic: 'measure', target: 107, vessel: 'jug', vesselAsset: a.jug, unitLabel: 'ml', increments: [1, 10, 25], maximum: 150, baseVolume: 130, capacity: 237, liquid: 'milk', asset: kit + 'milk.webp' },
    spoon('vanilla', 'Voeg 1½ theelepel vanille toe', 6, a['vanilla-extract']),
    { ...base, id: 'mix-wet', title: 'Meng de vloeistoffen', instruction: 'Roer ei, olie, melk en vanille door elkaar.', mechanic: 'repeat', target: 3, asset: a.jug, tapTool: { asset: kit + 'spoon.webp', label: 'Lepel' } },
    { ...base, id: 'combine', title: 'Schenk bij de bloem', instruction: 'Schenk het natte mengsel in de kom.', mechanic: 'drag', asset: a.jug, contents: 'dry', dropTarget: { sourceLabel: 'Nat mengsel', label: 'Mengkom', asset: kit + 'bowl-empty.webp' } },
    { ...base, id: 'mix-batter', title: 'Meng kort', instruction: 'Roer tot je geen droge bloem meer ziet. Klontjes mogen blijven.', mechanic: 'repeat', target: 3, asset: kit + 'batter-thick-top.webp',
      vesselByCount: [kit + 'batter-thick-top.webp', kit + 'batter-mix-1-top.webp', kit + 'batter-mix-2-top.webp', kit + 'batter-smooth-top.webp'],
      tapTool: { asset: kit + 'spoon-top.webp', label: 'Lepel' }, tapLabel: 'Roer met de lepel' },
    weigh('berries', 'Weeg de blauwe bessen', 200, '/games/shop/products/blueberry.webp', 'berries'),
    { ...base, id: 'add-berries', title: 'Bessen erbij', instruction: 'Voeg de bessen toe aan het beslag.', mechanic: 'drag', asset: '/games/shop/products/blueberry.webp', contents: 'batter', dropTarget: { sourceLabel: 'Blauwe bessen', label: 'Beslagkom', asset: kit + 'bowl-empty.webp' } },
    { ...base, id: 'fold', title: 'Schep voorzichtig om', instruction: 'Schep de bessen rustig door het beslag.', mechanic: 'repeat', target: 3, asset: kit + 'bowl-empty.webp', contents: 'berries', tapTool: { asset: kit + 'spoon.webp', label: 'Lepel' } },
    { ...base, id: 'fill', title: 'Vul tien vormpjes', instruction: 'Leg papier in de holtes en verdeel het beslag. Twee holtes blijven leeg.', mechanic: 'portion', target: 10, asset: kit + 'batter-thick-top.webp', panAsset: kit + 'muffin-pan-top.webp', linerAsset: kit + 'liner-top.webp', linerFilledAsset: kit + 'liner-batter-top.webp', toppingAsset: kit + 'sugar.webp', columns: 4, positions: [{ x: 16.1, y: 22.6 }, { x: 38.6, y: 22.6 }, { x: 60.8, y: 22.6 }, { x: 83.3, y: 22.6 }, { x: 16.1, y: 46.8 }, { x: 38.6, y: 46.8 }, { x: 60.8, y: 46.8 }, { x: 83.3, y: 46.8 }, { x: 16.1, y: 72.7 }, { x: 38.6, y: 72.7 }] },
    oven('bake', 'bake', 'Bak je muffins', 'Plaats de vorm en kies 15–20 bakminuten bij 200 °C.'),
    oven('cool', 'cool', 'Laat even afkoelen', 'Laat een volwassene helpen bij de hete oven. Laat de muffins afkoelen op een rooster.'),
  ] },
  education: { math: MUFFIN_MATH, nutrientMemory: { enabled: true, activityId: 'muffin-nutrients-v1', nutrientIds: ['carbohydrates', 'protein', 'fats', 'fiber', 'calcium', 'vitamin-d'], pairCount: 6 } },
  cookingTips: [
    { id: 'muffin-preheat', character: 'coco', triggerStepId: 'tools', title: 'Een warme start', text: 'Een warme oven zorgt ervoor dat je muffins meteen goed kunnen beginnen met bakken!' },
    { id: 'muffin-powder', character: 'coco', triggerStepId: 'mix-dry', title: 'Kleine luchtbelletjes', text: 'Bakpoeder maakt gasbelletjes in het beslag. Daardoor kunnen muffins lekker luchtig worden!' },
    { id: 'muffin-mix', character: 'coco', triggerStepId: 'mix-batter', title: 'Kort is genoeg', text: 'Meng muffinbeslag niet te lang. Een paar klontjes zijn niet erg!' },
    // Terwijl de oven staat te bakken sta je te wachten. Dan vertelt Coco iets.
    { id: 'muffin-geschiedenis', character: 'coco', triggerStepId: 'fill', title: 'Muffins zijn best oud', text: 'Het woord muffin staat al ruim driehonderd jaar in Engelse kookboeken. Toen waren het nog platte broodjes van de bakplaat. Pas toen bakpoeder werd uitgevonden werden ze zo luchtig als nu.' },
    { id: 'muffin-oven-hulp', character: 'coco', triggerStepId: 'fold', title: 'Vraag altijd hulp', text: 'Een oven wordt gloeiend heet, en een hete bakvorm ook. Thuis doe je dit samen met een volwassene, altijd.' },
  ],
  homeRecipe: { introduction: 'Tien muffins, gebaseerd op het recept van Inspired Taste. De melkhoeveelheid hangt af van het ei; de virtuele keuken gebruikt een vaste spelmaat, geen universele omrekening.',
    steps: ['Verwarm met hulp de oven voor op 200 °C. Zet tien papieren vormpjes in de bakvorm.', 'Meng bloem, 150 g suiker, bakpoeder en zout.', 'Doe de olie en het ei in een maatbeker. Vul met melk aan tot 1 Amerikaanse cup (ongeveer 237 ml). Roer de vanille erdoor.', 'Meng nat en droog kort en schep de bessen voorzichtig door het beslag.', 'Verdeel over tien vormpjes, bijna tot de rand. Strooi eventueel de extra suiker erover.', 'Bak 15–20 minuten. De bovenkant is niet meer nat; aan een prikker mogen kruimels zitten maar geen rauw beslag.', 'Laat afkoelen op een rooster.'],
    safety: 'Was je handen na rauw ei. Proef geen rauw beslag of rauwe bloem. Een volwassene helpt bij de hete oven en bakvorm.', servingTip: 'Verse of nog bevroren bessen kunnen in het beslag. Laat muffins afkoelen voor je proeft.', allergens: ['Tarwe (gluten)', 'Ei', 'Melk'], extraEquipment: ['Papieren muffinvormpjes', 'Afkoelrooster', 'Prikker'] },
};
