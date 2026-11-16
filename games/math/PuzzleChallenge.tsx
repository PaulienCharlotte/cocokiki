import React, { useRef, useState } from 'react';
import DragChoice from './DragChoice';
import Equation from './Equation';
import { mathAssets } from './assets';
import type { MathQuestion } from './types';

/** Wat de bestelling vraagt. Baby Lua zegt dit, dus het staat niet ook nog
 *  een keer boven de koekjes. Zie MathSession.tsx. */
export function cookieOrder(question: MathQuestion): string {
  const left = question.left;
  const total = 'value' in question.right ? question.right.value : question.total;
  const known = 'op' in left ? ('value' in left.left ? left.left.value : 'value' in left.right ? left.right.value : 0) : 0;
  const blankFirst = 'op' in left && 'blank' in left.left;
  return question.operation === '+' ? `Er zijn ${total} koekjes besteld. ${known} zijn al klaar. Hoeveel bak je erbij?`
    : question.operation === '-' ? blankFirst ? `Na het uitdelen van ${known} koekjes moeten er ${total} overblijven. Hoeveel bak je?` : `Er zijn ${known} koekjes klaar. Hoeveel geef je weg om er ${total} over te houden?`
    : question.operation === '*' ? blankFirst ? `Er zijn ${total} koekjes besteld, met ${known} koekjes per doos. Hoeveel dozen vul je?` : `Vul ${known} dozen met samen ${total} koekjes. Hoeveel gaan er in elke doos?`
    : blankFirst ? `Vul ${known} dozen met elk ${total} koekjes. Hoeveel koekjes heb je nodig?` : `Verdeel ${known} koekjes over dozen met elk ${total} koekjes. Hoeveel dozen vul je?`;
}
export function cookieUnit(question: MathQuestion): string {
  const blankFirst = 'op' in question.left && 'blank' in question.left.left;
  return question.operation === '*' && blankFirst ? 'dozen' : question.operation === '/' && !blankFirst ? 'dozen' : 'koekjes';
}
/**
 * Het ontbrekende getal: de bestelling staat in de wereld, met de som op een
 * glazen bord. Je tikt een bel aan of sleept hem op het vraagteken.
 */
export default function PuzzleChallenge({ question, locked, selected, onAnswer }: { question: MathQuestion; locked: boolean; selected?: number; onAnswer: (answer: number) => void }) {
  const [over, setOver] = useState(false);
  const doel = useRef<HTMLDivElement>(null);
  const unit = cookieUnit(question);
  return <div className="math-puzzle">
    <div className={`cookie-order${locked ? ' is-complete' : ''}`}>
      <img src={mathAssets.cookie} alt="Koekjesbestelling" />
      <div ref={doel} className={`rekenspel__bord ck-glas${over ? ' is-over' : ''}`}><Equation question={question} answer={locked ? selected : undefined} /></div>
    </div>
    <div className="ck-zone-antwoord rekenspel__bellen" role="group" aria-label={`Hoeveel ${unit}?`}>
      {question.options.map((value, i) => <DragChoice key={value} value={value} label={`${value} ${unit}`} selected={selected === value} disabled={locked} targetRef={doel} onOver={setOver} onChoose={onAnswer} onDrop={value => onAnswer(value)} className={`ck-bel ck-glas ck-bel--${i + 1}`}>
        <span className="ck-bel__kern" aria-hidden="true" />{value}
      </DragChoice>)}
    </div>
  </div>;
}
