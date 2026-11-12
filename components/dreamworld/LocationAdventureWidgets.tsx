import React, { useId, useState } from 'react';
import { Clock3, LockKeyhole } from 'lucide-react';
import { Button, ProgressIndicator } from '../../design-system';
import type { AdventurePreview, LocationActivity, WorldLocation } from '../../platform/worldLocations';
import CardGrid from '../ui/CardGrid';
import './location-game.css';

const STATUS = { available: 'Beschikbaar', active: 'Bezig', completed: 'Voltooid', locked: 'Vergrendeld' };



export function AdventureClipboard({ adventure, action, children }: { adventure: AdventurePreview; action?: { label: string; onClick: () => void; disabled?: boolean }; children?: React.ReactNode }) {
  const id = useId();
  const progress = adventure.progress;
  const validProgress = progress && Number.isSafeInteger(progress.completed) && Number.isSafeInteger(progress.total) && progress.total > 0 && progress.completed >= 0 && progress.completed <= progress.total;
  return <section className="adventure-clipboard" aria-labelledby={id}>
    <div className="adventure-clipboard__paper">
      <div aria-live="polite" aria-atomic="true"><h2 id={id}>{adventure.title}</h2><p>{adventure.description}</p></div>
      {validProgress && <ProgressIndicator value={progress.completed} max={progress.total} label="Voortgang" compact />}
      {children}
      {action ? <Button disabled={action.disabled} onClick={action.onClick}>{action.label}</Button> : <Button variant="quiet" disabled startIcon={<Clock3 size={18} />}>Binnenkort beschikbaar</Button>}
    </div>
  </section>;
}

/**
 * De bakkerij: dezelfde witte kaarten als overal.
 *
 * Hier stonden ronde medaillons met een eigen kleur per tegel. Dat was een
 * tweede vormtaal naast het kaartraster dat de rest van de app gebruikt.
 * Zie `.claude/skills/cocokiki-ui`, sectie 4.
 */
export default function LocationGameView({ location, onOpen, onDirect, renderClipboard, initialTab = 'activities' }: { location: WorldLocation; onOpen: (activity: LocationActivity) => void; onDirect?: (adventureId: string, alleenVragen?: boolean) => boolean; renderClipboard?: (preview: AdventurePreview) => React.ReactNode; initialTab?: 'activities' | 'adventures' }) {
  const previews = location.adventurePreviews ?? [];
  const [selectedId, setSelectedId] = useState(previews[0]?.id);
  // Zonder activiteiten valt er niets te kiezen; dan is er ook geen tabblad.
  const heeftActiviteiten = location.activities.length > 0;
  const [tab, setTab] = useState<'activities' | 'adventures'>(heeftActiviteiten ? initialTab : 'adventures');
  // Een avontuur dat gewoon een spel is, opent meteen. Alleen wat echt een
  // opdracht aan de balie is, gaat via het klembord.
  const kies = (id: string) => { if (onDirect?.(id)) return; setSelectedId(id); };
  const opKlembord = previews.filter(item => !onDirect || !onDirect(item.id, true));
  const selected = opKlembord.find(item => item.id === selectedId) ?? opKlembord[0];
  const id = useId();
  return <div className={`location-game location-game--${heeftActiviteiten ? tab : 'adventures'}`}>
    <header className="location-game__heading"><h1 id={`${id}-title`} className="sr-only">{location.name}</h1></header>
    {heeftActiviteiten && <div className="location-tabs location-game__tabs" role="tablist" aria-label="Kies activiteiten of avonturen">
      {(['activities', 'adventures'] as const).map((value, index) => <button type="button" key={value} role="tab" aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} id={`${id}-${value}-tab`} aria-controls={`${id}-${value}`} onClick={() => setTab(value)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); const next = event.key === 'Home' ? 'activities' : event.key === 'End' ? 'adventures' : index === 0 ? 'adventures' : 'activities';
        setTab(next); document.getElementById(`${id}-${next}-tab`)?.focus();
      }}>{value === 'activities' ? 'Activiteiten' : 'Avonturen'}</button>)}
    </div>}
    {location.activities.length > 0 && <div id={`${id}-activities`} className="location-game__activities">
      <CardGrid
        // De activiteiten staan in de smalle kolom naast de tekening; drie
        // naast elkaar breekt een woord als "Boodschappen" doormidden.
        kolommen={2}
        label={`Activiteiten bij ${location.character.name}`}
        cards={location.activities.map(activity => ({
          id: activity.id,
          titel: activity.label,
          onder: 'comingSoon' in activity.target ? 'Binnenkort beschikbaar' : undefined,
          beeld: activity.image,
        }))}
        onChoose={gekozen => {
          const activity = location.activities.find(item => item.id === gekozen);
          if (activity && !('comingSoon' in activity.target)) onOpen(activity);
        }}
      />
    </div>}
    <div id={`${id}-adventures`} className="location-game__stories">
      {selected && (renderClipboard ? renderClipboard(selected) : <AdventureClipboard adventure={selected} />)}
      <section className="adventure-shelf" aria-labelledby={`${id}-shelf-title`}>
        <h2 id={`${id}-shelf-title`} className="sr-only">Avonturen</h2>
        <CardGrid
          label="Kies een avontuur"
          cards={previews.map(adventure => ({
            id: adventure.id,
            titel: adventure.title,
            beeld: adventure.image,
            actief: onDirect?.(adventure.id, true) ? undefined : selected?.id === adventure.id,
            meta: adventure.status === 'locked'
              ? <span className="adventure-slot"><LockKeyhole size={14} aria-hidden="true" />{STATUS.locked}</span>
              : <span className="adventure-slot is-open">{STATUS[adventure.status]}</span>,
          }))}
          onChoose={kies}
        />
      </section>
    </div>
  </div>;
}
