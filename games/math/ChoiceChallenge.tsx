import React, { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import Equation from './Equation';
import type { MathLevel, MathQuestion } from './types';

export function AnswerChoices({ question, locked, selected, onAnswer }: { question: MathQuestion; locked: boolean; selected?: number; onAnswer: (value: number) => void }) {
  return <div className="math-answers" role="group" aria-label="Antwoorden">{question.options.map(value => <button type="button" key={value} disabled={locked} aria-pressed={selected === value} className={selected === value ? 'is-selected' : ''} onClick={() => onAnswer(value)}>{value}</button>)}</div>;
}
export function MathVisualHelp({ question, level, onAnswer, locked }: { question: MathQuestion; level: MathLevel; onAnswer: (value: number) => void; locked: boolean }) {
  const max = Math.max(question.a, question.total, 10);
  const [marker, setMarker] = useState(question.a);
  const [step, setStep] = useState(1);
  const shown = Math.min(20, question.operation === '-' ? question.a : question.a + question.b);
  return <div className="math-visual-help">
    {question.operation === '*' && <div className="math-groups" aria-label={`${question.a} groepjes van ${question.b}`}>
      {Array.from({ length: question.a }, (_, group) => <div key={group}>{Array.from({ length: question.b }, (_, i) => <i key={i} />)}</div>)}
    </div>}
    {['+', '-'].includes(question.operation) && <>
      {level <= 2 && <div className="math-counting-apples" aria-label={`${question.a} appels ${question.operation === '+' ? 'en' : 'waarvan'} ${question.b} ${question.operation === '+' ? 'erbij' : 'weg'}`}>
        {Array.from({ length: shown }, (_, i) => <img key={i} src="/games/shop/products/apple.png" alt="" className={question.operation === '-' && i >= question.a - question.b ? 'is-removed' : i >= question.a ? 'is-added' : ''} />)}
      </div>}
      <div className="math-numberline"><label htmlFor="math-numberline">Getallenlijn · {marker}</label><input id="math-numberline" type="range" min={0} max={max} step={1} value={marker} disabled={locked} onChange={event => setMarker(Number(event.target.value))} />
        <div><span>0</span><span>{max}</span></div><div className="math-line-controls"><button type="button" disabled={locked} aria-label="Stap terug" onClick={() => setMarker(value => Math.max(0, value - step))}><Minus size={18} /></button>
          <select aria-label="Stapgrootte" value={step} onChange={event => setStep(Number(event.target.value))}>{[1, 10, 100].filter(value => value <= max).map(value => <option key={value} value={value}>{value}</option>)}</select>
          <button type="button" disabled={locked} aria-label="Stap vooruit" onClick={() => setMarker(value => Math.min(max, value + step))}><Plus size={18} /></button><button type="button" disabled={locked} onClick={() => onAnswer(marker)}>Kies {marker}</button></div>
      </div>
    </>}
    {question.operation === '/' && <p>{question.a} ÷ {question.b} = ? · Welk getal keer {question.b} geeft {question.a}?</p>}
  </div>;
}
export default function ChoiceChallenge({ question, locked, selected, onAnswer }: { question: MathQuestion; locked: boolean; selected?: number; onAnswer: (value: number) => void }) {
  return <><Equation question={question} /><AnswerChoices question={question} locked={locked} selected={selected} onAnswer={onAnswer} /></>;
}
