import React, { lazy, Suspense, useCallback, useEffect, useState, useRef } from 'react';
import type { TravelAdventure } from '../../data/travel/adventures';
import { memoryPairs, studyLocations, locationProgressKey } from '../../data/learning';
import { locationFact } from '../../data/topography/facts';
import { loadTravelAdventures, startTravelAdventure } from '../../services/travelAdventures';
import { currentTravelStep, ensureTravelJourney, loadTravelJourney, recordTravelStep, travelStepIds, TRAVEL_STEPS, TRAVEL_STEP_LABELS, TRAVEL_STEP_TOTAL, type TravelStep, type TravelJourneyRun, type PracticeTravelStep } from '../../services/travelJourney';
import { subscribeLocalState } from '../../services/localState';
import { awardCurrencyOnce } from '../../services/currency';
import { PROGRESS_KEY, readProgress, recordAnswer, writeLocal } from '../../services/localProgress';
import SpeechBubble from '../ui/SpeechBubble';
import { Button } from '../../design-system';
import './travel-journey.css';
import TopoExitDialog from './TopoExitDialog';
import { registerNavigationGuard } from '../../services/navigationGuard';
const GameEngine = lazy(() => import('../GameEngine'));
const Memory = lazy(() => import('../LocationMemoryGame'));
const Test = lazy(() => import('../ToetsGame'));
const Map = lazy(() => import('../InteractiveMap'));

export default function TravelJourney({ adventure }: { adventure: TravelAdventure }) {
  const [run, setRun] = useState<TravelJourneyRun | null>(() => loadTravelJourney(adventure));
  const [confirmExit, setConfirmExit] = useState(false);
  const pendingExit = useRef<(() => void) | null>(null);
  const testExit = useRef<(() => void) | null>(null);
  const registerTestExit = useCallback((request: (() => void) | null) => { testExit.current = request; }, []);
  useEffect(() => registerNavigationGuard(proceed => { pendingExit.current = proceed; setConfirmExit(true); }, 1), []);
  const exitDialog = <TopoExitDialog open={confirmExit} onStay={() => { pendingExit.current = null; setConfirmExit(false); }} onLeave={() => { const proceed = pendingExit.current; pendingExit.current = null; setConfirmExit(false); proceed?.(); }} />;
  const [playing, setPlaying] = useState<TravelStep | null>(null);
  const [round, setRound] = useState(0);
  const [notice, setNotice] = useState('');
  const [factId, setFactId] = useState<string | null>(null);
  const [finished, setFinished] = useState(() => Boolean(loadTravelAdventures().completed[adventure.id]));
  const locations = studyLocations(adventure.selection), pairs = memoryPairs(adventure.selection);
  const [sessionLocations, setSessionLocations] = useState(locations);
  const [sessionPairs, setSessionPairs] = useState(pairs);
  const initialize = useCallback(() => {
    let state = loadTravelAdventures();
    if (state.active?.adventureId !== adventure.id && state.attempts[adventure.id] && !state.completed[adventure.id]) {
      if (!startTravelAdventure(adventure.id)) { setNotice('Bewaren lukt even niet. Probeer opnieuw.'); return; }
      state = loadTravelAdventures();
    }
    if (state.completed[adventure.id]) { setFinished(true); return; }
    const attempt = state.active;
    if (!attempt || attempt.adventureId !== adventure.id) { setNotice('Open deze reis opnieuw vanuit To Do.'); return; }
    const saved = ensureTravelJourney(adventure, attempt.attemptId);
    if (saved) { setRun(saved); setNotice(''); } else setNotice('Bewaren lukt even niet. Probeer opnieuw.');
  }, [adventure]);
  useEffect(initialize, [initialize]);
  useEffect(() => subscribeLocalState(() => { setRun(loadTravelJourney(adventure)); setFinished(Boolean(loadTravelAdventures().completed[adventure.id])); }), [adventure]);
  const step = run ? currentTravelStep(adventure, run) : 'facts';
  const saveResult = useCallback((phase: PracticeTravelStep, id: string) => {
    if (finished) return;
    const saved = loadTravelJourney(adventure);
    if (!saved || !recordTravelStep(adventure, saved.attemptId, phase, id)) setNotice('Bewaren lukt even niet. Probeer dit onderdeel nog eens.');
    else { setRun(loadTravelJourney(adventure)); setNotice(''); }
  }, [adventure, finished]);
  const answer = useCallback((id: string, correct: boolean, points: number) => {
    writeLocal(PROGRESS_KEY, recordAnswer(readProgress(), id, correct));
    awardCurrencyOnce(`travel-practice:${crypto.randomUUID()}`, points);
    if (playing === 'memory') saveResult('memory', id);
    else if ((playing === 'find' || playing === 'master') && correct) saveResult(playing, id);
  }, [playing, saveResult]);
  const close = () => { setPlaying(null); setRun(loadTravelJourney(adventure)); };
  const restart = () => setRound(value => value + 1);
  const remaining = (phase: 'find' | 'master') => {
    const list = locations.filter(place => !run?.[phase].includes(locationProgressKey(place)));
    return list.length ? list : locations;
  };
  const remainingPairs = pairs.filter(pair => !run?.memory.includes(pair.id));
  const begin = (phase: TravelStep) => {
    if (phase === 'find' || phase === 'master') setSessionLocations(remaining(phase));
    if (phase === 'memory') setSessionPairs(remainingPairs.length ? remainingPairs : pairs);
    setPlaying(phase); restart();
  };
  const fact = locations.find(place => place.id === factId);
  if (!run && !finished) return <main className="travel-route" data-wereld="wereld"><SpeechBubble character="seb">{notice || 'Ik pak onze reiskaart erbij.'}</SpeechBubble>{notice && <Button onClick={initialize}>Probeer opnieuw</Button>}</main>;
  if (playing) return <div className={`topo-app topo-huisstijl view-discover in-session travel-play${playing === 'test' ? ' in-test' : ''}`} data-wereld="wereld">
    <Suspense fallback={<p>De reis wordt klaargezet…</p>}>
      {playing === 'facts' ? <main className="travel-facts">
        <section className="travel-facts__map"><Map selectedProvince={adventure.selection.areaId} locations={locations} showLabels onLocationClick={place => { setFactId(place.id); saveResult('facts', place.id); }} highlightedLocation={factId ?? undefined} /></section>
        <aside className="travel-facts__notes ck-paper-surface"><SpeechBubble character="seb">Tik op een plek. Wat ontdek jij?</SpeechBubble>{fact && <><h2>{fact.name}</h2><p>{locationFact(fact).fact}</p></>}<nav aria-label="Plekken om te ontdekken">{locations.map(place => <button key={place.id} type="button" aria-pressed={factId === place.id} onClick={() => { setFactId(place.id); saveResult('facts', place.id); }}>{run?.facts.includes(place.id) ? '✓ ' : ''}{place.name}</button>)}</nav><Button onClick={close}>{step === 'facts' ? 'Pauzeer je reis' : 'Naar de memory'}</Button></aside>
      </main> : <main className="session-page">
        {playing === 'memory' ? <Memory key={round} mode="memory" gids="seb" pairs={sessionPairs} choicePool={pairs} onAnswer={answer} onContinue={close} onRepeat={restart} onRetry={restart} onExit={close} />
          : playing === 'test' ? <div className="test-workspace"><Test provinceId={adventure.selection.areaId} clusterId="all" studyPool={locations} adventureId={adventure.id} onExit={close} registerExit={registerTestExit} onPractice={() => begin('master')} /></div>
          : <GameEngine key={round} mode={playing} areaId={adventure.selection.areaId} locations={sessionLocations} mapLocations={locations} timerEnabled={false} onAnswer={answer} onContinue={close} onRepeat={restart} onRetry={restart} onExit={close} />}
      </main>}
    </Suspense>
    {playing !== 'facts' && <button type="button" className="travel-play__pause ck-glas" onClick={() => { if (playing === 'test' && testExit.current) testExit.current(); else close(); }}>Mijn reis</button>}
    {notice && <p className="travel-route__notice" role="alert">{notice}</p>}
    {exitDialog}
  </div>;
  return <main className="travel-route" data-wereld="wereld">
    <article className="travel-route__sheet ck-paper-surface">
      <h1 className="ck-houtbord">{adventure.title}</h1>
      <SpeechBubble character="seb">{finished ? 'Reis klaar! Blijf gerust oefenen.' : 'Op reis! Morgen verder mag ook.'}</SpeechBubble>
      <p>Tot {adventure.reward + TRAVEL_STEP_TOTAL} CocoCoins voor deze reis, plus munten voor het oefenen.</p>
      <ol className="travel-route__steps">{TRAVEL_STEPS.map((phase, index) => {
        const done = finished || index < TRAVEL_STEPS.indexOf(step);
        const unlocked = finished || index <= TRAVEL_STEPS.indexOf(step);
        const count = phase === 'test' || finished ? null : `${run?.[phase].length ?? 0}/${travelStepIds(adventure, phase).length}`;
        return <li key={phase}><button type="button" aria-disabled={!unlocked} aria-current={phase === step && !finished ? 'step' : undefined} onClick={() => { if (!unlocked) { setNotice('Ontdek eerst de vorige stap.'); return; } setNotice(''); begin(phase); }}><span>{done ? '✓' : index + 1}</span><strong>{TRAVEL_STEP_LABELS[phase]}</strong>{count && <small>{count}</small>}</button></li>;
      })}</ol>
      {!finished && <Button onClick={() => begin(step)}>Ga verder</Button>}
      <p>Je hoeft deze reis niet in één keer te doen. Je voortgang blijft bewaard.</p>
      {notice && <p role="status">{notice}</p>}
    </article>
    {exitDialog}
  </main>;
}
