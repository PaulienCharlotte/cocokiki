import React, { useEffect, useRef, useState } from 'react';
import { WORLD_DESTINATIONS, type IslandId } from '../../platform/dreamworld';
import { LuaAudio } from '../../games/red-baby-lua/game/systems/audio';
import { useWorldLight } from '../../services/worldLight';
import VillageGuide from './VillageGuide';
import WorldLightSwitch from './WorldLightSwitch';
import { VILLAGE_STORIES } from './villageDestinations';
import './planet-world.css';

/** Gebouwen zijn de navigatie: geen losse spelknoppen over de wereld. */
export default function DreamworldMap({ onNavigate }: { onNavigate: (path: string) => void }) {
  const { night, toggleNight } = useWorldLight();
  const [departing, setDeparting] = useState<IslandId | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audio = useRef<LuaAudio | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); audio.current?.destroy(); }, []);
  const tap = () => { try { audio.current ??= new LuaAudio(); audio.current.unlock(); audio.current.play('tap'); } catch { /* Navigatie blijft bereikbaar zonder audio. */ } };
  const enter = (id: IslandId, route: string) => {
    if (timer.current) return;
    tap(); setDeparting(id);
    timer.current = setTimeout(() => onNavigate(route), window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 380);
  };
  return <section className={`village-world${night ? ' is-night' : ' is-day'}${departing ? ` is-entering entering-${departing}` : ''}`} aria-label="Dreamworld-kaart">
    <div className="village-world__sky" aria-hidden="true"><img src={night ? '/dreamworld/sky/night.webp' : '/dreamworld/sky/day.webp'} alt="" /></div>
    <div className="village-world__scene" onPointerMove={event => {
      if (event.pointerType !== 'mouse' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const rect = event.currentTarget.getBoundingClientRect();
      event.currentTarget.style.setProperty('--village-look-x', `${((event.clientX - rect.left) / rect.width - .5) * 6}px`);
      event.currentTarget.style.setProperty('--village-look-y', `${((event.clientY - rect.top) / rect.height - .5) * 4}px`);
    }} onPointerLeave={event => { event.currentTarget.style.setProperty('--village-look-x', '0px'); event.currentTarget.style.setProperty('--village-look-y', '0px'); }}>
      <picture><source media="(max-width: 900px)" srcSet="/dreamworld/village/portrait-v2.webp" /><img className="village-world__landscape" src="/dreamworld/village/landscape-quests.webp" alt="Ontdek Coco’s bakkerij, Kiki’s kas, Baby Lua’s werkplaats en Sebs ontdekkershuis rond jouw boomhut" draggable={false} fetchPriority="high" /></picture>
      {night && <picture className="village-world__lamplight" aria-hidden="true"><source media="(max-width: 900px)" srcSet="/dreamworld/village/portrait-v2.webp" /><img src="/dreamworld/village/landscape-quests.webp" alt="" /></picture>}
      <nav aria-label="Gebouwen in Dreamworld">
        {WORLD_DESTINATIONS.filter(destination => destination.enabled).map(destination => {
          const story = VILLAGE_STORIES[destination.id];
          if (!story) return null;
          return <button key={destination.id} type="button" className="dream-hotspot" data-building={destination.id} data-wereld={story.world}
            aria-label={`${destination.label} openen`} onClick={() => enter(destination.id, destination.route)}>
            <span className="village-destination__light" aria-hidden="true" />
            <span className="village-destination__label ck-glas">{story.action}</span>
          </button>;
        })}
      </nav>
    </div>
    <VillageGuide onNavigate={path => { tap(); onNavigate(path); }} />
    <p className="village-world__hint">{departing ? 'Op naar je avontuur…' : 'Ontdek het dorp · tik op een huis'}</p>
    <WorldLightSwitch night={night} onToggle={() => { tap(); toggleNight(); }} />
  </section>;
}
