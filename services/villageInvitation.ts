import { RECIPES } from '../data/cooking/catalog';
import { getRecipeAccess } from '../data/cooking/availability';
import { BESTELLINGEN_BY_ID } from '../data/cooking/orders';
import type { CharacterId } from '../data/characters';
import { TRAVEL_ADVENTURES } from '../data/travel/adventures';
import { loadCookingProgress } from './cookingProgress';
import { lopendeBestelling, openBestellingen, pastBijBestelling } from './bakeryOrders';
import { loadTravelAdventures } from './travelAdventures';
import { loadNursery } from './nurseryProject';
import { loadCakeOrder } from './cakeOrder';
import { loadDailyPractice } from './dailyPractice';

export interface VillageInvitation { id: string; character: CharacterId; text: string; path: string; continuing: boolean; image: string; world: string }
/** Verschillende To Do-gebieden, lopend werk eerst. Lezen start of beloont niets. */
export function loadVillageInvitations(): VillageInvitation[] {
  const choices: Omit<VillageInvitation, 'image' | 'world'>[] = [];
  const cooking = loadCookingProgress();
  const active = lopendeBestelling(cooking);
  const order = openBestellingen(cooking)[0];
  if (active) choices.push({ id: active.bestelling.id, character: 'coco', text: 'Zullen we verder bakken?', path: '/cooking/orders?from=tasks', continuing: true });
  else if (order) {
    const text: Record<string, string> = { 'kiki-kas': 'Bak je iets zonder zuivel?', 'seb-verjaardag': 'Bak je mee voor Sebs feestje?', 'lua-tussendoor': 'Maak je iets voor Baby Lua?' };
    choices.push({ id: order.id, character: 'coco', text: text[order.id] ?? 'Help je met een bestelling?', path: '/opdrachten?gebied=bakken', continuing: false });
  } else if (!loadCakeOrder().delivered) choices.push({ id: 'cake', character: 'coco', text: 'Versier je Sebs taart?', path: '/games/taartenatelier?order=seb-birthday&from=tasks', continuing: false });
  const travel = loadTravelAdventures();
  const journey = TRAVEL_ADVENTURES.find(item => item.id === travel.active?.adventureId && !travel.completed[item.id]);
  const nextJourney = journey ?? TRAVEL_ADVENTURES.find(item => !travel.completed[item.id]);
  if (nextJourney) choices.push({ id: nextJourney.id, character: 'seb', text: journey ? `Verder op reis naar ${journey.areaName}?` : `Ga je mee naar ${nextJourney.areaName}?`, path: '/opdrachten?gebied=reizen', continuing: Boolean(journey) });
  const nursery = loadNursery('luna');
  if (nursery.stage !== 'complete') choices.push({ id: 'nursery', character: 'luna', text: nursery.stage !== 'brief' ? 'Zullen we verder inrichten?' : 'Help je Luna inrichten?', path: '/opdrachten/luna-babykamer?from=tasks', continuing: nursery.stage !== 'brief' });
  if (Object.keys(loadDailyPractice().answers).length < 5) choices.push({ id: 'daily', character: 'lua', text: 'Doe je mee met vijf voor vandaag?', path: '/opdrachten?gebied=vandaag', continuing: false });
  return choices.sort((a, b) => Number(b.continuing) - Number(a.continuing)).slice(0, 3).map(choice => {
    if (choice.character === 'coco') {
      const bestelling = BESTELLINGEN_BY_ID[choice.id];
      const selected = active?.voortgang.recipeId ? RECIPES.find(recipe => recipe.id === active.voortgang.recipeId) : undefined;
      const recipe = selected ?? (bestelling ? RECIPES.find(item => pastBijBestelling(bestelling, item) && getRecipeAccess(item, cooking).playable) : undefined);
      return { ...choice, world: 'keuken', image: choice.id === 'cake' ? '/assets/library/cooking/taarten/roze-rand.webp' : recipe?.image ?? '/games/treehouse/cookbook-cta.webp' };
    }
    if (choice.character === 'seb') return { ...choice, world: 'wereld', image: '/dreamworld/quest-travel.webp' };
    if (choice.character === 'luna') return { ...choice, world: 'boomhut', image: '/assets/library/projects/luna-crib.webp' };
    return { ...choice, world: 'school', image: '/assets/library/ui/daily-quest.webp' };
  });
}
/** Eerste uitnodiging blijft beschikbaar voor plaatsen die één tip nodig hebben. */
export function loadVillageInvitation(): VillageInvitation | null { return loadVillageInvitations()[0] ?? null; }
