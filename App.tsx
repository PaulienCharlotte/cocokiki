
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import InteractiveMap from './components/InteractiveMap';
import GameEngine from './components/GameEngine';
import { PROVINCES, LOCATIONS, CLUSTERS } from './constants';
import { Location, GameMode } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, BookOpen, Search, SpellCheck, Map as MapIcon, HelpCircle, Wand2, Layers, Menu, X, Eye, EyeOff, Settings2 } from 'lucide-react';
import { getFunFact } from './services/geminiService';

const getTypeColor = (type: string) => {
  switch (type) {
    case 'city': return '#FFB7B2';
    case 'water': return '#A2D2FF';
    case 'region': return '#B9FBC0';
    default: return '#FFDAC1';
  }
};

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('explore');
  const [selectedProvince, setSelectedProvince] = useState<string | 'all'>('all');
  const [selectedCluster, setSelectedCluster] = useState<string | 'all'>('all');
  const [score, setScore] = useState(0);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [userClickedLocationId, setUserClickedLocationId] = useState<string | null>(null);
  const [loadingFact, setLoadingFact] = useState(false);
  const [currentFact, setCurrentFact] = useState<string | null>(null);
  const [currentEmoji, setCurrentEmoji] = useState<string>("📍");
  const [showLabels, setShowLabels] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const availableClusters = useMemo(() => {
    return CLUSTERS.filter(c => c.provinceId === selectedProvince);
  }, [selectedProvince]);

  const handleLocationClick = useCallback(async (loc: Location) => {
    if (mode === 'explore') {
      setActiveLocation(loc);
      setLoadingFact(true);
      setCurrentFact(null);
      const factData = await getFunFact(loc.name);
      setCurrentFact(factData.text);
      setCurrentEmoji(factData.emoji);
      setLoadingFact(false);
    } else {
      setUserClickedLocationId(loc.id);
      setTimeout(() => setUserClickedLocationId(null), 50);
    }
  }, [mode]);

  const handleScoreChange = useCallback((points: number) => {
    setScore(prev => prev + points);
  }, []);

  const handleTargetSet = useCallback((loc: Location) => {
    setActiveLocation(loc);
    setIsRevealed(false);
  }, []);

  const handleReveal = useCallback((val: boolean) => {
    setIsRevealed(val);
  }, []);

  const handleModeChange = useCallback((newMode: GameMode) => {
    setMode(newMode);
    setActiveLocation(null);
    setUserClickedLocationId(null);
    setIsRevealed(false);
    setCurrentFact(null);
    setIsMenuOpen(false);
  }, []);

  const handleProvinceChange = useCallback((provId: string) => {
    setSelectedProvince(provId);
    setSelectedCluster('all');
    setActiveLocation(null);
    setIsRevealed(false);
    setIsMenuOpen(false);
  }, []);

  const NavigationContent = () => (
    <div className="flex flex-col gap-5">
      <section className="bg-white p-4 rounded-[2rem] shadow-lg border-4 border-slate-50">
        <h2 className="text-sm font-black text-[#5D4E60] mb-3 flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-slate-400" />
          Weergave
        </h2>
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all font-black text-xs ${showLabels
              ? 'bg-blue-50 text-blue-600 border-2 border-blue-100'
              : 'bg-slate-50 text-slate-400 border-2 border-transparent'
            }`}
        >
          <div className="flex items-center gap-2">
            {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span>Namen op kaart</span>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${showLabels ? 'bg-blue-400' : 'bg-slate-300'}`}>
            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${showLabels ? 'right-0.5' : 'left-0.5'}`} />
          </div>
        </button>
      </section>

      <section className="bg-white p-4 rounded-[2rem] shadow-lg border-4 border-pink-50">
        <h2 className="text-sm font-black text-[#5D4E60] mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-pink-400" />
          Modus
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
          {[
            { id: 'explore', label: 'Op Reis', icon: MapIcon, color: 'bg-[#A2D2FF]', shadow: 'shadow-[0_4px_0_#80B8E8]' },
            { id: 'master', label: 'Oefenmeester', icon: Wand2, color: 'bg-[#FFDAC1]', shadow: 'shadow-[0_4px_0_#E8C0A8]' },
            { id: 'find', label: 'Zoeken', icon: Search, color: 'bg-[#B9FBC0]', shadow: 'shadow-[0_4px_0_#97E09F]' },
            { id: 'spell', label: 'Spellen', icon: SpellCheck, color: 'bg-[#CFBAF0]', shadow: 'shadow-[0_4px_0_#B098D1]' }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => handleModeChange(item.id as GameMode)}
              className={`flex items-center gap-2 p-3 lg:p-2 rounded-xl transition-all transform active:translate-y-1 active:shadow-none ${mode === item.id
                  ? `${item.color} text-[#5D4E60] ${item.shadow} -translate-y-1`
                  : 'bg-pink-50/50 text-pink-700 hover:bg-pink-50'
                }`}
            >
              <item.icon className={`w-4 h-4 ${mode === item.id ? 'animate-bounce' : ''}`} />
              <span className="font-black text-[10px] md:text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white p-4 rounded-[2rem] shadow-lg border-4 border-[#FFF8CC]">
        <h2 className="text-sm font-black text-[#5D4E60] mb-2 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#E5D42B]" />
          Provincie
        </h2>
        <div className="relative">
          <select
            value={selectedProvince}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="w-full p-3 bg-[#FFFDE7] rounded-xl font-black text-[#8B7E00] text-sm outline-none appearance-none cursor-pointer border-2 border-transparent focus:border-yellow-200"
          >
            <option value="all">Heel NL 🇳🇱</option>
            {PROVINCES.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-yellow-600">▼</div>
        </div>
      </section>

      {availableClusters.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-[2rem] shadow-lg border-4 border-indigo-50"
        >
          <h2 className="text-sm font-black text-[#5D4E60] mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Groepjes
          </h2>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setSelectedCluster('all'); setIsMenuOpen(false); }}
              className={`text-left px-4 py-2.5 rounded-xl text-[11px] font-black transition-all ${selectedCluster === 'all'
                  ? 'bg-indigo-400 text-white shadow-[0_4px_0_#5A67D8] -translate-y-0.5'
                  : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
            >
              Alles oefenen
            </button>
            {availableClusters.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedCluster(c.id); setIsMenuOpen(false); }}
                className={`text-left px-4 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center gap-2 ${selectedCluster === c.id
                    ? 'bg-indigo-400 text-white shadow-[0_4px_0_#5A67D8] -translate-y-0.5'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
              >
                <span className="text-base">{c.icon}</span> {c.name}
              </button>
            ))}
          </div>
        </motion.section>
      )}
    </div>
  );

  return (
    <div className="h-[100dvh] flex flex-col p-2 md:p-8 max-w-[1600px] mx-auto selection:bg-pink-100 bg-[#FFF8FA] overflow-hidden">
      {/* Header */}
      <header className="flex-none flex flex-row justify-between items-center mb-2 md:mb-10 gap-2 px-2 py-1 md:py-0 z-[6000]">
        <motion.div
          initial={{ x: -10, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="flex items-center gap-2"
        >
          <div className="p-1.5 md:p-4 bg-[#FFB7B2] rounded-lg md:rounded-3xl shadow-[0_3px_0_#FF8C94] md:shadow-[0_8px_0_#FF8C94]">
            <MapIcon className="text-white w-4 h-4 md:w-10 md:h-10" />
          </div>
          <h1 className="text-sm md:text-4xl font-black text-[#5D4E60] tracking-tight leading-none">Topo Coco</h1>
        </motion.div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMenuOpen(true)}
            className="lg:hidden p-2 bg-white rounded-xl shadow-[0_3px_0_#ffccd5] border border-pink-50 text-pink-400"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative bg-white px-2 md:px-8 py-1 md:py-3 rounded-xl md:rounded-2xl shadow-md flex items-center gap-1.5 md:gap-2 border border-pink-50">
            <Trophy className="text-[#FFB7B2] w-4 h-4 md:w-8 md:h-8" />
            <div className="flex flex-col">
              <span className="text-sm md:text-2xl font-black text-[#5D4E60] leading-none">{score}</span>
              <span className="hidden md:inline text-[8px] text-pink-400 font-black uppercase tracking-widest">Score</span>
            </div>
          </div>
        </div>
      </header>

      {/* Mobiel Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-pink-900/30 backdrop-blur-md z-[7000] lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed top-0 right-0 h-full w-[280px] bg-[#FFF8FA] shadow-2xl z-[8000] lg:hidden p-5 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-black text-[#5D4E60]">Instellingen</h2>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-pink-100 text-pink-500 rounded-xl"><X className="w-5 h-5" /></button>
              </div>
              <NavigationContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:block lg:col-span-3 space-y-4 overflow-y-auto pr-2">
          <NavigationContent />
        </nav>

        {/* Main Content Area: Map & Overlays */}
        <main className={`relative flex flex-col min-h-0 bg-[#caf0f8] rounded-[2rem] md:rounded-[3.5rem] shadow-2xl border-[4px] md:border-[12px] border-white overflow-hidden ${mode === 'explore' ? 'lg:col-span-9' : 'lg:col-span-6'}`}>
          <div className="flex-1 min-h-0 relative">
            <InteractiveMap
              selectedProvince={selectedProvince}
              selectedCluster={selectedCluster}
              onLocationClick={handleLocationClick}
              highlightedLocation={mode === 'explore' ? activeLocation?.id : null}
              activeGameLocation={mode !== 'explore' ? activeLocation?.id : null}
              showLabels={showLabels}
              gameMode={mode}
              isRevealed={isRevealed}
            />
          </div>

          {/* CRITICAL: ONLY ONE GameEngine instance rendered at the top level of the map to prevent conflicts */}
          <div className={`absolute z-[4500] pointer-events-none transition-all duration-300 
            ${isMobile
              ? 'top-2 left-2 right-2 flex justify-center'
              : 'hidden'
            }`}
          >
            <div className="pointer-events-auto w-full max-w-[400px]">
              <GameEngine
                key={`${mode}-${selectedProvince}-${selectedCluster}`}
                mode={mode}
                provinceId={selectedProvince}
                clusterId={selectedCluster}
                onScoreChange={handleScoreChange}
                onLocationClick={handleTargetSet}
                onReveal={handleReveal}
                userClickedLocationId={userClickedLocationId}
                isMobileCompact={isMobile}
              />
            </div>
          </div>

          {/* Fact Card (Bottom of map container, in-flow) */}
          <AnimatePresence>
            {activeLocation && mode === 'explore' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
                className="flex-none p-2 z-[4500]"
              >
                <div
                  className="bg-white/95 backdrop-blur-md p-3 md:p-4 rounded-2xl md:rounded-[2rem] shadow-lg border-4"
                  style={{ borderColor: getTypeColor(activeLocation.type) }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl md:text-2xl bg-white p-1 rounded-xl shadow-sm">{currentEmoji}</span>
                    <h4 className="text-sm md:text-base font-black text-[#5D4E60]">{activeLocation.name}</h4>
                  </div>
                  <div className="bg-[#FFF5F7] p-2 md:p-2.5 rounded-xl md:rounded-2xl border-2 border-pink-100">
                    {loadingFact ? (
                      <div className="flex justify-center py-2"><div className="w-5 h-5 border-3 border-pink-400 border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                      <p className="text-[#5D4E60] text-xs leading-snug font-medium italic">"{currentFact || "Ontdek deze mooie plek!"}"</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Desktop Engine & Info — only visible in game modes */}
        {mode !== 'explore' && (
          <aside className="hidden lg:flex lg:col-span-3 flex-col gap-4 overflow-y-auto">
            {!isMobile && (
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
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default App;
