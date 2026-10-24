import React, { useState } from 'react';
import PlatformHeader from '../../components/platform/PlatformHeader';
import { GameModuleProps } from '../../platform/gameRegistry';
import { loadCurrency } from '../../services/currency';
import RedBabyLuaGame from './RedBabyLuaGame';

export default function RedBabyLuaPage({ onHome }: GameModuleProps) {
  const [coins, setCoins] = useState(loadCurrency);

  return <div className="platform-page lua-page">
    <PlatformHeader onHome={onHome} coins={coins} />
    <main className="lua-game-page"><RedBabyLuaGame onHome={onHome} onCoinsChange={setCoins} /></main>
  </div>;
}
