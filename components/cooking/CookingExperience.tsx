import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { EQUIPMENT_BY_ID } from '../../data/cooking/catalog';
import type { CookingProgressState, RecipeConfig } from '../../data/cooking/types';
import { emptyStepState, type CookingStepState, type OvenState } from '../../data/cooking/preparation';
import { restoreOven, tickOven } from '../../data/cooking/oven';
import { advancePreparation, createCookingSession, goBackPreparation, resumePreparation, updateCookingStep } from '../../data/cooking/session';
import { getRecipeIssues } from '../../data/cooking/validation';
import { loadCookingProgress, saveCookingProgress } from '../../services/cookingProgress';
import { beginCookingAttempt, completeCookingAttempt } from '../../services/cookingSession';
import { missingIngredientMessage } from '../../services/recipeInventory';
import Confetti from './Confetti';
import { Button } from '../../design-system';
import CookingAssetImage from './CookingAssetImage';
import CookingInteraction from './CookingInteraction';
import CookingTipCard from './CookingTipCard';
import HomeRecipe from './HomeRecipe';
import { dismissCookingTip, eligibleCookingTip, presentCookingTip, type CookingTip } from '../../data/cooking/tips';

interface Props {
  recipe: RecipeConfig;
  progress: CookingProgressState;
  onProgressChange: (progress: CookingProgressState) => void;
  onClose: () => void;
  onShop?: () => void;
}
/**
 * De kop zegt al wat er moet gebeuren. Herhaalt de instructie die kop woord
 * voor woord, dan blijft alleen de toelichting over — anders staat hetzelfde
 * er twee keer, en dat is precies wat het scherm druk maakte.
 */
function uitleg(titel: string, instructie: string): string {
  if (!instructie.toLowerCase().startsWith(titel.toLowerCase())) return instructie;
  return instructie.slice(titel.length).replace(/^[.!?,\s]+/, '').trim();
}

export default function CookingExperience(props: Props) {
  const { recipe, onProgressChange, onClose, onShop } = props;
  const [progress, setProgress] = useState(props.progress);
  const [bookOpen, setBookOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [visibleTip, setVisibleTip] = useState<CookingTip | null>(null);
  const issues = getRecipeIssues(recipe);
  const initial = useRef(recipe.preparation?.steps.length ? createCookingSession(recipe) : null);
  const session = progress.preparationSessions[recipe.id] ?? initial.current;
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const clockPaused = useRef(false);
  clockPaused.current = bookOpen || !!visibleTip;
  const ovenStep = recipe.preparation?.steps.find(item => item.mechanic === 'oven');

  useEffect(() => {
    if (ovenStep?.mechanic !== 'oven') return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible' || clockPaused.current) return;
      const current = loadCookingProgress();
      const saved = current.preparationSessions[recipe.id];
      if (!saved || saved.completed || saved.attemptId !== sessionRef.current?.attemptId || !saved.oven) return;
      const oven = tickOven(saved.oven, ovenStep.oven, 1);
      if (JSON.stringify(oven) === JSON.stringify(saved.oven)) return;
      const next = { ...current, preparationSessions: { ...current.preparationSessions, [recipe.id]: { ...saved, oven } } };
      if (saveCookingProgress(next, undefined, { rewards: false })) accept(next);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recipe.id]);

  const accept = (next: CookingProgressState) => { sessionRef.current = next.preparationSessions[recipe.id]; setProgress(next); onProgressChange(next); };
  const persist = (next: CookingProgressState, presentationOnly = false) => {
    const nextSession = next.preparationSessions[recipe.id];
    const nextStep = recipe.preparation?.steps.find(item => item.id === nextSession?.stepId);
    const tip = nextSession && !visibleTip && !(nextStep?.mechanic === 'oven') && !(nextStep?.mechanic === 'timed' && nextSession.steps[nextStep.id]?.phase === 'wait') ? eligibleCookingTip(recipe.cookingTips ?? [], nextSession) : undefined;
    if (tip) next = { ...next, preparationSessions: { ...next.preparationSessions, [recipe.id]: presentCookingTip(nextSession, tip) } };
    if (!saveCookingProgress(next, undefined, presentationOnly ? { rewards: false } : undefined)) { setMessage('Opslaan lukt even niet. Je voorraad en munten blijven bewaard. Probeer opnieuw.'); setRetry(value => value + 1); return false; }
    accept(next);
    if (tip) setVisibleTip(tip);
    return true;
  };
  useEffect(() => {
    if (issues.length) { if (import.meta.env.DEV) console.warn(`Receptconfiguratie ${recipe.id}:`, issues); return; }
    const current = loadCookingProgress();
    const next = beginCookingAttempt(current, recipe);
    if (next !== current || (next.preparationSessions[recipe.id] && eligibleCookingTip(recipe.cookingTips ?? [], next.preparationSessions[recipe.id]))) persist(next, true); else accept(current);
  }, [recipe.id]);

  if (issues.length || !session) return <section className="cooking-stage"><div className="cooking-stage__shell"><article className="cooking-card">
    <h1>Dit recept is nog niet helemaal klaar</h1><p>Je voorraad en voortgang blijven bewaard.</p><button className="cooking-button" onClick={onClose}>Terug naar de keuken</button>
  </article></div></section>;
  const preparation = recipe.preparation!;
  const step = preparation.steps.find(item => item.id === session.stepId) ?? preparation.steps[0];
  const index = preparation.steps.indexOf(step);
  const state = session.steps[step.id] ?? emptyStepState();
  /** Je kijkt terug als deze stap al af is maar er verderop nog werk ligt. */
  const kijktTerug = session.completedStepIds.includes(step.id)
    && preparation.steps.some(item => !session.completedStepIds.includes(item.id));
  const background = step.station === 'kitchen' ? ASSET_LIBRARY.treehouse.rooms.kitchen : ASSET_LIBRARY.treehouse.stations[step.station === 'oven' ? 'worktop' : step.station];

  const change = (patch: Partial<CookingStepState>, advance = false) => {
    const current = loadCookingProgress();
    const saved = current.preparationSessions[recipe.id];
    const live = sessionRef.current;
    if (!saved || !live || saved.attemptId !== live.attemptId || saved.stepId !== step.id || saved.completed) {
      setMessage('Je kookpoging is veranderd. Sluit dit scherm en open het recept opnieuw.'); return;
    }
    if (advance && step.mechanic === 'oven') {
      const oven = restoreOven(saved.oven);
      if (step.action === 'preheat' && (!oven.powered || oven.temperature !== step.oven.targetTemperature)) return;
      if (step.action === 'bake' && (oven.result !== 'good' || oven.status !== 'finished')) return;
      if (step.action === 'cool' && (oven.result !== 'good' || oven.status !== 'served' || oven.trayPlaced)) return;
    }
    let nextSession = updateCookingStep(saved, patch);
    if (advance) nextSession = advancePreparation(nextSession, recipe);
    if (advance && preparation.steps.every(item => nextSession.completedStepIds.includes(item.id))) {
      const result = completeCookingAttempt(current, recipe, nextSession);
      if (!result.ok) { setMessage(result.message); setRetry(value => value + 1); return; }
      if (persist(result.progress)) setMessage(null);
      return;
    }
    if (persist({ ...current, preparationSessions: { ...current.preparationSessions, [recipe.id]: nextSession } })) setMessage(null);
  };
  /** Alleen waar je kijkt verschuift; wat af is blijft af. */
  const blader = (richting: 'terug' | 'verder') => {
    const current = loadCookingProgress();
    const saved = current.preparationSessions[recipe.id];
    if (!saved || saved.completed) return;
    const nextSession = richting === 'terug' ? goBackPreparation(saved, recipe) : resumePreparation(saved, recipe);
    if (nextSession === saved) return;
    setMessage(null);
    persist({ ...current, preparationSessions: { ...current.preparationSessions, [recipe.id]: nextSession } }, true);
  };

  const changeOven = (patch: Partial<OvenState>) => {
    const current = loadCookingProgress();
    const saved = current.preparationSessions[recipe.id];
    if (!saved || saved.completed || saved.attemptId !== sessionRef.current?.attemptId || saved.stepId !== step.id) return;
    const oven = restoreOven({ ...restoreOven(saved.oven), ...patch });
    persist({ ...current, preparationSessions: { ...current.preparationSessions, [recipe.id]: { ...saved, oven } } }, true);
  };
  const replay = () => {
    const current = loadCookingProgress();
    const next = beginCookingAttempt(current, recipe, true);
    setVisibleTip(null);
    if (persist(next)) { setBookOpen(false); setMessage(null); }
  };
  const closeTip = () => {
    if (!visibleTip) return;
    const current = loadCookingProgress();
    const saved = current.preparationSessions[recipe.id];
    if (saved?.attemptId === session.attemptId && persist({ ...current, preparationSessions: { ...current.preparationSessions, [recipe.id]: dismissCookingTip(saved, visibleTip) } }, true)) setVisibleTip(null);
  };
  const stockMessage = missingIngredientMessage(recipe, progress, progress.journeys[recipe.id]?.consumedIngredientIds);

  if (session.completed) return <section className="cooking-stage cooking-stage--done" aria-live="polite">
    <img className="cooking-stage__background" src={ASSET_LIBRARY.treehouse.stations.worktop} alt="" />
    <div className="cooking-stage__shell"><article className="cooking-card cooking-card--celebrate celebration-card">
      <div className="celebration-card__stage"><Confetti /><motion.div className="celebration-card__dish" initial={{ scale: .72, rotate: -6, y: 14 }} animate={{ scale: 1, rotate: 0, y: 0 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }}>
        <CookingAssetImage src={preparation.finishedAsset} alt={preparation.finishedAlt} />
      </motion.div></div><h1>Klaar, chef!</h1>
      {message && <p role="alert">{message}</p>}
      <div className="cooking-card__actions"><button type="button" className="cooking-button" onClick={onClose}>Terug naar de keuken</button><button type="button" className="cooking-button is-quiet" onClick={replay}>Opnieuw</button></div>
    </article>{visibleTip && <CookingTipCard tip={visibleTip} onDismiss={closeTip} />}</div>
  </section>;

  return <section className="cooking-stage" aria-labelledby="cooking-step-title">
    <img className="cooking-stage__background" src={background} alt="" />
    <div className="cooking-stage__shell"><header className="cooking-stage__bar">
      <button type="button" className="cooking-stage__icon" onClick={onClose} aria-label="Terug naar de keuken"><ArrowLeft /></button>
      <button type="button" className="cooking-stage__icon" onClick={() => blader('terug')} disabled={index === 0} aria-label="Een stap terugkijken"><ChevronLeft /></button>
      <div className="cooking-stage__progress"><span>Stap {index + 1} van {preparation.steps.length}</span><i><b style={{ width: `${(index + 1) / preparation.steps.length * 100}%` }} /></i></div>
      <button type="button" className="cooking-stage__icon" onClick={() => setBookOpen(value => !value)} aria-label="Recept bekijken" aria-expanded={bookOpen}><BookOpen /></button>
    </header>
      {bookOpen && <aside className="cooking-recipe-card" aria-label="Het recept"><header><div><small>Recept</small><h2>{recipe.name}</h2></div><button onClick={() => setBookOpen(false)} aria-label="Recept sluiten"><X /></button></header>
        <p><strong>Nodig:</strong> {recipe.ingredients.map(item => item.displayAmount).join(' · ')}</p><p><strong>Spullen:</strong> {recipe.equipmentIds.map(id => EQUIPMENT_BY_ID[id]?.name ?? id).join(' · ')}</p>
        {recipe.homeRecipe && <details><summary>Complete recept voor thuis</summary><HomeRecipe recipe={recipe} /></details>}
      </aside>}
      {visibleTip && <CookingTipCard tip={visibleTip} onDismiss={closeTip} />}
      <article className="cooking-card"><h1 id="cooking-step-title">{step.title}</h1>
        {uitleg(step.title, step.instruction) && <p className="cooking-card__instruction">{uitleg(step.title, step.instruction)}</p>}
        {session.oven?.powered && step.mechanic !== 'oven' && <output className="baking-oven-status">{Math.round(session.oven.actualTemperature)} °C · {session.oven.preheated ? 'oven klaar' : 'oven warmt op'}</output>}
        {kijktTerug && <Button className="cooking-card__verder" variant="quiet" size="small" pill endIcon={<ChevronRight size={16} />} onClick={() => blader('verder')}>Verder waar je was</Button>}
        {(message || stockMessage) && <div className="cooking-card__hint is-nudge" role="alert"><p>{message ?? stockMessage}</p>{stockMessage && onShop && <button className="cooking-button" onClick={onShop}>Naar de winkel</button>}</div>}
        <div className={`cooking-card__scene cooking-card__scene--${step.mechanic}${step.station === 'kitchen' ? '' : ' has-surface'}`} style={step.station === 'kitchen' ? undefined : { backgroundImage: `url(${background})` }}>
          <React.Fragment key={`${session.attemptId}:${step.id}:${retry}`}><CookingInteraction step={step} state={state} oven={session.oven} onOvenChange={changeOven} onChange={patch => change(patch)} onComplete={patch => change(patch ?? {}, true)} onMiss={setMessage} /></React.Fragment>
        </div>{step.hint && <p className="cooking-card__hint">{step.hint}</p>}
      </article>
    </div>
  </section>;
}
