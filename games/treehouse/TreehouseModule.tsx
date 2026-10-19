import React, { useMemo } from 'react';
import PlatformHeader from '../../components/platform/PlatformHeader';
import CocoCoin from '../../components/platform/CocoCoin';
import { GAME_LIBRARY } from '../../platform/gameRegistry';
import { loadCurrency } from '../../services/currency';
import TreehouseCanvas from './TreehouseCanvas';
import './treehouse.css';

interface TreehouseModuleProps {
  onNavigate: (path: string) => void;
}

export default function TreehouseModule({ onNavigate }: TreehouseModuleProps) {
  const coins = useMemo(loadCurrency, []);
  const games = useMemo(() => GAME_LIBRARY.filter(game => game.enabled && game.status === 'playable'), []);

  return <div className="platform-page treehouse-module">
    <PlatformHeader
      actions={<span className="treehouse-balance" aria-label={`${coins} CocoCoins`}><CocoCoin size={22} />{coins}</span>}
    />
    <main className="treehouse-main">
      <TreehouseCanvas
        games={games}
        onOpenGame={game => onNavigate(game.path)}
      />
    </main>
  </div>;
}
