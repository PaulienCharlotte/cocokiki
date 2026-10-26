import React from 'react';
import { ASSET_LIBRARY } from '../data/assetLibrary';
import { TREEHOUSE_ROOMS } from '../data/treehouse';
import RoomNavigation from '../components/treehouse/RoomNavigation';

interface TreehouseRoomProps {
  onNavigate: (path: string) => void;
}

export default function TreehouseRoom({ onNavigate }: TreehouseRoomProps) {
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
  </main>;
}
