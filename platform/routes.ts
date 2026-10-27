import type { DestinationId } from './destinationRegistry';
import { isExtraRoom, type TreehouseRoomId } from '../data/treehouse';
export type TreehouseSectionId = 'cookbook';

export type AppRoute =
  | { page: 'home'; path: '/' }
  | { page: 'destination'; path: `/${DestinationId}`; destinationId: DestinationId }
  | { page: 'treehouse-room'; path: `/treehouse/${TreehouseRoomId}`; room: TreehouseRoomId }
  | { page: 'treehouse-section'; path: `/treehouse/${TreehouseSectionId}`; section: TreehouseSectionId }
  | { page: 'encyclopedia'; path: '/encyclopedie' }
  | { page: 'challenges'; path: '/challenges' }
  | { page: 'plant-clinic'; path: '/plantendokter' }
  | { page: 'clock'; path: '/school/clock' }
  | { page: 'math'; path: '/school/math' }
  | { page: 'design-system'; path: '/design-system' }
  | { page: 'game'; path: string; gameId: 'topo' | 'red-baby-lua' };

const DESTINATION_ROUTES: Record<string, AppRoute> = {
  '/treehouse': { page: 'destination', path: '/treehouse', destinationId: 'treehouse' },
  '/travel': { page: 'destination', path: '/travel', destinationId: 'travel' },
  '/shop': { page: 'destination', path: '/shop', destinationId: 'shop' },
};

const TREEHOUSE_ROUTES: Record<string, AppRoute> = {
  '/treehouse/living-room': { page: 'treehouse-room', path: '/treehouse/living-room', room: 'living-room' },
  '/treehouse/kitchen': { page: 'treehouse-room', path: '/treehouse/kitchen', room: 'kitchen' },
  '/treehouse/bedroom': { page: 'treehouse-room', path: '/treehouse/bedroom', room: 'bedroom' },
  '/treehouse/terrace': { page: 'treehouse-room', path: '/treehouse/terrace', room: 'terrace' },
  '/treehouse/cookbook': { page: 'treehouse-section', path: '/treehouse/cookbook', section: 'cookbook' },
};

const CLINIC_ROUTES: Record<string, AppRoute> = {
  '/plantendokter': { page: 'plant-clinic', path: '/plantendokter' },
};

const GAME_ROUTES: Record<string, AppRoute> = {
  '/games/topo': { page: 'game', path: '/games/topo', gameId: 'topo' },
  '/games/red-baby-lua': { page: 'game', path: '/games/red-baby-lua', gameId: 'red-baby-lua' },
};

const LEGACY_ROUTES: Record<string, string> = {
  '/plantdokter': '/plantendokter',
  '/treehouse/encyclopedia': '/encyclopedie',
  '/encyclopedia': '/encyclopedie',
  '/encyclopedie.html': '/encyclopedie',
  '/kliniek': '/plantendokter',
  '/cooking': '/treehouse/cookbook',
  '/topo': '/games/topo',
  '/topo-coco': '/games/topo',
  '/game/topo': '/games/topo',
  '/red-baby-lua': '/games/red-baby-lua',
  '/games/lua': '/games/red-baby-lua',
  '/index.html': '/',
};

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return '/' + pathname.split('/').filter(Boolean).join('/');
}

export function resolveRoute(pathname: string): { route: AppRoute; redirect: boolean } {
  const normalized = normalizePath(pathname);
  const canonical = LEGACY_ROUTES[normalized] ?? normalized;
  let route: AppRoute;
  if (canonical === '/') route = { page: 'home', path: '/' };
  else if (canonical.startsWith('/treehouse/') && isExtraRoom(canonical.slice('/treehouse/'.length))) route = { page: 'treehouse-room', path: canonical as `/treehouse/${TreehouseRoomId}`, room: canonical.slice('/treehouse/'.length) as TreehouseRoomId };
  else if (TREEHOUSE_ROUTES[canonical]) route = TREEHOUSE_ROUTES[canonical];
  else if (DESTINATION_ROUTES[canonical]) route = DESTINATION_ROUTES[canonical];
  else if (CLINIC_ROUTES[canonical]) route = CLINIC_ROUTES[canonical];
  else if (canonical === '/encyclopedie') route = { page: 'encyclopedia', path: '/encyclopedie' };
  else if (canonical === '/challenges') route = { page: 'challenges', path: '/challenges' };
  else if (canonical === '/school/clock') route = { page: 'clock', path: '/school/clock' };
  else if (canonical === '/school/math') route = { page: 'math', path: '/school/math' };
  else if (canonical === '/design-system') route = { page: 'design-system', path: '/design-system' };
  else route = GAME_ROUTES[canonical] ?? { page: 'home', path: '/' };
  return { route, redirect: normalized !== route.path };
}
