import React from 'react';
import { BookOpen, Calculator, Check, CookingPot, ShoppingBasket, Sprout, Trophy } from 'lucide-react';
import type { JourneyProgress, JourneyStage } from '../../data/cooking/types';

const STAGES: Array<{ id: JourneyStage; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Recept', icon: <BookOpen /> },
  { id: 'discovery', label: 'Ontdekken', icon: <Sprout /> },
  { id: 'nutrient-memory', label: 'Voedingsstoffen', icon: <Sprout /> },
  { id: 'challenges', label: 'Rekenen', icon: <Calculator /> },
  { id: 'shopping', label: 'Winkelen', icon: <ShoppingBasket /> },
  { id: 'cooking', label: 'Koken', icon: <CookingPot /> },
  { id: 'complete', label: 'Beloning', icon: <Trophy /> },
];

interface JourneyStageProgressProps {
  journey: JourneyProgress;
}

export default function JourneyStageProgress({ journey }: JourneyStageProgressProps) {
  const currentIndex = STAGES.findIndex(stage => stage.id === journey.stage);
  return <ol className="journey-stages" aria-label="Voortgang kookavontuur">
    {STAGES.map((stage, index) => {
      const current = stage.id === journey.stage;
      const completed = !current && (journey.completedStages.includes(stage.id) || index < currentIndex);
      return <li key={stage.id} className={current ? 'is-current' : completed ? 'is-complete' : ''} aria-current={current ? 'step' : undefined}>
        <span className="journey-stages__icon" aria-hidden="true">{completed ? <Check /> : stage.icon}</span>
        <span className="journey-stages__label">{stage.label}</span>
      </li>;
    })}
  </ol>;
}
