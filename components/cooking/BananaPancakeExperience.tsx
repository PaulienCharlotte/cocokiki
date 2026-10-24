import React, { useEffect, useMemo, useState } from 'react';
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
  const step = BANANA_PANCAKE_STEPS[session.stepIndex];
  const stationBackground = step.station === 'cooktop'
    ? ASSET_LIBRARY.treehouse.stations.cooktop
    : step.station === 'worktop'
      ? ASSET_LIBRARY.treehouse.stations.worktop
      : ASSET_LIBRARY.treehouse.rooms.kitchen;

  useEffect(() => { saveBananaPancakeSession(session); }, [session]);

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

  const repeat = () => {
    const count = session.actionCount + 1;
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

  if (session.completed) return <section className="cooking-experience cooking-experience--complete" aria-live="polite">
    <img className="cooking-experience__station" src={ASSET_LIBRARY.treehouse.stations.worktop} alt="" />
    <div className="cooking-celebration">
      <motion.div initial={{ scale: .6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }}><CookingAssetImage src={ASSET_LIBRARY.cooking.bananaPancakes.finished} alt="Bananenpannenkoekjes op een bord" /></motion.div>
      <ChefHat aria-hidden="true" /><h1>Klaar!</h1><p>Je recept staat nu in Mijn Kookboek.</p>
      <div className="cooking-celebration__actions">
        <button type="button" onClick={onClose}>Terug naar de keuken</button>
        <button type="button" className="is-secondary" onClick={() => setSession(createBananaPancakeSession())}>Opnieuw</button>
      </div>
    </div>
  </section>;

  return <section className="cooking-experience" aria-labelledby="cooking-step-title">
    <img className="cooking-experience__station" src={stationBackground} alt="" />
    <header className="cooking-experience__topbar">
      <button type="button" onClick={onClose} aria-label="Terug naar de keuken"><ArrowLeft /></button>
      <div className="cooking-experience__progress"><span>{session.stepIndex + 1}/{BANANA_PANCAKE_STEPS.length}</span><i><b style={{ width: `${progressPercent}%` }} /></i></div>
      <button type="button" onClick={() => setBookOpen(open => !open)} aria-label="Recept bekijken" aria-expanded={bookOpen}><BookOpen /></button>
    </header>

    {bookOpen && <aside className="cooking-recipe-drawer">
      <button type="button" onClick={() => setBookOpen(false)} aria-label="Recept sluiten"><X /></button>
      <small>Bananenpannenkoekjes</small><h2>{step.title}</h2>
      <p>1 banaan · 2 eieren · 40 g havermout</p><p>Kom · vork · pan · spatel</p>
    </aside>}

    <div className="cooking-experience__task">
      <small>{step.station === 'cooktop' ? 'KOOKPLAAT' : step.station === 'worktop' ? 'WERKBLAD' : 'KEUKEN'}</small>
      <h1 id="cooking-step-title">{step.title}</h1><p>{step.instruction}</p>
    </div>

    <div className={`cooking-experience__play cooking-experience__play--${step.mechanic}`}>
      {step.id === 'tools' ? <div className="cooking-tool-grid">{TOOL_ASSETS.map(([id, label, image]) => {
        const selected = session.selectedTools.includes(id);
        return <button key={id} type="button" className={selected ? 'is-selected' : ''} onClick={() => {
          if (selected) return;
          const selectedTools = [...session.selectedTools, id];
          if (selectedTools.length === TOOL_ASSETS.length) setAndAdvance({ selectedTools });
          else setSession(current => ({ ...current, selectedTools }));
        }}><img src={image} alt="" /><span>{label}</span>{selected && <Check />}</button>;
      })}</div> : <>
        <motion.button type="button" className="cooking-main-object"
          drag={step.mechanic === 'drag'} dragSnapToOrigin dragMomentum={false}
          whileTap={{ scale: .96 }} whileDrag={{ scale: 1.08 }}
          onDragEnd={() => step.mechanic === 'drag' && setAndAdvance()}
          onClick={() => step.mechanic === 'repeat' && repeat()}
          aria-label={step.mechanic === 'repeat' ? `${step.title}, tik ${step.target} keer` : step.instruction}
        ><CookingAssetImage src={visualAsset} /></motion.button>

        {step.mechanic === 'repeat' && <div className="cooking-action-dots" aria-label={`${session.actionCount} van ${step.target}`}>{Array.from({ length: step.target }, (_, index) => <i key={index} className={index < session.actionCount ? 'is-done' : ''} />)}</div>}
        {step.mechanic === 'weigh' && <div className="cooking-weigh"><strong>{session.oatGrams} g</strong><div><button type="button" onClick={() => setSession(current => ({ ...current, oatGrams: Math.max(0, current.oatGrams - 5) }))}>−5</button><button type="button" onClick={() => setSession(current => ({ ...current, oatGrams: Math.min(80, current.oatGrams + 10) }))}>+10</button></div><button type="button" disabled={session.oatGrams !== 40} onClick={() => setAndAdvance()}>Klaar</button></div>}
        {step.mechanic === 'heat' && <div className="cooking-heat"><button type="button" className={session.actionCount > 0 ? 'is-selected' : ''} onClick={() => setSession(current => ({ ...current, actionCount: 1 }))}><img src={ASSET_LIBRARY.cooking.bananaPancakes.butter} alt="" />Boter</button><div aria-label="Warmtestand">{[1, 2, 3].map(level => <button key={level} type="button" className={session.heat === level ? 'is-selected' : ''} onClick={() => setSession(current => ({ ...current, heat: level as 1 | 2 | 3 }))}>{level}</button>)}</div><button type="button" disabled={session.actionCount === 0 || session.heat !== 2} onClick={() => setAndAdvance()}>Verwarm</button></div>}
        {step.mechanic === 'timed' && <div className="cooking-timed">{cookingPhase === 'pour' && <button type="button" onClick={() => { setCookingPhase('wait'); window.setTimeout(() => setCookingPhase('flip'), 2500); }}>Giet beslag</button>}{cookingPhase === 'wait' && <span className="cooking-timer">Even wachten…</span>}{cookingPhase === 'flip' && <button type="button" onClick={() => { setCookingPhase('pour'); setAndAdvance(); }}>Draai om</button>}</div>}
        {step.mechanic === 'optional' && <div className="cooking-optional"><button type="button" onClick={() => finish(true)}>Even afdekken</button><button type="button" onClick={() => finish(false)}>Meteen serveren</button></div>}
      </>}
    </div>
    <p className="cooking-experience__hint">{step.hint}</p>
  </section>;
}
