import React from 'react';
import { Check, Clock3, LockKeyhole, Play, Star } from 'lucide-react';
import type { CookingProgressState, JourneyProgress, RecipeConfig } from '../../data/cooking/types';
import { getRecipeAccess } from '../../data/cooking/availability';
import CookingAssetImage from './CookingAssetImage';

interface RecipeCardProps {
  recipe: RecipeConfig;
  journey?: JourneyProgress;
  progress?: CookingProgressState;
  compact?: boolean;
  onOpen: (recipe: RecipeConfig) => void;
}

export default function RecipeCard({ recipe, journey, progress, compact = false, onOpen }: RecipeCardProps) {
  const access = getRecipeAccess(recipe, progress);
  const locked = access.locked;
  const status = access.status;
  const statusClass = locked ? 'locked' : journey?.status ?? (access.playable ? 'playable' : 'preview');
  return <article className={`recipe-card${compact ? ' recipe-card--compact' : ''}${locked ? ' is-locked' : ''}`}>
    <button type="button" className="recipe-card__button" onClick={() => onOpen(recipe)} aria-label={`${recipe.name}: ${status}`}>
      <span className="recipe-card__visual">
        <CookingAssetImage className="recipe-card__art" src={recipe.image} alt="" />
        <span className={`recipe-card__status recipe-card__status--${statusClass}`}>
          {access.completed || journey?.status === 'completed' ? <Check size={14} /> : locked ? <LockKeyhole size={14} /> : access.playable ? <Play size={14} /> : null}
          {status}
        </span>
      </span>
      <span className="recipe-card__copy">
        <strong>{recipe.name}</strong>
        {locked && <small className="recipe-card__requirement">{access.requirement}</small>}
        <span className="recipe-card__meta">
          <span><Star size={14} />Niveau {recipe.level}</span>
          {recipe.preparationMinutes !== null && <span><Clock3 size={14} />{recipe.preparationMinutes} min</span>}
        </span>
      </span>
    </button>
  </article>;
}
