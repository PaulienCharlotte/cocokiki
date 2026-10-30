import React from 'react';
import { DREAMWORLD_IMAGE, DREAMWORLD_RATIO, WORLD_DESTINATIONS } from '../../platform/dreamworld';
import WorldMapViewer from './WorldMapViewer';

export default function DreamworldMap({ onNavigate }: { onNavigate: (path: string) => void }) {
  return <WorldMapViewer image={DREAMWORLD_IMAGE} ratio={DREAMWORLD_RATIO}
    alt="CocoKiki met een centrale boomhut, kookeiland, rekeneiland, plantenkas, taaleiland en ontdekkingseiland"
    locations={WORLD_DESTINATIONS.filter(destination => destination.enabled).map(destination => ({ id: destination.id, label: destination.label, path: destination.route, spot: destination.position }))}
    onNavigate={onNavigate} />;
}
