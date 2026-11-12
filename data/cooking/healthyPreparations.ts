import { ASSET_LIBRARY } from '../assetLibrary';
import type { CookingStepConfig, OvenConfig, PreparationConfig } from './preparation';
import type { EquipmentItem, MathChallengeConfig, RecipeConfig } from './types';

const map = '/assets/library/cooking/healthy/';
export const GEZONDE_ASSETS = {
  pasta: map + 'wholewheat-pasta.webp', rijst: map + 'brown-rice.webp', kikkererwten: map + 'chickpeas.webp',
  pastagerecht: map + 'wholewheat-vegetable-pasta.webp', rijstgerecht: map + 'brown-rice-chickpeas.webp', omelet: map + 'vegetable-omelette.webp', haver: map + 'apple-oat-bake.webp', gareHaver: map + 'apple-oat-cooked.webp',
  kookpan: map + 'stockpot.webp', snijplank: map + 'prep-board.webp', ovenschaal: map + 'baking-dish.webp', groentepan: map + 'vegetable-pan.webp',
  rauweOmelet: map + 'omelette-raw.webp', rauweHaver: map + 'oat-bake-raw.webp', pastapan: map + 'pasta-pot.webp', rijstpan: map + 'rice-pot.webp',
};
const a = GEZONDE_ASSETS;
const k = ASSET_LIBRARY.cooking.kit;
const product = (id: string) => `/games/shop/products/${id}.webp`;
export const GEZONDE_SPULLEN: EquipmentItem[] = [
  { id: 'stockpot', name: 'Kookpan', image: a.kookpan, contentStatus: 'ready', permanent: true },
  { id: 'prep-board', name: 'Snijplank en mes', image: a.snijplank, contentStatus: 'ready', permanent: true },
  { id: 'baking-dish', name: 'Ovenschaal', image: a.ovenschaal, contentStatus: 'ready', permanent: true },
];
const spullen = {
  bowl: { label: 'Mengkom', asset: k.bowlEmpty }, fork: { label: 'Vork', asset: k.fork }, pan: { label: 'Koekenpan', asset: k.panEmpty },
  spatula: { label: 'Spatel', asset: k.spatula }, spoon: { label: 'Lepel', asset: k.spoon }, scale: { label: 'Weegschaal', asset: k.scale },
  'measuring-jug': { label: 'Maatbeker', asset: '/assets/library/cooking/baking/measuring-jug.webp' },
  'stockpot': { label: 'Kookpan', asset: a.kookpan }, 'prep-board': { label: 'Snijplank en mes', asset: a.snijplank }, 'baking-dish': { label: 'Ovenschaal', asset: a.ovenschaal },
};
const basis = { station: 'worktop' as const, target: 1 };
const klaarleggen = (ids: string[]): CookingStepConfig => ({ ...basis, id: 'tools', title: 'Leg alles klaar', instruction: 'Tik de spullen aan die je nodig hebt.', mechanic: 'collect', asset: k.bowlEmpty, target: ids.length, tools: ids.map(id => ({ id, ...spullen[id as keyof typeof spullen] })) });
const tik = (id: string, title: string, instruction: string, asset: string, target = 3, tool?: { asset: string; label: string }): CookingStepConfig => ({ ...basis, id, title, instruction, asset, target, mechanic: 'repeat', tapLabel: tool ? `Tik op de ${tool.label.toLowerCase()}` : 'Tik op het plaatje', ...(tool ? { tapTool: tool } : {}), ...(id === 'fry' ? { station: 'cooktop', cooktop: { kind: 'stir', contents: 'pepper', panAsset: k.panEmpty } } : {}) });
const sleep = (id: string, title: string, instruction: string, asset: string, sourceLabel: string, label: string, targetAsset?: string): CookingStepConfig => {
  const ingredient = sourceLabel.toLowerCase().includes('paprika') ? 'pepper' : sourceLabel.toLowerCase().includes('tomat') ? 'tomato' : undefined;
  const inPan = ingredient && label.toLowerCase().includes('pan');
  return { ...basis, id, title, instruction, asset, mechanic: 'drag', dropTarget: { sourceLabel, label, asset: targetAsset },
    ...(inPan ? { station: 'cooktop', cooktop: { kind: 'add', ingredient, panAsset: k.panEmpty, ...(targetAsset === a.groentepan ? { contents: 'pepper' as const } : {}) } } : {}) };
};
const weeg = (id: string, title: string, target: number, asset: string): CookingStepConfig => ({ ...basis, id, title, instruction: `Weeg precies ${target} gram af.`, target, asset, mechanic: 'weigh', unit: 'gram', increments: [5, 25, 50], maximum: target + 100 });
const meet = (id: string, title: string, target: number, asset: string, liquid: 'oil' | 'milk'): CookingStepConfig => ({ ...basis, id, title, instruction: `Meet ${target} ml af in de maatbeker.`, target, asset, mechanic: 'measure', vessel: 'jug', vesselAsset: spullen['measuring-jug'].asset, increments: target <= 10 ? [5] : [10, 50], maximum: target + 50, unitLabel: 'ml', liquid });
const verwarm = (id: string, title: string, instruction: string, panAsset: string = k.panEmpty, olie = true, stand = 2): CookingStepConfig => ({ ...basis, id, title, instruction, station: 'cooktop', mechanic: 'heat', asset: panAsset, target: stand, addition: olie ? { asset: product('olive-oil'), label: 'Doe de olie in de pan', kind: 'oil' } : { asset: spullen['measuring-jug'].asset, label: 'Doe water in de kookpan', kind: 'water' }, levels: [{ value: 1, label: 'Laag' }, { value: 2, label: 'Middel' }, { value: 3, label: 'Hoog' }], buttonLabel: 'Verwarm de pan', hint: 'Thuis helpt een volwassene bij het fornuis.' });
const wacht = (id: string, title: string, instruction: string, asset: string, cookedAsset: string, startLabel: string, finishLabel: string): CookingStepConfig => ({ ...basis, id, title, instruction, station: 'cooktop', mechanic: 'timed', target: 3, durationMs: 4000, asset, pouredAsset: asset, cookedAsset, startLabel, finishLabel, presentation: 'whole', ...(id === 'sauce' ? { cooktop: { kind: 'simmer', contents: 'vegetables', panAsset: k.panEmpty } } : {}), hint: 'De wachttijd in het spel is korter. Volg thuis de tijd in het recept of op de verpakking.' });
const serveer = (asset: string) => sleep('serve', 'Serveer voor twee', 'Verdeel over twee porties. Thuis controleert een volwassene of het eten niet te heet is.', asset, 'Gerecht', 'Serveerplek');

const pastaTools = ['stockpot', 'pan', 'spatula', 'prep-board', 'scale', 'measuring-jug'];
const rijstTools = pastaTools;
const eiTools = ['bowl', 'fork', 'pan', 'spatula', 'prep-board', 'scale', 'measuring-jug'];
const haverTools = ['bowl', 'spoon', 'baking-dish', 'prep-board', 'scale', 'measuring-jug'];
export const HAVER_OVEN: OvenConfig = { targetTemperature: 180, minimumMinutes: 25, maximumMinutes: 30, temperatureTolerance: 15, preheatDegreesPerSecond: 24, gameSecondsPerMinute: .4, coolingSeconds: 5, minimumTemperature: 100, maximumTemperature: 260, temperatureStep: 5, minimumSelectableMinutes: 5, maximumSelectableMinutes: 40 };
const oven = (id: string, action: 'preheat' | 'bake' | 'cool', title: string, instruction: string): CookingStepConfig => ({ ...basis, id, action, title, instruction, station: 'oven', mechanic: 'oven', oven: HAVER_OVEN, asset: a.ovenschaal, panAsset: a.ovenschaal, resultAsset: a.gareHaver, rawAsset: a.rauweHaver, portions: 1, trayKind: 'dish' });
const configuratie = (steps: CookingStepConfig[], finishedAsset: string, finishedAlt: string): PreparationConfig => ({ version: 1, consumption: 'on-completion', steps, finishedAsset, finishedAlt });

export const GEZONDE_BEREIDINGEN: Record<string, { spullen: string[]; bereiding: PreparationConfig; weegIngredient: string; gewicht: number }> = {
  'wholewheat-vegetable-pasta': { spullen: pastaTools, weegIngredient: 'wholewheat-pasta', gewicht: 150, bereiding: configuratie([
    klaarleggen(pastaTools),
    tik('wash', 'Was de groenten', 'Was je handen, vier tomaten en één paprika. Tik om ze schoon te maken.', product('tomato'), 4),
    sleep('pepper-board', 'Leg de paprika klaar', 'Leg de gewassen paprika op de snijplank.', product('pepper'), 'Paprika', 'Snijplank', a.snijplank),
    tik('chop', 'Snijd de groenten', 'Haal steel en zaadjes uit de paprika. Snijd paprika en tomaten klein, thuis met hulp van een volwassene.', a.snijplank, 4),
    weeg('pasta', 'Weeg de volkoren pasta', 150, a.pasta),
    verwarm('water', 'Verwarm het kookwater', 'Laat thuis een volwassene ongeveer 1 liter water aan de kook brengen.', a.kookpan, false, 3),
    sleep('add-pasta', 'Pasta in de kookpan', 'Doe de afgewogen volkoren pasta voorzichtig in het kokende water.', a.pasta, 'Volkoren pasta', 'Kookpan', a.kookpan),
    wacht('boil', 'Kook de pasta', 'Volg de kooktijd op de verpakking. Laat een volwassene helpen met afgieten.', a.pastapan, a.pastapan, 'Start koken', 'Laat de pasta afgieten'),
    meet('oil', 'Meet de olijfolie', 10, product('olive-oil'), 'oil'),
    verwarm('heat', 'Verwarm de koekenpan', 'Doe de afgemeten olie in de pan en kies middelhoog vuur.'),
    sleep('add-pepper', 'Paprika in de pan', 'Bak de stukjes paprika thuis ongeveer 5 minuten.', product('pepper'), 'Gesneden paprika', 'Koekenpan', k.panEmpty),
    tik('fry', 'Roer de paprika', 'Roer de paprika regelmatig om. Zo wordt hij gelijkmatig zacht.', product('pepper'), 4, spullen.spatula),
    sleep('add-tomato', 'Tomaten erbij', 'Voeg de vier gesneden tomaten toe.', product('tomato'), 'Gesneden tomaten', 'Groentepan', a.groentepan),
    wacht('sauce', 'Laat de saus pruttelen', 'Laat de tomaten thuis ongeveer 10 minuten zacht pruttelen. Voeg zo nodig een scheutje water toe.', a.groentepan, a.groentepan, 'Laat pruttelen', 'De saus is zacht'),
    weeg('chickpeas', 'Weeg de kikkererwten', 200, a.kikkererwten),
    sleep('add-chickpeas', 'Kikkererwten erbij', 'Gebruik gare kikkererwten uit blik of pot. Spoel ze eerst af en laat ze uitlekken.', a.kikkererwten, 'Gare kikkererwten', 'Saus', a.groentepan),
    tik('mix', 'Meng pasta en saus', 'Verwarm de kikkererwten thuis nog 3 minuten in de saus. Schep dan de gare pasta erdoor.', a.pastagerecht, 4, spullen.spatula),
    serveer(a.pastagerecht),
  ], a.pastagerecht, 'Volkoren pasta met tomaat, paprika en kikkererwten') },
  'brown-rice-chickpeas': { spullen: rijstTools, weegIngredient: 'brown-rice', gewicht: 150, bereiding: configuratie([
    klaarleggen(rijstTools),
    tik('wash', 'Was de groenten', 'Was je handen, één paprika en de spinazie. Verwijder de steel en zaadjes uit de paprika.', product('pepper'), 3),
    tik('chop', 'Snijd de paprika', 'Snijd de paprika in kleine blokjes. Thuis helpt een volwassene met het mes.', a.snijplank, 4),
    weeg('rice', 'Weeg de zilvervliesrijst', 150, a.rijst),
    verwarm('water', 'Verwarm het kookwater', 'Lees op de verpakking hoeveel water nodig is. Thuis brengt een volwassene het water aan de kook.', a.kookpan, false, 3),
    sleep('add-rice', 'Rijst in de kookpan', 'Voeg de afgewogen rijst toe aan het water.', a.rijst, 'Zilvervliesrijst', 'Kookpan', a.kookpan),
    wacht('boil', 'Kook de rijst', 'Volg thuis de kooktijd op de verpakking. Laat een volwassene de rijst zo nodig afgieten.', a.rijstpan, a.rijstpan, 'Start koken', 'De rijst is gaar'),
    weeg('chickpeas', 'Weeg de kikkererwten', 200, a.kikkererwten),
    tik('rinse', 'Spoel de kikkererwten', 'Gebruik gare kikkererwten uit blik of pot. Spoel af en laat uitlekken.', a.kikkererwten, 3),
    meet('oil', 'Meet de olijfolie', 10, product('olive-oil'), 'oil'),
    verwarm('heat', 'Verwarm de koekenpan', 'Doe de olie in de pan en kies middelhoog vuur.'),
    sleep('pepper', 'Paprika in de pan', 'Voeg de gesneden paprika toe. Bak thuis ongeveer 5 minuten.', product('pepper'), 'Paprikablokjes', 'Koekenpan', k.panEmpty),
    weeg('spinach', 'Weeg de spinazie', 200, product('spinach')),
    sleep('add-spinach', 'Spinazie erbij', 'Doe de gewassen spinazie in kleine handjes bij de paprika.', product('spinach'), 'Spinazie', 'Koekenpan', k.panEmpty),
    tik('stir', 'Laat de spinazie slinken', 'Roer tot de blaadjes kleiner en zacht worden.', product('spinach'), 4, spullen.spatula),
    sleep('add-chickpeas', 'Kikkererwten erbij', 'Doe de uitgelekte kikkererwten bij de groenten. Verwarm thuis nog 3 minuten.', a.kikkererwten, 'Kikkererwten', 'Koekenpan', k.panEmpty),
    tik('mix', 'Schep de rijst erdoor', 'Meng de gare rijst met de warme groenten en kikkererwten.', a.rijstgerecht, 4, spullen.spatula),
    serveer(a.rijstgerecht),
  ], a.rijstgerecht, 'Zilvervliesrijst met paprika, spinazie en kikkererwten') },
  'vegetable-omelette': { spullen: eiTools, weegIngredient: 'spinach', gewicht: 100, bereiding: configuratie([
    klaarleggen(eiTools),
    tik('wash', 'Was de groenten', 'Was je handen, twee tomaten en de spinazie.', product('tomato'), 3),
    tik('chop', 'Snijd de tomaten', 'Vraag thuis hulp bij het in kleine stukjes snijden.', a.snijplank, 4),
    weeg('spinach', 'Weeg de spinazie', 100, product('spinach')),
    { ...basis, id: 'eggs', title: 'Breek vier eieren', instruction: 'Breek vier eieren in de kom. Haal stukjes schaal eruit en was je handen na rauw ei.', mechanic: 'repeat', target: 4, asset: k.bowlEmpty, vesselByCount: [k.bowlEmpty, k.bowlEggs], tapTool: { asset: k.egg, label: 'Ei' }, tapLabel: 'Tik op het ei' },
    tik('beat', 'Klop de eieren', 'Klop de eieren met de vork door elkaar.', k.bowlEggs, 4, spullen.fork),
    meet('oil', 'Meet de olijfolie', 10, product('olive-oil'), 'oil'),
    verwarm('heat', 'Verwarm de pan', 'Doe de olie in de pan en kies middelhoog vuur.'),
    sleep('tomato', 'Tomaten in de pan', 'Voeg de stukjes tomaat toe. Bak thuis ongeveer 3 minuten.', product('tomato'), 'Tomatenstukjes', 'Koekenpan', k.panEmpty),
    sleep('add-spinach', 'Spinazie erbij', 'Voeg de gewassen spinazie toe.', product('spinach'), 'Spinazie', 'Koekenpan', k.panEmpty),
    tik('stir', 'Roer de groenten', 'Roer tot de spinazie is geslonken.', product('spinach'), 3, spullen.spatula),
    sleep('pour', 'Schenk het ei erbij', 'Verdeel de groenten over de pan. Schenk het geklopte ei erbij.', k.bowlEggs, 'Geklopte eieren', 'Koekenpan', k.panEmpty),
    { ...basis, id: 'low', title: 'Zet het vuur laag', instruction: 'Laat de omelet rustig gaar worden. Leg thuis een deksel op de pan.', station: 'cooktop', mechanic: 'heat', asset: a.rauweOmelet, target: 1, addition: { asset: a.rauweOmelet, label: 'Omelet staat klaar', kind: 'ready' }, levels: [{ value: 1, label: 'Laag' }, { value: 2, label: 'Middel' }, { value: 3, label: 'Hoog' }], buttonLabel: 'Laat rustig garen' },
    wacht('cook', 'Bak de omelet gaar', 'Thuis duurt dit ongeveer 8–10 minuten op laag vuur. Een volwassene controleert of het ei ook bovenop helemaal gestold is.', a.rauweOmelet, a.omelet, 'Start bakken', 'Het ei is helemaal gestold'),
    serveer(a.omelet),
  ], a.omelet, 'Een gare omelet met tomaat en spinazie') },
  'apple-oat-bake': { spullen: haverTools, weegIngredient: 'oats', gewicht: 80, bereiding: configuratie([
    oven('preheat', 'preheat', 'Verwarm de oven voor', 'Stel de oven in op 180 °C. Thuis helpt een volwassene.'),
    klaarleggen(haverTools),
    tik('wash', 'Was de appels', 'Was je handen en twee appels. Laat de schil zitten.', product('apple'), 2),
    tik('chop', 'Snijd de appels', 'Haal de klokhuizen eruit. Snijd de appels met hulp in kleine blokjes.', a.snijplank, 4),
    weeg('oats', 'Weeg de havermout', 80, product('oats')),
    sleep('add-oats', 'Havermout in de kom', 'Doe de 80 gram havermout in de mengkom.', product('oats'), 'Havermout', 'Mengkom', k.bowlEmpty),
    meet('milk', 'Meet de melk', 200, product('milk'), 'milk'),
    sleep('add-milk', 'Melk erbij', 'Schenk 200 ml halfvolle melk bij de havermout.', product('milk'), 'Halfvolle melk', 'Mengkom', k.bowlEmpty),
    sleep('add-apple', 'Appelstukjes erbij', 'Doe de blokjes van twee appels bij de havermout.', product('apple'), 'Appelblokjes', 'Mengkom', k.bowlEmpty),
    tik('mix', 'Roer alles door elkaar', 'Roer tot de melk, appel en havermout goed gemengd zijn.', a.rauweHaver, 4, spullen.spoon),
    sleep('fill', 'Vul de ovenschaal', 'Schep het mengsel in de ovenschaal.', a.rauweHaver, 'Havermoutmengsel', 'Ovenschaal', a.ovenschaal),
    oven('bake', 'bake', 'Bak de appel-havermout', 'Bak op 180 °C, thuis ongeveer 25 minuten. De havermout moet zacht zijn.'),
    oven('cool', 'cool', 'Laat de schaal afkoelen', 'Een volwassene haalt de hete schaal met ovenwanten uit de oven. Laat thuis minstens 5 minuten afkoelen.'),
    meet('yogurt', 'Meet de yoghurt', 150, product('yogurt'), 'milk'),
    sleep('add-yogurt', 'Yoghurt erbij', 'Schep de naturel yoghurt bij de afgekoelde havermout.', product('yogurt'), 'Naturel yoghurt', 'Appel-havermout', a.haver),
    serveer(a.haver),
  ], a.haver, 'Gebakken appel-havermout met naturel yoghurt') },
};

export function maakGezondAvontuur(recept: RecipeConfig): RecipeConfig {
  const config = GEZONDE_BEREIDINGEN[recept.id];
  const math: MathChallengeConfig[] = [
    { id: `${recept.id}-weigh`, recipeId: recept.id, type: 'interactive-weighing', title: 'Hoeveel weeg je af?', instruction: `Weeg ${config.gewicht} gram af.`, learningObjective: 'Grammen afmeten', difficulty: 1, ingredientId: config.weegIngredient, targetGrams: config.gewicht, increments: [5, 25, 50], rewardCoins: 5, successFeedback: `Precies ${config.gewicht} gram!` },
    { id: `${recept.id}-double`, recipeId: recept.id, type: 'recipe-scaling', title: 'Koken voor vier', instruction: 'Dit recept is voor twee. Hoeveel heb je nodig voor vier?', learningObjective: 'Een recept verdubbelen', difficulty: 2, baseServings: 2, targetServings: 4, quantities: [{ ingredientId: config.weegIngredient, base: config.gewicht, target: config.gewicht * 2, step: 5, unit: 'g' }], rewardCoins: 5, successFeedback: 'Voor twee keer zoveel mensen gebruik je twee keer zoveel.' },
    { id: `${recept.id}-order`, recipeId: recept.id, type: 'sequence-ordering', title: 'Wat komt eerst?', instruction: 'Zet deze kookstappen in de goede volgorde.', learningObjective: 'Voorbereiden, afmeten en bereiden', difficulty: 1,
      actions: [{ id: 'wash', label: 'Was je handen en groenten of fruit', assetId: recept.ingredients.find(item => item.unit === 'piece' && item.ingredientId !== 'eggs')!.ingredientId }, { id: 'weigh', label: `Weeg ${config.gewicht} gram af`, assetId: config.weegIngredient }, { id: 'cook', label: recept.category === 'baking' ? 'Bak in de oven' : 'Maak het gerecht gaar', assetId: recept.category === 'baking' ? 'baking-dish' : 'pan' }, { id: 'serve', label: 'Verdeel over twee porties', assetId: 'spoon' }], initialOrder: ['serve', 'cook', 'wash', 'weigh'], rewardCoins: 5, successFeedback: 'Eerst voorbereiden, dan koken, daarna serveren.' },
  ];
  const vezels = recept.id === 'vegetable-omelette' ? ['protein', 'fiber', 'iron', 'fats'] : recept.id === 'apple-oat-bake' ? ['carbohydrates', 'fiber', 'calcium', 'protein'] : ['carbohydrates', 'fiber', 'protein', 'iron'];
  return { ...recept, availability: 'playable', rewardCoins: 15, image: config.bereiding.finishedAsset, equipmentIds: config.spullen, preparation: config.bereiding, education: { math, nutrientMemory: { enabled: true, activityId: `${recept.id}-nutrients-v1`, nutrientIds: vezels, pairCount: 4 } },
    cookingTips: (recept.homeRecipe?.nutrition ?? []).map((tip, index) => ({ id: `${recept.id}-nutrition-${index}`, character: 'coco', triggerStepId: index === 0 ? config.weegIngredient === 'wholewheat-pasta' ? 'pasta' : config.weegIngredient === 'brown-rice' ? 'rice' : config.weegIngredient : recept.id === 'vegetable-omelette' ? 'stir' : 'mix', displayMode: 'contextual', title: tip.title, text: tip.text })),
    homeRecipe: recept.homeRecipe ? { ...recept.homeRecipe, extraEquipment: recept.homeRecipe.extraEquipment?.filter(naam => !['Kookpan', 'Mes', 'Snijplank', 'Kleine ovenschaal'].includes(naam)) } : undefined,
  };
}
