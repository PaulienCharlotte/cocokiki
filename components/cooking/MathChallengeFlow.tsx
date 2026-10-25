import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, Minus, MoreHorizontal, Plus, RotateCcw, ShoppingBasket } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../design-system';
import { EQUIPMENT_BY_ID, INGREDIENTS_BY_ID } from '../../data/cooking/catalog';
import type { CookingProgressState, MathChallengeConfig, RecipeConfig } from '../../data/cooking/types';
import {
  advanceJourney,
  continueMathChallenges,
  saveCookingProgress,
  startMathChallenges,
  submitMathChallenge,
  type MathChallengeAnswer,
} from '../../services/cookingProgress';
import Confetti from './Confetti';
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

/** Alleen gewicht en inhoud krijgen een eenheid; losse stuks spreken voor zich. */
function unitSuffix(unit: string): string | undefined {
  return unit === 'stuks' || unit === 'stuk' ? undefined : unit;
}

/**
 * De knoppen geven een richting door in plaats van een uitkomst. Zo telt elke
 * tik mee, ook wanneer een kind sneller tikt dan het scherm bijwerkt.
 */
function Stepper({ value, step, minimum = 0, maximum = 100, onStep, label, unit }: { value: number; step: number; minimum?: number; maximum?: number; onStep: (next: (current: number) => number) => void; label: string; unit?: string }) {
  const clamp = (current: number, direction: -1 | 1) => Math.min(maximum, Math.max(minimum, current + direction * step));
  return <div className="math-stepper" aria-label={label}>
    <button type="button" aria-label={`${label} verminderen`} onClick={() => onStep(current => clamp(current, -1))}><Minus /></button>
    <strong aria-live="polite">{value}{unit && <em>{unit}</em>}</strong>
    <button type="button" aria-label={`${label} vermeerderen`} onClick={() => onStep(current => clamp(current, 1))}><Plus /></button>
  </div>;
}

export default function MathChallengeFlow({ recipe, progress, onProgressChange, onExit, onReplay = onExit, replay = false }: MathChallengeFlowProps) {
  const journey = progress.journeys[recipe.id];
  const math = journey?.math;
  const challenges = recipe.education?.math ?? [];
  const challenge = math ? challenges[math.currentChallengeIndex] : undefined;
  const [quantity, setQuantity] = useState(0);
  const [scaled, setScaled] = useState<Record<string, number>>({});
  const [weight, setWeight] = useState(0);
  const [order, setOrder] = useState<string[]>([]);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [toastCoins, setToastCoins] = useState(0);
  const [pendingSave, setPendingSave] = useState<CookingProgressState | null>(null);
  const initializedIntro = useRef<string | null>(null);

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
    if (!replay && !saveCookingProgress(next)) { setPendingSave(next); return false; }
    setPendingSave(null);
    onProgressChange(next);
    return true;
  };

  useEffect(() => {
    if (!journey || journey.stage !== 'challenges') return;
    if (math.step === 'intro') {
      const key = `${recipe.id}:${progress.revision ?? 0}`;
      if (initializedIntro.current === key) return;
      initializedIntro.current = key;
      commit(startMathChallenges(progress, recipe.id));
      return;
    }
    if (math.step !== 'feedback') return;
    const timer = window.setTimeout(() => {
      const result = continueMathChallenges(progress, recipe.id);
      commit(result.progress);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [journey?.stage, math.step, math.currentChallengeIndex]);

  if (!journey || !math) return null;
  if (pendingSave) return <MathShell journey={journey} onExit={onExit}><section className="math-card"><p role="alert">Opslaan lukt even niet. Je munten en voortgang blijven bewaard.</p><Button onClick={() => commit(pendingSave)}>Probeer opnieuw</Button></section></MathShell>;
  if (!challenges.length) return <MathShell journey={journey} onExit={onExit}><section className="math-card"><h1>Dit recept is nog niet helemaal klaar</h1><Button onClick={onExit}>Terug naar het kookboek</Button></section></MathShell>;

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
      <section className="math-card math-card--complete celebration-card" aria-labelledby="math-complete-title">
        <div className="celebration-card__stage">
          <Confetti />
          <motion.div
            className="celebration-card__dish"
            initial={{ scale: .72, y: 14 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          >
            <CookingAssetImage src={recipe.image} alt={recipe.name} />
          </motion.div>
        </div>
        <h1 id="math-complete-title">Goed gedaan, chef!</h1>
        {replay && <small className="stage-completion-note"><Check />Beloning al ontvangen</small>}
        <Button size="large" onClick={goToShop}>{replay ? 'Klaar' : 'Naar de winkel'}</Button>
        {!replay && <details className="journey-more"><summary aria-label="Meer opties"><MoreHorizontal /></summary><button type="button" onClick={onReplay}><RotateCcw />Opnieuw oefenen</button></details>}
      </section>
    </MathShell>;
  }

  if (!challenge) return <MathShell journey={journey} onExit={onExit}><section className="math-card"><h1>Deze opdracht is nog niet beschikbaar</h1><p>Je voortgang blijft bewaard.</p><Button onClick={onExit}>Terug naar het kookboek</Button></section></MathShell>;
  const submit = (answer: MathChallengeAnswer) => {
    const result = submitMathChallenge(progress, recipe.id, answer);
    if (!commit(result.progress)) return;
    setToastCoins(replay ? 0 : result.coinDelta);
    setHint(result.correct ? null : result.hint ?? 'Probeer het nog eens!');
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
        ? <RewardToast message={challenge.successFeedback} coins={toastCoins} />
        : <Button size="large" onClick={() => submit(challenge.type === 'quantity-selection' ? quantity : challenge.type === 'recipe-scaling' ? scaled : challenge.type === 'interactive-weighing' ? weight : order)}>Controleer</Button>}
    </section>
  </MathShell>;
}

function MathShell({ journey, progress, onExit, children }: { journey: NonNullable<CookingProgressState['journeys'][RecipeConfig['id']]>; progress?: string; onExit?: () => void; children: React.ReactNode }) {
  return <main className="math-stage">
    <img className="math-stage__background" src="/assets/library/treehouse/rooms/kitchen-furnished.png" alt="" />
    <div className="math-stage__frame">
      <div className="stage-chrome">
        {(onExit || progress) && <header className="math-stage__topbar">
          {onExit ? <button type="button" onClick={onExit}><ArrowLeft />Stoppen</button> : <span />}
          {progress && <strong>{progress}</strong>}
        </header>}
        <JourneyStageProgress journey={journey} />
      </div>
      {children}
    </div>
  </main>;
}

interface InteractionProps {
  challenge: MathChallengeConfig;
  quantity: number; setQuantity: React.Dispatch<React.SetStateAction<number>>;
  scaled: Record<string, number>; setScaled: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  weight: number; setWeight: React.Dispatch<React.SetStateAction<number>>;
  order: string[]; setOrder: (value: string[]) => void;
  selectedStep: string | null; setSelectedStep: (value: string | null) => void;
  draggedStep: string | null; setDraggedStep: (value: string | null) => void;
  hint: string | null;
}

function ChallengeInteraction(props: InteractionProps) {
  const { challenge } = props;
  if (challenge.type === 'quantity-selection') return <div className="math-quantity">
    <CookingAssetImage src={assetFor(challenge.ingredientId)} alt={INGREDIENTS_BY_ID[challenge.ingredientId]?.name ?? challenge.ingredientId} />
    <Stepper value={props.quantity} step={1} maximum={challenge.maximum} minimum={challenge.minimum} onStep={props.setQuantity} label={`Aantal ${INGREDIENTS_BY_ID[challenge.ingredientId]?.name.toLowerCase() ?? challenge.ingredientId}`} />
    <span>{INGREDIENTS_BY_ID[challenge.ingredientId]?.name.toLowerCase()}</span>
  </div>;

  if (challenge.type === 'recipe-scaling') return <div className="math-scaling">
    <div className="math-scaling__reference"><span>{challenge.baseServings} porties</span><strong>→</strong><span>{challenge.targetServings} porties</span></div>
    {challenge.quantities.map(item => <div className="math-scaling__row" key={item.ingredientId}>
      <CookingAssetImage src={assetFor(item.ingredientId)} alt={INGREDIENTS_BY_ID[item.ingredientId]?.name ?? item.ingredientId} />
      <span className="math-scaling__name">
        <strong>{INGREDIENTS_BY_ID[item.ingredientId]?.name}</strong>
        <small>in het recept: {item.base}{unitSuffix(item.unit) ? ` ${item.unit}` : ''}</small>
      </span>
      <Stepper
        value={props.scaled[item.ingredientId] ?? item.base}
        step={item.step}
        maximum={item.target * 2}
        onStep={next => props.setScaled(current => ({ ...current, [item.ingredientId]: next(current[item.ingredientId] ?? item.base) }))}
        label={INGREDIENTS_BY_ID[item.ingredientId]?.name ?? item.ingredientId}
        unit={unitSuffix(item.unit)}
      />
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
