import React, { useContext, useState } from 'react';
import { ClockAdventureTools } from './ClockAdventureTools';
import InfoKnop from '../../components/ui/InfoKnop';
import NiveauKnop, { NiveauKeuze } from '../../components/ui/NiveauKnop';
import { Check, RotateCcw } from 'lucide-react';
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

export function ClockGameHeader({ title, level, onBack, onLevelChange, completed, extraTools }: { extraTools?: React.ReactNode; title: string; level: ClockLevel; onBack: () => void; onLevelChange: (level: ClockLevel) => void; completed: ClockLevel[] }) {
  const [niveauOpen, setNiveauOpen] = useState(false);
  const adventureTools = useContext(ClockAdventureTools);
  return <><nav className="ck-zone-gereedschap ck-glas clock-level-tools" aria-label="Gereedschap"><NiveauKnop niveau={level} onClick={() => setNiveauOpen(true)} />{extraTools}{adventureTools}<InfoKnop character="seb">Sleep de wijzers om de tijd te zetten. Je kunt ook de plus- en minknoppen gebruiken. Het meetlatje opent de tijdlijn. De wereldbol vergelijkt tijden in steden. Met overslaan ga je naar een andere spelvorm.</InfoKnop></nav>
    {niveauOpen && <NiveauKeuze niveau={level} keuzes={([1,2,3,4,5] as ClockLevel[]).map(niveau => ({ niveau, tekst: CLOCK_LEVEL_LABELS[niveau] + (completed.includes(niveau) ? ' ✓' : '') }))} onKies={value => onLevelChange(value as ClockLevel)} onClose={() => setNiveauOpen(false)} />}
    <header className="clock-game-header"><h1 className="ck-houtbord">{title}</h1></header></>;
}

/** Voortgang als bolletjes, nooit als "1/5" (huisstijl). */
export function KlokStippen({ klaar, totaal, label }: { klaar: number; totaal: number; label: string }) {
  return <span className="klok-stippen ck-glas" role="img" aria-label={`${label}: ${klaar} van ${totaal}`}>
    {Array.from({ length: totaal }, (_, i) => <span key={i} className={`ck-stip${i < klaar ? ' ck-stip--klaar' : ''}${i === klaar ? ' ck-stip--nu' : ''}`} />)}
  </span>;
}

export function ClockCompletion({ reward, onReplay, onHub }: { reward: number; onReplay: () => void; onHub: () => void }) {
  return <section className="clock-completion" aria-live="polite">
    <span className="clock-completion__check"><Check aria-hidden="true" /></span>
    <div><strong>Niveau voltooid</strong><p>{reward > 0 ? <>Je verdient <CocoCoin size={18} /> {reward} CocoCoins.</> : 'Geoefend! Voor getoonde antwoorden krijg je geen munten. Elke ronde wordt maar eenmaal beloond.'}</p></div>
    <Button size="small" startIcon={<RotateCcw size={16} />} onClick={onReplay}>Nog een keer</Button>
    <Button size="small" variant="secondary" onClick={onHub}>Verder</Button>
  </section>;
}
