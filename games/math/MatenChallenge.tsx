import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { toonMaat } from './Maten';
import type { Maatvraag } from './maten/vragen';

/**
 * Het matenspel: omrekenen, vergelijken en schatten.
 *
 * Bij omrekenen typ je het getal, want kiezen uit vier getallen maakt er een
 * gokspel van. Bij vergelijken en schatten kies je, want daar gaat het om de
 * maat en niet om het rekenen.
 */
export default function MatenChallenge({ vraag, locked, gekozen, onAnswer }: {
  vraag: Maatvraag; locked: boolean; gekozen?: number; onAnswer: (value: number, geldig: boolean) => void;
}) {
  const [waarde, setWaarde] = useState('');

  const verstuur = (event: React.FormEvent) => {
    event.preventDefault();
    if (locked || waarde.trim() === '') return;
    const getal = Number(waarde.replace(',', '.'));
    if (!Number.isFinite(getal)) return;
    onAnswer(getal, Math.abs(getal - vraag.answer) < 1e-6);
  };

  if (vraag.soort === 'omrekenen') return <form className="maatvraag" onSubmit={verstuur}>
    <p className="maatvraag__som">
      <span>{toonMaat(vraag.aantal)} {vraag.van}</span>
      <i aria-hidden="true">=</i>
      <label>
        <span className="sr-only">Hoeveel {vraag.naar}?</span>
        <input type="text" inputMode="decimal" autoFocus value={waarde} disabled={locked}
          onChange={event => setWaarde(event.target.value)} required />
      </label>
      <span>{vraag.naar}</span>
    </p>
    {!locked && <button type="submit" disabled={waarde.trim() === ''}>Klaar<ArrowRight size={18} aria-hidden="true" /></button>}
    {locked && <p className="maatvraag__uitleg">{vraag.uitleg}</p>}
  </form>;

  return <div className="maatvraag">
    <div className="math-answers" role="group" aria-label="Antwoorden">
      {vraag.keuzes.map((keuze, index) => <button
        key={keuze} type="button" disabled={locked} aria-pressed={gekozen === index}
        className={gekozen === index ? 'is-selected' : ''}
        onClick={() => onAnswer(index, index === vraag.answer)}
      >{keuze}</button>)}
    </div>
    {locked && <p className="maatvraag__uitleg">{vraag.uitleg}</p>}
  </div>;
}
