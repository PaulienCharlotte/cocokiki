import React from 'react';
import { Button } from '../../design-system';
import { Check } from 'lucide-react';
import './choice-list.css';

/**
 * Elke meerkeuzevraag in de app ziet er zo uit.
 *
 * Eén blok met haarlijnen ertussen, niet een rij losse knoppen: dan leest het
 * als één keuze in plaats van als drie dingen die om aandacht vragen. Een
 * icoon vóór het antwoord mag, en is beter dan een extra woord.
 */
export interface Choice {
  id: string;
  label: string;
  /** Pad naar een plaatje. Staat vóór het antwoord, in plaats van uitleg. */
  icoon?: string;
  /** Hoe het antwoord erbij staat zodra er gekozen is. */
  staat?: 'goed' | 'mis';
}

interface ChoiceListProps {
  choices: Choice[];
  /**
   * 'los' zet elk antwoord in een eigen omlijnd vak met een letter ervoor,
   * zoals het kookavontuur. 'blok' is één vlak met haarlijnen ertussen.
   */
  vorm?: 'blok' | 'los';
  onChoose: (id: string) => void;
  /** Gekozen is klaar: daarna kijk je alleen nog naar het antwoord. */
  disabled?: boolean;
  /** Wat een voorleesprogramma zegt over de lijst. */
  label?: string;
  className?: string;
  layout?: 'list' | 'buttons';
}

export default function ChoiceList({ choices, onChoose, disabled = false, label, className, layout = 'list', vorm = 'blok' }: ChoiceListProps) {
  if (layout === 'buttons') return <ul className="ck-answer-buttons" aria-label={label}>{choices.map((choice, i) => <li key={choice.id}><Button variant="quiet" fullWidth disabled={disabled} className={`ck-answer-button${choice.staat ? ` is-${choice.staat}` : ''}`} onClick={() => onChoose(choice.id)} startIcon={<span aria-hidden="true">{String.fromCharCode(65 + i)}</span>} endIcon={choice.staat === 'goed' ? <Check size={18} /> : undefined}>{choice.label}</Button></li>)}</ul>;
  return <ul className={`ck-keuzes is-${vorm}${className ? ` ${className}` : ''}`} aria-label={label}>
    {choices.map((keuze, index) => <li key={keuze.id}>

      <button
        type="button"
        className={`ck-keuze${keuze.staat ? ` is-${keuze.staat}` : ''}`}
        disabled={disabled}
        onClick={() => onChoose(keuze.id)}
      >
        {vorm === 'los' && <b className="ck-keuze__letter" aria-hidden="true">{String.fromCharCode(65 + index)}</b>}
        {keuze.icoon && <img src={keuze.icoon} alt="" />}
        <span>{keuze.label}</span>
        {keuze.staat === 'goed' && <Check size={18} aria-hidden="true" />}
      </button>
    </li>)}
  </ul>;
}
