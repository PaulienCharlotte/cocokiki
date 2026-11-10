import React, { useId, useState } from 'react';
import { ArrowLeft, BookOpen, Calculator, ClipboardList, Clock3, Compass, CookingPot, Flower2, HeartPulse, Leaf, Sprout } from 'lucide-react';
import { Button } from '../../design-system';
import { ACTIVITIES_BY_ID, type ActivityDefinition } from '../../platform/activityRegistry';
import type { LocationIcon, WorldLocation } from '../../platform/worldLocations';
import { withLocationOrigin } from '../../services/locationNavigation';
import './world-location.css';
import PlantFlashcard from '../plants/PlantFlashcard';
import LocationGameView, { AdventureClipboard } from './LocationAdventureWidgets';
import CardGrid from '../ui/CardGrid';
import AdventureRunner from '../adventures/AdventureRunner';
import { PLAYABLE_ADVENTURES } from '../../data/adventures/catalog';

/** Welke knop er op het klembord staat, per avontuur dat echt speelt. */
const KLEMBORD_ACTIES: Record<string, { label: string; pad: string }> = {
  bestellingen: { label: 'Naar de toonbank', pad: '/treehouse/cookbook?toonbank=1' },
  plantendokter: { label: 'Naar het spreekuur', pad: '/plantendokter' },
  taartenatelier: { label: 'Naar het atelier', pad: '/games/taartenatelier' },
};

const ICONS: Record<LocationIcon, React.ComponentType<{ size?: number }>> = {
  recipes: CookingPot, orders: ClipboardList, math: Calculator, nutrition: Leaf,
  clinic: HeartPulse, plants: Flower2, book: BookOpen, grow: Sprout, clock: Clock3,
};
export default function WorldLocationLayout({ location, onNavigate }: { location: WorldLocation; onNavigate: (path: string) => void }) {
  const [tab, setTab] = useState<'activities' | 'adventures'>('activities');
  const [section, setSection] = useState<'main' | 'math'>('main');
  const [plant, setPlant] = useState<string | null>(null);
  const heeftAvonturen = location.adventures.length > 0;
  const id = useId();
  const open = (activity: ActivityDefinition) => {
    if (!activity || activity.status !== 'available') return;
    if (activity.kind === 'plant' && activity.contentId) setPlant(activity.contentId);
    else onNavigate(withLocationOrigin(activity.path, location.id));
  };
  /*
   * Eén raster witte kaarten, hetzelfde als het rekenmenu en het
   * vlaggenmemory. Geen regel "Spelen" onder elke kaart: wat op elke kaart
   * hetzelfde staat, zegt niets. Zie `.claude/skills/cocokiki-ui`.
   */
  const raster = (ids: string[], label: string) => {
    const gekozen = ids.map(key => ACTIVITIES_BY_ID[key]).filter(Boolean);
    return <CardGrid
      label={label}
      cards={gekozen.map(activity => ({
        id: activity.id,
        titel: activity.title,
        onder: activity.status === 'coming-soon' ? 'Binnenkort beschikbaar' : activity.subtitle,
        beeld: activity.image,
      }))}
      onChoose={id => open(ACTIVITIES_BY_ID[id])}
    />;
  };
  if (location.presentation === 'game') return <main className="world-location world-location--game" aria-label={location.name} style={{
    '--location-accent': location.accentColor, '--location-desktop-position': location.backgroundPosition.desktop,
    '--location-mobile-position': location.backgroundPosition.mobile,
    ...(location.clipboard ? { '--location-clipboard': `url('${location.clipboard}')` } : {}),
  } as React.CSSProperties}>
    <img className="world-location__background" src={location.background} alt={`${location.character.name} in ${location.name}`} fetchPriority="high" />
    {PLAYABLE_ADVENTURES.some(item => item.definition.locationId === location.id)
      ? <AdventureRunner location={location} onOpen={activity => { if ('activity' in activity.target) open(ACTIVITIES_BY_ID[activity.target.activity]); }} />
      : <LocationGameView
        location={location}
        onOpen={activity => { if ('activity' in activity.target) open(ACTIVITIES_BY_ID[activity.target.activity]); }}
        // De bestellingen van de bakkerij lopen via de toonbank in het
        // kookboek, zodat er één ingang is voor een bestelling.
        renderClipboard={preview => <AdventureClipboard
          adventure={preview}
          action={KLEMBORD_ACTIES[preview.id]
            ? { label: KLEMBORD_ACTIES[preview.id].label, onClick: () => onNavigate(withLocationOrigin(KLEMBORD_ACTIES[preview.id].pad, location.id)) }
            : undefined}
        />}
      />}
  </main>;
  return <main className={`world-location world-location--${location.id}`} aria-labelledby={`${id}-title`} style={{
    '--location-accent': location.accentColor, '--location-desktop-position': location.backgroundPosition.desktop,
    '--location-mobile-position': location.backgroundPosition.mobile,
  } as React.CSSProperties}>
    <img className="world-location__background" src={location.background} alt={`${location.character.name} in ${location.name}`} fetchPriority="high" />
    <div className="world-location__scene"><h1 id={`${id}-title`} className="sr-only">{location.name}</h1></div>
    <div className="world-location__dock">
      {/* Een tabblad dat alleen "binnenkort" zegt, is een belofte en geen keuze.
          Zonder avonturen staan hier gewoon de activiteiten. */}
      {heeftAvonturen && <div className="location-tabs" role="tablist" aria-label="Kies activiteiten of avonturen">
        {(['activities', 'adventures'] as const).map((value, index) => <button key={value} type="button" role="tab" id={`${id}-${value}-tab`} aria-controls={`${id}-${value}`} aria-selected={tab === value} tabIndex={tab === value ? 0 : -1}
          onClick={() => setTab(value)} onKeyDown={event => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault(); const next = event.key === 'Home' ? 'activities' : event.key === 'End' ? 'adventures' : index === 0 ? 'adventures' : 'activities';
            setTab(next); document.getElementById(`${id}-${next}-tab`)?.focus();
          }}>{value === 'activities' ? 'Activiteiten' : 'Avonturen'}</button>)}
      </div>}
      <section id={`${id}-activities`} className={`location-panel location-panel--activities${!heeftAvonturen || tab === 'activities' ? ' is-selected' : ''}${location.activities.length ? '' : ' is-kaal'}`} {...(location.activities.length ? { 'aria-labelledby': `${id}-activities-title` } : { 'aria-label': 'Activiteiten' })}>
        {/* Een kop boven één raster zegt niets extra's. Alleen waar er ook
            knoppen boven staan, scheidt hij de twee groepen. */}
        {(location.activities.length > 0 || section === 'math') && <div className="location-panel__heading">
          <h2 id={`${id}-activities-title`}>{section === 'math' ? 'Bakrekenen' : 'Activiteiten'}</h2>
          {section === 'math' && <Button variant="quiet" size="small" startIcon={<ArrowLeft size={18} />} onClick={() => setSection('main')}>Alles</Button>}
        </div>}
        {section === 'main' ? <>
          {location.activities.length > 0 && <nav className="location-actions" aria-label={`Activiteiten bij ${location.character.name}`}>
            {location.activities.map(activity => {
              const Icon = ICONS[activity.icon]; const target = activity.target;
              return <button type="button" key={activity.id} className="location-action" disabled={'comingSoon' in target} onClick={() => {
                if ('activity' in target) open(ACTIVITIES_BY_ID[target.activity]);
                else if ('section' in target) { if (target.section === 'adventures') setTab('adventures'); else setSection('math'); }
              }}><Icon size={24} /><span>{activity.label}</span>{'comingSoon' in target && <small>Binnenkort beschikbaar</small>}</button>;
            })}
          </nav>}
          {raster(location.featuredActivities, location.id === 'coco' ? 'Recepten' : location.id === 'kiki' ? 'Planten' : 'Rekenspellen')}
        </> : raster(location.practiceActivities, 'Rekenspellen')}
      </section>
      {heeftAvonturen && <section id={`${id}-adventures`} className={`location-panel location-panel--adventures${tab === 'adventures' ? ' is-selected' : ''}`} aria-labelledby={`${id}-adventures-title`}>
        <h2 id={`${id}-adventures-title`}>Avonturen</h2>
        <Compass size={32} aria-hidden="true" /><p>Binnenkort beschikbaar</p>
        <ul>{location.adventures.map(adventure => <li key={adventure.id}>{adventure.name} · Binnenkort</li>)}</ul>
      </section>}
    </div>
    {plant && <PlantFlashcard speciesId={plant} onClose={() => setPlant(null)} onNavigate={path => onNavigate(withLocationOrigin(path, location.id))} />}
  </main>;
}
