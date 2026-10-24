import React, { useMemo, useState } from 'react';
import { ChefHat } from 'lucide-react';
import RecipeCard from '../components/cooking/RecipeCard';
import RecipeOverviewDialog from '../components/cooking/RecipeOverviewDialog';
import IngredientDiscoveryFlow from '../components/cooking/IngredientDiscoveryFlow';
import MathChallengeFlow from '../components/cooking/MathChallengeFlow';
import JourneyStageProgress from '../components/cooking/JourneyStageProgress';
import ShopScreen from './ShopScreen';
import { RECIPES, RECIPE_CATEGORIES } from '../data/cooking/catalog';
import type { CookingProgressState, RecipeCategory, RecipeConfig } from '../data/cooking/types';
import { beginDiscoveryStage, createDiscoveryReplay, createMathReplay, loadCookingProgress, restartJourney, saveCookingProgress, startJourney } from '../services/cookingProgress';
import { COOKING_SESSION_KEY } from '../data/cooking/bananaPancakeCooking';
import { getRecipeAccess } from '../data/cooking/availability';

type ActiveCategory = 'all' | 'completed' | RecipeCategory;
type ReplayKind = 'discovery' | 'math';

interface CookbookScreenProps {
  onNavigate?: (path: string) => void;
}

export default function CookbookScreen({ onNavigate }: CookbookScreenProps) {
  const [category, setCategory] = useState<ActiveCategory>('all');
  const [selected, setSelected] = useState<RecipeConfig | null>(null);
  const [progress, setProgress] = useState<CookingProgressState>(() => loadCookingProgress());
  const [playingRecipeId, setPlayingRecipeId] = useState<RecipeConfig['id'] | null>(() =>
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('resume') === '1'
      ? progress.activeRecipeId
      : null,
  );
  const [replayProgress, setReplayProgress] = useState<CookingProgressState | null>(null);
  const [replayKind, setReplayKind] = useState<ReplayKind | null>(null);
  const recipes = useMemo(() => category === 'all' ? RECIPES : RECIPES.filter(recipe => category === 'completed' ? Boolean(progress.completions[recipe.id]) : recipe.category === category), [category, progress]);

  const handleStart = (recipe: RecipeConfig) => {
    if (!getRecipeAccess(recipe, progress).playable) return;
    const completed = progress.journeys[recipe.id]?.status === 'completed';
    const started = completed ? restartJourney(progress, recipe) : startJourney(progress, recipe);
    const next = beginDiscoveryStage(started, recipe.id);
    if (next !== progress) {
      saveCookingProgress(next);
      setProgress(next);
    }
    setSelected(null);
    setReplayProgress(null);
    setReplayKind(null);
    setPlayingRecipeId(recipe.id);
    if (completed && recipe.id === 'banana-pancakes') window.localStorage.removeItem(COOKING_SESSION_KEY);
  };

  const handleDiscoveryReplay = (recipe: RecipeConfig) => {
    const replay = createDiscoveryReplay(progress, recipe.id);
    if (replay === progress) return;
    setSelected(null);
    setReplayProgress(replay);
    setReplayKind('discovery');
    setPlayingRecipeId(recipe.id);
  };

  const handleRestart = (recipe: RecipeConfig) => {
    const restarted = beginDiscoveryStage(restartJourney(progress, recipe), recipe.id);
    if (restarted === progress) return;
    saveCookingProgress(restarted);
    if (recipe.id === 'banana-pancakes') window.localStorage.removeItem(COOKING_SESSION_KEY);
    setProgress(restarted);
    setSelected(null);
    setReplayProgress(null);
    setReplayKind(null);
    setPlayingRecipeId(recipe.id);
  };

  const handleMathReplay = (recipe: RecipeConfig) => {
    const replay = createMathReplay(progress, recipe.id);
    if (replay === progress) return;
    setSelected(null);
    setReplayProgress(replay);
    setReplayKind('math');
    setPlayingRecipeId(recipe.id);
  };

  const exitJourney = () => {
    setPlayingRecipeId(null);
    setReplayProgress(null);
    setReplayKind(null);
  };

  const playingRecipe = playingRecipeId ? RECIPES.find(recipe => recipe.id === playingRecipeId) : undefined;
  const activeProgress = replayProgress ?? progress;
  const playingJourney = playingRecipe ? activeProgress.journeys[playingRecipe.id] : undefined;
  if (playingRecipe && playingJourney?.stage === 'discovery') return <IngredientDiscoveryFlow
      recipe={playingRecipe}
      progress={activeProgress}
      onProgressChange={replayProgress ? setReplayProgress : setProgress}
      onExit={exitJourney}
      onReplay={() => handleDiscoveryReplay(playingRecipe)}
      replay={replayKind === 'discovery'}
    />;

  if (playingRecipe && playingJourney?.stage === 'challenges') return <MathChallengeFlow
      recipe={playingRecipe}
      progress={activeProgress}
      onProgressChange={replayProgress ? setReplayProgress : setProgress}
      onExit={exitJourney}
      onReplay={() => handleMathReplay(playingRecipe)}
      replay={replayKind === 'math'}
    />;

  if (playingRecipe && playingJourney?.stage === 'shopping') return <ShopScreen
    recipeId={playingRecipe.id}
    progress={activeProgress}
    onProgressChange={replayProgress ? setReplayProgress : setProgress}
    onExit={exitJourney}
    onNavigate={onNavigate}
  />;

  if (playingRecipe && playingJourney?.stage === 'cooking') return <main className="cooking-room cooking-coming-soon cooking-go-home">
    <img className="cooking-room__background" src="/assets/library/treehouse/rooms/kitchen-furnished.png" alt="De keuken in jouw eigen boomhut" />
    <section>
      <JourneyStageProgress journey={playingJourney} />
      <span aria-hidden="true"><ChefHat /></span>
      <h1>Naar jouw keuken</h1>
      <p>Alles staat klaar in je eigen boomhut.</p>
      <button type="button" onClick={() => onNavigate?.('/treehouse/kitchen')}>Ga naar de keuken</button>
    </section>
  </main>;

  return <main className="cooking-room">
    <img className="cooking-room__background" src="/assets/library/treehouse/rooms/kitchen-furnished.png" alt="De keuken in jouw eigen boomhut" />
    <section className="recipe-library" aria-labelledby="cooking-title">
      <div className="recipe-library__controls">
        <header className="recipe-library__header">
          <span aria-hidden="true"><ChefHat size={22} /></span>
          <div><small>Kies een recept</small><h1 id="cooking-title">Mijn Kookboek</h1></div>
        </header>
        <nav className="recipe-categories" aria-label="Receptcategorieën">
          {RECIPE_CATEGORIES.map(option => <button key={option.id} type="button" aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>{option.label}</button>)}
          <button type="button" aria-pressed={category === 'completed'} onClick={() => setCategory('completed')}>Gemaakt</button>
        </nav>
      </div>
      <div className="recipe-library__grid" role="list" aria-live="polite" aria-label={`${recipes.length} recepten`}>
        {recipes.map(recipe => <div role="listitem" key={recipe.id}><RecipeCard recipe={recipe} progress={progress} journey={progress.journeys[recipe.id]} onOpen={setSelected} /></div>)}
        {recipes.length === 0 && <p className="cookbook-filter-empty">Nog geen recepten gemaakt.</p>}
      </div>
    </section>
    <RecipeOverviewDialog recipe={selected} progress={progress} journey={selected ? progress.journeys[selected.id] : undefined} onClose={() => setSelected(null)} onStart={handleStart} onReplay={handleDiscoveryReplay} onRestart={handleRestart} />
  </main>;
}
