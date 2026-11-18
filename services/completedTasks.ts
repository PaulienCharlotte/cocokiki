import { TRAVEL_ADVENTURES } from '../data/travel/adventures';
import { loadTravelAdventures } from './travelAdventures';
import { BESTELLINGEN } from '../data/cooking/orders';
import { CHARACTERS } from '../data/characters';
import { loadCookingProgress } from './cookingProgress';
import { loadCakeOrder } from './cakeOrder';
import { loadNursery } from './nurseryProject';

/** Read the original completion records; no second ledger that can drift. */
export function completedTasks() {
  const progress = loadCookingProgress();
  const tasks = BESTELLINGEN.filter(order => progress.orders[order.id]?.status === 'geleverd').map(order => ({
    id: order.id, title: order.aanleiding, image: CHARACTERS[order.klant].beeld, description: order.dank,
  }));
  if (loadCakeOrder().delivered) tasks.push({ id: 'cake', title: 'Sebs verjaardagstaart', image: '/assets/library/cooking/taarten/roze-rand.webp', description: 'De verjaardagstaart is afgeleverd.' });
  if (loadNursery('luna').stage === 'complete') tasks.push({ id: 'nursery', title: 'Luna’s kamer', image: '/assets/library/projects/luna-crib.webp', description: 'Gemeten, gekozen en ingericht.' });
  if (loadNursery('kerst').stage === 'complete') tasks.push({ id: 'kerst', title: 'Coco’s kerstkamer', image: '/assets/library/shop/decor/products/christmas-japandi-tree.webp?v=3', description: 'Gemeten, gekozen en ingericht.' });
  const travel = loadTravelAdventures();
  for (const adventure of TRAVEL_ADVENTURES) if (travel.completed[adventure.id]) tasks.push({ id: adventure.id, title: adventure.title, image: adventure.image, description: 'Met een 10 op de hele toets afgerond.' });
  return tasks;
}

/** All achievable task goals, including those still waiting on the board. */
export function taskCollection() {
  const finished = new Map(completedTasks().map(task => [task.id, task]));
  const goals = [
    ...BESTELLINGEN.map(order => ({ id: order.id, title: order.aanleiding, image: CHARACTERS[order.klant].beeld, description: order.wens, path: '/opdrachten?gebied=bakken' })),
    { id: 'cake', title: 'Sebs verjaardagstaart', image: '/assets/library/cooking/taarten/roze-rand.webp', description: 'Versier en lever Sebs verjaardagstaart af.', path: '/opdrachten?gebied=bakken' },
    { id: 'nursery', title: 'Luna’s babykamer', image: '/assets/library/projects/luna-crib.webp', description: 'Meet, reken en richt de babykamer in.', path: '/opdrachten?gebied=inrichten' },
    ...TRAVEL_ADVENTURES.map(adventure => ({ id: adventure.id, title: adventure.title, image: adventure.image, description: adventure.description, path: '/opdrachten?gebied=reizen' })),
  ];
  return goals.map(goal => ({ ...goal, completed: finished.has(goal.id), description: finished.get(goal.id)?.description ?? goal.description }));
}
