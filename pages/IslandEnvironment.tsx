import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { Button, IconButton } from '../design-system';
import type { DreamIsland } from '../platform/dreamworld';
import MovableGameIcon from '../components/dreamworld/MovableGameIcon';

export default function IslandEnvironment({ island, onNavigate }: { island: DreamIsland; onNavigate: (path: string) => void }) {
  const [editingIsland, setEditingIsland] = useState<string | null>(null);
  const editing = editingIsland === island.id;
  return <main className={`dream-island dream-island--${island.id}`} aria-labelledby="island-title"
    onPointerDown={event => { if (!(event.target as HTMLElement).closest('.dream-location, .dream-island__edit-done')) setEditingIsland(null); }}
    onKeyDown={event => { if (event.key === 'Escape') setEditingIsland(null); }}>
    <img className="dream-island__background" src={island.background} alt={island.backgroundAlt} />
    <h1 id="island-title" className="sr-only">{island.label}</h1>
    {editing && <IconButton className="dream-island__edit-done" label="Klaar met verplaatsen" icon={<Check />} onClick={() => setEditingIsland(null)} />}
    {island.status === 'coming-soon' ? <div className="dream-island__soon"><h2>Binnenkort kun je hier op taalavontuur!</h2><Button startIcon={<ArrowLeft size={20} />} onClick={() => onNavigate('/')}>Terug naar Dreamworld</Button></div> : <nav className={`dream-island__scene${editing ? ' is-editing' : ''}`} aria-label={`Plekken op ${island.label}`}>
      {island.activities.map(item => <MovableGameIcon key={`${island.id}:${item.id}`} island={island.id} activity={item} editing={editing} onEdit={() => setEditingIsland(island.id)} onNavigate={onNavigate} />)}
    </nav>}
  </main>;
}
