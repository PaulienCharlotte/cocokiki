import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Location, GameMode } from '../types';
import { LOCATIONS, PROVINCES } from '../constants';
import { getMnemonic, getFunFact } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Lightbulb, MapPin, Type as TypeIcon, Sparkles, Search, AlertCircle, Wand2, ArrowRight, Eye, ArrowLeft, RefreshCcw, LayoutList, BookOpen, Timer } from 'lucide-react';

const TIMER_SECONDS = 15;

const CircularTimer: React.FC<{ timeLeft: number; total: number }> = ({ timeLeft, total }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = timeLeft / total;
  const strokeDashoffset = circumference * (1 - progress);

  const color = timeLeft > total * 0.6 ? '#4ade80' : timeLeft > total * 0.3 ? '#facc15' : '#f87171';

  return (
    <div className="relative flex items-center justify-center w-12 h-12 flex-none">
      <svg className="absolute inset-0 -rotate-90" width="48" height="48">
        <circle cx="24" cy="24" r={radius} fill="none" stroke="#fce7f3" strokeWidth="4" />
        <circle
          cx="24" cy="24" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.9s linear, stroke 0.3s' }}
        />
      </svg>
      <span className="text-[11px] font-black" style={{ color }}>{timeLeft}</span>
    </div>
  );
};

interface GameEngineProps {
  mode: GameMode;
  provinceId: string | 'all';
  clusterId?: string | 'all';
  onScoreChange: (score: number) => void;
  onLocationClick: (loc: Location) => void;
  onReveal?: (val: boolean) => void;
  userClickedLocationId: string | null;
  isMobileCompact?: boolean;
}

type MasterStep = 'find' | 'spell' | 'fact';
type RoundType = 1 | 2 | 3;

const GameEngine: React.FC<GameEngineProps> = ({
  mode,
  provinceId,
  clusterId = 'all',
  onScoreChange,
  onLocationClick,
  onReveal,
  userClickedLocationId,
  isMobileCompact = false,
}) => {
  const [timerEnabled, setTimerEnabled] = useState(true);
  const [round, setRound] = useState<RoundType>(1);
  const [queue, setQueue] = useState<Location[]>([]);
  const [errorPool, setErrorPool] = useState<Location[]>([]);
  const [completedInRound, setCompletedInRound] = useState(0);
  const [totalInRound, setTotalInRound] = useState(0);
  const [currentTarget, setCurrentTarget] = useState<Location | null>(null);
  const currentTargetRef = useRef<Location | null>(null);
  
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);
  const [aiTip, setAiTip] = useState<string | null>(null);
  const [activeFact, setActiveFact] = useState<{ text: string, emoji: string } | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [masterStep, setMasterStep] = useState<MasterStep>('find');
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(false);
  const timeLeftRef = useRef(TIMER_SECONDS);

  const filteredPool = useMemo(() => {
    const studyAreaIds = new Set(PROVINCES.filter(p => p.isStudyArea).map(p => p.id));
    const toProvLoc = (p: typeof PROVINCES[0]) => ({
      id: p.id, name: p.name, provinceId: p.id,
      type: 'province' as const, lat: p.center[0], lng: p.center[1],
    });

    if (clusterId === 'hoofdsteden') {
      const caps = LOCATIONS.filter(l => l.isCapital && (provinceId === 'all' || l.provinceId === provinceId));
      const provs = PROVINCES.filter(p => !p.isStudyArea && (provinceId === 'all' || p.id === provinceId)).map(toProvLoc);
      return [...caps, ...provs];
    }

    if (clusterId === 'provincies-en-hoofdsteden') {
      const caps = LOCATIONS.filter(l => l.isCapital === true);
      const provs = PROVINCES.filter(p => !p.isStudyArea).map(toProvLoc);
      return [...caps, ...provs];
    }

    if (clusterId.endsWith('-countries-capitals')) {
      return LOCATIONS.filter(l =>
        l.provinceId === provinceId && (l.type === 'country' || l.isCapital === true)
      );
    }
    
    return LOCATIONS.filter(l => {
      const provMatch = provinceId === 'all' ? !studyAreaIds.has(l.provinceId) : l.provinceId === provinceId;
      const clusterMatch = clusterId === 'all' || l.clusterId === clusterId;
      return provMatch && clusterMatch;
    });
  }, [provinceId, clusterId]);

  const resetTimer = useCallback(() => {
    setTimeLeft(TIMER_SECONDS);
    timeLeftRef.current = TIMER_SECONDS;
    if (timerEnabled) setTimerActive(true);
  }, [timerEnabled]);

  const stopTimer = useCallback(() => {
    setTimerActive(false);
  }, []);

  const handleTimerToggle = useCallback(() => {
    setTimerEnabled(enabled => {
      const nextEnabled = !enabled;
      if (!nextEnabled) {
        setTimerActive(false);
      } else if (mode !== 'explore' && masterStep !== 'fact') {
        setTimeLeft(TIMER_SECONDS);
        timeLeftRef.current = TIMER_SECONDS;
        setTimerActive(true);
      }
      return nextEnabled;
    });
  }, [mode, masterStep]);

  useEffect(() => {
    if (!timerActive || mode === 'explore' || masterStep === 'fact') return;
    if (timeLeft <= 0) return;
    const id = setTimeout(() => {
      const next = timeLeftRef.current - 1;
      timeLeftRef.current = next;
      setTimeLeft(next);
      if (next <= 0) {
        setTimerActive(false);
        setFeedback({ type: 'error', text: '⏰ Tijd op! Volgende...' });
        const activeTarget = currentTargetRef.current;
        if (activeTarget && round === 1 && !errorPool.find(e => e.id === activeTarget.id)) {
          setErrorPool(prev => [...prev, activeTarget]);
        }
        setTimeout(() => {
          setQueue(q => {
            setErrorPool(ep => {
              pickNextFromQueue(q, ep, round);
              return ep;
            });
            return q;
          });
        }, 1200);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [timerActive, timeLeft, mode, masterStep, round]);

  const getBonusPoints = (secondsLeft: number): number => {
    if (!timerEnabled) return 0;
    if (secondsLeft >= 12) return 10;
    if (secondsLeft >= 8) return 5;
    if (secondsLeft >= 4) return 2;
    return 0;
  };

  const shuffle = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  const initSession = useCallback(() => {
    if (filteredPool.length === 0) return;
    const shuffled = shuffle(filteredPool);
    setRound(1);
    setQueue(shuffled);
    setTotalInRound(shuffled.length);
    setCompletedInRound(0);
    setErrorPool([]);
    
    const first = shuffled[0];
    currentTargetRef.current = first;
    setCurrentTarget(first);
    onLocationClick(first);
    
    if (onReveal) onReveal(false);

    setFeedback(null);
    setAiTip(null);
    setActiveFact(null);
    setAttempts(0);
    setShowHint(false);
    setMasterStep(mode === 'spell' ? 'spell' : 'find');
    resetTimer();
  }, [filteredPool, mode, onLocationClick, onReveal, resetTimer]);

  useEffect(() => {
    if (mode !== 'explore') {
      initSession();
    }
  }, [provinceId, clusterId, mode]);

  const pickNextFromQueue = useCallback((currentQueue: Location[], currentErrors: Location[], currentRound: RoundType) => {
    const remaining = currentQueue.slice(1);
    const nextCompleted = completedInRound + 1;
    setCompletedInRound(nextCompleted);

    if (remaining.length > 0) {
      const next = remaining[0];
      setQueue(remaining);
      currentTargetRef.current = next;
      setCurrentTarget(next);
      onLocationClick(next);
      
      if (onReveal) onReveal(false);
      setUserInput('');
      setFeedback(null);
      setAiTip(null);
      setActiveFact(null);
      setAttempts(0);
      setShowHint(false);
      setMasterStep(mode === 'spell' ? 'spell' : 'find');
      resetTimer();
    } else {
      stopTimer();
      if (currentRound === 1) {
        if (currentErrors.length > 0) {
          const shuffledErrors = shuffle(currentErrors);
          setRound(2);
          setQueue(shuffledErrors);
          setTotalInRound(shuffledErrors.length);
          setCompletedInRound(0);
          setErrorPool([]);
          const next = shuffledErrors[0];
          currentTargetRef.current = next;
          setCurrentTarget(next);
          onLocationClick(next);
          setFeedback({ type: 'warning', text: 'Ronde 2: Foutjes herhalen! 💪' });
          resetTimer();
        } else {
          startRound3();
        }
      } else if (currentRound === 2) {
        startRound3();
      } else {
        const reshuffled = shuffle(filteredPool);
        setQueue(reshuffled);
        setTotalInRound(reshuffled.length);
        setCompletedInRound(0);
        const next = reshuffled[0];
        currentTargetRef.current = next;
        setCurrentTarget(next);
        onLocationClick(next);
        resetTimer();
      }
      setUserInput('');
      setAiTip(null);
      setActiveFact(null);
      setAttempts(0);
      setShowHint(false);
      setMasterStep(mode === 'spell' ? 'spell' : 'find');
    }
  }, [completedInRound, filteredPool, mode, onLocationClick, onReveal, resetTimer, stopTimer]);

  const startRound3 = () => {
    const shuffled = shuffle(filteredPool);
    setRound(3);
    setQueue(shuffled);
    setTotalInRound(shuffled.length);
    setCompletedInRound(0);
    const next = shuffled[0];
    currentTargetRef.current = next;
    setCurrentTarget(next);
    onLocationClick(next);
    setFeedback({ type: 'success', text: 'Ronde 3: Alles door elkaar! 🌪️' });
  };

  useEffect(() => {
    const activeTarget = currentTargetRef.current;
    if (!activeTarget || !userClickedLocationId) return;

    const isCorrectClick = userClickedLocationId === activeTarget.id;
    const clickedLoc = LOCATIONS.find(l => l.id === userClickedLocationId);

    if (mode === 'find') {
      if (isCorrectClick) {
        stopTimer();
        const bonus = getBonusPoints(timeLeftRef.current);
        const total = 10 + bonus;
        const bonusText = bonus > 0 ? ` +${bonus} snelheidsbonus!` : '';
        setFeedback({ type: 'success', text: `Gevonden! 🎯${bonusText}` });
        onScoreChange(total);
        setTimeout(() => pickNextFromQueue(queue, errorPool, round), 1500);
      } else {
        setFeedback({ type: 'error', text: `Nee, dat is ${clickedLoc?.name || 'een andere plek'}.` });
        if (round === 1 && !errorPool.find(e => e.id === activeTarget.id)) {
          setErrorPool(prev => [...prev, activeTarget]);
        }
      }
    }

    if (mode === 'master' && masterStep === 'find') {
      if (isCorrectClick) {
        stopTimer();
        const bonus = getBonusPoints(timeLeftRef.current);
        onScoreChange(5 + bonus);
        setFeedback({ type: 'success', text: bonus > 0 ? `Top! +${bonus} bonus! ✍️` : 'Top! Nu spellen... ✍️' });
        if (onReveal) onReveal(true);
        setTimeout(() => {
          setMasterStep('spell');
          setFeedback(null);
          resetTimer();
          if (window.innerWidth > 768) inputRef.current?.focus();
        }, 800);
      } else {
        setFeedback({ type: 'error', text: `Klik op de stip.` });
        if (round === 1 && !errorPool.find(e => e.id === activeTarget.id)) {
          setErrorPool(prev => [...prev, activeTarget]);
        }
      }
    }
  }, [userClickedLocationId]);

  const normalizeText = (text: string) =>
    text
      .trim()
      .replace(/['’‘`]/g, "'")
      .toLocaleLowerCase('nl-NL');

  const proceedToFact = async () => {
    const activeTarget = currentTargetRef.current;
    if (!activeTarget) return;
    setLoadingContext(true);
    setMasterStep('fact');
    setFeedback(null);
    const factData = await getFunFact(activeTarget.name);
    setActiveFact(factData);
    setLoadingContext(false);
  };

  const handleSpellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeTarget = currentTargetRef.current;
    if (!activeTarget) return;

    const normalizedInput = normalizeText(userInput);
    const normalizedTarget = normalizeText(activeTarget.name);

    if (normalizedInput === normalizedTarget) {
      stopTimer();
      const bonus = getBonusPoints(timeLeftRef.current);
      const total = 10 + bonus;
      const bonusText = bonus > 0 ? ` +${bonus} bonus!` : '';
      if (mode === 'master') {
        onScoreChange(total);
        setFeedback({ type: 'success', text: `Perfect!${bonusText} ✨` });
        await proceedToFact();
      } else {
        onScoreChange(total);
        setFeedback({ type: 'success', text: `Helemaal goed!${bonusText} ✨` });
        setTimeout(() => pickNextFromQueue(queue, errorPool, round), 1500);
      }
    } else {
      setFeedback({ type: 'error', text: 'Nog niet goed...' });
      setAttempts(prev => prev + 1);
      setShowHint(true);
      if (round === 1 && !errorPool.find(e => e.id === activeTarget.id)) {
        setErrorPool(prev => [...prev, activeTarget]);
      }
      if (!aiTip) {
        setLoadingContext(true);
        const tip = await getMnemonic(activeTarget.name);
        setAiTip(tip);
        setLoadingContext(false);
      }
    }
  };

  const skipToFact = async () => {
    const activeTarget = currentTargetRef.current;
    if (!activeTarget) return;
    stopTimer();
    if (round === 1 && !errorPool.find(e => e.id === activeTarget.id)) {
      setErrorPool(prev => [...prev, activeTarget]);
    }
    setUserInput(activeTarget.name);
    setFeedback({ type: 'warning', text: `Het is: ${activeTarget.name}` });
    if (onReveal) onReveal(true);
    if (mode === 'master') {
      setTimeout(async () => { await proceedToFact(); }, 1500);
    } else {
      setTimeout(() => pickNextFromQueue(queue, errorPool, round), 1500);
    }
  };

  const requestMnemonicTip = useCallback(async () => {
    const activeTarget = currentTargetRef.current;
    if (!activeTarget) return;
    setShowHint(true);
    if (aiTip) return;
    setLoadingContext(true);
    const tip = await getMnemonic(activeTarget.name);
    setAiTip(tip);
    setLoadingContext(false);
  }, [aiTip]);

  const getVowelHint = (name: string) => {
    return name.replace(/[aeiouyAEIOUY]/g, '_');
  };

  if (mode === 'explore') {
    return (
      <div className={`bg-white/90 backdrop-blur-md rounded-[2rem] shadow-xl border-4 border-sky-50 flex items-center justify-center text-center ${isMobileCompact ? 'p-3' : 'p-8 h-full flex-col'}`}>
        <div className={`${isMobileCompact ? 'w-8 h-8 mr-3' : 'w-16 h-16 mb-4'} bg-sky-100 rounded-full flex items-center justify-center`}>
          <MapPin className={`${isMobileCompact ? 'w-4 h-4' : 'w-8 h-8'} text-sky-500`} />
        </div>
        <div>
          <h3 className={`${isMobileCompact ? 'text-xs' : 'text-xl mb-1'} font-black text-sky-900`}>Op Reis</h3>
          <p className="text-[#1F2937] font-medium text-[10px] md:text-sm">Ontdek Nederland!</p>
        </div>
      </div>
    );
  }

  const isSpellingTask = mode === 'spell' || (mode === 'master' && masterStep === 'spell');

  return (
    <div className={`bg-white/95 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-[#DDD6FE] flex flex-col overflow-hidden transition-all duration-300 ${isMobileCompact ? 'p-2 md:p-3' : 'p-6 h-full'}`}>
      
      {/* Voortgangsbalk */}
      <div className="flex items-center justify-between mb-1.5 md:mb-2 px-1 gap-2">
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[7px] md:text-[8px] font-black text-[#7C3AED] uppercase tracking-widest">
            {round === 1 ? 'Ronde 1: Alles leren' : round === 2 ? 'Ronde 2: Foutjes' : 'Ronde 3: Mixen'}
          </span>
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: Math.min(totalInRound, 15) }).map((_, i) => (
              <div
                key={i}
                className={`h-0.5 md:h-1 rounded-full transition-all ${
                  i < completedInRound ? 'bg-[#7C3AED] w-2' : i === completedInRound ? 'bg-[#F59E0B] w-3' : 'bg-[#DDD6FE] w-1'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {timerEnabled && masterStep !== 'fact' && (
            <CircularTimer timeLeft={timeLeft} total={TIMER_SECONDS} />
          )}
          <div className="flex items-center gap-1">
            <Timer className={`w-3 h-3 flex-shrink-0 ${timerEnabled ? 'text-[#F59E0B]' : 'text-[#D1D5DB]'}`} />
            <button
              onClick={handleTimerToggle}
              title={timerEnabled ? 'Timer uitschakelen' : 'Timer inschakelen'}
              className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${timerEnabled ? 'bg-[#F59E0B]' : 'bg-[#D1D5DB]'}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 ${timerEnabled ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
          <div className="bg-[#FFFFFF] px-1 py-0.5 rounded-lg">
            <span className="text-[8px] md:text-[10px] font-black text-[#1F2937]">{completedInRound + 1}/{totalInRound}</span>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={`${mode}-${masterStep}-${currentTarget?.id || 'none'}`}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 flex flex-col min-h-0"
        >
          {/* Opdracht Header */}
          <div className={`${isMobileCompact ? 'mb-1.5' : 'mb-4'}`}>
            <div className={`bg-[#FFFFFF] p-2 md:p-3 rounded-xl border border-[#DDD6FE] text-center flex flex-col justify-center`}>
               <p className="text-[7px] md:text-[8px] font-black text-[#7C3AED] uppercase mb-0.5">
                 {mode === 'spell' ? 'Spelling' : masterStep === 'find' ? 'Aanwijzen' : masterStep === 'spell' ? 'Spellen' : 'Weetje'}
               </p>
               <div className={`${isMobileCompact ? 'text-[13px] md:text-base' : 'text-lg'} font-black text-[#1F2937] leading-tight`}>
                 {isSpellingTask 
                   ? "Spel de naam van de stip!" 
                   : masterStep === 'find' 
                     ? (currentTarget?.type === 'province'
                        ? `Waar ligt de provincie ${currentTarget?.name}?`
                        : currentTarget?.type === 'country'
                          ? `Waar ligt het land ${currentTarget?.name}?`
                        : currentTarget?.provinceId === 'europe' && currentTarget?.isCapital
                          ? `Waar ligt de hoofdstad ${currentTarget?.name}?`
                        : currentTarget?.type === 'region'
                          ? `Waar ligt het gebied ${currentTarget?.name}?`
                          : `Waar ligt ${currentTarget?.name}?`)
                     : `Weetje over ${currentTarget?.name}`
                 }
                 {currentTarget && currentTarget.type === 'country' && (
                   <div className="text-[10px] md:text-xs text-green-600 font-bold mt-1 opacity-80">
                     Gebied: {PROVINCES.find(p => p.id === currentTarget.provinceId)?.name}
                   </div>
                 )}
                 {currentTarget && currentTarget.isCapital && currentTarget.type === 'city' && PROVINCES.find(p => p.id === currentTarget.provinceId)?.isStudyArea && (
                   <div className="text-[10px] md:text-xs text-green-600 font-bold mt-1 opacity-80">
                     Hoofdstad: {PROVINCES.find(p => p.id === currentTarget.provinceId)?.name}
                   </div>
                 )}
                 {currentTarget && !(currentTarget.isCapital && PROVINCES.find(p => p.id === currentTarget.provinceId)?.isStudyArea) && currentTarget.type !== 'region' && currentTarget.type !== 'province' && currentTarget.type !== 'country' && (
                   <div className="text-[10px] md:text-xs text-green-600 font-bold mt-1 opacity-80">
                     Provincie: {PROVINCES.find(p => p.id === currentTarget.provinceId)?.name}
                   </div>
                 )}
               </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {isSpellingTask && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 md:space-y-3">
                <form onSubmit={handleSpellSubmit} className="flex w-full min-w-0 gap-1.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Typen..."
                    className={`min-w-0 flex-1 p-2 md:p-3 bg-[#FFFFFF] border-2 border-[#DDD6FE] rounded-xl font-black text-[#1F2937] outline-none focus:border-[#7C3AED] text-[16px] md:text-lg`}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    inputMode="text"
                    enterKeyHint="done"
                  />
                  <button type="submit" className="w-12 md:w-14 flex-shrink-0 bg-[#3B0764] text-white font-black rounded-xl px-0 py-2 md:py-3 shadow-[0_3px_0_#3B0764] active:translate-y-0.5 active:shadow-none text-[10px] md:text-xs">OK</button>
                </form>

                {!showHint && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#DDD6FE] bg-white px-2 py-2 text-[9px] md:text-[10px] font-black uppercase text-amber-600 shadow-sm hover:border-amber-300 hover:bg-amber-50 transition-colors"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      Klinker-hulp
                    </button>
                    <button
                      type="button"
                      onClick={requestMnemonicTip}
                      className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#DDD6FE] bg-white px-2 py-2 text-[9px] md:text-[10px] font-black uppercase text-[#7C3AED] shadow-sm hover:border-[#A78BFA] hover:bg-[#F5F3FF] transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Ezelsbruggetje
                    </button>
                  </div>
                )}
                
                {/* TIP SECTIE: Wordt getoond bij attempts > 0 */}
                <AnimatePresence>
                  {showHint && currentTarget && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col gap-2"
                    >
                      {/* Vowel-less Hint */}
                      <div className="bg-[#FFFFFF] p-3 rounded-2xl border-2 border-[#DDD6FE] shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F59E0B] rounded-full flex items-center justify-center flex-none">
                          <Lightbulb className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Klinker-hulp</span>
                          <span className="text-sm md:text-base font-black text-amber-800 tracking-[0.2em] font-mono leading-none">
                            {getVowelHint(currentTarget.name)}
                          </span>
                        </div>
                      </div>

                      {/* Ezelsbruggetje Tip */}
                      {aiTip && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#FFFFFF] p-3 rounded-2xl border-2 border-[#DDD6FE] flex items-start gap-3">
                          <div className="w-8 h-8 bg-[#F59E0B] rounded-full flex items-center justify-center flex-none mt-1">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-[#7C3AED] uppercase tracking-widest">Ezelsbruggetje</span>
                            <p className="text-[10px] md:text-xs font-bold text-[#1F2937] leading-snug italic">"{aiTip}"</p>
                          </div>
                        </motion.div>
                      )}

                      {!aiTip && (
                        <button
                          type="button"
                          onClick={requestMnemonicTip}
                          className="bg-[#FFFFFF] p-3 rounded-2xl border-2 border-[#DDD6FE] flex items-center gap-3 text-left hover:border-[#A78BFA] hover:bg-[#F5F3FF] transition-colors"
                        >
                          <div className="w-8 h-8 bg-[#F59E0B] rounded-full flex items-center justify-center flex-none">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-[#7C3AED] uppercase tracking-widest">Ezelsbruggetje</span>
                            <span className="text-[10px] md:text-xs font-bold text-[#1F2937] leading-snug">
                              {loadingContext ? 'Ik maak er eentje...' : 'Toon een geheugensteuntje'}
                            </span>
                          </div>
                        </button>
                      )}

                      <button 
                        onClick={skipToFact} 
                        className="text-[9px] md:text-[10px] font-black text-amber-600 underline uppercase tracking-tighter hover:text-white mx-auto"
                      >
                        Ik geef het op, toon antwoord
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {masterStep === 'fact' && (
              <div className="space-y-1.5 md:space-y-4">
                <div className="bg-green-50 p-4 rounded-2xl border-2 border-green-200 min-h-[80px] flex items-center">
                  <p className="text-green-800 text-xs md:text-sm font-bold italic leading-relaxed text-center w-full">"{activeFact?.text}"</p>
                </div>
                <button onClick={() => pickNextFromQueue(queue, errorPool, round)} className="w-full bg-[#7C3AED] text-white font-black py-3 md:py-4 rounded-2xl shadow-[0_4px_0_#5B21B6] flex items-center justify-center gap-2 text-xs md:text-sm">VOLGENDE PLEK <ArrowRight className="w-5 h-5" /></button>
              </div>
            )}
          </div>

          {/* Algemene Feedback — compacter op mobiel */}
          {feedback && (
            <div className={`${isMobileCompact ? 'mt-1.5' : 'mt-auto pt-2'}`}>
              <motion.div
                initial={{ y: 5, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`${isMobileCompact ? 'px-2 py-1' : 'p-2'} rounded-lg md:rounded-xl flex items-center gap-1.5 border ${isMobileCompact ? '' : 'border-2'} ${feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : feedback.type === 'warning' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'}`}
              >
                {feedback.type === 'success'
                  ? <CheckCircle2 className={`${isMobileCompact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
                  : <AlertCircle  className={`${isMobileCompact ? 'w-3 h-3' : 'w-4 h-4'} flex-shrink-0`} />
                }
                <span className={`font-black ${isMobileCompact ? 'text-[10px]' : 'text-[10px] md:text-xs'}`}>{feedback.text}</span>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GameEngine;
