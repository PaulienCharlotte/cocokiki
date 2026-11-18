import { reken } from '../../games/math/Maten';
import { OPDRACHT_BONUS } from '../../services/economie';

export const SEASONS = ['Lente', 'Zomer', 'Herfst', 'Winter'] as const;
export interface GardenCrop {
  id: string; name: string; image: string; spacing: number; start: number[];
  method: 'zaadjes' | 'plantjes'; calendar: string; care: string; height: 'laag' | 'hoog';
  kitchenId?: string; kitchenAmount?: number; yieldLabel: string; coins: number;
}
const food = (id: string) => `/games/shop/products/${id}.webp`;
export const GARDEN_CROPS: GardenCrop[] = [
  { id: 'radish', name: 'Radijs', image: '/assets/library/plants/garden/radish.webp', spacing: 2.5, start: [0, 2], method: 'zaadjes', calendar: 'Voorjaarsradijs houdt van mild weer. Zaai in kleine beetjes in de lente of late zomer.', care: 'Houd de grond gelijkmatig vochtig en geef de worteltjes ruimte.', height: 'laag', yieldLabel: 'Een bosje radijs', coins: OPDRACHT_BONUS.oogstVerkopen },
  { id: 'carrot', name: 'Wortel', image: food('carrot'), spacing: 5, start: [0, 1], method: 'zaadjes', calendar: 'Zaai buiten van de lente tot vroeg in de zomer. Laat de wortel op zijn plek groeien.', care: 'Haal te dicht op elkaar groeiende kiemplantjes weg. Zo houden wortels ruimte.', height: 'laag', kitchenId: 'carrot', kitchenAmount: 4, yieldLabel: '4 wortels', coins: OPDRACHT_BONUS.oogstVerkopen },
  { id: 'lettuce', name: 'Kropsla', image: food('lettuce'), spacing: 30, start: [0, 1, 2], method: 'zaadjes', calendar: 'Start in lente of zomer. Sommige soorten kunnen ook in de herfst; kijk op het zakje.', care: 'Een grote krop heeft ruimte nodig. In hete zon kan een wat beschuttere plek fijn zijn.', height: 'laag', kitchenId: 'lettuce', kitchenAmount: 1, yieldLabel: '1 krop sla', coins: OPDRACHT_BONUS.oogstVerkopen },
  { id: 'strawberry', name: 'Aardbei', image: food('strawberry'), spacing: 40, start: [0, 2], method: 'plantjes', calendar: 'Zet jonge planten in de lente of aan het eind van de zomer en begin van de herfst. Oogst meestal in de zomer.', care: 'Geef de plant een zonnige plek en houd de grond vochtig, zonder hem te laten zwemmen.', height: 'laag', kitchenId: 'strawberry', kitchenAmount: 250, yieldLabel: '250 g aardbeien', coins: OPDRACHT_BONUS.oogstVerkopen },
  { id: 'tomato', name: 'Tomaat', image: food('tomato'), spacing: 50, start: [0], method: 'zaadjes', calendar: 'Zaai in de lente binnen. Jonge planten kunnen na de vorst naar buiten; oogst in zomer en vroege herfst.', care: 'Een hoge tomatenplant heeft steun nodig. Geef regelmatig water bij de grond.', height: 'hoog', kitchenId: 'tomato', kitchenAmount: 4, yieldLabel: '4 tomaten', coins: OPDRACHT_BONUS.oogstVerkopen },
  { id: 'beans', name: 'Sperzieboon', image: '/assets/library/plants/garden/beans.webp', spacing: 15, start: [0, 1], method: 'zaadjes', calendar: 'Zaai pas bij warm weer in de late lente of zomer. Deze lage struikboon heeft geen hoge stok nodig.', care: 'Bonen houden van warmte. Geef vooral bij de bloei genoeg water.', height: 'laag', yieldLabel: 'Een mandje sperziebonen', coins: OPDRACHT_BONUS.oogstVerkopen },
];
export const GARDEN_CROPS_BY_ID = Object.fromEntries(GARDEN_CROPS.map(crop => [crop.id, crop])) as Record<string, GardenCrop>;
export const gardenSeason = (day: number) => Math.floor((day - 1) / 7) % 4;
export const formatGardenNumber = (value: number) => value.toLocaleString('nl-NL', { maximumFractionDigits: 4 });
export function parseGardenNumber(value: string): number | null {
  const cleaned = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(cleaned)) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}
export interface GardenTask { prompt: string; answer: number; unit: string; hint: string; waterMl?: number }
export function gardenTask(crop: GardenCrop, step: number, level: number): GardenTask {
  if (step === 0) {
    const dm = level > 1;
    if (level === 3) return { prompt: `Vier plantjes met ${formatGardenNumber(crop.spacing)} cm ertussen. Hoeveel dm is het van het eerste tot het laatste plantje, zonder randruimte?`, answer: reken(crop.spacing * 3, -1, 10), unit: 'dm', hint: `Vier plantjes hebben drie tussenruimtes: 3 × ${formatGardenNumber(crop.spacing)} cm. Deel daarna door 10 voor dm.` };
    return { prompt: `Hoeveel ${dm ? 'dm' : 'mm'} is ${formatGardenNumber(crop.spacing)} cm?`, answer: reken(crop.spacing, dm ? -1 : 1, 10), unit: dm ? 'dm' : 'mm', hint: dm ? '10 cm is 1 dm. Deel het aantal centimeters door 10.' : '1 cm is 10 mm. Vermenigvuldig het aantal centimeters met 10.' };
  }
  // Elke plant en elke stap een eigen som, zodat het niet steeds 0,4 liter is.
  // Vast per gewas: dezelfde vraag komt bij opnieuw openen terug (en klopt bij het nakijken).
  const zaad = [...crop.id].reduce((som, letter) => som + letter.charCodeAt(0), 0) + step * 7;
  const perPlant = step === 3 ? 10 : [10, 15, 20, 25][zaad % 4];
  const plants = step === 3 ? (level === 3 ? 4 : 1) : step === 1 ? 1 + (zaad % 2) : 3 + (zaad % 2);
  const days = step === 3 ? 7 : 1;
  const cl = perPlant * plants * days;
  const telwoord = ['', 'één', 'twee', 'drie', 'vier'][plants];
  const liters = level > 1;
  const unit = liters ? 'liter' : 'ml';
  return { prompt: step === 3 ? `Reken vooruit: ${plants === 4 ? 'vier planten krijgen ieder' : 'één plant krijgt'} in deze opdracht elke dag ${perPlant} cl. Hoeveel ${unit} is dat samen voor zeven dagen?` : plants > 1 ? `${telwoord[0].toUpperCase()}${telwoord.slice(1)} planten krijgen ieder ${perPlant} cl. Hoeveel ${unit} meet je samen af?` : `Deze plant krijgt ${perPlant} cl. Hoeveel ${unit} is dat?`, answer: reken(cl, liters ? -2 : 1, 10), unit, hint: `${plants} × ${days} × ${perPlant} cl = ${cl} cl. 100 cl is 1 liter; 1 cl is 10 ml.`, waterMl: cl * 10 };
}
export function gardenNeighbours(index: number): number[] {
  return Array.from({ length: 6 }, (_, i) => i).filter(i => Math.abs(Math.floor(i / 3) - Math.floor(index / 3)) + Math.abs(i % 3 - index % 3) === 1);
}
export function gardenPairAdvice(a: GardenCrop, b: GardenCrop): string {
  return a.height !== b.height ? `${a.name} en ${b.name}: laat de hoge tomaat de lagere plant niet helemaal in de schaduw zetten. Houd voor beide hun eigen plantruimte vrij.` : `${a.name} en ${b.name} kunnen elk hun eigen vak gebruiken. Houd hun plantruimte vrij en kijk per plant of de grond water nodig heeft.`;
}
