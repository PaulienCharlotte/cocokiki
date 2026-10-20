import React, { useMemo } from 'react';
import type { GameDefinition } from '../../platform/gameRegistry';
import GameIsland from './world/GameIsland';
import { createWorldLayout } from './world/layout';

interface TreehouseCanvasProps {
  games: GameDefinition[];
  onOpenGame: (game: GameDefinition) => void;
}

export default function TreehouseCanvas({ games, onOpenGame }: TreehouseCanvasProps) {
  const islands = useMemo(() => createWorldLayout(games), [games]);

  return <section className="game-island-world" aria-label="Kies een spel">
    <div className="game-island-grid">
      {islands.map(island => <GameIsland key={`mobile-${island.game.id}`} island={island} onOpen={() => onOpenGame(island.game)} />)}
    </div>
  </section>;
}
