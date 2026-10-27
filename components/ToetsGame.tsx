
import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { PROVINCES, LOCATIONS } from '../constants';
import { Location } from '../types';
import { CheckCircle, XCircle, RotateCcw, Maximize2, Minimize2, Shuffle, HelpCircle, Settings2, ArrowLeft, ArrowRight, Check, ListChecks } from 'lucide-react';
import { UNLABELED_TILE_URL } from './InteractiveMap';
import { Button, Dialog, IconButton } from '../design-system';
import TipCoach from './TipCoach';
import './topo-test.css';
import { loadTestDraft, saveTestDraft, TestDraft } from '../services/topoTestDraft';
import { registerNavigationGuard } from '../services/navigationGuard';
import { nextUnansweredTestId, shuffledTestIds } from '../services/testNumbering';

interface Props {
  studyPool?: Location[];
  provinceId: string;
  clusterId: string;
  registerExit?: (request: (() => void) | null) => void;
  onExit?: () => void;
  onPractice?: (ids: string[]) => void;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const toRoman = (n: number): string => {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
};

const normalize = (s: string) => s.trim().toLowerCase().replace(/['']/g, "'").replace(/\s+/g, ' ');

const getCountryLocationForFeature = (feature: any) => {
  const props = feature?.properties ?? {};
  const iso = props['ISO3166-1-Alpha-3'];
  const name = props.name;
  return LOCATIONS.find(loc =>
    loc.provinceId === 'europe' && (loc.isoAlpha3 === iso || loc.geoName === name)
  );
};

// ── ToetsGame ────────────────────────────────────────────────────────────────

const ToetsGame: React.FC<Props> = ({ provinceId, clusterId, studyPool, registerExit, onExit, onPractice }) => {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const [submitted, setSubmitted]     = useState(false);
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [geoData, setGeoData]         = useState<any>(null);
  const [europeGeoData, setEuropeGeoData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [retryIds, setRetryIds] = useState<string[] | null>(null);
  const [orderIds, setOrderIds] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [deferredIds, setDeferredIds] = useState<string[]>([]);
  const previousResult = useRef<TestDraft | null>(null);
  const [panel, setPanel] = useState<'help' | 'settings' | 'review' | 'submit' | 'restart' | 'resume' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [storageOk, setStorageOk] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const pendingExit = useRef<(() => void) | null>(null);
  const isEuropeSelected = provinceId === 'europe';

  const toggleFullscreen = () => setIsFullscreen(f => !f);

  useEffect(() => {
    document.body.style.overflow = isFullscreen ? 'hidden' : '';
    setTimeout(() => mapRef.current?.invalidateSize(), 150);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) setIsFullscreen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  useEffect(() => {
    fetch('/data/geojson/nl-all.geo.json')
      .then(r => r.json()).then(setGeoData);
    fetch('/data/geojson/europe-countries.geo.json')
      .then(r => r.json()).then(setEuropeGeoData);
  }, []);

  const allLocations = useMemo((): Location[] => {
    if (studyPool) return studyPool;
    const studyAreaIds = new Set(PROVINCES.filter(p => p.isStudyArea).map(p => p.id));
    if (clusterId === 'provincies-en-hoofdsteden') {
      const caps = LOCATIONS.filter(l => l.isCapital && !studyAreaIds.has(l.provinceId));
      const provs = PROVINCES.filter(p => !p.isStudyArea).map(p => ({
        id: p.id, name: p.name, provinceId: p.id,
        type: 'province' as const, lat: p.center[0], lng: p.center[1],
      }));
      return [...caps, ...provs];
    }
    if (clusterId === 'hoofdsteden') {
      return LOCATIONS.filter(l => l.isCapital && (provinceId === 'all' ? !studyAreaIds.has(l.provinceId) : l.provinceId === provinceId));
    }
    return LOCATIONS.filter(loc => {
      const provMatch    = provinceId === 'all' ? !studyAreaIds.has(loc.provinceId) : loc.provinceId === provinceId;
      const clusterMatch = clusterId  === 'all' || loc.clusterId  === clusterId;
      return provMatch && clusterMatch;
    });
  }, [provinceId, clusterId, studyPool]);

  const ids = useMemo(() => allLocations.map(location => location.id), [allLocations]);
  const loadedKey = useRef('');
  useEffect(() => {
    const key = JSON.stringify(ids);
    if (loadedKey.current === key) return;
    loadedKey.current = key;
    const draft = loadTestDraft(ids);
    setOrderIds(draft.orderIds ?? []);
    if (draft.submitted) {
      previousResult.current = draft;
      setPanel('resume');
      return;
    }
    setAnswers(draft.answers); setSubmitted(false); setRetryIds(draft.retryIds); setDeferredIds(draft.deferredIds ?? []);
  }, [ids]);
  const locations = useMemo(() => {
    const pool = retryIds ? allLocations.filter(location => retryIds.includes(location.id)) : [...allLocations];
    if (orderIds.length) {
      const positions = new Map(orderIds.map((id, i) => [id, i]));
      pool.sort((a, b) => (positions.get(a.id) ?? ids.length) - (positions.get(b.id) ?? ids.length));
    }
    return pool;
  }, [allLocations, retryIds, orderIds, ids]);
  const active = locations.find(location => location.id === activeId) ?? locations[0];
  const areaRef = useRef(locations);
  areaRef.current = locations;
  const activeIndex = locations.indexOf(active);
  const filled = locations.filter(location => answers[location.id]?.trim()).length;
  const changed = !submitted && (deferredIds.length > 0 || Object.values(answers).some(value => typeof value === 'string' && value.trim()));
  const requestExit = (proceed: () => void) => {
    if (!changed) { proceed(); return; }
    pendingExit.current = proceed; setLeaving(true);
  };
  useEffect(() => {
    registerExit?.(() => requestExit(() => onExit?.()));
    const unregister = changed ? registerNavigationGuard(requestExit) : () => undefined;
    const warn = (event: BeforeUnloadEvent) => { if (changed) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => { registerExit?.(null); unregister(); window.removeEventListener('beforeunload', warn); };
  }, [changed, registerExit, onExit]);
  const persist = (nextAnswers: Record<string, string>, nextSubmitted: boolean, nextRetry: string[] | null, nextOrder = orderIds, nextDeferred = deferredIds) => {
    setStorageOk(saveTestDraft(ids, { answers: nextAnswers, submitted: nextSubmitted, retryIds: nextRetry, orderIds: nextOrder, deferredIds: nextDeferred }));
  };

  const cities  = useMemo(() => locations.filter(l => l.type === 'city' || l.type === 'province'), [locations]);
  const countries = useMemo(() => locations.filter(l => l.type === 'country'), [locations]);
  const waters  = useMemo(() => locations.filter(l => l.type === 'water'),  [locations]);
  const regions = useMemo(() => locations.filter(l => l.type === 'region'), [locations]);

  const labelMap = useMemo(() => {
    const m: Record<string, string> = {};
    cities.forEach((l, i)  => { m[l.id] = String(i + 1); });
    countries.forEach((l, i) => { m[l.id] = String(cities.length + i + 1); });
    waters.forEach((l, i)  => { m[l.id] = String.fromCharCode(65 + i); });
    regions.forEach((l, i) => { m[l.id] = toRoman(i + 1); });
    return m;
  }, [cities, countries, waters, regions]);

  const locationLabel = (location: Location) => `${location.type === 'water' ? 'Water' : location.type === 'region' ? 'Gebied' : location.type === 'country' ? 'Land' : 'Plek'} ${labelMap[location.id]}`;
  const selectNext = (direction: -1 | 1) => {
    if (!locations.length) return;
    setActiveId(locations[(activeIndex + direction + locations.length) % locations.length].id);
  };
  const saveAndNext = () => {
    if (active) setActiveId(nextUnansweredTestId(locations.map(location => location.id), active.id, answers, deferredIds));
  };
  const deferActive = () => {
    if (!active) return;
    const next = answers[active.id]?.trim() ? deferredIds : [...new Set([...deferredIds, active.id])];
    setDeferredIds(next);
    persist(answers, false, retryIds, orderIds, next);
    setActiveId(nextUnansweredTestId(locations.map(location => location.id), active.id, answers, next));
  };

  // Map init
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current, {
      center: [52.1, 5.2], zoom: 8,
      zoomControl: false, attributionControl: true,
      zoomSnap: .25, zoomDelta: .5,
      maxBounds: [[-85, -180], [85, 180]], minZoom: 2,
    });
    mapRef.current.attributionControl.setPrefix('');
    L.tileLayer(UNLABELED_TILE_URL, {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 18,
      maxNativeZoom: 9,
    } as any).addTo(mapRef.current);
    setTimeout(() => { mapRef.current?.invalidateSize(); }, 200);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const element = mapContainerRef.current;
    if (!map || !element) return;
    const observer = new ResizeObserver(() => {
      map.invalidateSize({ pan: false });
      const pool = areaRef.current;
      if (pool.length && element.clientHeight > 80) map.fitBounds(L.latLngBounds(pool.map(location => [location.lat, location.lng] as L.LatLngTuple)), { padding: [30, 30], maxZoom: 11, animate: false });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (active && mapRef.current) mapRef.current.panInside([active.lat, active.lng], { padding: [44, 44], animate: false });
  }, [active?.id]);

  // GeoJSON province outlines
  useEffect(() => {
    if (!mapRef.current) return;
    const activeGeoData = isEuropeSelected ? europeGeoData : geoData;
    if (!activeGeoData) return;
    mapRef.current.eachLayer(l => { if (l instanceof L.GeoJSON) mapRef.current?.removeLayer(l); });
    L.geoJSON(activeGeoData, {
      style: (feature) => {
        if (isEuropeSelected) {
          return {
            fillColor: getCountryLocationForFeature(feature) ? '#86EFAC' : '#DDD6FE',
            fillOpacity: 0.62,
            color: '#475569',
            weight: 1.2,
            opacity: 0.85,
          };
        }

        const provinceName = feature?.properties?.name ?? feature?.properties?.statnaam;
        const hcKey = feature?.properties?.['hc-key'] as string | undefined;
        const provinceId = hcKey?.replace('nl-', '');
        const normalizedName = provinceName === 'Fryslân' ? 'Friesland' : provinceName;
        const provData = PROVINCES.find(p => p.id === provinceId || p.name === normalizedName);
        return {
          fillColor: provData?.color ?? '#DDD6FE',
          fillOpacity: 0.72,
          color: '#475569',
          weight: 1.5,
          opacity: 0.85,
        };
      },
    }).addTo(mapRef.current);
  }, [geoData, europeGeoData, isEuropeSelected]);

  // Markers (no names shown — it's a test)
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.eachLayer(l => { if (l instanceof L.Marker) mapRef.current?.removeLayer(l); });

    const groupColor = (loc: Location) => {
      if (loc.type === 'water')  return '#38bdf8';
      if (loc.type === 'region') return '#7C3AED';
      if (loc.type === 'country') return '#22C55E';
      return '#EAB308';
    };

    locations.forEach(loc => {
      const label = labelMap[loc.id] ?? '?';
      const color = groupColor(loc);
      const selected = loc.id === active?.id;
      const checked = submitted ? normalize(answers[loc.id] ?? '') === normalize(loc.name) : null;

      const icon = L.divIcon({
        className: '',
        html: `<div class="test-pin${selected ? ' is-active' : ''}${answers[loc.id]?.trim() ? ' is-filled' : ''}${checked === true ? ' is-correct' : checked === false ? ' is-wrong' : ''}" style="--pin-color:${color}">${label}</div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 22],
      });
      const marker = L.marker([loc.lat, loc.lng], { icon, zIndexOffset: selected ? 1000 : 0 }).addTo(mapRef.current!);
      marker.getElement()?.setAttribute('aria-label', `${locationLabel(loc)}${answers[loc.id]?.trim() ? ', ingevuld' : ''}`);
      marker.on('click', () => { setActiveId(loc.id); if (!submitted) inputRef.current?.focus({ preventScroll: true }); });
    });
  }, [locations, labelMap, active?.id, answers, submitted]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (locations.length >= 1) {
      const lats = locations.map(l => l.lat);
      const lngs = locations.map(l => l.lng);
      mapRef.current.fitBounds([
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ], { padding: [30, 30], maxZoom: 11, animate: false });
    }
  }, [locations]);

  const result = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    const total = locations.length;
    const details: Record<string, boolean> = {};
    locations.forEach(loc => {
      const ok = normalize(answers[loc.id] ?? '') === normalize(loc.name);
      details[loc.id] = ok;
      if (ok) correct++;
    });
    const grade = total === 0 ? 10 : Math.round((1 + (correct / total) * 9) * 10) / 10;
    return { correct, total, grade, details };
  }, [submitted, answers, locations]);

  const handleChange = (id: string, val: string) => {
    const next = { ...answers, [id]: val };
    const pending = val.trim() ? deferredIds.filter(placeId => placeId !== id) : deferredIds;
    setAnswers(next); setDeferredIds(pending); persist(next, submitted, retryIds, orderIds, pending);
  };

  const submit = () => { setSubmitted(true); persist(answers, true, retryIds); setPanel(null); };
  const shuffle = () => {
    const nextOrder = [cities, countries, waters, regions].flatMap(group => shuffledTestIds(group.map(location => location.id)));
    setOrderIds(nextOrder); persist(answers, submitted, retryIds, nextOrder); setPanel(null);
  };
  const restart = () => { setSubmitted(false); setAnswers({}); setRetryIds(null); setActiveId(null); setDeferredIds([]); persist({}, false, null, orderIds, []); setPanel(null); };
  const restoreResult = () => {
    const draft = previousResult.current;
    if (!draft) return;
    setAnswers(draft.answers); setSubmitted(true); setRetryIds(draft.retryIds); setOrderIds(draft.orderIds ?? []); setDeferredIds(draft.deferredIds ?? []); setPanel(null);
  };

  return (
    <div
      ref={containerRef}
      className={`toets-game test-focused${isFullscreen ? ' is-fullscreen' : ''}`}
    >
      <header className="test-focused__toolbar">
        <div><strong>{submitted ? 'Jouw toets' : 'Topo-toets'}</strong><span aria-live="polite">{submitted ? `${result?.correct} van ${locations.length} goed · ${result?.grade}` : `${filled} van ${locations.length} ingevuld`}</span></div>
        <div>
          <IconButton label="Uitleg van Seb" icon={<HelpCircle size={20} />} onClick={() => setPanel('help')} />
          <IconButton label="Toetsinstellingen voor ouders" icon={<Settings2 size={20} />} onClick={() => setPanel('settings')} />
        </div>
      </header>
      {/* Map */}
      <div className="toets-map-stage">
        <div ref={mapContainerRef} className="toets-map" />

        {/* Fullscreen toggle — top-right of map */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Verkleinen' : 'Volledig scherm'}
          className="toets-map-button toets-fullscreen-button"
        >
          {isFullscreen
            ? <Minimize2 />
            : <Maximize2 />}
        </button>

        <div className="toets-zoom-controls">
          <button onClick={() => mapRef.current?.zoomIn()} aria-label="Inzoomen">+</button>
          <button onClick={() => mapRef.current?.zoomOut()} aria-label="Uitzoomen">−</button>
        </div>
      </div>

      <section className="test-focused__answer" aria-label="Antwoord bij de gekozen plek">
        {active ? <>
          <div className="test-focused__place">
            <IconButton label="Vorige plek" icon={<ArrowLeft size={20} />} onClick={() => selectNext(-1)} />
            <label htmlFor="topo-active-answer">{submitted ? locationLabel(active) : `Hoe heet ${locationLabel(active).toLowerCase()}?`}</label>
            <IconButton label="Volgende plek" icon={<ArrowRight size={20} />} onClick={() => selectNext(1)} />
          </div>
          {!submitted ? <form className="test-focused__form" onSubmit={event => { event.preventDefault(); saveAndNext(); inputRef.current?.focus(); }}>
            <input ref={inputRef} id="topo-active-answer" aria-label={`Naam bij ${locationLabel(active).toLowerCase()}`} value={answers[active.id] ?? ''} onChange={event => handleChange(active.id, event.target.value)} placeholder="Naam…" autoComplete="off" autoCorrect="off" spellCheck={false} />
            <IconButton type="submit" label="Bewaar en ga naar de volgende plek" icon={<Check size={22} />} />
          </form> : <p className={`test-focused__feedback ${result?.details[active.id] ? 'is-correct' : 'is-wrong'}`}>
            {result?.details[active.id] ? <CheckCircle size={20} /> : <XCircle size={20} />}<span>{answers[active.id] || 'Niet ingevuld'}{!result?.details[active.id] && <strong>Het is {active.name}.</strong>}</span>
          </p>}
        </> : <p>Kies eerst een gebied voor je toets.</p>}
        <div className="test-focused__actions">
          {!submitted ? <>
            <Button variant="quiet" size="small" startIcon={<RotateCcw size={18} />} onClick={deferActive}>Later terugkomen{deferredIds.length > 0 ? ` (${deferredIds.length})` : ''}</Button>
            <Button size="small" disabled={!locations.length} onClick={() => filled < locations.length ? setPanel('submit') : submit()}>Nakijken</Button>
          </> : <>
            <Button variant="secondary" size="small" startIcon={<ListChecks size={18} />} onClick={() => setPanel('review')}>Antwoorden bekijken</Button>
            {onPractice && result && result.correct < result.total && <Button size="small" startIcon={<RotateCcw size={18} />} onClick={() => onPractice(locations.filter(location => !result.details[location.id]).map(location => location.id))}>Oefen lastige plekken</Button>}
          </>}
        </div>
      </section>
      {panel === 'resume' && <Dialog open title="Er is een vorige uitslag" description="Wil je een nieuwe toets beginnen of je vorige uitslag bekijken?" onClose={restoreResult} primaryAction={<Button onClick={restart}>Nieuwe toets beginnen</Button>} secondaryAction={<Button variant="secondary" onClick={restoreResult}>Vorige uitslag bekijken</Button>} />}
      {panel === 'help' && <Dialog open title="Zo werkt de toets" onClose={() => setPanel(null)} primaryAction={<Button onClick={() => setPanel(null)}>Ik ga beginnen</Button>}>
        <TipCoach coach="seb">Tik op een nummer of letter op de kaart. Typ de naam en tik op het vinkje. Weet je het even niet? Kies Later terugkomen. Die plek komt na de andere lege plekken terug. Pas bij Nakijken zie je wat goed is.</TipCoach>
      </Dialog>}
      {panel === 'settings' && <Dialog open title="Voor ouders" onClose={() => setPanel(null)} primaryAction={<Button variant="secondary" startIcon={<Shuffle size={18} />} disabled={submitted} onClick={shuffle}>Nummering husselen</Button>} secondaryAction={<Button variant="quiet" onClick={() => setPanel('restart')}>Nieuwe toets</Button>}>
        <p>Nummers en letters wisselen van plek. Ingevulde antwoorden blijven bij de juiste locatie bewaard.</p>
      </Dialog>}
      {panel === 'restart' && <Dialog open title="Nieuwe toets starten?" description="De ingevulde antwoorden van deze toets worden gewist." onClose={() => setPanel(null)} primaryAction={<Button onClick={() => setPanel(null)}>Deze toets houden</Button>} secondaryAction={<Button variant="danger" onClick={restart}>Nieuwe toets starten</Button>} />}
      {panel === 'submit' && <Dialog open title="Nog niet alles ingevuld" description={`${locations.length - filled} plekken zijn nog leeg. Wil je verdergaan of toch nakijken?`} onClose={() => setPanel(null)} primaryAction={<Button onClick={() => setPanel(null)}>Verder invullen</Button>} secondaryAction={<Button variant="secondary" onClick={submit}>Toch nakijken</Button>} />}
      {panel === 'review' && result && <Dialog open className="test-review" title={`Jouw toets · ${result.grade}`} description={`${result.correct} van ${result.total} goed`} onClose={() => setPanel(null)} primaryAction={<Button onClick={() => setPanel(null)}>Terug naar de kaart</Button>}>
        <ul>{locations.map(location => <li key={location.id}><button type="button" onClick={() => { setActiveId(location.id); setPanel(null); }}>
          {result.details[location.id] ? <CheckCircle size={18} /> : <XCircle size={18} />}<span>{locationLabel(location)}<strong>{location.name}</strong><small>{answers[location.id] || 'Niet ingevuld'}</small></span>
        </button></li>)}</ul>
      </Dialog>}
      {!storageOk && <p role="alert">Opslaan lukt niet. Houd deze toets open om je antwoorden te bewaren.</p>}
      {leaving && <Dialog open title="Toets even verlaten?" description={storageOk ? 'Je antwoorden blijven bewaard. Je kunt later verdergaan.' : 'Je antwoorden zijn nog niet opgeslagen. Als je vertrekt, kun je ze kwijtraken.'} onClose={() => setLeaving(false)}
        primaryAction={<Button onClick={() => setLeaving(false)}>Verder met de toets</Button>}
        secondaryAction={<Button variant="secondary" onClick={() => { const proceed = pendingExit.current; pendingExit.current = null; setLeaving(false); proceed?.(); }}>Toets verlaten</Button>} />}
    </div>
  );
};

export default ToetsGame;
