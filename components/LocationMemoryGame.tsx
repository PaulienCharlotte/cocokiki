
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Star, Trophy } from 'lucide-react';
import { LOCATIONS, PROVINCES } from '../constants';
import { LOCATION_FACTS } from '../data/locationFacts';

interface MemoryCard {
  id: string;
  pairId: string;
  type: 'name' | 'fact';
  locationName: string;
  content: string;
  emoji: string;
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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(provinceId: string, pairCount: number): MemoryCard[] {
  // Collect candidates: locations that belong to province (or all) and have a fact
  const candidateNames = LOCATIONS
    .filter(loc => provinceId === 'all' || loc.provinceId === provinceId)
    .map(loc => loc.name)
    .filter(name => !!LOCATION_FACTS[name]);

  // Deduplicate
  const unique = [...new Set(candidateNames)];

  // If not enough candidates, fall back to all locations with facts
  const pool = unique.length >= pairCount
    ? unique
    : [...new Set(LOCATIONS.map(l => l.name).filter(n => !!LOCATION_FACTS[n]))];

  const chosen = shuffle(pool).slice(0, pairCount);

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

function starRating(moves: number, pairs: number): number {
  if (moves <= pairs + 2)   return 3;
  if (moves <= pairs * 2)   return 2;
  return 1;
}

// Card back face
const CardBack: React.FC = () => (
  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#3B0764] to-[#5B21B6] rounded-xl">
    <img src="/images/logo-compas.svg" alt="" className="w-10 h-10 object-contain opacity-80" />
    <span className="text-[#DDD6FE] font-black text-[9px] mt-1 tracking-widest opacity-70">COCOKIKI</span>
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
            : <FactCard fact={card.content} matched={isMatched} compact={compact} />
          }
        </div>
      </motion.div>
    </motion.div>
  );
};

type Phase = 'difficulty' | 'playing' | 'win';

const LocationMemoryGame: React.FC<LocationMemoryGameProps> = ({ provinceId, onScoreChange }) => {
  const [phase, setPhase] = useState<Phase>('difficulty');
  const [difficultyIdx, setDifficultyIdx] = useState(0);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
  const [checking, setChecking] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const difficulty = DIFFICULTIES[difficultyIdx];

  const provinceName = provinceId === 'all'
    ? 'heel Nederland'
    : PROVINCES.find(p => p.id === provinceId)?.name ?? 'Nederland';

  const startGame = useCallback((dIdx: number) => {
    const d = DIFFICULTIES[dIdx];
    setDifficultyIdx(dIdx);
    setCards(buildCards(provinceId, d.pairs));
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setChecking(false);
    setPhase('playing');
  }, [provinceId]);

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
    if (phase === 'playing' && matched.size > 0 && matched.size === difficulty.pairs) {
      setTimeout(() => setPhase('win'), 400);
    }
  }, [matched, phase, difficulty.pairs]);

  const handleCardClick = useCallback((cardId: string) => {
    if (checking || flipped.includes(cardId)) return;
    if (flipped.length < 2) {
      setFlipped(prev => [...prev, cardId]);
    }
  }, [checking, flipped]);

  const stars = starRating(moves, difficulty.pairs);

  // Difficulty selection screen
  if (phase === 'difficulty') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 gap-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🃏</div>
          <h2 className="text-2xl font-black text-[#6D28D9]">Weetjes Memory</h2>
          <p className="text-sm text-[#8B5CF6] font-medium mt-1">
            Match de plaatsnaam met het weetje — {provinceName}
          </p>
        </div>

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

        {/* Stars */}
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

        <div className="bg-white rounded-2xl px-8 py-4 shadow-md border-2 border-pink-100">
          <div className="text-4xl font-black text-[#6D28D9]">{moves}</div>
          <div className="text-xs font-bold text-pink-400 uppercase tracking-widest">beurten</div>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => startGame(difficultyIdx)}
            className="flex items-center justify-center gap-2 bg-[#7C3AED] text-white font-black py-3 px-6 rounded-xl shadow-[0_4px_0_#DDD6FE]"
          >
            <RotateCcw className="w-4 h-4" />
            Nog een keer
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

  // Game board — always fits in view without scrolling
  const totalCards = difficulty.pairs * 2;
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
            <div className="font-black text-[#6D28D9] text-sm">Weetjes Memory</div>
            <div className="text-[10px] text-[#6B7280]">{provinceName}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white rounded-xl px-2.5 py-1 shadow-sm border border-pink-100 text-center">
            <div className="text-base font-black text-[#6D28D9] leading-none">{matched.size}/{difficulty.pairs}</div>
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
          <span className="text-[9px] font-bold text-[#92400E]">Plaatsnaam</span>
        </div>
        <div className="flex items-center gap-1 bg-[#F5F3FF] rounded-lg px-2 py-0.5 border border-[#DDD6FE]">
          <div className="w-2.5 h-2.5 rounded bg-[#DDD6FE]" />
          <span className="text-[9px] font-bold text-[#6D28D9]">Weetje</span>
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
