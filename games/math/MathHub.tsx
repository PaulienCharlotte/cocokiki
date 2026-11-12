import React from 'react';
import { Ruler } from 'lucide-react';
import CardGrid from '../../components/ui/CardGrid';
import { mathIcon, MATH_GAMES } from './config';
import type { MathGameId, MathProgress } from './types';

/**
 * Het spelletjesmenu van rekenen: één raster witte kaarten.
 *
 * De kaarten komen uit `components/ui/CardGrid`, zodat dit menu er hetzelfde
 * uitziet als dat van het vlaggenmemory. Zie `.claude/skills/cocokiki-ui`.
 */
/** Spellen zonder eigen tekening krijgen een icoon in een klein vierkantje. */
const ICONEN: Partial<Record<MathGameId, React.ReactNode>> = { maten: <Ruler size={26} aria-hidden="true" /> };

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
        beeld: ICONEN[game.id] ? undefined : mathIcon(game.id),
        icoon: ICONEN[game.id],
        meta: `${progress.games[game.id].completed.length}/5 niveaus`,
      }))}
      onChoose={id => onPlay(id as MathGameId)}
    />
  </main>;
}
