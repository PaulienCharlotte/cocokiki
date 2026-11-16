import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Check, Droplets, Lightbulb, Minus, Plus, Ruler, ShoppingBasket, Sprout, Leaf, X } from 'lucide-react';
import GardenCropFacts from '../components/plants/GardenCropFacts';
import { GARDEN_CROPS, GARDEN_CROPS_BY_ID, SEASONS, formatGardenNumber, gardenNeighbours, gardenPairAdvice, gardenSeason, gardenTask, type GardenCrop } from '../data/plants/garden';
import { GARDEN_KEY, gardenNeedsCare, currentGardenPart, gardenPartKey, harvestGarden, loadGarden, nextGardenDay, plantGardenPlot, revealGardenAnswer, setGardenLevel, solveGardenPart, useGardenHarvest, type GardenPlot } from '../services/garden';
import { subscribeLocalState } from '../services/localState';
import { CHARACTERS } from '../data/characters';
import DragChoice from '../games/math/DragChoice';
import Maten from '../games/math/Maten';
import './garden.css';

const stages = ['Plant je rij', 'Zaadjes in de grond', 'Kiemplantjes', 'Groeiende planten', 'Klaar om te oogsten'];
const kiki = CHARACTERS.kiki;

/** Kiki praat linksonder; zij is de enige stem in de moestuin. */
function Kiki({ blij = false, children }: { blij?: boolean; children: React.ReactNode }) {
  return <div className={`ck-zone-personage tuin-personage${blij ? ' is-blij' : ''}`}>
    <img className="ck-ballon__gezicht" src={kiki.beeld} alt={kiki.naam} />
    <p className="ck-ballon__tekst" role="status"><span className="ck-ballon__naam">KIKI</span>{children}</p>
  </div>;
}

/** Een glazen paneel dat van rechts over de tuin schuift, met een houten titel. */
function Paneel({ open, titel, onClose, children }: { open: boolean; titel: string; onClose: () => void; children: React.ReactNode }) {
  // Dicht staat het paneel buiten beeld en zonder inhoud, zodat je er niet naartoe kunt tabben.
  return <aside className={`ck-paneel ck-glas tuin-paneel${open ? ' is-open' : ''}`} aria-hidden={!open} aria-label={titel}>
    {open && <><header className="tuin-paneel__kop"><h2 className="ck-houtbord tuin-paneel__titel">{titel}</h2><button type="button" className="ck-gereedschap" aria-label="Sluiten" onClick={onClose}><X size={22} aria-hidden="true" /></button></header>
      {children}</>}
  </aside>;
}

/** Vier antwoorden rond het goede: de veelgemaakte fout is een factor 10 ernaast. */
export function gardenOptions(answer: number): number[] {
  const rond = (value: number) => Number(value.toPrecision(6));
  const set = new Set([rond(answer)]);
  for (const kandidaat of [answer * 10, answer / 10, answer * 100, answer + 1, answer * 2, answer / 100]) {
    if (set.size >= 4) break;
    const waarde = rond(kandidaat);
    if (waarde > 0) set.add(waarde);
  }
  return [...set].sort((a, b) => a - b);
}

export default function GardenScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [state, setState] = useState(loadGarden);
  const [selected, setSelected] = useState<number | null>(null);
  const [paneel, setPaneel] = useState<'kiezen' | 'kalender' | 'oogst' | 'gewas' | null>(null);
  const [maten, setMaten] = useState(false);
  const [facts, setFacts] = useState<GardenCrop | null>(null);
  const [notice, setNotice] = useState('');
  const [hint, setHint] = useState(0), [hintLicht, setHintLicht] = useState(false);
  const [blij, setBlij] = useState(false);
  const blijTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => subscribeLocalState(() => setState(loadGarden()), GARDEN_KEY), []);
  useEffect(() => () => { if (blijTimer.current) clearTimeout(blijTimer.current); }, []);
  const refresh = () => setState(loadGarden());
  const juich = () => { setBlij(true); if (blijTimer.current) clearTimeout(blijTimer.current); blijTimer.current = setTimeout(() => setBlij(false), 1400); };
  const act = (ok: boolean, message: string) => { refresh(); setNotice(ok ? message : 'Opslaan lukte niet of dit vak is veranderd. Probeer het opnieuw.'); if (ok) { setSelected(null); setPaneel(null); } };
  const kies = (index: number | null) => { setSelected(current => current === index ? null : index); setHint(0); setHintLicht(false); setNotice(''); setPaneel(index !== null && !state.plots[index] && selected !== index ? 'kiezen' : null); };
  const season = gardenSeason(state.day);
  const plot = selected === null ? null : state.plots[selected];
  const crop = plot ? GARDEN_CROPS_BY_ID[plot.cropId] : null;
  const waiting = !!plot && plot.step > 0 && plot.step < 4 && plot.lastCareDay >= state.day;
  const inTaak = !!plot && !!crop && plot.step < 4 && !waiting;
  const harvests = state.harvests.filter(harvest => !harvest.destination);
  const taak = inTaak && plot && crop ? gardenTask(crop, plot.step, state.level) : null;
  const deel = plot && inTaak ? currentGardenPart(plot) : null;
  // Wat er aan het gekozen vak hangt: de maat die bij deze opdracht hoort.
  const kaartje = !plot || !crop ? null : inTaak && taak ? deel === 'conversion' ? plot.step === 0 ? `${formatGardenNumber(crop.spacing)} cm` : '10 cl' : plot.step === 0 ? `${formatGardenNumber(crop.spacing)} cm` : `${taak.waterMl} ml` : crop.name;
  const hintKnop = () => {
    if (inTaak && plot && selected !== null) {
      // Eerst een tip van Kiki; tik je nog eens, dan doet ze het voor (zonder beloning).
      if (hint === 0) { setHint(1); return; }
      if (!plot.helpedParts?.includes(gardenPartKey(plot))) { const ok = revealGardenAnswer(selected, plot.id, plot.step, currentGardenPart(plot)); refresh(); if (!ok) setNotice('De hulp kon niet worden opgeslagen. Probeer het opnieuw.'); }
      setHint(0); setHintLicht(false); return;
    }
    setHint(value => value ? 0 : 1);
  };
  const zin = notice || (selected === null
    ? hint ? 'Kies een vak, meet de ruimte en geef afgemeten water. Na drie keer verzorgen kun je oogsten.'
      : gardenNeedsCare(state) ? 'Verzorg eerst je geplante vakken. Tik op een vak met een druppel.' : `Het is ${SEASONS[season].toLowerCase()}. Tik op een vak om te zaaien.`
    : !plot ? `Het is ${SEASONS[season].toLowerCase()}. Kies wat je in vak ${selected + 1} wilt laten groeien.`
    : plot.step === 4 ? `Oogsttijd. ${crop?.yieldLabel}.`
    : waiting ? 'Deze plant heeft vandaag water gehad. Verzorg een ander vak of ga naar de volgende tuindag.' : '');
  const buren = selected !== null && crop ? gardenNeighbours(selected).filter(index => state.plots[index]).map(index => gardenPairAdvice(crop, GARDEN_CROPS_BY_ID[state.plots[index]!.cropId])).join(' ') : '';
  return <main className="ck-scherm tuin" data-wereld="tuin" aria-labelledby="garden-title" onPointerMove={event => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--ck-glans-x', `${50 + ((event.clientX - rect.left) / rect.width - .5) * 80}%`);
  }}>
    <img className="tuin__achtergrond" src="/assets/library/plants/garden/terrain-natural.webp" alt="" />
    <h1 id="garden-title" className="sr-only">Mijn moestuin</h1>

    {/* 2. Statuseiland: tuindag, groei van het gekozen vak, niveau */}
    <div className="ck-zone-status ck-glas tuin-status">
      <button type="button" className="tuin-volgende-dag" disabled={gardenNeedsCare(state)} title={gardenNeedsCare(state) ? 'Verzorg eerst je planten vandaag' : 'Volgende tuindag'} aria-label={`Tuindag ${state.day}, ${SEASONS[season]}. Volgende tuindag`} onClick={() => { kies(null); act(nextGardenDay(), 'Een nieuwe tuindag. Kijk welke vakken water nodig hebben.'); }}><span><b className="tuin-dag">Tuindag {state.day}</b><small className="tuin-seizoen">{SEASONS[season]}</small></span><ArrowRight size={20} aria-hidden="true" /></button>
      {plot && <><span className="tuin-scheid" aria-hidden="true" /><span className="tuin-stippen" role="img" aria-label={stages[plot.step]}>{stages.slice(1).map((_, i) => <span key={i} className={`ck-stip${i < plot.step ? ' ck-stip--klaar' : ''}${i === plot.step ? ' ck-stip--nu' : ''}`} />)}</span></>}
      <button type="button" className="ck-niveau tuin-niveau" aria-label={`Rekenniveau ${state.level}, tik voor een ander niveau`} onClick={() => { if (!setGardenLevel(state.level % 3 + 1)) setNotice('Het niveau kon niet worden opgeslagen.'); refresh(); }}>Niveau {state.level}</button>
    </div>

    {/* 4. Gereedschap in de vaste volgorde: hint · maten · kalender · mand */}
    <nav className="ck-zone-gereedschap ck-glas tuin-gereedschap" aria-label="Gereedschap">
      <button type="button" className={`ck-gereedschap${hint || hintLicht ? ' is-aan' : ''}`} aria-label={inTaak && hint ? 'Laat Kiki het voordoen' : 'Hint van Kiki'} onClick={hintKnop}><Lightbulb size={22} aria-hidden="true" /></button>
      <button type="button" className={`ck-gereedschap${maten ? ' is-aan' : ''}`} aria-label="Maten omrekenen" onClick={() => setMaten(true)}><Ruler size={22} aria-hidden="true" /></button>
      <button type="button" className={`ck-gereedschap${paneel === 'kalender' ? ' is-aan' : ''}`} aria-label={`Groeikalender, tuindag ${state.day}, ${SEASONS[season]}`} onClick={() => setPaneel(paneel === 'kalender' ? null : 'kalender')}><CalendarDays size={22} aria-hidden="true" /></button>
      <button type="button" className={`ck-gereedschap tuin-mand${paneel === 'oogst' ? ' is-aan' : ''}`} aria-label={`Mijn oogst, ${harvests.length} mandjes`} onClick={() => setPaneel(paneel === 'oogst' ? null : 'oogst')}><ShoppingBasket size={22} aria-hidden="true" />{harvests.length > 0 && <span className="tuin-mand__aantal" aria-hidden="true">{harvests.length}</span>}</button>
    </nav>

    {/* 7. Speelveld: de zes bakken. Tik naast een bak om terug te gaan naar je hele tuin. */}
    <div className="tuin__veld" onClick={event => { if (event.target === event.currentTarget) kies(null); }}>
      <div className="garden__beds" aria-label="Zes tuinvakken" onClick={event => { if (event.target === event.currentTarget) kies(null); }}>
        {state.plots.map((plot, index) => <div className="tuin-bak" key={index}>
          <button type="button" className={`garden-bed${plot ? ` garden-bed--${plot.step}` : ''}${selected === index ? ' is-gekozen' : ''}`} onClick={() => kies(index)} aria-pressed={selected === index} aria-label={`Vak ${index + 1}: ${plot ? `${GARDEN_CROPS_BY_ID[plot.cropId].name}, ${stages[plot.step]}` : 'leeg, kies een gewas'}`}>
            <img className="garden-bed__soil" src="/assets/library/plants/garden/bed-earth.webp" alt="" />
            <span className="garden-bed__plants" aria-hidden="true">{!plot ? <Plus /> : plot.step === 0 ? <Leaf /> : Array.from({ length: 4 }, (_, index) => <span key={index} className="garden-bed__plant">{plot.step === 1 ? <span className="garden-bed__seed" /> : <img src="/assets/library/plants/garden/seedling-natural.webp" alt="" />}</span>)}</span>
            {plot?.step === 4 && <img className="garden-bed__harvest" src={GARDEN_CROPS_BY_ID[plot.cropId].image} alt="" />}
            {plot && plot.step < 4 && <span className="garden-bed__care ck-glas" aria-hidden="true">{plot.step === 0 ? <Sprout /> : plot.lastCareDay >= state.day ? <Check /> : <Droplets />}</span>}
          </button>
          {selected === index && <div className="ck-doel tuin-doel" aria-hidden="true" />}
          {selected === index && kaartje ? <button type="button" className="ck-hangkaartje tuin-hangkaartje" aria-label={crop ? `Over ${crop.name}` : undefined} onClick={() => { if (crop) { setFacts(crop); setPaneel('gewas'); } }}>
            <span className="ck-hangkaartje__touw" /><span className="ck-hangkaartje__label ck-glas">{kaartje}{inTaak && crop && <small>{crop.name}</small>}</span>
          </button> : <span className="tuin-bordje ck-glas" aria-hidden="true">{plot ? GARDEN_CROPS_BY_ID[plot.cropId].name : `Vak ${index + 1}`}</span>}
        </div>)}
      </div>
    </div>

    {/* 5 en 6: Kiki en de antwoorden. In een opdracht levert het opdrachtpaneel ze. */}
    {inTaak && plot && crop && selected !== null ? <GardenTaskPanel key={`${plot.id}:${plot.step}:${currentGardenPart(plot)}:${state.level}`} plot={plot} crop={crop} level={state.level} hint={hint > 0} blij={blij}
      onWrong={() => setHintLicht(true)} onHelp={() => { const ok = revealGardenAnswer(selected, plot.id, plot.step, currentGardenPart(plot)); refresh(); return ok; }}
      onSubmit={(answer, positions, water) => {
        const part = currentGardenPart(plot);
        const result = solveGardenPart(selected, plot.id, plot.step, part, answer, positions, water);
        if (result === 'correct') {
          juich(); setHint(0); setHintLicht(false);
          const message = plot.helpedParts?.includes(gardenPartKey(plot)) ? 'Met hulp afgerond. Je plant groeit verder.' : 'Zelf opgelost. +2 CocoCoins.';
          const lastPart = plot.step === 0 ? part === 'conversion' : part === 'action';
          if (lastPart) act(true, message); else { refresh(); setNotice(''); }
        } else if (result === 'stale' || result === 'save-failed') { refresh(); setNotice('Dit vak is veranderd of kon niet worden opgeslagen.'); }
        return result;
      }} />
      : <>
        <Kiki blij={blij}>{zin}</Kiki>
        <div className="ck-zone-antwoord tuin-antwoord">
          {plot?.step === 4 && crop && selected !== null ? <button type="button" className="ck-knop ck-knop--hoofd" onClick={() => { const id = plot.id; act(harvestGarden(selected, id), 'Je oogst ligt in je mand. Verkoop hem of breng hem naar Coco.'); juich(); setPaneel('oogst'); }}>Oogsten</button>
            : null}
        </div>
      </>}

    <Paneel open={paneel === 'kiezen' && selected !== null && !plot} titel="Wat wil je laten groeien?" onClose={() => kies(null)}>
      <div className="tuin-kaarten">{GARDEN_CROPS.map(crop => { const nu = crop.start.includes(season); return <button type="button" key={crop.id} className={`ck-speelkaart tuin-kaart${nu ? '' : ' is-later'}`} onClick={() => {
        if (selected === null) return;
        if (!nu) { setFacts(crop); setPaneel('gewas'); return; }
        const index = selected;
        act(plantGardenPlot(index, crop.id), 'Je vak is gekozen. Zet nu je rij uit.'); setSelected(index); juich();
      }}><span className="ck-speelkaart__plaatje"><img src={crop.image} alt="" /></span>{crop.id === 'beans' ? 'Bonen' : crop.name}<small>{nu ? crop.method === 'plantjes' ? 'Jonge plantjes' : 'Zaadjes' : `Start in ${crop.start.map(index => SEASONS[index].toLowerCase()).join(' of ')}`}</small></button>; })}</div>
    </Paneel>
    <Paneel open={paneel === 'kalender'} titel="De groeikalender" onClose={() => setPaneel(null)}>
      <p className="tuin-paneel__tekst">Het is {SEASONS[season].toLowerCase()}. Elk seizoen duurt zeven tuindagen.</p>
      <div className="tuin-kaarten">{GARDEN_CROPS.map(crop => <button type="button" key={crop.id} className="ck-speelkaart tuin-kaart" onClick={() => { setFacts(crop); setPaneel('gewas'); }}>
        <span className="ck-speelkaart__plaatje"><img src={crop.image} alt="" /></span>{crop.name}
        <span className="tuin-seizoenen">{SEASONS.map((name, index) => <span key={name} className={`tuin-seizoenen__stip${crop.start.includes(index) ? ' is-start' : ''}${index === season ? ' is-nu' : ''}`} title={name} />)}</span>
        <small>{crop.start.map(index => SEASONS[index].toLowerCase()).join(' of ')}</small>
      </button>)}</div>
      <button type="button" className="ck-linkje" onClick={() => onNavigate('/encyclopedie?tab=moestuin&from=kiki')}>Mijn ontdekte gewassen</button>
    </Paneel>
    <Paneel open={paneel === 'oogst'} titel="Mijn oogst" onClose={() => setPaneel(null)}>
      {!harvests.length ? <p className="tuin-paneel__tekst">Je mand is leeg. Verzorg je tuin en oogst zodra een vak rijp is.</p>
        : <div className="tuin-kaarten">{harvests.map(harvest => { const crop = GARDEN_CROPS_BY_ID[harvest.cropId]; return <section key={harvest.id} className="ck-speelkaart tuin-kaart tuin-oogst">
          <span className="ck-speelkaart__plaatje"><img src={crop.image} alt={crop.name} /></span>{crop.yieldLabel}
          <button type="button" className="ck-knop ck-knop--zacht tuin-oogst__knop" onClick={() => act(useGardenHarvest(harvest.id, 'coins'), `${crop.coins} CocoCoins ontvangen voor je oogst.`)}><span className="ck-munt" aria-hidden="true" />Verkoop {crop.coins}</button>
          {crop.kitchenId && <button type="button" className="ck-linkje" onClick={() => act(useGardenHarvest(harvest.id, 'kitchen'), `Toegevoegd aan Coco’s voorraad: ${crop.yieldLabel}.`)}>Naar Coco’s voorraad</button>}
        </section>; })}</div>}
      <button type="button" className="ck-linkje" onClick={() => onNavigate('/treehouse/cookbook?from=kiki')}>Naar het kookboek</button>
    </Paneel>
    <Paneel open={paneel === 'gewas' && !!facts} titel={facts?.name ?? ''} onClose={() => { setPaneel(selected !== null && !plot ? 'kiezen' : null); setFacts(null); }}>
      {facts && <div className="tuin-paneel__tekst"><GardenCropFacts crop={facts} />{crop && facts.id === crop.id && <p><strong>Plantenburen</strong> {buren || 'Er staat nog niets naast dit vak. Buren hebben elk hun eigen ruimte en licht nodig.'}</p>}</div>}
    </Paneel>
    {maten && <Maten onClose={() => setMaten(false)} />}
  </main>;
}

export function GardenTaskPanel({ plot, crop, level, hint = false, blij = false, onWrong, onHelp, onSubmit }: { key?: string; plot: GardenPlot; crop: GardenCrop; level: number; hint?: boolean; blij?: boolean; onWrong?: () => void; onMaten?: () => void; onHelp: () => boolean; onSubmit: (answer: string, positions: number[], water: number) => string }) {
  const task = gardenTask(crop, plot.step, level);
  const part = currentGardenPart(plot);
  const assisted = Boolean(plot.helpedParts?.includes(gardenPartKey(plot)));
  const planting = part === 'action' && plot.step === 0;
  const measuring = part === 'action' && plot.step > 0;
  const capacity = task.waterMl && task.waterMl > 1000 ? 3000 : 1000;
  const [positions, setPositions] = useState<number[]>([0]);
  const [water, setWater] = useState(0);
  const [fout, setFout] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [over, setOver] = useState(false);
  const doel = useRef<HTMLDivElement>(null), beker = useRef<HTMLDivElement>(null);
  const displayedPositions = assisted ? [0, 2, 4, 6] : positions;
  const displayedWater = assisted ? task.waterMl ?? 0 : water;
  const prompt = planting ? `Plant vier ${crop.method} met ${formatGardenNumber(crop.spacing)} cm ertussen.` : measuring ? `Vul de maatbeker tot ${task.waterMl} ml.` : task.prompt;
  const explanation = planting ? `Zet ze op ${[0, 1, 2, 3].map(i => formatGardenNumber(i * crop.spacing)).join(' · ')} cm. Dan zit er steeds ${formatGardenNumber(crop.spacing)} cm tussen.` : measuring ? `Het streepje bij ${task.waterMl} ml is de juiste hoeveelheid. De maatbeker staat nu goed.` : `${task.hint} Het antwoord is ${formatGardenNumber(task.answer)} ${task.unit}.`;
  const tip = planting ? `Begin bij 0 en tel steeds ${formatGardenNumber(crop.spacing)} cm verder.` : measuring ? `Kijk naar de streepjes op de beker. Waar staat ${task.waterMl} ml?` : task.hint;
  const submit = (answer = '') => {
    const result = onSubmit(assisted ? String(task.answer) : answer, displayedPositions, displayedWater);
    if (result === 'wrong') onWrong?.();
    setError(result === 'wrong' ? 'Nog niet. Tik op de hint als je hulp wilt.' : result === 'correct' ? '' : 'Opslaan lukte niet. Kies dit vak opnieuw en probeer het nog eens.');
    return result;
  };
  const kiesAntwoord = (value: number) => { if (submit(String(value)) === 'wrong') setFout(value); else setFout(null); };
  const vulTot = (event: React.PointerEvent<HTMLDivElement>) => {
    if (assisted || !(event.buttons & 1) && event.type !== 'pointerdown') return;
    const rect = event.currentTarget.getBoundingClientRect();
    const deel = Math.max(0, Math.min(1, (rect.bottom - event.clientY) / rect.height));
    setWater(Math.round(deel * capacity / 50) * 50); setError('');
  };
  return <>
    <Kiki blij={blij}>{error || (assisted ? explanation : hint ? tip : prompt)}</Kiki>

    {/* In de wereld: de meetlat over de bak, of de maatbeker ernaast. */}
    {planting && <div className="garden-ruler ck-glas" role="group" aria-label="Plant je rij op de meetlat">{Array.from({ length: 7 }, (_, index) => <button type="button" key={index} disabled={assisted} aria-label={`${formatGardenNumber(index * crop.spacing / 2)} cm${displayedPositions.includes(index) ? ', geplant' : ''}`} aria-pressed={displayedPositions.includes(index)} onClick={() => { if (index === 0) return; setPositions(current => current.includes(index) ? current.filter(value => value !== index) : current.length < 4 ? [...current, index] : current); setError(''); }}><span aria-hidden="true">{displayedPositions.includes(index) ? <Sprout /> : ''}</span><small>{index % 2 === 0 ? formatGardenNumber(index * crop.spacing / 2) : ''}</small></button>)}<span className="garden-ruler__unit">cm</span></div>}
    {measuring && <div className="garden-measure">
      <div ref={beker} className="garden-jug ck-glas" role="slider" tabIndex={assisted ? -1 : 0} aria-label="Maatbeker" aria-valuemin={0} aria-valuemax={capacity} aria-valuenow={displayedWater} aria-valuetext={`${displayedWater} ml`}
        onPointerDown={event => { event.currentTarget.setPointerCapture(event.pointerId); vulTot(event); }} onPointerMove={vulTot}
        onKeyDown={event => { if (assisted) return; if (event.key === 'ArrowUp' || event.key === 'ArrowRight') setWater(Math.min(capacity, water + 50)); if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') setWater(Math.max(0, water - 50)); }}>
        <span className="garden-jug__water" style={{ height: `${displayedWater / capacity * 100}%` }} />
        {[capacity, capacity * .75, capacity * .5, capacity * .25].map(mark => <span className="garden-jug__mark" style={{ top: `${(1 - mark / capacity) * 100}%` }} key={mark}>{mark}</span>)}
      </div>
      <b className="garden-measure__stand">{displayedWater} ml</b>
      {!assisted && <div className="garden-measure__buttons">
        <button type="button" className="ck-gereedschap ck-glas" aria-label="50 ml minder" onClick={() => setWater(Math.max(0, water - 50))}><Minus size={22} aria-hidden="true" /></button>
        <button type="button" className="ck-gereedschap ck-glas" aria-label="50 ml meer" onClick={() => setWater(Math.min(capacity, water + 50))}><Plus size={22} aria-hidden="true" /></button>
      </div>}
    </div>}
    {part === 'conversion' && !assisted && <div ref={doel} className={`ck-doel tuin-omreken-doel${over ? ' is-over' : ''}`} aria-hidden="true"><span>? {task.unit}</span></div>}

    <div className="ck-zone-antwoord tuin-antwoord">
      {assisted && <small className="garden-task__help-note">Met hulp · geen CocoCoins voor deze opdracht</small>}
      {part === 'conversion' && !assisted
        ? <div className="tuin-bellen" role="group" aria-label={`Antwoorden in ${task.unit}`}>{gardenOptions(task.answer).map((value, i) => <DragChoice key={value} value={value} label={`${formatGardenNumber(value)} ${task.unit}`} className={`ck-bel ck-glas ck-bel--${i + 1}${fout === value ? ' is-fout' : ''}`} targetRef={doel} onOver={setOver} onChoose={kiesAntwoord} onDrop={value => kiesAntwoord(value)}>
          <span className="ck-bel__kern" aria-hidden="true" />{formatGardenNumber(value)}<small className="tuin-bel__eenheid">{task.unit}</small>
        </DragChoice>)}</div>
        : <button type="button" className="ck-knop ck-knop--hoofd" onClick={() => submit()}>{assisted ? 'Verder' : planting ? 'Plant mijn rij' : measuring ? 'Geef water' : 'Verder'}</button>}
    </div>
  </>;
}
