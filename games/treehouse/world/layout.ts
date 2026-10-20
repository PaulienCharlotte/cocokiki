import type { GameDefinition } from '../../../platform/gameRegistry';

export interface WorldPoint { x: number; y: number; }
export interface GameIslandLayout extends WorldPoint { game: GameDefinition; }

export const WORLD_CENTER: WorldPoint = { x: 1200, y: 780 };

const FIRST_SLOTS: WorldPoint[] = [
  { x: 760, y: 790 },
  { x: 1640, y: 790 },
  { x: 760, y: 250 },
  { x: 1640, y: 250 },
];

function pointForIndex(index: number): WorldPoint {
  if (FIRST_SLOTS[index]) return FIRST_SLOTS[index];
  const extraIndex = index - FIRST_SLOTS.length;
  const ring = Math.floor(extraIndex / 8) + 1;
  const slot = extraIndex % 8;
  const angle = -Math.PI / 2 + slot * (Math.PI / 4);
  return {
    x: WORLD_CENTER.x + Math.cos(angle) * (900 + ring * 340),
    y: WORLD_CENTER.y + Math.sin(angle) * (610 + ring * 250),
  };
}

export function createWorldLayout(games: GameDefinition[]): GameIslandLayout[] {
  return games.map((game, index) => ({ game, ...pointForIndex(index) }));
}
