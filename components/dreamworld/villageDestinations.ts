import type { IslandId } from '../../platform/dreamworld';

/** Nieuwe spellen groeien binnen een bestemming; het dorp houdt vijf ingangen. */
export const VILLAGE_STORIES: Partial<Record<IslandId, { action: string; world: string }>> = {
  cooking: { action: 'Bak met Coco', world: 'keuken' },
  plants: { action: 'Plant met Kiki', world: 'tuin' },
  math: { action: 'Help Baby Lua', world: 'school' },
  discovery: { action: 'Ontdek met Seb', world: 'wereld' },
  home: { action: 'Versier je boomhut', world: 'boomhut' },
};
