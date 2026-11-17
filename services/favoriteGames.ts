import { ACTIVITY_LIBRARY, type ActivityDefinition } from '../platform/activityRegistry';
import { commitLocalState, readDocument } from './localState';

export const FAVORITE_GAMES_KEY = 'cocokiki:favorite-games:v1';
/** Oude Baby Lua-links verwijzen naar hetzelfde spel, niet naar een tweede favoriet. */
export function favoriteGameId(id: string): string {
  if (id === 'red-baby-lua') return 'math:multiply';
  return ['multiply', 'divide', 'balance', 'race', 'add-subtract'].includes(id) ? `math:${id}` : id;
}
export const FAVORITE_GAME_CATALOG: ActivityDefinition[] = ACTIVITY_LIBRARY.filter(game =>
  game.kind === 'game' && game.status === 'available' && game.id !== 'red-baby-lua',
);
export function canFavoriteGame(id: string): boolean {
  return FAVORITE_GAME_CATALOG.some(game => game.id === favoriteGameId(id));
}
export function loadFavoriteGames(): string[] {
  try {
    const raw: unknown = JSON.parse(readDocument(FAVORITE_GAMES_KEY) ?? '[]');
    return Array.isArray(raw) ? [...new Set(raw.filter((id): id is string => typeof id === 'string').map(favoriteGameId))].filter(canFavoriteGame) : [];
  } catch { return []; }
}
export function toggleFavoriteGame(id: string): boolean {
  const canonical = favoriteGameId(id);
  if (!canFavoriteGame(canonical)) return false;
  const current = loadFavoriteGames();
  const next = current.includes(canonical) ? current.filter(value => value !== canonical) : [...current, canonical];
  return commitLocalState({ [FAVORITE_GAMES_KEY]: JSON.stringify(next) }).status === 'applied';
}
