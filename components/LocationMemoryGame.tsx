
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Star } from 'lucide-react';
import { LOCATIONS, PROVINCES } from '../constants';
import { LOCATION_FACTS } from '../data/locationFacts';

interface MemoryCard {
  id: string;
  pairId: string;
  type: 'name' | 'fact' | 'flag';
  locationName: string;
  content: string;
  emoji: string;
}

interface FlagQuizItem {
  id: string;
  name: string;
  flag: string;
}

interface LocationMemoryGameProps {
  provinceId: string;
  onScoreChange: (points: number) => void;
}

const DIFFICULTIES = [
  { label: 'Makkelijk', pairs: 4, stars: 6 },
  { label: 'Normaal',   pairs: 6, stars: 9 },
  { label: 'Moeilijk',  pairs: 8, stars: 12 },
];

const FLAG_SCOPES = [
  { id: 'europe', label: 'Europa', description: 'Europese landen', provinceId: 'europe' },
  { id: 'africa', label: 'Afrika', description: 'Afrikaanse landen', provinceId: 'africa' },
  { id: 'asia', label: 'Azië', description: 'Aziatische landen', provinceId: 'asia' },
  { id: 'north-america', label: 'Noord-Amerika', description: 'Noord-Amerikaanse landen', provinceId: 'north-america' },
  { id: 'south-america', label: 'Zuid-Amerika', description: 'Zuid-Amerikaanse landen', provinceId: 'south-america' },
  { id: 'oceania', label: 'Oceanië', description: 'Landen in Oceanië', provinceId: 'oceania' },
  { id: 'world', label: 'Wereldwijd', description: 'Landen uit alle continenten', provinceId: 'world' },
] as const;

const COUNTRY_FLAGS: Record<string, string> = {
  Algerije: '🇩🇿', Egypte: '🇪🇬', Ethiopië: '🇪🇹', Ghana: '🇬🇭', Kenia: '🇰🇪', Marokko: '🇲🇦', Nigeria: '🇳🇬', Senegal: '🇸🇳', 'Zuid-Afrika': '🇿🇦', Tanzania: '🇹🇿',
  China: '🇨🇳', India: '🇮🇳', Indonesië: '🇮🇩', Iran: '🇮🇷', Irak: '🇮🇶', Israël: '🇮🇱', Japan: '🇯🇵', Kazachstan: '🇰🇿', 'Zuid-Korea': '🇰🇷', Pakistan: '🇵🇰', Filipijnen: '🇵🇭', Rusland: '🇷🇺', 'Saoedi-Arabië': '🇸🇦', Thailand: '🇹🇭', Vietnam: '🇻🇳',
  Canada: '🇨🇦', 'Verenigde Staten': '🇺🇸', Mexico: '🇲🇽', Guatemala: '🇬🇹', Cuba: '🇨🇺', Haïti: '🇭🇹', 'Dominicaanse Republiek': '🇩🇴', Jamaica: '🇯🇲',
  Argentinië: '🇦🇷', Bolivia: '🇧🇴', Brazilië: '🇧🇷', Chili: '🇨🇱', Colombia: '🇨🇴', Ecuador: '🇪🇨', Peru: '🇵🇪', Uruguay: '🇺🇾', Venezuela: '🇻🇪',
  Australië: '🇦🇺', Fiji: '🇫🇯', 'Nieuw-Zeeland': '🇳🇿', 'Papoea-Nieuw-Guinea': '🇵🇬', Salomonseilanden: '🇸🇧',
  Albanië: '🇦🇱', Andorra: '🇦🇩', Oostenrijk: '🇦🇹', 'Wit-Rusland': '🇧🇾', België: '🇧🇪', 'Bosnië en Herzegovina': '🇧🇦', Bulgarije: '🇧🇬', Kroatië: '🇭🇷', Cyprus: '🇨🇾', Tsjechië: '🇨🇿', Denemarken: '🇩🇰', Estland: '🇪🇪', Finland: '🇫🇮', Frankrijk: '🇫🇷', Duitsland: '🇩🇪', Griekenland: '🇬🇷', Hongarije: '🇭🇺', IJsland: '🇮🇸', Ierland: '🇮🇪', Italië: '🇮🇹', Kosovo: '🇽🇰', Letland: '🇱🇻', Liechtenstein: '🇱🇮', Litouwen: '🇱🇹', Luxemburg: '🇱🇺', Malta: '🇲🇹', Moldavië: '🇲🇩', Monaco: '🇲🇨', Montenegro: '🇲🇪', Nederland: '🇳🇱', 'Noord-Macedonië': '🇲🇰', Noorwegen: '🇳🇴', Polen: '🇵🇱', Portugal: '🇵🇹', Roemenië: '🇷🇴', 'San Marino': '🇸🇲', Servië: '🇷🇸', Slowakije: '🇸🇰', Slovenië: '🇸🇮', Spanje: '🇪🇸', Zweden: '🇸🇪', Zwitserland: '🇨🇭', Turkije: '🇹🇷', Oekraïne: '🇺🇦', 'Verenigd Koninkrijk': '🇬🇧', Vaticaanstad: '🇻🇦',
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(provinceId: string, pairCount: number): MemoryCard[] {
  const studyArea = PROVINCES.find(p => p.id === provinceId)?.isStudyArea;
  if (studyArea) return [];

  // Collect candidates: locations that belong to province (or all) and have a fact
  const candidateNames = LOCATIONS
    .filter(loc => provinceId === 'all' ? !PROVINCES.find(p => p.id === loc.provinceId)?.isStudyArea : loc.provinceId === provinceId)
    .map(loc => loc.name)
    .filter(name => !!LOCATION_FACTS[name]);

  // Deduplicate
  const unique = [...new Set(candidateNames)];
  const chosen = shuffle(unique).slice(0, Math.min(pairCount, unique.length));

  const cards: MemoryCard[] = [];
  chosen.forEach(name => {
    const fact = LOCATION_FACTS[name];
    const pairId = name;
    cards.push({
      id: `${name}-name`,
      pairId,
      type: 'name',
      locationName: name,
      content: name,
      emoji: fact.emoji,
    });
    cards.push({
      id: `${name}-fact`,
      pairId,
      type: 'fact',
      locationName: name,
      content: fact.fact,
      emoji: fact.emoji,
    });
  });

  return shuffle(cards);
}

function buildFlagCards(scopeId: string, pairCount: number): MemoryCard[] {
  const pool = getFlagItems(scopeId);

  const chosen = shuffle(pool).slice(0, Math.min(pairCount, pool.length));

  const cards: MemoryCard[] = [];
  chosen.forEach(item => {
    cards.push({
      id: `${item.id}-name`,
      pairId: item.id,
      type: 'name',
      locationName: item.name,
      content: item.name,
      emoji: '🌍',
    });
    cards.push({
      id: `${item.id}-flag`,
      pairId: item.id,
      type: 'flag',
      locationName: item.name,
      content: item.flag,
      emoji: item.flag,
    });
  });

  return shuffle(cards);
}

function getFlagItems(scopeId: string): FlagQuizItem[] {
  return LOCATIONS
    .filter(l => l.type === 'country' && l.provinceId === scopeId && COUNTRY_FLAGS[l.name])
    .map(l => ({ id: l.id, name: l.name, flag: COUNTRY_FLAGS[l.name] }));
}

function getFlagChoices(target: FlagQuizItem, pool: FlagQuizItem[]): string[] {
  const wrongAnswers = shuffle(pool.filter(item => item.id !== target.id))
    .slice(0, 3)
    .map(item => item.name);

  return shuffle([target.name, ...wrongAnswers]);
}

function starRating(moves: number, pairs: number): number {
  if (moves <= pairs + 2)   return 3;
  if (moves <= pairs * 2)   return 2;
  return 1;
}

// Card back face
const CardBack: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#3B0764] to-[#5B21B6] rounded-xl">
    <img src="/images/logo-compas-geel.svg" alt="" className="w-3/5 h-3/5 object-contain drop-shadow-lg" />
  </div>
);

// Card front face: name card
const NameCard: React.FC<{ name: string; emoji: string; matched: boolean; compact: boolean }> = ({ name, emoji, matched, compact }) => (
  <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 gap-0.5 overflow-hidden
    ${compact ? 'p-1.5' : 'p-2'}
    ${matched ? 'bg-[#7C3AED]/20 border-[#7C3AED]' : 'bg-[#FFFFFF] border-[#DDD6FE]'}`}
  >
    <span className={`${compact ? 'text-xl' : 'text-4xl'} leading-none flex-shrink-0`}>{emoji}</span>
    <span className="font-black text-center text-[#1F2937] leading-tight overflow-hidden w-full"
      style={{ fontSize: compact
        ? (name.length > 14 ? '11px' : name.length > 10 ? '13px' : '15px')
        : (name.length > 14 ? '18px' : name.length > 10 ? '22px' : '26px') }}>
      {name}
    </span>
  </div>
);

// Card front face: fact card
const FactCard: React.FC<{ fact: string; matched: boolean; compact: boolean }> = ({ fact, matched, compact }) => (
  <div className={`absolute inset-0 flex items-start justify-center rounded-xl border-2 overflow-hidden
    ${compact ? 'p-1.5' : 'p-2'}
    ${matched ? 'bg-[#7C3AED]/20 border-[#7C3AED]' : 'bg-[#FFFFFF] border-[#DDD6FE]'}`}
  >
    <p
      className="font-bold text-[#1F2937] text-center leading-snug overflow-hidden"
      style={{ fontSize: compact
        ? (fact.length > 100 ? '9px' : fact.length > 70 ? '10px' : '12px')
        : (fact.length > 100 ? '13px' : fact.length > 70 ? '15px' : '18px') }}
    >
      {fact}
    </p>
  </div>
);

const FlagCard: React.FC<{ flag: string; matched: boolean; compact: boolean }> = ({ flag, matched, compact }) => (
  <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 overflow-hidden
    ${compact ? 'p-1.5' : 'p-2'}
    ${matched ? 'bg-[#7C3AED]/20 border-[#7C3AED]' : 'bg-[#FFFFFF] border-[#DDD6FE]'}`}
  >
    <span className={`${compact ? 'text-4xl' : 'text-7xl'} leading-none`}>{flag}</span>
    <span className="mt-2 text-[9px] md:text-xs font-black uppercase tracking-widest text-[#6D28D9]">
      Vlag
    </span>
  </div>
);

const FlipCard: React.FC<{
  card: MemoryCard;
  isFlipped: boolean;
  isMatched: boolean;
  onClick: () => void;
  disabled: boolean;
  compact: boolean;
}> = ({ card, isFlipped, isMatched, onClick, disabled, compact }) => {
  const visible = isFlipped || isMatched;

  return (
    <motion.div
      className="relative cursor-pointer select-none w-full h-full"
      style={{ perspective: 600 }}
      onClick={!disabled && !isMatched ? onClick : undefined}
      whileHover={!disabled && !isMatched ? { scale: 1.04 } : {}}
      whileTap={!disabled && !isMatched ? { scale: 0.97 } : {}}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: visible ? 180 : 0 }}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        {/* Back */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardBack />
        </div>

        {/* Front */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {card.type === 'name'
            ? <NameCard name={card.content} emoji={card.emoji} matched={isMatched} compact={compact} />
            : card.type === 'flag'
              ? <FlagCard flag={card.content} matched={isMatched} compact={compact} />
              : <FactCard fact={card.content} matched={isMatched} compact={compact} />
          }
        </div>
      </motion.div>
    </motion.div>
  );
};

type Phase = 'difficulty' | 'playing' | 'win';
type MemoryMode = 'facts' | 'flags' | 'flagQuiz';

const LocationMemoryGame: React.FC<LocationMemoryGameProps> = ({ provinceId, onScoreChange }) => {
  const [phase, setPhase] = useState<Phase>('difficulty');
  const isWorldOrContinent = PROVINCES.find(p => p.id === provinceId)?.isStudyArea && provinceId !== 'water-nl';
  const [memoryMode, setMemoryMode] = useState<MemoryMode>(isWorldOrContinent ? 'flagQuiz' : 'facts');
  const [flagScope, setFlagScope] = useState<string>(FLAG_SCOPES.some(scope => scope.id === provinceId) ? provinceId : 'europe');
  const [difficultyIdx, setDifficultyIdx] = useState(0);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [checking, setChecking] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [quizItems, setQuizItems] = useState<FlagQuizItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoices, setQuizChoices] = useState<string[]>([]);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const nextIsWorldOrContinent = PROVINCES.find(p => p.id === provinceId)?.isStudyArea && provinceId !== 'water-nl';
    if (nextIsWorldOrContinent) {
      setMemoryMode('flagQuiz');
      setFlagScope(FLAG_SCOPES.some(scope => scope.id === provinceId) ? provinceId : 'world');
    }
  }, [provinceId]);

  const difficulty = DIFFICULTIES[difficultyIdx];
  const totalPairs = cards.length / 2 || difficulty.pairs;

  const provinceName = provinceId === 'all'
    ? 'heel Nederland'
    : PROVINCES.find(p => p.id === provinceId)?.name ?? 'Nederland';

  const startGame = useCallback((dIdx: number) => {
    const d = DIFFICULTIES[dIdx];
    setDifficultyIdx(dIdx);
    setCards(memoryMode === 'flags'
      ? buildFlagCards(flagScope, d.pairs)
      : buildCards(provinceId, d.pairs)
    );
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setChecking(false);
    setPhase('playing');
  }, [flagScope, memoryMode, provinceId]);

  const startFlagQuiz = useCallback(() => {
    const items = shuffle(getFlagItems(flagScope));
    const first = items[0];

    setCards([]);
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setChecking(false);
    setQuizItems(items);
    setQuizIndex(0);
    setQuizSelected(null);
    setQuizCorrect(0);
    setQuizChoices(first ? getFlagChoices(first, items) : []);
    setPhase('playing');
  }, [flagScope]);

  const handleQuizAnswer = useCallback((answer: string) => {
    if (quizSelected) return;

    const current = quizItems[quizIndex];
    setQuizSelected(answer);

    if (answer === current.name) {
      setQuizCorrect(score => score + 1);
      onScoreChange(5);
    }
  }, [onScoreChange, quizIndex, quizItems, quizSelected]);

  const nextQuizQuestion = useCallback(() => {
    const nextIndex = quizIndex + 1;
    if (nextIndex >= quizItems.length) {
      setPhase('win');
      return;
    }

    setQuizIndex(nextIndex);
    setQuizSelected(null);
    setQuizChoices(getFlagChoices(quizItems[nextIndex], quizItems));
  }, [quizIndex, quizItems]);

  // Check for match when 2 cards flipped
  useEffect(() => {
    if (flipped.length !== 2) return;
    setChecking(true);
    const [a, b] = flipped.map(id => cards.find(c => c.id === id)!);

    if (a.pairId === b.pairId && a.type !== b.type) {
      // Match!
      setTimeout(() => {
        setMatched(prev => {
          const next = new Set(prev);
          next.add(a.pairId);
          return next;
        });
        setFlipped([]);
        setChecking(false);
        onScoreChange(10);
      }, 600);
    } else {
      // No match
      setTimeout(() => {
        setFlipped([]);
        setChecking(false);
      }, 1100);
    }

    setMoves(m => m + 1);
  }, [flipped]);

  // Win detection
  useEffect(() => {
    if (phase === 'playing' && matched.size > 0 && matched.size === totalPairs) {
      setTimeout(() => setPhase('win'), 400);
    }
  }, [matched, phase, totalPairs]);

  const handleCardClick = useCallback((cardId: string) => {
    if (checking || flipped.includes(cardId)) return;
    if (flipped.length < 2) {
      setFlipped(prev => [...prev, cardId]);
    }
  }, [checking, flipped]);

  const stars = starRating(moves, totalPairs);

  // Difficulty selection screen
  if (phase === 'difficulty') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🃏</div>
          <h2 className="text-2xl font-black text-[#6D28D9]">Topo Memory</h2>
          <p className="text-sm text-[#8B5CF6] font-medium mt-1">
            Kies een memory-spel en moeilijkheid
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 w-full max-w-md">
          {[
            { id: 'facts' as MemoryMode, label: 'Weetjes', sub: provinceName },
            { id: 'flags' as MemoryMode, label: 'Vlaggen Memory', sub: 'Korte setjes' },
            { id: 'flagQuiz' as MemoryMode, label: 'Vlaggen Quiz', sub: 'Alle vlaggen' },
          ].filter(option => !(isWorldOrContinent && option.id === 'facts')).map(option => (
            <button
              key={option.id}
              onClick={() => setMemoryMode(option.id)}
              className={`rounded-xl border-2 px-3 py-3 text-left transition-colors ${memoryMode === option.id ? 'bg-[#7C3AED] border-[#7C3AED] text-white' : 'bg-white border-[#DDD6FE] text-[#4C1D95]'}`}
            >
              <div className="font-black text-sm">{option.label}</div>
              <div className="text-[10px] font-bold opacity-75">{option.sub}</div>
            </button>
          ))}
        </div>

        {(memoryMode === 'flags' || memoryMode === 'flagQuiz') && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-2xl">
            {FLAG_SCOPES.map(scope => (
              <button
                key={scope.id}
                onClick={() => setFlagScope(scope.id)}
                className={`rounded-xl border-2 px-3 py-2 text-left transition-colors ${flagScope === scope.id ? 'bg-[#F59E0B] border-[#F59E0B] text-white' : 'bg-white border-[#DDD6FE] text-[#4C1D95]'}`}
              >
                <div className="font-black text-xs">{scope.label}</div>
                <div className="text-[9px] font-bold opacity-75">{scope.description}</div>
              </button>
            ))}
          </div>
        )}

        {memoryMode === 'flagQuiz' ? (
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={startFlagQuiz}
              disabled={getFlagItems(flagScope).length === 0}
              className="py-4 px-6 rounded-2xl font-black text-lg shadow-lg border-4 transition-all bg-[#7C3AED] border-[#DDD6FE] text-white shadow-[0_6px_0_#C4B5FD] disabled:opacity-50"
            >
              Start alle vlaggen
              <span className="text-sm font-semibold ml-2 opacity-80">
                ({getFlagItems(flagScope).length} vragen)
              </span>
            </motion.button>
            <p className="text-xs text-center font-bold text-[#6B7280]">
              De quiz toont elke vlag één voor één. Zo leert een kind de volledige set zonder een onoverzichtelijk kaartveld.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {DIFFICULTIES.map((d, i) => (
              <motion.button
                key={d.label}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => startGame(i)}
                className={`py-4 px-6 rounded-2xl font-black text-lg shadow-lg border-4 transition-all
                  ${i === 0 ? 'bg-[#F5F3FF] border-[#EDE9FE] text-[#4C1D95] shadow-[0_6px_0_#DDD6FE]'
                  : i === 1 ? 'bg-[#F5F3FF] border-[#DDD6FE] text-[#4C1D95] shadow-[0_6px_0_#C4B5FD]'
                             : 'bg-[#F5F3FF] border-[#DDD6FE] text-[#6D28D9] shadow-[0_6px_0_#A78BFA]'}`}
              >
                {d.label}
                <span className="text-sm font-semibold ml-2 opacity-70">({d.pairs} setjes)</span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Win screen
  if (phase === 'win') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full p-6 gap-5 text-center"
      >
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-black text-[#6D28D9]">Geweldig!</h2>

        {memoryMode !== 'flagQuiz' && (
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <motion.div
                key={s}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: s * 0.2, type: 'spring', damping: 12 }}
              >
                <Star
                  className={`w-10 h-10 ${s <= stars ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`}
                />
              </motion.div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl px-8 py-4 shadow-md border-2 border-pink-100">
          <div className="text-4xl font-black text-[#6D28D9]">
            {memoryMode === 'flagQuiz' ? `${quizCorrect}/${quizItems.length}` : moves}
          </div>
          <div className="text-xs font-bold text-pink-400 uppercase tracking-widest">
            {memoryMode === 'flagQuiz' ? 'goed' : 'beurten'}
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => memoryMode === 'flagQuiz' ? startFlagQuiz() : startGame(difficultyIdx)}
            className="flex items-center justify-center gap-2 bg-[#7C3AED] text-white font-black py-3 px-6 rounded-xl shadow-[0_4px_0_#DDD6FE]"
          >
            <RotateCcw className="w-4 h-4" />
            {memoryMode === 'flagQuiz' ? 'Nog een quiz' : 'Nog een keer'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setPhase('difficulty')}
            className="bg-white text-[#6D28D9] font-black py-3 px-6 rounded-xl border-2 border-pink-100"
          >
            Andere moeilijkheid
          </motion.button>
        </div>
      </motion.div>
    );
  }

  if (memoryMode === 'flagQuiz') {
    const current = quizItems[quizIndex];
    const isCorrect = quizSelected === current?.name;

    return (
      <div className="flex flex-col h-full p-4 md:p-6 gap-4">
        <div className="flex items-center justify-between flex-shrink-0">
          <div>
            <div className="font-black text-[#6D28D9] text-sm">Vlaggen Quiz</div>
            <div className="text-[10px] text-[#6B7280]">{FLAG_SCOPES.find(s => s.id === flagScope)?.label}</div>
          </div>
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-sm border border-pink-100 text-center">
            <div className="text-base font-black text-[#6D28D9] leading-none">{quizIndex + 1}/{quizItems.length}</div>
            <div className="text-[8px] text-pink-400 font-bold uppercase">vraag</div>
          </div>
        </div>

        <div className="h-2 rounded-full bg-[#EDE9FE] overflow-hidden">
          <motion.div
            className="h-full bg-[#7C3AED]"
            initial={{ width: 0 }}
            animate={{ width: `${quizItems.length ? ((quizIndex + (quizSelected ? 1 : 0)) / quizItems.length) * 100 : 0}%` }}
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col items-center justify-center gap-5">
          <motion.div
            key={current?.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white rounded-2xl border-2 border-[#DDD6FE] shadow-md px-6 py-8 text-center"
          >
            <div className="text-[96px] md:text-[132px] leading-none">{current?.flag}</div>
            <div className="mt-4 text-xs font-black uppercase tracking-widest text-[#6D28D9]">Welk land hoort hierbij?</div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
            {quizChoices.map(choice => {
              const selected = quizSelected === choice;
              const correctChoice = quizSelected && choice === current?.name;
              const wrongChoice = selected && choice !== current?.name;

              return (
                <button
                  key={choice}
                  onClick={() => handleQuizAnswer(choice)}
                  disabled={!!quizSelected}
                  className={`rounded-xl border-2 px-4 py-3 text-left font-black transition-colors
                    ${correctChoice ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                    : wrongChoice ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-white border-[#DDD6FE] text-[#4C1D95] hover:bg-[#F5F3FF]'}`}
                >
                  {choice}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {quizSelected && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="w-full max-w-xl flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl border border-[#DDD6FE] px-4 py-3 shadow-sm"
              >
                <div className={`font-black text-sm ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {isCorrect ? 'Goed gevonden.' : `Bijna. Dit is ${current?.name}.`}
                </div>
                <button
                  onClick={nextQuizQuestion}
                  className="w-full sm:w-auto bg-[#7C3AED] text-white font-black py-2.5 px-5 rounded-xl"
                >
                  {quizIndex + 1 >= quizItems.length ? 'Bekijk score' : 'Volgende'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Game board — always fits in view without scrolling
  const totalCards = cards.length;
  const cols = isMobile
    ? (difficulty.pairs <= 4 ? 2 : difficulty.pairs <= 6 ? 3 : 4)
    : 4;
  const rows = Math.ceil(totalCards / cols);
  const compact = isMobile;

  return (
    <div className="flex flex-col h-full p-3 md:p-4 gap-2">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🃏</span>
          <div>
            <div className="font-black text-[#6D28D9] text-sm">{memoryMode === 'flags' ? 'Vlaggen Memory' : 'Weetjes Memory'}</div>
            <div className="text-[10px] text-[#6B7280]">{memoryMode === 'flags' ? FLAG_SCOPES.find(s => s.id === flagScope)?.label : provinceName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white rounded-xl px-2.5 py-1 shadow-sm border border-pink-100 text-center">
            <div className="text-base font-black text-[#6D28D9] leading-none">{matched.size}/{totalPairs}</div>
            <div className="text-[8px] text-pink-400 font-bold uppercase">gevonden</div>
          </div>
          <div className="bg-white rounded-xl px-2.5 py-1 shadow-sm border border-pink-100 text-center">
            <div className="text-base font-black text-[#6D28D9] leading-none">{moves}</div>
            <div className="text-[8px] text-pink-400 font-bold uppercase">beurten</div>
          </div>
          <button
            onClick={() => startGame(difficultyIdx)}
            className="p-1.5 bg-pink-50 text-pink-400 rounded-xl hover:bg-pink-100 transition-colors"
            title="Opnieuw"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-2 flex-shrink-0">
        <div className="flex items-center gap-1 bg-[#FFFBEB] rounded-lg px-2 py-0.5 border border-[#FDE68A]">
          <div className="w-2.5 h-2.5 rounded bg-[#FDE68A]" />
          <span className="text-[9px] font-bold text-[#92400E]">{memoryMode === 'flags' ? 'Land / Provincie' : 'Plaatsnaam'}</span>
        </div>
        <div className="flex items-center gap-1 bg-[#F5F3FF] rounded-lg px-2 py-0.5 border border-[#DDD6FE]">
          <div className="w-2.5 h-2.5 rounded bg-[#DDD6FE]" />
          <span className="text-[9px] font-bold text-[#6D28D9]">{memoryMode === 'flags' ? 'Vlag' : 'Weetje'}</span>
        </div>
      </div>

      {/* Card grid — fills remaining height, no scroll */}
      <div
        className="flex-1 min-h-0 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gap: compact ? '4px' : '8px',
        }}
      >
        {cards.map(card => (
          <FlipCard
            key={card.id}
            card={card}
            isFlipped={flipped.includes(card.id)}
            isMatched={matched.has(card.pairId)}
            onClick={() => handleCardClick(card.id)}
            disabled={checking || matched.has(card.pairId)}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
};

export default LocationMemoryGame;
