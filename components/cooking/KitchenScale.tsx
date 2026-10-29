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
 * Bestaande recepten houden hun lege kom; nieuwe stappen kunnen inhoud tonen.
 *
 * Wat er in de kom ligt is het ingrediënt zelf, niet een gekleurd vlak: dat
 * las als een half afgesneden plaatje. Het groeit mee met wat je hebt gewogen.
 */
export default function KitchenScale({ value, full, contents, ingredientImage, unit = 'g' }: KitchenScaleProps) {
  return <div className="cooking-scale">
    <img className="cooking-scale__body" src={ASSET_LIBRARY.cooking.kit.scale} alt="" />
    {contents && value > 0 && ingredientImage && <span className="baking-scale-fill" aria-hidden="true">
      <img src={ingredientImage} alt="" style={{ opacity: Math.min(1, .35 + (value / full) * .65), transform: `scale(${.5 + Math.min(1, value / full) * .5})` }} />
    </span>}
    <img className="cooking-scale__front" src={ASSET_LIBRARY.cooking.kit.scale} alt="" />
    <span className="cooking-scale__display" aria-live="polite" aria-label={`${value} ${unit === 'g' ? 'gram' : 'milliliter'}`}>
      <b>{value}</b><em>{unit}</em>
    </span>
  </div>;
}
