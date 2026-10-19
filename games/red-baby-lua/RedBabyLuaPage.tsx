import React from 'react';
import PlatformHeader from '../../components/platform/PlatformHeader';
import { GameModuleProps } from '../../platform/gameRegistry';
import RedBabyLuaGame from './RedBabyLuaGame';

export default function RedBabyLuaPage({ onHome }: GameModuleProps) {
  return <div className="platform-page lua-page">
    <PlatformHeader gameTitle="Red Baby Lua!" onHome={onHome} />
    <main className="lua-game-page"><RedBabyLuaGame onHome={onHome} /></main>
  </div>;
}
