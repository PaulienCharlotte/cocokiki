import React, { useId, useState } from 'react';
import { CakeSlice, Clock3, Cookie, KeyRound, LockKeyhole, PackageSearch, Trophy, Truck } from 'lucide-react';
import { Button, ProgressIndicator } from '../../design-system';
import type { AdventurePreview, LocationActivity, WorldLocation } from '../../platform/worldLocations';
import './location-game.css';

const ICONS = { muffin: Cookie, cake: CakeSlice, secret: KeyRound, ingredients: PackageSearch, delivery: Truck, contest: Trophy };
const STATUS = { available: 'Beschikbaar', active: 'Bezig', completed: 'Voltooid', locked: 'Vergrendeld' };

export function ActivityBadge({ activity, onOpen }: { key?: React.Key; activity: LocationActivity; onOpen: () => void }) {
  const soon = 'comingSoon' in activity.target;
  return <Button variant="quiet" className={`game-activity game-tone--${activity.tone ?? 'sage'}`} disabled={soon} onClick={onOpen}>
    <span className="game-activity__medallion">{activity.image && <img src={activity.image} alt="" />}{soon && <LockKeyhole className="game-activity__lock" size={14} />}</span>
    <strong>{activity.label}</strong><small>{soon ? 'Binnenkort' : 'Ontdekken'}</small>
  </Button>;
}

export function AdventureBadge({ adventure, selected, onSelect }: { adventure: AdventurePreview; selected: boolean; onSelect: () => void }) {
  const Icon = ICONS[adventure.icon];
  return <Button variant="quiet" className={`game-adventure game-tone--${adventure.tone}`} aria-pressed={selected} onClick={onSelect}>
    <span className="game-adventure__medallion"><img src={adventure.image} alt="" /><Icon className="game-adventure__symbol" size={20} /></span>
    <strong>{adventure.title}</strong><small>{adventure.status === 'locked' && <LockKeyhole size={12} />}{STATUS[adventure.status]}</small>
  </Button>;
}

export function AdventureClipboard({ adventure, action, children }: { adventure: AdventurePreview; action?: { label: string; onClick: () => void; disabled?: boolean }; children?: React.ReactNode }) {
  const id = useId();
  const progress = adventure.progress;
  const validProgress = progress && Number.isSafeInteger(progress.completed) && Number.isSafeInteger(progress.total) && progress.total > 0 && progress.completed >= 0 && progress.completed <= progress.total;
  return <section className="adventure-clipboard" aria-labelledby={id}>
    <span className="adventure-clipboard__clip" aria-hidden="true" />
    <div className="adventure-clipboard__paper">
      <span className="adventure-clipboard__eyebrow">Op het klembord</span>
      <div aria-live="polite" aria-atomic="true"><h2 id={id}>{adventure.title}</h2><p>{adventure.description}</p></div>
      {validProgress && <ProgressIndicator value={progress.completed} max={progress.total} label="Voortgang" compact />}
      {children}
      {action ? <Button disabled={action.disabled} onClick={action.onClick}>{action.label}</Button> : <Button variant="quiet" disabled startIcon={<Clock3 size={18} />}>Binnenkort beschikbaar</Button>}
    </div>
  </section>;
}

export default function LocationGameView({ location, onOpen, renderClipboard, initialTab = 'activities' }: { location: WorldLocation; onOpen: (activity: LocationActivity) => void; renderClipboard?: (preview: AdventurePreview) => React.ReactNode; initialTab?: 'activities' | 'adventures' }) {
  const previews = location.adventurePreviews ?? [];
  const [selectedId, setSelectedId] = useState(previews[0]?.id);
  const [tab, setTab] = useState<'activities' | 'adventures'>(initialTab);
  const selected = previews.find(item => item.id === selectedId) ?? previews[0];
  const id = useId();
  return <div className={`location-game location-game--${tab}`}>
    <header className="location-game__heading"><h1 id={`${id}-title`}>{location.name}</h1><span>Bij {location.character.name}</span></header>
    <div className="location-tabs location-game__tabs" role="tablist" aria-label="Kies activiteiten of avonturen">
      {(['activities', 'adventures'] as const).map((value, index) => <button type="button" key={value} role="tab" aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} id={`${id}-${value}-tab`} aria-controls={`${id}-${value}`} onClick={() => setTab(value)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); const next = event.key === 'Home' ? 'activities' : event.key === 'End' ? 'adventures' : index === 0 ? 'adventures' : 'activities';
        setTab(next); document.getElementById(`${id}-${next}-tab`)?.focus();
      }}>{value === 'activities' ? 'Activiteiten' : 'Avonturen'}</button>)}
    </div>
    <nav id={`${id}-activities`} className="location-game__activities" aria-label={`Activiteiten bij ${location.character.name}`}>
      {location.activities.map(activity => <ActivityBadge key={activity.id} activity={activity} onOpen={() => onOpen(activity)} />)}
    </nav>
    <div id={`${id}-adventures`} className="location-game__stories">
      {selected && (renderClipboard ? renderClipboard(selected) : <AdventureClipboard adventure={selected} />)}
      <section className="adventure-shelf" aria-labelledby={`${id}-shelf-title`}>
        <div className="adventure-shelf__heading"><h2 id={`${id}-shelf-title`}>Avonturen</h2><span>{previews.length} avonturen</span></div>
        <ul className="adventure-shelf__list" aria-label="Kies een avontuur">{previews.map(adventure => <li key={adventure.id}><AdventureBadge adventure={adventure} selected={selected?.id === adventure.id} onSelect={() => setSelectedId(adventure.id)} /></li>)}</ul>
      </section>
    </div>
  </div>;
}
