import React from 'react';
import { Check, X } from 'lucide-react';
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
  onChoose: (id: string) => void;
  /** Gekozen is klaar: daarna kijk je alleen nog naar het antwoord. */
  disabled?: boolean;
  /** Wat een voorleesprogramma zegt over de lijst. */
  label?: string;
  className?: string;
}

export default function ChoiceList({ choices, onChoose, disabled = false, label, className }: ChoiceListProps) {
  return <ul className={`ck-keuzes${className ? ` ${className}` : ''}`} aria-label={label}>
    {choices.map(keuze => <li key={keuze.id}>
      <button
        type="button"
        className={`ck-keuze${keuze.staat ? ` is-${keuze.staat}` : ''}`}
        disabled={disabled}
        onClick={() => onChoose(keuze.id)}
      >
        {keuze.icoon && <img src={keuze.icoon} alt="" />}
        <span>{keuze.label}</span>
        {keuze.staat === 'goed' && <Check size={18} aria-hidden="true" />}
        {keuze.staat === 'mis' && <X size={18} aria-hidden="true" />}
      </button>
    </li>)}
  </ul>;
}
