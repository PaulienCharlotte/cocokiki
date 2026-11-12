import { isCooktopZone } from '../../data/cooking/cooktopScene';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Lightbulb, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { EQUIPMENT_BY_ID } from '../../data/cooking/catalog';
import type { CookingProgressState, RecipeConfig } from '../../data/cooking/types';
import { emptyStepState, type CookingStepState, type OvenState } from '../../data/cooking/preparation';
import { restoreOven, tickOven } from '../../data/cooking/oven';
import { advancePreparation, createCookingSession, goBackPreparation, resumePreparation, updateCookingStep } from '../../data/cooking/session';
import { getRecipeIssues } from '../../data/cooking/validation';
import { defaultCookingStorage, type CookingStorageAdapter } from '../../services/cookingStorage';
import { missingIngredientMessage } from '../../services/recipeInventory';
import Confetti from './Confetti';
import { Button, Dialog, IconButton } from '../../design-system';
import SpeechBubble from '../ui/SpeechBubble';
import CookingAssetImage from './CookingAssetImage';
import CookingInteraction from './CookingInteraction';
import CookingTipCard from './CookingTipCard';
import HomeRecipe from './HomeRecipe';
import { dismissCookingTip, eligibleCookingTip, presentCookingTip, type CookingTip } from '../../data/cooking/tips';
import { bestellingVoorRecept, leverBestellingAf } from '../../services/bakeryOrders';
import OrderDelivery from './OrderDelivery';
import { useActivityAnalytics } from '../../services/useActivityAnalytics';
import { ACTIVITY_IDS, type ActivityId } from '../../shared/analyticsEvents';

interface Props {
  recipe: RecipeConfig;
  progress: CookingProgressState;
  onProgressChange: (progress: CookingProgressState) => void;
  onClose: () => void;
  onShop?: () => void;
  storageAdapter?: CookingStorageAdapter;
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
  const storage = props.storageAdapter ?? defaultCookingStorage;
  const [progress, setProgress] = useState(() => {
    if (!props.storageAdapter) return props.progress;
    try { return storage.load(); } catch { return props.progress; }
  });
  const [bookOpen, setBookOpen] = useState(false);
  const [heatHelp, setHeatHelp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [visibleTip, setVisibleTip] = useState<CookingTip | null>(null);
  const bestelling = bestellingVoorRecept(progress, props.recipe.id);
  const issues = getRecipeIssues(recipe);
  const initial = useRef(recipe.preparation?.steps.length ? createCookingSession(recipe) : null);
  const session = progress.preparationSessions[recipe.id] ?? initial.current;
  const activityId = `cooking:${recipe.id}` as ActivityId;
  const savedSession = progress.preparationSessions[recipe.id];
  useActivityAnalytics(!issues.length && savedSession && ACTIVITY_IDS.includes(activityId) ? activityId : null, savedSession?.attemptId, savedSession?.completed ?? false);
  useEffect(() => setHeatHelp(false), [recipe.id, session?.stepId, session?.viewStepId]);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const clockPaused = useRef(false);
  clockPaused.current = bookOpen || !!visibleTip;
  const ovenStep = recipe.preparation?.steps.find(item => item.mechanic === 'oven');
  const read = () => {
    try { return storage.load(); } catch { setMessage('Je kookpoging kan niet veilig worden geladen. Sluit dit scherm en probeer opnieuw.'); return null; }
  };
  const write = async (next: CookingProgressState, presentationOnly = false) => {
    try { return await storage.save(next, presentationOnly); } catch { return false; }
  };

  useEffect(() => {
    if (ovenStep?.mechanic !== 'oven') return;
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible' || clockPaused.current) return;
      const current = read(); if (!current) return;
      const saved = current.preparationSessions[recipe.id];
      if (!saved || saved.completed || saved.attemptId !== sessionRef.current?.attemptId || !saved.oven) return;
      const oven = tickOven(saved.oven, ovenStep.oven, 1);
      if (JSON.stringify(oven) === JSON.stringify(saved.oven)) return;
      const next = { ...current, preparationSessions: { ...current.preparationSessions, [recipe.id]: { ...saved, oven } } };
      if (await write(next, true)) accept(next);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recipe.id, storage]);

  const accept = (next: CookingProgressState) => { sessionRef.current = next.preparationSessions[recipe.id]; setProgress(next); onProgressChange(next); };
  const persist = async (next: CookingProgressState, presentationOnly = false) => {
    const nextSession = next.preparationSessions[recipe.id];
    const nextStep = recipe.preparation?.steps.find(item => item.id === nextSession?.stepId);
    const ovenWacht = nextStep?.mechanic === 'oven' && nextSession?.oven?.status === 'baking';
    const tip = nextSession && !visibleTip && (ovenWacht || !(nextStep?.mechanic === 'oven')) && !(nextStep?.mechanic === 'timed' && nextSession.steps[nextStep.id]?.phase === 'wait') ? eligibleCookingTip(recipe.cookingTips ?? [], nextSession) : undefined;
    if (tip) next = { ...next, preparationSessions: { ...next.preparationSessions, [recipe.id]: presentCookingTip(nextSession, tip) } };
    if (!await write(next, presentationOnly)) { setMessage('Opslaan lukt even niet. Je voorraad en munten blijven bewaard. Probeer opnieuw.'); setRetry(value => value + 1); return false; }
    accept(next);
    if (tip) setVisibleTip(tip);
    return true;
  };
  useEffect(() => {
    if (issues.length) { if (import.meta.env.DEV) console.warn(`Receptconfiguratie ${recipe.id}:`, issues); return; }
    const current = read(); if (!current) return;
    const next = storage.begin(current, recipe);
    if (next !== current || (next.preparationSessions[recipe.id] && eligibleCookingTip(recipe.cookingTips ?? [], next.preparationSessions[recipe.id]))) persist(next, true); else accept(current);
  }, [recipe.id, storage]);

  if (issues.length || !session) return <section className="cooking-stage"><div className="cooking-stage__shell"><article className="cooking-card">
    <h1>Dit recept is nog niet helemaal klaar</h1><p>Je voorraad en voortgang blijven bewaard.</p><button className="cooking-button" onClick={onClose}>Terug naar de keuken</button>
  </article></div></section>;
  const preparation = recipe.preparation!;
  const liveStep = preparation.steps.find(item => item.id === session.stepId) ?? preparation.steps[0];
  const step = preparation.steps.find(item => item.id === (session.viewStepId ?? session.stepId)) ?? liveStep;
  const index = preparation.steps.indexOf(step);
  const state = session.steps[step.id] ?? emptyStepState();
  /** Terugkijken is kijken: de stap staat er zoals je hem achterliet. */
  const kijktTerug = Boolean(session.viewStepId) && step.id !== liveStep.id;
  const background = step.station === 'kitchen' ? ASSET_LIBRARY.treehouse.rooms.kitchen : ASSET_LIBRARY.treehouse.stations[step.station === 'oven' ? 'worktop' : step.station];

  const change = async (patch: Partial<CookingStepState>, advance = false) => {
    const current = read(); if (!current) return;
    const saved = current.preparationSessions[recipe.id];
    const live = sessionRef.current;
    if (!saved || !live || saved.attemptId !== live.attemptId || saved.stepId !== liveStep.id || saved.completed) {
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
      const result = storage.complete(current, recipe, nextSession);
      if (!result.ok) { setMessage(result.message); setRetry(value => value + 1); return; }
      if (await persist(result.progress)) setMessage(null);
      return;
    }
    if (await persist({ ...current, preparationSessions: { ...current.preparationSessions, [recipe.id]: nextSession } })) setMessage(null);
  };
  /** Alleen waar je kijkt verschuift; wat af is blijft af. */
  const blader = (richting: 'terug' | 'verder') => {
    const current = read(); if (!current) return;
    const saved = current.preparationSessions[recipe.id];
    if (!saved || saved.completed) return;
    const nextSession = richting === 'terug' ? goBackPreparation(saved, recipe) : resumePreparation(saved);
    if (nextSession === saved) return;
    setMessage(null);
    persist({ ...current, preparationSessions: { ...current.preparationSessions, [recipe.id]: nextSession } }, true);
  };

  const changeOven = (patch: Partial<OvenState>) => {
    const current = read(); if (!current) return;
    const saved = current.preparationSessions[recipe.id];
    if (!saved || saved.completed || saved.attemptId !== sessionRef.current?.attemptId || saved.stepId !== liveStep.id) return;
    const oven = restoreOven({ ...restoreOven(saved.oven), ...patch });
    persist({ ...current, preparationSessions: { ...current.preparationSessions, [recipe.id]: { ...saved, oven } } }, true);
  };
  const replay = async () => {
    const current = read(); if (!current) return;
    const next = storage.begin(current, recipe, true);
    setVisibleTip(null);
    if (await persist(next)) { setBookOpen(false); setMessage(null); }
  };
  const closeTip = () => {
    if (!visibleTip) return;
    const current = read(); if (!current) return;
    const saved = current.preparationSessions[recipe.id];
    if (saved?.attemptId === session.attemptId) void persist({ ...current, preparationSessions: { ...current.preparationSessions, [recipe.id]: dismissCookingTip(saved, visibleTip) } }, true).then(ok => { if (ok) setVisibleTip(null); });
  };
  const stockMessage = missingIngredientMessage(recipe, progress, progress.journeys[recipe.id]?.consumedIngredientIds);

  // Was er een bestelling, dan eindigt het niet in de keuken maar bij degene
  // die erop wacht. Afleveren haalt de bestelling van de toonbank en betaalt
  // de bonus uit; daarna is dit weer een gewoon klaargemaakt recept.
  if (session.completed && bestelling) return <OrderDelivery
    bestelling={bestelling.bestelling}
    recipe={recipe}
    keer={bestelling.voortgang.keerGekozen ?? 1}
    bonus={bestelling.voortgang.misgrepen === 0 && bestelling.voortgang.aantalInEenKeer ? bestelling.bestelling.bonus : 0}
    inEenKeer={bestelling.voortgang.misgrepen === 0 && bestelling.voortgang.aantalInEenKeer}
    onClose={() => {
      // Via de opslag van dit spel, niet rechtstreeks: een avontuur kan in
      // een eigen opslag draaien en mag de gewone voortgang niet raken.
      const uitkomst = leverBestellingAf(storage.load());
      if (uitkomst.bestelling) {
        if (storage.save(uitkomst.progress) === false) { setMessage('Afleveren lukt even niet. Probeer het nog eens.'); return; }
        setProgress(uitkomst.progress);
        onProgressChange(uitkomst.progress);
      }
      onClose();
    }}
  />;

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

  const isCooktopScene = step.mechanic === 'heat' || step.mechanic === 'timed' || Boolean(step.cooktop);
  const cooktopZone = preparation.steps.slice(0, index + 1).map(item => session.steps[item.id]?.cooktopZone).reverse().find(isCooktopZone);
  return <section className={`cooking-stage${isCooktopScene ? ' cooking-stage--heat' : ''}`} aria-labelledby="cooking-step-title">
    <img className="cooking-stage__background" src={background} alt="" />
    <div className="cooking-stage__shell"><header className="cooking-stage__bar">
      <IconButton className="cooking-stage__icon" onClick={onClose} label="Terug naar de keuken" icon={<ArrowLeft />} />
      {isCooktopScene ? <Button variant="quiet" size="small" className="heat-previous" startIcon={<ChevronLeft />} onClick={() => blader('terug')} disabled={index === 0 || !session.completedStepIds.includes(preparation.steps[index - 1]?.id ?? '')} aria-label="Een stap terugkijken">Vorige stap</Button>
        : <IconButton className="cooking-stage__icon" onClick={() => blader('terug')} disabled={index === 0 || !session.completedStepIds.includes(preparation.steps[index - 1]?.id ?? '')} label="Een stap terugkijken" icon={<ChevronLeft />} />}
      <div className="cooking-stage__progress"><span>{isCooktopScene ? `${index + 1} / ${preparation.steps.length}` : `Stap ${index + 1} van ${preparation.steps.length}`}</span><i role="progressbar" aria-label="Voortgang recept" aria-valuenow={index + 1} aria-valuemin={0} aria-valuemax={preparation.steps.length}><b style={{ width: `${(index + 1) / preparation.steps.length * 100}%` }} /></i></div>
      {kijktTerug && <button type="button" className="cooking-stage__icon" onClick={() => blader('verder')} aria-label="Terug naar waar je was"><ChevronRight /></button>}
      {isCooktopScene && <IconButton className="cooking-stage__icon" label="Tip van Coco" icon={<Lightbulb />} onClick={() => setHeatHelp(true)} />}
      <IconButton className="cooking-stage__icon" onClick={() => setBookOpen(value => !value)} label="Recept bekijken" icon={<BookOpen />} />
    </header>
      {bookOpen && !isCooktopScene && <aside className="cooking-recipe-card" aria-label="Het recept"><header><div><small>Recept</small><h2>{recipe.name}</h2></div><button onClick={() => setBookOpen(false)} aria-label="Recept sluiten"><X /></button></header>
        <p><strong>Nodig:</strong> {recipe.ingredients.map(item => item.displayAmount).join(' · ')}</p><p><strong>Spullen:</strong> {recipe.equipmentIds.map(id => EQUIPMENT_BY_ID[id]?.name ?? id).join(' · ')}</p>
        {recipe.homeRecipe && <details><summary>Complete recept voor thuis</summary><HomeRecipe recipe={recipe} /></details>}
      </aside>}
      {visibleTip && <CookingTipCard tip={visibleTip} onDismiss={closeTip} />}
      {isCooktopScene && <Dialog open={bookOpen} title={recipe.name} onClose={() => setBookOpen(false)} primaryAction={<Button onClick={() => setBookOpen(false)}>Verder koken</Button>}>
        {recipe.homeRecipe ? <HomeRecipe recipe={recipe} /> : <p>{recipe.ingredients.map(item => item.displayAmount).join(' · ')}</p>}
      </Dialog>}
      {isCooktopScene && <Dialog open={heatHelp} title="Hulp bij het koken" onClose={() => setHeatHelp(false)} primaryAction={<Button onClick={() => setHeatHelp(false)}>Verder koken</Button>}>
        <SpeechBubble character="coco" label="kooktip">{step.instruction} {step.hint ?? 'Thuis helpt een volwassene bij het fornuis.'}</SpeechBubble>
      </Dialog>}
      <article className={`cooking-card${isCooktopScene ? ' cooking-card--heat' : ''}`}>
        {!isCooktopScene && <h1 id="cooking-step-title">{step.title}</h1>}
        {!isCooktopScene && uitleg(step.title, step.instruction) && <p className="cooking-card__instruction">{uitleg(step.title, step.instruction)}</p>}
        {session.oven?.powered && step.mechanic !== 'oven' && <output className="baking-oven-status">{Math.round(session.oven.actualTemperature)} °C · {session.oven.preheated ? 'oven klaar' : 'oven warmt op'}</output>}
        {(message || stockMessage) && <div className="cooking-card__hint is-nudge" role="alert"><p>{message ?? stockMessage}</p>{stockMessage && onShop && <button className="cooking-button" onClick={onShop}>Naar de winkel</button>}</div>}
        <div className={`cooking-card__scene cooking-card__scene--${step.mechanic}${isCooktopScene ? ' cooking-card__scene--cooktop' : ''}${step.station === 'kitchen' || isCooktopScene ? '' : ' has-surface'}${kijktTerug ? ' is-terugblik' : ''}`} inert={kijktTerug || undefined} style={step.station === 'kitchen' || isCooktopScene ? undefined : { backgroundImage: `url(${background})` }}>
          <React.Fragment key={`${session.attemptId}:${step.id}:${retry}`}><CookingInteraction cooktopZone={cooktopZone} step={step} state={state} oven={session.oven} onOvenChange={changeOven} onChange={patch => change(patch)} onComplete={patch => change(patch ?? {}, true)} onMiss={setMessage} /></React.Fragment>
        </div>{!isCooktopScene && step.hint && <p className="cooking-card__hint">{step.hint}</p>}
      </article>
    </div>
  </section>;
}
