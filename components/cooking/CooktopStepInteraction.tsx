import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Button } from '../../design-system';
import type { CookingStepConfig, CookingStepState } from '../../data/cooking/preparation';
import type { CooktopZoneId } from '../../data/cooking/cooktopScene';
import CooktopCanvas from './CooktopCanvas';

interface Props {
  step: CookingStepConfig;
  state: CookingStepState;
  zoneId: CooktopZoneId;
  onChange: (patch: Partial<CookingStepState>) => void;
  onComplete: (patch?: Partial<CookingStepState>) => void;
}
export default function CooktopStepInteraction({ step, state, zoneId, onChange, onComplete }: Props) {
  const [landed, setLanded] = useState(false);
  const [now, setNow] = useState(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = useRef(state.count);
  const reduced = useReducedMotion();
  useEffect(() => { count.current = state.count; }, [state.count]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  useEffect(() => {
    if (step.mechanic !== 'timed' || state.phase !== 'wait') return;
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, [step.id, state.phase]);
  const timed = step.mechanic === 'timed';
  const adding = step.cooktop?.kind === 'add';
  const stirring = step.cooktop?.kind === 'stir';
  const waiting = timed && state.phase === 'wait';
  const ready = timed && state.phase === 'flip';
  const elapsed = timed && state.readyAt !== null ? Math.max(0, Math.min(step.durationMs, step.durationMs - (state.readyAt - now))) : 0;
  const pan = step.cooktop?.panAsset ?? (timed ? ready ? step.cookedAsset : step.presentation === 'whole' && waiting ? step.pouredAsset : step.asset : step.asset);
  const contents = adding && landed ? step.cooktop?.ingredient === 'tomato' ? step.cooktop.contents === 'pepper' ? 'vegetables' : 'tomato' : 'pepper' : step.cooktop?.contents;
  const add = () => {
    if (timer.current || landed) return;
    setLanded(true);
    timer.current = setTimeout(() => onComplete({ count: 1 }), reduced ? 0 : 450);
  };
  const stir = () => {
    const next = Math.min(step.target, count.current + 1);
    if (next === count.current) return;
    count.current = next;
    if (next === step.target) onComplete({ count: next }); else onChange({ count: next });
  };
  return <div className={`heat-scene cooktop-step${waiting ? ' is-simmering' : ''}`}>
    <header className="heat-scene__caption"><h1 id="cooking-step-title">{step.title}</h1><p>{stirring ? 'Maak rondjes in de pan. Tikken mag ook.' : step.instruction}</p></header>
    <div className="heat-scene__stage"><CooktopCanvas panAsset={pan} zoneId={state.cooktopZone ?? zoneId} additionAsset={step.asset}
      additionLabel={step.mechanic === 'drag' ? step.dropTarget.sourceLabel : ''} added={!adding || landed} oil={false} warming={waiting}
      ingredient={step.cooktop?.ingredient} contents={contents} turn={stirring ? state.count * 22 : 0} pouring={landed}
      overlayAsset={timed && step.presentation !== 'whole' && waiting ? step.pouredAsset : undefined}
      onStir={stirring ? stir : undefined} onPlace={cooktopZone => onChange({ cooktopZone })} onAdd={add} />
    </div>
    <div className="heat-scene__controls cooktop-step__controls">
      {adding && <p role="status">{landed ? 'De stukjes vallen in de pan.' : 'Sleep de stukjes naar de pan of tik erop.'}</p>}
      {stirring && <><progress max={step.target} value={state.count} aria-label="Roeren" /><span>{state.count} / {step.target}</span><Button variant="quiet" onClick={stir}>Roer om</Button></>}
      {timed && <>
        {state.phase === 'pour' && <Button onClick={() => onChange({ phase: 'wait', readyAt: Date.now() + step.durationMs })}>{step.startLabel}</Button>}
        {waiting && <><progress max={step.durationMs} value={elapsed} aria-label="Kooktijd" /><span role="status">Even laten garen…</span></>}
        {ready && <Button onClick={() => onComplete()}>{step.finishLabel}</Button>}
        <small>De speltijd is korter. Volg thuis het recept.</small>
      </>}
    </div>
  </div>;
}
