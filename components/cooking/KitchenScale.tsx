import React from 'react';
import { ASSET_LIBRARY } from '../../data/assetLibrary';

interface KitchenScaleProps {
  /** Het gewogen aantal gram. */
  value: number;
  full: number;
  ingredientImage: string;
  unit?: string;
}

/**
 * Alleen het scherm verandert mee; de kom blijft leeg tot geschikte vul-assets beschikbaar zijn.
 */
export default function KitchenScale({ value, unit = 'g' }: KitchenScaleProps) {
  return <div className="cooking-scale">
    <img className="cooking-scale__body" src={ASSET_LIBRARY.cooking.kit.scale} alt="" />
    <img className="cooking-scale__front" src={ASSET_LIBRARY.cooking.kit.scale} alt="" />
    <span className="cooking-scale__display" aria-live="polite" aria-label={`${value} ${unit === 'g' ? 'gram' : 'milliliter'}`}>
      <b>{value}</b><em>{unit}</em>
    </span>
  </div>;
}
