export const ROOM_UNIT_ASSET = '/assets/library/treehouse/units/room-prototype.png';

// Alleen de zichtbare houten constructie telt mee, niet de transparante canvasmarge.
export const ROOM_UNIT_FRAME = { sourceWidth: 1448, sourceHeight: 1086, x: 48, y: 162, width: 1354, height: 780 };

export const TREEHOUSE_UNIT_ASSETS = {
  room: { src: ROOM_UNIT_ASSET, label: 'Houten kamer', frame: ROOM_UNIT_FRAME },
  bedroom: { src: '/assets/library/treehouse/units/bedroom.png', label: 'Slaapkamer', frame: { sourceWidth: 1448, sourceHeight: 1086, x: 32, y: 158, width: 1384, height: 784 } },
  kitchen: { src: '/assets/library/treehouse/units/kitchen.png', label: 'Keuken', frame: { sourceWidth: 1536, sourceHeight: 1024, x: 50, y: 99, width: 1438, height: 787 } },
  terrace: { src: '/assets/library/treehouse/units/terrace.png', label: 'Terras', frame: { sourceWidth: 1448, sourceHeight: 1086, x: 0, y: 374, width: 1448, height: 548 } },
  roof: { src: '/assets/library/treehouse/units/roof.png', label: 'Dak', frame: { sourceWidth: 2172, sourceHeight: 724, x: 0, y: 0, width: 2172, height: 704 } },
  trunk: { src: '/assets/library/treehouse/units/trunk.png', label: 'Boomstam', frame: { sourceWidth: 1024, sourceHeight: 1536, x: 8, y: 4, width: 1008, height: 1524 } },
  platform: { src: '/assets/library/treehouse/units/platform.png', label: 'Draagplatform', frame: { sourceWidth: 2172, sourceHeight: 724, x: 50, y: 286, width: 2072, height: 340 } },
  ladder: { src: '/assets/library/treehouse/units/ladder.png', label: 'Ladder', frame: { sourceWidth: 1024, sourceHeight: 1536, x: 278, y: 20, width: 472, height: 1504 } },
  canopy: { src: '/assets/library/treehouse/units/canopy.png', label: 'Bladerkroon', frame: { sourceWidth: 1774, sourceHeight: 887, x: 10, y: 4, width: 1752, height: 850 } },
  trunkLeft: { src: '/assets/library/treehouse/units/trunk-left.png', label: 'Linker boomstam', frame: { sourceWidth: 1024, sourceHeight: 1536, x: 26, y: 4, width: 984, height: 1530 } },
  trunkRight: { src: '/assets/library/treehouse/units/trunk-right.png', label: 'Rechter boomstam', frame: { sourceWidth: 1024, sourceHeight: 1536, x: 22, y: 10, width: 980, height: 1514 } },
  canopyWide: { src: '/assets/library/treehouse/units/canopy-wide.png', label: 'Brede boomtop', frame: { sourceWidth: 1774, sourceHeight: 887, x: 14, y: 14, width: 1752, height: 860 } },
  canopyTall: { src: '/assets/library/treehouse/units/canopy-tall.png', label: 'Luchtige boomtop', frame: { sourceWidth: 1774, sourceHeight: 887, x: 42, y: 4, width: 1710, height: 874 } },
};
export type TreehouseUnitAssetId = keyof typeof TREEHOUSE_UNIT_ASSETS;
export const TREE_TRUNK_ASSETS: readonly TreehouseUnitAssetId[] = ['trunk', 'trunkLeft', 'trunkRight'];
export const TREE_CANOPY_ASSETS: readonly TreehouseUnitAssetId[] = ['canopyWide', 'canopyTall', 'canopy'];
export interface PreviewUnit { id: string; asset: TreehouseUnitAssetId; x: number; y: number; width: number; height: number; flipX?: boolean; roomId?: string }
export type BuildRoomAsset = 'room' | 'bedroom' | 'kitchen' | 'terrace';
export interface BuildRoom { id: string; asset: BuildRoomAsset; name: string; column: number; floor: number; icon?: string }
export function validBuildRooms(rooms: BuildRoom[]): boolean {
  if (!rooms.length || rooms.length > 16 || new Set(rooms.map(room => room.id)).size !== rooms.length || new Set(rooms.map(room => `${room.column}:${room.floor}`)).size !== rooms.length) return false;
  if (rooms.some(room => !Number.isInteger(room.column) || !Number.isInteger(room.floor) || room.column < 0 || room.column > 3 || room.floor < 0 || room.floor > 3)) return false;
  if (!rooms.some(room => room.floor === 0)) return false;
  // Extra bomen dragen zij-uitbreidingen; terrassen blijven naar boven open.
  if (rooms.some(room => rooms.some(below => below.column === room.column && below.floor === room.floor - 1 && below.asset === 'terrace'))) return false;
  const connected = new Set([rooms[0].id]);
  for (let pass = 0; pass < rooms.length; pass++) for (const room of rooms) {
    if (rooms.some(other => connected.has(other.id) && Math.abs(other.column - room.column) + Math.abs(other.floor - room.floor) === 1)) connected.add(room.id);
  }
  return connected.size === rooms.length;
}

export function moveBuildRoom(rooms: BuildRoom[], id: string, column: number, floor: number): BuildRoom[] | null {
  const source = rooms.find(room => room.id === id);
  if (!source) return null;
  const target = rooms.find(room => room.column === column && room.floor === floor);
  const next = rooms.map(room => room.id === source.id ? { ...room, column, floor } : room.id === target?.id ? { ...room, column: source.column, floor: source.floor } : room);
  return validBuildRooms(next) ? next : null;
}
export const INITIAL_BUILD_ROOMS: BuildRoom[] = [
  { id: 'living-room', asset: 'room', name: 'Woonkamer', column: 0, floor: 0 },
  { id: 'kitchen', asset: 'kitchen', name: 'Keuken', column: 1, floor: 0 },
  { id: 'bedroom', asset: 'bedroom', name: 'Slaapkamer', column: 0, floor: 1 },
  { id: 'terrace', asset: 'terrace', name: 'Terras', column: 1, floor: 1 },
];
export const STARTER_HOME_ROOMS: BuildRoom[] = [
  { id: 'living-room', asset: 'room', name: 'Woonkamer', column: 0, floor: 0, icon: 'sofa' },
  { id: 'kitchen', asset: 'kitchen', name: 'Keuken', column: 1, floor: 0, icon: 'pot' },
  { id: 'bathroom', asset: 'kitchen', name: 'Badkamer', column: 2, floor: 0, icon: 'bath' },
  { id: 'bedroom', asset: 'bedroom', name: 'Slaapkamer', column: 0, floor: 1, icon: 'bed' },
  { id: 'terrace', asset: 'terrace', name: 'Terras', column: 1, floor: 1, icon: 'flower' },
];
export function buildSlots(rooms: BuildRoom[]) {
  const slots = new Map<string, { column: number; floor: number }>();
  for (const room of rooms) for (const [column, floor] of [[room.column + 1, room.floor], [room.column - 1, room.floor], [room.column, room.floor + 1]]) {
    if (column < 0 || column >= 4 || floor >= 4 || rooms.some(item => item.column === column && item.floor === floor)) continue;
    if (!validBuildRooms([...rooms, { id: '__new-slot', asset: 'room', name: 'Kamer', column, floor }])) continue;
    slots.set(`${column}:${floor}`, { column, floor });
  }
  return [...slots.values()];
}

export function expandableTreehouseLayout(joined: boolean, rooms: BuildRoom[]) {
  const size = ROOM_UNIT_FRAME, stepX = size.width - (joined ? 72 : 0), stepY = size.height - (joined ? 90 : 0);
  const slots = buildSlots(rooms);
  const highest = Math.max(...rooms.map(room => room.floor), ...slots.map(slot => slot.floor));
  const columns = 1 + Math.max(...rooms.map(room => room.column), ...slots.map(slot => slot.column));
  const width = columns * stepX + 200 + (size.width - stepX), height = 480 + highest * stepY + size.height + 600;
  const units: PreviewUnit[] = [];
  const trees = [...new Set(rooms.map(room => room.column))].sort((a, b) => a - b).map(column => {
    const topFloor = Math.max(...rooms.filter(room => room.column === column).map(room => room.floor));
    return { column, center: 100 + column * stepX + size.width / 2, top: 480 + (highest - topFloor) * stepY - 150 };
  });
  // Bomen worden gratis uit de indeling afgeleid: geen aankoop of los eigendomsrecord.
  for (const [index, tree] of trees.entries()) units.push({ id: `trunk-${tree.column}`, asset: trees.length === 1 ? 'trunk' : index === 0 ? 'trunkLeft' : index === trees.length - 1 ? 'trunkRight' : 'trunk', x: Math.max(0, tree.center - 725), y: tree.top, width: 1450, height: height - tree.top - 60 });
  for (const tree of trees) {
    const asset = TREE_CANOPY_ASSETS[tree.column % TREE_CANOPY_ASSETS.length];
    const frame = TREEHOUSE_UNIT_ASSETS[asset].frame;
    const canopyWidth = Math.min(size.width * [1.3, 1.18, 1.25][tree.column % 3], width - 100);
    units.push({ id: `canopy-${tree.column}`, asset, x: Math.max(50, Math.min(width - canopyWidth - 50, tree.center - canopyWidth / 2)), y: Math.max(10, tree.top - 480), width: canopyWidth, height: canopyWidth * frame.height / frame.width });
  }
  // Platforms liggen achter kamers; alleen de blootliggende delen blijven zichtbaar.
  for (const room of rooms) {
    const x = 100 + room.column * stepX, bottom = 480 + (highest - room.floor) * stepY + size.height;
    const platformWidth = size.width + 40;
    units.push({ id: `platform-${room.id}`, asset: 'platform', x: x - 20, y: bottom - 150, width: platformWidth, height: platformWidth * 340 / 2072 });
  }
  for (const room of [...rooms].sort((a, b) => b.floor - a.floor || a.column - b.column)) {
    const roomHeight = room.asset === 'terrace' ? size.width * TREEHOUSE_UNIT_ASSETS.terrace.frame.height / TREEHOUSE_UNIT_ASSETS.terrace.frame.width : size.height;
    const x = 100 + room.column * stepX, y = 480 + (highest - room.floor) * stepY;
    units.push({ id: room.id, asset: room.asset, x, y: y + size.height - roomHeight, width: size.width, height: roomHeight });
  }
  for (const room of rooms) {
    if (room.asset === 'terrace' || rooms.some(item => item.column === room.column && item.floor > room.floor)) continue;
    const roofWidth = size.width + 80, roofHeight = roofWidth * 704 / 2172;
    units.push({ id: `roof-${room.id}`, asset: 'roof', roomId: room.id, x: 60 + room.column * stepX, y: 480 + (highest - room.floor) * stepY - roofHeight + 130, width: roofWidth, height: roofHeight });
  }
  // Iedere losse kamergroep krijgt toegang; één ladder voor de hele verdieping kan groepen onbereikbaar laten.
  const groundRoom = rooms.filter(room => room.floor === 0).sort((a, b) => a.column - b.column)[0];
  if (groundRoom) units.push({ id: 'ladder-ground', asset: 'ladder', x: 100 + groundRoom.column * stepX + 250, y: 480 + highest * stepY + size.height - 95, width: 210, height: 640 });
  const floors = [...new Set(rooms.filter(room => room.floor > 0).map(room => room.floor))];
  for (const floor of floors) {
    const groups: BuildRoom[][] = [];
    for (const room of rooms.filter(item => item.floor === floor).sort((a, b) => a.column - b.column)) {
      const last = groups[groups.length - 1];
      if (!last || room.column !== last[last.length - 1].column + 1) groups.push([room]);
      else last.push(room);
    }
    for (const [index, group] of groups.entries()) {
      const room = group.find(item => rooms.some(below => below.column === item.column && below.floor === floor - 1 && below.asset !== 'terrace'));
      if (!room) continue;
      const ladderHeight = stepY + 110;
      units.push({ id: `ladder-${floor}-${index}`, asset: 'ladder', x: 100 + room.column * stepX + size.width - 200, y: 480 + (highest - floor) * stepY + size.height - 70, width: ladderHeight * 472 / 1504, height: ladderHeight });
    }
  }
  return { width, height, units, highest, stepX, stepY, slots: slots.map(slot => ({ ...slot, x: 100 + slot.column * stepX, y: 480 + (highest - slot.floor) * stepY, width: size.width, height: size.height })) };
}

export function assembledTreehouseLayout(joined: boolean): { width: number; height: number; units: PreviewUnit[] } {
  const stepX = ROOM_UNIT_FRAME.width - (joined ? 72 : 0);
  const stepY = ROOM_UNIT_FRAME.height - (joined ? 90 : 0);
  const left = 100, upper = 480, size = ROOM_UNIT_FRAME;
  // Het terras lijnt uit op de onderbalk, niet op de bovenkant van zijn canvas.
  const terraceHeight = size.width * TREEHOUSE_UNIT_ASSETS.terrace.frame.height / TREEHOUSE_UNIT_ASSETS.terrace.frame.width;
  const roofWidth = size.width + 80;
  const roofHeight = roofWidth * TREEHOUSE_UNIT_ASSETS.roof.frame.height / TREEHOUSE_UNIT_ASSETS.roof.frame.width;
  return { width: left * 2 + stepX + size.width, height: upper + stepY + size.height + 600, units: [
    { id: 'trunk', asset: 'trunk', x: 500, y: 180, width: 1450, height: 1450 * 1524 / 1008 },
    { id: 'bedroom', asset: 'bedroom', x: left, y: upper, width: size.width, height: size.height },
    { id: 'terrace', asset: 'terrace', x: left + stepX, y: upper + size.height - terraceHeight, width: size.width, height: terraceHeight },
    { id: 'living-room', asset: 'room', x: left, y: upper + stepY, width: size.width, height: size.height },
    { id: 'kitchen', asset: 'kitchen', x: left + stepX, y: upper + stepY, width: size.width, height: size.height },
    { id: 'roof', asset: 'roof', x: left - 40, y: upper - roofHeight + 130, width: roofWidth, height: roofHeight },
  ] };
}

export function prototypeUnitLayout(joined: boolean) {
  const { width, height } = ROOM_UNIT_FRAME;
  const stepX = width - (joined ? 72 : 0);
  const stepY = height - (joined ? 90 : 0);
  return {
    width: width + stepX,
    height: height + stepY,
    units: Array.from({ length: 4 }, (_, index) => ({
      id: `prototype-${index + 1}`,
      x: (index % 2) * stepX,
      y: Math.floor(index / 2) * stepY,
    })),
  };
}
