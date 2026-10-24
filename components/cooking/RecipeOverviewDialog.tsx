import React from 'react';
import { Clock3, LockKeyhole, MoreHorizontal, Play, RotateCcw, Star, Users } from 'lucide-react';
import { Button, Dialog } from '../../design-system';
import { EQUIPMENT_BY_ID, INGREDIENTS_BY_ID } from '../../data/cooking/catalog';
import type { CookingProgressState, JourneyProgress, RecipeConfig } from '../../data/cooking/types';
import { getRecipeAccess } from '../../data/cooking/availability';
import CookingAssetImage from './CookingAssetImage';

interface RecipeOverviewDialogProps {
  recipe: RecipeConfig | null;
  journey?: JourneyProgress;
  progress?: CookingProgressState;
  onClose: () => void;
  onStart: (recipe: RecipeConfig) => void;
  onReplay?: (recipe: RecipeConfig) => void;
  onRestart?: (recipe: RecipeConfig) => void;
}

export default function RecipeOverviewDialog({ recipe, journey, progress, onClose, onStart, onReplay, onRestart }: RecipeOverviewDialogProps) {
  if (!recipe) return null;
  const access = getRecipeAccess(recipe, progress);
  const playable = access.playable;
  const active = journey?.status === 'active';
  const completed = access.completed || journey?.status === 'completed';
  const canReplay = journey?.discovery.step === 'complete' && Boolean(onReplay);
  const primaryLabel = access.locked
    ? 'Nog vergrendeld'
    : !playable
      ? 'Binnenkort'
      : active ? 'Ga verder' : completed ? 'Opnieuw maken' : 'Start kookavontuur';

  return <Dialog
    className="recipe-dialog"
    open
    title={recipe.name}
    onClose={onClose}
    illustration={<CookingAssetImage src={recipe.image} alt={`Bereide ${recipe.name}`} />}
    primaryAction={<Button
      size="large"
      startIcon={access.locked ? <LockKeyhole size={20} /> : <Play size={20} />}
      disabled={!playable}
      onClick={() => onStart(recipe)}
    >{primaryLabel}</Button>}
    secondaryAction={<Button variant="quiet" onClick={onClose}>Sluiten</Button>}
  >
    {access.locked && <p className="recipe-overview__requirement"><LockKeyhole size={17} /> {access.requirement}</p>}
    <div className="recipe-overview__facts" aria-label="Receptinformatie">
      {recipe.preparationMinutes !== null && <span><Clock3 size={19} /><strong>{recipe.preparationMinutes} min</strong></span>}
      {recipe.servings !== null && <span><Users size={19} /><strong>{recipe.servings} porties</strong></span>}
      <span><Star size={19} /><small>Niveau</small><strong>{recipe.level}</strong></span>
    </div>

    {(recipe.ingredients.length > 0 || recipe.equipmentIds.length > 0) && <div className="recipe-overview__needs">
      {recipe.ingredients.length > 0 && <section className="recipe-overview__ingredients" aria-labelledby="recipe-ingredients-title">
        <h3 id="recipe-ingredients-title">Ingrediënten</h3>
        <ul>
          {recipe.ingredients.map(item => {
            const ingredient = INGREDIENTS_BY_ID[item.ingredientId];
            return <li key={item.ingredientId}>
              <CookingAssetImage src={ingredient?.image ?? ''} alt="" />
              <span><strong>{ingredient?.name ?? item.ingredientId}</strong><small>{item.displayAmount}</small></span>
            </li>;
          })}
        </ul>
      </section>}

      {recipe.equipmentIds.length > 0 && <section className="recipe-overview__equipment" aria-labelledby="recipe-equipment-title">
        <h3 id="recipe-equipment-title">Benodigdheden</h3>
        <ul>
          {recipe.equipmentIds.map(id => {
            const item = EQUIPMENT_BY_ID[id];
            return <li key={id}>
              <CookingAssetImage src={item?.image ?? ''} alt="" />
              <span>{item?.name ?? id}</span>
            </li>;
          })}
        </ul>
      </section>}
    </div>}
    {(canReplay || (playable && active && onRestart)) && <details className="journey-more recipe-overview__more">
      <summary aria-label="Meer opties"><MoreHorizontal /></summary>
      {canReplay && <button type="button" onClick={() => onReplay?.(recipe)}><RotateCcw size={17} />Ontdekken oefenen</button>}
      {playable && active && onRestart && <button type="button" onClick={() => onRestart(recipe)}><RotateCcw size={17} />Opnieuw beginnen</button>}
    </details>}
  </Dialog>;
}
