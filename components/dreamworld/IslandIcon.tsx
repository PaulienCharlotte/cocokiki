import React from 'react';
import type { IslandId } from '../../platform/dreamworld';

export const ISLAND_ICONS_IMAGE = '/dreamworld/island-icons.webp';
// De zes ronde iconen worden rechtstreeks uit het aangeleverde vel getoond.
export const ISLAND_ICON_POSITIONS: Record<IslandId, [number, number]> = {
  plants: [8.042, 13.291], cooking: [49.825, 13.291], discovery: [91.783, 13.291],
  math: [8.042, 83.861], language: [49.825, 83.861], home: [91.783, 83.861],
};

export default function IslandIcon({ island }: { island: IslandId }) {
  const [x, y] = ISLAND_ICON_POSITIONS[island];
  return <span className="dream-island-icon" data-island={island} aria-hidden="true" style={{ backgroundImage: `url('${ISLAND_ICONS_IMAGE}')`, backgroundPosition: `${x}% ${y}%` }} />;
}
