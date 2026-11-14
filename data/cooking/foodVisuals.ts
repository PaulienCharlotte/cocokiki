export interface FoodVisual { image: string; alt: string; caption: string }
const digestion: FoodVisual = { image: '/assets/library/cooking/knowledge/digestion-transparent.webp', alt: 'Een eenvoudige tekening van de maag en de opgerolde darmen, naast appel en haver.', caption: 'Je eten gaat via je maag naar je darmen. Daar helpen vezels de darmwerking.' };
const blood: FoodVisual = { image: '/assets/library/cooking/knowledge/blood-transparent.webp', alt: 'Rode bloedcellen in een bloedvat, met blauwe bolletjes als voorstelling van zuurstof.', caption: 'Rode bloedcellen vervoeren zuurstof. De blauwe bolletjes stellen zuurstof voor; die kun je in het echt niet zo zien.' };
const growth: FoodVisual = { image: '/assets/library/cooking/knowledge/growth-transparent.webp', alt: 'Uitvergrote cellen en spierweefsel, met ei, yoghurt en bonen als voorbeelden van eiwitrijk eten.', caption: 'Cellen vormen samen weefsels. Eiwitten uit eten leveren onderdelen voor groei en herstel.' };
const food = (id: string, alt: string, caption: string): FoodVisual => ({ image: `/games/shop/products/${id}.webp`, alt, caption });

/** Het bijschrift maakt duidelijk welk verband het beeld laat zien. */
export const FOOD_VISUALS: Record<string, FoodVisual> = {
  'red-blood-cells': blood, oxygen: blood, blood, iron: blood, 'vitamin-b12': blood,
  fiber: digestion, intestines: digestion, digestion, absorption: digestion, bacteria: digestion, organs: digestion,
  cells: growth, tissues: growth, protein: growth,
  energy: food('banana', 'Een banaan.', 'Een banaan levert koolhydraten. Je lichaam kan die gebruiken voor energie.'),
  carbohydrates: food('oats', 'Havermout.', 'Havermout levert koolhydraten én vezels. Die hebben verschillende taken.'),
  starch: food('oats', 'Havermout.', 'Haver bevat zetmeel: een soort koolhydraat.'),
  wholegrain: food('oats', 'Havermout van haverkorrels.', 'Bij volkoren worden alle delen van de graankorrel gebruikt.'),
  calcium: food('yogurt', 'Een kom yoghurt.', 'Yoghurt levert calcium, dat helpt je botten en tanden sterk te houden.'),
  'vitamin-c': food('pepper', 'Een paprika.', 'Paprika levert vitamine C. Dat helpt bij het opnemen van ijzer uit planten.'),
  'vitamin-d': food('eggs', 'Eieren.', 'Eieren leveren een beetje vitamine D. Je huid kan het ook maken met hulp van zonlicht.'),
  vitamins: food('pepper', 'Een paprika.', 'Verschillende vitamines hebben verschillende taken. Paprika levert bijvoorbeeld vitamine C.'),
  minerals: food('yogurt', 'Een kom yoghurt.', 'Calcium is een mineraal. Je vindt het bijvoorbeeld in yoghurt.'),
  fats: food('olive-oil', 'Een fles olijfolie.', 'Olijfolie levert vetten: energie en hulp bij het opnemen van sommige vitamines.'),
  sugar: food('apple', 'Een appel.', 'In een appel zit van nature suiker, maar ook vezels. Kijk naar het hele product.'),
  nutrients: food('eggs', 'Eieren.', 'Een product kan verschillende voedingsstoffen leveren. Ei levert bijvoorbeeld eiwitten.'),
  lungs: { ...blood, caption: 'In je longen komt zuurstof in je bloed. Rode bloedcellen nemen die mee door je lichaam.' },
  heart: { ...blood, caption: 'Je hart pompt bloed door bloedvaten. Zo komt zuurstof op de juiste plekken.' },
};
