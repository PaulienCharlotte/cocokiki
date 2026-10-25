import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { EQUIPMENT_BY_ID } from '../../data/cooking/catalog';
import type { CookingProgressState, RecipeConfig } from '../../data/cooking/types';
import { emptyStepState, type CookingStepState } from '../../data/cooking/preparation';
import { advancePreparation, createCookingSession, updateCookingStep } from '../../data/cooking/session';
import { getRecipeIssues } from '../../data/cooking/validation';
import { loadCookingProgress, saveCookingProgress } from '../../services/cookingProgress';
import { beginCookingAttempt, completeCookingAttempt } from '../../services/cookingSession';
import { missingIngredientMessage } from '../../services/recipeInventory';
import Confetti from './Confetti';
import CookingAssetImage from './CookingAssetImage';
import CookingInteraction from './CookingInteraction';

interface Props {
  recipe: RecipeConfig;
  progress: CookingProgressState;
  onProgressChange: (progress: CookingProgressState) => void;
  onClose: () => void;
  onShop?: () => void;
}
const STATION_LABELS = { cooktop: 'Kookplaat', worktop: 'Werkblad', kitchen: 'Keuken' } as const;

export default function CookingExperience(props: Props) {
  const { recipe, onProgressChange, onClose, onShop } = props;
  const [progress, setProgress] = useState(props.progress);
  const [bookOpen, setBookOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const issues = getRecipeIssues(recipe);
  const initial = useRef(recipe.preparation?.steps.length ? createCookingSession(recipe) : null);
  const session = progress.preparationSessions[recipe.id] ?? initial.current;
  const sessionRef = useRef(session);
  sessionRef.current = session;

  const accept = (next: CookingProgressState) => { sessionRef.current = next.preparationSessions[recipe.id]; setProgress(next); onProgressChange(next); };
  const persist = (next: CookingProgressState) => {
    if (!saveCookingProgress(next)) { setMessage('Opslaan lukt even niet. Je voorraad en munten blijven bewaard. Probeer opnieuw.'); setRetry(value => value + 1); return false; }
    accept(next);
    return true;
  };
  useEffect(() => {
    if (issues.length) return;
    const current = loadCookingProgress();
    const next = beginCookingAttempt(current, recipe);
    if (next !== current) persist(next); else accept(current);
  }, [recipe.id]);

  if (issues.length || !session) return <section className="cooking-stage"><div className="cooking-stage__shell"><article className="cooking-card">
    <h1>Dit recept is nog niet helemaal klaar</h1><p>Je voorraad en voortgang blijven bewaard.</p><button className="cooking-button" onClick={onClose}>Terug naar de keuken</button>
  </article></div></section>;
  const preparation = recipe.preparation!;
  const step = preparation.steps.find(item => item.id === session.stepId) ?? preparation.steps[0];
  const index = preparation.steps.indexOf(step);
  const state = session.steps[step.id] ?? emptyStepState();
  const background = step.station === 'kitchen' ? ASSET_LIBRARY.treehouse.rooms.kitchen : ASSET_LIBRARY.treehouse.stations[step.station];

  const change = (patch: Partial<CookingStepState>, advance = false) => {
    const current = loadCookingProgress();
    const saved = current.preparationSessions[recipe.id];
    const live = sessionRef.current;
    if (!saved || !live || saved.attemptId !== live.attemptId || saved.stepId !== step.id || saved.completed) {
      setMessage('Je kookpoging is veranderd. Sluit dit scherm en open het recept opnieuw.'); return;
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
  const replay = () => {
    const current = loadCookingProgress();
    const next = beginCookingAttempt(current, recipe, true);
    if (persist(next)) { setBookOpen(false); setMessage(null); }
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
    </article></div>
  </section>;

  return <section className="cooking-stage" aria-labelledby="cooking-step-title">
    <img className="cooking-stage__background" src={background} alt="" />
    <div className="cooking-stage__shell"><header className="cooking-stage__bar">
      <button type="button" className="cooking-stage__icon" onClick={onClose} aria-label="Terug naar de keuken"><ArrowLeft /></button>
      <div className="cooking-stage__progress"><span>Stap {index + 1} van {preparation.steps.length}</span><i><b style={{ width: `${(index + 1) / preparation.steps.length * 100}%` }} /></i></div>
      <button type="button" className="cooking-stage__icon" onClick={() => setBookOpen(value => !value)} aria-label="Recept bekijken" aria-expanded={bookOpen}><BookOpen /></button>
    </header>
      {bookOpen && <aside className="cooking-recipe-card" aria-label="Het recept"><header><div><small>Recept</small><h2>{recipe.name}</h2></div><button onClick={() => setBookOpen(false)} aria-label="Recept sluiten"><X /></button></header>
        <p><strong>Nodig:</strong> {recipe.ingredients.map(item => item.displayAmount).join(' · ')}</p><p><strong>Spullen:</strong> {recipe.equipmentIds.map(id => EQUIPMENT_BY_ID[id]?.name ?? id).join(' · ')}</p>
      </aside>}
      <article className="cooking-card"><small className="cooking-card__station">{STATION_LABELS[step.station]}</small><h1 id="cooking-step-title">{step.title}</h1><p className="cooking-card__instruction">{step.instruction}</p>
        {(message || stockMessage) && <div className="cooking-card__hint is-nudge" role="alert"><p>{message ?? stockMessage}</p>{stockMessage && onShop && <button className="cooking-button" onClick={onShop}>Naar de winkel</button>}</div>}
        <div className={`cooking-card__scene cooking-card__scene--${step.mechanic}${step.station === 'kitchen' ? '' : ' has-surface'}`} style={step.station === 'kitchen' ? undefined : { backgroundImage: `url(${background})` }}>
          <React.Fragment key={`${session.attemptId}:${step.id}:${retry}`}><CookingInteraction step={step} state={state} onChange={patch => change(patch)} onComplete={patch => change(patch ?? {}, true)} onMiss={setMessage} /></React.Fragment>
        </div><p className="cooking-card__hint">{step.hint}</p>
      </article>
    </div>
  </section>;
}
