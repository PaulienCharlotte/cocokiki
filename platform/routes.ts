export type AppRoute =
  | { page: 'home'; path: '/' }
  | { page: 'game'; path: string; gameId: 'topo' | 'red-baby-lua' };

const GAME_ROUTES: Record<string, AppRoute> = {
  '/games/topo': { page: 'game', path: '/games/topo', gameId: 'topo' },
  '/games/red-baby-lua': { page: 'game', path: '/games/red-baby-lua', gameId: 'red-baby-lua' },
};

const LEGACY_ROUTES: Record<string, string> = {
  '/topo': '/games/topo',
  '/topo-coco': '/games/topo',
  '/game/topo': '/games/topo',
  '/red-baby-lua': '/games/red-baby-lua',
  '/games/lua': '/games/red-baby-lua',
  '/treehouse': '/',
  '/index.html': '/',
};

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  return '/' + pathname.split('/').filter(Boolean).join('/');
}

export function resolveRoute(pathname: string): { route: AppRoute; redirect: boolean } {
  const normalized = normalizePath(pathname);
  const canonical = LEGACY_ROUTES[normalized] ?? normalized;
  const route = canonical === '/'
    ? { page: 'home', path: '/' } as const
    : GAME_ROUTES[canonical] ?? ({ page: 'home', path: '/' } as const);
  return { route, redirect: normalized !== route.path };
}
