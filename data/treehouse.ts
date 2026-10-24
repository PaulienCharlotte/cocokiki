import { ASSET_LIBRARY } from './assetLibrary';

export type TreehouseRoomId = 'living-room' | 'kitchen' | 'bedroom' | 'terrace';

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
) as Record<TreehouseRoomId, TreehouseRoomDefinition>;
