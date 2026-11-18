import React, { useRef, useState } from 'react';
import type { WorldLocation } from '../../platform/worldLocations';
import { DISCOVERY_ROOMS, type DiscoveryObject } from '../../platform/discoveryRooms';
import { withLocationOrigin } from '../../services/locationNavigation';
import { INGREDIENTS } from '../../data/cooking/catalog';
import { GARDEN_CROPS } from '../../data/plants/garden';
import FoodKnowledgeDialog from '../food/FoodKnowledge';
import GardenCropFacts from '../plants/GardenCropFacts';
import { Button, Dialog } from '../../design-system';
import InfoKnop from '../ui/InfoKnop';
import { useMathSound } from '../../games/math/useMathSound';
import './discovery-room.css';

/** The room is a visual entrance into existing knowledge and ongoing projects. */
export default function WorldLocationLayout({ location, onNavigate }: { location: WorldLocation; onNavigate: (path: string) => void }) {
  const { play } = useMathSound();
  const pan = useRef<{ x: number; scroll: number } | null>(null);
  const room = DISCOVERY_ROOMS[location.id];
  const [selected, setSelected] = useState<DiscoveryObject | null>(null);
  const ingredient = selected?.action === 'ingredient' ? INGREDIENTS.find(item => item.id === selected.contentId) : null;
  const crop = selected?.action === 'crop' ? GARDEN_CROPS.find(item => item.id === selected.contentId) : null;
  const open = (object: DiscoveryObject) => {
    play(true);
    if (object.action === 'navigate' && object.path) onNavigate(withLocationOrigin(object.path, location.id));
    else setSelected(object);
  };
  return <main className={`ck-scherm discovery-room discovery-room--${location.id}`} data-wereld={room.world} aria-labelledby="discovery-title" style={{ '--scene-ratio': room.aspectRatio ?? 16 / 9 } as React.CSSProperties}>
    <header className="discovery-room__heading">
      <h1 id="discovery-title" className="ck-houtbord">{room.title}</h1>
    </header>
    <nav className="ck-zone-gereedschap ck-glas" aria-label="Gereedschap">
      <InfoKnop titel="Kijk eens rond" character={location.id}>Tik op een voorwerp om een boek te openen, iets te ontdekken of verder te werken. Spellen vind je bovenin bij de gameknop. Nieuwe verzoeken staan op je To Do-lijst.</InfoKnop>
    </nav>
    <div className="discovery-room__viewport" tabIndex={0} aria-label="Kijk rond in de kamer" onPointerDown={event => {
      if (event.pointerType !== 'mouse' || (event.target as HTMLElement).closest('button')) return;
      pan.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft };
      event.currentTarget.setPointerCapture(event.pointerId);
    }} onPointerMove={event => {
      if (pan.current) event.currentTarget.scrollLeft = pan.current.scroll + pan.current.x - event.clientX;
    }} onPointerUp={() => { pan.current = null; }} onPointerCancel={() => { pan.current = null; }} onLostPointerCapture={() => { pan.current = null; }}>
      <div className="discovery-room__scene">
        <img className="world-location__background discovery-room__background" src={location.background} alt="" draggable={false} fetchPriority="high" />
        <nav aria-label={`Ontdek ${room.title}`}>
          {room.objects.map(object => <button type="button" key={object.id} className="discovery-object" data-object={object.id} style={{ '--object-x': `${object.x}%`, '--object-y': `${object.y}%` } as React.CSSProperties} onClick={() => open(object)}>
            <span className="discovery-object__light" aria-hidden="true" />
            <span className="discovery-object__label ck-glas">{object.label}</span>
          </button>)}
        </nav>
      </div>
    </div>
    <p className="discovery-room__swipe ck-glas">Veeg om rond te kijken · tik om te ontdekken</p>
    {ingredient && <FoodKnowledgeDialog ingredient={ingredient} onClose={() => setSelected(null)} />}
    <Dialog open={Boolean(crop)} title={crop?.name ?? ''} primaryAction={null} onClose={() => setSelected(null)}>{crop && <><GardenCropFacts crop={crop} /><nav className="discovery-crops" aria-label="Andere gewassen ontdekken">{GARDEN_CROPS.filter(item => item.id !== crop.id).map(item => <button type="button" key={item.id} onClick={() => setSelected({ ...selected!, action: 'crop', contentId: item.id })}><img src={item.image} alt="" /><span>{item.name}</span></button>)}</nav>{INGREDIENTS.some(item => item.id === (crop.kitchenId ?? crop.id)) && <Button onClick={() => setSelected({ ...selected!, action: 'ingredient', contentId: crop.kitchenId ?? crop.id })}>Ontdek meer eten</Button>}</>}</Dialog>
  </main>;
}
