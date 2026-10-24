export interface WorldIslandDefinition {
  id: 'treehouse' | 'school' | 'shop';
  label: string;
  path: '/treehouse' | '/challenges' | '/shop';
  image: string;
  alt: string;
}

export const WORLD_ISLANDS: WorldIslandDefinition[] = [
  {
    id: 'treehouse',
    label: 'Mijn Boomhut',
    path: '/treehouse',
    image: ASSET_LIBRARY.world.treehouseIsland,
    alt: 'Een knusse boomhut op een zwevend eiland',
  },
  {
    id: 'school',
    label: 'School',
    path: '/challenges',
    image: ASSET_LIBRARY.world.schoolIsland,
    alt: 'Een avontuurlijke school op een zwevend eiland',
  },
  {
    id: 'shop',
    label: 'Winkels',
    path: '/shop',
    image: ASSET_LIBRARY.world.shopIsland,
    alt: 'Een gezellige winkel op een zwevend eiland',
  },
];
import { ASSET_LIBRARY } from './assetLibrary';

