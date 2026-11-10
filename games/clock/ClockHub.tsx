import React from 'react';
import CardGrid from '../../components/ui/CardGrid';
import type { ClockGameId, ClockProgress } from './types';

/**
 * Het spelletjesmenu van klokkijken: één raster witte kaarten.
 *
 * Hier stonden gekleurde kaarten met een eigen accentkleur en een knop
 * "Spelen" erin. De kaart is zelf de knop, en een eigen kleur per spel laat
 * de spellen weer uit elkaar lopen. Zie `.claude/skills/cocokiki-ui`.
 */
const SPELLEN: Array<{ id: ClockGameId; titel: string; onder: string; beeld: string }> = [
  { id: 'memory', titel: 'Klokmemory', onder: 'Vind de twee gelijke tijden', beeld: '/games/school/clock/clock-memory.webp' },
  { id: 'set-clock', titel: 'Zet de klok', onder: 'Draai de wijzers naar de goede tijd', beeld: '/games/school/clock/clock-set.webp' },
  { id: 'race', titel: 'Klokkenrace', onder: 'Kies zo snel mogelijk de juiste klok', beeld: '/games/school/clock/clock-race.webp' },
  { id: 'world-times', titel: 'Wereldtijden', onder: 'Hoe laat is het ergens anders?', beeld: '/games/school/clock/clock-navigation.webp' },
];

export default function ClockHub({ progress, onPlay }: { progress: ClockProgress; onPlay: (game: ClockGameId) => void }) {
  return <main className="clock-hub" aria-labelledby="clock-hub-title">
    <header className="clock-hub__intro"><small>School</small><h1 id="clock-hub-title">Klokkijken</h1></header>
    <CardGrid
      label="Kies een klokspel"
      cards={SPELLEN.map(spel => ({
        id: spel.id,
        titel: spel.titel,
        onder: spel.onder,
        beeld: spel.beeld,
        meta: `${progress.completed[spel.id].length}/5 niveaus`,
      }))}
      onChoose={id => onPlay(id as ClockGameId)}
    />
  </main>;
}
