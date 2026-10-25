import React, { useRef, useState } from 'react';
import DragChoice from './DragChoice';
import Equation from './Equation';
import { CookieScene } from './AdventureScenes';
import type { MathQuestion } from './types';

export default function PuzzleChallenge({ question, locked, onAnswer }: { question: MathQuestion; locked: boolean; onAnswer: (answer: number) => void }) {
  const [placed, setPlaced] = useState<number>();
  const target = useRef<HTMLDivElement>(null);
  const drop = (value: number) => { if (!locked) { setPlaced(value); onAnswer(value); } };
  return <div className="math-puzzle">
    <div ref={target} className="math-puzzle__target"><CookieScene question={question} success={locked} /><Equation question={question} answer={placed} /></div>
    <div className="math-number-tiles" role="group" aria-label="Kies het ontbrekende getal">{question.options.map(value => <React.Fragment key={value}><DragChoice value={value} selected={placed === value} disabled={locked} targetRef={target} onChoose={drop} onDrop={drop} /></React.Fragment>)}</div>
  </div>;
}
