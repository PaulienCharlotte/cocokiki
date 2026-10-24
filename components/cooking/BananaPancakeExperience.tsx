import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, ChefHat, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ASSET_LIBRARY } from '../../data/assetLibrary';
import { RECIPES_BY_ID } from '../../data/cooking/catalog';
import {
  advanceCookingSession,
  BANANA_PANCAKE_STEPS,
  createBananaPancakeSession,
  loadBananaPancakeSession,
  saveBananaPancakeSession,
  type BananaPancakeSession,
} from '../../data/cooking/bananaPancakeCooking';
import type { CookingProgressState } from '../../data/cooking/types';
import { completeJourney, consumeIngredient, saveCookingProgress } from '../../services/cookingProgress';
import CookingAssetImage from './CookingAssetImage';
import DragToTarget from './DragToTarget';

interface Props {
  progress: CookingProgressState;
  onProgressChange: (progress: CookingProgressState) => void;
  onClose: () => void;
}

const TOOL_ASSETS = [
  ['bowl', 'Kom', ASSET_LIBRARY.cooking.bananaPancakes.bowl],
  ['fork', 'Vork', ASSET_LIBRARY.cooking.bananaPancakes.fork],
  ['pan', 'Pan', ASSET_LIBRARY.cooking.bananaPancakes.pan],
  ['spatula', 'Spatel', ASSET_LIBRARY.cooking.bananaPancakes.spatula],
] as const;

const STATION_LABELS = { cooktop: 'Kookplaat', worktop: 'Werkblad', kitchen: 'Keuken' } as const;

function consumeRecipeIngredients(progress: CookingProgressState): CookingProgressState {
  return RECIPES_BY_ID['banana-pancakes'].ingredients.reduce(
    (current, ingredient) => consumeIngredient(current, 'banana-pancakes', ingredient.ingredientId, ingredient.amount),
    progress,
  );
}

export default function BananaPancakeExperience({ progress, onProgressChange, onClose }: Props) {
  const [session, setSession] = useState<BananaPancakeSession>(loadBananaPancakeSession);
  const [bookOpen, setBookOpen] = useState(false);
  const [cookingPhase, setCookingPhase] = useState<'pour' | 'wait' | 'flip'>('pour');
  const [nudge, setNudge] = useState<string | null>(null);
  const step = BANANA_PANCAKE_STEPS[session.stepIndex];
  const stationBackground = step.station === 'cooktop'
    ? ASSET_LIBRARY.treehouse.stations.cooktop
    : step.station === 'worktop'
      ? ASSET_LIBRARY.treehouse.stations.worktop
      : ASSET_LIBRARY.treehouse.rooms.kitchen;

  const actionCountRef = useRef(session.actionCount);

  useEffect(() => { saveBananaPancakeSession(session); }, [session]);
  useEffect(() => { setNudge(null); }, [session.stepIndex]);
  useEffect(() => { actionCountRef.current = session.actionCount; }, [session.actionCount]);

  const setAndAdvance = (patch: Partial<BananaPancakeSession> = {}) => {
    let next = { ...session, ...patch };
    if (!next.ingredientsConsumed && session.stepIndex >= 1) {
      const nextProgress = consumeRecipeIngredients(progress);
      saveCookingProgress(nextProgress);
      onProgressChange(nextProgress);
      next = { ...next, ingredientsConsumed: true };
    }
    setSession(advanceCookingSession(next));
  };

  /** Telt synchroon mee, zodat ook snelle tikjes allemaal meetellen. */
  const repeat = () => {
    const count = actionCountRef.current + 1;
    actionCountRef.current = count;
    if (count >= step.target) setAndAdvance({ actionCount: count });
    else setSession(current => ({ ...current, actionCount: count }));
  };

  const finish = (covered: boolean) => {
    setSession({ ...session, covered, completed: true, updatedAt: new Date().toISOString() });
    const result = completeJourney(progress, RECIPES_BY_ID['banana-pancakes']);
    saveCookingProgress(result.progress);
    onProgressChange(result.progress);
  };

  const progressPercent = session.completed ? 100 : ((session.stepIndex + 1) / BANANA_PANCAKE_STEPS.length) * 100;
  const visualAsset = useMemo(() => step.id === 'cook' && cookingPhase === 'flip'
    ? ASSET_LIBRARY.cooking.bananaPancakes.pancakeGolden
    : step.asset, [cookingPhase, step]);

  if (session.completed) return <section className="cooking-stage cooking-stage--done" aria-live="polite">
    <img className="cooking-stage__background" src={ASSET_LIBRARY.treehouse.stations.worktop} alt="" />
    <div className="cooking-stage__shell">
      <article className="cooking-card cooking-card--celebrate">
        <motion.div className="cooking-card__dish" initial={{ scale: .6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }}>
          <CookingAssetImage src={ASSET_LIBRARY.cooking.bananaPancakes.finished} alt="Bananenpannenkoekjes op een bord" />
        </motion.div>
        <span className="cooking-card__badge" aria-hidden="true"><ChefHat /></span>
        <h1>Klaar!</h1>
        <p className="cooking-card__instruction">Je recept staat nu in Mijn Kookboek.</p>
        <div className="cooking-card__actions">
          <button type="button" className="cooking-button" onClick={onClose}>Terug naar de keuken</button>
          <button type="button" className="cooking-button is-quiet" onClick={() => setSession(createBananaPancakeSession())}>Opnieuw</button>
        </div>
      </article>
    </div>
  </section>;

  return <section className="cooking-stage" aria-labelledby="cooking-step-title">
    <img className="cooking-stage__background" src={stationBackground} alt="" />
    <div className="cooking-stage__shell">
      <header className="cooking-stage__bar">
        <button type="button" className="cooking-stage__icon" onClick={onClose} aria-label="Terug naar de keuken"><ArrowLeft /></button>
        <div className="cooking-stage__progress">
          <span>Stap {session.stepIndex + 1} van {BANANA_PANCAKE_STEPS.length}</span>
          <i><b style={{ width: `${progressPercent}%` }} /></i>
        </div>
        <button type="button" className="cooking-stage__icon" onClick={() => setBookOpen(open => !open)} aria-label="Recept bekijken" aria-expanded={bookOpen}><BookOpen /></button>
      </header>

      {bookOpen && <aside className="cooking-recipe-card" aria-label="Het recept">
        <header>
          <div><small>Recept</small><h2>Bananenpannenkoekjes</h2></div>
          <button type="button" onClick={() => setBookOpen(false)} aria-label="Recept sluiten"><X /></button>
        </header>
        <p><strong>Nodig:</strong> 1 banaan · 2 eieren · 40 g havermout</p>
        <p><strong>Spullen:</strong> kom · vork · pan · spatel</p>
      </aside>}

      <article className="cooking-card">
        <small className="cooking-card__station">{STATION_LABELS[step.station]}</small>
        <h1 id="cooking-step-title">{step.title}</h1>
        <p className="cooking-card__instruction">{step.instruction}</p>

        <div className={`cooking-card__scene cooking-card__scene--${step.mechanic}`}>
          {step.mechanic === 'collect' && <div className="cooking-tools">
            {TOOL_ASSETS.map(([id, label, image]) => {
              const selected = session.selectedTools.includes(id);
              return <button key={id} type="button" className={`cooking-tool${selected ? ' is-selected' : ''}`} onClick={() => {
                if (selected) return;
                const selectedTools = [...session.selectedTools, id];
                if (selectedTools.length === TOOL_ASSETS.length) setAndAdvance({ selectedTools });
                else setSession(current => ({ ...current, selectedTools }));
              }}>
                <img src={image} alt="" />
                <span>{label}</span>
                {selected && <i className="cooking-tool__check" aria-hidden="true"><Check /></i>}
              </button>;
            })}
          </div>}

          {step.mechanic === 'drag' && step.dropTarget && <DragToTarget
            sourceAsset={step.asset}
            sourceLabel={step.dropTarget.sourceLabel}
            targetLabel={step.dropTarget.label}
            targetAsset={step.dropTarget.asset}
            onHit={() => setAndAdvance()}
            onMiss={() => setNudge(`Laat los op de ${step.dropTarget!.label.toLowerCase()}.`)}
          />}

          {step.mechanic === 'repeat' && <div className="cooking-tap">
            <motion.button
              type="button"
              className="cooking-tap__object"
              whileTap={{ scale: .9, rotate: -3 }}
              onClick={repeat}
              aria-label={`${step.title}, tik ${step.target} keer`}
            >
              <CookingAssetImage src={visualAsset} />
            </motion.button>
            <span className="cooking-tap__label">{step.tapLabel ?? 'Tik op het plaatje'}</span>
            <div className="cooking-dots" aria-label={`${session.actionCount} van ${step.target}`}>
              {Array.from({ length: step.target }, (_, index) => <i key={index} className={index < session.actionCount ? 'is-done' : ''} />)}
            </div>
          </div>}

          {step.mechanic === 'weigh' && <div className="cooking-weighing">
            <CookingAssetImage className="cooking-weighing__art" src={step.asset} />
            <div className="cooking-weighing__readout" aria-live="polite">
              <strong>{session.oatGrams}</strong><span>gram</span>
            </div>
            <div className="cooking-weighing__controls">
              <button type="button" className="cooking-chip" onClick={() => setSession(current => ({ ...current, oatGrams: Math.max(0, current.oatGrams - 5) }))}>−5 g</button>
              <button type="button" className="cooking-chip" onClick={() => setSession(current => ({ ...current, oatGrams: Math.min(80, current.oatGrams + 10) }))}>+10 g</button>
            </div>
            <button type="button" className="cooking-button" disabled={session.oatGrams !== 40} onClick={() => setAndAdvance()}>
              {session.oatGrams === 40 ? 'Precies 40 gram!' : 'Maak er 40 gram van'}
            </button>
          </div>}

          {step.mechanic === 'heat' && <div className="cooking-heating">
            <button type="button" className={`cooking-choice${session.actionCount > 0 ? ' is-selected' : ''}`} onClick={() => setSession(current => ({ ...current, actionCount: 1 }))}>
              <img src={ASSET_LIBRARY.cooking.bananaPancakes.butter} alt="" />
              <span>Boter erin</span>
              {session.actionCount > 0 && <i className="cooking-tool__check" aria-hidden="true"><Check /></i>}
            </button>
            <div className="cooking-heating__levels" role="group" aria-label="Warmtestand">
              {[1, 2, 3].map(level => <button key={level} type="button" className={`cooking-chip${session.heat === level ? ' is-selected' : ''}`} onClick={() => setSession(current => ({ ...current, heat: level as 1 | 2 | 3 }))}>
                {level === 1 ? 'Laag' : level === 2 ? 'Middel' : 'Hoog'}
              </button>)}
            </div>
            <button type="button" className="cooking-button" disabled={session.actionCount === 0 || session.heat !== 2} onClick={() => setAndAdvance()}>Verwarm de pan</button>
          </div>}

          {step.mechanic === 'timed' && <div className="cooking-baking">
            <CookingAssetImage className="cooking-baking__art" src={visualAsset} />
            {cookingPhase === 'pour' && <button type="button" className="cooking-button" onClick={() => { setCookingPhase('wait'); window.setTimeout(() => setCookingPhase('flip'), 2500); }}>Giet het beslag</button>}
            {cookingPhase === 'wait' && <span className="cooking-baking__timer" role="status">Even wachten…</span>}
            {cookingPhase === 'flip' && <button type="button" className="cooking-button" onClick={() => { setCookingPhase('pour'); setAndAdvance(); }}>Draai om</button>}
          </div>}

          {step.mechanic === 'optional' && <div className="cooking-baking">
            <CookingAssetImage className="cooking-baking__art" src={step.asset} />
            <div className="cooking-choices">
              <button type="button" className="cooking-button" onClick={() => finish(true)}>Even afdekken</button>
              <button type="button" className="cooking-button is-quiet" onClick={() => finish(false)}>Meteen serveren</button>
            </div>
          </div>}
        </div>

        <p className={`cooking-card__hint${nudge ? ' is-nudge' : ''}`} role={nudge ? 'alert' : undefined}>{nudge ?? step.hint}</p>
      </article>
    </div>
  </section>;
}
