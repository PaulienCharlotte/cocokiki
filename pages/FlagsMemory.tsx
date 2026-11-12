import React, { useCallback, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { IconButton } from '../design-system';
import CardGrid from '../components/ui/CardGrid';
import LocationMemoryGame from '../components/LocationMemoryGame';
import { FLAG_CONTINENTS, FLAG_MEMORY_PAIRS, continentFlagPairs, nextFlagRound, type FlagContinent } from '../data/flagCatalog';
import type { MemoryPair } from '../data/learning';
import { PROGRESS_KEY, readProgress, recordAnswer, writeLocal } from '../services/localProgress';
import { awardCurrencyOnce } from '../services/currency';
import { analytics } from '../services/analytics';

export { FLAG_MEMORY_PAIRS } from '../data/flagCatalog';

export default function FlagsMemory({ onBack }: { onBack: () => void }) {
  const [continent, setContinent] = useState<FlagContinent | null>(null);
  const [pairs, setPairs] = useState<MemoryPair[]>([]);
  const [round, setRound] = useState(0);
  const [roundId, setRoundId] = useState(() => crypto.randomUUID());
  const answer = useCallback((id: string, correct: boolean, points: number) => {
    writeLocal(PROGRESS_KEY, recordAnswer(readProgress(), id, correct));
    awardCurrencyOnce(`flags-memory:${roundId}:${id}`, points);
  }, [roundId]);
  const start = (next: MemoryPair[]) => {
    analytics().start('flags-memory', true);
    setPairs(next); setRound(value => value + 1); setRoundId(crypto.randomUUID());
  };
  const choose = (id: FlagContinent) => { setContinent(id); start(nextFlagRound(id, readProgress())); };
  if (!continent) return <main className="dream-flags-memory" aria-label="Vlaggenmemory">
    <section className="flag-continents" aria-labelledby="flag-continents-title">
      <h1 id="flag-continents-title">Vlaggenmemory</h1>
      {/* Hetzelfde keuzeraster als het rekenmenu; zie components/ui/CardGrid. */}
      <CardGrid
        label="Kies een werelddeel"
        cards={FLAG_CONTINENTS.map(item => ({
          id: item.id,
          titel: item.label,
          // Drie vlaggen uit dat werelddeel in plaats van overal dezelfde
          // wereldbol: zo zie je meteen waar je naartoe gaat.
          icoon: <span className="flag-continents__vlaggen" aria-hidden="true">{continentFlagPairs(item.id).slice(0, 3).map(pair => <i key={pair.id}>{pair.right}</i>)}</span>,
          meta: `${continentFlagPairs(item.id).length} vlaggen`,
        }))}
        onChoose={id => choose(id as FlagContinent)}
      />
    </section>
  </main>;
  return <main className="dream-flags-memory" aria-label="Vlaggenmemory">
    <div className="flag-continents__toolbar"><IconButton label="Terug naar de werelddelen" icon={<ArrowLeft size={19} />} onClick={() => setContinent(null)} /><strong>{FLAG_CONTINENTS.find(item => item.id === continent)?.label}</strong><span>{continentFlagPairs(continent).length} vlaggen</span></div>
    <React.Fragment key={round}><LocationMemoryGame analyticsId="flags-memory" mode="memory" pairs={pairs} choicePool={FLAG_MEMORY_PAIRS} onAnswer={answer}
      onContinue={() => start(nextFlagRound(continent, readProgress()))}
      onRepeat={() => start(pairs)} onRetry={ids => start(pairs.filter(pair => ids.includes(pair.id)))} onExit={() => setContinent(null)} /></React.Fragment>
  </main>;
}
