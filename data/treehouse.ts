import { ASSET_LIBRARY } from './assetLibrary';

export type BaseRoomId = 'living-room' | 'kitchen' | 'bedroom' | 'terrace';
export type ExtraRoomId = `extra-${1 | 2 | 3 | 4 | 5}`;
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
    id: 'bedroom',
    label: 'Slaapkamer',
    path: '/treehouse/bedroom',
    background: ASSET_LIBRARY.treehouse.rooms.bedroom,
    icon: ASSET_LIBRARY.treehouse.icons.bedroom,
    alt: 'Een rustige houten slaapkamer in de boomhut',
  },
  {
    id: 'terrace',
    label: 'Terras',
    path: '/treehouse/terrace',
    background: ASSET_LIBRARY.treehouse.rooms.terrace,
    icon: ASSET_LIBRARY.treehouse.icons.garden,
    alt: 'Een zonnig terras met uitzicht op de bergen',
  },
  {
    id: 'living-room',
    label: 'Woonkamer',
    path: '/treehouse/living-room',
    background: ASSET_LIBRARY.treehouse.rooms.livingRoom,
    icon: ASSET_LIBRARY.treehouse.icons.livingRoom,
    alt: 'Een lichte houten woonkamer in de boomhut',
  },
  {
    id: 'kitchen',
    label: 'Keuken',
    path: '/treehouse/kitchen',
    background: ASSET_LIBRARY.treehouse.rooms.kitchen,
    icon: ASSET_LIBRARY.treehouse.icons.kitchen,
    alt: 'Een warme houten keuken met een groene keukenwand',
  },
];

export const TREEHOUSE_ROOMS_BY_ID = Object.fromEntries(
  TREEHOUSE_ROOMS.map(room => [room.id, room]),
) as Record<BaseRoomId, TreehouseRoomDefinition>;

export function isBaseRoom(id: string): id is BaseRoomId { return Object.hasOwn(TREEHOUSE_ROOMS_BY_ID, id); }
export function isExtraRoom(id: string): id is ExtraRoomId { return /^extra-[1-5]$/.test(id); }

export const ROOM_TEMPLATES = [
  { id: 'hobby-room', label: 'Hobbykamer', group: 'inside', background: '/assets/library/treehouse/expansions/hobby-room.png', icon: ASSET_LIBRARY.treehouse.icons.livingRoom },
  { id: 'extra-bedroom', label: 'Extra slaapkamer', group: 'inside', background: '/assets/library/treehouse/expansions/extra-bedroom.png', icon: ASSET_LIBRARY.treehouse.icons.bedroom },
  { id: 'growing-deck', label: 'Kweekhoek', group: 'balcony', background: '/assets/library/treehouse/expansions/growing-deck.png', icon: ASSET_LIBRARY.treehouse.icons.garden },
  { id: 'greenhouse', label: 'Kas', group: 'balcony', background: '/assets/library/treehouse/expansions/greenhouse.png', icon: ASSET_LIBRARY.treehouse.icons.garden },
] as const;
export type RoomTemplateId = typeof ROOM_TEMPLATES[number]['id'];
