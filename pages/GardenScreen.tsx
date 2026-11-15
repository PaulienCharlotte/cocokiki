import React, { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, Check, Droplets, ArrowRight, Ruler, Settings, HelpCircle, Leaf, Plus, ShoppingBasket, Sprout } from 'lucide-react';
import { Button, Dialog, IconButton } from '../design-system';
import SpeechBubble from '../components/ui/SpeechBubble';
import CardGrid from '../components/ui/CardGrid';
import GardenCropFacts from '../components/plants/GardenCropFacts';
import { GARDEN_CROPS, GARDEN_CROPS_BY_ID, SEASONS, formatGardenNumber, gardenNeighbours, gardenPairAdvice, gardenSeason, gardenTask, type GardenCrop } from '../data/plants/garden';
import { GARDEN_KEY, gardenNeedsCare, currentGardenPart, gardenPartKey, harvestGarden, loadGarden, nextGardenDay, plantGardenPlot, revealGardenAnswer, setGardenLevel, solveGardenPart, useGardenHarvest, type GardenPlot } from '../services/garden';
import { subscribeLocalState } from '../services/localState';
import Maten from '../games/math/Maten';
import './garden.css';

const stages = ['Plant je rij', 'Zaadjes in de grond', 'Kiemplantjes', 'Groeiende planten', 'Klaar om te oogsten'];

export default function GardenScreen({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [state, setState] = useState(loadGarden);
  const [selected, setSelected] = useState<number | null>(null);
  const [calendar, setCalendar] = useState(false);
  const [basket, setBasket] = useState(false);
  const [about, setAbout] = useState(false);
  const [settings, setSettings] = useState(false);
  const [maten, setMaten] = useState(false);
  const [facts, setFacts] = useState<GardenCrop | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => subscribeLocalState(() => setState(loadGarden()), GARDEN_KEY), []);
  const refresh = () => setState(loadGarden());
  const act = (ok: boolean, message: string) => { refresh(); setNotice(ok ? message : 'Opslaan lukte niet of dit vak is veranderd. Probeer het opnieuw.'); if (ok) setSelected(null); };
  const season = gardenSeason(state.day);
  const plot = selected === null ? null : state.plots[selected];
  const crop = plot ? GARDEN_CROPS_BY_ID[plot.cropId] : null;
  const waiting = plot && plot.step > 0 && plot.step < 4 && plot.lastCareDay >= state.day;
  const harvests = state.harvests.filter(harvest => !harvest.destination);
  return <main className="garden" aria-labelledby="garden-title">
    <img className="garden__background" src="/assets/library/plants/garden/terrain-natural.webp" alt="" />
    <h1 id="garden-title" className="sr-only">Mijn moestuin</h1>
    <nav className="garden__toolbar" aria-label="Mijn moestuin">
      <IconButton label="Rekenniveau instellen" icon={<Settings />} onClick={() => setSettings(true)} />
      <span className="garden__day">Tuindag {state.day}<small>{SEASONS[season]}</small></span>
      <IconButton label={`Groeikalender, tuindag ${state.day}, ${SEASONS[season]}`} icon={<span className="garden-calendar-icon"><CalendarDays /><b>{state.day}</b></span>} onClick={() => setCalendar(true)} />
      <IconButton label={`Mijn oogst, ${harvests.length} mandjes`} icon={<ShoppingBasket />} onClick={() => setBasket(true)} />
      <IconButton label="Maten omrekenen" icon={<Ruler />} onClick={() => setMaten(true)} />
      <IconButton label="Hoe werkt de moestuin?" icon={<HelpCircle />} onClick={() => setAbout(true)} />
      <IconButton label={gardenNeedsCare(state) ? 'Volgende tuindag, verzorg eerst je geplante vakken' : 'Volgende tuindag'} disabled={gardenNeedsCare(state)} icon={<ArrowRight />} onClick={() => act(nextGardenDay(), 'Een nieuwe tuindag.')} />
      <span className="sr-only" role="status">{gardenNeedsCare(state) ? 'Verzorg eerst je geplante vakken.' : notice}</span>
    </nav>
    <div className="garden__body">
      <div className="garden-map" aria-label="Moestuin van bovenaf">
      <div className="garden__beds" aria-label="Zes tuinvakken">
        {state.plots.map((plot, index) => <button type="button" key={index} className={`garden-bed${plot ? ` garden-bed--${plot.step}` : ''}`} onClick={() => setSelected(index)} aria-label={`Vak ${index + 1}: ${plot ? `${GARDEN_CROPS_BY_ID[plot.cropId].name}, ${stages[plot.step]}` : 'leeg, kies een gewas'}`}>
          <img className="garden-bed__soil" src="/assets/library/plants/garden/bed-earth.webp" alt="" />
          <span className="garden-bed__number">{index + 1}</span>
          <span className="garden-bed__plants" aria-hidden="true">{!plot ? <Plus /> : plot.step === 0 ? <Leaf /> : Array.from({ length: 4 }, (_, index) => <span key={index} className="garden-bed__plant">{plot.step === 1 ? <span className="garden-bed__seed" /> : <img src="/assets/library/plants/garden/seedling-natural.webp" alt="" />}</span>)}</span>
          {plot?.step === 4 && <img className="garden-bed__harvest" src={GARDEN_CROPS_BY_ID[plot.cropId].image} alt="" />}
          <span className="garden-bed__label">{plot && <img src={GARDEN_CROPS_BY_ID[plot.cropId].image} alt="" width={48} height={48} />}<strong>{plot ? GARDEN_CROPS_BY_ID[plot.cropId].name : 'Plant hier'}</strong>{plot && <span className="garden-bed__care" aria-hidden="true">{plot.step === 4 ? <ShoppingBasket /> : plot.step === 0 ? <Sprout /> : plot.lastCareDay >= state.day ? <Check /> : <Droplets />}</span>}</span>
        </button>)}
      </div>
      </div>
      

    </div>

    <Dialog primaryAction={null} open={selected !== null && !maten} title={crop ? `${crop.name} · vak ${(selected ?? 0) + 1}` : 'Wat wil je laten groeien?'} onClose={() => setSelected(null)}>
      {selected !== null && (!plot ? <>
        <SpeechBubble character="kiki" label="Zaaien">Het is {SEASONS[season].toLowerCase()}. Kies wat je in dit vak wilt laten groeien.</SpeechBubble>
        <CardGrid kolommen={3} label="Kies een gewas" cards={GARDEN_CROPS.map(crop => ({ id: crop.id, titel: crop.id === 'beans' ? 'Bonen' : crop.name, beeld: crop.image, onder: crop.start.includes(season) ? crop.method === 'plantjes' ? 'Begin met jonge plantjes' : 'Begin met zaadjes' : `Start in ${crop.start.map(index => SEASONS[index].toLowerCase()).join(' of ')}` }))} onChoose={id => { if (!GARDEN_CROPS_BY_ID[id].start.includes(season)) { setFacts(GARDEN_CROPS_BY_ID[id]); return; } act(plantGardenPlot(selected, id), 'Je vak is gekozen. Zet nu je rij uit.'); setSelected(selected); }} />
      </> : crop && <>
        {plot.step === 4 ? <div className="garden-ready"><img src={crop.image} alt={crop.name} /><SpeechBubble character="kiki" label="Oogsttijd">{crop.yieldLabel}! Je hebt je planten ruimte en water gegeven.</SpeechBubble><Button onClick={() => { const id = plot.id; act(harvestGarden(selected, id), 'Je oogst ligt in je mand. Verkoop hem of breng hem naar Coco.'); setBasket(true); }}>Oogsten</Button></div> : waiting ? <><SpeechBubble character="kiki" label="Verzorgd">Deze plant heeft vandaag water gehad. Nog meer is niet nodig. Verzorg een ander vak of begin de volgende tuindag.</SpeechBubble><Button onClick={() => setSelected(null)}>Naar mijn tuin</Button></> : <GardenTaskPanel key={`${plot.id}:${plot.step}:${currentGardenPart(plot)}:${state.level}`} plot={plot} crop={crop} level={state.level} onMaten={() => setMaten(true)} onHelp={() => {
          const ok = revealGardenAnswer(selected, plot.id, plot.step, currentGardenPart(plot)); refresh(); return ok;
        }} onSubmit={(answer, positions, water) => {
          const part = currentGardenPart(plot);
          const result = solveGardenPart(selected, plot.id, plot.step, part, answer, positions, water);
          if (result === 'correct') {
            const message = plot.helpedParts?.includes(gardenPartKey(plot)) ? 'Met hulp afgerond · geen opdrachtbeloning.' : 'Zelf opgelost · +2 CocoCoins!';
            const lastPart = plot.step === 0 ? part === 'conversion' : part === 'action';
            if (lastPart) act(true, message); else { refresh(); setNotice(message); }
          }
          else if (result === 'stale' || result === 'save-failed') { refresh(); setNotice('Dit vak is veranderd of kon niet worden opgeslagen.'); }
          return result;
        }} />}
        {(waiting || plot.step === 4) && <div className="garden__details"><Button variant="quiet" size="small" startIcon={<BookOpen />} onClick={() => setFacts(crop)}>Over dit gewas</Button>
          <Button variant="quiet" size="small" onClick={() => setFacts({ ...crop, care: gardenNeighbours(selected).filter(index => state.plots[index]).map(index => gardenPairAdvice(crop, GARDEN_CROPS_BY_ID[state.plots[index]!.cropId])).join(' ') || 'Er staat nog niets naast dit vak. Buren hebben elk hun eigen ruimte en licht nodig.' })}>Mijn plantenburen</Button></div>}
      </>)}
    </Dialog>

    {maten && <Maten onClose={() => setMaten(false)} />}
    <Dialog primaryAction={null} open={settings} title="Rekenniveau" onClose={() => setSettings(false)}>
      <label className="garden-level">Rekenen <input type="range" min={1} max={3} step={1} value={state.level} aria-label="Rekenniveau" aria-valuetext={state.level === 1 ? 'Millimeters en milliliters' : state.level === 2 ? 'Decimeters en liters' : 'Rijen en meerdere dagen'} onChange={event => { if (!setGardenLevel(Number(event.target.value))) setNotice('Het niveau kon niet worden opgeslagen.'); refresh(); }} /><span>{state.level}</span></label>
    </Dialog>
    <Dialog primaryAction={null} open={calendar} title="De groeikalender" onClose={() => setCalendar(false)}>
      <p>Het is {SEASONS[season].toLowerCase()} in jouw tuin. Elk seizoen duurt zeven tuindagen; jij gaat zelf verder.</p>
      <div className="garden-calendar"><table><caption>Wanneer starten we een gewas?</caption><thead><tr><th scope="col">Gewas</th>{SEASONS.map(name => <th key={name} scope="col">{name}</th>)}</tr></thead><tbody>{GARDEN_CROPS.map(crop => <tr key={crop.id}><th scope="row"><button type="button" className="food-word" onClick={() => setFacts(crop)}>{crop.name}</button></th>{SEASONS.map((name, index) => <td key={name}>{crop.start.includes(index) ? 'Start' : '—'}</td>)}</tr>)}</tbody></table></div>
      <p>Dit is een eenvoudige spelkalender. Buiten hangt het moment ook af van vorst, weer en ras. In de winter plannen we de volgende tuin; bestaande spelplanten blijven behouden.</p>
    </Dialog>
    <Dialog primaryAction={null} open={basket} title="Mijn oogst" onClose={() => setBasket(false)}>
      {notice && <p role="status">{notice}</p>}
      {!harvests.length ? <p>Je mand is leeg. Verzorg je tuin en oogst zodra een vak rijp is.</p> : <div className="garden-harvests">{harvests.map(harvest => { const crop = GARDEN_CROPS_BY_ID[harvest.cropId]; return <section key={harvest.id}><img src={crop.image} alt={crop.name} /><strong>{crop.yieldLabel}</strong><Button variant="secondary" onClick={() => { act(useGardenHarvest(harvest.id, 'coins'), `${crop.coins} CocoCoins ontvangen voor je oogst.`); }}>Verkoop · {crop.coins} coins</Button>{crop.kitchenId && <Button variant="quiet" onClick={() => act(useGardenHarvest(harvest.id, 'kitchen'), `Toegevoegd aan Coco’s voorraad: ${crop.yieldLabel}.`)}>Naar Coco’s voorraad</Button>}</section>; })}</div>}
      <Button variant="quiet" onClick={() => onNavigate('/treehouse/cookbook?from=kiki')}>Naar het kookboek</Button>
    </Dialog>
    <Dialog primaryAction={null} open={Boolean(facts)} title={facts?.name ?? ''} onClose={() => setFacts(null)}>{facts && <GardenCropFacts crop={facts} />}</Dialog>
    <Dialog primaryAction={null} open={about} title="Jouw tuin, jouw tempo" onClose={() => setAbout(false)}>
      <p>Kies een vak, meet de ruimte tussen je plantjes en geef afgemeten water. Na drie verzorgingsrondes kun je oogsten. Verzorg eerst alle geplante vakken. Daarna kun je naar de volgende tuindag; je hoeft niet echt te wachten.</p>
      <p>Je planten gaan niet dood als je niet speelt. De groeisnelheid en waterhoeveelheden zijn spelvoorbeelden. In een echte tuin voel je aan de grond en kijk je wat de plant nodig heeft.</p>
      <p>Een zelf opgeloste opdracht geeft 2 CocoCoins. Met ‘Ik kom er niet uit’ krijg je het antwoord en uitleg, zonder opdrachtbeloning. Je plant groeit wel verder.</p>
      <Button variant="quiet" onClick={() => onNavigate('/encyclopedie?tab=moestuin&from=kiki')}>Mijn ontdekte gewassen</Button>
    </Dialog>
  </main>;
}

export function GardenTaskPanel({ plot, crop, level, onMaten, onHelp, onSubmit }: { key?: string; plot: GardenPlot; crop: GardenCrop; level: number; onMaten?: () => void; onHelp: () => boolean; onSubmit: (answer: string, positions: number[], water: number) => string }) {
  const task = gardenTask(crop, plot.step, level);
  const part = currentGardenPart(plot);
  const assisted = Boolean(plot.helpedParts?.includes(gardenPartKey(plot)));
  const planting = part === 'action' && plot.step === 0;
  const measuring = part === 'action' && plot.step > 0;
  const capacity = task.waterMl && task.waterMl > 1000 ? 3000 : 1000;
  const [positions, setPositions] = useState<number[]>([0]);
  const [water, setWater] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const displayedPositions = assisted ? [0, 2, 4, 6] : positions;
  const displayedWater = assisted ? task.waterMl ?? 0 : water;
  const prompt = planting ? `Plant vier ${crop.method} met ${formatGardenNumber(crop.spacing)} cm ertussen.` : measuring ? `Vul de maatbeker tot ${task.waterMl} ml.` : task.prompt;
  const explanation = planting ? `Zet ze op ${[0, 1, 2, 3].map(i => formatGardenNumber(i * crop.spacing)).join(' · ')} cm. Dan zit er steeds ${formatGardenNumber(crop.spacing)} cm tussen.` : measuring ? `Het streepje bij ${task.waterMl} ml is de juiste hoeveelheid. De maatbeker hieronder staat nu goed.` : `${task.hint} Het antwoord is ${formatGardenNumber(task.answer)} ${task.unit}.`;
  const submit = () => {
    const result = onSubmit(assisted ? String(task.answer) : answer, displayedPositions, displayedWater);
    setError(result === 'wrong' ? 'Nog niet. Probeer het opnieuw of kies hulp.' : result === 'correct' ? '' : 'Opslaan lukte niet. Open dit vak opnieuw en probeer het nog eens.');
  };
  return <div className="garden-task">
    <SpeechBubble character="kiki" label={part === 'conversion' ? 'Rekenen' : planting ? 'Zaaien' : 'Water geven'}>{assisted ? explanation : prompt}</SpeechBubble>
    {planting && <div className="garden-ruler" role="group" aria-label="Plant je rij op de meetlat">{Array.from({ length: 7 }, (_, index) => <button type="button" key={index} disabled={assisted} aria-label={`${formatGardenNumber(index * crop.spacing / 2)} cm${displayedPositions.includes(index) ? ', geplant' : ''}`} aria-pressed={displayedPositions.includes(index)} onClick={() => { if (index === 0) return; setPositions(current => current.includes(index) ? current.filter(value => value !== index) : current.length < 4 ? [...current, index] : current); setError(''); }}><span aria-hidden="true">{displayedPositions.includes(index) ? <Sprout /> : '·'}</span><small>{index % 2 === 0 ? formatGardenNumber(index * crop.spacing / 2) : ' '}</small></button>)}<span className="garden-ruler__unit">cm</span></div>}
    {measuring && <div className="garden-measure">
      <div className="garden-jug" role="img" aria-label={`Maatbeker gevuld met ${displayedWater} ml`}><span className="garden-jug__water" style={{ height: `${displayedWater / capacity * 100}%` }} />{[capacity, capacity * .75, capacity * .5, capacity * .25, 0].map(mark => <span className="garden-jug__mark" style={{ top: `${2 + (1 - mark / capacity) * 86}%` }} key={mark}>{mark} ml</span>)}</div>
      {!assisted && <div><label htmlFor="garden-water"><strong>{water} ml</strong></label><input id="garden-water" aria-label="Hoeveelheid in de maatbeker" type="range" min={0} max={capacity} step={50} value={water} onChange={event => { setWater(Number(event.target.value)); setError(''); }} /><div className="garden-measure__buttons"><Button variant="quiet" size="small" onClick={() => setWater(Math.max(0, water - 50))}>−50 ml</Button><Button variant="quiet" size="small" onClick={() => setWater(Math.min(capacity, water + 50))}>+50 ml</Button></div></div>}
    </div>}
    <form onSubmit={event => { event.preventDefault(); submit(); }}>
      {part === 'conversion' && (assisted ? <output className="garden-task__solution">{formatGardenNumber(task.answer)} {task.unit}</output> : <div className="garden-task__answer"><label className="sr-only" htmlFor="garden-answer">{task.prompt}</label><input id="garden-answer" inputMode="decimal" autoComplete="off" value={answer} onChange={event => setAnswer(event.target.value)} aria-describedby={error ? 'garden-task-error' : undefined} /><span>{task.unit}</span>{onMaten && <IconButton label="Maten omrekenen" icon={<Ruler />} onClick={onMaten} />}</div>)}
      {error && <p id="garden-task-error" role="alert">{error}</p>}
      {assisted && <small className="garden-task__help-note">Met hulp · geen CocoCoins voor deze opdracht</small>}
      <Button type="submit" fullWidth>{assisted ? 'Verder' : planting ? 'Plant mijn rij' : measuring ? 'Geef water' : 'Controleer'}</Button>
    </form>
    {!assisted && <Button variant="quiet" onClick={() => { setError(onHelp() ? '' : 'De hulp kon niet worden opgeslagen. Probeer het opnieuw.'); }}>Ik kom er niet uit</Button>}
  </div>;
}
