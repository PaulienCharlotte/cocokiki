import React from 'react';
import { motion } from 'framer-motion';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import CookingAssetImage from './CookingAssetImage';

interface KitchenScaleProps {
  /** Het gewogen aantal gram. */
  value: number;
  /** Hoeveel gram een volle kom is; bepaalt hoe hard het ingrediënt meegroeit. */
  full: number;
  ingredientImage: string;
}

/**
 * De weegschaal uit de keukenset. Het ingrediënt groeit mee met het gewicht en
 * de waarde staat op het schermpje van de weegschaal zelf.
 */
export default function KitchenScale({ value, full, ingredientImage }: KitchenScaleProps) {
  return <div className="cooking-scale">
    <img className="cooking-scale__body" src={ASSET_LIBRARY.cooking.kit.scale} alt="" />
    {value > 0 && <motion.span
      className="cooking-scale__load"
      animate={{ scale: .45 + Math.min(1, value / Math.max(1, full)) * .55 }}
      transition={{ type: 'spring', stiffness: 240, damping: 20 }}
    >
      <CookingAssetImage src={ingredientImage} />
    </motion.span>}
    <span className="cooking-scale__display" aria-live="polite" aria-label={`${value} gram`}>
      <b>{value}</b><em>g</em>
    </span>
  </div>;
}
