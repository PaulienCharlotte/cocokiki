import type { Selection } from '../learning';
export interface TravelAdventure { id: string; title: string; areaName: string; description: string; selection: Selection; reward: number; image: string }
/** One complete story first; later adventures can reuse the existing map and test. */
export const TRAVEL_ADVENTURES: TravelAdventure[] = [{
  id: 'seb-groningen', title: 'Seb ontdekt Groningen', areaName: 'Groningen',
  description: 'Help Seb zijn reis voorbereiden. Ontdek de kaart van Groningen en haal een 10 op de toets.',
  selection: { areaId: 'gr', topicId: 'all', clusterId: 'all' }, reward: 150,
  image: '/games/school/topo-cta.webp',
}];
