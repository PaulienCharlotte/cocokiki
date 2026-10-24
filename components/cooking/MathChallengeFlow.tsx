import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, Minus, MoreHorizontal, Plus, RotateCcw, ShoppingBasket, Sparkles } from 'lucide-react';
import { Button } from '../../design-system';
import { EQUIPMENT_BY_ID, INGREDIENTS_BY_ID } from '../../data/cooking/catalog';
import { MATH_CHALLENGES_BY_RECIPE } from '../../data/cooking/mathChallenges';
import type { CookingProgressState, MathChallengeConfig, RecipeConfig } from '../../data/cooking/types';
import {
  advanceJourney,
  continueMathChallenges,
  saveCookingProgress,
  startMathChallenges,
  submitMathChallenge,
  type MathChallengeAnswer,
} from '../../services/cookingProgress';
import { awardCurrencyOnce } from '../../services/currency';
import CookingAssetImage from './CookingAssetImage';
import DigitalScale from './DigitalScale';
import JourneyStageProgress from './JourneyStageProgress';
import RewardToast from './RewardToast';

interface MathChallengeFlowProps {
  recipe: RecipeConfig;
  progress: CookingProgressState;
  onProgressChange: (progress: CookingProgressState) => void;
  onExit: () => void;
  onReplay?: () => void;
  replay?: boolean;
}

function assetFor(id: string) {
  return INGREDIENTS_BY_ID[id]?.image ?? EQUIPMENT_BY_ID[id]?.image ?? '';
}

function Stepper({ value, step, minimum = 0, maximum = 100, onChange, label }: { value: number; step: number; minimum?: number; maximum?: number; onChange: (value: number) => void; label: string }) {
  return <div className="math-stepper" aria-label={label}>
    <button type="button" aria-label={`${label} verminderen`} onClick={() => onChange(Math.max(minimum, value - step))}><Minus /></button>
    <strong aria-live="polite">{value}</strong>
    <button type="button" aria-label={`${label} vermeerderen`} onClick={() => onChange(Math.min(maximum, value + step))}><Plus /></button>
  </div>;
}

export default function MathChallengeFlow({ recipe, progress, onProgressChange, onExit, onReplay = onExit, replay = false }: MathChallengeFlowProps) {
  const journey = progress.journeys[recipe.id];
  const math = journey?.math;
  const challenges = MATH_CHALLENGES_BY_RECIPE[recipe.id];
  const challenge = math ? challenges[math.currentChallengeIndex] : undefined;
  const [quantity, setQuantity] = useState(0);
  const [scaled, setScaled] = useState<Record<string, number>>({});
  const [weight, setWeight] = useState(0);
  const [order, setOrder] = useState<string[]>([]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    if (!challenge) return;
    setHint(null);
    setSelectedStep(null);
    if (challenge.type === 'quantity-selection') setQuantity(challenge.baseQuantity);
    if (challenge.type === 'recipe-scaling') setScaled(Object.fromEntries(challenge.quantities.map(item => [item.ingredientId, item.base])));
    if (challenge.type === 'interactive-weighing') setWeight(0);
    if (challenge.type === 'sequence-ordering') setOrder([...challenge.initialOrder]);
  }, [challenge?.id]);

  const commit = (next: CookingProgressState) => {
    if (!replay) saveCookingProgress(next);
    onProgressChange(next);
  };

  useEffect(() => {
    if (!journey || journey.stage !== 'challenges') return;
    if (math.step === 'intro') {
      commit(startMathChallenges(progress, recipe.id));
      return;
    }
    if (math.step !== 'feedback') return;
    const timer = window.setTimeout(() => {
      const result = continueMathChallenges(progress, recipe.id);
      commit(result.progress);
      if (result.coinDelta > 0) awardCurrencyOnce(`cooking-math:${recipe.id}:complete`, result.coinDelta);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [journey?.stage, math.step, math.currentChallengeIndex]);

  if (!journey || !math) return null;

  if (journey.stage === 'shopping') return <MathShell journey={journey}>
    <section className="math-card math-card--centered" aria-labelledby="shopping-unavailable-title">
      <span className="math-success-icon" aria-hidden="true"><ShoppingBasket /></span>
      <h1 id="shopping-unavailable-title">De winkelopdracht komt later</h1>
      <p>Je rekenvoortgang en beloningen zijn bewaard.</p>
      <Button size="large" onClick={onExit}>Terug</Button>
      <button className="math-link" type="button" onClick={onReplay}><RotateCcw />Opnieuw spelen</button>
    </section>
  </MathShell>;

  if (journey.stage !== 'challenges') return null;

  if (math.step === 'intro') return <MathShell journey={journey}><span className="journey-loading" role="status">Opdrachten klaarzetten…</span></MathShell>;

  if (math.step === 'complete') {
    const goToShop = () => replay ? onExit() : commit(advanceJourney(progress, recipe.id, 'shopping'));
    return <MathShell journey={journey}>
      <section className="math-card math-card--complete" aria-labelledby="math-complete-title">
        <span className="math-success-icon" aria-hidden="true"><Sparkles /></span>
        <h1 id="math-complete-title">Goed gedaan, chef!</h1>
        <CookingAssetImage className="math-complete__dish" src={recipe.image} alt={recipe.name} />
        <div className="math-complete__checks" aria-label="Vier opdrachten voltooid">
          {challenges.map(item => <span key={item.id}><Check />{item.title}</span>)}
        </div>
        <p className="stage-completion-status"><Check />Vier opdrachten voltooid</p>
        {replay && <small className="stage-completion-note"><Check />Beloning al ontvangen</small>}
        <Button size="large" onClick={goToShop}>{replay ? 'Klaar' : 'Naar de winkel'}</Button>
        {!replay && <details className="journey-more"><summary aria-label="Meer opties"><MoreHorizontal /></summary><button type="button" onClick={onReplay}><RotateCcw />Opnieuw oefenen</button></details>}
      </section>
    </MathShell>;
  }

  if (!challenge) return null;
  const submit = (answer: MathChallengeAnswer) => {
    const result = submitMathChallenge(progress, recipe.id, answer);
    commit(result.progress);
    setHint(result.correct ? null : result.hint ?? 'Probeer het nog eens!');
    if (result.coinDelta > 0) awardCurrencyOnce(`cooking-math:${recipe.id}:${challenge.id}`, result.coinDelta);
  };
  return <MathShell journey={journey} progress={`${math.currentChallengeIndex + 1} van ${challenges.length}`} onExit={onExit}>
    <section className={`math-card${math.step === 'feedback' ? ' is-success' : ''}`} aria-labelledby="math-challenge-title" aria-busy={math.step === 'feedback'}>
      <h1 id="math-challenge-title">{challenge.title}</h1>
      {challenge.type !== 'recipe-scaling' && <p className="math-instruction">{challenge.instruction}</p>}
      <ChallengeInteraction
        challenge={challenge}
        quantity={quantity} setQuantity={setQuantity}
        scaled={scaled} setScaled={setScaled}
        weight={weight} setWeight={setWeight}
        order={order} setOrder={setOrder}
        selectedStep={selectedStep} setSelectedStep={setSelectedStep}
        draggedStep={draggedStep} setDraggedStep={setDraggedStep}
        hint={hint}
      />
      {hint && <div className="math-hint" role="alert">{hint}</div>}
      {math.step === 'feedback'
        ? <RewardToast message={challenge.successFeedback} coins={replay ? 0 : challenge.rewardCoins} />
        : <Button size="large" onClick={() => submit(challenge.type === 'quantity-selection' ? quantity : challenge.type === 'recipe-scaling' ? scaled : challenge.type === 'interactive-weighing' ? weight : order)}>Controleer</Button>}
    </section>
  </MathShell>;
}

function MathShell({ journey, progress, onExit, children }: { journey: NonNullable<CookingProgressState['journeys'][RecipeConfig['id']]>; progress?: string; onExit?: () => void; children: React.ReactNode }) {
  return <main className="math-stage">
    <img className="math-stage__background" src="/assets/library/treehouse/rooms/kitchen.png" alt="" />
    <div className="math-stage__frame">
      {(onExit || progress) && <header className="math-stage__topbar">
        {onExit ? <button type="button" onClick={onExit}><ArrowLeft />Stoppen</button> : <span />}
        {progress && <strong>{progress}</strong>}
      </header>}
      <JourneyStageProgress journey={journey} />
      {children}
    </div>
  </main>;
}

interface InteractionProps {
  challenge: MathChallengeConfig;
  quantity: number; setQuantity: (value: number) => void;
  scaled: Record<string, number>; setScaled: (value: Record<string, number>) => void;
  weight: number; setWeight: (value: number) => void;
  order: string[]; setOrder: (value: string[]) => void;
  selectedStep: string | null; setSelectedStep: (value: string | null) => void;
  draggedStep: string | null; setDraggedStep: (value: string | null) => void;
  hint: string | null;
}

function ChallengeInteraction(props: InteractionProps) {
  const { challenge } = props;
  if (challenge.type === 'quantity-selection') return <div className="math-quantity">
    <CookingAssetImage src={assetFor(challenge.ingredientId)} alt="Eieren" />
    <Stepper value={props.quantity} step={1} maximum={challenge.maximum} minimum={challenge.minimum} onChange={props.setQuantity} label="Aantal eieren" />
    <span>eieren</span>
  </div>;

  if (challenge.type === 'recipe-scaling') return <div className="math-scaling">
    <div className="math-scaling__reference"><span>2 porties</span><strong>→</strong><span>4 porties</span></div>
    {challenge.quantities.map(item => <div className="math-scaling__row" key={item.ingredientId}>
      <CookingAssetImage src={assetFor(item.ingredientId)} alt={INGREDIENTS_BY_ID[item.ingredientId]?.name ?? item.ingredientId} />
      <strong>{INGREDIENTS_BY_ID[item.ingredientId]?.name}</strong>
      <Stepper value={props.scaled[item.ingredientId] ?? item.base} step={item.step} maximum={item.target * 2} onChange={value => props.setScaled({ ...props.scaled, [item.ingredientId]: value })} label={INGREDIENTS_BY_ID[item.ingredientId]?.name ?? item.ingredientId} />
      <b>{item.unit}</b>
    </div>)}
  </div>;

  if (challenge.type === 'interactive-weighing') return <div className="math-weighing"><DigitalScale
    bowlImage={assetFor('bowl')}
    ingredientImage={assetFor(challenge.ingredientId)}
    value={props.weight}
    target={challenge.targetGrams}
    increments={challenge.increments}
    onChange={props.setWeight}
  /></div>;

  const actions = Object.fromEntries(challenge.actions.map(action => [action.id, action]));
  const move = (id: string, direction: -1 | 1) => {
    const index = props.order.indexOf(id);
    const target = index + direction;
    if (target < 0 || target >= props.order.length) return;
    const next = [...props.order];
    [next[index], next[target]] = [next[target], next[index]];
    props.setOrder(next);
  };
  const swapSelected = (id: string) => {
    if (!props.selectedStep) return props.setSelectedStep(id);
    if (props.selectedStep === id) return props.setSelectedStep(null);
    const next = [...props.order];
    const first = next.indexOf(props.selectedStep);
    const second = next.indexOf(id);
    [next[first], next[second]] = [next[second], next[first]];
    props.setOrder(next);
    props.setSelectedStep(null);
  };
  const hintedIndex = Number(props.hint?.match(/stap (\d+)/)?.[1] ?? 0) - 1;
  return <ol className="math-sequence" aria-label="Bereidingsstappen in gekozen volgorde">
    {props.order.map((id, index) => <li
      key={id}
      draggable
      className={`${props.selectedStep === id ? 'is-selected' : ''}${hintedIndex === index ? ' is-hinted' : ''}`}
      onDragStart={() => props.setDraggedStep(id)}
      onDragOver={event => event.preventDefault()}
      onDrop={() => {
        if (!props.draggedStep || props.draggedStep === id) return;
        const next = [...props.order];
        const from = next.indexOf(props.draggedStep);
        const to = next.indexOf(id);
        next.splice(to, 0, next.splice(from, 1)[0]);
        props.setOrder(next);
        props.setDraggedStep(null);
      }}
    >
      <span>{index + 1}</span>
      <button className="math-sequence__select" type="button" aria-pressed={props.selectedStep === id} onClick={() => swapSelected(id)}>
        <CookingAssetImage src={assetFor(actions[id].assetId)} alt="" />
        <strong>{actions[id].label}</strong>
      </button>
      <span className="math-sequence__move">
        <button type="button" aria-label={`${actions[id].label} omhoog`} disabled={index === 0} onClick={() => move(id, -1)}><ArrowUp /></button>
        <button type="button" aria-label={`${actions[id].label} omlaag`} disabled={index === props.order.length - 1} onClick={() => move(id, 1)}><ArrowDown /></button>
      </span>
    </li>)}
  </ol>;
}
