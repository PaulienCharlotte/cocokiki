import React, { useCallback, useState } from 'react';
import ClockHub from './ClockHub';
import MemoryGame from './MemoryGame';
import SetClockGame from './SetClockGame';
import ClockRaceGame from './ClockRaceGame';
import { loadClockProgress, rewardClockRound } from './clockProgress';
import type { ClockGameId, ClockLevel } from './types';
import './clock.css';

interface ClockModuleProps {
  onBack: () => void;
}

export default function ClockModule({ onBack }: ClockModuleProps) {
  const [game, setGame] = useState<ClockGameId | null>(null);
  const [progress, setProgress] = useState(loadClockProgress);

  const complete = useCallback((gameId: ClockGameId, level: ClockLevel, roundId: string) => {
    const amount = rewardClockRound(gameId, level, roundId);
    setProgress(loadClockProgress());
    return amount;
  }, []);

  if (!game) return <div className="clock-module"><ClockHub progress={progress} onPlay={setGame} /></div>;

  const shared = {
    initialLevel: 1 as ClockLevel,
    completedLevels: progress.completed[game],
    onBack: () => setGame(null),
    onComplete: (level: ClockLevel, roundId: string) => complete(game, level, roundId),
  };

  return <div className="clock-module">
    {game === 'memory' && <MemoryGame {...shared} />}
    {game === 'set-clock' && <SetClockGame {...shared} />}
    {game === 'race' && <ClockRaceGame {...shared} />}
  </div>;
}
