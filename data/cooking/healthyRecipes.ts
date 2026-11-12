import { GEZONDE_ASSETS, maakGezondAvontuur } from './healthyPreparations';
import type { IngredientEntry, RecipeConfig } from './types';

const bronVezels = { title: 'Voedingscentrum: vezels', url: 'https://www.voedingscentrum.nl/encyclopedie/vezels.aspx' };
const bronPeulvruchten = { title: 'Voedingscentrum: peulvruchten', url: 'https://www.voedingscentrum.nl/encyclopedie/peulvruchten.aspx' };

export const GEZONDE_INGREDIENTEN: IngredientEntry[] = [
  { id: 'wholewheat-pasta', name: 'Volkoren pasta', image: GEZONDE_ASSETS.pasta, origin: 'Pasta wordt van gemalen graan en water gemaakt. Voor volkoren pasta wordt de hele graankorrel gebruikt.', nutrients: ['Koolhydraten', 'Vezels'], nutrientIds: ['carbohydrates', 'fiber'], facts: ['Volkoren pasta bevat meer vezels dan witte pasta. Vezels helpen je darmen goed te werken.'] },
  { id: 'brown-rice', name: 'Zilvervliesrijst', image: GEZONDE_ASSETS.rijst, origin: 'Rijst groeit aan een grasplant. Bij zilvervliesrijst blijft het vliesje om de korrel zitten.', nutrients: ['Koolhydraten', 'Vezels'], nutrientIds: ['carbohydrates', 'fiber'], facts: ['In het vliesje zitten vezels. Daarom kiezen we zilvervliesrijst in plaats van witte rijst.'] },
  { id: 'chickpeas', name: 'Kikkererwten', image: GEZONDE_ASSETS.kikkererwten, origin: 'Kikkererwten groeien in peulen aan een plant.', nutrients: ['Eiwitten', 'Vezels', 'IJzer'], nutrientIds: ['protein', 'fiber', 'iron'], facts: ['Kikkererwten leveren plantaardige eiwitten: bouwstoffen voor je lichaam. Gebruik voor deze recepten gare kikkererwten uit blik of pot.'] },
  { id: 'tomato', name: 'Tomaat', image: '/games/shop/products/tomato.webp', origin: 'Tomaten groeien aan planten, in Nederland vaak in een kas.', nutrients: ['Vitamine C', 'Vezels'], nutrientIds: ['vitamin-c', 'fiber'], facts: ['Tomaat brengt kleur en smaak in een groentesaus.'] },
  { id: 'pepper', name: 'Paprika', image: '/games/shop/products/pepper.webp', origin: 'Paprika groeit aan een plant en heeft zaadjes binnenin.', nutrients: ['Vitamine C', 'Vezels'], nutrientIds: ['vitamin-c', 'fiber'], facts: ['Vitamine C helpt je lichaam ijzer uit plantaardig eten op te nemen.'] },
  { id: 'spinach', name: 'Spinazie', image: '/games/shop/products/spinach.webp', origin: 'Van de spinazieplant eten we de bladeren.', nutrients: ['Vezels', 'IJzer'], nutrientIds: ['fiber', 'iron'], facts: ['IJzer helpt bij het vervoer van zuurstof in je bloed. Wissel verschillende groenten af.'] },
  { id: 'apple', name: 'Appel', image: '/games/shop/products/apple.webp', origin: 'Appels groeien aan bomen, ook in Nederland.', nutrients: ['Vezels', 'Koolhydraten'], nutrientIds: ['fiber', 'carbohydrates'], facts: ['Was een appel en laat de schil zitten: ook daarin zitten vezels.'] },
  { id: 'olive-oil', name: 'Olijfolie', image: '/games/shop/products/olive-oil.webp', origin: 'Olijfolie wordt uit olijven geperst.', nutrients: ['Vetten'], nutrientIds: ['fats'], facts: ['Olijfolie bevat vooral onverzadigde vetten. Vetten leveren energie en helpen je lichaam sommige vitamines op te nemen.'] },
].map(item => ({ ...item, contentStatus: 'ready', productionRegions: [], season: null }));

const hoeveelheid = (ingredientId: string, amount: number, unit: 'gram' | 'piece' | 'milliliter', displayAmount: string) => ({ ingredientId, amount, unit, displayAmount });
const avontuur = (recept: Pick<RecipeConfig, 'id' | 'name' | 'category' | 'shortDescription' | 'preparationMinutes' | 'image' | 'ingredients' | 'equipmentIds' | 'homeRecipe'>): RecipeConfig => maakGezondAvontuur({
  ...recept, availability: 'playable', contentStatus: 'ready', requiredCompletedRecipes: 0, level: 1, servings: 2,
  challenges: [], shoppingRequirements: [], actions: [], rewardCoins: null,
});

export const GEZONDE_RECEPTEN: RecipeConfig[] = [
  avontuur({
    id: 'wholewheat-vegetable-pasta', name: 'Volkoren pasta met groentesaus', category: 'cooking', image: '/games/shop/products/tomato.webp',
    shortDescription: 'Volkoren pasta met tomaat, paprika en kikkererwten.', preparationMinutes: 25, equipmentIds: ['pan', 'spatula'],
    ingredients: [hoeveelheid('wholewheat-pasta', 150, 'gram', '150 g droge volkoren pasta'), hoeveelheid('tomato', 4, 'piece', '4 tomaten'), hoeveelheid('pepper', 1, 'piece', '1 paprika'), hoeveelheid('chickpeas', 200, 'gram', '200 g gare kikkererwten, uitgelekt, zonder toegevoegd zout'), hoeveelheid('olive-oil', 10, 'milliliter', '10 ml olijfolie')],
    homeRecipe: {
      introduction: 'Een warme maaltijd met volkoren granen, groente en peulvruchten. Kook samen met een volwassene.', extraEquipment: ['Kookpan', 'Vergiet', 'Mes', 'Snijplank'],
      steps: ['Was je handen en was de tomaten en paprika. Vraag hulp bij het snijden: snijd de tomaten klein en de paprika zonder steel en zaadjes in blokjes.', 'Laat een volwassene water in de kookpan aan de kook brengen. Kook 150 g volkoren pasta volgens de verpakking.', 'Spoel de gare kikkererwten in een vergiet en laat uitlekken. Weeg daarna 200 g af.', 'Verwarm 10 ml olijfolie in de koekenpan op middelhoog vuur. Bak de paprika ongeveer 5 minuten en roer regelmatig.', 'Voeg de tomaten toe. Laat ongeveer 10 minuten zacht pruttelen tot een saus. Voeg zo nodig een scheutje water toe.', 'Roer de kikkererwten door de saus en verwarm nog 3 minuten. Laat een volwassene de pasta afgieten en meng met de saus.'],
      safety: 'Een volwassene helpt met snijden, het fornuis en afgieten. Kokend water en stoom zijn heet.', servingTip: 'Proef de saus eerst zonder extra zout. Een beetje gedroogde oregano kan erbij.', optionalIngredients: ['Gedroogde oregano'], allergens: ['Tarwe (gluten)'],
      nutrition: [{ title: 'Waarom volkoren?', text: 'Volkoren pasta wordt van de hele graankorrel gemaakt. Daardoor bevat hij meer vezels dan witte pasta. Vezels helpen je darmen goed te werken.' }, { title: 'Bouwstoffen uit planten', text: 'Kikkererwten leveren eiwitten. Je lichaam gebruikt eiwitten voor groei en herstel.' }], sources: [bronVezels, bronPeulvruchten],
    },
  }),
  avontuur({
    id: 'brown-rice-chickpeas', name: 'Zilvervliesrijst met kikkererwten', category: 'cooking', image: '/games/shop/products/pepper.webp',
    shortDescription: 'Rijst met paprika, spinazie en kikkererwten.', preparationMinutes: 30, equipmentIds: ['pan', 'spatula'],
    ingredients: [hoeveelheid('brown-rice', 150, 'gram', '150 g droge zilvervliesrijst'), hoeveelheid('chickpeas', 200, 'gram', '200 g gare kikkererwten, uitgelekt, zonder toegevoegd zout'), hoeveelheid('pepper', 1, 'piece', '1 paprika'), hoeveelheid('spinach', 200, 'gram', '200 g verse spinazie'), hoeveelheid('olive-oil', 10, 'milliliter', '10 ml olijfolie')],
    homeRecipe: {
      introduction: 'Een kleurrijke rijstkom voor twee. Gebruik gare kikkererwten uit blik of pot.', extraEquipment: ['Kookpan', 'Vergiet', 'Mes', 'Snijplank'],
      steps: ['Was je handen. Laat een volwassene 150 g zilvervliesrijst koken volgens de verpakking.', 'Was de paprika en spinazie. Verwijder steel en zaadjes uit de paprika en vraag hulp bij het in blokjes snijden.', 'Spoel de kikkererwten en laat uitlekken. Weeg 200 g af.', 'Verwarm 10 ml olijfolie in de koekenpan. Bak de paprika ongeveer 5 minuten op middelhoog vuur.', 'Voeg de spinazie in kleine handjes toe. Roer tot de blaadjes geslonken zijn. Voeg de kikkererwten toe en verwarm nog ongeveer 3 minuten.', 'Laat een volwassene de rijst zo nodig afgieten. Meng met de groenten en verdeel over twee kommen.'],
      safety: 'Vraag hulp bij messen, hete pannen en afgieten. Eet de rijst na het koken meteen.', servingTip: 'Een beetje komijn geeft extra smaak, zonder extra zout.', optionalIngredients: ['Gemalen komijn'], allergens: ['Controleer de verpakking van de kikkererwten op allergenen en sporen.'],
      nutrition: [{ title: 'Het vliesje blijft zitten', text: 'Zilvervliesrijst bevat meer vezels dan witte rijst. Die vezels ondersteunen de werking van je darmen.' }, { title: 'Een peul vol bouwstoffen', text: 'Kikkererwten zijn peulvruchten. Ze leveren eiwitten en vezels. Zo leer je ook koken met plantaardige bouwstoffen.' }], sources: [bronVezels, bronPeulvruchten],
    },
  }),
  avontuur({
    id: 'vegetable-omelette', name: 'Groenteomelet', category: 'cooking', image: '/games/shop/products/eggs.webp', shortDescription: 'Een zachte omelet met tomaat en spinazie.', preparationMinutes: 15, equipmentIds: ['bowl', 'fork', 'pan', 'spatula'],
    ingredients: [hoeveelheid('eggs', 4, 'piece', '4 eieren'), hoeveelheid('tomato', 2, 'piece', '2 tomaten'), hoeveelheid('spinach', 100, 'gram', '100 g verse spinazie'), hoeveelheid('olive-oil', 10, 'milliliter', '10 ml olijfolie')],
    homeRecipe: {
      introduction: 'Een lunch met twee soorten groente. Lekker om samen te maken.', extraEquipment: ['Mes', 'Snijplank', 'Deksel voor de koekenpan'],
      steps: ['Was je handen en was de tomaten en spinazie. Vraag hulp bij het in kleine stukjes snijden van de tomaten.', 'Breek 4 eieren boven de kom, verwijder eventuele schaal en klop met een vork. Was je handen na het aanraken van rauw ei.', 'Verwarm 10 ml olijfolie in de pan. Bak de tomaten ongeveer 3 minuten en voeg de spinazie toe. Roer tot de blaadjes zijn geslonken.', 'Verdeel de groenten over de pan en schenk het ei erbij. Zet het vuur laag en leg een passend deksel op de pan.', 'Laat ongeveer 8 tot 10 minuten rustig garen. Laat een volwassene controleren of het ei helemaal gestold is, ook bovenop. Is het nog vloeibaar, bak dan langer.', 'Verdeel met een spatel in twee stukken en serveer meteen.'],
      safety: 'Vraag hulp bij het snijden en de hete pan. Proef geen rauw ei. Bak de omelet helemaal gaar.', servingTip: 'Serveer als lunch, eventueel met een snee volkorenbrood per persoon.', optionalIngredients: ['2 sneetjes volkorenbrood (bevat tarwe/gluten)'], allergens: ['Ei'],
      nutrition: [{ title: 'Waarvoor zijn eiwitten?', text: 'Eieren leveren eiwitten. Dat zijn bouwstoffen die je lichaam gebruikt om te groeien en te herstellen.' }, { title: 'Groente erbij', text: 'Met tomaat en spinazie eet je ook groente bij de lunch. Groenten leveren vezels. Varieer met verschillende soorten.' }], sources: [bronVezels],
    },
  }),
  avontuur({
    id: 'apple-oat-bake', name: 'Appel-havermout uit de oven', category: 'baking', image: '/games/shop/products/apple.webp', shortDescription: 'Een warm ontbijt met appel, havermout en naturel yoghurt.', preparationMinutes: 35, equipmentIds: ['bowl', 'spoon'],
    ingredients: [hoeveelheid('apple', 2, 'piece', '2 appels'), hoeveelheid('oats', 80, 'gram', '80 g havermout'), hoeveelheid('milk', 200, 'milliliter', '200 ml halfvolle melk'), hoeveelheid('yogurt', 150, 'milliliter', '150 ml halfvolle naturel yoghurt')],
    homeRecipe: {
      introduction: 'Een zacht havermoutontbijt voor twee. Het fruit geeft smaak; je hoeft geen suiker toe te voegen.', extraEquipment: ['Kleine ovenschaal', 'Mes', 'Snijplank', 'Ovenwanten', 'Oven'],
      steps: ['Was je handen. Laat een volwassene de oven voorverwarmen op 180 °C (boven- en onderwarmte).', 'Was de appels. Laat de schil zitten, verwijder de klokhuizen en vraag hulp bij het in kleine blokjes snijden.', 'Meng 80 g havermout, 200 ml halfvolle melk en de appelblokjes in een kom. Doe alles in een kleine ovenschaal.', 'Laat een volwassene de schaal in de oven zetten. Bak ongeveer 25 minuten, tot de havermout zacht is en de melk is opgenomen. Is het nog droog of stevig, voeg dan een scheutje water toe en bak iets langer.', 'Laat een volwassene de schaal met ovenwanten uit de oven halen. Laat minstens 5 minuten afkoelen en controleer of het niet te heet is.', 'Verdeel over twee kommen en schep de naturel yoghurt erbij.'],
      safety: 'Een volwassene helpt met het mes, de oven en de hete ovenschaal. Laat afkoelen voor je proeft.', servingTip: 'Een snufje kaneel past goed bij warme appel. Gebruik naturel yoghurt zonder toegevoegde suiker.', optionalIngredients: ['Een snufje kaneel'], allergens: ['Melk', 'Haver: controleer de verpakking op gluten'],
      nutrition: [{ title: 'Vezels in je ontbijt', text: 'Havermout en appels leveren vezels. Ook de appelschil bevat vezels. Daarom wassen we de appel en laten we de schil zitten.' }, { title: 'Zoet door fruit', text: 'Appel geeft dit ontbijt een zoete smaak. Extra suiker of honing is niet nodig.' }], sources: [bronVezels],
    },
  }),
];
