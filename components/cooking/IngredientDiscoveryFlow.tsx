import { rewardAnswer } from '../../services/answerRewards';
import { learningReward } from '../../services/learningReward';
import './bakkerij-stijl.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, SkipForward, Sparkles } from 'lucide-react';
import { Button, IconButton } from '../../design-system';
import { registerBackHandler } from '../../services/navigationGuard';
import { INGREDIENTS_BY_ID } from '../../data/cooking/catalog';
import { INGREDIENT_DISCOVERIES_BY_ID } from '../../data/cooking/discovery';
import type { CookingProgressState, DiscoveryQuestion, IngredientDiscoveryConfig, RecipeConfig } from '../../data/cooking/types';
import {
  advanceJourney,
  answerDiscoveryQuestion,
  collectCurrentIngredient,
  saveCookingProgress, saveCookingProgressFresh,
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
import SpeechBubble from '../ui/SpeechBubble';
import ChoiceList from '../ui/ChoiceList';

interface IngredientDiscoveryFlowProps {
  recipe: RecipeConfig;
  progress: CookingProgressState;
  onProgressChange: (progress: CookingProgressState) => void;
  onExit: () => void;
  onReplay?: () => void;
  replay?: boolean;
}

/** Eén korte gedachte voor de spraakwolk: de eerste zin, hooguit ~130 tekens (max. 2 regels). */
export function kortVoorWolk(tekst: string): string {
  const schoon = tekst.replace(/\s+/g, ' ').trim();
  const zin = schoon.match(/^.*?[.!?](?=\s|$)/)?.[0] ?? schoon;
  return zin.length <= 130 ? zin : `${zin.slice(0, 127).replace(/\s+\S*$/, '')}…`;
}

/** Wat Coco vertelt vóór de vraag: het weetje dat bij het leerdoel van de vraag hoort. */
export function uitlegVoorVraag(config: IngredientDiscoveryConfig, question: DiscoveryQuestion): string {
  const voeding = config.nutrition[0];
  const bron = question.learningGoal === 'nutrition' && voeding ? `${voeding.nutrient}: ${voeding.role}`
    : question.learningGoal === 'origin' || question.learningGoal === 'source' || question.learningGoal === 'geography' ? config.origin.text
    : config.foodKnowledge.text || config.heroFact;
  return kortVoorWolk(bron || config.heroFact);
}

export default function IngredientDiscoveryFlow({ recipe, progress, onProgressChange, onExit, onReplay = onExit, replay = false }: IngredientDiscoveryFlowProps) {
  // De terugknop linksboven gaat één laag terug: naar het kookboek (huisstijl: één terugknop).
  const exitRef = useRef(onExit); exitRef.current = onExit;
  useEffect(() => registerBackHandler(() => exitRef.current()), []);
  // Eerst vertelt Coco iets, dan pas de vraag (wens 4 uit de briefing).
  const [naarVraag, setNaarVraag] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
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
    if (discovery?.step === 'correct') return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cardRef.current?.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  }, [discovery?.step, ingredientId, reviewing]);

  const commit = (next: CookingProgressState) => {
    if (!replay && !saveCookingProgressFresh(next)) { setPendingSave(next); return false; }
    setPendingSave(null);
    onProgressChange(next);
    return true;
  };

  useEffect(() => {
    setNaarVraag(false);
    setWrongAnswer(null);
    setReviewing(false);
    setToastCoins(0);
  }, [ingredientId, discovery?.questionIndex]);

  useEffect(() => {
    if (discovery?.step === 'learn' && !pendingSave) commit(showDiscoveryQuestion(progress, recipe.id));
  }, [discovery?.step, ingredientId, pendingSave]);

  // Goed antwoord: Coco reageert in de wolk, munten vliegen, en het spel gaat vanzelf verder.
  const verderRef = useRef<() => void>(() => undefined);
  useEffect(() => {
    if (discovery?.step !== 'correct') return;
    const timer = window.setTimeout(() => verderRef.current(), 2600);
    return () => window.clearTimeout(timer);
  }, [discovery?.step, ingredientId, discovery?.questionIndex]);

  if (!journey) return null;
  if (pendingSave) return <main className="bakkerij-stijl discovery-stage"><section className="discovery-card"><p role="alert">Opslaan lukt even niet. Je munten en voortgang blijven bewaard.</p><Button onClick={() => commit(pendingSave)}>Probeer opnieuw</Button><Button variant="quiet" onClick={onExit}>Terug</Button></section></main>;

  if (journey.stage === 'challenges') return <main className="bakkerij-stijl discovery-stage">
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
  return <main className="bakkerij-stijl discovery-stage">
      <img className="discovery-stage__background" src="/assets/library/treehouse/rooms/kitchen-furnished.webp" alt="" />
      <section className="discovery-card discovery-card--completion" aria-labelledby="discovery-complete-title">
        <div className="discovery-stage__topbar"><IconButton label="Terug naar het kookboek" icon={<ArrowLeft size={19} />} onClick={onExit} /></div>
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

  if (!config || !ingredient || !config.questions[discovery.questionIndex]) return <main className="bakkerij-stijl discovery-stage"><section className="discovery-card"><h1>Dit recept is nog niet helemaal klaar</h1><p>Je voortgang blijft bewaard.</p><Button onClick={onExit}>Terug naar het kookboek</Button></section></main>;
  const question = config.questions[discovery.questionIndex];
  const progressValue = Math.min(recipeIngredientIds.length, completedCount + (discovery.step === 'collection' ? 1 : 0));

  const answer = (optionId: string) => {
    const result = answerDiscoveryQuestion(progress, recipe.id, optionId);
    if (!commit(result.progress)) return;
    if (!result.correct) {
      setWrongAnswer(optionId);
      return;
    }
    if (result.coinDelta === 0) rewardAnswer('ingredient-discovery', `${recipe.id}:${journey.startedAt}`, `${ingredient.id}:${question.id}`, learningReward());
    setWrongAnswer(null);
    setToastCoins(result.coinDelta);
  };

  const continueDiscovery = () => {
    setWrongAnswer(null);
    commit(collectCurrentIngredient(showIngredientCollection(progress, recipe.id), recipe.id));
  };
  verderRef.current = continueDiscovery;
  const uitleg = uitlegVoorVraag(config, question);
  const toonUitleg = discovery.step === 'question' && !naarVraag && !wrongAnswer;
  const wolk = discovery.step === 'correct' ? `Goed! ${kortVoorWolk(question.feedbackExplanation)}`
    : wrongAnswer ? `Bijna. ${uitleg}`
    : toonUitleg ? uitleg
    : question.prompt;

  const skip = () => {
    if (!commit(skipKnownIngredient(progress, recipe.id))) return;
    setWrongAnswer(null);
    setToastCoins(0);
  };

  return <main className="bakkerij-stijl discovery-stage">
    <img className="discovery-stage__background" src="/assets/library/treehouse/rooms/kitchen-furnished.webp" alt="" />
    <section ref={cardRef} className={`discovery-card discovery-card--${discovery.step}`} aria-labelledby="discovery-title">
      <div className="stage-chrome">
        <div className="discovery-stage__topbar">
          <button type="button" className="discovery-recipe-link" onClick={() => setShowRecipe(true)}><BookOpen size={17} />Bekijk recept</button>
        </div>
        <JourneyStageProgress journey={journey} />
        {/* Voortgang als bolletjes, niet als "0/9" (huisstijl). */}
        <span className="discovery-stippen" role="img" aria-label={`Ontdekt: ${progressValue} van ${recipeIngredientIds.length}`}>{recipeIngredientIds.map((id, i) => <span key={id} className={`ck-stip${i < progressValue ? ' ck-stip--klaar' : ''}${i === progressValue ? ' ck-stip--nu' : ''}`} />)}</span>
      </div>

      <div className="discovery-card__content" key={`${ingredientId}-${discovery.step}`}>
        {(discovery.step === 'learn' || reviewing) && <>
          {alreadyCollected && <span className="discovery-collected-badge"><Check size={16} />Al verzameld</span>}
          {reviewing && <Button variant="quiet" onClick={() => setReviewing(false)}>Terug naar de vraag</Button>}
          <IngredientDiscoveryCard key={ingredientId} config={config} ingredient={ingredient} initialPage={reviewing && question.learningGoal === 'nutrition' ? 1 : 0} onReady={() => {
            setReviewing(false); setWrongAnswer(null);
            if (discovery.step === 'learn') commit(showDiscoveryQuestion(progress, recipe.id));
          }} />
        </>}

        {!reviewing && (discovery.step === 'question' || discovery.step === 'correct') && <>
          <CookingAssetImage className="discovery-card__ingredient" src={ingredient.image} alt={ingredient.name} />
          <p className="discovery-card__eyebrow">{ingredient.name}</p>
          <SpeechBubble character="coco" label={toonUitleg ? 'Wist je dat' : 'Denk mee'} textId="discovery-title" tone={discovery.step === 'correct' ? 'goed' : 'default'} vast>{wolk}</SpeechBubble>
          {toonUitleg
            ? <div className="discovery-question-actions"><Button size="large" onClick={() => setNaarVraag(true)}>Naar de vraag</Button></div>
            : <>
              {wrongAnswer && <p className="discovery-vraag-herhaling">{question.prompt}</p>}
              <ChoiceList vorm="los" label="Kies je antwoord" disabled={discovery.step === 'correct'} onChoose={answer}
                choices={discoveryOptions(question, journey.startedAt, completedCount + discovery.questionIndex).map(option => ({
                  id: option.id, label: option.label,
                  staat: wrongAnswer === option.id ? 'mis' : discovery.step === 'correct' && question.correctOptionId === option.id ? 'goed' : undefined,
                }))} />
              {discovery.step === 'correct' && toastCoins > 0 && <RewardToast message={`${config.collectionLabel} ontdekt`} coins={toastCoins} />}
            </>}
        </>}
        {alreadyCollected && (discovery.step === 'learn' || discovery.step === 'question') && <Button variant="quiet" startIcon={<SkipForward size={18} />} onClick={skip}>Ingrediënt overslaan</Button>}
      </div>
    </section>
    <RecipeOverviewDialog recipe={showRecipe ? recipe : null} progress={progress} journey={journey} onClose={() => setShowRecipe(false)} onStart={() => setShowRecipe(false)} onReplay={replay ? undefined : () => onReplay()} />
  </main>;
}
