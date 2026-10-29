import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, RotateCcw, SkipForward, Sparkles } from 'lucide-react';
import { Button, ProgressIndicator } from '../../design-system';
import { INGREDIENTS_BY_ID } from '../../data/cooking/catalog';
import { INGREDIENT_DISCOVERIES_BY_ID } from '../../data/cooking/discovery';
import type { CookingProgressState, RecipeConfig } from '../../data/cooking/types';
import {
  advanceJourney,
  answerDiscoveryQuestion,
  collectCurrentIngredient,
  saveCookingProgress,
  showDiscoveryQuestion,
  showIngredientCollection,
  skipKnownIngredient,
} from '../../services/cookingProgress';
import CookingAssetImage from './CookingAssetImage';
import IngredientDiscoveryCard from './IngredientDiscoveryCard';
import JourneyStageProgress from './JourneyStageProgress';
import RecipeOverviewDialog from './RecipeOverviewDialog';
import RewardToast from './RewardToast';
import { discoveryOptions } from '../../data/cooking/discoveryOptions';
import { nextRequiredStage } from '../../services/cookingProgress';

interface IngredientDiscoveryFlowProps {
  recipe: RecipeConfig;
  progress: CookingProgressState;
  onProgressChange: (progress: CookingProgressState) => void;
  onExit: () => void;
  onReplay?: () => void;
  replay?: boolean;
}

export default function IngredientDiscoveryFlow({ recipe, progress, onProgressChange, onExit, onReplay = onExit, replay = false }: IngredientDiscoveryFlowProps) {
  const [wrongAnswer, setWrongAnswer] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [toastCoins, setToastCoins] = useState(0);
  const [showRecipe, setShowRecipe] = useState(false);
  const [pendingSave, setPendingSave] = useState<CookingProgressState | null>(null);
  const cardRef = useRef<HTMLElement>(null);
  const journey = progress.journeys[recipe.id];
  const discovery = journey?.discovery;
  const ingredientId = discovery?.currentIngredientId ?? null;
  const config = ingredientId ? INGREDIENT_DISCOVERIES_BY_ID[ingredientId] : undefined;
  const ingredient = ingredientId ? INGREDIENTS_BY_ID[ingredientId] : undefined;
  const recipeIngredientIds = useMemo(() => recipe.ingredients.map(item => item.ingredientId), [recipe]);
  const completedCount = journey?.discoveredIngredientIds.length ?? 0;
  const alreadyCollected = Boolean(ingredientId && progress.discoveredIngredientIds.includes(ingredientId));

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cardRef.current?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [discovery?.step, ingredientId]);

  const commit = (next: CookingProgressState) => {
    if (!replay && !saveCookingProgress(next)) { setPendingSave(next); return false; }
    setPendingSave(null);
    onProgressChange(next);
    return true;
  };

  useEffect(() => {
    if (discovery?.step !== 'correct' || !ingredientId) return;
    const timer = window.setTimeout(() => {
      const collected = showIngredientCollection(progress, recipe.id);
      commit(collectCurrentIngredient(collected, recipe.id));
      setSelectedAnswer(null);
      setToastCoins(0);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [discovery?.step, ingredientId]);

  if (!journey) return null;
  if (pendingSave) return <main className="discovery-stage"><section className="discovery-card"><p role="alert">Opslaan lukt even niet. Je munten en voortgang blijven bewaard.</p><Button onClick={() => commit(pendingSave)}>Probeer opnieuw</Button><Button variant="quiet" onClick={onExit}>Terug</Button></section></main>;

  if (journey.stage === 'challenges') return <main className="discovery-stage">
    <img className="discovery-stage__background" src="/assets/library/treehouse/rooms/kitchen-furnished.webp" alt="" />
    <section className="discovery-card discovery-card--centered discovery-card--unavailable" aria-labelledby="next-stage-title">
      <JourneyStageProgress journey={journey} />
      <span className="discovery-card__success-icon" aria-hidden="true"><Check /></span>
      <h1 id="next-stage-title">Ontdekken voltooid</h1>
      <p>Je ontdekkingen zijn veilig bewaard.</p>
      <Button size="large" onClick={onExit}>Terug</Button>
    </section>
  </main>;

  if (journey.stage !== 'discovery' || !discovery) return null;

  if (discovery.step === 'complete') {
    const nextStage = nextRequiredStage(progress, recipe.id);
    const goToNext = () => replay ? onExit() : nextStage && commit(advanceJourney(progress, recipe.id, nextStage));
    return <main className="discovery-stage">
      <img className="discovery-stage__background" src="/assets/library/treehouse/rooms/kitchen-furnished.webp" alt="" />
      <section className="discovery-card discovery-card--completion" aria-labelledby="discovery-complete-title">
        <div className="discovery-stage__topbar"><Button variant="quiet" size="small" startIcon={<ArrowLeft size={18} />} onClick={onExit}>Stoppen</Button></div>
        <JourneyStageProgress journey={journey} />
        <span className="discovery-card__success-icon" aria-hidden="true"><Sparkles /></span>
        <h1 id="discovery-complete-title">Alle ingrediënten ontdekt!</h1>
        <div className="discovery-collected" aria-label="Verzamelde ingrediënten">
          {recipeIngredientIds.map(id => <span key={id}><CookingAssetImage src={INGREDIENTS_BY_ID[id]?.image ?? ''} alt={INGREDIENTS_BY_ID[id]?.name ?? id} /><small>{INGREDIENTS_BY_ID[id]?.name}</small></span>)}
        </div>
        <p className="stage-completion-status"><Check size={17} />Toegevoegd aan je encyclopedie</p>
        {replay && <small className="stage-completion-note"><Check size={15} />Beloning al ontvangen</small>}
        <Button size="large" onClick={goToNext}>{replay ? 'Klaar' : nextStage === 'nutrient-memory' ? 'Voedingsstoffenmemory' : 'Verder met rekenen'}</Button>
        <div className="discovery-secondary-actions">
          <a className="discovery-skip" href="/treehouse/encyclopedia"><BookOpen size={16} />Bekijk encyclopedie</a>
        </div>
      </section>
    </main>;
  }

  if (!config || !ingredient || !config.questions[discovery.questionIndex]) return <main className="discovery-stage"><section className="discovery-card"><h1>Dit recept is nog niet helemaal klaar</h1><p>Je voortgang blijft bewaard.</p><Button onClick={onExit}>Terug naar het kookboek</Button></section></main>;
  const question = config.questions[discovery.questionIndex];
  const progressValue = Math.min(recipeIngredientIds.length, completedCount + (discovery.step === 'collection' ? 1 : 0));

  const answer = (optionId: string) => {
    const result = answerDiscoveryQuestion(progress, recipe.id, optionId);
    if (!commit(result.progress)) return;
    if (!result.correct) {
      setWrongAnswer(optionId);
      return;
    }
    setWrongAnswer(null);
    setSelectedAnswer(optionId);
    setToastCoins(result.coinDelta);
  };

  const skip = () => {
    if (!commit(skipKnownIngredient(progress, recipe.id))) return;
    setWrongAnswer(null);
    setSelectedAnswer(null);
    setToastCoins(0);
  };

  return <main className="discovery-stage">
    <img className="discovery-stage__background" src="/assets/library/treehouse/rooms/kitchen-furnished.webp" alt="" />
    <section ref={cardRef} className={`discovery-card discovery-card--${discovery.step}`} aria-labelledby="discovery-title">
      <div className="stage-chrome">
        <div className="discovery-stage__topbar">
          <Button variant="quiet" size="small" startIcon={<ArrowLeft size={18} />} onClick={onExit}>Stoppen</Button>
          <button type="button" className="discovery-recipe-link" onClick={() => setShowRecipe(true)}><BookOpen size={17} />Bekijk recept</button>
        </div>
        <JourneyStageProgress journey={journey} />
        <ProgressIndicator label="Ontdekt" value={progressValue} max={recipeIngredientIds.length} />
      </div>

      <div className="discovery-card__content" key={`${ingredientId}-${discovery.step}`}>
        {discovery.step === 'learn' && <>
          {alreadyCollected && <span className="discovery-collected-badge"><Check size={16} />Al verzameld</span>}
          <IngredientDiscoveryCard config={config} ingredient={ingredient} />
          <Button size="large" onClick={() => commit(showDiscoveryQuestion(progress, recipe.id))}>{alreadyCollected ? 'Bekijk de vraag' : 'Naar de vraag'}</Button>
        </>}

        {(discovery.step === 'question' || discovery.step === 'correct') && <>
          <CookingAssetImage className="discovery-card__ingredient" src={ingredient.image} alt={ingredient.name} />
          <p className="discovery-card__eyebrow">{ingredient.name} · vraag {completedCount + 1} van {recipeIngredientIds.length}</p>
          <h1 id="discovery-title">{question.prompt}</h1>
          <div className="discovery-options" aria-busy={discovery.step === 'correct'}>
            {discoveryOptions(question, journey.startedAt, completedCount + discovery.questionIndex).map((option, index) => <button
              type="button"
              key={option.id}
              disabled={discovery.step === 'correct'}
              className={`${wrongAnswer === option.id ? 'is-wrong' : ''}${selectedAnswer === option.id ? ' is-correct' : ''}`}
              onClick={() => answer(option.id)}
            ><span>{String.fromCharCode(65 + index)}</span>{option.label}</button>)}
          </div>
          {wrongAnswer && <div className="discovery-feedback discovery-feedback--wrong" role="alert"><RotateCcw size={20} /><span><strong>Nog niet.</strong> {config.educationalText}</span></div>}
          {discovery.step === 'correct' && <RewardToast message={`${config.collectionLabel} ontdekt`} coins={toastCoins} />}
        </>}
        {alreadyCollected && (discovery.step === 'learn' || discovery.step === 'question') && <Button variant="quiet" startIcon={<SkipForward size={18} />} onClick={skip}>Ingrediënt overslaan</Button>}
      </div>
    </section>
    <RecipeOverviewDialog recipe={showRecipe ? recipe : null} progress={progress} journey={journey} onClose={() => setShowRecipe(false)} onStart={() => setShowRecipe(false)} onReplay={replay ? undefined : () => onReplay()} />
  </main>;
}
