import React from 'react';
import CardGrid from '../../components/ui/CardGrid';
import '../../components/dreamworld/wereld-scherm.css';
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
  // In de huisstijl: een wereldscherm in Sebs kamer, met de klokspellen op het klembord.
  return <main className="clock-hub ck-scherm wereld-scherm" data-wereld="wereld" aria-labelledby="clock-hub-title">
    <img className="world-location__background" src="/dreamworld/topo-interior.webp" alt="" />
    <div className="ck-houtbord wereld-naambord" aria-hidden="true">Kloklezen</div>
    <h1 id="clock-hub-title" className="sr-only">Klokkijken</h1>
    <CardGrid
      vorm="plek"
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
