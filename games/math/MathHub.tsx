import React from 'react';
import CardGrid from '../../components/ui/CardGrid';
import { mathIcon, MATH_GAMES } from './config';
import type { MathGameId, MathProgress } from './types';

/**
 * Het spelletjesmenu van rekenen: één raster witte kaarten.
 *
 * De kaarten komen uit `components/ui/CardGrid`, zodat dit menu er hetzelfde
 * uitziet als dat van het vlaggenmemory. Zie `.claude/skills/cocokiki-ui`.
 */
export default function MathHub({ progress, onPlay }: { progress: MathProgress; onPlay: (game: MathGameId) => void }) {
  const spellen = MATH_GAMES.filter(game => game.id !== 'multiply' && game.id !== 'divide');
  return <main className="math-hub" aria-labelledby="math-title">
    <header className="math-hub__intro"><small>School</small><h1 id="math-title">Rekenen</h1></header>
    <CardGrid
      label="Kies een rekenspel"
      cards={spellen.map(game => ({
        id: game.id,
        titel: game.title,
        onder: game.subtitle,
        beeld: mathIcon(game.id),
        meta: `${progress.games[game.id].completed.length}/5 niveaus`,
      }))}
      onChoose={id => onPlay(id as MathGameId)}
    />
  </main>;
}
