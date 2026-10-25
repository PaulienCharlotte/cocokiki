import type React from 'react';

export type GameId = 'topo' | 'red-baby-lua';

export interface GameModuleProps {
  onHome: () => void;
  onBack?: () => void;
}

export interface GameDefinition {
  id: GameId;
  path: string;
  title: string;
  eyebrow: string;
  description: string;
  status: 'playable' | 'preview';
  theme: 'topo' | 'lua';
  category: string;
  islandTheme: 'forest' | 'mountain';
  islandAsset: string;
  enabled: boolean;
  unlockRequirement?: string;
  load: () => Promise<{ default: React.ComponentType<GameModuleProps> }>;
}

export const GAME_LIBRARY: GameDefinition[] = [
  {
    id: 'topo',
    path: '/games/topo',
    title: 'Topo met Coco',
    eyebrow: 'Aardrijkskunde',
    description: 'Verken kaarten, oefen in groepjes en verdien CocoCoins.',
    status: 'playable',
    theme: 'topo',
    category: 'Aardrijkskunde',
    islandTheme: 'mountain',
    islandAsset: '/games/treehouse/world-v2/island-topo-cutout.png',
    enabled: true,
    load: () => import('../components/Game'),
  },
  {
    id: 'red-baby-lua',
    path: '/games/red-baby-lua',
    title: 'Red Baby Lua!',
    eyebrow: 'Tafels oefenen',
    description: 'Reken snel, grijp de liaan en red Lua van de vallende steen.',
    status: 'playable',
    theme: 'lua',
    category: 'Rekenen',
    islandTheme: 'forest',
    islandAsset: '/games/treehouse/world-v2/island-tables-cutout.png',
    enabled: true,
    load: () => import('../games/red-baby-lua/RedBabyLuaPage'),
  },
];

export const GAMES_BY_ID = Object.fromEntries(GAME_LIBRARY.map(game => [game.id, game])) as Record<GameId, GameDefinition>;
