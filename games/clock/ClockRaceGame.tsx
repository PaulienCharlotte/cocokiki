import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import AnalogClock from './AnalogClock';
import { loadClockRaceMode, saveClockRaceMode } from './clockProgress';
import { clockTimeKey, createRaceRound, formatDigitalTime, formatDutchTime, sameClockTime } from './timeEngine';
import { ClockCompletion, ClockGameHeader } from './ClockControls';
import type { ClockLevel, ClockRaceMode } from './types';

interface ClockRaceGameProps {
  initialLevel: ClockLevel;
  completedLevels: ClockLevel[];
  onBack: () => void;
  onComplete: (level: ClockLevel, roundId: string) => number;
}

const ROUND_COUNT = 5;
const MODES: Array<{ id: ClockRaceMode; label: string }> = [
  { id: 'analog', label: 'Analoog' },
  { id: 'digital', label: 'Digitaal' },
  { id: 'mixed', label: 'Allebei' },
];

export default function ClockRaceGame({ initialLevel, completedLevels, onBack, onComplete }: ClockRaceGameProps) {
  const [level, setLevel] = useState(initialLevel);
  const [mode, setMode] = useState<ClockRaceMode>(loadClockRaceMode);
  const [round, setRound] = useState(() => createRaceRound(initialLevel));
  const [roundIndex, setRoundIndex] = useState(0);
  const [correctSelection, setCorrectSelection] = useState<string | null>(null);
  const [wrongSelections, setWrongSelections] = useState<string[]>([]);
  const [reward, setReward] = useState<number | null>(null);
  const roundId = useRef(crypto.randomUUID());

  const reset = (nextLevel = level) => {
    roundId.current = crypto.randomUUID();
    setLevel(nextLevel);
    setRound(createRaceRound(nextLevel));
    setRoundIndex(0);
    setCorrectSelection(null);
    setWrongSelections([]);
    setReward(null);
  };

  const next = useCallback(() => {
    if (roundIndex + 1 >= ROUND_COUNT) {
      setReward(onComplete(level, roundId.current));
      return;
    }
    setRoundIndex(current => current + 1);
    setRound(createRaceRound(level));
    setCorrectSelection(null);
    setWrongSelections([]);
  }, [level, onComplete, roundIndex]);

  useEffect(() => {
    if (!correctSelection || reward !== null) return;
    const timeout = window.setTimeout(next, 950);
    return () => window.clearTimeout(timeout);
  }, [correctSelection, next, reward]);

  const chooseMode = (nextMode: ClockRaceMode) => {
    setMode(nextMode);
    saveClockRaceMode(nextMode);
  };

  const select = (key: string, isCorrect: boolean) => {
    if (correctSelection || wrongSelections.includes(key)) return;
    if (isCorrect) setCorrectSelection(key);
    else setWrongSelections(current => [...current, key]);
  };

  const digitalPrompt = level >= 4 && roundIndex % 2 === 1;

  return <main className="clock-game clock-race">
    <ClockGameHeader title="Klokkenrace" level={level} completed={completedLevels} onBack={onBack} onLevelChange={reset} />
    <div className="clock-race__modes" role="group" aria-label="Kies het soort klok">
      {MODES.map(option => <button key={option.id} type="button" aria-pressed={mode === option.id} onClick={() => chooseMode(option.id)}>{option.label}</button>)}
    </div>
    <section className="clock-instruction">
      <span>Welke klok hoort bij</span><h2>{digitalPrompt ? formatDigitalTime(round.target) : formatDutchTime(round.target)}?</h2>
      <small>Opdracht {roundIndex + 1} van {ROUND_COUNT}</small>
    </section>
    <div className="clock-race__choices">
      {round.options.map((time, index) => {
        const key = clockTimeKey(time);
        const isCorrect = sameClockTime(time, round.target);
        const isWrong = wrongSelections.includes(key);
        const isChosenCorrect = correctSelection === key;
        const representation = mode === 'mixed' ? ((roundIndex + index) % 3 === 1 ? 'digital' : 'analog') : mode;
        return <button
          type="button"
          key={`${key}-${index}`}
          className={`${isChosenCorrect ? 'is-selected is-correct' : ''}${isWrong ? ' is-selected is-wrong' : ''}`}
          aria-label={`Klok ${index + 1}: ${formatDigitalTime(time)}`}
          disabled={Boolean(correctSelection) || isWrong}
          onClick={() => select(key, isCorrect)}
        >
          {representation === 'digital'
            ? <span className="clock-digital-choice">{formatDigitalTime(time)}</span>
            : <AnalogClock time={time} color={['coral', 'blue', 'green'][index] as 'coral' | 'blue' | 'green'} />}
          <span className="clock-choice-label">Klok {index + 1}</span>
        </button>;
      })}
    </div>
    <div className="clock-game__feedback" aria-live="polite">
      {correctSelection && <span className="is-correct"><Check size={18} /> Goed gezien!</span>}
      {!correctSelection && wrongSelections.length > 0 && <span className="is-wrong">Bijna. Probeer een andere klok.</span>}
    </div>
    {reward !== null && <ClockCompletion reward={reward} onReplay={() => reset()} onHub={onBack} />}
  </main>;
}
