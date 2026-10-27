import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { mathAssets } from './assets';
import type { StoryQuestion } from './storyProblems';
import { storySteps } from './storySteps';

export default function StoryChallenge({ question, locked, selected, onAnswer }: {
  question: StoryQuestion; locked: boolean; selected?: number; onAnswer: (value: number, valid?: boolean) => void;
}) {
  const steps = storySteps(question.left);
  const [index, setIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(false);
  const step = steps[index];
  const acorns = question.scene === 'acorns';
  const symbol = { '+': '+', '-': '−', '*': '×', '/': '÷' }[step.operation];
  const action = { '+': 'Samenvoegen', '-': 'Apart zetten', '*': 'Oogst verzamelen', '/': 'Eerlijk verdelen' }[step.operation];
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (locked || amount === '') return;
    const value = Number(amount);
    if (value !== step.answer) {
      setError(true);
      onAnswer(value, false);
      return;
    }
    setError(false);
    if (index === steps.length - 1) onAnswer(value);
    else { setIndex(index + 1); setAmount(''); }
  };
  return <div className="story-challenge">
    <div className="harvest-workspace">
      <img className="harvest-workspace__item" src={acorns ? mathAssets.acorn : mathAssets.blueberry} alt={acorns ? 'Eikels' : 'Blauwe bessen'} />
      <div className="harvest-workspace__destination">
        <img src={acorns ? mathAssets.treeHollow : mathAssets.basket} alt={acorns ? 'Wintervoorraad' : 'Oogstmand'} />
        <output aria-live="polite">{locked ? question.answer : index > 0 ? steps[index - 1].answer : '?'}</output>
      </div>
    </div>
    <ol className="harvest-steps" aria-label="Rekenstappen">{steps.map((item, i) => <li key={i} aria-current={i === index ? 'step' : undefined}>{i < index || locked ? <Check size={16} /> : i + 1}<span>{i < index || locked ? item.answer : '…'}</span></li>)}</ol>
    <form className="math-workbench" onSubmit={submit}>
      <label htmlFor="harvest-answer">{action} · stap {index + 1} van {steps.length}</label>
      <div className="math-workbench__equation"><span>{step.left} {symbol} {step.right} =</span><input id="harvest-answer" aria-label="Hoeveelheid" type="number" min="0" step="1" inputMode="numeric" value={amount} disabled={locked} onChange={event => { setAmount(event.target.value); setError(false); }} required /></div>
      <button type="submit" disabled={locked || amount === ''}>{locked ? 'Klaar!' : index === steps.length - 1 ? 'Controleer de oogst' : action}<ArrowRight size={18} /></button>
      {error && <p role="status">Deze hoeveelheid klopt nog niet. Probeer nog eens.</p>}
    </form>
    {locked && <p className="story-explanation">{question.explanation}</p>}
  </div>;
}
