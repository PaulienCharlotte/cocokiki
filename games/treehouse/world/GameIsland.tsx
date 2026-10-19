import React from 'react';
import type { GameIslandLayout } from './layout';

interface GameIslandProps { key?: string; island: GameIslandLayout; onOpen: () => void; }

export default function GameIsland({ island, onOpen }: GameIslandProps) {
  const { game, x, y } = island;
  const locked = Boolean(game.unlockRequirement);
  return <button
    type="button"
    className={`adventure-island adventure-island-${game.islandTheme}`}
    style={{ left: x, top: y }}
    onClick={onOpen}
    aria-label={`${game.title} openen`}
    disabled={locked}
  >
    <img src={game.islandAsset} alt="" draggable={false} />
    {locked && <span className="adventure-island-lock">{game.unlockRequirement}</span>}
  </button>;
}
