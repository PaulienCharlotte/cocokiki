import React from 'react';
import { DREAMWORLD_IMAGE, DREAMWORLD_RATIO, WORLD_DESTINATIONS } from '../../platform/dreamworld';
import WorldMapViewer from './WorldMapViewer';
import IslandIcon from './IslandIcon';

export default function DreamworldMap({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <WorldMapViewer image={DREAMWORLD_IMAGE} ratio={DREAMWORLD_RATIO}
    alt="CocoKiki Dreamworld met de boomhut, Coco’s Bakkerij, Kiki’s Plantenkas, de rekenwerkplaats en de reishaven"
    locations={WORLD_DESTINATIONS.filter(destination => destination.enabled).map(destination => ({ id: destination.id, label: destination.label, path: destination.route, spot: destination.position, icon: <IslandIcon island={destination.id} /> }))}
    onNavigate={onNavigate} />;
}
