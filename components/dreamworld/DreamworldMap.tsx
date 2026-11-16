import React, { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from '../../design-system';
import { WORLD_DESTINATIONS } from '../../platform/dreamworld';
import IslandIcon from './IslandIcon';
import './planet-world.css';

/** Gebouwen en hun raakvlakken delen één beeldvlak, ook in de staande dorpsversie. */
export default function DreamworldMap({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [night, setNight] = useState(() => { const hour = new Date().getHours(); return hour < 7 || hour >= 19; });
  return <section className={`village-world${night ? ' is-night' : ' is-day'}`} aria-label="Dreamworld-kaart">
    <div className="village-world__sky" aria-hidden="true"><img src={night ? '/dreamworld/sky/night.webp' : '/dreamworld/sky/day.webp'} alt="" /></div>
    <div className="village-world__scene">
      <picture>
        <source media="(max-width: 640px)" srcSet="/dreamworld/village/portrait.webp" />
        <img className="village-world__landscape" src="/dreamworld/village/landscape.webp" alt="Een knus dorp met de bakkerij, plantenkas, rekenwerkplaats en Sebs ontdekkershuis rond je boomhut, verbonden door paadjes en een beekje" draggable={false} fetchPriority="high" />
      </picture>
      <nav aria-label="Gebouwen in Dreamworld">
        {WORLD_DESTINATIONS.filter(destination => destination.enabled).map(destination => <button
          key={destination.id}
          type="button"
          className="dream-hotspot"
          data-building={destination.id}
          aria-label={`${destination.label} openen`}
          title={destination.label}
          onClick={() => onNavigate(destination.route)}
        ><IslandIcon island={destination.id} /></button>)}
      </nav>
    </div>
    <div className="village-world__light">
      <IconButton label={night ? 'Daglicht tonen' : 'Nachtlucht tonen'} icon={night ? <Sun /> : <Moon />} onClick={() => setNight(value => !value)} />
    </div>
  </section>;
}
