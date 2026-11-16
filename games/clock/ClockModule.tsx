import React, { useCallback, useEffect, useState } from 'react';
import { Globe2, SkipForward } from 'lucide-react';
import { Button, Dialog } from '../../design-system';
import SpeechBubble from '../../components/ui/SpeechBubble';
import MemoryGame from './MemoryGame';
import SetClockGame from './SetClockGame';
import ClockRaceGame from './ClockRaceGame';
import { WorldClock } from './WorldTimes';
import { loadClockProgress, rewardClockRound } from './clockProgress';
import type { ClockGameId, ClockLevel } from './types';
import './clock.css';
import './klok-huisstijl.css';

const VARIATION = ['set-clock', 'race', 'memory'] as const;
export default function ClockModule({ onBack }: { onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [level, setLevel] = useState<ClockLevel>(1);
  const [travelOpen, setTravelOpen] = useState(false);
  const [progress, setProgress] = useState(loadClockProgress);
  const game = VARIATION[index % VARIATION.length];
  useEffect(() => { window.scrollTo({ top: 0 }); }, [index]);
  const next = () => setIndex(value => value + 1);
  const complete = useCallback((gameId: ClockGameId, level: ClockLevel, roundId: string, solved?: number) => {
    const amount = rewardClockRound(gameId, level, roundId, solved);
    setProgress(loadClockProgress()); return amount;
  }, []);
  const shared = { initialLevel: level, completedLevels: progress.completed[game], onBack, onNext: next, onLevelSelect: setLevel,
    onComplete: (level: ClockLevel, roundId: string, solved?: number) => complete(game, level, roundId, solved) };
  return <div className="clock-module ck-scherm klok-scherm klok-avontuur" data-wereld="wereld">
    <img className="klok-scherm__achtergrond" src="/dreamworld/topo-interior.webp" alt="" />
    <nav className="clock-variation ck-glas" aria-label="Klokavontuur">
      <Button variant="quiet" size="small" startIcon={<SkipForward />} onClick={next}>Andere spelvorm</Button>
      <Button variant="quiet" size="small" startIcon={<Globe2 />} onClick={() => setTravelOpen(true)}>Op reis met Seb</Button>
    </nav>
    {game === 'memory' && <MemoryGame key={index} {...shared} />}
    {game === 'set-clock' && <SetClockGame key={index} {...shared} />}
    {game === 'race' && <ClockRaceGame key={index} {...shared} />}
    <Dialog className="clock-travel-dialog" open={travelOpen} title="Hetzelfde moment, een andere tijd" onClose={() => setTravelOpen(false)} primaryAction={<Button onClick={() => setTravelOpen(false)}>Verder met kloklezen</Button>}>
      <SpeechBubble character="seb" label="Op reis">Als het hier middag is, kan het ergens anders al avond zijn. Kies steden en schuif de tijd vooruit of terug. Alle klokken bewegen tegelijk.</SpeechBubble>
      <WorldClock />
    </Dialog>
  </div>;
}
