import type { RecipeConfig } from './types';

const bron = { title: 'Voedingscentrum: seizoensgroente en -fruit uit Nederland', url: 'https://www.voedingscentrum.nl/seizoensgroente' };
type Thuisrecept = { id: string; name: string; category: RecipeConfig['category']; minutes: number; image: string; months: number[]; season: string; ingredients: string[]; equipment: string[]; steps: string[]; herbs: string; tip: string; allergens: string[]; safety?: string };
const recepten: Thuisrecept[] = [
  {
    id: 'pumpkin-lentil-soup', name: 'Pompoensoep met linzen en komijn', category: 'cooking', minutes: 30,
    image: '/assets/library/cooking/seasonal/pumpkin-lentil-soup.webp', months: [9, 10, 11, 12, 1, 2],
    season: 'Pompoen wordt in Nederland in de nazomer en herfst geoogst. In de winter kan hij uit bewaring komen.',
    ingredients: ['400 g geschilde pompoenblokjes, vers of diepvries', '100 g gedroogde rode splitlinzen', '1 kleine ui', '1 theelepel olijfolie (5 ml)', '½ theelepel gemalen komijn', '600 ml water'],
    equipment: ['Kookpan met deksel', 'Mes en snijplank', 'Zeef', 'Houten lepel', 'Staafmixer', 'Keukenweegschaal', 'Maatbeker', 'Theelepel'],
    steps: ['Was je handen. Weeg de pompoen en linzen en meet het water af. Spoel de linzen in een zeef. Gebruik pompoenblokjes of laat een volwassene de pompoen schillen en snijden.', 'Laat een volwassene de ui pellen en fijnsnijden. Verwarm samen de olie in de pan en roer de ui 3 minuten op laag vuur.', 'Roer de komijn erdoor. Voeg pompoen, linzen en water toe. Laat een volwassene de soep aan de kook brengen.', 'Laat met het deksel schuin op de pan 20 tot 25 minuten zacht koken. Roer af en toe. Pompoen en linzen moeten helemaal zacht zijn; kook zo nodig langer en voeg water toe als het te dik wordt.', 'Zet het vuur uit. Laat een volwassene de soep met de staafmixer glad maken, met de mixerkop onder de soep.', 'Verdeel over twee kommen en laat afkoelen tot eettemperatuur.'],
    herbs: 'Ruik aan de komijn voordat hij in de pan gaat. Hij geeft de soep een warme, aardse smaak.', tip: 'De linzen maken de soep wat steviger. Serveer eventueel met volkorenbrood (extra; bevat meestal gluten).', allergens: ['Controleer de verpakking van de linzen op allergenen en sporen.'],
  },
  {
    id: 'carrot-white-bean-soup', name: 'Wortelsoep met witte bonen en tijm', category: 'cooking', minutes: 25,
    image: '/assets/library/cooking/seasonal/carrot-white-bean-soup.webp', months: [9, 10, 11, 12, 1, 2, 3],
    season: 'Wortels van Nederlandse teelt passen bij herfst en winter. Een deel wordt na de oogst bewaard.',
    ingredients: ['300 g wortels', '200 g gare witte bonen uit pot of blik, uitgelekt, liefst zonder toegevoegd zout', '1 kleine ui', '1 theelepel olijfolie (5 ml)', '½ theelepel gedroogde tijm', '400 ml water'],
    equipment: ['Kookpan', 'Mes en snijplank', 'Zeef', 'Houten lepel', 'Staafmixer', 'Keukenweegschaal', 'Maatbeker', 'Theelepel'],
    steps: ['Was je handen en de wortels. Laat een volwassene de ui en wortels klein snijden.', 'Spoel de bonen in een zeef en weeg 200 g uitgelekte bonen af. Meet het water af.', 'Verwarm samen met een volwassene de olie. Roer de ui 3 minuten op laag vuur.', 'Voeg wortel, tijm en water toe. Breng aan de kook en laat ongeveer 15 minuten zacht koken, tot de wortel zacht is.', 'Voeg de bonen toe en verwarm nog 3 minuten. Zet het vuur uit en laat een volwassene de soep pureren. Voeg zo nodig wat water toe.', 'Verdeel over twee kommen en laat afkoelen voor je proeft.'],
    herbs: 'Tijm ruikt kruidig. Wrijf een klein beetje tussen je vingers en ruik voordat je hem toevoegt.', tip: 'Gebruik gare bonen uit pot of blik; gedroogde bonen kun je hier niet direct voor gebruiken.', allergens: ['Controleer de verpakking van de witte bonen op allergenen en sporen.'],
  },
  {
    id: 'leek-potato-soup', name: 'Preisoep met aardappel en witte bonen', category: 'cooking', minutes: 30,
    image: '/assets/library/cooking/seasonal/leek-potato-soup.webp', months: [9, 10, 11, 12, 1, 2, 3],
    season: 'Prei groeit ook in de Nederlandse herfst en winter. Aardappelen kunnen uit Nederlandse bewaring komen.',
    ingredients: ['1 grote prei (ongeveer 250 g schoongemaakt)', '200 g aardappelen', '200 g gare witte bonen uit pot of blik, uitgelekt, liefst zonder toegevoegd zout', '1 theelepel olijfolie (5 ml)', '½ theelepel gedroogde tijm', '500 ml water'],
    equipment: ['Kookpan', 'Mes en snijplank', 'Zeef', 'Houten lepel', 'Keukenweegschaal', 'Maatbeker', 'Theelepel'],
    steps: ['Was je handen. Laat een volwassene het worteltje en harde donkergroene blad van de prei verwijderen. Snijd de prei in de lengte open, spoel zand tussen de bladeren weg en snijd in dunne ringen.', 'Was de aardappelen goed. Laat een volwassene ze schillen en in blokjes van ongeveer 1 cm snijden.', 'Spoel de bonen af en weeg 200 g af. Meet het water af.', 'Verwarm samen de olie in de pan. Roer de prei 4 minuten op laag vuur, zonder hem bruin te bakken.', 'Voeg aardappel, tijm en water toe. Breng aan de kook en laat 15 tot 20 minuten zacht koken, tot de aardappel zacht is.', 'Voeg de bonen toe en verwarm nog 3 minuten. Druk een deel van de aardappel en bonen met de lepel fijn voor een dikkere soep. Verdeel over twee kommen en laat afkoelen.'],
    herbs: 'Een halve theelepel tijm geeft smaak aan de hele pan. Meer kruiden toevoegen kan later; begin klein.', tip: 'Deze soep blijft een beetje grof. Je hebt geen staafmixer nodig.', allergens: ['Controleer de verpakking van de witte bonen op allergenen en sporen.'],
  },
  {
    id: 'kale-bean-mash', name: 'Boerenkoolstamppot met witte bonen', category: 'cooking', minutes: 30,
    image: '/assets/library/cooking/seasonal/kale-bean-mash.webp', months: [10, 11, 12, 1, 2, 3],
    season: 'Boerenkool is een Nederlandse herfst- en wintergroente. Kijk op het etiket waar jouw boerenkool vandaan komt.',
    ingredients: ['400 g aardappelen', '200 g gewassen, fijngesneden boerenkool', '200 g gare witte bonen uit pot of blik, uitgelekt, liefst zonder toegevoegd zout', '2 theelepels olijfolie (10 ml)', '¼ theelepel gemalen nootmuskaat', 'Water om in te koken'],
    equipment: ['Grote kookpan met deksel', 'Mes en snijplank', 'Zeef', 'Stamper', 'Keukenweegschaal', 'Theelepel'],
    steps: ['Was je handen en de aardappelen. Laat een volwassene de aardappelen schillen en in gelijke stukken snijden.', 'Doe de aardappelen in de pan met zoveel water dat ze net onderstaan. Leg de boerenkool erop.', 'Laat een volwassene het water aan de kook brengen. Kook met het deksel op de pan ongeveer 20 minuten, tot de aardappelen makkelijk uit elkaar vallen met een vork.', 'Spoel de bonen af en weeg 200 g af. Doe ze de laatste 5 minuten bij de aardappelen en boerenkool, zodat ze goed warm worden.', 'Laat een volwassene afgieten en een kopje kookvocht opvangen. Voeg de olie en nootmuskaat toe.', 'Stamp alles fijn. Roer er beetje bij beetje kookvocht door tot de stamppot smeuïg is. Verdeel over twee borden en laat afkoelen tot eettemperatuur.'],
    herbs: 'Nootmuskaat heeft een sterke geur en smaak. Gebruik de afgemeten kwart theelepel voor de hele pan.', tip: 'De witte bonen gaan mee in de stamppot. Zo heb je geen vlees nodig in dit recept.', allergens: ['Controleer de verpakking van de witte bonen en nootmuskaat op allergenen en sporen.'],
  },
  {
    id: 'apple-cinnamon-porridge', name: 'Appelhavermout met kaneel', category: 'breakfast', minutes: 15,
    image: '/assets/library/cooking/seasonal/apple-cinnamon-porridge.webp', months: [9, 10, 11, 12, 1, 2, 3],
    season: 'Nederlandse appels worden vooral in de nazomer en herfst geoogst. In winter en voorjaar kunnen ze uit gekoelde bewaring komen.',
    ingredients: ['80 g havermout', '400 ml halfvolle melk', '1 grote appel', '½ theelepel kaneel'],
    equipment: ['Kleine kookpan', 'Mes en snijplank', 'Houten lepel', 'Keukenweegschaal', 'Maatbeker', 'Theelepel'],
    steps: ['Was je handen en de appel. Laat de schil zitten. Laat een volwassene het klokhuis verwijderen en de appel in kleine blokjes snijden.', 'Weeg de havermout en meet de melk af. Doe beide in de pan.', 'Voeg de appelblokjes en kaneel toe. Verwarm samen met een volwassene tot de pap zacht borrelt.', 'Kook op laag vuur volgens de verpakking van de havermout, meestal 5 tot 10 minuten. Blijf roeren. Voeg een scheutje water toe als de pap te dik wordt.', 'Verdeel over twee kommen en laat even afkoelen. Controleer de temperatuur voor je eet.'],
    herbs: 'Ruik aan de kaneel. Hij past bij de appel; extra suiker is niet nodig voor dit recept.', tip: 'Voor een koude variant kun je havermout, melk, kleine appelblokjes en kaneel afgedekt een nacht in de koelkast zetten.', allergens: ['Melk', 'Haver: controleer de verpakking op gluten'],
  },
  {
    id: 'pear-oat-yogurt', name: 'Perenyoghurt met havermout en kaneel', category: 'breakfast', minutes: 10,
    image: '/assets/library/cooking/seasonal/pear-oat-yogurt.webp', months: [9, 10, 11, 12, 1, 2],
    season: 'Nederlandse peren worden vooral in de nazomer en herfst geplukt. Later in het jaar kunnen ze uit bewaring komen.',
    ingredients: ['300 ml halfvolle naturel yoghurt', '60 g havermout', '2 rijpe handperen', '¼ theelepel kaneel'],
    equipment: ['Mengkom', 'Lepel', 'Mes en snijplank', 'Keukenweegschaal', 'Maatbeker', 'Theelepel'],
    steps: ['Was je handen en de peren. Gebruik rijpe handperen, geen harde stoofperen.', 'Meet de yoghurt af en weeg de havermout. Meng beide in de kom.', 'Laat een volwassene de klokhuizen verwijderen en de peren in kleine blokjes snijden. De gewassen schil mag blijven zitten.', 'Roer de peer en kaneel door de yoghurt. Laat de havermout 5 minuten zachter worden, of langer als je dat lekker vindt.', 'Verdeel over twee kommen. Eet meteen of zet afgedekt in de koelkast tot het serveren.'],
    herbs: 'Doe eerst de afgemeten kaneel erbij. Proef met een schone lepel hoe peer en kaneel samen smaken.', tip: 'Je kunt yoghurt en havermout ook de avond ervoor mengen en afgedekt in de koelkast zetten. Voeg de peer vlak voor het eten toe.', allergens: ['Melk', 'Haver: controleer de verpakking op gluten'],
    safety: 'Een volwassene helpt met het mes. Houd de yoghurt koel en gebruik schoon keukengerei.',
  },
];

export const SEIZOENSRECEPTEN: RecipeConfig[] = recepten.map(recept => ({
  id: recept.id, name: recept.name, shortDescription: recept.season, category: recept.category,
  homeOnly: true, seasonMonths: recept.months, availability: 'preview', contentStatus: 'ready',
  requiredCompletedRecipes: 0, level: 1, preparationMinutes: recept.minutes, servings: 2, image: recept.image,
  ingredients: [], equipmentIds: [], challenges: [], shoppingRequirements: [], actions: [], rewardCoins: null,
  homeRecipe: {
    introduction: 'Een eenvoudig recept voor twee. Maak het samen met een volwassene.',
    ingredients: recept.ingredients, extraEquipment: recept.equipment, steps: recept.steps,
    seasonNote: `${recept.season} De kalender is een richtlijn voor Nederland, geen garantie op lokale herkomst. Kijk op het etiket of vraag het aan de teler. Kruiden, granen en peulvruchten kunnen van elders komen.`,
    safety: recept.safety ?? 'Een volwassene helpt met scherpe messen, het fornuis, afgieten en eventueel pureren. Laat heet eten afkoelen voor je proeft.',
    servingTip: recept.tip, allergens: recept.allergens,
    nutrition: [{ title: 'Ontdek de kruiden', text: recept.herbs }], sources: [bron],
  },
}));

export function inSeizoen(recept: RecipeConfig, maand = new Date().getMonth() + 1): boolean {
  return recept.seasonMonths?.includes(maand) ?? false;
}
