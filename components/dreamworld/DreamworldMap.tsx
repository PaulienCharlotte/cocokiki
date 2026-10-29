import React from 'react';
import { DREAMWORLD_IMAGE, DREAMWORLD_RATIO, DREAM_ISLANDS } from '../../platform/dreamworld';
import WorldMapViewer from './WorldMapViewer';
import IslandIcon from './IslandIcon';

export default function DreamworldMap({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <WorldMapViewer image={DREAMWORLD_IMAGE} ratio={DREAMWORLD_RATIO}
    alt="CocoKiki Dreamworld met een boomhut, rekenbos, kookhuis, kas, ontdekkingshaven, boekenhuis en een kasteel in de verte"
    locations={DREAM_ISLANDS.map(island => ({ id: island.id, label: island.label, path: island.id === 'plants' ? '/plantendokter' : island.id === 'home' ? '/treehouse' : island.path, spot: island.spot, comingSoon: island.status === 'coming-soon', icon: <IslandIcon island={island.id} /> }))}
    onNavigate={onNavigate} />;
}
