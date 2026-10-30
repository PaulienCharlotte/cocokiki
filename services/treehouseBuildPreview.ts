import { buildSlots, INITIAL_BUILD_ROOMS, validBuildRooms, type BuildRoom } from '../data/treehouseUnits';
import { commitLocalState, readDocument } from './localState';

export const BUILD_PREVIEW_KEY = 'cocokiki:treehouse-build-preview:v1';
export function loadBuildPreview(): BuildRoom[] {
  try {
    const stored = JSON.parse(readDocument(BUILD_PREVIEW_KEY) ?? '[]');
    if (stored?.version === 2 && Array.isArray(stored.rooms)) {
      const rooms = stored.rooms;
      if (!rooms.every((room: BuildRoom) => room && typeof room.id === 'string' && room.id && typeof room.name === 'string' && room.name.trim() && room.name.length <= 30 && ['room', 'bedroom', 'kitchen', 'terrace'].includes(room.asset))) return [...INITIAL_BUILD_ROOMS];
      if (!validBuildRooms(rooms)) return [...INITIAL_BUILD_ROOMS];
      return rooms;
    }
    const extra = stored;
    if (!Array.isArray(extra)) return [...INITIAL_BUILD_ROOMS];
    const rooms = [...INITIAL_BUILD_ROOMS];
    for (const item of extra) {
      if (!item || typeof item.id !== 'string' || rooms.some(room => room.id === item.id) || !['room', 'bedroom', 'kitchen', 'terrace'].includes(item.asset) || typeof item.name !== 'string' || !item.name.trim()) continue;
      if (!buildSlots(rooms).some(slot => slot.column === item.column && slot.floor === item.floor)) continue;
      rooms.push({ id: item.id, asset: item.asset, name: item.name.trim().slice(0, 30), column: item.column, floor: item.floor });
    }
    return rooms;
  } catch { return [...INITIAL_BUILD_ROOMS]; }
}
export function saveBuildPreview(rooms: BuildRoom[]) {
  if (!validBuildRooms(rooms)) return false;
  return commitLocalState({ [BUILD_PREVIEW_KEY]: JSON.stringify({ version: 2, rooms }) }).status === 'applied';
}
