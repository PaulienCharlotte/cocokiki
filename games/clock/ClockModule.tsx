import React, { useCallback, useState } from 'react';
import { awardCurrencyOnce } from '../../services/currency';
import ClockHub from './ClockHub';
import MemoryGame from './MemoryGame';
import SetClockGame from './SetClockGame';
import ClockRaceGame from './ClockRaceGame';
import { clockLevelReward, completeClockLevel, loadClockProgress, saveClockProgress } from './clockProgress';
import type { ClockGameId, ClockLevel } from './types';
import './clock.css';

interface ClockModuleProps {
  onBack: () => void;
}

export default function ClockModule({ onBack }: ClockModuleProps) {
  const [game, setGame] = useState<ClockGameId | null>(null);
  const [progress, setProgress] = useState(loadClockProgress);

  const complete = useCallback((gameId: ClockGameId, level: ClockLevel) => {
    const amount = clockLevelReward(level);
    const award = awardCurrencyOnce(`clock:${gameId}:level:${level}`, amount);
    setProgress(current => {
      const result = completeClockLevel(current, gameId, level);
      saveClockProgress(result.progress);
      return result.progress;
    });
    return award.applied ? amount : 0;
  }, []);

  if (!game) return <div className="clock-module"><ClockHub progress={progress} onPlay={setGame} /></div>;

  const shared = {
    initialLevel: 1 as ClockLevel,
    completedLevels: progress.completed[game],
    onBack: () => setGame(null),
    onComplete: (level: ClockLevel) => complete(game, level),
  };

  return <div className="clock-module">
    {game === 'memory' && <MemoryGame {...shared} />}
    {game === 'set-clock' && <SetClockGame {...shared} />}
    {game === 'race' && <ClockRaceGame {...shared} />}
  </div>;
}
