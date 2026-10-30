import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { StoryQuestion } from './storyProblems';
import { storySteps } from './storySteps';

/**
 * Een redactiesom: een verhaal dat je in stappen uitrekent.
 *
 * Het verhaal staat al in de spraakwolk van Baby Lua, dus hier staat alleen
 * waar je nú mee bezig bent: één som, één invoervak, één knop. De stappen die
 * je al gedaan hebt blijven als kleine kaartjes staan, want die getallen heb
 * je straks weer nodig. Zie `.claude/skills/cocokiki-ui`.
 */
export default function StoryChallenge({ question, locked, onAnswer }: {
  question: StoryQuestion; locked: boolean; selected?: number; onAnswer: (value: number, valid?: boolean) => void;
}) {
  const steps = storySteps(question.left);
  const [index, setIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(false);
  const step = steps[index];
  const symbol = { '+': '+', '-': '−', '*': '×', '/': '÷' }[step.operation];
  const action = { '+': 'Samenvoegen', '-': 'Apart zetten', '*': 'Oogst verzamelen', '/': 'Eerlijk verdelen' }[step.operation];
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (locked || amount === '') return;
    const value = Number(amount);
    if (value !== step.answer) { setError(true); onAnswer(value, false); return; }
    setError(false);
    if (index === steps.length - 1) onAnswer(value);
    else { setIndex(index + 1); setAmount(''); }
  };
  return <div className="story-challenge">
    {index > 0 && <ol className="story-gedaan" aria-label="Wat je al hebt uitgerekend">
      {steps.slice(0, index).map((item, i) => <li key={i}>{item.left} {{ '+': '+', '-': '−', '*': '×', '/': '÷' }[item.operation]} {item.right} = <strong>{item.answer}</strong></li>)}
    </ol>}
    <form className="math-workbench" onSubmit={submit}>
      <label htmlFor="harvest-answer">{steps.length > 1 ? `${action} · stap ${index + 1} van ${steps.length}` : action}</label>
      <div className="math-workbench__equation">
        <span>{step.left} {symbol} {step.right} =</span>
        <input id="harvest-answer" aria-label="Hoeveelheid" type="number" min="0" step="1" inputMode="numeric" value={amount} disabled={locked} onChange={event => { setAmount(event.target.value); setError(false); }} required />
      </div>
      <button type="submit" disabled={locked || amount === ''}>{locked ? 'Klaar!' : index === steps.length - 1 ? 'Dit is het antwoord' : action}<ArrowRight size={18} aria-hidden="true" /></button>
      {error && <p role="status">Deze hoeveelheid klopt nog niet. Probeer nog eens.</p>}
    </form>
    {locked && <p className="story-explanation">{question.explanation}</p>}
  </div>;
}
