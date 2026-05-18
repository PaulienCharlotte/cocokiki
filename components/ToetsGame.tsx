
import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { PROVINCES, LOCATIONS } from '../constants';
import { Location } from '../types';
import { CheckCircle, XCircle, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';

interface Props {
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
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color }}>{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((loc, i) => {
          const label   = getLabel(i);
          const correct = correctMap?.[loc.id];
          return (
            <div key={loc.id} className="flex items-start gap-2">
              <span
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white font-black text-[10px] mt-0.5"
                style={{ background: color }}
              >
                {label}
              </span>
              <div className="flex-1">
                <input
                  type="text"
                  disabled={submitted}
                  value={answers[loc.id] ?? ''}
                  onChange={e => onChange(loc.id, e.target.value)}
                  placeholder="naam…"
                  className={`w-full px-2.5 py-1.5 rounded-lg border-2 text-xs font-semibold outline-none transition-colors ${
                    submitted
                      ? correct
                        ? 'border-green-400 bg-green-50 text-green-800'
                        : 'border-red-400 bg-red-50 text-red-800'
                      : 'border-[#DDD6FE] bg-white text-slate-800 focus:border-[#7C3AED]'
                  }`}
                />
                {submitted && !correct && (
                  <div className="flex items-center gap-1 mt-0.5 pl-0.5">
                    <XCircle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <span className="text-[10px] text-red-600 font-semibold">{loc.name}</span>
                  </div>
                )}
                {submitted && correct && (
                  <div className="flex items-center gap-1 mt-0.5 pl-0.5">
                    <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── ToetsGame ────────────────────────────────────────────────────────────────

const ToetsGame: React.FC<Props> = ({ provinceId, clusterId }) => {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const [submitted, setSubmitted]     = useState(false);
  const [answers, setAnswers]         = useState<Record<string, string>>({});
  const [geoData, setGeoData]         = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Let the browser finish resizing before telling Leaflet
      setTimeout(() => mapRef.current?.invalidateSize(), 300);
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/highcharts/map-collection-dist/master/countries/nl/nl-all.geo.json')
      .then(r => r.json()).then(setGeoData);
  }, []);

  const locations = useMemo((): Location[] => {
    if (clusterId === 'provincies-en-hoofdsteden') {
      const caps = LOCATIONS.filter(l => l.isCapital);
      const provs = PROVINCES.map(p => ({
        id: p.id, name: p.name, provinceId: p.id,
        type: 'province' as const, lat: p.center[0], lng: p.center[1],
      }));
      return [...caps, ...provs];
    }
    if (clusterId === 'hoofdsteden') {
      return LOCATIONS.filter(l => l.isCapital && (provinceId === 'all' || l.provinceId === provinceId));
    }
    return LOCATIONS.filter(loc => {
      const provMatch    = provinceId === 'all' || loc.provinceId === provinceId;
      const clusterMatch = clusterId  === 'all' || loc.clusterId  === clusterId;
      return provMatch && clusterMatch;
    });
  }, [provinceId, clusterId]);

  const cities  = useMemo(() => locations.filter(l => l.type === 'city' || l.type === 'province'), [locations]);
  const waters  = useMemo(() => locations.filter(l => l.type === 'water'),  [locations]);
  const regions = useMemo(() => locations.filter(l => l.type === 'region'), [locations]);

  const labelMap = useMemo(() => {
    const m: Record<string, string> = {};
    cities.forEach((l, i)  => { m[l.id] = String(i + 1); });
    waters.forEach((l, i)  => { m[l.id] = String.fromCharCode(65 + i); });
    regions.forEach((l, i) => { m[l.id] = toRoman(i + 1); });
    return m;
  }, [cities, waters, regions]);

  // Map init
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current, {
      center: [52.1, 5.2], zoom: 8,
      zoomControl: false, attributionControl: false,
      maxBounds: [[50.0, 2.5], [54.5, 8.0]], minZoom: 7,
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd', maxZoom: 19,
    } as any).addTo(mapRef.current);
    setTimeout(() => { mapRef.current?.invalidateSize(); }, 200);
    return () => { mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  // GeoJSON province outlines
  useEffect(() => {
    if (!mapRef.current || !geoData) return;
    mapRef.current.eachLayer(l => { if (l instanceof L.GeoJSON) mapRef.current?.removeLayer(l); });
    L.geoJSON(geoData, {
      style: () => ({
        fillColor: '#DDD6FE', fillOpacity: 0.2,
        color: '#7C3AED', weight: 1.5, opacity: 0.7,
      }),
    }).addTo(mapRef.current).bringToBack();
  }, [geoData]);

  // Markers (no names shown — it's a test)
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.eachLayer(l => { if (l instanceof L.Marker) mapRef.current?.removeLayer(l); });

    const groupColor = (loc: Location) => {
      if (loc.type === 'water')  return '#38bdf8';
      if (loc.type === 'region') return '#7C3AED';
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

  const gradeColor =
    result && result.grade >= 8   ? 'text-green-600' :
    result && result.grade >= 5.5 ? 'text-amber-600' :
    'text-red-600';

  const gradeBg =
    result && result.grade >= 8   ? 'bg-green-50 border-green-300' :
    result && result.grade >= 5.5 ? 'bg-amber-50 border-amber-300' :
    'bg-red-50 border-red-300';

  const gradeMsg =
    result && result.grade >= 8   ? '🎉 Uitstekend!' :
    result && result.grade >= 5.5 ? '😊 Voldoende!'  :
    '📚 Nog meer oefenen!';

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-[#EDE9FE]">

      {/* Map */}
      <div className="flex-1 min-h-0 relative">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Fullscreen toggle — top-right of map */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Verkleinen' : 'Volledig scherm'}
          className="absolute top-3 right-3 z-[4000] w-8 h-8 bg-white rounded-lg shadow border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-[#F5F3FF] transition-colors"
        >
          {isFullscreen
            ? <Minimize2 className="w-4 h-4" />
            : <Maximize2 className="w-4 h-4" />}
        </button>

        <div className="absolute bottom-3 left-3 z-[4000] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-md">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Legenda</p>
          {[
            { color: '#EAB308', label: 'Plaatsen (1, 2, 3…)' },
            { color: '#38bdf8', label: 'Wateren (A, B, C…)'  },
            { color: '#7C3AED', label: 'Gebieden (I, II, III…)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 mb-1 last:mb-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[10px] font-semibold text-slate-600">{label}</span>
            </div>
          ))}
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-[4000]">
          <button onClick={() => mapRef.current?.zoomIn()}  className="w-8 h-8 bg-white rounded-lg shadow border border-slate-200 flex items-center justify-center text-slate-700 font-black text-lg leading-none hover:bg-[#F5F3FF] transition-colors">+</button>
          <button onClick={() => mapRef.current?.zoomOut()} className="w-8 h-8 bg-white rounded-lg shadow border border-slate-200 flex items-center justify-center text-slate-700 font-black text-lg leading-none hover:bg-[#F5F3FF] transition-colors">−</button>
        </div>
      </div>

      {/* Answer form — scrollable, capped at 50% of screen height */}
      <div className="flex-none overflow-y-auto bg-white border-t-[3px] border-[#7C3AED]" style={{ maxHeight: '50%' }}>
        <div className="p-4">

          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-black text-[#3B0764] text-sm">Vul de namen in</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Schrijf bij elk getal / letter de juiste naam</p>
            </div>
            {result && (
              <div className="text-right flex-shrink-0 ml-3">
                <div className={`font-black text-3xl leading-none ${gradeColor}`}>{result.grade}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{result.correct}/{result.total} goed</div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-5">
            <Section
              title="Plaatsen" color="#D97706" items={cities}
              getLabel={i => String(i + 1)}
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
            <p className="text-sm text-slate-400 text-center py-6">Selecteer een provincie of gebied om de toets te starten.</p>
          )}

          {!submitted ? (
            <button
              onClick={() => setSubmitted(true)}
              disabled={locations.length === 0}
              className="mt-5 w-full py-3 bg-[#7C3AED] disabled:bg-slate-300 disabled:shadow-none text-white font-black rounded-xl shadow-[0_4px_0_#5B21B6] active:translate-y-1 active:shadow-none transition-all text-sm"
            >
              Nakijken →
            </button>
          ) : (
            <div className="mt-5 flex flex-col gap-2">
              <div className={`px-4 py-3 rounded-xl text-center font-black text-sm border-2 ${gradeBg} ${gradeColor}`}>
                {gradeMsg} &nbsp;·&nbsp; Cijfer: {result!.grade}
              </div>
              <button
                onClick={() => { setSubmitted(false); setAnswers({}); }}
                className="w-full py-2.5 bg-[#F5F3FF] text-[#7C3AED] font-black rounded-xl border-2 border-[#DDD6FE] flex items-center justify-center gap-2 text-sm hover:bg-[#EDE9FE] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
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
