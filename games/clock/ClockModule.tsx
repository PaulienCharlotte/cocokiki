import React, { useCallback, useEffect, useState } from 'react';
import ClockHub from './ClockHub';
import MemoryGame from './MemoryGame';
import SetClockGame from './SetClockGame';
import ClockRaceGame from './ClockRaceGame';
import WorldTimes from './WorldTimes';
import { loadClockProgress, rewardClockRound } from './clockProgress';
import type { ClockGameId, ClockLevel } from './types';
import './clock.css';

interface ClockModuleProps {
  onBack: () => void;
}

export default function ClockModule({ onBack }: ClockModuleProps) {
  const [game, setGame] = useState<ClockGameId | null>(null);
  const [progress, setProgress] = useState(loadClockProgress);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [game]);

  const complete = useCallback((gameId: ClockGameId, level: ClockLevel, roundId: string, solved?: number) => {
    const amount = rewardClockRound(gameId, level, roundId, solved);
    setProgress(loadClockProgress());
    return amount;
  }, []);

  if (!game) return <div className="clock-module"><ClockHub progress={progress} onPlay={setGame} /></div>;

  const shared = {
    initialLevel: 1 as ClockLevel,
    completedLevels: progress.completed[game],
    onBack: () => setGame(null),
    onComplete: (level: ClockLevel, roundId: string, solved?: number) => complete(game, level, roundId, solved),
  };

  return <div className="clock-module">
    {game === 'memory' && <MemoryGame {...shared} />}
    {game === 'set-clock' && <SetClockGame {...shared} />}
    {game === 'race' && <ClockRaceGame {...shared} />}
    {game === 'world-times' && <WorldTimes {...shared} />}
  </div>;
}
