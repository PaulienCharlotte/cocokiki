import React, { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import { ASSET_LIBRARY } from '../data/assetLibrary';
import { TREEHOUSE_ROOMS } from '../data/treehouse';
import { PLANT_SPECIES_BY_ID } from '../data/plants/species';
import {
  loadPlantFamily,
  PLANT_FAMILY_CHANGE_EVENT,
  PLANT_FAMILY_KEY,
  plantThirst,
} from '../services/plantFamily';
import { subscribeLocalState } from '../services/localState';
import PlantFamilyPanel from '../components/plants/PlantFamilyPanel';
import RoomNavigation from '../components/treehouse/RoomNavigation';

interface TreehouseRoomProps {
  onNavigate: (path: string) => void;
}

export default function TreehouseRoom({ onNavigate }: TreehouseRoomProps) {
  const [plantsOpen, setPlantsOpen] = useState(false);
  const [family, setFamily] = useState(loadPlantFamily);
  const [nu, setNu] = useState(() => Date.now());

  useEffect(() => {
    const update = () => setFamily(loadPlantFamily());
    const unsubscribe = subscribeLocalState(update, PLANT_FAMILY_KEY);
    window.addEventListener(PLANT_FAMILY_CHANGE_EVENT, update);
    const klok = window.setInterval(() => setNu(Date.now()), 30000);
    return () => {
      unsubscribe();
      window.removeEventListener(PLANT_FAMILY_CHANGE_EVENT, update);
      window.clearInterval(klok);
    };
  }, []);

  // Hoeveel planten staan er droog? Dat getal is de reden om hier te kijken.
  const dorstig = family.plants.filter(plant =>
    plantThirst(plant, PLANT_SPECIES_BY_ID[plant.speciesId]?.waterDays ?? 7, nu).stage !== 'fresh',
  ).length;

  return <main className="treehouse-overview" aria-labelledby="treehouse-room-title">
    <h1 id="treehouse-room-title" className="treehouse-room__title">Mijn boomhut</h1>
    <RoomNavigation onNavigate={onNavigate} />
    <img className="treehouse-overview__background" src={ASSET_LIBRARY.treehouse.overview} alt="Doorsnede van de CocoKiki-boomhut met vier kamers" />
    <nav className="treehouse-overview__rooms" aria-label="Kamers in mijn boomhut">
      {TREEHOUSE_ROOMS.map(room => <button
        key={room.id}
        className={`treehouse-overview__room treehouse-overview__room--${room.id}`}
        type="button"
        aria-label={`${room.label} openen`}
        onClick={() => onNavigate(room.path)}
      ><img src={room.icon} alt="" draggable={false} /><span>{room.label}</span></button>)}
    </nav>

    <button
      type="button"
      className={`treehouse-overview__plants${dorstig > 0 ? ' is-thirsty' : ''}`}
      aria-label={dorstig > 0 ? `Mijn Planten openen, ${dorstig} ${dorstig === 1 ? 'plant heeft' : 'planten hebben'} dorst` : 'Mijn Planten openen'}
      onClick={() => setPlantsOpen(true)}
    >
      <Leaf aria-hidden="true" />
      <span>Mijn Planten</span>
      {dorstig > 0 && <em aria-hidden="true">{dorstig}</em>}
    </button>

    {plantsOpen && <PlantFamilyPanel onClose={() => setPlantsOpen(false)} />}
  </main>;
}
