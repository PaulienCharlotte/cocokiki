import { rewardAnswer } from '../../services/answerRewards';
import { learningReward } from '../../services/learningReward';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Ruler, Minus, Plus } from 'lucide-react';
import { Button, Dialog, IconButton } from '../../design-system';
import ClockTimeLine from './ClockTimeLine';
import AnalogClock from './AnalogClock';
import { formatDigitalTime, formatDutchTime, generateTime, minuteStepForLevel, normalizeClockTime, sameClockTime } from './timeEngine';
import { ClockCompletion, ClockGameHeader, KlokStippen } from './ClockControls';
import type { ClockLevel, ClockTime } from './types';

interface SetClockGameProps {
  key?: React.Key;
  initialLevel: ClockLevel;
  onNext?: () => void;
  onLevelSelect?: (level: ClockLevel) => void;
  completedLevels: ClockLevel[];
  onBack: () => void;
  onComplete: (level: ClockLevel, roundId: string, solved?: number) => number;
}

const ROUND_COUNT = 5;

import { useActivityAnalytics } from '../../services/useActivityAnalytics';

export default function SetClockGame({ initialLevel, completedLevels, onBack, onComplete, onNext, onLevelSelect }: SetClockGameProps) {
  const [level, setLevel] = useState(initialLevel);
  const [target, setTarget] = useState(() => generateTime(initialLevel));
  const [answer, setAnswer] = useState<ClockTime>({ hours: 12, minutes: 0 });
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [hint, setHint] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const roundId = useRef(crypto.randomUUID());
  useActivityAnalytics('clock:set-clock', roundId.current, reward !== null);
  const revealed = useRef(false), eligible = useRef(0);

  const reset = (nextLevel = level) => {
    roundId.current = crypto.randomUUID();
    revealed.current = false; eligible.current = 0;
    setLevel(nextLevel);
    onLevelSelect?.(nextLevel);
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
    const correct = sameClockTime(answer, target);
    if (correct && !revealed.current) rewardAnswer('clock:set-clock', roundId.current, score, learningReward());
    setFeedback(correct ? 'correct' : 'wrong');
  };
  const next = useCallback(() => {
    const nextScore = score + 1;
    if (!revealed.current) eligible.current++;
    revealed.current = false;
    if (nextScore >= ROUND_COUNT) {
      setScore(nextScore);
      setReward(onComplete(level, roundId.current, eligible.current));
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
    <ClockGameHeader title="Zet de klok" level={level} completed={completedLevels} onBack={onBack} onLevelChange={reset} extraTools={<IconButton className="ck-gereedschap" label="Tijdlijn openen" icon={<Ruler size={22} />} onClick={() => setTimelineOpen(true)} />} />
    <section className="clock-instruction" aria-live="polite">
      <h2><span>Zet op </span>{formatDutchTime(target)}</h2>
      <KlokStippen klaar={Math.min(score, ROUND_COUNT)} totaal={ROUND_COUNT} label="Opdrachten" />
    </section>
    <div className="clock-set__workspace">
      <AnalogClock time={answer} color="wood" interactive level={level} onChange={value => { setAnswer(value); setFeedback(null); }} />
      <div className="clock-set__controls" aria-label="Wijzers aanpassen">
        <div><span>Uur</span><button type="button" aria-label="Een uur terug" onClick={() => adjust(-1, 0)}><Minus /></button><strong>{((answer.hours - 1 + 12) % 12) + 1}</strong><button type="button" aria-label="Een uur verder" onClick={() => adjust(1, 0)}><Plus /></button></div>
        {level > 1 && <div><span>Minuten</span><button type="button" aria-label={`${step} minuten terug`} onClick={() => adjust(0, -step)}><Minus /></button><strong>{String(answer.minutes).padStart(2, '0')}</strong><button type="button" aria-label={`${step} minuten verder`} onClick={() => adjust(0, step)}><Plus /></button></div>}
    <div className="clock-game__actions">
      <Button startIcon={<Check size={18} />} disabled={feedback === 'correct'} onClick={check}>{feedback === 'correct' ? 'Goed!' : 'Controleer'}</Button>
    </div>
      </div>
    </div>
    <div className="clock-game__feedback" aria-live="polite">
      {feedback === 'wrong' && <span className="is-wrong">Bijna. Kijk nog eens naar de lange wijzer.</span>}
      {feedback === 'correct' && <span className="is-correct"><Check size={18} /> Goed gezet!</span>}
    </div>

    <Dialog className="clock-timeline-dialog" open={timelineOpen} title="Spring vooruit of terug" onClose={() => setTimelineOpen(false)} primaryAction={<Button onClick={() => setTimelineOpen(false)}>Verder met de klok</Button>}
      secondaryAction={<Button variant="quiet" onClick={() => { revealed.current = true; setHint(true); }}>Toon de gevraagde tijd</Button>}>
      <ClockTimeLine time={answer} step={step} onChange={value => { setAnswer(value); setFeedback(null); }} />
      {hint && <p>De gevraagde tijd is {formatDigitalTime(target)}. Deze klok oefen je zonder munten.</p>}
    </Dialog>
    {reward !== null && <ClockCompletion reward={reward} onReplay={() => reset()} onHub={onNext ?? onBack} />}
  </main>;
}
