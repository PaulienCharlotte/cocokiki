import { ASSET_LIBRARY } from './assetLibrary';

export const ROOM_MODULE_INTERIORS = {
  room: ASSET_LIBRARY.treehouse.rooms.livingRoom,
  bedroom: '/assets/library/treehouse/rooms/green-bedroom-interior.png',
  kitchen: ASSET_LIBRARY.treehouse.rooms.kitchen,
  terrace: ASSET_LIBRARY.treehouse.rooms.terrace,
  bathroom: '/assets/library/treehouse/rooms/bathroom-interior.png',
  blush: '/assets/library/treehouse/rooms/blush-interior.png',
  garden: '/assets/library/treehouse/expansions/greenhouse.png',
} as const;

export type BaseRoomId = 'living-room' | 'kitchen' | 'bathroom' | 'bedroom' | 'terrace';
export type ExtraRoomId = `extra-${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11}`;
export type TreehouseRoomId = BaseRoomId | ExtraRoomId;

export interface TreehouseRoomDefinition {
  id: TreehouseRoomId;
  label: string;
  path: `/treehouse/${TreehouseRoomId}`;
  background: string;
  icon: string;
  alt: string;
}

export const TREEHOUSE_ROOMS: TreehouseRoomDefinition[] = [
  {
    id: 'bathroom', label: 'Badkamer', path: '/treehouse/bathroom',
    background: ROOM_MODULE_INTERIORS.bathroom,
    icon: ASSET_LIBRARY.treehouse.icons.home,
    alt: 'Een lege houten kamer voor de badkamer',
  },
  {
    id: 'bedroom',
    label: 'Slaapkamer',
    path: '/treehouse/bedroom',
    background: ROOM_MODULE_INTERIORS.bedroom,
    icon: ASSET_LIBRARY.treehouse.icons.bedroom,
    alt: 'Een rustige houten slaapkamer in de boomhut',
  },
  {
    id: 'terrace',
    label: 'Terras',
    path: '/treehouse/terrace',
    background: ROOM_MODULE_INTERIORS.terrace,
    icon: ASSET_LIBRARY.treehouse.icons.garden,
    alt: 'Een zonnig terras met uitzicht op de bergen',
  },
  {
    id: 'living-room',
    label: 'Woonkamer',
    path: '/treehouse/living-room',
    background: ROOM_MODULE_INTERIORS.room,
    icon: ASSET_LIBRARY.treehouse.icons.livingRoom,
    alt: 'Een lichte houten woonkamer in de boomhut',
  },
  {
    id: 'kitchen',
    label: 'Keuken',
    path: '/treehouse/kitchen',
    background: ROOM_MODULE_INTERIORS.kitchen,
    icon: ASSET_LIBRARY.treehouse.icons.kitchen,
    alt: 'Een warme houten keuken met een groene keukenwand',
  },
];

export const TREEHOUSE_ROOMS_BY_ID = Object.fromEntries(
  TREEHOUSE_ROOMS.map(room => [room.id, room]),
) as Record<BaseRoomId, TreehouseRoomDefinition>;

export function isBaseRoom(id: string): id is BaseRoomId { return Object.hasOwn(TREEHOUSE_ROOMS_BY_ID, id); }
export function isExtraRoom(id: string): id is ExtraRoomId { return /^extra-([1-9]|10|11)$/.test(id); }

export const ROOM_TEMPLATES = [
  { id: 'hobby-room', label: 'Hobbykamer', group: 'inside', background: ROOM_MODULE_INTERIORS.room, icon: ASSET_LIBRARY.treehouse.icons.livingRoom },
  { id: 'extra-bedroom', label: 'Extra slaapkamer', group: 'inside', background: ROOM_MODULE_INTERIORS.bedroom, icon: ASSET_LIBRARY.treehouse.icons.bedroom },
  { id: 'growing-deck', label: 'Kweekhoek', group: 'balcony', background: ROOM_MODULE_INTERIORS.terrace, icon: ASSET_LIBRARY.treehouse.icons.garden },
  { id: 'greenhouse', label: 'Kas', group: 'balcony', background: ROOM_MODULE_INTERIORS.garden, icon: ASSET_LIBRARY.treehouse.icons.garden },
  { id: 'garden-room', label: 'Tuinkamer', group: 'balcony', background: ROOM_MODULE_INTERIORS.garden, icon: ASSET_LIBRARY.treehouse.icons.garden },
  { id: 'bathroom-unit', label: 'Badkamer', group: 'inside', background: ROOM_MODULE_INTERIORS.bathroom, icon: ASSET_LIBRARY.treehouse.icons.home },
  { id: 'blush-room', label: 'Roze kamer', group: 'inside', background: ROOM_MODULE_INTERIORS.blush, icon: ASSET_LIBRARY.treehouse.icons.bedroom },
] as const;
export type RoomTemplateId = typeof ROOM_TEMPLATES[number]['id'];
export const ROOM_TEMPLATE_ASSETS = {
  'hobby-room': 'room', 'extra-bedroom': 'bedroom', 'growing-deck': 'terrace', greenhouse: 'garden',
  'garden-room': 'garden', 'bathroom-unit': 'bathroom', 'blush-room': 'blush',
} as const;
