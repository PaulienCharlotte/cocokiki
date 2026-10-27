import React, { useState } from 'react';
import { Cookie } from 'lucide-react';
import Equation from './Equation';
import { mathAssets } from './assets';
import type { MathQuestion } from './types';

export default function PuzzleChallenge({ question, locked, onAnswer }: { question: MathQuestion; locked: boolean; onAnswer: (answer: number) => void }) {
  const [placed, setPlaced] = useState<number>();
  const [amount, setAmount] = useState('');
  const left = question.left;
  const total = 'value' in question.right ? question.right.value : question.total;
  const known = 'op' in left ? ('value' in left.left ? left.left.value : 'value' in left.right ? left.right.value : 0) : 0;
  const blankFirst = 'op' in left && 'blank' in left.left;
  const unit = question.operation === '*' && blankFirst ? 'dozen' : question.operation === '/' && !blankFirst ? 'dozen' : 'koekjes';
  const order = question.operation === '+' ? `Er zijn ${total} koekjes besteld. ${known} zijn al klaar. Hoeveel bak je erbij?`
    : question.operation === '-' ? blankFirst ? `Na het uitdelen van ${known} koekjes moeten er ${total} overblijven. Hoeveel bak je?` : `Er zijn ${known} koekjes klaar. Hoeveel geef je weg om er ${total} over te houden?`
    : question.operation === '*' ? blankFirst ? `Er zijn ${total} koekjes besteld, met ${known} koekjes per doos. Hoeveel dozen vul je?` : `Vul ${known} dozen met samen ${total} koekjes. Hoeveel gaan er in elke doos?`
    : blankFirst ? `Vul ${known} dozen met elk ${total} koekjes. Hoeveel koekjes heb je nodig?` : `Verdeel ${known} koekjes over dozen met elk ${total} koekjes. Hoeveel dozen vul je?`;
  return <div className="math-puzzle">
    <div className={`cookie-order${locked ? ' is-complete' : ''}`}>
      <img src={mathAssets.cookie} alt="Koekjesbestelling" />
      <strong>{locked ? 'Bestelling klaar!' : 'De koekjesbestelling'}</strong>
      <p className="cookie-order__story">{order}</p>
      <Equation question={question} answer={placed} />
      {amount !== '' && <div className="cookie-order__batch" aria-label={`${amount} ${unit} gekozen`}><img src={mathAssets.cookie} alt="" /><output>{amount} {unit}</output></div>}
    </div>
    <form className="math-workbench" onSubmit={event => { event.preventDefault(); if (!locked && amount !== '') { const value = Number(amount); setPlaced(value); onAnswer(value); } }}>
      <label htmlFor="cookie-answer">Aantal {unit}</label>
      <input id="cookie-answer" aria-label={`Aantal ${unit}`} type="number" min="0" step="1" inputMode="numeric" value={amount} disabled={locked} required onChange={event => setAmount(event.target.value)} />
      <button type="submit" disabled={locked || amount === ''}><Cookie size={18} />{locked ? 'Gebakken!' : 'Bak deze bestelling'}</button>
    </form>
  </div>;
}
