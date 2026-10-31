import React, { useRef, useState } from 'react';
import DragChoice from './DragChoice';
import { HoneyJars } from './AdventureScenes';
import { expressionText } from './engine';
import type { MathQuestion } from './types';

export default function BalanceChallenge({ question, locked, onAnswer }: { question: MathQuestion; locked: boolean; onAnswer: (answer: number) => void }) {
  const [placed, setPlaced] = useState<number>();
  const target = useRef<HTMLDivElement>(null);
  const place = (value: number) => { if (!locked) { setPlaced(value); onAnswer(value); } };
  // De potten staan los bovenaan; de twee sommen en de antwoorden horen bij
  // elkaar en staan dus in één vak eronder.
  return <div className="honey-game">
    <div ref={target} className="honey-drop"><HoneyJars question={question} placed={placed} labels={false} /></div>
    <div className="honey-paneel">
      <p className="honey-sommen"><span>{expressionText(question.left)}</span><b>=</b><span>{expressionText(question.right, placed)}</span></p>
      <div className="math-number-tiles" role="group" aria-label="Hoeveel honing erbij?">{question.options.map(value => <React.Fragment key={value}><DragChoice value={value} selected={placed === value} disabled={locked} targetRef={target} onChoose={place} onDrop={place} /></React.Fragment>)}</div>
    </div>
  </div>;
}
