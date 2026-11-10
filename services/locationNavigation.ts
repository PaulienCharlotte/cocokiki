export const LOCATION_ORIGINS = {
  lua: { path: '/islands/math', label: 'Terug naar Baby Lua' },
  coco: { path: '/islands/cooking', label: 'Terug naar Coco' },
  kiki: { path: '/islands/plants', label: 'Terug naar Kiki' },
  seb: { path: '/islands/discovery', label: 'Terug naar Seb' },
} as const;
export type LocationOrigin = keyof typeof LOCATION_ORIGINS;
export function locationOrigin(search: string, path?: string): LocationOrigin | null {
  if (path && !acceptsOrigin(path)) return null;
  const value = new URLSearchParams(search).get('from');
  return value === 'coco' || value === 'kiki' || value === 'lua' || value === 'seb' ? value : null;
}
function acceptsOrigin(path: string) {
  return ['/treehouse/cookbook', '/treehouse/kitchen', '/plantendokter', '/plants/collection', '/encyclopedie', '/school/clock', '/shop/groceries', '/games/nutrient-memory', '/games/topo', '/games/flags-memory', '/games/red-baby-lua'].includes(path) || path.startsWith('/school/math/');
}
export function withLocationOrigin(path: string, origin: LocationOrigin | null): string {
  const url = new URL(path, 'https://cocokiki.invalid');
  if (url.origin !== 'https://cocokiki.invalid') return '/';
  url.searchParams.delete('from');
  if (origin && acceptsOrigin(url.pathname)) url.searchParams.set('from', origin);
  return url.pathname + url.search + url.hash;
}
