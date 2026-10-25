import React, { useRef, useState } from 'react';
import DragChoice from './DragChoice';
import { HoneyJars } from './AdventureScenes';
import type { MathQuestion } from './types';

export default function BalanceChallenge({ question, locked, onAnswer }: { question: MathQuestion; locked: boolean; onAnswer: (answer: number) => void }) {
  const [placed, setPlaced] = useState<number>();
  const target = useRef<HTMLDivElement>(null);
  const place = (value: number) => { if (!locked) { setPlaced(value); onAnswer(value); } };
  return <div className="honey-game">
    <div ref={target} className="honey-drop"><HoneyJars question={question} placed={placed} /></div>
    <div className="math-number-tiles" role="group" aria-label="Hoeveel honing erbij?">{question.options.map(value => <React.Fragment key={value}><DragChoice value={value} selected={placed === value} disabled={locked} targetRef={target} onChoose={place} onDrop={place} /></React.Fragment>)}</div>
  </div>;
}
