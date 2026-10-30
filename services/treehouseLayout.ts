import { buildSlots, STARTER_HOME_ROOMS, validBuildRooms, type BuildRoom } from '../data/treehouseUnits';
import { ROOM_ICONS } from '../data/roomIcons';
import { commitLocalState, readDocument, readLocalState } from './localState';
import { loadRoomExpansions, ROOM_EXPANSIONS_KEY } from './roomExpansions';
import { loadRoomInventory, ROOM_INVENTORY_KEY } from './roomInventory';
import { resalePrice } from './inventorySales';
import { ROOM_TEMPLATE_ASSETS } from '../data/treehouse';
import { loadTreehouseRoofs, roofSaleAmount, TREEHOUSE_ROOFS_KEY, validTreehouseRoofs, withoutRoomRoofs } from './treehouseRoofs';

export const TREEHOUSE_LAYOUT_KEY = 'cocokiki:treehouse-layout:v1';
export function loadTreehouseLayout(): BuildRoom[] {
  const expansions = loadRoomExpansions();
  const definitions: BuildRoom[] = [...STARTER_HOME_ROOMS.map(room => ({ ...room })), ...expansions.rooms.map(room => ({ id: room.id, name: room.name, asset: ROOM_TEMPLATE_ASSETS[room.template], icon: room.icon ?? (room.template === 'extra-bedroom' ? 'bed' : room.template === 'bathroom-unit' ? 'bath' : 'plant'), column: 0, floor: 0 }))];
  const roofs = loadTreehouseRoofs();
  for (const room of definitions) room.roof = roofs.equipped[room.id];
  const append = (layout: BuildRoom[], room: BuildRoom) => {
    const place = buildSlots(layout).find(slot => validBuildRooms([...layout, { ...room, ...slot }]));
    if (place) layout.push({ ...room, ...place });
    return !!place;
  };
  const defaults = definitions.slice(0, STARTER_HOME_ROOMS.length);
  for (const room of definitions.slice(STARTER_HOME_ROOMS.length)) append(defaults, room);
  try {
    const stored = JSON.parse(readDocument(TREEHOUSE_LAYOUT_KEY) ?? 'null');
    if (stored?.version !== 1 || !Array.isArray(stored.rooms)) return defaults;
    const saved: BuildRoom[] = definitions.flatMap(room => {
      const previous = stored.rooms.find((item: BuildRoom) => item?.id === room.id);
      if (!previous) return [];
      // Old closed balcony modules may support another room; do not reset that house.
      const legacySupport = previous.asset === 'room' && ['terrace', 'garden'].includes(room.asset)
        && stored.rooms.some((item: BuildRoom) => item.column === previous.column && item.floor > previous.floor);
      return [{ ...room, ...(legacySupport ? { asset: 'room' as const } : {}), column: previous.column, floor: previous.floor, icon: ROOM_ICONS.some(icon => icon.id === previous.icon) ? previous.icon : room.icon }];
    });
    if (!validBuildRooms(saved)) return defaults;
    for (const room of definitions.filter(room => !saved.some(item => item.id === room.id))) {
      if (!append(saved, room)) return defaults;
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
  try { return resalePrice(-readLocalState().appliedTransactions[`room:buy:${room.purchaseId}`]) + roofSaleAmount(id); } catch { return 0; }
}
export function sellTreehouseRoom(id: string): boolean {
  const state = loadRoomExpansions();
  const room = state.rooms.find(item => item.id === id);
  if (!room || !validTreehouseRoofs()) return false;
  const rooms = loadTreehouseLayout().filter(item => item.id !== id);
  if (!validBuildRooms(rooms)) return false;
  const inventory = loadRoomInventory();
  return commitLocalState({
    [ROOM_EXPANSIONS_KEY]: JSON.stringify({ ...state, rooms: state.rooms.filter(item => item.id !== id) }),
    [TREEHOUSE_LAYOUT_KEY]: JSON.stringify({ version: 1, rooms }),
    [ROOM_INVENTORY_KEY]: JSON.stringify({ ...inventory, placements: inventory.placements.filter(item => item.room !== id) }),
    [TREEHOUSE_ROOFS_KEY]: JSON.stringify(withoutRoomRoofs(id)),
  }, [{ id: `room:sell:${room.purchaseId}`, amount: roomSaleAmount(id) }]).status === 'applied';
}
