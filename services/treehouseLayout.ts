import { buildSlots, STARTER_HOME_ROOMS, validBuildRooms, type BuildRoom } from '../data/treehouseUnits';
import { ROOM_ICONS } from '../data/roomIcons';
import { commitLocalState, readDocument, readLocalState } from './localState';
import { loadRoomExpansions, ROOM_EXPANSIONS_KEY } from './roomExpansions';
import { loadRoomInventory, ROOM_INVENTORY_KEY } from './roomInventory';
import { resalePrice } from './inventorySales';

export const TREEHOUSE_LAYOUT_KEY = 'cocokiki:treehouse-layout:v1';
export function loadTreehouseLayout(): BuildRoom[] {
  const expansions = loadRoomExpansions();
  const defaults: BuildRoom[] = STARTER_HOME_ROOMS.map(room => ({ ...room }));
  for (const room of expansions.rooms) {
    const place = buildSlots(defaults).find(slot => slot.floor === 0) ?? buildSlots(defaults)[0];
    if (!place) break;
    defaults.push({ id: room.id, name: room.name, asset: room.template === 'extra-bedroom' ? 'bedroom' : 'room', icon: room.template === 'extra-bedroom' ? 'bed' : 'plant', ...place });
  }
  try {
    const stored = JSON.parse(readDocument(TREEHOUSE_LAYOUT_KEY) ?? 'null');
    if (stored?.version !== 1 || !Array.isArray(stored.rooms)) return defaults;
    const saved: BuildRoom[] = defaults.flatMap(room => {
      const previous = stored.rooms.find((item: BuildRoom) => item?.id === room.id);
      return previous ? [{ ...room, column: previous.column, floor: previous.floor, icon: ROOM_ICONS.some(icon => icon.id === previous.icon) ? previous.icon : room.icon }] : [];
    });
    if (!validBuildRooms(saved)) return defaults;
    for (const room of defaults.filter(room => !saved.some(item => item.id === room.id))) {
      const place = buildSlots(saved)[0];
      if (!place) return defaults;
      saved.push({ ...room, ...place });
    }
    return saved;
  } catch { return defaults; }
}
export function saveTreehouseLayout(rooms: BuildRoom[]): boolean {
  const owned = loadTreehouseLayout();
  if (!validBuildRooms(rooms) || rooms.length !== owned.length || !owned.every(room => rooms.some(item => item.id === room.id && item.asset === room.asset))) return false;
  return commitLocalState({ [TREEHOUSE_LAYOUT_KEY]: JSON.stringify({ version: 1, rooms }) }).status === 'applied';
}
export function roomSaleAmount(id: string): number {
  const room = loadRoomExpansions().rooms.find(item => item.id === id);
  if (!room) return 0;
  try { return resalePrice(-readLocalState().appliedTransactions[`room:buy:${room.purchaseId}`]); } catch { return 0; }
}
export function sellTreehouseRoom(id: string): boolean {
  const state = loadRoomExpansions();
  const room = state.rooms.find(item => item.id === id);
  if (!room) return false;
  const rooms = loadTreehouseLayout().filter(item => item.id !== id);
  if (!validBuildRooms(rooms)) return false;
  const inventory = loadRoomInventory();
  return commitLocalState({
    [ROOM_EXPANSIONS_KEY]: JSON.stringify({ ...state, rooms: state.rooms.filter(item => item.id !== id) }),
    [TREEHOUSE_LAYOUT_KEY]: JSON.stringify({ version: 1, rooms }),
    [ROOM_INVENTORY_KEY]: JSON.stringify({ ...inventory, placements: inventory.placements.filter(item => item.room !== id) }),
  }, [{ id: `room:sell:${room.purchaseId}`, amount: roomSaleAmount(id) }]).status === 'applied';
}
