import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Brain, Check, Compass, Flag, ListFilter, Map, MousePointer2, Play, Settings2, Type, Wand2 } from 'lucide-react';
import { Location } from '../types';
import { areaName, availableModes, availableTopics, locationContext, locationProgressKey, memoryPairs, MemoryPair, MODE_LABELS, PlayMode, Selection, studyLocations, TOPIC_LABELS, TopicId, validateSelection } from '../data/learning';
import { COUNTRY_FLAGS } from '../data/flags';
import { LOCATION_FACTS } from '../data/locationFacts';
import { nextBatch, PREFERENCES_KEY, PROGRESS_KEY, readLocal, readProgress, recordAnswer, SCORE_KEY, writeLocal } from '../services/localProgress';
import LearningSelection from './LearningSelection';
import MapFactCard from './MapFactCard';
import Passport from './Passport';

const InteractiveMap = lazy(() => import('./InteractiveMap'));
const GameEngine = lazy(() => import('./GameEngine'));
const LocationMemoryGame = lazy(() => import('./LocationMemoryGame'));
const ToetsGame = lazy(() => import('./ToetsGame'));

type View = 'discover' | 'passport';
interface Session { id: number; mode: PlayMode; locations: Location[]; pairs: MemoryPair[] }

const ICONS: Record<PlayMode, React.ComponentType<{ size?: number }>> = {
  find: MousePointer2,
  spell: Type,
  memory: Brain,
  quiz: Flag,
  master: Wand2,
  test: BookOpen,
};

export default function Game() {
  const [selection, setSelection] = useState<Selection>(() => validateSelection(readLocal(PREFERENCES_KEY, null)));
  const [view, setView] = useState<View>('discover');
  const [pairCount, setPairCount] = useState(4);
  const [timer, setTimer] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState(readProgress);
  const [score, setScore] = useState(() => {
    const saved = readLocal(SCORE_KEY, 0);
    return typeof saved === 'number' && Number.isFinite(saved) && saved > 0 ? saved : 0;
  });
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const exploreRef = useRef<HTMLElement>(null);
  const topicFilterRef = useRef<HTMLDetailsElement>(null);

  const locations = useMemo(() => studyLocations(selection), [selection]);
  const pairs = useMemo(() => memoryPairs(selection), [selection]);
  const modes = useMemo(() => availableModes(selection), [selection]);
  const pairOptions = [...new Set([Math.min(4, pairs.length), 6, 8].filter(n => n > 0 && n <= pairs.length))];
  const activePairCount = pairOptions.includes(pairCount) ? pairCount : pairOptions[0];
  const context = areaName(selection.areaId) + ' · ' + TOPIC_LABELS[selection.topicId];
  const practiced = (selection.topicId === 'flags' || selection.topicId === 'facts')
    ? pairs.filter(pair => progress[pair.id]).length
    : locations.filter(location => progress[locationProgressKey(location)]).length;
  const poolSize = selection.topicId === 'flags' || selection.topicId === 'facts' ? pairs.length : locations.length;
  const mapRoundSize = locations.length <= 12 ? locations.length : 10;
  const topics = useMemo(() => {
    const available = availableTopics(selection.areaId);
    return ['all', ...available.filter(topic => topic !== 'all')] as TopicId[];
  }, [selection.areaId]);

  const quickModes: PlayMode[] = modes.includes('quiz')
    ? ['quiz']
    : modes.includes('find')
      ? (modes.includes('master') ? ['find', 'master'] : ['find'])
      : modes.slice(0, 1);
  const extraModes = modes.filter(mode => !quickModes.includes(mode));
  const hasTimerModes = modes.some(mode => mode === 'find' || mode === 'spell' || mode === 'master');
  const selectedFact = activeLocation ? LOCATION_FACTS[activeLocation.name] : undefined;

  useEffect(() => { writeLocal(PREFERENCES_KEY, selection); }, [selection]);
  useEffect(() => {
    const savedScore = writeLocal(SCORE_KEY, score);
    const savedProgress = writeLocal(PROGRESS_KEY, progress);
    setStorageAvailable(savedScore && savedProgress);
  }, [score, progress]);

  const onAnswer = useCallback((id: string, correct: boolean, points: number) => {
    setProgress(previous => recordAnswer(previous, id, correct));
    setScore(previous => previous + points);
  }, []);

  const changeSelection = (next: Selection) => {
    setSelection(validateSelection(next));
    setActiveLocation(null);
  };

  const changeTopic = (topicId: TopicId) => {
    changeSelection({ ...selection, topicId, clusterId: 'all' });
    topicFilterRef.current?.removeAttribute('open');
  };

  const navigate = (next: View) => {
    setView(next);
    setSession(null);
    window.scrollTo({ top: 0 });
  };

  const start = (requestedMode: PlayMode, retryIds?: string[]) => {
    const sessionLocations = retryIds
      ? locations.filter(location => retryIds.includes(location.id))
      : requestedMode === 'test'
        ? locations
        : nextBatch(locations, mapRoundSize, progress, locationProgressKey);
    const sessionPairs = retryIds
      ? pairs.filter(pair => retryIds.includes(pair.id))
      : nextBatch<MemoryPair>(pairs, requestedMode === 'memory' ? activePairCount : 10, progress, pair => pair.id);

    setSession({ id: Date.now(), mode: requestedMode, locations: sessionLocations, pairs: sessionPairs });
    window.scrollTo({ top: 0 });
  };

  const modeButton = (mode: PlayMode, compact = false) => {
    const Icon = ICONS[mode];
    return <button
      key={mode}
      className={'journey-mode' + (compact ? ' compact' : '') + ` mode-${mode}`}
      onClick={() => start(mode)}
      disabled={!poolSize}
    >
      <Icon size={compact ? 18 : 22} />
      <span>{MODE_LABELS[mode]}</span>
      {!compact && <Play size={16} className="mode-play-icon" />}
    </button>;
  };

  const exploreFreely = () => {
    setActiveLocation(null);
    window.requestAnimationFrame(() => exploreRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const discoveryDetail = activeLocation && selectedFact && <MapFactCard
    className="discovery-detail"
    eyebrow="Coco vertelt"
    name={activeLocation.name}
    context={locationContext(activeLocation)}
    text={selectedFact.fact}
    inline={selection.topicId === 'flags'}
    onClose={() => setActiveLocation(null)}
  />;

  return <div className={'topo-app view-' + view + (session ? ' in-session' : '')}>
    <header className="app-header"><div className="header-inner">
      <a className="brand" href="#" onClick={event => { event.preventDefault(); navigate('discover'); }}>
        <img src="/images/logo-compas-geel.svg" width="40" height="40" alt="" />
        <span>Topo met Coco</span>
      </a>
      {!session && view === 'passport' && <button className="header-map-button" onClick={() => navigate('discover')}><ArrowLeft size={18} />Terug naar kaart</button>}
      <button className="points-button" onClick={() => navigate('passport')} aria-label={'Paspoort, ' + score + ' reispunten'}><Compass size={18} /><span>{score}</span></button>
    </div></header>

    <Suspense fallback={<div className="loading-screen" role="status">Even laden...</div>}>
      {session ? <main className="session-page">
        <div className="session-heading">
          <button className="back-button" onClick={() => setSession(null)}><ArrowLeft size={18} />Terug naar de kaart</button>
          <span>{context}</span>
          <strong>{MODE_LABELS[session.mode]}</strong>
        </div>
        {session.mode === 'memory' || session.mode === 'quiz'
          ? <LocationMemoryGame key={session.id} mode={session.mode} pairs={session.pairs} choicePool={pairs} onAnswer={onAnswer} onContinue={() => start(session.mode)} onRetry={ids => start(session.mode, ids)} onExit={() => setSession(null)} />
          : session.mode === 'test'
            ? <div className="test-workspace"><ToetsGame provinceId={selection.areaId} clusterId="all" studyPool={session.locations} /></div>
            : <GameEngine key={session.id} mode={session.mode} areaId={selection.areaId} locations={session.locations} mapLocations={locations} timerEnabled={timer} onAnswer={onAnswer} onContinue={() => start(session.mode)} onRetry={ids => start(session.mode, ids)} onExit={() => setSession(null)} />}
      </main> : view === 'passport'
        ? <Passport score={score} progress={progress} onPlay={() => navigate('discover')} storageAvailable={storageAvailable} />
        : <>
          <LearningSelection selection={selection} onChange={changeSelection} />
          <main className="discover-page">
            <section className="play-path" aria-label="Spel kiezen">
              <div className="coco-route">
                <img src="/images/logo-compas-geel.svg" width="52" height="52" alt="" />
                <div><p className="eyebrow">Coco's route</p><h2>Kies je route</h2></div>
              </div>
              <div className="quick-modes">
                <button className="journey-mode mode-explore" onClick={exploreFreely}><Map size={22} /><span>Vrij verkennen</span></button>
                {quickModes.map(mode => modeButton(mode))}
              </div>
              {(extraModes.length > 0 || pairOptions.length > 1 || hasTimerModes) && <details className="more-play">
                <summary><Settings2 size={17} />{modes.includes('memory') ? 'Memory en meer' : 'Meer spellen'}</summary>
                <div className="more-play-panel">
                  {extraModes.length > 0 && <div className="extra-mode-buttons">{extraModes.map(mode => modeButton(mode, true))}</div>}
                  {modes.includes('memory') && pairOptions.length > 1 && <fieldset className="compact-setting">
                    <legend>Memorysetjes</legend>
                    <div className="segmented">{pairOptions.map(count => <label key={count}><input type="radio" name="pair-count" checked={activePairCount === count} onChange={() => setPairCount(count)} /><span>{count}</span></label>)}</div>
                  </fieldset>}
                  {hasTimerModes && <label className="switch-label"><input type="checkbox" role="switch" checked={timer} onChange={event => setTimer(event.target.checked)} /><span className="switch-track" /><span>Timer</span></label>}
                </div>
              </details>}
            </section>

            <div className="map-toolbar">
              <h1>{areaName(selection.areaId)}</h1>
              {topics.length > 1 && <details className="topic-filter" ref={topicFilterRef}>
                <summary aria-label={`Onderwerp: ${TOPIC_LABELS[selection.topicId]}`}><ListFilter size={17} /><span>{selection.topicId === 'all' ? 'Filter' : TOPIC_LABELS[selection.topicId]}</span></summary>
                <div className="topic-filter-menu" role="group" aria-label="Kies een onderwerp">
                  {topics.map(topic => <button type="button" key={topic} aria-pressed={selection.topicId === topic} onClick={() => changeTopic(topic)}>
                    <span>{TOPIC_LABELS[topic]}</span>{selection.topicId === topic && <Check size={17} />}
                  </button>)}
                </div>
              </details>}
              <label className="switch-label"><input type="checkbox" role="switch" checked={showLabels} onChange={event => setShowLabels(event.target.checked)} /><span className="switch-track" /><span>Namen tonen</span></label>
            </div>

            <section className="map-zone" ref={exploreRef} aria-label="Vrij verkennen">
              {selection.topicId === 'flags' ? <>
                <div className="flag-atlas">{locations.map(location => <button key={location.id} className="flag-item" onClick={() => setActiveLocation(location)}><span className="atlas-flag" role="img" aria-label={showLabels ? 'Vlag van ' + location.name : 'Vlag'}>{COUNTRY_FLAGS[location.name]}</span><span>{showLabels || activeLocation?.id === location.id ? location.name : '?'}</span></button>)}</div>
                {discoveryDetail}
              </> : <div className="explore-stage">
                <div className="explore-map"><InteractiveMap selectedProvince={selection.areaId} locations={locations} onLocationClick={setActiveLocation} highlightedLocation={activeLocation?.id} showLabels={showLabels} /></div>
                {discoveryDetail}
              </div>}
              <div className="discovery-footer"><span>{locations.length} {selection.topicId === 'flags' ? 'vlaggen' : 'plekken'}</span><span>{practiced} geoefend</span></div>
            </section>
          </main>
        </>}
    </Suspense>
    {!storageAvailable && view !== 'passport' && <p className="storage-warning" role="status">Je voortgang kan in deze browser niet worden bewaard.</p>}
  </div>;
}
