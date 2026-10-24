
import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { PROVINCES, LOCATIONS } from '../constants';
import { Location } from '../types';
import { CheckCircle, XCircle, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { UNLABELED_TILE_URL } from './InteractiveMap';

interface Props {
  studyPool?: Location[];
  provinceId: string;
  clusterId: string;
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
const NL_BOUNDS: L.LatLngBoundsExpression = [[50.75, 3.35], [53.55, 7.22]];
const EUROPE_BOUNDS: L.LatLngBoundsExpression = [[34.5, -24.5], [71.5, 45.5]];

const getCountryLocationForFeature = (feature: any) => {
  const props = feature?.properties ?? {};
  const iso = props['ISO3166-1-Alpha-3'];
  const name = props.name;
  return LOCATIONS.find(loc =>
    loc.provinceId === 'europe' && (loc.isoAlpha3 === iso || loc.geoName === name)
  );
};

// ── Section — defined OUTSIDE ToetsGame so React never unmounts inputs ───────

interface SectionProps {
  title: string;
  color: string;
  items: Location[];
  getLabel: (i: number) => string;
  answers: Record<string, string>;
  submitted: boolean;
  correctMap: Record<string, boolean> | null;
  onChange: (id: string, val: string) => void;
}

const Section: React.FC<SectionProps> = ({
  title, color, items, getLabel, answers, submitted, correctMap, onChange,
}) => {
  if (!items.length) return null;
  return (
    <section className="toets-section">
      <h3 className="toets-section-title" style={{ color }}>{title}</h3>
      <div className="toets-answer-grid">
        {items.map((loc, i) => {
          const label   = getLabel(i);
          const correct = correctMap?.[loc.id];
          return (
            <div key={loc.id} className="toets-answer-row">
              <span
                className="toets-answer-label"
                style={{ background: color }}
              >
                {label}
              </span>
              <div className="toets-answer-field">
                <input
                  type="text"
                  disabled={submitted}
                  value={answers[loc.id] ?? ''}
                  onChange={e => onChange(loc.id, e.target.value)}
                  placeholder="naam…"
                  className={`toets-answer-input${submitted ? correct ? ' is-correct' : ' is-wrong' : ''}`}
                />
                {submitted && !correct && (
                  <div className="toets-answer-feedback is-wrong">
                    <XCircle />
                    <span>{loc.name}</span>
                  </div>
                )}
                {submitted && correct && (
                  <div className="toets-answer-feedback is-correct">
                    <CheckCircle />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ── ToetsGame ────────────────────────────────────────────────────────────────

const ToetsGame: React.FC<Props> = ({ provinceId, clusterId, studyPool }) => {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const [submitted, setSubmitted]     = useState(false);
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [geoData, setGeoData]         = useState<any>(null);
  const [europeGeoData, setEuropeGeoData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  const locations = useMemo((): Location[] => {
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

  // Map init
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current, {
      center: [52.1, 5.2], zoom: 8,
      zoomControl: false, attributionControl: true,
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
      const size  = label.length > 3 ? 28 : 24;
      const fs    = label.length > 3 ? '8px' : label.length > 2 ? '9px' : '11px';

      const icon = L.divIcon({
        className: '',
        html: `<div style="background:${color};color:white;font-weight:900;font-size:${fs};width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);font-family:'Fredoka',sans-serif;letter-spacing:-0.5px;box-sizing:border-box;">${label}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      L.marker([loc.lat, loc.lng], { icon }).addTo(mapRef.current!);
    });

    if (locations.length >= 2) {
      const lats = locations.map(l => l.lat);
      const lngs = locations.map(l => l.lng);
      mapRef.current.fitBounds([
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)],
      ], { padding: [50, 50], maxZoom: 11, animate: false });
    }
  }, [locations, labelMap]);

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

  const handleChange = useMemo(
    () => (id: string, val: string) => setAnswers(a => ({ ...a, [id]: val })),
    [],
  );

  const resultTone = result && result.grade >= 8 ? 'good' : result && result.grade >= 5.5 ? 'pass' : 'retry';

  const gradeMsg =
    result && result.grade >= 8   ? '🎉 Uitstekend!' :
    result && result.grade >= 5.5 ? '😊 Voldoende!'  :
    '📚 Nog meer oefenen!';

  return (
    <div
      ref={containerRef}
      className={`toets-game${isFullscreen ? ' is-fullscreen' : ''}`}
    >

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

        <div className="toets-legend">
          <p>Legenda</p>
          {[
            { color: '#EAB308', label: 'Plaatsen (1, 2, 3…)' },
            { color: '#38bdf8', label: 'Wateren (A, B, C…)'  },
            { color: '#7C3AED', label: 'Gebieden (I, II, III…)' },
          ].map(({ color, label }) => (
            <div key={label}>
              <i style={{ background: color }} />
              <span>{label}</span>
            </div>
          ))}
        </div>

        <div className="toets-zoom-controls">
          <button onClick={() => mapRef.current?.zoomIn()} aria-label="Inzoomen">+</button>
          <button onClick={() => mapRef.current?.zoomOut()} aria-label="Uitzoomen">−</button>
        </div>
      </div>

      {/* Answer form — scrollable, capped at ~55% screen height on mobile, 50% desktop */}
      <div className="toets-answer-panel">
        <div className="toets-answer-content">

          <div className="toets-answer-heading">
            <div>
              <h2>Vul de namen in</h2>
              <p>Schrijf bij elk getal / letter de juiste naam</p>
            </div>
            {result && (
              <div className={`toets-score is-${resultTone}`}>
                <strong>{result.grade}</strong>
                <span>{result.correct}/{result.total} goed</span>
              </div>
            )}
          </div>

          <div className="toets-sections">
            <Section
              title="Plaatsen" color="#D97706" items={cities}
              getLabel={i => String(i + 1)}
              answers={answers} submitted={submitted}
              correctMap={result?.details ?? null} onChange={handleChange}
            />
            <Section
              title="Landen" color="#16A34A" items={countries}
              getLabel={i => String(cities.length + i + 1)}
              answers={answers} submitted={submitted}
              correctMap={result?.details ?? null} onChange={handleChange}
            />
            <Section
              title="Wateren" color="#0284C7" items={waters}
              getLabel={i => String.fromCharCode(65 + i)}
              answers={answers} submitted={submitted}
              correctMap={result?.details ?? null} onChange={handleChange}
            />
            <Section
              title="Gebieden" color="#6D28D9" items={regions}
              getLabel={i => toRoman(i + 1)}
              answers={answers} submitted={submitted}
              correctMap={result?.details ?? null} onChange={handleChange}
            />
          </div>

          {locations.length === 0 && (
            <p className="toets-empty">Selecteer een provincie of gebied om de toets te starten.</p>
          )}

          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={locations.length === 0}
              className="toets-submit"
            >
              Nakijken →
            </button>
          ) : (
            <div className="toets-result-actions">
              <div className={`toets-result is-${resultTone}`}>
                {gradeMsg} &nbsp;·&nbsp; Cijfer: {result!.grade}
              </div>
              <button
                onClick={() => { setSubmitted(false); setAnswers({}); }}
                className="toets-retry"
              >
                <RotateCcw />
                Opnieuw proberen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToetsGame;
