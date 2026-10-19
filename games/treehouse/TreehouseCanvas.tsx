import React, { useMemo } from 'react';
import { Home, Minus, Plus } from 'lucide-react';
import type { GameDefinition } from '../../platform/gameRegistry';
import BridgeConnector from './world/BridgeConnector';
import DraggableCharacter from './world/DraggableCharacter';
import GameIsland from './world/GameIsland';
import { createWorldLayout, WORLD_CENTER } from './world/layout';
import { useWorldCamera } from './world/useWorldCamera';

interface TreehouseCanvasProps {
  games: GameDefinition[];
  onOpenGame: (game: GameDefinition) => void;
}

export default function TreehouseCanvas({ games, onOpenGame }: TreehouseCanvasProps) {
  const islands = useMemo(() => createWorldLayout(games), [games]);
  const camera = useWorldCamera();

  return <section ref={camera.viewportRef} className="adventure-viewport" aria-label="CocoKiki avonturenwereld"
    onPointerDown={camera.onPointerDown} onPointerMove={camera.onPointerMove}
    onPointerUp={camera.onPointerUp} onPointerCancel={camera.onPointerUp} onWheel={camera.onWheel}>
    <p className="sr-only">Versleep de wereld of gebruik de knoppen om rond te kijken. Kies een eiland om een spel te openen.</p>
    <div className="adventure-world" style={{ transform: `translate(-50%, -50%) translate(${camera.camera.x}px, ${camera.camera.y}px) scale(${camera.camera.zoom})` }}>
      {islands.map(island => <BridgeConnector key={`bridge-${island.game.id}`} from={WORLD_CENTER} to={island} />)}
      <div className="adventure-home-island" style={{ left: WORLD_CENTER.x, top: WORLD_CENTER.y }}>
        <img className="adventure-treehouse" src="/games/treehouse/world-v2/treehouse-central-cutout.png" alt="De centrale boomhut van CocoKiki" draggable={false} />
      </div>
      <DraggableCharacter id="coco" name="Coco" src="/games/treehouse/world-v2/coco-cutout.png" initialPosition={{ x: 1080, y: 1010 }} worldScale={camera.camera.zoom} />
      <DraggableCharacter id="kiki" name="Kiki" src="/games/treehouse/world-v2/kiki-cutout.png" initialPosition={{ x: 1320, y: 1010 }} worldScale={camera.camera.zoom} />
      {islands.map(island => <GameIsland key={island.game.id} island={island} onOpen={() => onOpenGame(island.game)} />)}
    </div>
    <div className="adventure-camera-controls" aria-label="Wereldweergave">
      <button type="button" onClick={camera.reset} title="Terug naar de boomhut" aria-label="Terug naar de boomhut"><Home /></button>
      <button type="button" onClick={() => camera.zoomBy(-0.1)} title="Uitzoomen" aria-label="Uitzoomen"><Minus /></button>
      <button type="button" onClick={() => camera.zoomBy(0.1)} title="Inzoomen" aria-label="Inzoomen"><Plus /></button>
    </div>
  </section>;
}
