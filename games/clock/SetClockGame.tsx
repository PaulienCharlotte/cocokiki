import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Lightbulb, Minus, Plus } from 'lucide-react';
import { Button } from '../../design-system';
import AnalogClock from './AnalogClock';
import { formatDigitalTime, formatDutchTime, generateTime, minuteStepForLevel, normalizeClockTime, sameClockTime } from './timeEngine';
import { ClockCompletion, ClockGameHeader } from './ClockControls';
import type { ClockLevel, ClockTime } from './types';

interface SetClockGameProps {
  initialLevel: ClockLevel;
  completedLevels: ClockLevel[];
  onBack: () => void;
  onComplete: (level: ClockLevel, roundId: string) => number;
}

const ROUND_COUNT = 5;

export default function SetClockGame({ initialLevel, completedLevels, onBack, onComplete }: SetClockGameProps) {
  const [level, setLevel] = useState(initialLevel);
  const [target, setTarget] = useState(() => generateTime(initialLevel));
  const [answer, setAnswer] = useState<ClockTime>({ hours: 12, minutes: 0 });
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [hint, setHint] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const roundId = useRef(crypto.randomUUID());

  const reset = (nextLevel = level) => {
    roundId.current = crypto.randomUUID();
    setLevel(nextLevel);
    setTarget(generateTime(nextLevel));
    setAnswer({ hours: 12, minutes: 0 });
    setScore(0);
    setFeedback(null);
    setHint(false);
    setReward(null);
  };

  const adjust = (hours: number, minutes: number) => {
    setAnswer(current => normalizeClockTime({ hours: current.hours + hours, minutes: current.minutes + minutes }));
    setFeedback(null);
  };

  const check = () => {
    if (feedback === 'correct') return;
    setFeedback(sameClockTime(answer, target) ? 'correct' : 'wrong');
  };
  const next = useCallback(() => {
    const nextScore = score + 1;
    if (nextScore >= ROUND_COUNT) {
      setScore(nextScore);
      setReward(onComplete(level, roundId.current));
      return;
    }
    setScore(nextScore);
    setTarget(generateTime(level));
    setAnswer({ hours: 12, minutes: 0 });
    setFeedback(null);
    setHint(false);
  }, [level, onComplete, score]);

  useEffect(() => {
    if (feedback !== 'correct' || reward !== null) return;
    const timeout = window.setTimeout(next, 950);
    return () => window.clearTimeout(timeout);
  }, [feedback, next, reward]);

  const step = minuteStepForLevel(level);

  return <main className="clock-game clock-set">
    <ClockGameHeader title="Zet de klok" level={level} completed={completedLevels} onBack={onBack} onLevelChange={reset} />
    <section className="clock-instruction" aria-live="polite">
      <span>Zet de klok op</span><h2>{formatDutchTime(target)}.</h2>
      <small>Opdracht {Math.min(score + 1, ROUND_COUNT)} van {ROUND_COUNT}</small>
    </section>
    <div className="clock-set__workspace">
      <AnalogClock time={answer} color="wood" interactive level={level} onChange={value => { setAnswer(value); setFeedback(null); }} />
      <div className="clock-set__controls" aria-label="Wijzers aanpassen">
        <div><span>Uur</span><button type="button" aria-label="Een uur terug" onClick={() => adjust(-1, 0)}><Minus /></button><strong>{((answer.hours - 1 + 12) % 12) + 1}</strong><button type="button" aria-label="Een uur verder" onClick={() => adjust(1, 0)}><Plus /></button></div>
        <div><span>Minuten</span><button type="button" aria-label={`${step} minuten terug`} onClick={() => adjust(0, -step)}><Minus /></button><strong>{String(answer.minutes).padStart(2, '0')}</strong><button type="button" aria-label={`${step} minuten verder`} onClick={() => adjust(0, step)}><Plus /></button></div>
      </div>
    </div>
    <div className="clock-game__feedback" aria-live="polite">
      {hint && feedback !== 'correct' && <span>Hint: de digitale tijd is <strong>{formatDigitalTime(target)}</strong>.</span>}
      {feedback === 'wrong' && <span className="is-wrong">Bijna. Kijk nog eens naar de lange wijzer.</span>}
      {feedback === 'correct' && <span className="is-correct"><Check size={18} /> Goed gezet!</span>}
    </div>
    <div className="clock-game__actions">
      <Button variant="quiet" startIcon={<Lightbulb size={18} />} onClick={() => setHint(true)}>Hint</Button>
      <Button startIcon={<Check size={18} />} disabled={feedback === 'correct'} onClick={check}>{feedback === 'correct' ? 'Goed!' : 'Controleer'}</Button>
    </div>
    {reward !== null && <ClockCompletion reward={reward} onReplay={() => reset()} onHub={onBack} />}
  </main>;
}
