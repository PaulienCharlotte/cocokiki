import { DUTCH_PROVINCES, memoryPairs, studyLocations, type Selection } from '../learning';
import { OPDRACHT_BONUS } from '../../services/economie';
export interface TravelAdventure { id: string; title: string; areaName: string; description: string; selection: Selection; reward: number; image: string }
/** Dezelfde reisstructuur per gebied; plekken en weetjes blijven uit de bestaande inhoud komen. */
export const TRAVEL_ADVENTURES: TravelAdventure[] = [...DUTCH_PROVINCES]
  .sort((a, b) => Number(b.id === 'gr') - Number(a.id === 'gr'))
  .map(province => ({
    id: province.id === 'gr' ? 'seb-groningen' : `seb-${province.id}`,
    title: `Seb ontdekt ${province.name}`, areaName: province.name,
    description: 'Ontdek de weetjes, vind setjes, wijs alles aan en spel de namen. Rond je reis af met een 10 op de toets. Je kunt elke dag verdergaan.',
    selection: { areaId: province.id, topicId: 'all' as const, clusterId: 'all' }, reward: OPDRACHT_BONUS.reis,
    image: '/dreamworld/quest-travel.webp',
  })).filter(adventure => studyLocations(adventure.selection).length > 0 && memoryPairs(adventure.selection).length >= 2);
