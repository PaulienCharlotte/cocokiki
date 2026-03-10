import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Location, GameMode } from '../types';
import { LOCATIONS } from '../constants';
import { getMnemonic, getFunFact } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Lightbulb, MapPin, Type as TypeIcon, Sparkles, Search, AlertCircle, Wand2, ArrowRight, Eye, ArrowLeft, RefreshCcw, LayoutList, BookOpen } from 'lucide-react';

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
  isMobileCompact = false
}) => {
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

  const filteredPool = useMemo(() => {
    return LOCATIONS.filter(l => {
      const provMatch = provinceId === 'all' || l.provinceId === provinceId;
      const clusterMatch = clusterId === 'all' || l.clusterId === clusterId;
      return provMatch && clusterMatch;
    });
  }, [provinceId, clusterId]);

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
  }, [filteredPool, mode, onLocationClick, onReveal]);

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
    } else {
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
      }
      setUserInput('');
      setAiTip(null);
      setActiveFact(null);
      setAttempts(0);
      setShowHint(false);
      setMasterStep(mode === 'spell' ? 'spell' : 'find');
    }
  }, [completedInRound, filteredPool, mode, onLocationClick, onReveal]);

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
        setFeedback({ type: 'success', text: 'Gevonden! 🎯' });
        onScoreChange(10);
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
        setFeedback({ type: 'success', text: 'Top! Nu spellen... ✍️' });
        onScoreChange(5);
        if (onReveal) onReveal(true);
        setTimeout(() => {
          setMasterStep('spell');
          setFeedback(null);
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

  const normalizeText = (text: string) => text.trim().replace(/['’‘`]/g, "'");

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
      onScoreChange(10);
      if (mode === 'master') {
        setFeedback({ type: 'success', text: `Perfect! ✨` });
        await proceedToFact();
      } else {
        setFeedback({ type: 'success', text: `Helemaal goed! ✨` });
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
          <p className="text-[#5D4E60] font-medium text-[10px] md:text-sm">Ontdek Nederland!</p>
        </div>
      </div>
    );
  }

  const isSpellingTask = mode === 'spell' || (mode === 'master' && masterStep === 'spell');

  return (
    <div className={`bg-white/95 backdrop-blur-md rounded-[1.5rem] md:rounded-[2rem] shadow-xl border-4 border-pink-50 flex flex-col overflow-hidden transition-all duration-300 ${isMobileCompact ? 'p-2 md:p-3' : 'p-6 h-full'}`}>
      
      {/* Voortgangsbalk */}
      <div className="flex items-center justify-between mb-1.5 md:mb-2 px-1">
        <div className="flex flex-col">
          <span className="text-[7px] md:text-[8px] font-black text-pink-400 uppercase tracking-widest">
            {round === 1 ? 'Ronde 1: Alles leren' : round === 2 ? 'Ronde 2: Foutjes' : 'Ronde 3: Mixen'}
          </span>
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: Math.min(totalInRound, 15) }).map((_, i) => (
              <div 
                key={i} 
                className={`h-0.5 md:h-1 rounded-full transition-all ${
                  i < completedInRound ? 'bg-green-400 w-2' : i === completedInRound ? 'bg-pink-400 w-3' : 'bg-pink-100 w-1'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="bg-pink-50 px-1 py-0.5 rounded-lg">
          <span className="text-[8px] md:text-[10px] font-black text-[#5D4E60]">{completedInRound + 1}/{totalInRound}</span>
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
            <div className={`bg-[#FFF8FA]/50 p-2 md:p-3 rounded-xl border-2 border-pink-100 text-center flex flex-col justify-center`}>
               <p className="text-[7px] md:text-[8px] font-black text-[#FF8C94] uppercase mb-0.5">
                 {mode === 'spell' ? 'Spelling' : masterStep === 'find' ? 'Aanwijzen' : masterStep === 'spell' ? 'Spellen' : 'Weetje'}
               </p>
               <div className={`${isMobileCompact ? 'text-[13px] md:text-base' : 'text-lg'} font-black text-[#5D4E60] leading-tight`}>
                 {isSpellingTask 
                   ? "Spel de naam van de stip!" 
                   : masterStep === 'find' 
                     ? `Waar ligt ${currentTarget?.name}?` 
                     : `Weetje over ${currentTarget?.name}`
                 }
               </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            {isSpellingTask && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5 md:space-y-3">
                <form onSubmit={handleSpellSubmit} className="flex gap-1.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Typen..."
                    className={`flex-1 p-2 md:p-3 bg-white border-2 border-purple-50 rounded-xl font-black text-[#5D4E60] outline-none focus:border-purple-300 text-[16px] md:text-lg`}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    inputMode="text"
                    enterKeyHint="done"
                  />
                  <button type="submit" className="bg-purple-400 text-white font-black rounded-xl px-3 md:px-5 py-2 md:py-3 shadow-[0_3px_0_#9368B7] active:translate-y-0.5 active:shadow-none text-[10px] md:text-xs flex-none">CHECK</button>
                </form>
                
                {/* TIP SECTIE: Wordt getoond bij attempts > 0 */}
                <AnimatePresence>
                  {showHint && currentTarget && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }} 
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col gap-2"
                    >
                      {/* Vowel-less Hint */}
                      <div className="bg-amber-50 p-3 rounded-2xl border-2 border-amber-100 shadow-sm flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center flex-none">
                          <Lightbulb className="w-5 h-5 text-amber-700" />
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
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-purple-50 p-3 rounded-2xl border-2 border-purple-100 flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center flex-none mt-1">
                            <Sparkles className="w-4 h-4 text-purple-700" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest">Ezelsbruggetje</span>
                            <p className="text-[10px] md:text-xs font-bold text-purple-900 leading-snug italic">"{aiTip}"</p>
                          </div>
                        </motion.div>
                      )}

                      <button 
                        onClick={skipToFact} 
                        className="text-[9px] md:text-[10px] font-black text-amber-600 underline uppercase tracking-tighter hover:text-amber-700 mx-auto"
                      >
                        Ik geef het op, toon antwoord
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showHint && (
                   <button 
                    onClick={() => { setShowHint(true); if(!aiTip) getMnemonic(currentTarget?.name || '').then(setAiTip); }}
                    className="flex items-center gap-2 mx-auto text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors"
                   >
                     <Lightbulb className="w-4 h-4" /> Tip nodig?
                   </button>
                )}
              </motion.div>
            )}

            {masterStep === 'fact' && (
              <div className="space-y-1.5 md:space-y-4">
                <div className="bg-orange-50 p-4 rounded-2xl border-2 border-orange-100 min-h-[80px] flex items-center">
                  <p className="text-orange-900 text-xs md:text-sm font-bold italic leading-relaxed text-center w-full">"{activeFact?.text}"</p>
                </div>
                <button onClick={() => pickNextFromQueue(queue, errorPool, round)} className="w-full bg-orange-400 text-white font-black py-3 md:py-4 rounded-2xl shadow-[0_4px_0_#D18C61] flex items-center justify-center gap-2 text-xs md:text-sm">VOLGENDE PLEK <ArrowRight className="w-5 h-5" /></button>
              </div>
            )}
          </div>

          {/* Algemene Feedback */}
          {feedback && (
            <div className="mt-auto pt-2">
              <motion.div initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`p-2 rounded-xl flex items-center gap-2 border-2 ${feedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : feedback.type === 'warning' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span className="font-black text-[10px] md:text-xs">{feedback.text}</span>
              </motion.div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default GameEngine;