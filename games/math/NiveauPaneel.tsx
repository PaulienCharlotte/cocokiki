import React from 'react';
import { Check } from 'lucide-react';
import HulpPaneel from '../../components/ui/HulpPaneel';
import { MATH_GAMES_BY_ID } from './config';
import { MATH_LEVELS, type MathGameId, type MathLevel } from './types';

/**
 * Het niveau kiezen: een glazen paneel van rechts met de vijf niveaus en wat
 * je op elk niveau oefent. Het niveau-label in het statuseiland opent dit,
 * altijd, ook midden in een ronde; een ander niveau begint de ronde opnieuw.
 */
export default function NiveauPaneel({ game, level, onKies, onClose }: { game: MathGameId; level: MathLevel; onKies: (level: MathLevel) => void; onClose: () => void }) {
  const doelen = MATH_GAMES_BY_ID[game].objectives;
  return <HulpPaneel titel="Niveau" sluitLabel="Niveau sluiten" onClose={onClose} className="niveau-paneel">
    <p className="niveau-paneel__uitleg">Kies hoe moeilijk je het wilt. Je begint dan opnieuw.</p>
    <ul className="niveau-paneel__lijst">
      {MATH_LEVELS.map(nr => <li key={nr}>
        <button type="button" className={`niveau-paneel__keuze${nr === level ? ' is-nu' : ''}`} aria-pressed={nr === level} onClick={() => { if (nr !== level) onKies(nr); onClose(); }}>
          <span className="niveau-paneel__nr">{nr}</span>
          <span className="niveau-paneel__tekst"><strong>Niveau {nr}</strong><small>{doelen[nr - 1]}</small></span>
          {nr === level && <Check size={22} aria-label="gekozen" />}
        </button>
      </li>)}
    </ul>
  </HulpPaneel>;
}
