
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map as MapIcon, Search, SpellCheck, Wand2, Brain, Lightbulb,
  Trophy, ChevronDown, Eye, EyeOff, X, Timer, TimerOff, LogIn, User, Landmark,
} from 'lucide-react';
import InteractiveMap from './InteractiveMap';
import GameEngine from './GameEngine';
import LocationMemoryGame from './LocationMemoryGame';
import MnemonicGame from './MnemonicGame';
import ProvincesGame from './ProvincesGame';
import AuthModal from './AuthModal';
import ProfilePanel from './ProfilePanel';
import { PROVINCES, LOCATIONS, CLUSTERS } from '../constants';
import { Location, GameMode } from '../types';
import { getFunFact } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { saveScoreSession } from '../services/supabase';

const MODES = [
  { id: 'explore' as GameMode, label: 'Verkennen',    icon: MapIcon    },
  { id: 'find'    as GameMode, label: 'Zoeken',       icon: Search     },
  { id: 'spell'   as GameMode, label: 'Spellen',      icon: SpellCheck },
  { id: 'master'  as GameMode, label: 'Oefenmeester', icon: Wand2      },
  { id: 'memory'  as GameMode, label: 'Memory',       icon: Brain      },
];

const getTypeColor = (type: string) => {
  if (type === 'water')  return '#38bdf8';
  if (type === 'region') return '#7C3AED';
  return '#EAB308';
};

const Game: React.FC = () => {
  const { user, profile } = useAuth();

  const [mode, setMode]                         = useState<GameMode>('explore');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedCluster, setSelectedCluster]   = useState<string>('all');
  const [score, setScore]                       = useState(0);
  const [activeLocation, setActiveLocation]     = useState<Location | null>(null);
  const [userClickedLocationId, setUserClickedLocationId] = useState<string | null>(null);
  const [loadingFact, setLoadingFact]           = useState(false);
  const [currentFact, setCurrentFact]           = useState<string | null>(null);
  const [currentEmoji, setCurrentEmoji]         = useState('📍');
  const [showLabels, setShowLabels]             = useState(true);
  const [timerEnabled, setTimerEnabled]         = useState(true);
  const [isRevealed, setIsRevealed]             = useState(false);
  const [isMobile, setIsMobile]                 = useState(window.innerWidth < 768);
  const [provinceOpen, setProvinceOpen]         = useState(false);
  const [showAuthModal, setShowAuthModal]       = useState(false);
  const [showProfile, setShowProfile]           = useState(false);
  const provinceRef    = useRef<HTMLDivElement>(null);
  const sessionScoreRef = useRef(0);

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
    setScore(s => s + pts);
    sessionScoreRef.current += pts;
  }, []);
  const handleTargetSet = useCallback((loc: Location) => { setActiveLocation(loc); setIsRevealed(false); }, []);
  const handleReveal    = useCallback((v: boolean) => setIsRevealed(v), []);

  const flushSession = useCallback(async (m: GameMode, provinceId: string) => {
    if (user && sessionScoreRef.current > 0) {
      await saveScoreSession(user.id, m, provinceId, sessionScoreRef.current);
      sessionScoreRef.current = 0;
    }
  }, [user]);

  const handleModeChange = useCallback(async (m: GameMode) => {
    await flushSession(mode, selectedProvince);
    setMode(m);
    setActiveLocation(null);
    setUserClickedLocationId(null);
    setIsRevealed(false);
    setCurrentFact(null);
  }, [flushSession, mode, selectedProvince]);

  const handleProvinceChange = useCallback(async (id: string) => {
    await flushSession(mode, selectedProvince);
    setSelectedProvince(id);
    setSelectedCluster('all');
    setActiveLocation(null);
    setIsRevealed(false);
    setProvinceOpen(false);
  }, [flushSession, mode, selectedProvince]);

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

  return (
    <div className="h-[100dvh] flex flex-col bg-[#F5F3FF] overflow-hidden">

      {/* ── TOP NAVIGATION BAR ── */}
      <header className="flex-none bg-[#3B0764] shadow-lg z-[5000]">

        {/* Row 1: zoekbalk links + logo gecentreerd + controls rechts */}
        <div className="relative flex items-center gap-2 px-4 h-14">

          {/* Zoekbalk links */}
          <div ref={searchRef} className="relative z-10">
            <div className="flex items-center gap-1.5 bg-[#4C1D95] rounded-full px-3 py-1.5 border border-[#6D28D9]">
              <Search className="w-3.5 h-3.5 text-[#C4B5FD] flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Zoek een plaats…"
                className="bg-transparent text-white text-xs font-medium placeholder:text-[#A78BFA] outline-none w-28 sm:w-40"
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

          {/* Logo — gecentreerd */}
          <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
            <img src="/images/logo-compas-geel.svg" alt="Cocokiki Topo" className="h-10 w-10 drop-shadow-md" style={{ display: 'block', width: 40, height: 40 }} />
          </div>

          {/* Controls rechts */}
          <div className="ml-auto flex items-center gap-2">

          {/* Labels toggle */}
          {mode !== 'memory' && mode !== 'mnemonic' && mode !== 'provinces' && (
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

          {/* Timer toggle — alleen bij spel-modi */}
          {(mode === 'find' || mode === 'spell' || mode === 'master') && (
            <button
              onClick={() => setTimerEnabled(t => !t)}
              title={timerEnabled ? 'Timer uitschakelen' : 'Timer inschakelen'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                timerEnabled
                  ? 'bg-[#F59E0B] text-white border-0'
                  : 'bg-[#4C1D95] text-[#9CA3AF] border border-[#4B5563]'
              }`}
            >
              {timerEnabled ? <Timer className="w-3.5 h-3.5" /> : <TimerOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{timerEnabled ? 'Timer aan' : 'Timer uit'}</span>
            </button>
          )}

          {/* Province dropdown */}
          <div ref={provinceRef} className="relative">
            <button
              onClick={() => setProvinceOpen(o => !o)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7C3AED] border-0 rounded-full text-sm font-black text-white hover:bg-[#EAB308] transition-colors"
            >
              <span className="text-base">{mode === 'provinces' ? '🏛️' : currentProvince ? '📍' : '🇳🇱'}</span>
              <span className="max-w-[100px] truncate hidden sm:inline">
                {mode === 'provinces' ? 'Provincies' : currentProvince?.name ?? 'Heel NL'}
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
                  className="absolute right-0 top-full mt-2 w-48 bg-[#3B0764] rounded-2xl shadow-xl border border-[#4C1D95] overflow-hidden z-50"
                >
                  {/* Provincies & Hoofdsteden game */}
                  <button
                    onClick={() => { handleModeChange('provinces'); setProvinceOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors flex items-center gap-2 ${mode === 'provinces' ? 'bg-[#7C3AED] text-white' : 'hover:bg-[#EAB308] hover:text-white text-[#DDD6FE]'}`}
                  >
                    <Landmark className="w-3.5 h-3.5 flex-shrink-0" />
                    Provincies &amp; Hoofdsteden
                  </button>
                  <div className="border-t border-[#4C1D95] mx-3" />

                  <button
                    onClick={() => handleProvinceChange('all')}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${selectedProvince === 'all' && mode !== 'provinces' ? 'bg-[#7C3AED] text-white' : 'hover:bg-[#EAB308] hover:text-white text-[#DDD6FE]'}`}
                  >
                    🇳🇱 Heel Nederland
                  </button>
                  {PROVINCES.map(p => (
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

          {/* Score */}
          <div className="flex items-center gap-1.5 bg-[#F59E0B] px-3 py-1.5 rounded-full shadow-sm">
            <Trophy className="w-4 h-4 text-white" />
            <span className="font-black text-white text-sm leading-none">{score}</span>
          </div>

          {/* Profile / Login — verborgen tot database-koppeling */}
          {/* {user ? (...) : (...)} */}
          </div>{/* end ml-auto controls */}
        </div>

        {/* Row 2: mode tabs */}
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
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

        {/* Row 3: cluster pills (shown when province selected + not memory) */}
        <AnimatePresence>
          {availableClusters.length > 0 && mode !== 'memory' && mode !== 'mnemonic' && mode !== 'provinces' && (
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
      ) : mode === 'provinces' ? (
        <main className="flex-1 min-h-0 m-3 bg-[#F5F3FF] rounded-[2rem] shadow-xl border-[6px] border-white overflow-hidden">
          <ProvincesGame onScoreChange={handleScoreChange} />
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
                  { color: '#7C3AED', label: 'Gebied',          star: false },
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
                    timerEnabled={timerEnabled}
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
                timerEnabled={timerEnabled}
              />
            </aside>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="flex-none bg-[#3B0764] border-t border-[#4C1D95]">
        <div className="grid grid-cols-2 gap-6 px-5 py-3">

          {/* Kolom 1: Alle provincies */}
          <div>
            <p className="text-[9px] font-black text-[#EAB308] uppercase tracking-widest mb-1.5">Provincies</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <button
                onClick={() => handleProvinceChange('all')}
                className="text-left text-[10px] text-[#C4B5FD] hover:text-[#EAB308] transition-colors font-medium truncate"
              >
                Heel Nederland
              </button>
              {PROVINCES.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleProvinceChange(p.id)}
                  className="text-left text-[10px] text-[#C4B5FD] hover:text-[#EAB308] transition-colors font-medium truncate"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Kolom 2: Alle spellen */}
          <div>
            <p className="text-[9px] font-black text-[#EAB308] uppercase tracking-widest mb-1.5">Spellen</p>
            <div className="flex flex-col gap-0.5">
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
                onClick={() => handleModeChange('provinces')}
                className="text-left text-[10px] text-[#C4B5FD] hover:text-[#EAB308] transition-colors font-medium"
              >
                Provincies &amp; Hoofdsteden
              </button>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#4C1D95] px-5 py-1.5 flex items-center justify-between">
          <span className="text-[10px] text-[#6D28D9] font-medium">© 2026 Cocokiki Topo</span>
          <span className="text-[10px] text-[#6D28D9] font-bold">Groep 6 · GSV</span>
        </div>
      </footer>

      {/* Auth modal */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}

      {/* Profile panel */}
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}
    </div>
  );
};

export default Game;
