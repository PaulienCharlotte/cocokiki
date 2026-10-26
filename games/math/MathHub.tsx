import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../design-system';
import { mathIcon, MATH_GAMES } from './config';
import type { MathGameId, MathProgress } from './types';

export default function MathHub({ progress, onPlay }: { progress: MathProgress; onPlay: (game: MathGameId) => void }) {
  return <main className="math-hub" aria-labelledby="math-title">
    <header className="math-hub__intro"><small>School</small><h1 id="math-title">Rekenen</h1><p>Word een echte rekenkampioen!</p></header>
    <div className="math-hub__games">{MATH_GAMES.filter(game => game.id !== 'multiply' && game.id !== 'divide').map(game => <article className={`math-mode math-mode--${game.accent}`} key={game.id}>
      <div className="math-mode__art"><img src={mathIcon(game.id)} alt="" /></div>
      <div className="math-mode__copy"><h2>{game.title}</h2><p>{game.subtitle}</p><div><span>{progress.games[game.id].completed.length}/5 niveaus</span><Button endIcon={<ArrowRight size={18} />} onClick={() => onPlay(game.id)} aria-label={`${game.title} spelen`}>Spelen</Button></div></div>
    </article>)}</div>
  </main>;
}
