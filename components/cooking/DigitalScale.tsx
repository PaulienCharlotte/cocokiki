import React from 'react';
import { RotateCcw } from 'lucide-react';
import KitchenScale from './KitchenScale';

interface DigitalScaleProps {
  bowlImage: string;
  ingredientImage: string;
  value: number;
  target: number;
  increments: number[];
  onChange: React.Dispatch<React.SetStateAction<number>>;
}

const INCREMENT_STYLE: Record<number, string> = { 5: 'is-add-5', 10: 'is-add-10' };

export default function DigitalScale({ ingredientImage, value, target, increments, onChange }: DigitalScaleProps) {
  return <div className="digital-scale-wrap">
    <KitchenScale value={value} full={target} ingredientImage={ingredientImage} />
    <div className="cooking-weighing__controls">
      {increments.map(increment => <button
        type="button"
        key={increment}
        className={`cooking-chip ${INCREMENT_STYLE[increment] ?? 'is-add-10'}`}
        onClick={() => onChange(current => current + increment)}
      >+{increment} g</button>)}
      <button type="button" className="cooking-chip is-subtract" onClick={() => onChange(current => Math.max(0, current - 5))}>−5 g</button>
      <button type="button" className="cooking-chip is-reset" aria-label="Weegschaal leegmaken" title="Opnieuw" onClick={() => onChange(0)}><RotateCcw /></button>
    </div>
  </div>;
}
