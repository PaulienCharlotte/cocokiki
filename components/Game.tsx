import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Brain, ChevronDown, Flag, Gamepad2, Map, MousePointer2, Play, Settings2, Type, Wand2, X } from 'lucide-react';
import { Location } from '../types';
import { areaName, availableModes, availableTopics, initialSelection, locationContext, locationProgressKey, memoryPairs, MemoryPair, MODE_LABELS, nextLearningGroup, PlayMode, Selection, studyLocations, TOPIC_LABELS, TopicId, validateSelection } from '../data/learning';
import { COUNTRY_FLAGS } from '../data/flags';
import { LOCATION_FACTS } from '../data/locationFacts';
import { nextBatch, PROGRESS_KEY, readProgress, recordAnswer, writeLocal } from '../services/localProgress';
import { awardCurrencyOnce, CURRENCY_CHANGE_EVENT, loadCurrency } from '../services/currency';
import LearningSelection from './LearningSelection';
import MapFactCard from './MapFactCard';
import PlatformHeader from './platform/PlatformHeader';
import { GameModuleProps } from '../platform/gameRegistry';

const InteractiveMap = lazy(() => import('./InteractiveMap'));
const GameEngine = lazy(() => import('./GameEngine'));
const LocationMemoryGame = lazy(() => import('./LocationMemoryGame'));
const ToetsGame = lazy(() => import('./ToetsGame'));

type OpenPanel = 'region' | 'play' | 'settings' | null;
interface Session { id: number; mode: PlayMode; locations: Location[]; pairs: MemoryPair[] }

const ICONS: Record<PlayMode, React.ComponentType<{ size?: number }>> = {
  find: MousePointer2,
  spell: Type,
  memory: Brain,
  quiz: Flag,
  master: Wand2,
  test: BookOpen,
};

const MAP_CATEGORY_FILTERS: Array<{ topic: TopicId; label: string; ariaLabel: string; className: string }> = [
  { topic: 'cities', label: 'Plaats', ariaLabel: 'Toon alle plaatsen', className: 'legend-city' },
  { topic: 'regions', label: 'Gebied', ariaLabel: 'Toon alle gebieden', className: 'legend-region' },
  { topic: 'waters', label: 'Water', ariaLabel: 'Toon alle wateren', className: 'legend-water' },
  { topic: 'countries', label: 'Land', ariaLabel: 'Toon alle landen', className: 'legend-country' },
];

export default function Game({ onHome, onBack }: Partial<GameModuleProps>) {
  const [selection, setSelection] = useState<Selection>(initialSelection);
  const [timer, setTimer] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState(readProgress);
  const [score, setScore] = useState(loadCurrency);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [showLabels, setShowLabels] = useState(() => selection.areaId !== 'benelux');
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const exploreRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const locations = useMemo(() => studyLocations(selection), [selection]);
  const pairs = useMemo(() => memoryPairs(selection), [selection]);
  const modes = useMemo(() => availableModes(selection), [selection]);
  const context = areaName(selection.areaId) + ' · ' + TOPIC_LABELS[selection.topicId];
  const practiced = (selection.topicId === 'flags' || selection.topicId === 'facts')
    ? pairs.filter(pair => progress[pair.id]).length
    : locations.filter(location => progress[locationProgressKey(location)]).length;
  const poolSize = selection.topicId === 'flags' || selection.topicId === 'facts' ? pairs.length : locations.length;
  const topics = useMemo(() => {
    const available = availableTopics(selection.areaId);
    return ['all', ...available.filter(topic => topic !== 'all')] as TopicId[];
  }, [selection.areaId]);
  const mapCategoryFilters = MAP_CATEGORY_FILTERS.filter(filter => topics.includes(filter.topic));

  const hasTimerModes = modes.some(mode => mode === 'find' || mode === 'spell' || mode === 'master');
  const selectedFact = activeLocation ? LOCATION_FACTS[activeLocation.name] : undefined;

  useEffect(() => {
    const savedProgress = writeLocal(PROGRESS_KEY, progress);
    setStorageAvailable(savedProgress);
  }, [progress]);
  useEffect(() => {
    const sync = () => setScore(loadCurrency());
    window.addEventListener(CURRENCY_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener(CURRENCY_CHANGE_EVENT, sync); window.removeEventListener('storage', sync); };
  }, []);

  useEffect(() => {
    if (!openPanel) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!toolbarRef.current?.contains(event.target as Node)) setOpenPanel(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPanel(null);
    };
    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [openPanel]);

  const onAnswer = useCallback((id: string, correct: boolean, points: number) => {
    setProgress(previous => recordAnswer(previous, id, correct));
    setScore(awardCurrencyOnce(`topo:${crypto.randomUUID()}`, points).balance);
  }, []);

  const changeSelection = (next: Selection) => {
    const validated = validateSelection(next);
    if (validated.areaId !== selection.areaId && validated.areaId === 'benelux') setShowLabels(false);
    setSelection(validated);
    setActiveLocation(null);
    setOpenPanel(null);
  };

  const changeTopic = (topicId: TopicId) => {
    changeSelection({ ...selection, topicId, clusterId: 'all' });
  };

  const start = (requestedMode: PlayMode, retryIds?: string[], sourceSelection = selection) => {
    const sourceLocations = studyLocations(sourceSelection);
    const sourcePairs = memoryPairs(sourceSelection);
    const roundSize = sourceLocations.length <= 12 ? sourceLocations.length : 10;
    const sessionLocations = retryIds
      ? sourceLocations.filter(location => retryIds.includes(location.id))
      : requestedMode === 'test'
        ? sourceLocations
        : nextBatch(sourceLocations, roundSize, progress, locationProgressKey);
    const sessionPairs = retryIds
      ? sourcePairs.filter(pair => retryIds.includes(pair.id))
      : nextBatch<MemoryPair>(sourcePairs, requestedMode === 'memory' ? Math.min(8, sourcePairs.length) : 10, progress, pair => pair.id);

    setSession({ id: Date.now(), mode: requestedMode, locations: sessionLocations, pairs: sessionPairs });
    window.scrollTo({ top: 0 });
  };

  const continueRoute = (mode: PlayMode) => {
    const nextSelection = nextLearningGroup(selection);
    if (nextSelection === selection) {
      start(mode);
      return;
    }
    setSelection(nextSelection);
    start(mode, undefined, nextSelection);
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
    setOpenPanel(null);
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

  const togglePanel = (panel: Exclude<OpenPanel, null>) => setOpenPanel(current => current === panel ? null : panel);

  const panelClose = <button type="button" className="map-panel-close" onClick={() => setOpenPanel(null)} aria-label="Sluiten"><X size={18} /></button>;

  const mapControls = () => <div className="map-control-shell" ref={toolbarRef}>
    <nav className="map-control-bar" aria-label="Kaartbediening">
      <button type="button" className="region-trigger" aria-expanded={openPanel === 'region'} onClick={() => togglePanel('region')}>
        <span><small>Gebied</small><strong>{areaName(selection.areaId)}</strong></span><ChevronDown size={17} />
      </button>
      <button type="button" className="map-action icon-only game-menu-trigger" title="Spelmodus kiezen" aria-label="Spelmodus kiezen" aria-expanded={openPanel === 'play'} onClick={() => togglePanel('play')} disabled={!poolSize}><Gamepad2 size={21} /></button>
      <button type="button" className="map-action icon-only" title="Kaartinstellingen" aria-label="Kaartinstellingen" aria-expanded={openPanel === 'settings'} onClick={() => togglePanel('settings')}><Settings2 size={19} /></button>
    </nav>

    {openPanel === 'region' && <section className="map-control-panel region-panel" aria-label="Gebied kiezen">
      <div className="panel-heading"><div><small>Kaartgebied</small><h2>Kies wat je wilt oefenen</h2></div>{panelClose}</div>
      <LearningSelection selection={selection} onChange={changeSelection} />
    </section>}

    {openPanel === 'play' && <section className="map-control-panel play-panel" aria-label="Spel kiezen">
      <div className="panel-heading"><div><small>Spelvorm</small><h2>Kies een uitdaging</h2></div>{panelClose}</div>
      <div className="extra-mode-buttons">
        <button type="button" className="journey-mode compact mode-explore" onClick={exploreFreely}><Map size={18} /><span>Verkennen</span></button>
        {modes.map(mode => modeButton(mode, true))}
      </div>
    </section>}

    {openPanel === 'settings' && <section className="map-control-panel settings-panel" aria-label="Kaartinstellingen">
      <div className="panel-heading"><div><small>Weergave</small><h2>Kaart instellen</h2></div>{panelClose}</div>
      {topics.length > 1 && <fieldset className="setting-block">
        <legend>Onderwerp</legend>
        <div className="topic-options">{topics.map(topic => <button type="button" key={topic} aria-pressed={selection.topicId === topic} onClick={() => changeTopic(topic)}>{TOPIC_LABELS[topic]}</button>)}</div>
      </fieldset>}
      <div className="settings-toggles">
        <label className="switch-label"><input type="checkbox" role="switch" checked={showLabels} onChange={event => setShowLabels(event.target.checked)} /><span className="switch-track" /><span>Namen tonen</span></label>
        {hasTimerModes && <label className="switch-label"><input type="checkbox" role="switch" checked={timer} onChange={event => setTimer(event.target.checked)} /><span className="switch-track" /><span>Timer bij spellen</span></label>}
      </div>
    </section>}
  </div>;

  return <div className={'topo-app view-discover' + (session ? ' in-session' : '')}>
    <PlatformHeader onHome={onHome} onBack={onBack} coins={score} />

    <Suspense fallback={<div className="loading-screen" role="status">Even laden...</div>}>
      {session ? <main className="session-page">
        <div className="session-heading">
          <button className="back-button" onClick={() => setSession(null)}><ArrowLeft size={18} />Terug naar de kaart</button>
          <span>{session.mode === 'memory' ? `${areaName(selection.areaId)} · Weetjes` : context}</span>
          <strong>{MODE_LABELS[session.mode]}</strong>
        </div>
        {session.mode === 'memory' || session.mode === 'quiz'
          ? <LocationMemoryGame key={session.id} mode={session.mode} pairs={session.pairs} choicePool={pairs} onAnswer={onAnswer} onContinue={() => continueRoute(session.mode)} onRepeat={() => start(session.mode, session.pairs.map(pair => pair.id))} onRetry={ids => start(session.mode, ids)} onExit={() => setSession(null)} />
          : session.mode === 'test'
            ? <div className="test-workspace"><ToetsGame provinceId={selection.areaId} clusterId="all" studyPool={session.locations} /></div>
            : <GameEngine key={session.id} mode={session.mode} areaId={selection.areaId} locations={session.locations} mapLocations={locations} timerEnabled={timer} onAnswer={onAnswer} onContinue={() => continueRoute(session.mode)} onRepeat={() => start(session.mode, session.locations.map(location => location.id))} onRetry={ids => start(session.mode, ids)} onExit={() => setSession(null)} />}
      </main> : <main className="discover-page">
            {mapControls()}
            <section className="map-zone" ref={exploreRef} aria-label="Vrij verkennen">
              {mapCategoryFilters.length > 0 && <div className="map-legend" role="group" aria-label="Toon op de kaart">
                <button type="button" className="legend-all" aria-pressed={selection.topicId === 'all'} onClick={() => changeTopic('all')}>Alles</button>
                {mapCategoryFilters.map(filter => <button
                  type="button"
                  key={filter.topic}
                  aria-label={filter.ariaLabel}
                  aria-pressed={selection.topicId === filter.topic}
                  onClick={() => changeTopic(filter.topic)}
                >
                  <i className={filter.className} />{filter.label}
                </button>)}
              </div>}
              {selection.topicId === 'flags' ? <>
                <div className="flag-atlas">{locations.map(location => <button key={location.id} className="flag-item" onClick={() => setActiveLocation(location)}><span className="atlas-flag" role="img" aria-label={showLabels ? 'Vlag van ' + location.name : 'Vlag'}>{COUNTRY_FLAGS[location.name]}</span><span>{showLabels || activeLocation?.id === location.id ? location.name : '?'}</span></button>)}</div>
                {discoveryDetail}
              </> : <div className="explore-stage">
                <div className="explore-map"><InteractiveMap selectedProvince={selection.areaId} locations={locations} onLocationClick={setActiveLocation} highlightedLocation={activeLocation?.id} showLabels={showLabels} /></div>
                {discoveryDetail}
              </div>}
              <div className="discovery-footer"><span>{locations.length} {selection.topicId === 'flags' ? 'vlaggen' : 'plekken'}</span><span>{practiced} geoefend</span></div>
            </section>
          </main>}
    </Suspense>
    {!storageAvailable && <p className="storage-warning" role="status">Je voortgang kan in deze browser niet worden bewaard.</p>}
  </div>;
}
