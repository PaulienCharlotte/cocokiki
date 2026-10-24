import React, { useEffect, useRef, useState } from 'react';
import AnalogClock from './AnalogClock';
import { createMemoryDeck, formatDigitalTime } from './timeEngine';
import { ClockCompletion, ClockGameHeader } from './ClockControls';
import type { ClockLevel, MemoryCardData } from './types';

interface MemoryGameProps {
  initialLevel: ClockLevel;
  completedLevels: ClockLevel[];
  onBack: () => void;
  onComplete: (level: ClockLevel) => number;
}

export default function MemoryGame({ initialLevel, completedLevels, onBack, onComplete }: MemoryGameProps) {
  const [level, setLevel] = useState(initialLevel);
  const [deck, setDeck] = useState<MemoryCardData[]>(() => createMemoryDeck(initialLevel));
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const completionClaimed = useRef(false);

  const reset = (nextLevel = level) => {
    setLevel(nextLevel);
    setDeck(createMemoryDeck(nextLevel));
    setOpen([]);
    setMatched([]);
    setLocked(false);
    setReward(null);
    completionClaimed.current = false;
  };

  useEffect(() => {
    if (open.length !== 2) return;
    const [first, second] = open.map(id => deck.find(card => card.id === id)!);
    if (first.pairId === second.pairId) {
      const nextMatched = [...matched, first.pairId];
      setMatched(nextMatched);
      setOpen([]);
      if (nextMatched.length === deck.length / 2 && !completionClaimed.current) {
        completionClaimed.current = true;
        setReward(onComplete(level));
      }
      return;
    }
    setLocked(true);
    const timeout = window.setTimeout(() => { setOpen([]); setLocked(false); }, 650);
    return () => window.clearTimeout(timeout);
  }, [open, deck, level, matched, onComplete]);

  const flip = (card: MemoryCardData) => {
    if (locked || open.includes(card.id) || matched.includes(card.pairId) || reward !== null) return;
    setOpen(current => [...current, card.id]);
  };

  return <main className="clock-game clock-memory">
    <ClockGameHeader title="Klokmemory" level={level} completed={completedLevels} onBack={onBack} onLevelChange={reset} />
    <div className="clock-round-meta"><span>Vind de paren</span><strong>{matched.length}/{deck.length / 2}</strong></div>
    <section className="clock-memory__grid" aria-label="Klokmemory kaarten">
      {deck.map(card => {
        const revealed = open.includes(card.id) || matched.includes(card.pairId);
        return <button
          key={card.id}
          type="button"
          className={`clock-memory-card${revealed ? ' is-open' : ''}${matched.includes(card.pairId) ? ' is-matched' : ''}`}
          aria-label={revealed ? `${card.kind === 'analog' ? 'Analoge' : 'Digitale'} klok ${formatDigitalTime(card.time)}` : 'Gesloten kaart'}
          aria-pressed={revealed}
          onClick={() => flip(card)}
        >
          <span className="clock-memory-card__inner">
            <span className="clock-memory-card__back" aria-hidden="true"><i /></span>
            <span className="clock-memory-card__front">
              {card.kind === 'analog'
                ? <AnalogClock time={card.time} color={['blue', 'coral', 'green'][deck.indexOf(card) % 3] as 'blue' | 'coral' | 'green'} />
                : <strong>{formatDigitalTime(card.time)}</strong>}
            </span>
          </span>
        </button>;
      })}
    </section>
    {reward !== null && <ClockCompletion reward={reward} onReplay={() => reset()} onHub={onBack} />}
  </main>;
}
