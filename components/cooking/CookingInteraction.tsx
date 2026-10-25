import React, { useEffect, useRef } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { motion, useAnimationControls } from 'framer-motion';
import type { CookingStepConfig, CookingStepState } from '../../data/cooking/preparation';
import CookingAssetImage from './CookingAssetImage';
import DragToTarget from './DragToTarget';
import KitchenScale from './KitchenScale';

interface Props {
  step: CookingStepConfig;
  state: CookingStepState;
  onChange: (patch: Partial<CookingStepState>) => void;
  onComplete: (patch?: Partial<CookingStepState>) => void;
  onMiss: (message: string) => void;
}
function frameFor(frames: string[] | undefined, count: number, fallback: string) {
  return frames?.length ? frames[Math.min(count, frames.length - 1)] : fallback;
}
export default function CookingInteraction({ step, state, onChange, onComplete, onMiss }: Props) {
  const toolControls = useAnimationControls();
  const vesselControls = useAnimationControls();
  const countRef = useRef(state.count);
  useEffect(() => { countRef.current = state.count; }, [state.count]);
  useEffect(() => {
    if (step.mechanic !== 'timed' || state.phase !== 'wait' || state.readyAt === null) return;
    const timer = window.setTimeout(() => onChange({ phase: 'flip' }), Math.max(0, state.readyAt - Date.now()));
    return () => window.clearTimeout(timer);
  }, [step.id, state.phase, state.readyAt, onChange]);

  if (step.mechanic === 'collect') return <div className="cooking-tools">
    {step.tools.map(({ id, label, asset }) => {
      const selected = state.selectedTools.includes(id);
      return <button key={id} type="button" className={`cooking-tool${selected ? ' is-selected' : ''}`} onClick={() => {
        if (selected) return;
        const selectedTools = [...state.selectedTools, id];
        if (step.tools.every(tool => selectedTools.includes(tool.id))) onComplete({ selectedTools });
        else onChange({ selectedTools });
      }}><img src={asset} alt="" /><span>{label}</span>{selected && <i className="cooking-tool__check" aria-hidden="true"><Check /></i>}</button>;
    })}
  </div>;

  if (step.mechanic === 'drag') return <DragToTarget sourceAsset={step.asset} sourceLabel={step.dropTarget.sourceLabel} targetLabel={step.dropTarget.label} targetAsset={step.dropTarget.asset}
    onHit={() => onComplete({ count: 1 })} onMiss={() => onMiss(`Laat los op de ${step.dropTarget.label.toLowerCase()}.`)} />;

  if (step.mechanic === 'repeat') {
    const repeat = () => {
      const count = Math.min(step.target, countRef.current + 1);
      countRef.current = count;
      toolControls.start({ y: [0, 26, 0], rotate: [0, -14, 0], transition: { duration: .4, ease: 'easeInOut' } });
      vesselControls.start({ scale: [1, 1.05, 1], transition: { duration: .35, ease: 'easeInOut' } });
      if (count >= step.target) onComplete({ count }); else onChange({ count });
    };
    return <div className="cooking-tap"><div className="cooking-tap__scene">
      <motion.div className="cooking-tap__vessel" animate={vesselControls}><CookingAssetImage src={frameFor(step.vesselByCount, state.count, step.asset)} /></motion.div>
      {step.tapTool ? <motion.button type="button" className="cooking-tap__tool" animate={toolControls} whileHover={{ scale: 1.05 }} whileTap={{ scale: .92 }} onClick={repeat} aria-label={`${step.title}, tik ${step.target} keer`}>
        <CookingAssetImage src={frameFor(step.toolByCount, state.count, step.tapTool.asset)} />
      </motion.button> : <motion.button type="button" className="cooking-tap__overlay" whileTap={{ scale: .94, rotate: -2 }} onClick={repeat} aria-label={`${step.title}, tik ${step.target} keer`} />}
    </div><span className="cooking-tap__label">{step.tapLabel ?? 'Tik op het plaatje'}</span><div className="cooking-dots" aria-label={`${state.count} van ${step.target}`}>
      {Array.from({ length: step.target }, (_, index) => <i key={index} className={index < state.count ? 'is-done' : ''} />)}
    </div></div>;
  }
  if (step.mechanic === 'weigh') {
    const suffix = step.unit === 'gram' ? 'g' : 'ml';
    const change = (delta: number) => onChange({ quantity: Math.max(0, Math.min(step.maximum, state.quantity + delta)) });
    return <div className="cooking-weighing"><KitchenScale value={state.quantity} full={step.target} ingredientImage={step.asset} unit={suffix} />
      <div className="cooking-weighing__controls">
        {step.increments.map(increment => <button key={increment} type="button" className={`cooking-chip is-add-${increment === 5 ? 5 : 10}`} onClick={() => change(increment)}>+{increment} {suffix}</button>)}
        <button type="button" className="cooking-chip is-subtract" onClick={() => change(-step.increments[0])}>−{step.increments[0]} {suffix}</button>
        <button type="button" className="cooking-chip is-reset" onClick={() => onChange({ quantity: 0 })} aria-label="Weegschaal leegmaken"><RotateCcw /></button>
      </div><button type="button" className="cooking-button" disabled={state.quantity !== step.target} onClick={() => onComplete()}>
        {state.quantity === step.target ? `Precies ${step.target} ${step.unit === 'gram' ? 'gram' : 'milliliter'}!` : `Maak er ${step.target} ${step.unit === 'gram' ? 'gram' : 'milliliter'} van`}
      </button></div>;
  }
  if (step.mechanic === 'heat') return <div className="cooking-heating">
    <motion.div className="cooking-heating__pan" animate={state.count > 0 ? { scale: [1, 1.05, 1] } : {}} transition={{ duration: .4 }}><CookingAssetImage src={step.asset} /></motion.div>
    <button type="button" className={`cooking-choice${state.count > 0 ? ' is-selected' : ''}`} onClick={() => onChange({ count: 1 })}><img src={step.addition.asset} alt="" /><span>{step.addition.label}</span>{state.count > 0 && <i className="cooking-tool__check" aria-hidden="true"><Check /></i>}</button>
    <div className="cooking-heating__levels" role="group" aria-label="Warmtestand">{step.levels.map(level => <button key={level.value} type="button" className={`cooking-chip${state.heat === level.value ? ' is-selected' : ''}`} onClick={() => onChange({ heat: level.value })}>{level.label}</button>)}</div>
    <button type="button" className="cooking-button" disabled={state.count === 0 || state.heat !== step.target} onClick={() => onComplete()}>{step.buttonLabel}</button>
  </div>;
  if (step.mechanic === 'timed') return <div className="cooking-baking"><div className="cooking-baking__pan">
    <CookingAssetImage src={state.phase === 'flip' ? step.cookedAsset : step.asset} />
    {state.phase === 'wait' && <motion.span className="cooking-baking__pancake" initial={{ scale: .5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 18 }}><CookingAssetImage src={step.pouredAsset} /></motion.span>}
  </div>
    {state.phase === 'pour' && <button type="button" className="cooking-button" onClick={() => onChange({ phase: 'wait', readyAt: Date.now() + step.durationMs })}>{step.startLabel}</button>}
    {state.phase === 'wait' && <span className="cooking-baking__timer" role="status">Even wachten…</span>}
    {state.phase === 'flip' && <button type="button" className="cooking-button" onClick={() => onComplete()}>{step.finishLabel}</button>}
  </div>;
  if (step.mechanic === 'optional') return <div className="cooking-baking"><CookingAssetImage className="cooking-baking__art" src={step.asset} /><div className="cooking-choices">
    {step.choices.map((choice, index) => <button key={choice.id} type="button" className={`cooking-button${index ? ' is-quiet' : ''}`} onClick={() => onComplete({ choice: choice.id })}>{choice.label}</button>)}
  </div></div>;
  return null;
}
