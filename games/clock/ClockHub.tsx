import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../design-system';
import type { ClockGameId, ClockProgress } from './types';

const GAMES: Array<{ id: ClockGameId; title: string; description: string; accent: string; image: string }> = [
  { id: 'memory', title: 'Klokmemory', description: 'Vind de gelijke tijden.', accent: 'coral', image: '/games/school/clock/clock-memory.png' },
  { id: 'set-clock', title: 'Zet de klok', description: 'Draai de wijzers goed.', accent: 'wood', image: '/games/school/clock/clock-set.png' },
  { id: 'race', title: 'Klokkenrace', description: 'Kies de juiste klok.', accent: 'blue', image: '/games/school/clock/clock-race.png' },
];

export default function ClockHub({ progress, onPlay }: { progress: ClockProgress; onPlay: (game: ClockGameId) => void }) {
  return <main className="clock-hub" aria-labelledby="clock-hub-title">
    <section className="clock-hub__intro">
      <img className="clock-hub__mascot" src="/games/school/clock/clock-navigation.png" alt="" />
      <div><p>School</p><h1 id="clock-hub-title">Klokkijken</h1><span>Oefen met wijzers en tijden.</span></div>
    </section>
    <div className="clock-hub__games">
      {GAMES.map(game => <article className={`clock-mode-card clock-mode-card--${game.accent}`} key={game.id}>
        <div className="clock-mode-card__art" aria-hidden="true">
          <img src={game.image} alt="" />
        </div>
        <div className="clock-mode-card__copy">
          <div><h2>{game.title}</h2><p>{game.description}</p></div>
          <span className="clock-mode-card__progress">{progress.completed[game.id].length}/5 niveaus</span>
          <Button endIcon={<ArrowRight size={17} />} onClick={() => onPlay(game.id)}>Spelen</Button>
        </div>
      </article>)}
    </div>
  </main>;
}
