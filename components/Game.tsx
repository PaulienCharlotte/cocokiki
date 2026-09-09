
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map as MapIcon, Search, SpellCheck, Wand2, Brain,
  Trophy, ChevronDown, Eye, EyeOff, X, Landmark, ClipboardList,
} from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import GameEngine from './GameEngine';
import LocationMemoryGame from './LocationMemoryGame';
import MnemonicGame from './MnemonicGame';
import ToetsGame from './ToetsGame';
import { PROVINCES, LOCATIONS, CLUSTERS } from '../constants';
import { Location, GameMode } from '../types';
import { getFunFact } from '../services/geminiService';

const MODES = [
  { id: 'explore' as GameMode, label: 'Verkennen',    icon: MapIcon       },
  { id: 'find'    as GameMode, label: 'Zoeken',       icon: Search        },
  { id: 'spell'   as GameMode, label: 'Spellen',      icon: SpellCheck    },
  { id: 'master'  as GameMode, label: 'Oefenmeester', icon: Wand2         },
  { id: 'memory'  as GameMode, label: 'Memory',       icon: Brain         },
  { id: 'test'    as GameMode, label: 'Toetsen',      icon: ClipboardList },
];

const getTypeColor = (type: string) => {
  if (type === 'water')  return '#38bdf8';
  if (type === 'country') return '#22C55E';
  if (type === 'region') return '#7C3AED';
  return '#EAB308';
};

const REWARD_STORAGE_KEY = 'topo-coco-local-reismunten';
const PASSPORT_STAMPS = [
  { threshold: 50, label: 'Eerste route', icon: '🧭' },
  { threshold: 150, label: 'Kaartlezer', icon: '🗺️' },
  { threshold: 300, label: 'Provinciepro', icon: '📍' },
  { threshold: 500, label: 'Europa-verkenner', icon: '🏛️' },
  { threshold: 800, label: 'Wereldreiziger', icon: '🌍' },
];

const getPassportLevel = (score: number) => {
  if (score >= 800) return 'Wereldreiziger';
  if (score >= 500) return 'Europa-verkenner';
  if (score >= 300) return 'Provinciepro';
  if (score >= 150) return 'Kaartlezer';
  if (score >= 50) return 'Eerste route';
  return 'Startende reiziger';
};

const Game: React.FC = () => {
  const [mode, setMode]                         = useState<GameMode>('explore');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedCluster, setSelectedCluster]   = useState<string>('all');
  const [score, setScore]                       = useState(() => {
    const saved = Number(localStorage.getItem(REWARD_STORAGE_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : 0;
  });
  const [activeLocation, setActiveLocation]     = useState<Location | null>(null);
  const [userClickedLocationId, setUserClickedLocationId] = useState<string | null>(null);
  const [loadingFact, setLoadingFact]           = useState(false);
  const [currentFact, setCurrentFact]           = useState<string | null>(null);
  const [currentEmoji, setCurrentEmoji]         = useState('📍');
  const [showLabels, setShowLabels]             = useState(true);
  const [isRevealed, setIsRevealed]             = useState(false);
  const [isMobile, setIsMobile]                 = useState(window.innerWidth < 768);
  const [provinceOpen, setProvinceOpen]         = useState(false);
  const [showPassport, setShowPassport]         = useState(false);
  const [footerOpen, setFooterOpen]             = useState(false);
  const provinceRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Close province dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (provinceRef.current && !provinceRef.current.contains(e.target as Node)) {
        setProvinceOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem(REWARD_STORAGE_KEY, String(score));
  }, [score]);

  const availableClusters = useMemo(() => {
    if (selectedProvince === 'all') return [];
    return CLUSTERS.filter(c => c.provinceId === selectedProvince);
  }, [selectedProvince]);

  const handleLocationClick = useCallback(async (loc: Location) => {
    if (mode === 'explore') {
      setActiveLocation(loc);
      setLoadingFact(true);
      setCurrentFact(null);
      const f = await getFunFact(loc.name);
      setCurrentFact(f.text);
      setCurrentEmoji(f.emoji);
      setLoadingFact(false);
    } else {
      setUserClickedLocationId(loc.id);
      setTimeout(() => setUserClickedLocationId(null), 50);
    }
  }, [mode]);

  const handleScoreChange = useCallback((pts: number) => {
    setScore(s => Math.max(0, s + pts));
  }, []);
  const handleTargetSet = useCallback((loc: Location) => { setActiveLocation(loc); setIsRevealed(false); }, []);
  const handleReveal    = useCallback((v: boolean) => setIsRevealed(v), []);

  const handleModeChange = useCallback((m: GameMode) => {
    setMode(m);
    setActiveLocation(null);
    setUserClickedLocationId(null);
    setIsRevealed(false);
    setCurrentFact(null);
  }, []);

  const handleProvinceChange = useCallback((id: string) => {
    setSelectedProvince(id);
    setSelectedCluster('all');
    setActiveLocation(null);
    setIsRevealed(false);
    setProvinceOpen(false);
  }, []);

  const [searchQuery, setSearchQuery]     = useState('');
  const [searchOpen, setSearchOpen]       = useState(false);
  const searchRef                         = useRef<HTMLDivElement>(null);

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) return [];
    const q = searchQuery.toLowerCase();
    return LOCATIONS.filter(l => l.name.toLowerCase().includes(q)).slice(0, 6);
  }, [searchQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearchSelect = useCallback((loc: Location) => {
    setSearchQuery('');
    setSearchOpen(false);
    setSelectedProvince(loc.provinceId);
    setSelectedCluster('all');
    setActiveLocation(loc);
    setUserClickedLocationId(loc.id);
    setTimeout(() => setUserClickedLocationId(null), 50);
  }, []);

  const currentProvince = PROVINCES.find(p => p.id === selectedProvince);
  const activeMode = MODES.find(m => m.id === mode)!;
  const realProvinces = PROVINCES.filter(p => !p.isStudyArea);
  const waterArea = PROVINCES.find(p => p.id === 'water-nl');
  const worldAreas = PROVINCES.filter(p =>
    ['world', 'europe', 'africa', 'asia', 'north-america', 'south-america', 'oceania', 'arctic', 'antarctica'].includes(p.id)
  );
  const areaIcon = selectedCluster === 'provincies-en-hoofdsteden'
    ? '🏛️'
    : ['world', 'europe', 'africa', 'asia', 'north-america', 'south-america', 'oceania', 'arctic', 'antarctica'].includes(selectedProvince)
      ? '🌍'
      : selectedProvince === 'water-nl'
        ? '🌊'
        : currentProvince
          ? '📍'
          : '🇳🇱';
  const areaLabel = selectedCluster === 'provincies-en-hoofdsteden'
    ? 'Prov. & Hoofdst.'
    : currentProvince?.name ?? 'Heel NL';
  const earnedStamps = PASSPORT_STAMPS.filter(stamp => score >= stamp.threshold);
  const nextStamp = PASSPORT_STAMPS.find(stamp => score < stamp.threshold);
  const previousThreshold = earnedStamps.at(-1)?.threshold ?? 0;
  const nextProgress = nextStamp
    ? Math.min(100, Math.round(((score - previousThreshold) / (nextStamp.threshold - previousThreshold)) * 100))
    : 100;

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F5F3FF] overflow-hidden">

      {/* ── TOP NAVIGATION BAR ── */}
      <header className="flex-none bg-[#3B0764] shadow-lg z-[5000]">

        {/* Row 1: zoekbalk links + logo gecentreerd + controls rechts */}
        <div className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 h-14 sm:h-16">

          {/* Zoekbalk links */}
          <div ref={searchRef} className="relative z-10">
            <div className="flex items-center gap-1.5 bg-[#4C1D95] rounded-full px-2.5 sm:px-3 py-1.5 border border-[#6D28D9]">
              <Search className="w-3.5 h-3.5 text-[#C4B5FD] flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Zoek…"
                className="bg-transparent text-white text-xs font-medium placeholder:text-[#A78BFA] outline-none w-20 sm:w-40"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }}>
                  <X className="w-3 h-3 text-[#A78BFA]" />
                </button>
              )}
            </div>

            {/* Dropdown resultaten */}
            <AnimatePresence>
              {searchOpen && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1.5 left-0 w-56 bg-white rounded-xl shadow-xl border border-[#DDD6FE] overflow-hidden"
                >
                  {searchResults.map(loc => (
                    <button
                      key={loc.id}
                      onClick={() => handleSearchSelect(loc)}
                      className="w-full text-left px-3 py-2.5 hover:bg-[#FEF9C3] transition-colors flex items-center justify-between gap-2 border-b border-[#F5F3FF] last:border-0"
                    >
                      <span className="text-sm font-bold text-[#1F2937]">{loc.name}</span>
                      <span className="text-[10px] text-[#8B5CF6] font-medium flex-shrink-0">
                        {PROVINCES.find(p => p.id === loc.provinceId)?.name}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logo — gecentreerd, alleen op md+ (op mobiel overlapt het met controls) */}
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none hidden md:block">
            <img src="/images/logo-compas-geel.svg" alt="Cocokiki Topo" className="h-10 w-10 drop-shadow-md" style={{ display: 'block', width: 40, height: 40 }} />
          </div>

          {/* Controls rechts */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">

          {/* Labels toggle — alleen zinvol bij verkennen */}
          {mode === 'explore' && (
            <button
              onClick={() => setShowLabels(s => !s)}
              title={showLabels ? 'Namen verbergen' : 'Namen tonen'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                showLabels ? 'bg-[#7C3AED] text-white' : 'bg-[#4C1D95] text-[#9CA3AF]'
              }`}
            >
              {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Namen</span>
            </button>
          )}

          {/* Province dropdown */}
          <div ref={provinceRef} className="relative">
            <button
              onClick={() => setProvinceOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED] border-0 rounded-full text-sm font-black text-white hover:bg-[#EAB308] transition-colors"
            >
              <span className="text-base">{areaIcon}</span>
              <span className="max-w-[130px] truncate hidden sm:inline">
                {areaLabel}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${provinceOpen ? 'rotate-180' : ''}`} />
            </button>

	            <AnimatePresence>
	              {provinceOpen && (
	                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 max-h-[70vh] overflow-y-auto bg-[#3B0764] rounded-2xl shadow-xl border border-[#4C1D95] z-50"
                >
                  <div className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-[#A78BFA]">
                    Wereld
                  </div>
                  {worldAreas.map(area => (
                    <button
                      key={area.id}
                      onClick={() => handleProvinceChange(area.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-2 ${selectedProvince === area.id ? 'bg-[#7C3AED] text-white' : 'hover:bg-[#EAB308] hover:text-white text-[#DDD6FE]'}`}
                    >
                      <span className="text-base">{area.id === 'world' ? '🌐' : '🌍'}</span>
                      {area.name}
                    </button>
                  ))}

                  <div className="border-t border-[#4C1D95] mx-3 my-2" />
                  <div className="px-4 pb-1 text-[10px] font-black uppercase tracking-widest text-[#A78BFA]">
                    Nederland
                  </div>

                  <button
                    onClick={() => handleProvinceChange('all')}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${selectedProvince === 'all' && selectedCluster !== 'provincies-en-hoofdsteden' ? 'bg-[#7C3AED] text-white' : 'hover:bg-[#EAB308] hover:text-white text-[#DDD6FE]'}`}
                  >
                    🇳🇱 Heel Nederland
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProvince('all');
                      setSelectedCluster('provincies-en-hoofdsteden');
                      setActiveLocation(null);
                      setIsRevealed(false);
                      setProvinceOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-2 ${selectedCluster === 'provincies-en-hoofdsteden' ? 'bg-[#7C3AED] text-white' : 'hover:bg-[#EAB308] hover:text-white text-[#DDD6FE]'}`}
                  >
                    <Landmark className="w-3.5 h-3.5 flex-shrink-0" />
                    Provincies &amp; Hoofdsteden
                  </button>
                  {waterArea && (
                    <button
                      onClick={() => handleProvinceChange(waterArea.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-2 ${selectedProvince === waterArea.id ? 'bg-[#7C3AED] text-white' : 'hover:bg-[#EAB308] hover:text-white text-[#DDD6FE]'}`}
                    >
                      <span className="text-base">🌊</span>
                      {waterArea.name}
                    </button>
                  )}

                  <div className="border-t border-[#4C1D95] mx-3 my-2" />
                  <div className="px-4 pb-1 text-[10px] font-black uppercase tracking-widest text-[#A78BFA]">
                    Provincies
                  </div>
                  {realProvinces.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleProvinceChange(p.id)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${selectedProvince === p.id ? 'bg-[#7C3AED] text-white' : 'hover:bg-[#EAB308] hover:text-white text-[#DDD6FE]'}`}
                    >
                      {p.name}
                    </button>
                  ))}
	                </motion.div>
	              )}
	            </AnimatePresence>
          </div>

          {/* Lokale reismunten / paspoort */}
          <button
            type="button"
            onClick={() => setShowPassport(v => !v)}
            title="Reispaspoort"
            className="flex items-center gap-1.5 bg-[#F59E0B] px-3 py-1.5 rounded-full shadow-sm hover:bg-[#D97706] transition-colors"
          >
            <Trophy className="w-4 h-4 text-white" />
            <span className="font-black text-white text-sm leading-none">{score}</span>
          </button>
          </div>{/* end ml-auto controls */}
        </div>

        {/* Row 2: mode tabs (scroll-hint via fade gradient rechts op mobiel) */}
        <div className="relative">
          <div className="flex gap-1.5 px-4 pt-2 pb-3 overflow-x-auto scrollbar-hide">
            {MODES.map(m => {
              const active = mode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => handleModeChange(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs whitespace-nowrap transition-all flex-shrink-0
                    ${active
                      ? 'bg-[#7C3AED] text-white shadow-[0_3px_0_#5B21B6] -translate-y-0.5'
                      : 'bg-[#4C1D95] text-[#DDD6FE] hover:bg-[#EAB308] hover:text-white'
                    }`}
                >
                  <m.icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
          {/* Fade gradient: zachte hint dat je naar rechts kunt scrollen op mobiel */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-10 sm:hidden bg-gradient-to-l from-[#3B0764] to-transparent" />
        </div>

        {/* Row 3: cluster pills (shown when province selected + not memory) */}
        <AnimatePresence>
          {availableClusters.length > 0 && mode !== 'memory' && mode !== 'mnemonic' && mode !== 'test' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSelectedCluster('all')}
                  className={`px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap transition-all flex-shrink-0 ${
                    selectedCluster === 'all'
                      ? 'bg-[#F59E0B] text-white shadow-[0_2px_0_#D97706]'
                      : 'bg-[#4C1D95] text-[#DDD6FE] hover:bg-[#EAB308] hover:text-white'
                  }`}
                >
                  Alles
                </button>
                {availableClusters.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCluster(c.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-black whitespace-nowrap transition-all flex-shrink-0 ${
                      selectedCluster === c.id
                        ? 'bg-[#F59E0B] text-white shadow-[0_2px_0_#D97706]'
                        : 'bg-[#4C1D95] text-[#DDD6FE] hover:bg-[#EAB308] hover:text-white'
                    }`}
                  >
                    <span>{c.icon}</span>
                    {c.name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── MAIN CONTENT ── */}
      {mode === 'memory' ? (
        <main className="flex-1 min-h-0 m-3 bg-[#F5F3FF] rounded-[2rem] shadow-xl border-[6px] border-white overflow-hidden">
          <LocationMemoryGame
            key={`memory-${selectedProvince}`}
            provinceId={selectedProvince}
            onScoreChange={handleScoreChange}
          />
        </main>
      ) : mode === 'mnemonic' ? (
        <main className="flex-1 min-h-0 m-3 bg-[#FFFBEB] rounded-[2rem] shadow-xl border-[6px] border-white overflow-hidden">
          <MnemonicGame
            key={`mnemonic-${selectedProvince}`}
            provinceId={selectedProvince}
          />
        </main>
      ) : mode === 'test' ? (
        <main className="flex-1 min-h-0 m-3 bg-white rounded-[2rem] shadow-xl border-[6px] border-white overflow-hidden">
          <ToetsGame
            key={`test-${selectedProvince}-${selectedCluster}`}
            provinceId={selectedProvince}
            clusterId={selectedCluster}
          />
        </main>
      ) : (
        // Map modes
        <div className="flex-1 min-h-0 flex gap-3 p-3">
          {/* Map */}
          <main className="flex-1 min-h-0 relative bg-[#EDE9FE] rounded-[2rem] shadow-xl border-[6px] border-white overflow-hidden">
            <InteractiveMap
              selectedProvince={selectedProvince}
              selectedCluster={selectedCluster}
              onLocationClick={handleLocationClick}
              highlightedLocation={mode === 'explore' ? activeLocation?.id ?? null : null}
              activeGameLocation={mode !== 'explore' ? activeLocation?.id ?? null : null}
              showLabels={showLabels}
              gameMode={mode}
              isRevealed={isRevealed}
            />

            {/* Legenda */}
            <div className="absolute bottom-3 left-3 z-[4000] bg-white/90 backdrop-blur-sm border border-slate-200 rounded-xl px-3 py-2 shadow-md">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Legenda</p>
              <div className="flex flex-col gap-1">
                {[
                  { color: '#EAB308', label: 'Plaats / Stad',  star: false },
                  { color: '#EAB308', label: 'Hoofdstad',       star: true  },
                  { color: '#38bdf8', label: 'Water',           star: false },
                  { color: '#7C3AED', label: 'Gebied / Provincie', star: false },
                  { color: '#22C55E', label: 'Land',            star: false },
                ].map(({ color, label, star }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="relative w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }}>
                      {star && <span className="absolute -top-1 -right-1 text-[7px] leading-none text-amber-500">★</span>}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-600">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* GameEngine overlay on mobile */}
            {isMobile && mode !== 'explore' && (
              <div className="absolute top-2 left-2 right-2 z-[4500] flex justify-center pointer-events-none">
                <div className="pointer-events-auto w-full max-w-sm">
                  <GameEngine
                    key={`${mode}-${selectedProvince}-${selectedCluster}`}
                    mode={mode}
                    provinceId={selectedProvince}
                    clusterId={selectedCluster}
                    onScoreChange={handleScoreChange}
                    onLocationClick={handleTargetSet}
                    onReveal={handleReveal}
                    userClickedLocationId={userClickedLocationId}
                    isMobileCompact={true}
                  />
                </div>
              </div>
            )}

            {/* Fact card (explore mode) */}
            <AnimatePresence>
              {activeLocation && mode === 'explore' && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 16 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-3 left-3 right-3 z-[4500]"
                >
                  <div
                    className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border-4"
                    style={{ borderColor: getTypeColor(activeLocation.type) }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{currentEmoji}</span>
                        <div>
                          <div className="font-black text-sm text-slate-800">{activeLocation.name}</div>
                          <div className="text-[10px] text-[#7C3AED] font-bold">
                            {PROVINCES.find(p => p.id === activeLocation.provinceId)?.name}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveLocation(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="bg-[#FFFFFF] px-3 py-2 rounded-xl border border-[#DDD6FE]">
                      {loadingFact ? (
                        <div className="flex justify-center py-1">
                          <div className="w-4 h-4 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <p className="text-slate-800 text-xs leading-snug font-medium italic">
                          "{currentFact ?? 'Ontdek deze mooie plek!'}"
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* GameEngine side panel (desktop, non-explore) */}
          {!isMobile && mode !== 'explore' && (
            <aside className="w-72 flex-shrink-0">
              <GameEngine
                key={`${mode}-${selectedProvince}-${selectedCluster}`}
                mode={mode}
                provinceId={selectedProvince}
                clusterId={selectedCluster}
                onScoreChange={handleScoreChange}
                onLocationClick={handleTargetSet}
                onReveal={handleReveal}
                userClickedLocationId={userClickedLocationId}
              />
            </aside>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="flex-none bg-[#3B0764] border-t border-[#4C1D95]">

        {/* Toggle — alleen zichtbaar op desktop */}
        <button
          onClick={() => setFooterOpen(o => !o)}
          title={footerOpen ? 'Navigatie verbergen' : 'Navigatie tonen'}
          className="hidden md:flex w-full items-center justify-center py-1 hover:bg-[#4C1D95] transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 text-[#6D28D9] transition-transform duration-200 ${footerOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Navigatie kolommen — inklapbaar op desktop */}
        <AnimatePresence>
          {footerOpen && (
            <motion.div
              key="footer-nav"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="hidden md:flex md:justify-center gap-12 px-8 py-4">

                {/* Provincies */}
                <div>
                  <p className="text-[9px] font-black text-[#EAB308] uppercase tracking-widest mb-2">Provincies</p>
                  <div className="grid grid-cols-4 gap-x-6 gap-y-1">
                    <button
                      onClick={() => handleProvinceChange('all')}
                      className="text-left text-[10px] text-[#C4B5FD] hover:text-[#EAB308] transition-colors font-medium"
                    >
                      Heel Nederland
                    </button>
                    {PROVINCES.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleProvinceChange(p.id)}
                        className="text-left text-[10px] text-[#C4B5FD] hover:text-[#EAB308] transition-colors font-medium"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="w-px bg-[#4C1D95] self-stretch flex-shrink-0" />

                {/* Spellen */}
                <div>
                  <p className="text-[9px] font-black text-[#EAB308] uppercase tracking-widest mb-2">Spellen</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                    {MODES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleModeChange(m.id)}
                        className="text-left text-[10px] text-[#C4B5FD] hover:text-[#EAB308] transition-colors font-medium"
                      >
                        {m.label}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedProvince('all');
                        setSelectedCluster('provincies-en-hoofdsteden');
                        setActiveLocation(null);
                      }}
                      className="text-left text-[10px] text-[#C4B5FD] hover:text-[#EAB308] transition-colors font-medium"
                    >
                      Prov. &amp; Hoofdst.
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom bar — altijd zichtbaar */}
        <div className={`px-4 md:px-8 py-2 flex items-center justify-between ${footerOpen ? 'md:border-t md:border-[#4C1D95]' : ''}`}>
          <span className="text-[10px] text-[#6D28D9] font-medium">© 2026</span>
          <div className="flex items-center gap-1.5">
            <img src="/images/logo-compas-geel.svg" alt="" className="w-4 h-4 opacity-70" />
            <span className="text-[10px] text-[#6D28D9] font-bold tracking-wide">Topo · GSV · Groep 6</span>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showPassport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[7000] bg-black/30 backdrop-blur-sm flex items-start justify-end p-3 sm:p-5"
            onClick={() => setShowPassport(false)}
          >
            <motion.div
              initial={{ opacity: 0, x: 24, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.98 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-[#FDE68A] overflow-hidden"
            >
              <div className="bg-[#3B0764] px-5 py-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#FDE68A]">Reispaspoort</p>
                  <h2 className="text-xl font-black text-white">{getPassportLevel(score)}</h2>
                </div>
                <button onClick={() => setShowPassport(false)} className="text-[#C4B5FD] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#FFFBEB] border border-[#FDE68A] p-3">
                    <div className="text-2xl font-black text-[#D97706]">{score}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#92400E]">reismunten</div>
                  </div>
                  <div className="rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] p-3">
                    <div className="text-2xl font-black text-[#6D28D9]">{earnedStamps.length}</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-[#6D28D9]">stempels</div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-black text-slate-600 mb-1.5">
                    <span>Volgende stempel</span>
                    <span>{nextStamp ? `${score}/${nextStamp.threshold}` : 'vol'}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#EDE9FE] overflow-hidden">
                    <div className="h-full bg-[#7C3AED]" style={{ width: `${nextProgress}%` }} />
                  </div>
                  {nextStamp && (
                    <p className="mt-2 text-xs font-bold text-slate-500">
                      Nog {nextStamp.threshold - score} reismunten tot {nextStamp.label}.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {PASSPORT_STAMPS.map(stamp => {
                    const unlocked = score >= stamp.threshold;
                    return (
                      <div
                        key={stamp.label}
                        className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${unlocked ? 'bg-[#ECFDF5] border-[#A7F3D0]' : 'bg-slate-50 border-slate-200 opacity-70'}`}
                      >
                        <span className="text-2xl">{stamp.icon}</span>
                        <div className="min-w-0">
                          <div className={`text-sm font-black ${unlocked ? 'text-emerald-700' : 'text-slate-500'}`}>{stamp.label}</div>
                          <div className="text-[10px] font-bold text-slate-400">{stamp.threshold} reismunten</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Game;
