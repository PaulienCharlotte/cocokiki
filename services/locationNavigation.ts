export const LOCATION_ORIGINS = {
  felix: { path: '/islands/math', label: 'Terug naar Felix' },
  milo: { path: '/islands/cooking', label: 'Terug naar Milo' },
  novi: { path: '/islands/plants', label: 'Terug naar Novi' },
} as const;
export type LocationOrigin = keyof typeof LOCATION_ORIGINS;
export function locationOrigin(search: string, path?: string): LocationOrigin | null {
  if (path && !acceptsOrigin(path)) return null;
  const value = new URLSearchParams(search).get('from');
  return value === 'milo' || value === 'novi' || value === 'felix' ? value : null;
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
