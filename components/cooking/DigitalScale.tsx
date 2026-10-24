import React from 'react';
import { RotateCcw, Scale } from 'lucide-react';
import CookingAssetImage from './CookingAssetImage';

interface DigitalScaleProps {
  bowlImage: string;
  ingredientImage: string;
  value: number;
  target: number;
  increments: number[];
  onChange: React.Dispatch<React.SetStateAction<number>>;
}

export default function DigitalScale({ bowlImage, ingredientImage, value, target, increments, onChange }: DigitalScaleProps) {
  return <div className="digital-scale-wrap">
    <div className={`digital-scale${value === target ? ' is-balanced' : ''}`} aria-label={`Weegschaal: ${value} gram`}>
      <CookingAssetImage className="digital-scale__ingredient" src={ingredientImage} alt="Havermout" />
      <CookingAssetImage className="digital-scale__bowl" src={bowlImage} alt="Mengkom" />
      <div className="digital-scale__body">
        <div className="digital-scale__display"><Scale /><strong aria-live="polite">{value}</strong><span>g</span></div>
      </div>
    </div>
    <div className="digital-scale__controls">
      {increments.map(increment => <button type="button" key={increment} onClick={() => onChange(current => current + increment)}>+{increment} g</button>)}
      <button type="button" onClick={() => onChange(current => Math.max(0, current - 5))}>−5 g</button>
      <button type="button" aria-label="Weegschaal leegmaken" title="Opnieuw" onClick={() => onChange(0)}><RotateCcw /></button>
    </div>
  </div>;
}
