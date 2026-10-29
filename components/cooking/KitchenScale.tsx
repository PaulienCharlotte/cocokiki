import React from 'react';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import type { BowlContents } from '../../data/cooking/preparation';

interface KitchenScaleProps {
  /** Het gewogen aantal gram. */
  value: number;
  full: number;
  ingredientImage: string;
  unit?: string;
  contents?: BowlContents;
}

/**
 * Bestaande recepten houden hun lege kom; nieuwe stappen kunnen inhoud als codelaag toevoegen.
 */
export default function KitchenScale({ value, full, contents, unit = 'g' }: KitchenScaleProps) {
  return <div className="cooking-scale">
    <img className="cooking-scale__body" src={ASSET_LIBRARY.cooking.kit.scale} alt="" />
    {contents && value > 0 && <span className={`baking-scale-fill baking-scale-fill--${contents}`} style={{ opacity: Math.min(1, value / full) }} aria-hidden="true" />}
    <img className="cooking-scale__front" src={ASSET_LIBRARY.cooking.kit.scale} alt="" />
    <span className="cooking-scale__display" aria-live="polite" aria-label={`${value} ${unit === 'g' ? 'gram' : 'milliliter'}`}>
      <b>{value}</b><em>{unit}</em>
    </span>
  </div>;
}
