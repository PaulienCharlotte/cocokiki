import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { StoryQuestion } from './storyProblems';
import { storySteps } from './storySteps';

const SYMBOOL = { '+': '+', '-': '−', '*': '×', '/': '÷' } as const;
const ACTIE = { '+': 'Samenvoegen', '-': 'Apart zetten', '*': 'Oogst verzamelen', '/': 'Eerlijk verdelen' } as const;

/**
 * Een redactiesom: een verhaal dat je in stappen uitrekent.
 *
 * Je ziet alle stappen meteen staan, elk in een eigen vak, zodat je weet
 * hoeveel werk er komt. In het vak waar je mee bezig bent kun je typen; de
 * stap erna wacht met een vraagteken op het getal dat jij uitrekent, anders
 * zou die het antwoord al verklappen. Zie `.claude/skills/cocokiki-ui`.
 */
export default function StoryChallenge({ question, locked, onAnswer }: {
  question: StoryQuestion; locked: boolean; selected?: number; onAnswer: (value: number, valid?: boolean) => void;
}) {
  const steps = storySteps(question.left);
  const [index, setIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState(false);
  const step = steps[index];
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (locked || amount === '') return;
    const value = Number(amount);
    if (value !== step.answer) { setError(true); onAnswer(value, false); return; }
    setError(false);
    if (index === steps.length - 1) onAnswer(value);
    else { setIndex(index + 1); setAmount(''); }
  };
  return <form className="story-challenge math-workbench" onSubmit={submit}>
    <ol className="story-stappen">
      {steps.map((item, i) => {
        const klaar = locked || i < index;
        const nu = !klaar && i === index;
        return <li key={i} className={klaar ? 'is-klaar' : nu ? 'is-nu' : 'is-later'}>
          <span className="story-stappen__kop">Stap {i + 1}{steps.length > 1 ? '' : ''} · {ACTIE[item.operation]}</span>
          <span className="math-workbench__equation">
            <span>{i === 0 || klaar || nu ? item.left : '?'} {SYMBOOL[item.operation]} {item.right} =</span>
            {klaar
              ? <output>{item.answer}</output>
              : nu
                ? <input id="harvest-answer" aria-label={`Uitkomst van stap ${i + 1}`} type="number" min="0" step="1" inputMode="numeric" autoFocus value={amount} onChange={event => { setAmount(event.target.value); setError(false); }} required />
                : <output aria-label="nog niet aan de beurt">?</output>}
          </span>
        </li>;
      })}
    </ol>
    <button type="submit" disabled={locked || amount === ''}>{locked ? 'Klaar!' : index === steps.length - 1 ? 'Dit is het antwoord' : ACTIE[step.operation]}<ArrowRight size={18} aria-hidden="true" /></button>
    {error && <p role="status">Deze hoeveelheid klopt nog niet. Probeer nog eens.</p>}
    {locked && <p className="story-explanation">{question.explanation}</p>}
  </form>;
}
