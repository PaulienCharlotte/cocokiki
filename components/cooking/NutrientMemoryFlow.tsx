import React, { useState } from 'react';
import type { CookingProgressState, RecipeConfig } from '../../data/cooking/types';
import { completeNutrientMemory, loadCookingProgress, saveCookingProgress } from '../../services/cookingProgress';
import JourneyStageProgress from './JourneyStageProgress';
import NutrientMemory from './NutrientMemory';

export default function NutrientMemoryFlow({ recipe, progress, onProgressChange, onExit, replay = false }: {
  recipe: RecipeConfig; progress: CookingProgressState; onProgressChange: (next: CookingProgressState) => void; onExit: () => void; replay?: boolean;
}) {
  const [error, setError] = useState(false);
  const config = recipe.education?.nutrientMemory;
  const finish = () => {
    if (replay) { onExit(); return; }
    const current = loadCookingProgress();
    const next = completeNutrientMemory(current, recipe.id, config!.activityId);
    if (!saveCookingProgress(next, undefined, { rewards: false })) { setError(true); return; }
    setError(false); onProgressChange(next);
  };
  return <main className="cooking-room nutrient-memory-screen"><section className="nutrient-memory-shell">
    <button className="cooking-chip" onClick={onExit}>Terug naar het kookboek</button>
    <JourneyStageProgress journey={progress.journeys[recipe.id]!} />
    <h1>Voedingsstoffenmemory</h1>
    {config ? <React.Fragment key={config.activityId}><NutrientMemory config={config} onComplete={finish} /></React.Fragment> : <p role="alert">Deze memory is nog niet beschikbaar.</p>}
    {error && <div role="alert"><p>Opslaan lukt even niet. Je voortgang en voorraad blijven bewaard.</p><button className="cooking-button" onClick={finish}>Probeer opnieuw</button></div>}
  </section></main>;
}
