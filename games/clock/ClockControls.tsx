import React from 'react';
import { ArrowLeft, Check, RotateCcw } from 'lucide-react';
import { Button } from '../../design-system';
import CocoCoin from '../../components/platform/CocoCoin';
import type { ClockLevel } from './types';

export const CLOCK_LEVEL_LABELS: Record<ClockLevel, string> = {
  1: 'Hele uren',
  2: 'Halve uren',
  3: 'Kwartieren',
  4: 'Vijf minuten',
  5: 'Alle minuten',
};

export function LevelPicker({ level, onChange, completed = [] }: { level: ClockLevel; onChange: (level: ClockLevel) => void; completed?: ClockLevel[] }) {
  return <div className="clock-level-picker">
    <div className="clock-level-picker__label"><span>Niveaus</span><strong>Niveau {level} · {CLOCK_LEVEL_LABELS[level]}</strong></div>
    <div className="clock-levels" aria-label="Kies een niveau">
      {([1, 2, 3, 4, 5] as ClockLevel[]).map(option => <button
        key={option}
        type="button"
        aria-pressed={level === option}
        aria-label={`Niveau ${option}: ${CLOCK_LEVEL_LABELS[option]}${completed.includes(option) ? ', voltooid' : ''}`}
        title={`${option}. ${CLOCK_LEVEL_LABELS[option]}`}
        onClick={() => onChange(option)}
      >
        <span>{option}</span>{completed.includes(option) && <Check size={12} aria-hidden="true" />}
      </button>)}
    </div>
  </div>;
}

export function ClockGameHeader({ title, level, onBack, onLevelChange, completed }: { title: string; level: ClockLevel; onBack: () => void; onLevelChange: (level: ClockLevel) => void; completed: ClockLevel[] }) {
  return <header className="clock-game-header">
    <Button variant="quiet" size="small" startIcon={<ArrowLeft size={17} />} onClick={onBack}>Stoppen</Button>
    <h1>{title}</h1>
    <LevelPicker level={level} onChange={onLevelChange} completed={completed} />
  </header>;
}

export function ClockCompletion({ reward, onReplay, onHub }: { reward: number; onReplay: () => void; onHub: () => void }) {
  return <section className="clock-completion" aria-live="polite">
    <span className="clock-completion__check"><Check aria-hidden="true" /></span>
    <div><strong>Niveau voltooid</strong><p>{reward > 0 ? <>Je verdient <CocoCoin size={18} /> {reward} CocoCoins.</> : 'Je had deze beloning al verdiend.'}</p></div>
    <Button size="small" startIcon={<RotateCcw size={16} />} onClick={onReplay}>Nog een keer</Button>
    <Button size="small" variant="secondary" onClick={onHub}>Spellen kiezen</Button>
  </section>;
}
