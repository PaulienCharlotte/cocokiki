import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../design-system';
import type { DreamIsland } from '../platform/dreamworld';
import { COUNTRY_FLAGS } from '../data/flags';

export default function IslandEnvironment({ island, onNavigate }: { island: DreamIsland; onNavigate: (path: string) => void }) {
  return <main className={`dream-island dream-island--${island.id}`} aria-labelledby="island-title">
    <img className="dream-island__background" src={island.background} alt={island.backgroundAlt} />
    <h1 id="island-title" className="sr-only">{island.label}</h1>
    {island.status === 'coming-soon' ? <div className="dream-island__soon"><h2>Binnenkort kun je hier nieuwe talen ontdekken!</h2><Button startIcon={<ArrowLeft size={20} />} onClick={() => onNavigate('/')}>Terug naar Dreamworld</Button></div> : <nav className="dream-island__scene" aria-label={`Plekken op ${island.label}`}>
      {island.activities.map(item => <button key={item.id} type="button" className="dream-location" style={{ '--location-x': `${item.x}%`, '--location-y': `${item.y}%` } as React.CSSProperties} onClick={() => onNavigate(item.path)} aria-label={`${item.label} openen`} title={item.label}>
        {item.id === 'flags' ? <div className="dream-location__flags" aria-hidden="true"><span>{COUNTRY_FLAGS.Nederland}</span><span>{COUNTRY_FLAGS.Frankrijk}</span></div> : <img src={item.image} alt="" draggable={false} />}
      </button>)}
    </nav>}
  </main>;
}
