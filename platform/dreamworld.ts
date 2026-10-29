import { ASSET_LIBRARY as A } from '../data/assetLibrary';
import { MATH_GAMES } from '../games/math/config';

export type IslandId = 'home' | 'math' | 'cooking' | 'plants' | 'discovery' | 'language';
export interface MapSpot { x: number; y: number; width: number; height: number }
export interface IslandActivity {
  id: string;
  label: string;
  path: string;
  image: string;
  x: number;
  y: number;
}
export interface DreamIsland {
  id: IslandId;
  label: string;
  path: `/islands/${IslandId}`;
  spot: MapSpot;
  background: string;
  backgroundAlt: string;
  modules: string[];
  status: 'available' | 'coming-soon';
  activities: IslandActivity[];
  future: readonly string[];
}
export const DREAMWORLD_IMAGE = '/dreamworld/world-map.png';
export const DREAMWORLD_RATIO = 1672 / 941;
export const WORLD_SHOPS = [
  { id: 'groceries', label: 'Boodschappen', path: '/shop/groceries' },
  { id: 'furniture', label: 'Meubels', path: '/shop/furniture' },
  { id: 'plants', label: 'Planten', path: '/shop/plants' },
] as const;

const activity = (id: string, label: string, path: string, image: string, x: number, y: number): IslandActivity => ({ id, label, path, image, x, y });
const mathPositions = [[19, 38], [48, 34], [77, 38], [19, 72], [48, 70], [77, 72]];
const mathPictures = [A.avatars.lua, '/games/school/math/adventures/blueberry-plant.webp', '/games/school/math/adventures/squirrel.webp', '/games/school/math/adventures/cookie.webp', '/games/school/math/adventures/honey-jar.webp', '/games/school/math/adventures/basket.webp'];

export const DREAM_ISLANDS: DreamIsland[] = [
  { id: 'home', label: 'Mijn boomhut', path: '/islands/home', spot: { x: .49, y: .49, width: .19, height: .27 }, background: A.treehouse.rooms.livingRoom, backgroundAlt: 'Een open houten boomhut met uitzicht op het bos', modules: ['treehouse', 'room-inventory', 'furniture'], status: 'available', future: ['design-island'], activities: [
    activity('treehouse', 'Mijn kamers', '/treehouse', A.treehouse.overview, 50, 55),
  ] },
  { id: 'math', label: 'Rekeneiland', path: '/islands/math', spot: { x: .255, y: .21, width: .25, height: .30 }, background: A.games.babyLua.background, backgroundAlt: 'Een groene vallei met bomen, rotsen en watervallen', modules: ['math', 'red-baby-lua'], status: 'available', future: [], activities: MATH_GAMES.map((game, i) => activity(game.id, game.title, `/school/math/${game.id}`, mathPictures[i], mathPositions[i][0], mathPositions[i][1])) },
  { id: 'cooking', label: 'Kookeiland', path: '/islands/cooking', spot: { x: .805, y: .31, width: .25, height: .30 }, background: A.destinations.cookingStudio, backgroundAlt: 'Een gezellige kookstudio met houten werkbladen', modules: ['cooking', 'groceries', 'recipes', 'nutrition'], status: 'available', future: [], activities: [
    activity('recipes', 'Mijn kookboek', '/treehouse/cookbook', A.treehouse.collections.cookbook, 50, 50),
  ] },
  { id: 'plants', label: 'Planteneiland', path: '/islands/plants', spot: { x: .825, y: .76, width: .27, height: .31 }, background: '/dreamworld/plant-clinic.png', backgroundAlt: 'Een zonnige plantenkas met een ronde werktafel en groene planten', modules: ['plant-family', 'plant-clinic', 'plant-shop', 'plant-knowledge'], status: 'available', future: [], activities: [
    activity('clinic', 'Plantendokter', '/plantendokter', A.avatars.kikiPoses.plant, 26, 44),
  ] },
  { id: 'discovery', label: 'Ontdekkingseiland', path: '/islands/discovery', spot: { x: .24, y: .75, width: .31, height: .28 }, background: A.destinations.travel, backgroundAlt: 'Een reiskamer met kaarten, wereldbollen en uitzicht op de wereld', modules: ['topo', 'clock', 'world-times', 'travel'], status: 'available', future: ['journeys'], activities: [
    activity('topo', 'Topografie', '/games/topo', A.games.schoolActions.topo, 26, 47),
    activity('clock', 'Kloklezen', '/school/clock', '/games/school/clock/clock-set.webp', 73, 47),
    activity('flags', 'Vlaggenmemory', '/games/flags-memory', '/images/logo-compas-geel.svg', 50, 76),
  ] },
  { id: 'language', label: 'Taleneiland', path: '/islands/language', spot: { x: .13, y: .49, width: .24, height: .24 }, background: A.destinations.school, backgroundAlt: 'Een rustige plek om samen nieuwe dingen te ontdekken', modules: [], status: 'coming-soon', future: ['languages'], activities: [] },
];
export const ISLANDS_BY_ID = Object.fromEntries(DREAM_ISLANDS.map(island => [island.id, island])) as Record<IslandId, DreamIsland>;

/** Winkels zijn wereldbreed; activiteiten houden hun eigen eiland als terugweg. */
export function islandForActivity(path: string): DreamIsland | undefined {
  const pathname = path.split('?')[0];
  const explicit = DREAM_ISLANDS.find(island => island.activities.some(item => item.path.split('?')[0] === pathname));
  if (pathname === '/encyclopedie') return ISLANDS_BY_ID[path.includes('tab=voeding') ? 'cooking' : 'plants'];
  if (explicit) return explicit;
  if (pathname.startsWith('/treehouse')) return ISLANDS_BY_ID.home;
  if (pathname.startsWith('/school/math') || pathname === '/games/red-baby-lua') return ISLANDS_BY_ID.math;
  return undefined;
}
