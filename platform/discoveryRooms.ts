import type { ResidentId } from './worldLocations';

export interface DiscoveryObject {
  id: string;
  label: string;
  /** Coordinates belong to the illustrated world, not to the control zones. */
  x: number;
  y: number;
  action: 'navigate' | 'ingredient' | 'crop';
  path?: string;
  contentId?: string;
}
export interface DiscoveryRoom {
  title: string;
  aspectRatio?: number;
  world: 'keuken' | 'tuin' | 'school' | 'wereld';
  objects: DiscoveryObject[];
}

/** One content source: objects open existing books, facts and saved projects. */
export const DISCOVERY_ROOMS: Record<ResidentId, DiscoveryRoom> = {
  coco: { title: 'Coco’s kookstudio', world: 'keuken', objects: [
    { id: 'cookbook', label: 'Open het kookboek', x: 19, y: 44, action: 'navigate', path: '/treehouse/cookbook' },
    { id: 'orders', label: 'Bekijk kookopdrachten', x: 48, y: 82, action: 'navigate', path: '/cooking/orders' },
    { id: 'ingredients', label: 'Ontdek havermout', x: 72, y: 72, action: 'ingredient', contentId: 'oats' },
    { id: 'flour', label: 'Ontdek bloem', x: 82, y: 63, action: 'ingredient', contentId: 'flour' },
    { id: 'cake', label: 'Versier een taart', x: 92, y: 44, action: 'navigate', path: '/games/taartenatelier' },
    { id: 'strawberry', label: 'Ontdek de aardbei', x: 86, y: 54, action: 'ingredient', contentId: 'strawberry' },
  ] },
  kiki: { title: 'Kiki’s moestuin', world: 'tuin', objects: [
    { id: 'clinic', label: 'Help de plantendokter', x: 53, y: 65, action: 'navigate', path: '/plantendokter' },
    { id: 'plant-book', label: 'Open het plantenboek', x: 17, y: 36, action: 'navigate', path: '/encyclopedie?tab=planten' },
    { id: 'harvest', label: 'Ontdek de wortel', x: 17, y: 59, action: 'crop', contentId: 'carrot' },
    { id: 'strawberry', label: 'Ontdek de aardbei', x: 79, y: 46, action: 'ingredient', contentId: 'strawberry' },
    { id: 'garden', label: 'Verzorg je moestuin', x: 79, y: 66, action: 'navigate', path: '/plants/garden' },
  ] },
  seb: { title: 'Seb’s ontdekkingskamer', world: 'wereld', objects: [
    { id: 'topo', label: 'Ontdek de kaart', x: 15, y: 28, action: 'navigate', path: '/games/topo' },
    { id: 'atlas', label: 'Open je reisboek', x: 14, y: 56, action: 'navigate', path: '/encyclopedie?tab=plekken' },
    { id: 'world-memory', label: 'Speel wereldmemory', x: 57, y: 85, action: 'navigate', path: '/games/flags-memory' },
  ] },
  lua: { title: 'Lua’s werkplaats', aspectRatio: 1.5, world: 'school', objects: [
    { id: 'blueprint', label: 'Richt een kamer in', x: 16, y: 83, action: 'navigate', path: '/opdrachten?gebied=inrichten' },
    { id: 'abacus', label: 'Speel keersommen', x: 39, y: 49, action: 'navigate', path: '/school/math/multiply' },
    { id: 'balance', label: 'Weeg en vergelijk', x: 56, y: 49, action: 'navigate', path: '/school/math/balance' },
    { id: 'measure', label: 'Meet iets op', x: 74, y: 52, action: 'navigate', path: '/school/math/maten' },
    { id: 'projects', label: 'Bekijk je projecten', x: 93, y: 60, action: 'navigate', path: '/encyclopedie?tab=opdrachten' },
  ] },
};
