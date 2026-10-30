import type { IslandId } from '../platform/dreamworld';

export interface IslandIconPosition { x: number; y: number }
export const islandIconLayoutKey = (island: IslandId) => `cocokiki:island-icons:v1:${island}`;

export function loadIslandIconPositions(island: IslandId): Record<string, IslandIconPosition> {
  try {
    const saved = JSON.parse(localStorage.getItem(islandIconLayoutKey(island)) ?? '{}');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter((entry): entry is [string, IslandIconPosition] => {
      const point = entry[1] as IslandIconPosition | null;
      return !!point && Number.isFinite(point.x) && Number.isFinite(point.y) && point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100;
    }));
  } catch { return {}; }
}

export function saveIslandIconPosition(island: IslandId, id: string, point: IslandIconPosition): boolean {
  if (![point.x, point.y].every(value => Number.isFinite(value) && value >= 0 && value <= 100)) return false;
  try {
    localStorage.setItem(islandIconLayoutKey(island), JSON.stringify({ ...loadIslandIconPositions(island), [id]: point }));
    return true;
  } catch { return false; }
}
