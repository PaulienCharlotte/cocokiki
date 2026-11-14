import { resolveRoute } from '../platform/routes';

/** Alleen eigen kameradressen mogen als winkelretour worden gebruikt. */
export function roomReturn(search: string): string | null {
  const value = new URLSearchParams(search).get('returnTo');
  if (!value || !value.startsWith('/treehouse/') || value.includes('?') || value.includes('#')) return null;
  const { route, redirect } = resolveRoute(value);
  return !redirect && route.page === 'treehouse-room' ? route.path : null;
}
export function shopDestination(destination: string, currentPath: string, currentSearch: string): string {
  const url = new URL(destination, 'https://cocokiki.invalid');
  if (url.origin !== 'https://cocokiki.invalid') return '/';
  if (url.pathname === '/shop' || url.pathname.startsWith('/shop/')) {
    const room = resolveRoute(currentPath).route;
    const back = room.page === 'treehouse-room' ? room.path : currentPath === '/shop' || currentPath.startsWith('/shop/') ? roomReturn(currentSearch) : null;
    if (back) {
      if (url.pathname === '/shop' && room.page === 'treehouse-room') url.pathname = '/shop/furniture';
      url.searchParams.set('returnTo', back);
    }
  }
  return url.pathname + url.search + url.hash;
}
