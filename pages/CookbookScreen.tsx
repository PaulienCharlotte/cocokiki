import React, { useEffect, useMemo, useState } from 'react';
import { subscribeLocalState } from '../services/localState';
import { COOKING_PROGRESS_KEY } from '../services/cookingProgress';
import { ChefHat } from 'lucide-react';
import RecipeCard from '../components/cooking/RecipeCard';
import RecipeOverviewDialog from '../components/cooking/RecipeOverviewDialog';
import IngredientDiscoveryFlow from '../components/cooking/IngredientDiscoveryFlow';
import MathChallengeFlow from '../components/cooking/MathChallengeFlow';
import NutrientMemoryFlow from '../components/cooking/NutrientMemoryFlow';
import JourneyStageProgress from '../components/cooking/JourneyStageProgress';
import ShopScreen from './ShopScreen';
import { RECIPES, RECIPE_CATEGORIES } from '../data/cooking/catalog';
import type { CookingProgressState, RecipeCategory, RecipeConfig } from '../data/cooking/types';
import { beginDiscoveryStage, createDiscoveryReplay, createMathReplay, createMemoryReplay, loadCookingProgress, restartJourney, saveCookingProgress, startJourney } from '../services/cookingProgress';
import { getRecipeAccess } from '../data/cooking/availability';
import { getRecipeIssues } from '../data/cooking/validation';

type ActiveCategory = 'all' | 'completed' | 'preparing' | RecipeCategory;
type ReplayKind = 'discovery' | 'math' | 'memory';

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
  const [notice, setNotice] = useState('');
  useEffect(() => subscribeLocalState(() => setProgress(loadCookingProgress()), COOKING_PROGRESS_KEY), []);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    for (const recipe of RECIPES.filter(item => item.contentStatus === 'ready')) {
      const issues = getRecipeIssues(recipe);
      if (issues.length) console.warn(`Receptconfiguratie ${recipe.id}:`, issues);
    }
  }, []);
  const recipes = useMemo(() => category === 'all' ? RECIPES : RECIPES.filter(recipe => category === 'completed' ? Boolean(progress.completions[recipe.id]) : category === 'preparing' ? progress.journeys[recipe.id]?.stage === 'cooking' : recipe.category === category), [category, progress]);

  const handleStart = (recipe: RecipeConfig) => {
    if (!getRecipeAccess(recipe, progress).playable) return;
    const completed = progress.journeys[recipe.id]?.status === 'completed';
    const started = completed ? restartJourney(progress, recipe) : startJourney(progress, recipe);
    const next = beginDiscoveryStage(started, recipe.id);
    if (next !== progress) {
      if (!saveCookingProgress(next)) { setNotice('Opslaan lukt even niet. Je voortgang blijft bewaard. Probeer opnieuw.'); return; }
      setProgress(next);
    }
    setSelected(null);
    setReplayProgress(null);
    setReplayKind(null);
    setPlayingRecipeId(recipe.id);
    if (next.journeys[recipe.id]?.stage === 'cooking') onNavigate?.(`/treehouse/kitchen?recipe=${encodeURIComponent(recipe.id)}`);
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
    if (!saveCookingProgress(restarted)) { setNotice('Opslaan lukt even niet. Probeer opnieuw.'); return; }
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
  const handleMemoryReplay = (recipe: RecipeConfig) => {
    const replay = createMemoryReplay(progress, recipe.id);
    if (replay === progress) return;
    setSelected(null); setReplayProgress(replay); setReplayKind('memory'); setPlayingRecipeId(recipe.id);
  };

  const playingRecipe = playingRecipeId ? RECIPES.find(recipe => recipe.id === playingRecipeId) : undefined;
  const activeProgress = replayProgress ?? progress;
  const playingJourney = playingRecipe ? activeProgress.journeys[playingRecipe.id] : undefined;
  if (playingRecipe && playingJourney?.stage === 'nutrient-memory') return <NutrientMemoryFlow recipe={playingRecipe} progress={activeProgress} onProgressChange={setProgress} onExit={exitJourney} replay={replayKind === 'memory'} />;
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
    <img className="cooking-room__background" src="/assets/library/treehouse/rooms/kitchen-furnished.webp" alt="De keuken in jouw eigen boomhut" />
    <section>
      <JourneyStageProgress journey={playingJourney} />
      <span aria-hidden="true"><ChefHat /></span>
      <h1>Naar jouw keuken</h1>
      <p>Alles staat klaar in je eigen boomhut.</p>
      <button type="button" onClick={() => onNavigate?.('/treehouse/kitchen')}>Ga naar de keuken</button>
    </section>
  </main>;

  return <main className="cooking-room cookbook-library-room">
    <img className="cooking-room__background" src="/assets/library/treehouse/rooms/kitchen-furnished.webp" alt="De keuken in jouw eigen boomhut" />
    <section className="recipe-library" aria-labelledby="cooking-title">
      <h1 id="cooking-title" className="sr-only">Mijn Kookboek</h1>
        <nav className="recipe-categories recipe-library__filters" aria-label="Receptcategorieën">
          {RECIPE_CATEGORIES.map(option => <button key={option.id} type="button" aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>{option.label}</button>)}
          <button type="button" aria-pressed={category === 'completed'} onClick={() => setCategory('completed')}>Gemaakt</button>
          <button type="button" aria-pressed={category === 'preparing'} onClick={() => setCategory('preparing')}>Bereiden</button>
        </nav>
      <div className="recipe-library__grid" role="list" aria-live="polite" aria-label={`${recipes.length} recepten`}>
        {notice && <p role="alert">{notice}</p>}
        {recipes.map(recipe => <div role="listitem" key={recipe.id}><RecipeCard recipe={recipe} progress={progress} journey={progress.journeys[recipe.id]} onOpen={setSelected} /></div>)}
        {recipes.length === 0 && <p className="cookbook-filter-empty">Nog geen recepten gemaakt.</p>}
      </div>
    </section>
    <RecipeOverviewDialog recipe={selected} progress={progress} journey={selected ? progress.journeys[selected.id] : undefined} onClose={() => setSelected(null)} onStart={handleStart} onReplay={handleDiscoveryReplay} onRestart={handleRestart} onMemoryReplay={selected && createMemoryReplay(progress, selected.id) !== progress ? handleMemoryReplay : undefined} />
  </main>;
}
