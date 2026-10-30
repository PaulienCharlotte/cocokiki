import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Minus, Plus, RotateCcw, Power, DoorOpen, Timer, Play, Thermometer } from 'lucide-react';
import { Button, IconButton } from '../../design-system';
import type { BowlContents, CookingStepConfig, CookingStepState, OvenState } from '../../data/cooking/preparation';
import { ovenCanStart } from '../../data/cooking/oven';
import CookingAssetImage from './CookingAssetImage';
import './baking.css';

export function IngredientVessel({ asset, contents, amount = 1 }: { asset: string; contents: BowlContents; amount?: number }) {
  return <div className={`baking-vessel baking-vessel--${contents}`}>
    <CookingAssetImage src={asset} />
    <span className="baking-vessel__contents" style={{ opacity: Math.min(1, amount) }} aria-hidden="true">
      {contents === 'berries' && Array.from({ length: 9 }, (_, i) => <i key={i} style={{ left: `${20 + (i % 3) * 26}%`, top: `${18 + Math.floor(i / 3) * 27}%` }} />)}
    </span>
  </div>;
}

export function MeasureInteraction({ step, state, onChange, onComplete }: {
  step: Extract<CookingStepConfig, { mechanic: 'measure' }>;
  state: CookingStepState; onChange: (patch: Partial<CookingStepState>) => void; onComplete: () => void;
}) {
  const reduced = useReducedMotion();
  const vesselRef = useRef<HTMLDivElement>(null);
  const level = Math.min(1, ((step.baseVolume ?? 0) + state.quantity) / (step.capacity ?? step.maximum));
  const add = (n: number) => onChange({ quantity: Math.max(0, Math.min(step.maximum, state.quantity + n)) });
  return <div className="baking-interaction">
    <div className={`baking-measure baking-measure--${step.vessel}`} ref={vesselRef}>
      <CookingAssetImage src={step.vesselAsset} />
      <span className="baking-measure__fluid" style={{ ['--vessel' as string]: `url(${step.vesselAsset})` }} aria-hidden="true">
        <span className={`baking-measure__liquid${step.liquid ? ` is-${step.liquid}` : ''}`} style={{ height: `${Math.min(82, level * 72)}%` }} />
      </span>
      {step.vessel === 'jug' && <div className="baking-measure__marks" aria-hidden="true">{[0, .25, .5, .75, 1].map(n => <span key={n} style={{ bottom: `${n * 100}%` }}>{Math.round((step.capacity ?? step.maximum) * n)}</span>)}</div>}
      <motion.button type="button" className="baking-measure__source" drag dragSnapToOrigin dragMomentum={false}
        whileTap={reduced ? undefined : { rotate: -20 }} onClick={() => add(step.increments[0])}
        onDragEnd={(_, info) => { const bounds = vesselRef.current?.getBoundingClientRect(); if (bounds && info.point.x >= bounds.left && info.point.x <= bounds.right && info.point.y >= bounds.top && info.point.y <= bounds.bottom) add(step.increments[0]); }}
        aria-label={`${step.title}: voeg ${step.increments[0]} ${step.unitLabel} toe`}><CookingAssetImage src={step.asset} /></motion.button>
    </div>
    <output className="baking-amount" aria-live="polite">{state.quantity} / {step.target} {step.unitLabel}</output>
    {step.baseVolume !== undefined && <span className="baking-caption">Samen ongeveer {step.baseVolume + state.quantity} ml · vul tot de lijn</span>}
    <div className="baking-controls">{step.increments.map(n => <Button key={n} variant="quiet" startIcon={<Plus />} onClick={() => add(n)}>{n} {step.unitLabel}</Button>)}</div>
    <div className="baking-controls">{step.increments.map(n => <Button key={`min${n}`} variant="quiet" startIcon={<Minus />} disabled={state.quantity === 0} onClick={() => add(-n)}>{n} {step.unitLabel}</Button>)}
      <IconButton label="Opnieuw afmeten" icon={<RotateCcw />} onClick={() => onChange({ quantity: 0 })} />
    </div>
    <Button disabled={state.quantity !== step.target} startIcon={<Check />} onClick={onComplete}>Toevoegen</Button>
  </div>;
}

export function PortionInteraction({ step, state, onChange, onComplete }: {
  step: Extract<CookingStepConfig, { mechanic: 'portion' }>;
  state: CookingStepState; onChange: (patch: Partial<CookingStepState>) => void; onComplete: () => void;
}) {
  const targetRef = useRef<HTMLDivElement>(null);
  const portions = Array.from({ length: step.target }, (_, i) => state.portions?.[i] ?? 0);
  const lined = state.lined ?? [];
  const fill = (index: number) => {
    if (!lined.includes(index)) return onChange({ lined: [...lined, index] });
    if (portions[index]) return;
    onChange({ portions: portions.map((value, i) => i === index ? 1 : value) });
  };
  const filled = portions.filter(Boolean).length;
  return <div className="baking-interaction">
    <motion.button className="baking-portion-source" type="button" drag dragSnapToOrigin dragMomentum={false}
      aria-label={lined.length < step.target ? 'Leg het volgende papieren vormpje klaar' : 'Vul het volgende vormpje'}
      onClick={() => { const next = lined.length < step.target ? portions.findIndex((_, i) => !lined.includes(i)) : portions.findIndex(n => !n); if (next >= 0) fill(next); }}
      onDragEnd={(_, info) => {
        const elements = targetRef.current?.querySelectorAll<HTMLElement>('[data-portion]');
        if (!elements) return;
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const b = element.getBoundingClientRect();
          if (info.point.x >= b.left && info.point.x <= b.right && info.point.y >= b.top && info.point.y <= b.bottom) { fill(Number(element.dataset.portion)); return; }
        }
      }}>
      <CookingAssetImage src={lined.length < step.target ? step.linerAsset : step.asset} />
    </motion.button>
    <div className="baking-pan" ref={targetRef}>
      <CookingAssetImage src={step.panAsset} />
      <div className={`baking-pan__slots${step.positions ? ' is-positioned' : ''}`} style={{ gridTemplateColumns: `repeat(${step.columns}, minmax(0, 1fr))` }}>
        {portions.map((value, i) => <button key={i} type="button" data-portion={i} className={`baking-pan__slot${value ? ' is-filled' : ''}`} onClick={() => fill(i)}
          style={step.positions?.[i] ? { left: `${step.positions[i].x}%`, top: `${step.positions[i].y}%` } : undefined}
          aria-label={`Vormpje ${i + 1}: ${value ? 'gevuld' : lined.includes(i) ? 'beslag toevoegen' : 'papier plaatsen'}`} disabled={value === 1}>
          {lined.includes(i) && <img src={value === 1 && step.linerFilledAsset ? step.linerFilledAsset : step.linerAsset} alt="" />}
          {value === 1 && !step.linerFilledAsset && <span className="baking-pan__batter"><i /><i /><i /></span>}
          {value === 1 && state.choice === 'sugar' && <b className="baking-pan__sugar" />}
        </button>)}
      </div>
    </div>
    <output aria-live="polite">{lined.length < step.target ? `${lined.length} van ${step.target} vormpjes klaargelegd` : `${filled} van ${step.target} gevuld`}</output>
    {filled === step.target && <><Button variant="quiet" onClick={() => onChange({ choice: state.choice === 'sugar' ? 'plain' : 'sugar' })} startIcon={state.choice === 'sugar' ? <Check /> : <Plus />}>Suiker bovenop</Button>
      <Button onClick={onComplete} startIcon={<Check />}>De oven in</Button></>}
  </div>;
}

export function OvenInteraction({ step, oven, onOvenChange, onComplete }: {
  step: Extract<CookingStepConfig, { mechanic: 'oven' }>; oven: OvenState;
  onOvenChange: (patch: Partial<OvenState>) => void; onComplete: () => void;
}) {
  const c = step.oven;
  const baking = oven.status === 'baking';
  const finished = oven.status === 'finished';
  const progress = Math.min(1, oven.elapsedMinutes / c.minimumMinutes);
  const feedback = oven.result === 'good' ? 'Mooi gebakken! Vraag een volwassene om hulp bij de hete vorm.' : oven.result === 'dark' ? 'Deze zijn te donker. Oefen opnieuw met minder warmte of een kortere tijd.' : 'Nog niet gaar. Je kunt ze iets langer bakken.';
  return <div className="baking-interaction">
    <div className={`baking-oven${oven.powered ? ' is-warm' : ''}`}>
      <img src={`/assets/library/treehouse/furnishings/oven${oven.doorOpen ? '-open' : ''}.webp`} alt={oven.doorOpen ? 'Open oven' : 'Gesloten oven'} />
      {oven.trayPlaced && <div className="baking-oven__tray"><img src={step.panAsset} alt="Bakvorm in de oven" /><span className="baking-oven__food" style={{ gridTemplateColumns: `repeat(${Math.min(4, step.portions)}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${Math.ceil(step.portions / 4)}, minmax(0, 1fr))`, transform: `scaleY(${.45 + progress * .55})`, filter: `brightness(${oven.result === 'dark' ? .55 : .85 + progress * .15})` }}>{Array.from({ length: step.portions }, (_, i) => <span key={i} className="baking-oven__piece"><i style={{ opacity: 1 - progress }} /><img src={step.resultAsset} alt="" style={{ opacity: progress }} /></span>)}</span></div>}
    </div>
    {step.action !== 'cool' && <label className="baking-slider"><Thermometer aria-hidden="true" /> Oven: {oven.temperature} °C
      <input type="range" min={c.minimumTemperature} max={c.maximumTemperature} step={c.temperatureStep} value={Math.max(c.minimumTemperature, oven.temperature)} aria-label="Oventemperatuur" disabled={baking} onChange={e => onOvenChange({ temperature: Number(e.target.value), preheated: false, ...(oven.powered ? { status: 'preheating' } : {}) })} />
      <span className="baking-controls"><IconButton label="Temperatuur lager" icon={<Minus />} disabled={baking || oven.temperature <= c.minimumTemperature} onClick={() => onOvenChange({ temperature: Math.max(c.minimumTemperature, oven.temperature - c.temperatureStep), preheated: false })} /><IconButton label="Temperatuur hoger" icon={<Plus />} disabled={baking || oven.temperature >= c.maximumTemperature} onClick={() => onOvenChange({ temperature: Math.min(c.maximumTemperature, Math.max(c.minimumTemperature, oven.temperature + c.temperatureStep)), preheated: false })} /></span>
    </label>}
    {step.action === 'preheat' && <>
      <p>Verwarm voor op {c.targetTemperature} °C.</p>
      {!oven.powered ? <Button startIcon={<Power />} disabled={oven.temperature !== c.targetTemperature} onClick={() => onOvenChange({ powered: true, status: 'preheating', chosenMinutes: c.minimumMinutes })}>Oven aan</Button>
        : <Button disabled={oven.temperature !== c.targetTemperature} onClick={onComplete}>Verder met het beslag</Button>}
    </>}
    {step.action === 'bake' && <>
      <p role="status">{finished ? feedback : oven.preheated ? 'De oven is warm.' : 'De oven warmt op.'}</p>
      {!(finished && oven.result === 'good') && <div className="baking-controls"><Button variant="quiet" startIcon={<DoorOpen />} disabled={baking} onClick={() => onOvenChange({ doorOpen: !oven.doorOpen })}>{oven.doorOpen ? 'Deur sluiten' : 'Deur openen'}</Button>
        {oven.doorOpen && <Button variant="quiet" disabled={oven.trayPlaced} onClick={() => onOvenChange({ trayPlaced: true })}>Bakvorm plaatsen</Button>}</div>}
      {!finished && <label className="baking-slider"><Timer aria-hidden="true" /> Baktijd: {oven.chosenMinutes} minuten
        <input type="range" min={c.minimumSelectableMinutes} max={c.maximumSelectableMinutes} step="1" aria-label="Baktijd in minuten" value={oven.chosenMinutes || c.minimumMinutes} disabled={baking} onChange={e => onOvenChange({ chosenMinutes: Number(e.target.value) })} />
      </label>}
      <span className="baking-caption">Recept: {c.minimumMinutes}–{c.maximumMinutes} minuten · 1 bakminuut duurt hier {c.gameSecondsPerMinute} seconden.</span>
      {baking ? <><progress max={oven.chosenMinutes} value={oven.elapsedMinutes} aria-label="Bakvoortgang" /><output>{oven.elapsedMinutes.toFixed(1)} / {oven.chosenMinutes} bakminuten</output></>
        : !finished ? <Button startIcon={<Play />} disabled={!ovenCanStart(oven, c)} onClick={() => onOvenChange({ status: 'baking', result: null })}>Start bakken</Button>
        : oven.result === 'good' ? <Button onClick={onComplete}>Haal ze uit de oven</Button>
        : oven.result === 'underdone' ? <Button disabled={!ovenCanStart({ ...oven, chosenMinutes: oven.elapsedMinutes + 3 }, c)} onClick={() => onOvenChange({ chosenMinutes: Math.min(90, oven.elapsedMinutes + 3), status: 'baking', result: null })}>Nog 3 bakminuten</Button>
        : <Button startIcon={<RotateCcw />} onClick={() => onOvenChange({ status: 'ready', result: null, elapsedMinutes: 0, heatExposure: 0, chosenMinutes: c.minimumMinutes })}>Oefen het bakken opnieuw</Button>}
    </>}
    {step.action === 'cool' && <>
      {oven.status !== 'cooling' && oven.status !== 'served' ? <Button disabled={!oven.doorOpen} onClick={() => onOvenChange({ trayPlaced: false, powered: false, status: 'cooling', coolingElapsed: 0 })}>Zet de vorm op het rooster</Button> : <div className="baking-cooling"><svg viewBox="0 0 200 140" aria-hidden="true"><rect x="5" y="5" width="190" height="130" rx="6" fill="none" stroke="currentColor" strokeWidth="3" />{Array.from({ length: 11 }, (_, i) => <line key={i} x1={15 + i * 17} x2={15 + i * 17} y1="5" y2="135" stroke="currentColor" strokeWidth="2" />)}<path d="M5 40H195M5 70H195M5 100H195" fill="none" stroke="currentColor" strokeWidth="2" /></svg><CookingAssetImage className="baking-cooled" src={step.resultAsset} /></div>}
      {!oven.doorOpen && oven.status !== 'served' && <Button variant="quiet" onClick={() => onOvenChange({ doorOpen: true })}>Open de oven</Button>}
      {oven.status === 'cooling' && <><progress max={c.coolingSeconds} value={oven.coolingElapsed} aria-label="Afkoelen" /><span>Even laten afkoelen…</span></>}
      {oven.status === 'served' && <Button startIcon={<Check />} onClick={onComplete}>Serveren</Button>}
    </>}
  </div>;
}
