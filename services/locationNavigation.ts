export const LOCATION_ORIGINS = {
  orders: { path: '/cooking/orders', label: 'Terug naar kookopdrachten' },
  tasks: { path: '/opdrachten', label: 'Terug naar To Do' },
  lua: { path: '/islands/math', label: 'Terug naar Baby Lua' },
  coco: { path: '/islands/cooking', label: 'Terug naar Coco' },
  kiki: { path: '/islands/plants', label: 'Terug naar Kiki' },
  seb: { path: '/islands/discovery', label: 'Terug naar Seb' },
} as const;
export type LocationOrigin = keyof typeof LOCATION_ORIGINS;
export function locationOrigin(search: string, path?: string): LocationOrigin | null {
  if (path && !acceptsOrigin(path)) return null;
  const value = new URLSearchParams(search).get('from');
  const valid = value === 'coco' || value === 'kiki' || value === 'lua' || value === 'seb' || value === 'tasks' || value === 'orders';
  return valid && (!path || LOCATION_ORIGINS[value].path !== path) ? value : null;
}
function acceptsOrigin(path: string) {
  if (['/plants/garden', '/games/taartenatelier', '/opdrachten/luna-babykamer'].includes(path)) return true;
  return ['/cooking/orders', '/cooking/kitchen', '/treehouse/cookbook', '/treehouse/kitchen', '/plantendokter', '/plants/collection', '/encyclopedie', '/school/clock', '/shop/groceries', '/games/nutrient-memory', '/games/topo', '/games/flags-memory', '/games/red-baby-lua'].includes(path) || path.startsWith('/school/math/');
}
export function withLocationOrigin(path: string, origin: LocationOrigin | null): string {
  const url = new URL(path, 'https://cocokiki.invalid');
  if (url.origin !== 'https://cocokiki.invalid') return '/';
  url.searchParams.delete('from');
  if (origin && acceptsOrigin(url.pathname) && LOCATION_ORIGINS[origin].path !== url.pathname) url.searchParams.set('from', origin);
  return url.pathname + url.search + url.hash;
}
