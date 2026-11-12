import React, { useEffect, useRef, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import { Button } from '../../design-system';
import type { CookingStepConfig, CookingStepState } from '../../data/cooking/preparation';
import CooktopCanvas from './CooktopCanvas';
import { isCooktopZone } from '../../data/cooking/cooktopScene';
import './heat-interaction.css';

type Verwarmstap = Extract<CookingStepConfig, { mechanic: 'heat' }>;
interface Props {
  step: Verwarmstap;
  state: CookingStepState;
  onChange: (patch: Partial<CookingStepState>) => void;
  onComplete: (patch?: Partial<CookingStepState>) => void;
  onMiss: (message: string) => void;
}

/** De bestaande count en heat blijven de bron van waarheid, ook na hervatten. */
export default function HeatInteraction({ step, state, onChange, onComplete, onMiss }: Props) {
  const [verwarmt, setVerwarmt] = useState(false);
  const bewegingVerminderen = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draaiknop = useRef<HTMLDivElement>(null);
  const gebaar = useRef<{ x: number; y: number; gesleept: boolean } | null>(null);
  const toevoeging = step.addition.kind === 'oil' ? 'Afgemeten olie' : step.addition.kind === 'water' ? 'Water' : step.addition.label;
  const toegevoegd = state.count > 0 || step.addition.kind === 'ready';
  const zoneId = isCooktopZone(state.cooktopZone) ? state.cooktopZone : toegevoegd ? 'large' : undefined;
  const standen = [{ value: 0, label: 'Uit' }, ...step.levels];
  const doel = step.levels.find(stand => stand.value === step.target)!;
  const gekozen = standen.find(stand => stand.value === state.heat) ?? standen[0];
  const index = standen.indexOf(gekozen);
  const hoek = -120 + index / (standen.length - 1) * 240;
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const kies = (nieuwIndex: number) => {
    if (verwarmt) return;
    onChange({ heat: standen[Math.max(0, Math.min(standen.length - 1, nieuwIndex))].value });
  };
  const wijs = (event: React.PointerEvent<HTMLDivElement>) => {
    const vak = draaiknop.current!.getBoundingClientRect();
    const graden = Math.atan2(event.clientX - vak.left - vak.width / 2, -(event.clientY - vak.top - vak.height / 2)) * 180 / Math.PI;
    kies(Math.round((Math.max(-120, Math.min(120, graden)) + 120) / 240 * (standen.length - 1)));
  };
  const aanzetten = () => {
    if (timer.current || !toegevoegd || !zoneId || state.heat !== step.target) return;
    setVerwarmt(true);
    timer.current = setTimeout(() => onComplete({ count: 1 }), bewegingVerminderen ? 350 : 1100);
  };

  return <MotionConfig reducedMotion="user"><div className={`heat-scene${toegevoegd ? ' has-addition' : ''}${verwarmt ? ' is-warming' : ''}`}>
    <header className="heat-scene__caption">
      <h1 id="cooking-step-title">{!zoneId ? 'Zet de pan op een kookzone' : toegevoegd ? `Zet het vuur op ${doel.label.toLowerCase()}` : step.addition.label}</h1>
      <p>{!zoneId ? 'Sleep de pan of tik een kookzone aan.' : toegevoegd ? 'Draai aan de knop of tik erop.' : 'Sleep naar de pan. Tikken mag ook.'}</p>
    </header>
    <div className="heat-scene__stage">
      <CooktopCanvas panAsset={step.asset} zoneId={zoneId} added={toegevoegd} oil={step.addition.kind === 'oil'} warming={verwarmt}
        additionAsset={step.addition.asset} additionLabel={toevoeging} onPlace={cooktopZone => onChange({ cooktopZone })} onAdd={() => onChange({ count: 1 })} />
    </div>
    {toegevoegd && <div className="heat-scene__controls">
      <div className="heat-dial" ref={draaiknop} role="slider" tabIndex={verwarmt ? -1 : 0} aria-label="Warmtestand" aria-valuemin={0} aria-valuemax={standen.length - 1} aria-valuenow={index} aria-valuetext={gekozen.label} aria-disabled={verwarmt}
        onPointerDown={event => { if (verwarmt) return; event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus(); gebaar.current = { x: event.clientX, y: event.clientY, gesleept: false }; }}
        onPointerMove={event => { const start = gebaar.current; if (!start) return; if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) start.gesleept = true; if (start.gesleept) wijs(event); }}
        onPointerUp={event => { const start = gebaar.current; gebaar.current = null; if (!start) return; if (!start.gesleept) kies((index + 1) % standen.length); event.currentTarget.releasePointerCapture(event.pointerId); }}
        onPointerCancel={() => { gebaar.current = null; }}
        onKeyDown={event => {
          if (verwarmt) return;
          if (['ArrowRight', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'Home', 'End', ' ', 'Enter'].includes(event.key)) event.preventDefault();
          if (['ArrowRight', 'ArrowUp', ' ', 'Enter'].includes(event.key)) kies(Math.min(index + 1, standen.length - 1));
          if (['ArrowLeft', 'ArrowDown'].includes(event.key)) kies(index - 1);
          if (event.key === 'Home') kies(0);
          if (event.key === 'End') kies(standen.length - 1);
        }}>
        <svg viewBox="0 0 180 140" aria-hidden="true">
          {standen.map((stand, i) => {
            const rad = (-120 + i / (standen.length - 1) * 240) * Math.PI / 180;
            return <g key={stand.value} className={stand.value === gekozen.value ? 'is-selected' : ''}>
              <line x1={90 + Math.sin(rad) * 47} y1={76 - Math.cos(rad) * 47} x2={90 + Math.sin(rad) * 53} y2={76 - Math.cos(rad) * 53} />
              <text x={90 + Math.sin(rad) * 70} y={80 - Math.cos(rad) * 66} textAnchor="middle">{stand.label}</text>
            </g>;
          })}
          <circle cx="90" cy="76" r="38" className="heat-dial__knob" />
          <line x1="90" y1="68" x2="90" y2="48" className="heat-dial__needle" transform={`rotate(${hoek} 90 76)`} />
        </svg>
      </div>
      <div className="heat-scene__action">
        <p role="status">{verwarmt ? 'De pan warmt op…' : gekozen.value === doel.value ? `${gekozen.label}, zo staat hij goed.` : `Kies ${doel.label.toLowerCase()}.`}</p>
        <Button disabled={verwarmt || state.heat !== step.target} onClick={aanzetten}>{verwarmt ? 'Even opwarmen…' : step.buttonLabel}</Button>
      </div>
    </div>}
  </div></MotionConfig>;
}
