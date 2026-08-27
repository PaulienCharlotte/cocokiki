
import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { PROVINCES } from '../constants';
import { Province } from '../types';

type SubMode = 'menu' | 'provinces' | 'capitals';

const REAL_PROVINCES = PROVINCES.filter(p => !p.isStudyArea);

interface ProvincesGameProps {
  onScoreChange: (pts: number) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getCapitalOptions = (correct: Province): string[] => {
  const others = REAL_PROVINCES.filter(p => p.id !== correct.id);
  const wrong = shuffle(others).slice(0, 3).map(p => p.capital);
  return shuffle([correct.capital, ...wrong]);
};

// ── Menu ──────────────────────────────────────────────────────────────────────

const MenuScreen: React.FC<{ onSelect: (m: SubMode) => void }> = ({ onSelect }) => (
  <div className="flex flex-col items-center justify-center h-full gap-6 p-8 bg-gradient-to-b from-[#3B0764] to-[#4C1D95]">
    <div className="text-center text-white">
      <div className="text-5xl mb-3">🗺️</div>
      <h2 className="text-2xl font-black">Provincies &amp; Hoofdsteden</h2>
      <p className="text-[#C4B5FD] text-sm mt-1">Kies een spelmodus</p>
    </div>

    <div className="flex flex-col gap-4 w-full max-w-xs">
      <button
        onClick={() => onSelect('provinces')}
        className="bg-white rounded-2xl p-5 text-left shadow-xl hover:scale-105 transition-transform active:scale-95"
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">🗺️</span>
          <div>
            <div className="font-black text-[#3B0764] text-base">Provincies Aanwijzen</div>
            <div className="text-[#6D28D9] text-xs font-medium mt-0.5">Klik de juiste provincie op de kaart</div>
          </div>
        </div>
      </button>

      <button
        onClick={() => onSelect('capitals')}
        className="bg-white rounded-2xl p-5 text-left shadow-xl hover:scale-105 transition-transform active:scale-95"
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl">🏛️</span>
          <div>
            <div className="font-black text-[#3B0764] text-base">Hoofdsteden Raden</div>
            <div className="text-[#6D28D9] text-xs font-medium mt-0.5">Welke stad is de hoofdstad van …?</div>
          </div>
        </div>
      </button>
    </div>
  </div>
);

// ── Provinces Map Quiz ────────────────────────────────────────────────────────

interface MapFeedback {
  type: 'correct' | 'wrong';
  clicked: string;
  correct: string;
}

// Highcharts hc-key suffix directly matches our province IDs (nl-nh → nh)
const provFromFeature = (feature: any): Province | undefined => {
  const hcKey = feature?.properties?.['hc-key'] as string | undefined;
  const id = hcKey?.replace('nl-', '');
  const name = feature?.properties?.name ?? feature?.properties?.statnaam;
  const normalizedName = name === 'Fryslân' ? 'Friesland' : name;
  return PROVINCES.find(p => p.id === id || p.name === normalizedName);
};

const ProvincesMapQuiz: React.FC<{ onScoreChange: (pts: number) => void; onBack: () => void }> = ({
  onScoreChange,
  onBack,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const geoLayerRef     = useRef<L.GeoJSON | null>(null);
  const dotsLayerRef    = useRef<L.LayerGroup | null>(null);
  const processingRef   = useRef(false);
  const onScoreRef      = useRef(onScoreChange);
  useEffect(() => { onScoreRef.current = onScoreChange; }, [onScoreChange]);

  const [geoData, setGeoData]     = useState<any>(null);
  const [target, setTarget]       = useState<Province | null>(null);
  const [feedback, setFeedback]   = useState<MapFeedback | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [streak, setStreak]       = useState(0);
  const [total, setTotal]         = useState(0);

  useEffect(() => {
    fetch('/data/geojson/nl-all.geo.json')
      .then(r => r.json()).then(setGeoData);
  }, []);

  const pickNext = useCallback(() => {
    const idx = Math.floor(Math.random() * REAL_PROVINCES.length);
    setTarget(REAL_PROVINCES[idx]);
    setFeedback(null);
    processingRef.current = false;
  }, []);

  useEffect(() => { pickNext(); }, [pickNext]);

  // Init map once — zoom 8, tight NL bounds (same as InteractiveMap)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapRef.current = L.map(mapContainerRef.current, {
      center: [52.3, 5.3],
      zoom: 8,
      zoomControl: false,
      attributionControl: false,
      maxBounds: [[50.5, 3.0], [54.0, 7.5]],
      minZoom: 7,
      tap: true,
      dragging: true,
      touchZoom: true,
    });
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 18,
      detectRetina: true,
    } as any).addTo(mapRef.current);
    setTimeout(() => { if (mapRef.current) mapRef.current.invalidateSize(); }, 200);

    // ResizeObserver zodat de kaart bij layoutwijzigingen correct vult
    const ro = new ResizeObserver(() => { if (mapRef.current) mapRef.current.invalidateSize(); });
    ro.observe(mapContainerRef.current);

    return () => {
      ro.disconnect();
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  // Verwerkt een klik op een provincie (polygon of stip)
  const handleClick = useCallback((prov: Province) => {
    if (processingRef.current || !target) return;
    processingRef.current = true;
    const isCorrect = prov.id === target.id;
    setFeedback({ type: isCorrect ? 'correct' : 'wrong', clicked: prov.id, correct: target.id });
    if (isCorrect) {
      onScoreRef.current(10);
      setQuizScore(s => s + 10);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
    setTotal(t => t + 1);
    setTimeout(pickNext, 1500);
  }, [target, pickNext]);

  // Rebuild lagen bij target/feedback wijziging
  useEffect(() => {
    if (!mapRef.current || !geoData || !target) return;

    // Verwijder oude lagen
    if (geoLayerRef.current) { mapRef.current.removeLayer(geoLayerRef.current); geoLayerRef.current = null; }
    if (dotsLayerRef.current) { mapRef.current.removeLayer(dotsLayerRef.current); dotsLayerRef.current = null; }

    const currentFeedback = feedback;

    // ── GeoJSON polygonen ──
    geoLayerRef.current = L.geoJSON(geoData, {
      style: (feature) => {
        const prov = provFromFeature(feature);
        let fillColor   = prov?.color ?? '#f1f5f9';
        let fillOpacity = 0.72;
        let color       = '#475569';
        let weight      = 1.5;

        if (currentFeedback && prov) {
          if (prov.id === currentFeedback.clicked) {
            fillColor   = currentFeedback.type === 'correct' ? '#22C55E' : '#EF4444';
            fillOpacity = 0.75;
            color       = currentFeedback.type === 'correct' ? '#16A34A' : '#DC2626';
            weight      = 3;
          } else if (currentFeedback.type === 'wrong' && prov.id === currentFeedback.correct) {
            fillColor   = '#86EFAC';
            fillOpacity = 0.55;
            color       = '#16A34A';
            weight      = 2.5;
          }
        }
        return { fillColor, fillOpacity, color, weight };
      },
      onEachFeature: (feature, layer) => {
        const prov = provFromFeature(feature);
        if (!prov) return;
        layer.on('click', () => handleClick(prov));
        layer.on('mouseover', () => { if (!processingRef.current) (layer as L.Path).setStyle({ fillOpacity: 0.84 }); });
        layer.on('mouseout',  () => { if (!processingRef.current) (layer as L.Path).setStyle({ fillOpacity: 0.72 }); });
      },
    }).addTo(mapRef.current);

    // ── 12 provincie-stippen ──
    dotsLayerRef.current = L.layerGroup();
    REAL_PROVINCES.forEach(prov => {
      let dotColor = '#7C3AED';
      let radius   = 8;
      let border   = '#ffffff';

      if (currentFeedback) {
        if (prov.id === currentFeedback.clicked) {
          dotColor = currentFeedback.type === 'correct' ? '#22C55E' : '#EF4444';
          radius   = 11;
        } else if (currentFeedback.type === 'wrong' && prov.id === currentFeedback.correct) {
          dotColor = '#22C55E';
          radius   = 11;
        }
      } else if (prov.id === target.id) {
        dotColor = '#F59E0B';
        radius   = 10;
        border   = '#ffffff';
      }

      const dot = L.circleMarker([prov.center[0], prov.center[1]], {
        radius,
        fillColor: dotColor,
        color: border,
        weight: 2.5,
        fillOpacity: 0.95,
      });
      dot.on('click', () => handleClick(prov));
      dot.addTo(dotsLayerRef.current!);
    });
    dotsLayerRef.current.addTo(mapRef.current);

  }, [geoData, target, feedback, handleClick]);

  const pct = total > 0 ? Math.round((quizScore / 10 / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="bg-[#3B0764] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#C4B5FD] hover:text-white font-bold text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Terug
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-sm">⭐ {quizScore}</span>
          <span className="text-[#EAB308] font-bold text-sm">🔥 {streak}</span>
          {total > 0 && <span className="text-[#C4B5FD] text-xs">{pct}% goed</span>}
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        {target && (
          <motion.div
            key={target.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="bg-white shadow-md px-4 py-3 text-center flex-shrink-0"
          >
            <p className="text-[10px] text-[#7C3AED] font-black uppercase tracking-widest">Klik op de provincie:</p>
            <p className="text-2xl font-black text-[#3B0764] mt-0.5">{target.name}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback bar */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            className={`px-4 py-2 text-center font-black text-sm flex-shrink-0 ${
              feedback.type === 'correct' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {feedback.type === 'correct'
              ? '✓ Goed gedaan! +10 punten'
              : `✗ Onjuist — het was ${PROVINCES.find(p => p.id === feedback.correct)?.name}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map */}
      <div ref={mapContainerRef} className="flex-1 min-h-0" />
    </div>
  );
};

// ── Capitals Quiz ─────────────────────────────────────────────────────────────

const CapitalsQuiz: React.FC<{ onScoreChange: (pts: number) => void; onBack: () => void }> = ({
  onScoreChange,
  onBack,
}) => {
  const [curProv, setCurProv] = useState<Province>(() => {
    const p = REAL_PROVINCES[Math.floor(Math.random() * REAL_PROVINCES.length)];
    return p;
  });
  const [options, setOptions]   = useState<string[]>(() => getCapitalOptions(curProv));
  const [selected, setSelected] = useState<string | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [streak, setStreak]       = useState(0);
  const [total, setTotal]         = useState(0);

  const nextQuestion = useCallback(() => {
    const next = REAL_PROVINCES[Math.floor(Math.random() * REAL_PROVINCES.length)];
    setCurProv(next);
  }, []);

  useEffect(() => {
    setOptions(getCapitalOptions(curProv));
    setSelected(null);
  }, [curProv]);

  const handleSelect = useCallback((opt: string) => {
    if (selected) return;
    setSelected(opt);

    const isCorrect = opt === curProv.capital;
    setTotal(t => t + 1);

    if (isCorrect) {
      onScoreChange(10);
      setQuizScore(s => s + 10);
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(nextQuestion, 1300);
  }, [selected, curProv, onScoreChange, nextQuestion]);

  const pct = total > 0 ? Math.round((quizScore / 10 / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-auto bg-[#F5F3FF]">
      {/* Top bar */}
      <div className="bg-[#3B0764] px-4 py-2 flex items-center justify-between flex-shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#C4B5FD] hover:text-white font-bold text-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Terug
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white font-black text-sm">⭐ {quizScore}</span>
          <span className="text-[#EAB308] font-bold text-sm">🔥 {streak}</span>
          {total > 0 && <span className="text-[#C4B5FD] text-xs">{pct}% goed</span>}
        </div>
      </div>

      {/* Quiz content */}
      <div className="flex-1 flex flex-col items-center justify-center p-5 gap-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={curProv.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-md"
          >
            {/* Province card */}
            <div
              className="rounded-3xl px-6 py-5 mb-5 text-center shadow-xl border-4 border-white"
              style={{ backgroundColor: curProv.color }}
            >
              <p className="text-[10px] font-black text-[#3B0764]/60 uppercase tracking-widest mb-1">
                Wat is de hoofdstad van:
              </p>
              <p className="text-3xl font-black text-[#1E1B4B]">{curProv.name}</p>
            </div>

            {/* Options */}
            <div className="grid grid-cols-2 gap-3">
              {options.map(opt => {
                let cls = 'bg-white border-2 border-[#DDD6FE] hover:border-[#7C3AED] hover:bg-[#EDE9FE] text-[#3B0764]';

                if (selected) {
                  if (opt === curProv.capital) {
                    cls = 'bg-green-500 border-2 border-green-600 text-white';
                  } else if (opt === selected) {
                    cls = 'bg-red-500 border-2 border-red-600 text-white';
                  } else {
                    cls = 'bg-gray-100 border-2 border-gray-200 text-gray-400 opacity-60';
                  }
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelect(opt)}
                    disabled={!!selected}
                    className={`${cls} rounded-2xl px-4 py-4 font-black text-sm shadow-md transition-all active:scale-95 disabled:cursor-default`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Feedback text */}
            <AnimatePresence>
              {selected && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 text-center rounded-2xl py-2.5 px-4 font-black text-sm ${
                    selected === curProv.capital
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {selected === curProv.capital
                    ? `✓ Goed! ${curProv.capital} is de hoofdstad!`
                    : `✗ Helaas! Het was ${curProv.capital}`}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* Stats */}
        {total > 0 && (
          <div className="flex gap-4 text-center">
            <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
              <div className="font-black text-[#3B0764] text-lg">{total}</div>
              <div className="text-xs text-slate-400 font-medium">vragen</div>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
              <div className="font-black text-[#EAB308] text-lg">{streak}</div>
              <div className="text-xs text-slate-400 font-medium">reeks</div>
            </div>
            <div className="bg-white rounded-xl px-4 py-2 shadow-sm">
              <div className="font-black text-green-600 text-lg">{pct}%</div>
              <div className="text-xs text-slate-400 font-medium">goed</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main ──────────────────────────────────────────────────────────────────────

const ProvincesGame: React.FC<ProvincesGameProps> = ({ onScoreChange }) => {
  const [subMode, setSubMode] = useState<SubMode>('menu');

  return (
    <div className="w-full h-full flex flex-col">
      {subMode === 'menu'      && <MenuScreen onSelect={setSubMode} />}
      {subMode === 'provinces' && <ProvincesMapQuiz onScoreChange={onScoreChange} onBack={() => setSubMode('menu')} />}
      {subMode === 'capitals'  && <CapitalsQuiz    onScoreChange={onScoreChange} onBack={() => setSubMode('menu')} />}
    </div>
  );
};

export default ProvincesGame;
