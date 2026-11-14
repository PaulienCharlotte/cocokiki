import React from 'react';
import { FOOD_VISUALS } from '../../data/cooking/foodVisuals';

export default function FoodIllustration({ termId, caption = true }: { termId: string; caption?: boolean }) {
  const visual = FOOD_VISUALS[termId];
  if (!visual) return null;
  return <figure className="food-illustration">
    <img src={visual.image} alt={visual.alt} decoding="async" />
    {caption && <figcaption>{visual.caption}</figcaption>}
  </figure>;
}
